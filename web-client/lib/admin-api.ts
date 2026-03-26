import api from '@/lib/api';

// ─── Enums & Models (Jobs) ──────────────────────────────────────────────────

export enum JobStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  EXPIRED = 'EXPIRED',
}

export enum PostType {
  CRAWLED = 'CRAWLED',
  MANUAL = 'MANUAL',
}

export enum JobType {
  FULLTIME = 'FULLTIME',
  PARTTIME = 'PARTTIME',
  INTERNSHIP = 'INTERNSHIP',
  CONTRACT = 'CONTRACT',
  REMOTE = 'REMOTE',
}

export interface Company {
  companyId: string;
  companyName: string;
  logo?: string;
  address?: string;
  description?: string;
  websiteUrl?: string;
  companySize?: number;
}

export interface Recruiter {
  recruiterId: string;
  bio?: string;
  position?: string;
  user?: {
    email: string;
  };
}

export interface JobPosting {
  jobPostingId: string;
  title: string;
  description?: string;
  requirements?: string;
  benefits?: string;
  salaryMin?: number;
  salaryMax?: number;
  currency?: string;
  jobType?: JobType;
  experience?: string;
  vacancies: number;
  locationCity?: string;
  deadline?: string;
  status: JobStatus;
  postType: PostType;
  isVerified: boolean;
  originalUrl: string;
  aiReliabilityScore: number;
  createdAt: string;
  updatedAt: string;
  companyId: string;
  company?: Company;
  recruiter?: Recruiter;
}

export type CrawlLogStatus = 'RUNNING' | 'SUCCESS' | 'FAILED';

export interface CrawlLog {
  crawlLogId: string;
  providerName: string;
  status: CrawlLogStatus;
  itemsProcessed: number;
  errorMessage?: string;
  startTime: string;
  endTime?: string;
}

// ─── Crawl Logs ───────────────────────────────────────────────────────────────

export const crawlLogsApi = {
  getAll: (): Promise<CrawlLog[]> =>
    api.get('/admin/crawl-logs').then((r) => r.data),
};

// ─── Rapid Job API ────────────────────────────────────────────────────────────

export const rapidJobApi = {
  // Stats
  getStats: () => api.get('/rapid-job/stats').then((r) => r.data),

  // Triggers
  triggerJSearch: () => api.post('/rapid-job/crawl/jsearch').then((r) => r.data),
  triggerLinkedIn: () => api.post('/rapid-job/crawl/linkedin').then((r) => r.data),
  triggerLinkedInV2: () => api.post('/rapid-job/crawl/linkedin-v2').then((r) => r.data),
  triggerJPF: () => api.post('/rapid-job/crawl/jpf').then((r) => r.data),

  // Save Preview
  savePreviewJobs: (data: { jobs: any[]; providerId: string }) =>
    api.post('/rapid-job/save-preview', data).then((r) => r.data),

  // Previews / Tests
  previewJSearch: (params: { q: string; page?: string; country?: string; date_posted?: string }) =>
    api.get('/rapid-job/search', { params }).then((r) => r.data),
  previewLinkedIn: (params: { q: string; location?: string }) =>
    api.get('/rapid-job/linkedin', { params }).then((r) => r.data),
  previewLinkedInV2: (params: { q: string; location?: string }) =>
    api.get('/rapid-job/linkedin-v2', { params }).then((r) => r.data),
  previewJPF: (params: { limit?: string }) =>
    api.get('/rapid-job/jpf', { params }).then((r) => r.data),
};

// ─── Admin Job Posting Management ─────────────────────────────────────────────

export interface AdminFilterJobPostingDto {
  status?: JobStatus;
  postType?: PostType;
  minAiScore?: number;
  searchTerm?: string;
}

export interface PaginatedJobPostings {
  items: JobPosting[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export const adminJobsApi = {
  getAll: (filters: AdminFilterJobPostingDto, page = 1, limit = 10): Promise<PaginatedJobPostings> =>
    api.get('/admin/job-postings', { params: { ...filters, page, limit } }).then((r) => r.data),

  approve: (id: string): Promise<JobPosting> =>
    api.patch(`/admin/job-postings/${id}/approve`).then((r) => r.data),

  reject: (id: string): Promise<JobPosting> =>
    api.patch(`/admin/job-postings/${id}/reject`).then((r) => r.data),

  bulkDelete: (filters: AdminFilterJobPostingDto): Promise<{ count: number }> =>
    api.delete('/admin/job-postings/bulk', { params: filters }).then((r) => r.data),
    
  bulkApprove: (filters: AdminFilterJobPostingDto): Promise<{ count: number }> =>
    api.patch('/admin/job-postings/bulk-approve', { params: filters }).then((r) => r.data),
};
