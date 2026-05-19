import { NestFactory } from '@nestjs/core';
import { AppModule } from './src/app.module';
import { MatchingOrchestratorService } from './src/modules/intelligence/matching-engine/services/matching-orchestrator.service';
import { PrismaService } from './src/prisma/prisma.service';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const orchestrator = app.get(MatchingOrchestratorService);
  const prisma = app.get(PrismaService);

  console.log('Recalculating all job matches safely without AI calls...');

  const matches = await prisma.jobMatch.findMany({
    include: {
      jobPosting: true,
      candidate: {
        include: { cvs: { where: { isMain: true } } }
      }
    }
  });

  let count = 0;
  for (const match of matches) {
    const job = match.jobPosting;
    const cv = match.candidate?.cvs?.[0];
    if (!job || !cv) continue;

    try {
      const { finalScore, breakdown, details } = await orchestrator['scoringEngine'].calculateFinalScore(job, cv);
      const analysis = orchestrator['matchAnalysis'].generateAnalysis(breakdown, details);
      
      await prisma.jobMatch.update({
        where: { matchId: match.matchId },
        data: {
          score: finalScore,
          matchedSkills: analysis.skillsAnalysis.matchedSkills,
          details: { breakdown, details },
        }
      });
      count++;
    } catch (e) {
      console.error('Error on match', match.matchId, e.message);
    }
  }

  console.log(`Successfully recalculated ${count} matches.`);
  await app.close();
}

bootstrap();
