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

  console.log('=== MATCHING RESULTS ===');
  console.log(`Total matches found: ${matches.length}`);

  for (const m of matches) {
    const raw = m.details as any;
    console.log(`\n📌 Job: "${m.jobPosting.title}" | Score: ${m.score}%`);
    console.log('  Top-level keys:', raw ? Object.keys(raw) : 'null');

    // DB stores: { breakdown: {...}, details: { relevantExpDetails: {...} } }
    const innerDetails = raw?.details;
    console.log(
      '  inner details keys:',
      innerDetails ? Object.keys(innerDetails) : 'null',
    );

    const relExpDetails = innerDetails?.relevantExpDetails;
    if (relExpDetails) {
      console.log('\n  ✅ relevantExpDetails FOUND:');
      console.log(
        '  jobRequirements:',
        JSON.stringify(relExpDetails.jobRequirements, null, 4),
      );
      console.log(
        '  candidateExps:',
        JSON.stringify(relExpDetails.candidateExps, null, 4),
      );
      console.log(
        '  matchingPoints:',
        JSON.stringify(relExpDetails.matchingPoints, null, 4),
      );
      console.log(
        '  scoreExplanation:',
        relExpDetails.scoreExplanation ?? '(none)',
      );
    } else {
      console.log('  ⚠️  relevantExpDetails NOT FOUND in details.details');
      console.log(
        '  Full inner details:',
        JSON.stringify(innerDetails, null, 2),
      );
    }
  }
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
