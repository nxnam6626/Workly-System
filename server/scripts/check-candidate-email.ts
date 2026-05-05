import { PrismaClient } from '../src/generated/prisma';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter } as any);

async function main() {
  const user = await (prisma as any).user.findFirst({
    where: { email: 'zighdeviag@gmail.com' },
    include: {
      candidate: {
        include: {
          skills: true,
          experiences: true,
          cvs: {
            where: { isMain: true },
            select: { cvId: true, parsedData: true }
          }
        }
      }
    }
  });


  if (!user) {
    console.log('User not found for email: zighdeviag@gmail.com');
    return;
  }

  const c = user.candidate;
  console.log('=== CANDIDATE PROFILE ===');
  console.log('Name:', c?.fullName);
  console.log('Headline:', c?.headline);
  console.log('Total Years Exp:', c?.totalYearsExp);
  console.log('Skills:', c?.skills?.map((s: any) => s.skillName).join(', '));
  console.log('Experiences:', JSON.stringify(c?.experiences?.map((e: any) => ({
    title: e.jobTitle, company: e.company, years: e.totalYears
  })), null, 2));
  console.log('Educations:', JSON.stringify(c?.educations?.map((e: any) => ({
    major: e.major, school: e.school
  })), null, 2));

  const cv = c?.cvs?.[0];
  if (cv?.parsedData) {
    const pd = cv.parsedData as any;
    console.log('\n=== CV PARSED DATA ===');
    console.log('Skills:', pd.skills?.join(', '));
    console.log('Summary:', pd.summary);
    console.log('Job Titles:', pd.jobTitles?.join(', '));
  }
}

main()
  .catch((e) => console.error(e))
  .finally(() => prisma.$disconnect());
