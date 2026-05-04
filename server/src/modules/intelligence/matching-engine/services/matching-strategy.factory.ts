import { Injectable } from '@nestjs/common';
import { KeywordStrategy } from './strategies/keyword.strategy';
import { SemanticStrategy } from './strategies/semantic.strategy';
import { ExperienceStrategy } from './strategies/experience.strategy';
import { EducationStrategy } from './strategies/education.strategy';
import { LocationStrategy } from './strategies/location.strategy';
import { SalaryStrategy } from './strategies/salary.strategy';
import { IndustryStrategy } from './strategies/industry.strategy';
import { JobTitleStrategy } from './strategies/job-title.strategy';
import { LanguageStrategy } from './strategies/language.strategy';
import { RelevantExpStrategy } from './strategies/relevant-exp.strategy';
import { IMatchingStrategy } from '../interfaces/matching.interface';

@Injectable()
export class MatchingStrategyFactory {
  constructor(
    private readonly keywordStrategy: KeywordStrategy,
    private readonly semanticStrategy: SemanticStrategy,
    private readonly experienceStrategy: ExperienceStrategy,
    private readonly educationStrategy: EducationStrategy,
    private readonly locationStrategy: LocationStrategy,
    private readonly salaryStrategy: SalaryStrategy,
    private readonly industryStrategy: IndustryStrategy,
    private readonly jobTitleStrategy: JobTitleStrategy,
    private readonly languageStrategy: LanguageStrategy,
    private readonly relevantExpStrategy: RelevantExpStrategy,
  ) {}

  getStrategy(name: string): IMatchingStrategy {
    const strategies: Record<string, IMatchingStrategy> = {
      keyword: this.keywordStrategy,
      semantic: this.semanticStrategy,
      experience: this.experienceStrategy,
      education: this.educationStrategy,
      location: this.locationStrategy,
      salary: this.salaryStrategy,
      industry: this.industryStrategy,
      jobTitle: this.jobTitleStrategy,
      language: this.languageStrategy,
      relevantExp: this.relevantExpStrategy,
    };

    const strategy = strategies[name];
    if (!strategy) throw new Error(`Strategy ${name} not found`);
    return strategy;
  }
}
