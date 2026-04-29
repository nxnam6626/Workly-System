import { Injectable } from '@nestjs/common';
import { Client } from '@elastic/elasticsearch';

@Injectable()
export class JobEsService {
  constructor(private readonly client: Client) { }

  async ensureIndexExists() {
    const index = 'jobs';
    const exists = await this.client.indices.exists({ index });

    if (!exists.body) {
      await this.client.indices.create({
        index,
        body: {
          mappings: {
            properties: {
              title: { type: 'text', analyzer: 'standard' },
              description: { type: 'text', analyzer: 'standard' },
              companyName: { type: 'text', analyzer: 'standard' },
              locationCity: { type: 'keyword' },
              jobType: { type: 'keyword' },
              industry: { type: 'keyword' },
              experience: { type: 'keyword' },
              status: { type: 'keyword' },
              salaryMin: { type: 'integer' },
              salaryMax: { type: 'integer' },
              createdAt: { type: 'date' },
              refreshedAt: { type: 'date' },
              companyId: { type: 'keyword' },
              jobTier: { type: 'keyword' },
              jobLevel: { type: 'keyword' },
              originalUrl: { type: 'keyword' },
            },
          },
        },
      });
    }
  }

  async recreateIndex() {
    const index = 'jobs';
    const exists = await this.client.indices.exists({ index });
    if (exists.body) await this.client.indices.delete({ index });
    await this.ensureIndexExists();
  }

  async indexJob(job: any) {
    try {
      await this.client.index({
        index: 'jobs',
        id: job.id,
        body: {
          title: job.title,
          description: job.description,
          companyId: job.companyId,
          companyName: job.companyName,
          originalUrl: job.originalUrl,
          locationCity: job.locationCity,
          jobType: job.jobType,
          salaryMin: job.salaryMin,
          salaryMax: job.salaryMax,
          experience: job.experience,
          industry: job.industry,
          status: job.status,
          createdAt: job.createdAt || new Date(),
          refreshedAt: job.refreshedAt || new Date(),
          jobTier: job.jobTier || 'BASIC',
          jobLevel: job.jobLevel || 'STAFF',
        },
      });
    } catch (e: any) {
      console.error('[JobEsService] Error indexing job:', e.message);
    }
  }

  async deleteJob(jobId: string) {
    try {
      await this.client.delete({ index: 'jobs', id: jobId });
    } catch (e: any) {
      if (e.meta?.statusCode !== 404) {
        console.error('[JobEsService] Error deleting job:', e.message);
      }
    }
  }

  async searchJobs(params: any) {
    const { search, location, jobTier, jobLevel, jobType, industry, experience, salaryMin, salaryMax, rank, education, sortBy, page = 1, limit = 10 } = params;
    const skip = (page - 1) * limit;

    const must: any[] = [{ match: { status: 'APPROVED' } }];
    const filter: any[] = [];
    const should: any[] = [
      { term: { jobTier: { value: 'URGENT', boost: 5 } } },
      { term: { jobTier: { value: 'PROFESSIONAL', boost: 2 } } }
    ];

    if (search) {
      must.push({
        bool: {
          must: [{ multi_match: { query: search, fields: ['title^3', 'companyName^2', 'description', 'locationCity'], fuzziness: 'AUTO', operator: 'or', minimum_should_match: '70%' } }],
          should: [{ match_phrase: { title: { query: search, boost: 10 } } }, { match_phrase: { description: { query: search, boost: 2 } } }]
        }
      });
    }

    if (location) filter.push({ match: { locationCity: { query: location, fuzziness: 'AUTO' } } });
    if (jobTier) filter.push({ term: { jobTier } });
    if (jobLevel) filter.push({ term: { jobLevel } });
    if (jobType) filter.push({ term: { jobType } });
    if (industry) filter.push(Array.isArray(industry) ? { terms: { industry } } : { term: { industry } });
    if (experience) filter.push({ match: { experience } });

    if (salaryMin || salaryMax) {
      const range: any = {};
      if (salaryMin) range.gte = salaryMin;
      if (salaryMax) range.lte = salaryMax;
      filter.push({ range: { salaryMax: range } });
    }

    let sort: any[] = [];
    if (sortBy === 'new') sort = [{ createdAt: 'desc' }, { jobTier: 'desc' }];
    else if (sortBy === 'updated') sort = [{ refreshedAt: 'desc' }, { jobTier: 'desc' }];
    else if (sortBy === 'salary') sort = [{ salaryMax: 'desc' }, { jobTier: 'desc' }];
    else sort = search ? [{ _score: 'desc' }, { jobTier: 'desc' }, { refreshedAt: 'desc' }] : [{ jobTier: 'desc' }, { refreshedAt: 'desc' }];

    try {
      const result = await this.client.search({
        index: 'jobs',
        from: skip,
        size: limit,
        body: { query: { bool: { must, filter, should } }, sort },
      });
      const hits = result.body.hits;
      return { ids: hits.hits.map((h: any) => h._id), total: typeof hits.total === 'number' ? hits.total : hits.total.value };
    } catch (e: any) {
      console.error('[JobEsService] Search error:', e.message);
      throw e;
    }
  }

  async searchJobsForRAG(params: any) {
    const { search, location, jobType, limit = 3, expandedKeywords = [] } = params;
    const query: any = { bool: { must: [{ match: { status: 'APPROVED' } }], should: [], filter: [] } };

    if (location) query.bool.filter.push({ match: { locationCity: location } });
    if (jobType) query.bool.filter.push({ match: { jobType: jobType } });

    const allKeywords = [...new Set([search, ...expandedKeywords])].filter(Boolean);
    if (allKeywords.length > 0) {
      allKeywords.forEach((kw) => {
        query.bool.should.push({ multi_match: { query: kw, fields: ['title^5', 'companyName^2', 'description'], fuzziness: 'AUTO', boost: kw === search ? 3 : 1 } });
      });
      query.bool.minimum_should_match = 1;
    }

    try {
      const result = await this.client.search({ index: 'jobs', size: limit, body: { query } });
      return result.body.hits.hits.map((h: any) => ({ id: h._id, ...h._source, score: h._score }));
    } catch (e: any) {
      console.error('[JobEsService] RAG Search error:', e.message);
      return [];
    }
  }
}
