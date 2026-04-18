const { PrismaClient } = require('../src/generated/prisma');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');
const dotenv = require('dotenv');

dotenv.config();

async function main() {
  const connectionString = process.env.DATABASE_URL;
  const pool = new Pool({ connectionString, family: 4 });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  try {
    const jobId = '09c211db-2c8f-4a9b-9314-a422823aff73';
    await prisma.jobPosting.update({
      where: { jobPostingId: jobId },
      data: {
        structuredRequirements: {
          hardSkills: ['Java', 'Spring Boot', 'Hibernate', 'Spring Security', 'MySQL', 'PostgreSQL', 'MongoDB', 'JWT', 'BCrypt', 'OAuth2', 'Git', 'Docker'],
          softSkills: ['Problem-solving', 'Technical English', 'Teamwork'],
          minExperienceYears: 0,
          expandedSkills: {
             'Java': ['Java Core', 'J2EE'],
             'Spring Boot': ['Spring Framework', 'Spring'],
             'MySQL': ['SQL', 'Relational DB'],
             'OAuth2': ['Google OAuth2', 'Auth']
          }
        }
      }
    });
    console.log('Successfully fixed Job Data!');
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

main().catch(console.error);
