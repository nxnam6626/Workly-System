import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { Observable } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { AxiosResponse, AxiosError } from 'axios';
import { BaseProvider } from './base.provider';
import { MappedJobData } from '../interfaces/rapid-job.interface';

@Injectable()
export class LinkedInV2Provider extends BaseProvider {
  private readonly url = 'https://linkedin-jobs-api2.p.rapidapi.com/active-jb-7d';

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    super(LinkedInV2Provider.name);
  }

  fetchJobs(params: { title?: string; location?: string; limit?: number }): Observable<any[]> {
    const apiKey = this.configService.get<string>('RAPIDAPI_KEY');
    const apiHost = this.configService.get<string>('LINKEDINV2_API_HOST') || 'linkedin-jobs-api2.p.rapidapi.com';

    return this.httpService
      .get(this.url, {
        params: {
          title_filter: `"${params.title || 'Data Engineer'}"`,
          location_filter: `"${params.location || 'United States'}"`,
          limit: String(params.limit || 10),
        },
        headers: {
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

  extractUrlAndDesc(apiData: any): { originalUrl: string, rawDescription: string } {
    return {
      originalUrl: apiData.url || apiData.job_url || '',
      rawDescription: apiData.description_text || apiData.description || ''
    };
  }

  mapToJobData(apiData: any, llm: any = null): MappedJobData {
    const title = apiData.title ?? 'Untitled';
    const descText = apiData.description_text || apiData.description || '';

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
        currency: 'VND',
        jobType: this.parseJobType(apiData.employment_type?.[0]),
        experience: apiData.seniority || null,
        deadline: null,
        vacancies: apiData.vacancies ? Number(apiData.vacancies) : 1,
      },
      companyData: {
        companyName: apiData.company_name || apiData.company || 'LinkedIn Partner',
        logo: apiData.company_logo || apiData.logo_url || null,
        banner: null,
        websiteUrl: apiData.linkedin_org_url || null,
        description: null,
        address: null,
        companySize: null,
      },
    };
  }
}
