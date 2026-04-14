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
  status: JobStatus;
  postType: PostType;
  isVerified: boolean;
  originalUrl: string;
  aiReliabilityScore: number;
  createdAt: string;
  updatedAt: string;
  companyId: string;
  approvedBy?: string | null;
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

export interface AdminJobStats {
  totalPending: number;
  totalApproved: number;
  totalRejected: number;
  totalCrawled: number;
}

export interface PaginatedJobPostings {
  items: JobPosting[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export const adminJobsApi = {
  getAll: (
    filters: AdminFilterJobPostingDto,
    page = 1,
    limit = 10,
  ): Promise<PaginatedJobPostings> =>
    api
      .get(`/admin/job-postings`, { params: { ...filters, page, limit } })
      .then((r) => r.data),

  getStats: (): Promise<AdminJobStats> =>
    api.get(`/admin/job-postings/stats`).then((r) => r.data),

  approve: (id: string): Promise<JobPosting> =>
    api.patch(`/admin/job-postings/${id}/approve`).then((r) => r.data),

  reject: (id: string): Promise<JobPosting> =>
    api.patch(`/admin/job-postings/${id}/reject`).then((r) => r.data),

  bulkApprove: (ids: string[]): Promise<{ count: number }> =>
    api.patch('/admin/job-postings/bulk-approve', { ids }).then((r) => r.data),

  bulkReject: (ids: string[]): Promise<{ count: number }> =>
    api.patch('/admin/job-postings/bulk-reject', { ids }).then((r) => r.data),
};

// ─── Admin User Management ─────────────────────────────────────────────────────

export type UserStatus = 'ACTIVE' | 'LOCKED';

export interface AdminUser {
  userId: string;
  email: string;
  status: UserStatus;
  phoneNumber?: string;
  avatar?: string;
  isEmailVerified: boolean;
  createdAt: string;
  lastLogin?: string;
  userRoles: { role: { roleName: string } }[];
  candidate?: { fullName: string; phone: string };
  recruiter?: { position?: string; bio?: string; violationCount: number };
  admin?: { permissions: string[]; adminLevel: number };
}

export interface PaginatedUsers {
  data: AdminUser[];
  total: number;
  skip: number;
  take: number;
}

export interface AdminUserFilters {
  skip?: number;
  take?: number;
  role?: string;
  status?: UserStatus;
  search?: string;
}

export const adminUsersApi = {
  getAll: (filters: AdminUserFilters): Promise<PaginatedUsers> =>
    api.get('/users', { params: filters }).then((r) => r.data),

  getOne: (id: string): Promise<AdminUser> =>
    api.get(`/users/${id}`).then((r) => r.data),

  lock: (id: string): Promise<{ message: string }> =>
    api.patch(`/users/${id}/lock`).then((r) => r.data),

  unlock: (id: string): Promise<{ message: string }> =>
    api.patch(`/users/${id}/unlock`).then((r) => r.data),

  remove: (id: string): Promise<{ message: string }> =>
    api.delete(`/users/${id}`).then((r) => r.data),

  resetViolations: (id: string): Promise<{ message: string }> =>
    api.patch(`/users/${id}/reset-violations`).then((r) => r.data),

  updateRole: (id: string, role: string): Promise<AdminUser> =>
    api.patch(`/users/${id}`, { role }).then((r) => r.data),

  createAdmin: (data: any): Promise<{ message: string; userId: string }> =>
    api.post('/users', { ...data, role: 'ADMIN' }).then((r) => r.data),

  updateAdminPermissions: (id: string, permissions: string[]): Promise<{ message: string }> =>
    api.patch(`/users/${id}/admin-permissions`, { permissions }).then((r) => r.data),
};

// ─── Admin Dashboard ──────────────────────────────────────────────────────────

export interface DashboardStats {
  totalUsers: number;
  totalJobs: number;
  pendingJobs: number;
  crawlCount: number;
  approvalRate: number;
  totalApproved?: number;
  totalRejected?: number;
}

export interface RevenueStats {
  totalDepositVnd: number;
  totalDepositXu: number;
  depositCount: number;
  totalSpendingRevenue: number;
  packageSpend: number;
  packageCount: number;
  postJobSpend: number;
  postJobCount: number;
  openCvSpend: number;
  openCvCount: number;
  dailyRevenue: Record<string, number>;
  topSpenders: { companyName: string; balance: number; recruiterId: string; spentAmount: number }[];
}

export interface LatestViolation {
  recruiterId: string;
  companyName: string;
  email: string;
  avatar?: string;
  violationCount: number;
  status: string;
  updatedAt: string;
}

export interface ViolatingRecruiter {
  recruiterId: string;
  companyName: string;
  email: string;
  violationCount: number;
  status: string;
}

export const adminDashboardApi = {
  getStats: (): Promise<DashboardStats> =>
    api.get('/admin/dashboard/stats').then((r) => r.data),

  getRevenueStats: (): Promise<RevenueStats> =>
    api.get('/admin/revenue/stats').then((r) => r.data),

  getViolatingRecruiters: (): Promise<ViolatingRecruiter[]> =>
    api.get('/admin/recruiters/violations').then((r) => r.data),

  getLatestViolations: (): Promise<LatestViolation[]> =>
    api.get('/admin/violations/latest').then((r) => r.data),
};

// ─── Admin Support Management ──────────────────────────────────────────────────

export interface SupportRequest {
  requestId: string;
  name?: string;
  email: string;
  subject: string;
  message: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'CLOSED';
  createdAt: string;
  updatedAt: string;
  user?: {
    userId: string;
    email: string;
    status: string;
    userRoles: { role: { roleName: string } }[];
  } | null;
}

export const adminSupportApi = {
  getAll: (): Promise<SupportRequest[]> =>
    api.get('/support').then((r) => r.data),

  updateStatus: (id: string, status: 'OPEN' | 'IN_PROGRESS' | 'CLOSED'): Promise<SupportRequest> =>
    api.patch(`/support/${id}/status`, { status }).then((r) => r.data),
};
