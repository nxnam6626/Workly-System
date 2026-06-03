/**
 * Script: Clear job match records for a candidate to force re-matching
 * Uses raw PrismaClient (no NestJS context) to avoid connection pool issues
 * Usage: npx ts-node src/scripts/clear-matches.ts
 */
import { PrismaClient } from '../generated/prisma';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as dotenv from 'dotenv';
dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  family: 4,
} as any);
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter } as any);

const CANDIDATE_ID = '4348f444-0cd1-43d5-a74a-6d3ee555dad4';

async function main() {
  console.log('🔍 Checking current job matches for candidate:', CANDIDATE_ID);

  const existing = await prisma.jobMatch.findMany({
    where: { candidateId: CANDIDATE_ID },
    select: {
      matchId: true,
      score: true,
      details: true,
      jobPosting: { select: { title: true } },
    },
    orderBy: { score: 'desc' },
    take: 5,
  });

  console.log(`📋 Found ${existing.length} existing matches`);
  for (const m of existing) {
    const d = m.details as any;
    console.log(`  - ${m.jobPosting.title} | Score: ${m.score}%`);
    if (d?.relevantExpDetails?.jobRequirements) {
      console.log(
        `    jobRequirements:`,
        d.relevantExpDetails.jobRequirements.slice(0, 2),
      );
      console.log(
        `    scoreExplanation:`,
        d.relevantExpDetails.scoreExplanation || '(none)',
      );
    }
  }

  console.log(
    '\n🗑️  Deleting all job matches for this candidate to force re-matching...',
  );
  const deleted = await prisma.jobMatch.deleteMany({
    where: { candidateId: CANDIDATE_ID },
  });
  console.log(`✅ Deleted ${deleted.count} job match record(s)`);
  console.log(
    '\n💡 Next step: Open the recruiter portal and view recommended candidates',
  );
  console.log(
    '   OR call the candidate recommended jobs API to trigger re-matching automatically.',
  );
  console.log('   userId for API: 2a67d028-a217-4e90-90c1-6cb7e21427bc');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
