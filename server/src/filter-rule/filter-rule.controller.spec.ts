import { Test, TestingModule } from '@nestjs/testing';
import { FilterRuleController } from './filter-rule.controller';

describe('FilterRuleController', () => {
  let controller: FilterRuleController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FilterRuleController],
    }).compile();

    controller = module.get<FilterRuleController>(FilterRuleController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
