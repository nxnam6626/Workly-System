import { Injectable, OnModuleInit } from '@nestjs/common';
import { Client } from '@elastic/elasticsearch';
import { JobEsService } from './services/job-es.service';
import { UserEsService } from './services/user-es.service';

@Injectable()
export class SearchService implements OnModuleInit {
  constructor(
    private readonly client: Client,
    private readonly jobEsService: JobEsService,
    private readonly userEsService: UserEsService,
  ) { }

  async onModuleInit() {
    try {
      await this.client.ping();
      await this.jobEsService.ensureIndexExists();
    } catch (e: any) {
      console.warn('[SearchService] Could not connect to Elasticsearch:', e.message);
    }
  }

  // --- Job Index Operations ---
  async recreateIndex() {
    return this.jobEsService.recreateIndex();
  }

  async indexJob(job: any) {
    return this.jobEsService.indexJob(job);
  }

  async deleteJob(jobId: string) {
    return this.jobEsService.deleteJob(jobId);
  }

  async searchJobs(params: any) {
    return this.jobEsService.searchJobs(params);
  }

  async searchJobsForRAG(params: any) {
    return this.jobEsService.searchJobsForRAG(params);
  }

  // --- User Index Operations ---
  async indexUser(user: { id: string; email: string; roles: string[] }) {
    return this.userEsService.indexUser(user);
  }
}
