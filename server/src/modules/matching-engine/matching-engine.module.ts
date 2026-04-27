import { Module } from '@nestjs/common';
import { DataParserService } from './services/data-parser.service';
import { ScoringEngineService } from './services/scoring-engine.service';
import { MatchAnalysisService } from './services/match-analysis.service';
import { MatchingStrategyFactory } from './services/matching-strategy.factory';
import { KeywordStrategy } from './services/strategies/keyword.strategy';
import { SemanticStrategy } from './services/strategies/semantic.strategy';
import { ExperienceStrategy } from './services/strategies/experience.strategy';
import { EducationStrategy } from './services/strategies/education.strategy';
import { LocationStrategy } from './services/strategies/location.strategy';
import { SalaryStrategy } from './services/strategies/salary.strategy';
import { IndustryStrategy } from './services/strategies/industry.strategy';
import { JobTitleStrategy } from './services/strategies/job-title.strategy';
import { LanguageStrategy } from './services/strategies/language.strategy';
import { RelevantExpStrategy } from './services/strategies/relevant-exp.strategy';
import { MatchingOrchestratorService } from './services/matching-orchestrator.service';
import { PrismaModule } from '../../prisma/prisma.module';
import { AiModule } from '../ai/ai.module';

@Module({
  imports: [PrismaModule, AiModule],
  providers: [
    DataParserService,
    ScoringEngineService,
    MatchAnalysisService,
    MatchingStrategyFactory,
    KeywordStrategy,
    SemanticStrategy,
    ExperienceStrategy,
    EducationStrategy,
    LocationStrategy,
    SalaryStrategy,
    IndustryStrategy,
    JobTitleStrategy,
    LanguageStrategy,
    RelevantExpStrategy,
    MatchingOrchestratorService,
  ],
  exports: [
    DataParserService,
    ScoringEngineService,
    MatchAnalysisService,
    MatchingStrategyFactory,
    MatchingOrchestratorService,
  ],
})
export class MatchingEngineModule {}
