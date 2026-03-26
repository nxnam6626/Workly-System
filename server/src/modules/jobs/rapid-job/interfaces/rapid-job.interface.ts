import { JobType } from '@prisma/client';

export interface JSearchResponse {
  status: string;
  request_id: string;
  parameters: Record<string, unknown>;
  data: Record<string, unknown>[];
  [key: string]: unknown;
}

export interface MappedJobData {
  jobData: {
    title: string;
    description: string;
    requirements: string | null;
    benefits: string | null;
    salaryMin: number | null;
    salaryMax: number | null;
    currency: string;
    jobType: JobType | null;
    experience: string | null;
    locationCity: string;
    vacancies: number;
    deadline: Date | null;
    originalUrl: string;
  };
  companyData: {
    companyName: string;
    logo: string | null;
    banner: string | null;
    address: string | null;
    description: string | null;
    websiteUrl: string | null;
    companySize: number | null;
  };
}

export interface LlmExtractedData {
  description: string | null;
  requirements: string | null;
  benefits: string | null;
  salaryMin: number | null;
  salaryMax: number | null;
  experience: string | null;
  vacancies: number;
  deadline: string | null; // YYYY-MM-DD string from LLM
  companyDescription: string | null;
  companySize: number | null;
}
