import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { AxiosResponse, AxiosError } from 'axios';
import { PrismaService } from '@/prisma/prisma.service';
import { inferIndustry } from './rapid-job.config';
import { JobStatus, PostType, JobType } from '@prisma/client';

// ─── JSearch raw response ─────────────────────────────────────────────────────

export interface JSearchResponse {
  status: string;
  request_id: string;
  parameters: Record<string, unknown>;
  data: Record<string, unknown>[];
  [key: string]: unknown;
}

// ─── Kết quả sau khi map từ raw API ──────────────────────────────────────────
//
//  jobData     → các trường thuộc bảng JobPosting
//  companyData → các trường thuộc bảng Company (tách riêng để connectOrCreate)

export interface MappedJobData {
  jobData: {
    title: string;
    description: string;
    requirements: string | null;
    benefits: string | null;
    originalUrl: string;
    locationCity: string;
    salaryMin: number | null;
    salaryMax: number | null;
    currency: string;
    jobType: JobType | null;     // Dùng Prisma Enum
    experience: string | null;
    deadline: Date | null;       // Ngày hết hạn
    vacancies: number;           // Số lượng tuyển
  };
  companyData: {
    companyName: string;
    logo: string | null;
    websiteUrl: string | null;
    description: string | null;
    address: string | null;
    companySize: number | null;
  };
}

@Injectable()
export class RapidJobService {
  private readonly logger = new Logger(RapidJobService.name);
  private readonly jsearchUrl = 'https://jsearch.p.rapidapi.com/search';
  private readonly linkedinUrl = 'https://linkedin-job-search-api.p.rapidapi.com/active-jb-24h';
  private readonly linkedinV2Url = 'https://linkedin-jobs-api2.p.rapidapi.com/active-jb-7d';
  private readonly jpfUrl = 'https://job-posting-feed-api.p.rapidapi.com/active-ats-6m';

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) { }

  // =========================================================================
  //  API FETCHERS
  // =========================================================================

  /**
   * [SOURCE: JSearch] Tìm kiếm việc làm theo query, country và ngày đăng.
   */
  fetchJSearchJobs(
    query: string,
    page: number = 1,
    country: string = 'vn',
    datePosted: string = 'today',
  ): Observable<JSearchResponse> {
    const apiKey = this.configService.get<string>('RAPIDAPI_KEY');
    const apiHost =
      this.configService.get<string>('JSEARCH_API_HOST') ||
      'jsearch.p.rapidapi.com';

    return this.httpService
      .get<JSearchResponse>(this.jsearchUrl, {
        params: {
          query,
          page: String(page),
          num_pages: '1',
          country,
          date_posted: datePosted,
        },
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

  /**
   * [SOURCE: LinkedIn] Lấy tin tuyển dụng mới nhất trong 24h theo title.
   */
  fetchLinkedInJobs(
    title: string = 'intern',
    location: string = 'Vietnam',
    limit: number = 10,
  ): Observable<any[]> {
    const apiKey = this.configService.get<string>('RAPIDAPI_KEY');
    const apiHost =
      this.configService.get<string>('LINKEDIN_API_HOST') ||
      'linkedin-job-search-api.p.rapidapi.com';

    return this.httpService
      .get(this.linkedinUrl, {
        params: {
          limit: String(limit),
          offset: '0',
          title_filter: `"${title}"`,
          location_filter: `"${location}"`,
          description_type: 'text',
        },
        headers: {
          'X-RapidAPI-Key': apiKey,
          'X-RapidAPI-Host': apiHost,
          'Content-Type': 'application/json',
        },
      })
      .pipe(
        map((response: AxiosResponse) => response.data),
        catchError((error: AxiosError) => this.handleError(error, 'LinkedIn')),
      );
  }

  /**
   * [SOURCE: LinkedIn V2] Lấy tin tuyển dụng theo 7 ngày (active-jb-7d)
   */
  fetchLinkedInJobsV2(
    title: string = 'Data Engineer',
    location: string = 'United States',
    limit: number = 10,
  ): Observable<any[]> {
    const apiKey = this.configService.get<string>('RAPIDAPI_KEY');
    const apiHost =
      this.configService.get<string>('LINKEDINV2_API_HOST') ||
      'linkedin-jobs-api2.p.rapidapi.com';

    return this.httpService
      .get(this.linkedinV2Url, {
        params: {
          title_filter: `"${title}"`,
          location_filter: `"${location}"`,
          limit: String(limit),
        },
        headers: {
          // LinkedIn V2 uses lowercase version of header in the user's snippet, Axios treats them case-insensitively, but let's match the standard format.
          'X-RapidAPI-Key': apiKey,
          'X-RapidAPI-Host': apiHost,
          'Content-Type': 'application/json',
        },
      })
      .pipe(
        map((response: AxiosResponse) => response.data),
        catchError((error: AxiosError) => this.handleError(error, 'LinkedInV2')),
      );
  }

  /**
   * [SOURCE: Job Posting Feed] Lấy tin từ ATS Feed (6 tháng gần đây).
   * @param titleFilter Boolean filter syntax, ví dụ: '(Intern) & (Hotel | "Tour Guide")'
   */
  fetchJobPostingFeed(limit: number = 10, titleFilter?: string): Observable<any[]> {
    const apiKey = this.configService.get<string>('RAPIDAPI_KEY');
    const apiHost =
      this.configService.get<string>('JOB_POSTING_FEED_HOST') ||
      'job-posting-feed-api.p.rapidapi.com';

    const params: Record<string, string> = {
      limit: String(limit),
      description_type: 'text',
    };
    if (titleFilter) {
      params['advanced_title_filter'] = titleFilter;
    }

    return this.httpService
      .get(this.jpfUrl, {
        params,
        headers: {
          'X-RapidAPI-Key': apiKey,
          'X-RapidAPI-Host': apiHost,
          'Content-Type': 'application/json',
        },
      })
      .pipe(
        map((response: AxiosResponse) => response.data),
        catchError((error: AxiosError) => this.handleError(error, 'JPF')),
      );
  }

  // =========================================================================
  //  MAPPERS  —  raw API response → MappedJobData
  // =========================================================================

  /**
   * JSearch response → MappedJobData.
   * JSearch có thông tin phong phú nhất: requirements, benefits, salary, city.
   */
  mapJSearchToJob(apiData: any): MappedJobData {
    const title = apiData.job_title ?? 'Untitled';
    const highlights = apiData.job_highlights || {};

    let deadline: Date | null = null;
    if (apiData.job_offer_expiration_datetime_utc) {
      deadline = new Date(apiData.job_offer_expiration_datetime_utc);
      if (isNaN(deadline.getTime())) deadline = null;
    }

    return {
      jobData: {
        title,
        description: apiData.job_description || '',
        requirements: (highlights.Qualifications as string[] | undefined)
          ?.map((q) => `• ${q}`)
          .join('\n') || null,
        benefits: (highlights.Benefits as string[] | undefined)
          ?.map((b) => `• ${b}`)
          .join('\n') || null,
        originalUrl: apiData.job_apply_link || '',
        locationCity: apiData.job_city || apiData.job_country || 'Việt Nam',
        salaryMin: apiData.job_min_salary != null ? Number(apiData.job_min_salary) : null,
        salaryMax: apiData.job_max_salary != null ? Number(apiData.job_max_salary) : null,
        currency: apiData.job_salary_currency || 'USD',
        jobType: this.parseJobType(apiData.job_employment_type), // FULLTIME, PARTTIME...
        experience: apiData.job_required_experience?.required_experience_in_months
          ? `${apiData.job_required_experience.required_experience_in_months} months`
          : null,
        deadline,
        vacancies: apiData.job_vacancies ? Number(apiData.job_vacancies) : 1,
      },
      companyData: {
        companyName: apiData.employer_name || 'Unknown Company',
        logo: apiData.employer_logo || null,
        websiteUrl: apiData.employer_website || null,
        description: null,
        address: null,
        companySize: null, // JSearch thường không có company size cụ thể
      },
    };
  }

  /**
   * LinkedIn response → MappedJobData.
   * LinkedIn ít metadata lương hơn JSearch nhưng thường từ công ty lớn.
   */
  mapLinkedInToJob(apiData: any): MappedJobData {
    const title = apiData.title ?? 'Untitled';
    const descText = apiData.description_text || '';

    // 1. Xử lý Lương (Salary) - Khai thác từ salary_raw
    let sMin = null;
    let sMax = null;
    let curr = 'VND';

    if (apiData.salary_raw && apiData.salary_raw.value) {
      const val = apiData.salary_raw.value;
      sMin = val.minValue || val.value || null;
      sMax = val.maxValue || val.value || null;
      curr = apiData.salary_raw.currency || 'USD';
    }

    // 2. Xử lý Địa điểm - Ưu tiên locations_derived (đã được API chuẩn hóa)
    const location = apiData.locations_derived?.[0] ||
      apiData.locations_raw?.[0]?.address?.addressLocality ||
      'Việt Nam';

    // 3. Tách Requirements và Benefits từ Description (Logic Regex đơn giản)
    // LinkedIn thường để chung, ta cố gắng tìm các keyword để cắt
    const requirements = this.extractSection(descText, ['Qualifications', 'Key Skills', 'Requirements', 'About the Role']);
    const benefits = this.extractSection(descText, ['Why Join', 'Benefits', 'What We Offer', 'WHAT ARE THE GAINS']);

    return {
      jobData: {
        title,
        description: descText,
        requirements: requirements || null,
        benefits: benefits || null,
        originalUrl: apiData.url || '',
        locationCity: location,
        salaryMin: sMin ? Number(sMin) : null,
        salaryMax: sMax ? Number(sMax) : null,
        currency: curr,
        jobType: this.parseJobType(apiData.employment_type?.[0]), // Đang lấy Enum chuẩn
        experience: apiData.seniority || null, // Lấy "Mid-Senior level", "Entry level"...
        deadline: null, // LinkedIn v1 api thường không trả deadline
        vacancies: apiData.vacancies ? Number(apiData.vacancies) : 1,
      },
      companyData: {
        companyName: apiData.organization || 'LinkedIn Partner',
        logo: apiData.organization_logo || null,
        websiteUrl: apiData.linkedin_org_url || null,
        description: apiData.linkedin_org_description || apiData.linkedin_org_slogan || null,
        address: apiData.linkedin_org_headquarters || null,
        companySize: this.parseCompanySize(apiData.linkedin_org_size), // Chuyển "11-50 employees" thành số 50
      },
    };
  }

  // Helper: Tách đoạn văn bản dựa trên danh sách tiêu đề
  private extractSection(text: string, keywords: string[]): string {
    for (const word of keywords) {
      const index = text.toLowerCase().lastIndexOf(word.toLowerCase());
      if (index !== -1) {
        return text.substring(index).split('\n\n')[0]; // Lấy đoạn đó cho đến khi xuống dòng kép
      }
    }
    return '';
  }

  // Helper: Chuyển text quy mô công ty thành số
  private parseCompanySize(sizeText: string): number | null {
    if (!sizeText) return null;
    const match = sizeText.match(/\d+/g);
    return match ? Number(match[match.length - 1]) : null;
  }

  /**
   * LinkedIn V2 response → MappedJobData.
   */
  mapLinkedInV2ToJob(apiData: any): MappedJobData {
    const title = apiData.title ?? 'Untitled';
    const descText = apiData.description_text || apiData.description || '';

    // Lọc lại các trường giống V1
    const requirements = this.extractSection(descText, ['Qualifications', 'Key Skills', 'Requirements', 'About the Role']);
    const benefits = this.extractSection(descText, ['Why Join', 'Benefits', 'What We Offer', 'WHAT ARE THE GAINS']);
    const location = apiData.location || 'Việt Nam';

    return {
      jobData: {
        title,
        description: descText,
        requirements: requirements || null,
        benefits: benefits || null,
        originalUrl: apiData.url || apiData.job_url || '',
        locationCity: location,
        salaryMin: null,
        salaryMax: null,
        currency: 'VND', // V2 thường thiếu salary_raw
        jobType: this.parseJobType(apiData.employment_type?.[0]),
        experience: apiData.seniority || null,
        deadline: null,
        vacancies: apiData.vacancies ? Number(apiData.vacancies) : 1,
      },
      companyData: {
        companyName: apiData.company_name || apiData.company || 'LinkedIn Partner',
        logo: apiData.company_logo || apiData.logo_url || null,
        websiteUrl: apiData.linkedin_org_url || null,
        description: null,
        address: null,
        companySize: null, // Có thể cải thiện nếu V2 trả về company size
      },
    };
  }

  /**
   * Job Posting Feed response → MappedJobData.
   * JPF tập trung vào ngành kỹ thuật, dịch vụ, giáo dục.
   */
  mapJPFToJob(apiData: any): MappedJobData {
    const title = apiData.title ?? 'Untitled';

    return {
      jobData: {
        title,
        description: apiData.description_text || apiData.description || '',
        requirements: null,
        benefits: null,
        originalUrl: apiData.url || apiData.apply_url || '',
        locationCity: apiData.location || apiData.city || 'Việt Nam',
        salaryMin: null,
        salaryMax: null,
        currency: 'VND',
        jobType: this.parseJobType(apiData.employment_type),
        experience: null,
        deadline: null, // JPF thường ít có deadline chuẩn xác
        vacancies: apiData.vacancies ? Number(apiData.vacancies) : 1,
      },
      companyData: {
        companyName: apiData.company_name || apiData.company || 'ATS Partner',
        logo: apiData.company_logo || null,
        websiteUrl: apiData.company_url || null,
        description: null,
        address: null,
        companySize: null,
      },
    };
  }

  // =========================================================================
  //  DATABASE SYNC  —  atomic upsert với Prisma Transaction
  // =========================================================================

  /**
   * Lưu một job vào database trong một transaction nguyên tử:
   *
   *  1. **Find or Create Company**: Tìm công ty theo tên, tạo mới nếu chưa có.
   *     → Đảm bảo 2 job cùng công ty chỉ tạo 1 bản ghi Company.
   *     → Dữ liệu không bao giờ "mồ côi" (job không có company).
   *
   *  2. **Upsert JobPosting**: Tạo job mới hoặc cập nhật nếu đã tồn tại.
   *     → Unique key: originalUrl + crawlSourceId.
   *
   *  Nếu bước 1 hoặc 2 lỗi → Prisma tự rollback toàn bộ transaction.
   *
   * @param mappedData      Dữ liệu đã map từ mapper
   * @param crawlSourceId   ID của CrawlSource (JSearch / LinkedIn / JPF)
   * @param reliabilityScore Độ tin cậy theo nguồn (LinkedIn=8, JSearch=6, JPF=5)
   */
  async syncJobToDb(
    mappedData: MappedJobData,
    crawlSourceId: string,
    reliabilityScore: number,
  ) {
    const { jobData, companyData } = mappedData;

    // Guard: bỏ qua nếu không có URL apply (không thể dedup)
    if (!jobData.originalUrl) {
      this.logger.debug(`[syncJobToDb] Bỏ qua "${jobData.title}" — không có originalUrl`);
      return null;
    }

    return this.prisma.$transaction(async (tx) => {
      // ── Bước 1: Find or Create Company ──────────────────────────────────
      //  Dùng findFirst thay vì connectOrCreate để không cần @unique constraint
      //  trên companyName → linh hoạt hơn và không cần migration schema.
      let company = await tx.company.findFirst({
        where: { companyName: companyData.companyName },
      });

      if (!company) {
        company = await tx.company.create({
          data: {
            companyName: companyData.companyName,
            logo: companyData.logo,
            websiteUrl: companyData.websiteUrl,
            description: companyData.description,
            address: companyData.address,
            companySize: companyData.companySize,
            isRegistered: false,   // crawled data, chưa xác minh
            verifyStatus: 0,
          },
        });
        this.logger.debug(`[Company] Tạo mới: "${company.companyName}"`);
      } else {
        // Có thể bổ sung update các trường còn thiếu nếu company đã tồn tại
        if (!company.companySize && companyData.companySize) {
          await tx.company.update({
            where: { companyId: company.companyId },
            data: { companySize: companyData.companySize },
          });
        }
      }

      // ── Bước 2: Upsert JobPosting ────────────────────────────────────────
      return tx.jobPosting.upsert({
        where: {
          originalUrl_crawlSourceId: {
            originalUrl: jobData.originalUrl,
            crawlSourceId,
          },
        },
        // Khi tin đã tồn tại → chỉ refresh nội dung, giữ nguyên status/company
        update: {
          title: jobData.title,
          description: jobData.description || null,
          requirements: jobData.requirements || null,
          benefits: jobData.benefits || null,
          locationCity: jobData.locationCity || null,
          jobType: jobData.jobType,
          experience: jobData.experience,
          deadline: jobData.deadline,
          vacancies: jobData.vacancies,
          updatedAt: new Date(),
        },
        // Khi tin chưa tồn tại → tạo mới với đầy đủ thông tin
        create: {
          title: jobData.title,
          description: jobData.description || null,
          requirements: jobData.requirements || null,
          benefits: jobData.benefits || null,
          originalUrl: jobData.originalUrl,
          locationCity: jobData.locationCity || null,
          salaryMin: jobData.salaryMin,
          salaryMax: jobData.salaryMax,
          currency: jobData.currency || 'VND',
          jobType: jobData.jobType,
          experience: jobData.experience,
          deadline: jobData.deadline,
          vacancies: jobData.vacancies,
          companyId: company.companyId,
          crawlSourceId,
          status: JobStatus.PENDING,
          postType: PostType.CRAWLED,
          aiReliabilityScore: reliabilityScore,
          isVerified: false,
        },
      });
    });
  }

  // =========================================================================
  //  PRIVATE HELPERS
  // =========================================================================

  /**
   * Chuyển chuỗi thô thành Prisma JobType Enum
   */
  private parseJobType(rawType?: string): JobType | null {
    if (!rawType) return null;
    const t = String(rawType).toUpperCase().replace(/[^A-Z]/g, '');
    if (t.includes('INTERN')) return JobType.INTERNSHIP;
    if (t.includes('PARTTIME')) return JobType.PARTTIME;
    if (t.includes('CONTRACT')) return JobType.CONTRACT;
    if (t.includes('REMOTE')) return JobType.REMOTE;
    if (t.includes('FULLTIME')) return JobType.FULLTIME;
    return null;
  }

  private handleError(error: AxiosError, source: string = 'API'): Observable<never> {
    const status = error.response?.status;
    const message = (error.response?.data as any)?.message ?? error.message;
    this.logger.error(
      `${source} API call failed [HTTP ${status ?? 'N/A'}]: ${message}`,
    );
    return throwError(
      () => new Error(`Failed to fetch jobs from ${source}: ${message}`),
    );
  }
}
