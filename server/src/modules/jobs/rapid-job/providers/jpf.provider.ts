import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { Observable } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { AxiosResponse, AxiosError } from 'axios';
import { BaseProvider } from './base.provider';
import { MappedJobData } from '../interfaces/rapid-job.interface';

@Injectable()
export class JPFProvider extends BaseProvider {
  private readonly url = 'https://job-posting-feed-api.p.rapidapi.com/active-ats-6m';

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    super(JPFProvider.name);
  }

  fetchJobs(): Observable<any[]> {
    const apiKey = this.configService.get<string>('RAPIDAPI_KEY');
    const apiHost = this.configService.get<string>('JOB_POSTING_FEED_HOST') || 'job-posting-feed-api.p.rapidapi.com';

    const queryParams: Record<string, string> = {
      description_type: 'text',
      location_filter: 'Vietnam',                // API yêu cầu tên đầy đủ, không dùng 'VN'
      include_ai: 'true',                        // Bắt buộc để các AI filter hoạt động
      ai_employment_type_filter: 'INTERN',       // AI phân loại đúng loại hình thực tập
      ai_experience_level_filter: '0-2',         // Thực tập sinh thường ở nhóm 0-2 năm
      advanced_title_filter: "Intern:* | 'Thực tập'", // Bao phủ tiếng Anh và tiếng Việt
    };

    return this.httpService
      .get(this.url, {
        params: queryParams,
        headers: {
          'X-RapidAPI-Key': apiKey,
          'X-RapidAPI-Host': apiHost,
          'Content-Type': 'application/json',
        },
      })
      .pipe(
        map((response: AxiosResponse) => Array.isArray(response.data) ? response.data : []),
        catchError((error: AxiosError) => this.handleError(error, 'JPF')),
      );
  }

  extractUrlAndDesc(apiData: any): { originalUrl: string, rawDescription: string } {
    return {
      originalUrl: apiData.url || apiData.apply_url || '',
      rawDescription: apiData.description_text || apiData.description || ''
    };
  }

  mapToJobData(apiData: any, llm: any = null): MappedJobData {
    const title = apiData.title ?? 'Untitled';

    return {
      jobData: {
        title,
        description: apiData.description_text || apiData.description || '',
        requirements: llm?.requirements || null,
        benefits: llm?.benefits || null,
        originalUrl: apiData.url || apiData.apply_url || '',
        locationCity: apiData.cities_derived?.[0] || apiData.locations_derived?.[0] || 'Việt Nam',
        salaryMin: llm?.salaryMin ?? null,
        salaryMax: llm?.salaryMax ?? null,
        currency: 'VND',
        jobType: this.parseJobType(apiData.employment_type),
        experience: llm?.experience || 'No experience required',
        deadline: llm?.deadline ? new Date(llm.deadline) : null,
        vacancies: apiData.vacancies ? Number(apiData.vacancies) : (llm?.vacancies ?? 1),
      },
      companyData: {
        companyName: apiData.organization || apiData.company_name || 'Công ty ẩn danh',
        logo: apiData.organization_logo || apiData.company_logo || null,
        banner: null,
        websiteUrl: apiData.organization_url || apiData.company_url || null,
        description: llm?.companyDescription || null,
        address: apiData.locations_raw?.[0]?.address?.streetAddress || null,
        companySize: llm?.companySize || null,
      },
    };
  }
}
