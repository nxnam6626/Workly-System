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
      console.log('[SearchService] Connected to Elasticsearch');
    } catch (e: any) {
      console.warn('[SearchService] Could not connect to Elasticsearch:', e.message);
    }
  }

  async indexUser(user: { id: string; email: string; role: string }) {
    try {
      await this.client.index({
        index: 'users',
        id: user.id,
        document: {
          email: user.email,
          role: user.role,
        },
      });
      console.log(`[SearchService] Indexed user ${user.id}`);
    } catch (e: any) {
      console.error('[SearchService] Error indexing user:', e.message);
    }
  }
}
