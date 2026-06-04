/**
 * Script: Rerun matching for a specific candidate
 * Usage: npx ts-node -r tsconfig-paths/register src/scripts/rerun-matching.ts
 */
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { MatchingOrchestratorService } from '../modules/intelligence/matching-engine/services/matching-orchestrator.service';
import { PrismaService } from '../prisma/prisma.service';

async function main() {
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn', 'log'],
  });

  const prisma = app.get(PrismaService);
  const orchestrator = app.get(MatchingOrchestratorService);

  const candidate = await prisma.candidate.findFirst({
    where: { fullName: { contains: 'Nguyễn Ngọc Thanh' } },
    select: { candidateId: true, userId: true, fullName: true },
  });

  const CANDIDATE_ID = candidate?.candidateId;

  if (!candidate) {
    console.error('❌ Candidate not found with ID:', CANDIDATE_ID);
    await app.close();
    return;
  }

  console.log(`✅ Found candidate: ${candidate.fullName}`);
  console.log(`📋 userId: ${candidate.userId}`);
  console.log('🔄 Re-running matching with updated AI prompt...\n');

  try {
    await orchestrator.runMatchingForCandidate(candidate.userId);
    console.log(
      '✅ Matching completed! Checking updated relevantExpDetails...',
    );

    // Kiểm tra kết quả mới
    const matches = await prisma.jobMatch.findMany({
      where: { candidateId: CANDIDATE_ID },
      select: {
        score: true,
        details: true,
        jobPosting: { select: { title: true } },
      },
      orderBy: { score: 'desc' },
      take: 3,
    });

    for (const m of matches) {
      const d = (m.details as any)?.details || m.details as any;
      console.log(`\n📌 Job: ${m.jobPosting.title} | Score: ${m.score}%`);
      if (d?.relevantExpDetails) {
        console.log('  jobRequirements:', d.relevantExpDetails.jobRequirements);
        console.log('  candidateExps:', d.relevantExpDetails.candidateExps);
        console.log(
          '  scoreExplanation:',
          d.relevantExpDetails.scoreExplanation,
        );
      } else {
        console.log('  ⚠️  No relevantExpDetails found');
      }
    }
  } catch (err) {
    console.error('❌ Error during matching:', err.message);
  }

  await app.close();
}

main().catch(console.error);
