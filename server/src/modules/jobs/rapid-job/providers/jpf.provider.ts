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

  fetchJobs(params: { limit?: number; titleFilter?: string }): Observable<any[]> {
    const apiKey = this.configService.get<string>('RAPIDAPI_KEY');
    const apiHost = this.configService.get<string>('JOB_POSTING_FEED_HOST') || 'job-posting-feed-api.p.rapidapi.com';

    const queryParams: Record<string, string> = {
      limit: String(params.limit || 10),
      description_type: 'text',
    };
    if (params.titleFilter) {
      queryParams['advanced_title_filter'] = params.titleFilter;
    }

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
        map((response: AxiosResponse) => response.data),
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
        requirements: null,
        benefits: null,
        originalUrl: apiData.url || apiData.apply_url || '',
        locationCity: apiData.location || apiData.city || 'Việt Nam',
        salaryMin: null,
        salaryMax: null,
        currency: 'VND',
        jobType: this.parseJobType(apiData.employment_type),
        experience: null,
        deadline: null,
        vacancies: apiData.vacancies ? Number(apiData.vacancies) : 1,
      },
      companyData: {
        companyName: apiData.company_name || apiData.company || 'ATS Partner',
        logo: apiData.company_logo || null,
        banner: null,
        websiteUrl: apiData.company_url || null,
        description: null,
        address: null,
        companySize: null,
      },
    };
  }
}
