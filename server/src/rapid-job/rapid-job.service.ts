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
  private readonly workdayUrl = 'https://workday-jobs-api.p.rapidapi.com/active-ats-7d';

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * [SOURCE: JSearch] Gọi API lấy danh sách job.
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
   * [SOURCE: Workday] Gọi API lấy danh sách job từ Workday ATS.
   */
  fetchWorkdayJobs(title: string, location: string = 'Vietnam'): Observable<any> {
    const apiKey = this.configService.get<string>('RAPIDAPI_KEY');
    const apiHost = this.configService.get<string>('WORKDAY_API_HOST') || 'workday-jobs-api.p.rapidapi.com';

    return this.httpService
      .get(this.workdayUrl, {
        params: {
          title_filter: title,
          location_filter: `"${location}"`,
        },
        headers: {
          'X-RapidAPI-Key': apiKey,
          'X-RapidAPI-Host': apiHost,
          'Content-Type': 'application/json',
        },
      })
      .pipe(
        map((response: AxiosResponse) => response.data),
        catchError((error: AxiosError) => this.handleError(error, 'Workday')),
      );
  }

  /**
   * [MAPPING: JSearch] Chuyển đổi sang JobDto.
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
   * [MAPPING: Workday] Chuyển đổi sang JobDto.
   */
  mapWorkdayToJob(apiData: any): JobDto {
    return {
      title: apiData.title,
      companyName: apiData.company_name || 'Workday Partner',
      description: apiData.description_text || apiData.description_html || 'No description provided',
      applyUrl: apiData.url,
      salary: 'Thỏa thuận', // Workday API thường không trả về lương trực tiếp trong list
    };
  }

  private formatJSearchSalary(apiData: any): string {
    const min = apiData.job_min_salary;
    const max = apiData.job_max_salary;
    const currency = apiData.job_salary_currency ?? 'USD';
    const period = apiData.job_salary_period;

    if (!min && !max) return 'Thỏa thuận';
    const salaryStr = min && max && min !== max 
      ? `${min.toLocaleString()} - ${max.toLocaleString()}` 
      : (min || max).toLocaleString();
    return `${salaryStr} ${currency}${period ? `/${period.toLowerCase()}` : ''}`;
  }

  private handleError(error: AxiosError, source: string): Observable<never> {
    const status = error.response?.status;
    const message = (error.response?.data as any)?.message ?? error.message;
    this.logger.error(`${source} API call failed [HTTP ${status ?? 'N/A'}]: ${message}`);
    return throwError(() => new Error(`Failed to fetch jobs from ${source}: ${message}`));
  }
}
