import { Module } from '@nestjs/common';
import { DataParserService } from './services/data-parser.service';
import { ScoringEngineService } from './services/scoring-engine.service';
import { MatchAnalysisService } from './services/match-analysis.service';
import { MatchingStrategyFactory } from './services/matching-strategy.factory';
import { KeywordStrategy } from './services/strategies/keyword.strategy';
import { SemanticStrategy } from './services/strategies/semantic.strategy';
import { ExperienceStrategy } from './services/strategies/experience.strategy';
import { EducationStrategy } from './services/strategies/education.strategy';
import { HardFilterStrategy } from './services/strategies/hard-filter.strategy';
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
    HardFilterStrategy,
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
