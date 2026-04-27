import 'dotenv/config';
import { PrismaClient } from '../src/generated/prisma';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function deleteJobsByEmail(email: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        recruiter: true,
      },
    });

    if (!user) {
      console.error(`User with email ${email} not found.`);
      return;
    }

    if (!user.recruiter) {
      console.error(`User with email ${email} is not a recruiter.`);
      return;
    }

    const recruiterId = user.recruiter.recruiterId;

    const deleteResult = await prisma.jobPosting.deleteMany({
      where: {
        recruiterId,
      },
    });

    console.log(`Successfully deleted ${deleteResult.count} job postings for ${email}.`);
  } catch (error) {
    console.error('Error deleting job postings:', error);
  } finally {
    await prisma.$disconnect();
  }
}

const targetEmail = 'zighdevil@gmail.com';
deleteJobsByEmail(targetEmail);
