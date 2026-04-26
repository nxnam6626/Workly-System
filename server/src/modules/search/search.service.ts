import { Injectable, OnModuleInit } from '@nestjs/common';
import { Client } from '@elastic/elasticsearch';

@Injectable()
export class SearchService implements OnModuleInit {
  private readonly client: Client;

  constructor() {
    this.client = new Client({
      node: process.env.ELASTICSEARCH_NODE || 'http://localhost:9200',
      maxRetries: 0,
    });
  }

  async onModuleInit() {
    try {
      await this.client.ping();
      await this.ensureIndexExists();
    } catch (e: any) {
      console.warn(
        '[SearchService] Could not connect to Elasticsearch:',
        e.message,
      );
    }
  }

  private async ensureIndexExists() {
    const index = 'jobs';
    const exists = await this.client.indices.exists({ index });

    if (!exists.body) {
      console.log(`[SearchService] Creating index "${index}"...`);
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
    if (exists.body) {
      await this.client.indices.delete({ index });
      console.log(`[SearchService] Index "${index}" deleted.`);
    }
    await this.ensureIndexExists();
  }

  async indexUser(user: { id: string; email: string; roles: string[] }) {
    try {
      await this.client.index({
        index: 'users',
        id: user.id,
        body: {
          email: user.email,
          roles: user.roles,
        },
      });
      console.log(`[SearchService] Indexed user ${user.id}`);
    } catch (e: any) {
      console.error('[SearchService] Error indexing user:', e.message);
    }
  }

  async indexJob(job: {
    id: string;
    title: string;
    companyId: string;
    originalUrl?: string;
    description?: string;
    locationCity?: string;
    jobType?: string;
    salaryMin?: number;
    salaryMax?: number;
    experience?: string;
    industry?: string | string[];
    status?: string;
    companyName?: string;
    createdAt?: Date | string;
    refreshedAt?: Date | string;
    jobTier?: string;
  }) {
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
        },
      });
      console.log(`[SearchService] Indexed job ${job.id}`);
    } catch (e: any) {
      console.error('[SearchService] Error indexing job:', e.message);
    }
  }

  async deleteJob(jobId: string) {
    try {
      await this.client.delete({
        index: 'jobs',
        id: jobId,
      });
      console.log(`[SearchService] Deleted job ${jobId} from index`);
    } catch (e: any) {
      // Ignore if not found
      if (e.meta?.statusCode !== 404) {
        console.error('[SearchService] Error deleting job:', e.message);
      }
    }
  }

  async searchJobs(params: {
    search?: string;
    location?: string;
    jobTier?: string;
    jobType?: string;
    industry?: string | string[];
    experience?: string;
    salaryMin?: number;
    salaryMax?: number;
    rank?: string;
    education?: string;
    sortBy?: string;
    page?: number;
    limit?: number;
  }) {
    const {
      search,
      location,
      jobTier,
      jobType,
      industry,
      experience,
      salaryMin,
      salaryMax,
      rank,
      education,
      sortBy,
      page = 1,
      limit = 10,
    } = params;

    const skip = (page - 1) * limit;

    const must: any[] = [{ match: { status: 'APPROVED' } }];
    const filter: any[] = [];

    if (search) {
      const matchQuery = {
        bool: {
          must: [
            {
              multi_match: {
                query: search,
                fields: ['title^3', 'companyName^2', 'description', 'locationCity'],
                fuzziness: 'AUTO',
                operator: 'or',
                minimum_should_match: '70%',
              },
            }
          ],
          should: [
            {
              match_phrase: {
                title: {
                  query: search,
                  boost: 10,
                },
              },
            },
            {
              match_phrase: {
                description: {
                  query: search,
                  boost: 2,
                },
              },
            }
          ]
        }
      };
      must.push(matchQuery);
    }

    const should: any[] = [];
    
    // Tier-based Boosting (URGENT > PROFESSIONAL > BASIC)
    should.push(
      {
        term: {
          jobTier: {
            value: 'URGENT',
            boost: 5,
          },
        },
      },
      {
        term: {
          jobTier: {
            value: 'PROFESSIONAL',
            boost: 2,
          },
        },
      }
    );

    if (location) {
      filter.push({
        match: {
          locationCity: {
            query: location,
            fuzziness: 'AUTO',
          },
        },
      });
    }

    if (jobTier) {
      filter.push({ term: { jobTier } });
    }

    if (jobType) {
      filter.push({ term: { jobType } });
    }

    if (industry) {
      if (Array.isArray(industry)) {
        filter.push({
          terms: {
            industry: industry
          },
        });
      } else {
        filter.push({
          term: {
            industry: industry
          },
        });
      }
    }

    if (experience) {
      filter.push({ match: { experience } });
    }

    if (rank) {
      filter.push({
        multi_match: {
          query: rank,
          fields: ['title^2', 'description', 'structuredRequirements'],
          fuzziness: 'AUTO',
        },
      });
    }

    if (education) {
      filter.push({
        multi_match: {
          query: education,
          fields: ['description', 'requirements', 'structuredRequirements'],
          fuzziness: 'AUTO',
        },
      });
    }

    // Salary range filter
    const isValidSalaryMin =
      salaryMin !== undefined && salaryMin !== null && !isNaN(salaryMin);
    const isValidSalaryMax =
      salaryMax !== undefined && salaryMax !== null && !isNaN(salaryMax);

    if (isValidSalaryMin || isValidSalaryMax) {
      const range: any = {};
      if (isValidSalaryMin) range.gte = salaryMin;
      if (isValidSalaryMax) range.lte = salaryMax;

      if (Object.keys(range).length > 0) {
        filter.push({ range: { salaryMax: range } });
      }
    }

    try {
      // Sắp xếp động
      let sort: any[] = [];
      if (sortBy === 'new') {
        sort = [{ createdAt: 'desc' }, { jobTier: 'desc' }];
      } else if (sortBy === 'updated') {
        sort = [{ refreshedAt: 'desc' }, { jobTier: 'desc' }];
      } else if (sortBy === 'salary') {
        sort = [{ salaryMax: 'desc' }, { jobTier: 'desc' }];
      } else {
        // Mặc định (suitable)
        sort = search 
          ? [{ _score: 'desc' }, { jobTier: 'desc' }, { refreshedAt: 'desc' }]
          : [{ jobTier: 'desc' }, { refreshedAt: 'desc' }];
      }

      const queryParams: any = {
        index: 'jobs',
        from: skip,
        size: limit,
        body: {
          query: {
            bool: {
              must,
              filter,
              should,
            },
          },
          sort: sort,
        },
      };

      const result = await this.client.search(queryParams);

      const hits = result.body.hits;
      const total =
        typeof hits.total === 'number' ? hits.total : hits.total.value;
      const ids = hits.hits.map((hit: any) => hit._id);

      return { ids, total };
    } catch (e: any) {
      console.error('[SearchService] Search error:', e.message);
      throw e;
    }
  }

  async searchJobsForRAG(params: {
    search?: string;
    location?: string;
    jobType?: string;
    limit?: number;
    expandedKeywords?: string[];
  }) {
    const {
      search,
      location,
      jobType,
      limit = 3,
      expandedKeywords = [],
    } = params;

    const query: any = {
      bool: {
        must: [{ match: { status: 'APPROVED' } }],
        should: [],
        filter: [],
      },
    };

    if (location) {
      query.bool.filter.push({ match: { locationCity: location } });
    }

    if (jobType) {
      query.bool.filter.push({ match: { jobType: jobType } });
    }

    // Combine original search and expanded keywords
    const allKeywords = [...new Set([search, ...expandedKeywords])].filter(
      Boolean,
    );

    if (allKeywords.length > 0) {
      allKeywords.forEach((kw) => {
        const isOriginal = kw === search;
        query.bool.should.push({
          multi_match: {
            query: kw,
            fields: ['title^5', 'companyName^2', 'description'],
            fuzziness: 'AUTO',
            boost: isOriginal ? 3 : 1, // Boost original query higher
          },
        });
      });
      query.bool.minimum_should_match = 1;
    }

    try {
      const result = await this.client.search({
        index: 'jobs',
        size: limit,
        body: { query },
      });

      const hits = result.body.hits;
      return hits.hits.map((hit: any) => ({
        id: hit._id,
        ...hit._source,
        score: hit._score,
      }));
    } catch (e: any) {
      console.error('[SearchService] RAG Search error:', e.message);
      return [];
    }
  }
}
