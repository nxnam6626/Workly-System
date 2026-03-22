import api from '@/lib/api';

export enum JobStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  EXPIRED = 'EXPIRED',
}

export enum PostType {
  MANUAL = 'MANUAL',
  CRAWLED = 'CRAWLED',
}

export interface JobPosting {
  jobPostingId: string;
  title: string;
  companyName: string;
  location: string;
  salary?: string;
  description?: string;
  status: JobStatus;
  postType: PostType;
  aiReliabilityScore: number;
  crawlSourceId?: string;
  createdAt: string;
  updatedAt: string;
  originalUrl?: string;
}

export interface AdminFilterJobPostingDto {
  status?: JobStatus;
  postType?: PostType;
  minAiScore?: number;
  crawlSourceId?: number;
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
