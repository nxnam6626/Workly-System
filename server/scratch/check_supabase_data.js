const { PrismaClient } = require('../src/generated/prisma');

async function checkZighDevil() {
  const prisma = new PrismaClient();
  try {
    const userData = await prisma.user.findUnique({
      where: { email: 'zighdevil@gmail.com' },
      include: {
        candidate: {
          include: {
            cvs: true,
            jobMatches: {
              include: {
                jobPosting: true
              }
            }
          }
        }
      }
    });

    if (!userData) {
      console.log('User not found');
      return;
    }

    console.log('--- CANDIDATE INFORMATION ---');
    console.log('Full Name:', userData.candidate?.fullName);
    
    console.log('\n--- CVs ---');
    userData.candidate?.cvs.forEach(cv => {
      console.log(`- [${cv.cvId}] ${cv.cvTitle} (Main: ${cv.isMain})`);
      console.log('  Parsed Data:', JSON.stringify(cv.parsedData, null, 2));
    });

    console.log('\n--- JOB MATCHES ---');
    if (userData.candidate?.jobMatches.length === 0) {
      console.log('No matches found in JobMatch table.');
    } else {
      userData.candidate?.jobMatches.forEach(jm => {
        console.log(`- Job: ${jm.jobPosting.title} [ID: ${jm.jobPostingId}]`);
        console.log(`  Score: ${jm.score}%`);
        console.log(`  Matched Skills: ${jm.matchedSkills.join(', ')}`);
      });
    }

  } catch (error) {
    console.error('Error during query:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkZighDevil();
