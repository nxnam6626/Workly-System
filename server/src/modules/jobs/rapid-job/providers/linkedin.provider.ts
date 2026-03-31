import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { Observable } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { AxiosResponse, AxiosError } from 'axios';
import { BaseProvider } from './base.provider';
import { MappedJobData } from '../interfaces/rapid-job.interface';

@Injectable()
export class LinkedInProvider extends BaseProvider {
  private readonly url = 'https://linkedin-job-search-api.p.rapidapi.com/active-jb-24h';

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    super(LinkedInProvider.name);
  }

  fetchJobs(params: { title?: string }): Observable<any[]> {
    const apiKey = this.configService.get<string>('RAPIDAPI_KEY');
    const apiHost = this.configService.get<string>('LINKEDIN_API_HOST') || 'linkedin-job-search-api.p.rapidapi.com';

    const internKeywords = params.title || 'intern OR internship OR "thực tập sinh" OR trainee OR fresher';
    const location = 'Vietnam';

    return this.httpService
      .get(this.url, {
        params: {
          limit: String(10),
          offset: '0',
          title_filter: internKeywords,
          location_filter: location,
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

  extractUrlAndDesc(apiData: any): { originalUrl: string, rawDescription: string } {
    return {
      originalUrl: apiData.url || '',
      rawDescription: apiData.description_text || ''
    };
  }

  mapToJobData(apiData: any, llm: any = null): MappedJobData {
    const title = apiData.title ?? 'Untitled';
    const descText = apiData.description_text || '';

    const requirements = this.extractSection(descText, ['Qualifications', 'Key Skills', 'Requirements', 'About the Role']) || llm?.requirements || null;

    const benefits = this.extractSection(descText, ['Why Join', 'Benefits', 'What We Offer', 'WHAT ARE THE GAINS']) || llm?.benefits || null;

    let sMin = null;
    let sMax = null;
    let curr = 'VND';

    if (apiData.salary_raw && apiData.salary_raw.value) {
      const val = apiData.salary_raw.value;
      sMin = val.minValue || val.value || null;
      sMax = val.maxValue || val.value || null;
      curr = apiData.salary_raw.currency || 'VND';
    }

    const location = apiData.locations_derived?.[0] ||
      apiData.locations_raw?.[0]?.address?.addressLocality ||
      'Việt Nam';



    return {
      jobData: {
        title,
        description: descText,
        requirements: requirements,
        benefits: benefits,
        originalUrl: apiData.url || '',
        locationCity: location,
        salaryMin: sMin ? Number(sMin) : (llm?.salaryMin ?? null),
        salaryMax: sMax ? Number(sMax) : (llm?.salaryMax ?? null),
        currency: curr,
        jobType: this.parseJobType(apiData.employment_type?.[0]),
        experience: apiData.seniority || llm?.experience || null,
        deadline: llm?.deadline ? new Date(llm.deadline) : null,
        vacancies: apiData.vacancies ? Number(apiData.vacancies) : (llm?.vacancies ?? 1),
      },
      companyData: {
        companyName: apiData.organization || 'LinkedIn Partner',
        logo: apiData.organization_logo || null,
        banner: apiData.linkedin_org_slogan || null,
        websiteUrl: apiData.linkedin_org_url || apiData.organization_url,
        description: apiData.linkedin_org_description || llm?.companyDescription || null,
        address: apiData.linkedin_org_headquarters || null,
        companySize: (apiData.linkedin_org_size ? this.parseCompanySize(apiData.linkedin_org_size) : null) || llm?.companySize || null,
      },
    };
  }
}
