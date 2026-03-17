import { Test, TestingModule } from '@nestjs/testing';
import { CrawlSourceService } from './crawl-source.service';

describe('CrawlSourceService', () => {
  let service: CrawlSourceService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CrawlSourceService],
    }).compile();

    service = module.get<CrawlSourceService>(CrawlSourceService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
