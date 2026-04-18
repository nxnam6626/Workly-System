import { PrismaClient, Prisma } from '../src/generated/prisma';

const prisma = new PrismaClient();

async function main() {
  const jobId = "09c211db-2c8f-4a9b-9314-a422823aff73";
  const email = "zighdevil@gmail.com";

  console.log("--- JOB INFO ---");
  const job = await prisma.jobPosting.findUnique({
    where: { jobPostingId: jobId },
    select: {
      title: true,
      structuredRequirements: true,
      status: true,
      vacancies: true
    }
  });
  console.log(JSON.stringify(job, null, 2));

  console.log("\n--- CANDIDATE & CV INFO ---");
  const user = await prisma.user.findUnique({
    where: { email },
    select: { userId: true }
  });

  if (!user) {
    console.log("User not found with email:", email);
    return;
  }

  const candidate = await prisma.candidate.findUnique({
    where: { userId: user.userId },
    include: {
      cvs: {
        where: { parsedData: { not: Prisma.JsonNull } }
      }
    }
  });

  if (!candidate) {
    console.log("Candidate record not found for user:", user.userId);
  } else {
    console.log(JSON.stringify(candidate, null, 2));
  }
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
