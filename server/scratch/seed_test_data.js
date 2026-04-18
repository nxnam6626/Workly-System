const { PrismaClient } = require('@prisma/client');

async function seed() {
  const prisma = new PrismaClient();
  
  console.log('--- SEEDING DATA ---');

  // 1. Create Company
  const company = await prisma.company.create({
    data: {
      companyName: 'OCEAN ONE TECHNOLOGY',
      verifyStatus: 1, // Verified for bonus
      slug: 'ocean-one-' + Date.now(),
      address: 'Hồ Chí Minh',
    }
  });

  // 2. Create User & Candidate
  const user = await prisma.user.create({
    data: {
      email: 'zighdevil' + Date.now() + '@gmail.com',
      status: 'ACTIVE',
      candidate: {
        create: {
          fullName: 'Zigh Devil',
          isOpenToWork: true,
          cvs: {
            create: {
              cvTitle: 'Java Backend Developer CV',
              isMain: true,
              parsedData: {
                skills: ['Java', 'Spring Boot', 'MySQL', 'REST API', 'Git', 'English'],
                totalYearsExp: 0,
              }
            }
          }
        }
      }
    }
  });

  // 3. Create Job Posting
  const job = await prisma.jobPosting.create({
    data: {
      title: 'TUYỂN DỤNG: LẬP TRÌNH VIÊN BACKEND (JAVA/SPRING BOOT) - JUNIOR/INTERN',
      description: 'Phát triển hệ thống Backend sử dụng Java/Spring Boot...',
      requirements: 'Sinh viên năm cuối hoặc mới tốt nghiệp. Biết Java, Spring Boot, SQL.',
      companyId: company.companyId,
      status: 'APPROVED',
      jobType: 'FULLTIME',
      originalUrl: 'https://example.com/job/' + Date.now(),
      structuredRequirements: {
        hardSkills: ['Java', 'Spring Boot', 'SQL', 'Hibernate', 'Microservices', 'Docker', 'AWS', 'Redis'],
        softSkills: ['Teamwork', 'Communication', 'Problem Solving', 'Adaptability'],
        minExperienceYears: 0, 
      }
    }
  });

  console.log('Seed completed successfully!');
  console.log('User ID:', user.userId);
  console.log('Job ID:', job.jobPostingId);

  await prisma.$disconnect();
}

seed().catch(e => {
  console.error(e);
  process.exit(1);
});
