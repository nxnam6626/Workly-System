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

    } catch (e: any) {
      console.warn('[SearchService] Could not connect to Elasticsearch:', e.message);
    }
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

  async indexJob(job: { id: string; title: string; companyId: string; crawlSourceId?: string; originalUrl?: string; description?: string }) {
    try {
      await this.client.index({
        index: 'jobs',
        id: job.id,
        body: {
          title: job.title,
          description: job.description,
          companyId: job.companyId,
          crawlSourceId: job.crawlSourceId,
          originalUrl: job.originalUrl,
        },
      });
      console.log(`[SearchService] Indexed job ${job.id}`);
    } catch (e: any) {
      console.error('[SearchService] Error indexing job:', e.message);
    }
  }
}
