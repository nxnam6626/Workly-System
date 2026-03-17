import { Test, TestingModule } from '@nestjs/testing';
import { FilterRuleService } from './filter-rule.service';

describe('FilterRuleService', () => {
  let service: FilterRuleService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [FilterRuleService],
    }).compile();

    service = module.get<FilterRuleService>(FilterRuleService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
