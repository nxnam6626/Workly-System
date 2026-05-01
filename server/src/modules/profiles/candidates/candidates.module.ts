import { Module } from '@nestjs/common';
import { CandidatesController } from './candidates.controller';
import { CandidatesService } from './candidates.service';
import { CvParsingService } from './cv-parsing.service';
import { PrismaModule } from '@/prisma/prisma.module';

import { MatchingEngineModule } from '@/modules/intelligence/matching-engine/matching-engine.module';

import { CandidateProfileService } from './services/candidate-profile.service';
import { CandidateCvService } from './services/candidate-cv.service';
import { CandidateMatchingService } from './services/candidate-matching.service';
import { CandidateSearchService } from './services/candidate-search.service';
import { CandidateManagementService } from './services/candidate-management.service';
import { CandidateInteractionService } from './services/candidate-interaction.service';
import { BullModule } from '@nestjs/bullmq';

@Module({
  imports: [
    PrismaModule,
    MatchingEngineModule,
    BullModule.registerQueue({ name: 'matching' }),
  ],
  controllers: [CandidatesController],
  providers: [
    CandidatesService,
    CvParsingService,
    CandidateProfileService,
    CandidateCvService,
    CandidateMatchingService,
    CandidateSearchService,
    CandidateManagementService,
    CandidateInteractionService,
  ],
  exports: [
    CandidatesService,
    CvParsingService,
    CandidateProfileService,
    CandidateCvService,
    CandidateMatchingService,
    CandidateSearchService,
    CandidateManagementService,
    CandidateInteractionService,
  ],
})
export class CandidatesModule {}
