import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { AxiosResponse, AxiosError } from 'axios';
import { JobDto } from './dto/job.dto';

export interface JSearchResponse {
  status: string;
  request_id: string;
  parameters: Record<string, unknown>;
  data: Record<string, unknown>[];
  [key: string]: unknown;
}

@Injectable()
export class RapidJobService {
  private readonly logger = new Logger(RapidJobService.name);
  private readonly jsearchUrl = 'https://jsearch.p.rapidapi.com/search';
  private readonly linkedinUrl = 'https://linkedin-job-search-api.p.rapidapi.com/active-jb-24h';
  private readonly jpfUrl = 'https://job-posting-feed-api.p.rapidapi.com/active-ats-6m';

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * [SOURCE: JSearch] Gọi JSearch API để lấy danh sách job.
   */
  fetchJSearchJobs(
    query: string,
    page: number = 1,
    country: string = 'vn',
    datePosted: string = 'all',
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
   * [SOURCE: LinkedIn] Gọi API lấy danh sách job mới trong 24h.
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
   * [SOURCE: Job Posting Feed] Gọi API lấy danh sách job từ ATS Feed (6 tháng).
   */
  fetchJobPostingFeed(limit: number = 10): Observable<any[]> {
    const apiKey = this.configService.get<string>('RAPIDAPI_KEY');
    const apiHost =
      this.configService.get<string>('JOB_POSTING_FEED_HOST') ||
      'job-posting-feed-api.p.rapidapi.com';

    return this.httpService
      .get(this.jpfUrl, {
        params: {
          limit: String(limit),
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
        catchError((error: AxiosError) => this.handleError(error, 'JPF')),
      );
  }

  /**
   * Chuyển đổi dữ liệu thô từ JSearch sang JobDto.
   */
  mapJSearchToJob(apiData: any): JobDto {
    return {
      title: apiData.job_title,
      companyName: apiData.employer_name,
      description: apiData.job_description,
      applyUrl: apiData.job_apply_link,
      salary: this.formatJSearchSalary(apiData),
    };
  }

  /**
   * Chuyển đổi dữ liệu thô từ LinkedIn sang JobDto.
   */
  mapLinkedInToJob(apiData: any): JobDto {
    return {
      title: apiData.title,
      companyName: apiData.company_name || 'LinkedIn Partner',
      description: apiData.description_text || 'No description provided',
      applyUrl: apiData.url,
      salary: 'Thỏa thuận',
    };
  }

  /**
   * Chuyển đổi dữ liệu thô từ Job Posting Feed sang JobDto.
   */
  mapJPFToJob(apiData: any): JobDto {
    return {
      title: apiData.title,
      companyName: apiData.company_name || 'ATS Partner',
      description: apiData.description_text || 'No description provided',
      applyUrl: apiData.url,
      salary: 'Thỏa thuận',
    };
  }

  private formatJSearchSalary(apiData: any): string {
    const min = apiData.job_min_salary;
    const max = apiData.job_max_salary;
    const currency = apiData.job_salary_currency ?? 'USD';
    const period = apiData.job_salary_period;

    if (!min && !max) return 'Thỏa thuận';
    const salaryStr =
      min && max && min !== max
        ? `${min.toLocaleString()} - ${max.toLocaleString()}`
        : (min || max).toLocaleString();
    return `${salaryStr} ${currency}${period ? `/${period.toLowerCase()}` : ''}`;
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
