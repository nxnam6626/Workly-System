import api from '@/lib/api';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CrawlConfig {
  id: number;
  schedule: string;
  titleSelector: string;
  descriptionSelector: string;
  salarySelector?: string;
  renderJs: boolean;
}

export interface CrawlSource {
  crawlSourceId: string;
  sourceName: string;
  baseUrl: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  config: CrawlConfig | null;
}

export interface CreateCrawlSourceDto {
  sourceName: string;
  baseUrl: string;
  isActive?: boolean;
  schedule: string;
  titleSelector: string;
  descriptionSelector: string;
  salarySelector?: string;
  renderJs?: boolean;
}

export type UpdateCrawlSourceDto = Partial<CreateCrawlSourceDto>;

export interface FilterRule {
  id: number;
  sourceId: number;
  keyword: string;
  action: 'INCLUDE' | 'EXCLUDE';
  minReliabilityScore?: number;
  createdAt: string;
}

export interface CreateFilterRuleDto {
  keyword: string;
  action: 'INCLUDE' | 'EXCLUDE';
  minReliabilityScore?: number;
}

export interface TestCrawlDto {
  baseUrl: string;
  titleSelector: string;
  descriptionSelector: string;
  salarySelector?: string;
  renderJs?: boolean;
}

export interface CrawledJobPreview {
  title: string;
  salary?: string;
  description?: string;
  originalUrl: string;
}

export type CrawlLogStatus = 'RUNNING' | 'SUCCESS' | 'FAILED';

export interface CrawlLog {
  id: number;
  sourceId: number;
  sourceName: string;
  status: CrawlLogStatus;
  itemsProcessed: number;
  errorMessage?: string;
  startedAt: string;
  finishedAt?: string;
}

// ─── Crawl Sources ────────────────────────────────────────────────────────────

export const crawlSourcesApi = {
  getAll: (): Promise<CrawlSource[]> =>
    api.get('/admin/crawl-sources').then((r) => r.data),

  getById: (id: number): Promise<CrawlSource> =>
    api.get(`/admin/crawl-sources/${id}`).then((r) => r.data),

  create: (dto: CreateCrawlSourceDto): Promise<CrawlSource> =>
    api.post('/admin/crawl-sources', dto).then((r) => r.data),

  update: (id: number, dto: UpdateCrawlSourceDto): Promise<CrawlSource> =>
    api.patch(`/admin/crawl-sources/${id}`, dto).then((r) => r.data),

  delete: (id: number): Promise<void> =>
    api.delete(`/admin/crawl-sources/${id}`).then(() => undefined),
};

// ─── Test Crawl ───────────────────────────────────────────────────────────────

export const testCrawl = (dto: TestCrawlDto): Promise<CrawledJobPreview[]> =>
  api.post('/admin/crawler/test-crawl', dto).then((r) => r.data);

// ─── Filter Rules ─────────────────────────────────────────────────────────────

export const filterRulesApi = {
  getBySource: (sourceId: number): Promise<FilterRule[]> =>
    api.get(`/admin/crawl-sources/${sourceId}/filter-rules`).then((r) => r.data),

  create: (sourceId: number, dto: CreateFilterRuleDto): Promise<FilterRule> =>
    api.post(`/admin/crawl-sources/${sourceId}/filter-rules`, dto).then((r) => r.data),

  update: (id: number, dto: Partial<CreateFilterRuleDto>): Promise<FilterRule> =>
    api.patch(`/admin/filter-rules/${id}`, dto).then((r) => r.data),

  delete: (id: number): Promise<void> =>
    api.delete(`/admin/filter-rules/${id}`).then(() => undefined),
};

// ─── Crawl Logs ───────────────────────────────────────────────────────────────

export const crawlLogsApi = {
  getAll: (sourceId?: number): Promise<CrawlLog[]> =>
    api
      .get('/admin/crawl-logs', { params: sourceId ? { sourceId } : {} })
      .then((r) => r.data),
};
