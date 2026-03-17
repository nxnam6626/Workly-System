import { Test, TestingModule } from '@nestjs/testing';
import { CrawlSourceController } from './crawl-source.controller';

describe('CrawlSourceController', () => {
  let controller: CrawlSourceController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CrawlSourceController],
    }).compile();

    controller = module.get<CrawlSourceController>(CrawlSourceController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
