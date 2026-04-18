import { Injectable } from '@nestjs/common';
import { KeywordStrategy } from './strategies/keyword.strategy';
import { SemanticStrategy } from './strategies/semantic.strategy';
import { ExperienceStrategy } from './strategies/experience.strategy';
import { EducationStrategy } from './strategies/education.strategy';
import { HardFilterStrategy } from './strategies/hard-filter.strategy';
import { IMatchingStrategy } from '../interfaces/matching.interface';

@Injectable()
export class MatchingStrategyFactory {
  constructor(
    private readonly keywordStrategy: KeywordStrategy,
    private readonly semanticStrategy: SemanticStrategy,
    private readonly experienceStrategy: ExperienceStrategy,
    private readonly educationStrategy: EducationStrategy,
    private readonly hardFilterStrategy: HardFilterStrategy,
  ) {}

  getStrategy(name: 'keyword' | 'semantic' | 'experience' | 'education' | 'hardFilter'): IMatchingStrategy {
    const strategies: Record<string, IMatchingStrategy> = {
      keyword: this.keywordStrategy,
      semantic: this.semanticStrategy,
      experience: this.experienceStrategy,
      education: this.educationStrategy,
      hardFilter: this.hardFilterStrategy,
    };

    const strategy = strategies[name];
    if (!strategy) throw new Error(`Strategy ${name} not found`);
    return strategy;
  }
}
