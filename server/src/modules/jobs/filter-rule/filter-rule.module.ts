import { Module } from '@nestjs/common';
import { FilterRuleService } from './filter-rule.service';
import { FilterRuleController, FilterRuleNestedController } from './filter-rule.controller';

@Module({
  providers: [FilterRuleService],
  controllers: [FilterRuleController, FilterRuleNestedController]
})
export class FilterRuleModule {}
