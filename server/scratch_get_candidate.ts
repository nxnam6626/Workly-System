import { PrismaClient } from './src/generated/prisma';
import 'dotenv/config';

const prisma = new PrismaClient();

async function main() {
  const email = 'nxnam6626@gmail.com';
  const user = await prisma.user.findUnique({
    where: { email },
    include: {
      candidate: {
        include: {
          skills: true,
          cvs: {
            where: { isMain: true },
            select: { parsedData: true }
          }
        }
      }
    }
  });

  if (!user || !user.candidate) {
    console.log('Candidate not found');
    return;
  }

  const data = {
    candidateId: user.candidate.candidateId,
    fullName: user.candidate.fullName,
    skills: user.candidate.skills.map((s: any) => s.skillName),
    parsedSkills: (user.candidate.cvs[0]?.parsedData as any)?.skills || []
  };

  console.log(JSON.stringify(data, null, 2));
}

main()
  .catch(console.error)
  .finally(async () => await prisma.$disconnect());
