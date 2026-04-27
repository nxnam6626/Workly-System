import { Module } from '@nestjs/common';
import { CandidatesController } from './candidates.controller';
import { CandidatesService } from './candidates.service';
import { CvParsingService } from './cv-parsing.service';
import { PrismaModule } from '../../prisma/prisma.module';

import { MatchingEngineModule } from '../matching-engine/matching-engine.module';

@Module({
  imports: [PrismaModule, MatchingEngineModule],
  controllers: [CandidatesController],
  providers: [CandidatesService, CvParsingService],
  exports: [CandidatesService, CvParsingService],
})
export class CandidatesModule {}
