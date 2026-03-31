import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { Observable } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { AxiosResponse, AxiosError } from 'axios';
import { BaseProvider } from './base.provider';
import { JSearchResponse, MappedJobData } from '../interfaces/rapid-job.interface';

@Injectable()
export class JSearchProvider extends BaseProvider {
  private readonly url = 'https://jsearch.p.rapidapi.com/search';

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    super(JSearchProvider.name);
  }

  fetchJobs(params: { query: string }): Observable<JSearchResponse> {
    const apiKey = this.configService.get<string>('RAPIDAPI_KEY');
    const apiHost = this.configService.get<string>('JSEARCH_API_HOST') || 'jsearch.p.rapidapi.com';

    const queryParams = {
      query: params.query,
      page: String(1),
      num_pages: '1',
      country: 'vn',
      date_posted: 'today',
    };

    this.logger.debug(`[JSearch] Đang tải dữ liệu với tham số: ${JSON.stringify(queryParams)}`);

    return this.httpService
      .get<JSearchResponse>(this.url, {
        params: queryParams,
        headers: {
          'X-RapidAPI-Key': apiKey,
          'X-RapidAPI-Host': apiHost,
        },
      })
      .pipe(
        map((response: AxiosResponse<JSearchResponse>) => response.data),
        catchError((error: AxiosError) => this.handleError(error, 'JSearch')),
      );
  }

  extractUrlAndDesc(apiData: any): { originalUrl: string, rawDescription: string } {
    return {
      originalUrl: apiData.job_apply_link || apiData.job_google_link || '',
      rawDescription: apiData.job_description || ''
    };
  }

  /**
   * Hybrid async mapper:
   *  - Direct mapping for clear fields (title, url, jobType, location, company…)
   *  - Priority: API Structured Data (highlights/arrays) > Gemini LLM > Defaults
   *  - LLM fields are passed externally via `llm` param
   */
  async mapToJobData(apiData: any, llm: any = null): Promise<MappedJobData> {
    const title = apiData.job_title ?? 'Untitled';
    const highlights = apiData.job_highlights || {};
    const { originalUrl, rawDescription } = this.extractUrlAndDesc(apiData);

    // ── 2. Description ───────────────────────────────────────────────────────
    let fullDescription = rawDescription || llm?.description || 'Không có mô tả chi tiết.';

    // ── 3. Requirements ──────────────────────────────────────────────────────
    let requirements: string | null = (highlights.Qualifications as string[] | undefined)
      ?.map((q) => `• ${q}`).join('\n') || null;

    // Priority: API Array > LLM
    if (!requirements) requirements = llm?.requirements ?? null;

    // ── 4. Benefits ──────────────────────────────────────────────────────────
    const formatBenefit = (b: string) => {
      const f = b.replace(/_/g, ' ');
      return f.charAt(0).toUpperCase() + f.slice(1);
    };
    const benefitsList = new Set<string>();
    if (Array.isArray(highlights.Benefits)) highlights.Benefits.forEach((b: string) => benefitsList.add(b));
    if (Array.isArray(apiData.job_benefits)) apiData.job_benefits.forEach((b: string) => benefitsList.add(formatBenefit(b)));

    // Priority: API Arrays > LLM
    let benefits: string | null = benefitsList.size > 0
      ? Array.from(benefitsList).map((b) => `• ${b}`).join('\n')
      : null;

    if (!benefits) benefits = llm?.benefits ?? null;

    // ── 5. Salary & Currency ─────────────────────────────────────────────────
    let currency = apiData.job_salary_currency || 'VND';

    let salaryMin = apiData.job_min_salary ? Number(apiData.job_min_salary) : llm?.salaryMin ?? null;
    let salaryMax = apiData.job_max_salary ? Number(apiData.job_max_salary) : llm?.salaryMax ?? null;

    if (!salaryMin && !salaryMax && apiData.job_salary) {
      salaryMin = Number(apiData.job_salary);
      salaryMax = Number(apiData.job_salary);
    }


    // ── 6. JobType ───────────────────────────────────────────────────────────
    let rawJobType = apiData.job_employment_type;
    if (!rawJobType && Array.isArray(apiData.job_employment_types) && apiData.job_employment_types.length > 0) {
      rawJobType = apiData.job_employment_types[0];
    }
    let jobType = this.parseJobType(rawJobType);

    // ── 7. Experience ────────────────────────────────────────────────────────
    let experience: string | null = null;
    if (apiData.job_required_experience) {
      const reqExp = apiData.job_required_experience;
      if (reqExp.no_experience_required) {
        experience = 'Không yêu cầu kinh nghiệm';
      } else if (reqExp.required_experience_in_months) {
        const months = reqExp.required_experience_in_months;
        experience = months >= 12 ? `${parseFloat((months / 12).toFixed(1))} năm` : `${months} tháng`;
      }
    }
    // Priority: API Experience Obj > LLM
    if (!experience) experience = llm?.experience ?? null;



    // ── 8. Deadline ──────────────────────────────────────────────────────────
    let deadline: Date | null = null;

    // Ưu tiên 1: Lấy từ chuỗi datetime (ISO String)
    if (apiData.job_offer_expiration_datetime_utc) {
      const d = new Date(apiData.job_offer_expiration_datetime_utc);
      if (!isNaN(d.getTime())) deadline = d;
    }

    // Ưu tiên 2: Nếu ưu tiên 1 thất bại, thử lấy từ timestamp
    if (!deadline && apiData.job_offer_expiration_timestamp) {
      // Lưu ý: JSearch thường trả về Unix timestamp tính bằng GIÂY.
      // JavaScript cần MILIGIAY, nên ta nhân với 1000.
      const d = new Date(apiData.job_offer_expiration_timestamp * 1000);
      if (!isNaN(d.getTime())) deadline = d;
    }

    // Ưu tiên 3: Nếu API hoàn toàn không có, dùng AI (LLM) để đoán
    if (!deadline && llm?.deadline) {
      const d = new Date(llm.deadline);
      if (!isNaN(d.getTime())) deadline = d;
    }

    // ── 9. Location ──────────────────────────────────────────────────────────
    const cleanLocation = (loc: string) => loc ? loc.split('•')[0].trim() : '';
    const locationParts = [apiData.job_city, apiData.job_state, apiData.job_country].filter(Boolean);
    let locationCity = apiData.job_city || cleanLocation(apiData.job_location) || (locationParts.length > 0 ? locationParts[0] : 'Việt Nam');
    let fullAddress = locationParts.join(', ') || locationCity;

    // ── 10. Vacancies ────────────────────────────────────────────────────────
    const vacancies = apiData.job_vacancies ? Number(apiData.job_vacancies) : (llm?.vacancies ?? 1);

    return {
      jobData: {
        title,
        description: fullDescription,
        requirements,
        benefits,
        originalUrl,
        locationCity,
        salaryMin,
        salaryMax,
        currency,
        jobType,
        experience,
        deadline,
        vacancies,
      },
      companyData: {
        companyName: apiData.employer_name || 'Unknown Company',
        logo: apiData.employer_logo || null,
        banner: null,
        websiteUrl: apiData.employer_website || null,
        description: (apiData.employer_company_type ? `Loại hình công ty: ${apiData.employer_company_type}` : null) || llm?.companyDescription || null,
        address: fullAddress,
        companySize: llm?.companySize || null,
      },
    };
  }
}
