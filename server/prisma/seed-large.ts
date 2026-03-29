import 'dotenv/config';
import { PrismaClient, JobType, JobStatus, PostType } from '@prisma/client';

const prisma = new PrismaClient();

const COMPANIES = [
  { name: 'TechNova', domain: 'technova.com', desc: 'Leading AI solutions provider.', location: 'Hanoi' },
  { name: 'GreenEco', domain: 'greeneco.vn', desc: 'Sustainable energy tech.', location: 'Ho Chi Minh' },
  { name: 'FinTrust', domain: 'fintrust.bank', desc: 'Next-gen fintech startup.', location: 'Da Nang' },
  { name: 'HealthSync', domain: 'healthsync.io', desc: 'Healthcare software platform.', location: 'Hanoi' },
  { name: 'EduSmart', domain: 'edusmart.edu.vn', desc: 'EdTech company focusing on K-12.', location: 'Ho Chi Minh' },
  { name: 'LogiFlow', domain: 'logiflow.net', desc: 'Logistics and supply chain tech.', location: 'Hai Phong' },
  { name: 'CyberShield', domain: 'cybershield.security', desc: 'Cybersecurity services experts.', location: 'Hanoi' },
  { name: 'MediaPulse', domain: 'mediapulse.agency', desc: 'Digital marketing and media.', location: 'Ho Chi Minh' },
  { name: 'FoodieConnect', domain: 'foodie.vn', desc: 'Food delivery platform backend.', location: 'Da Nang' },
  { name: 'TravelBuddy', domain: 'travelbuddy.com', desc: 'Travel tech platform.', location: 'Hanoi' },
];

const JOB_TITLES = [
  'Software Engineer', 'Frontend Developer', 'Backend Developer', 'Full Stack Engineer',
  'Data Scientist', 'Data Engineer', 'Product Manager', 'UX/UI Designer',
  'DevOps Engineer', 'QA Tester', 'Mobile Developer (iOS/Android)', 'Cloud Architect'
];

function randomElement<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1) + min);
}

async function main() {
  console.log('Seeding massive mock data...');

  // 1. Create Companies
  const createdCompanies: any[] = [];
  for (let i = 0; i < COMPANIES.length; i++) {
    const c = COMPANIES[i];
    const company = await prisma.company.create({
      data: {
        companyName: c.name,
        taxCode: `TAX-${randomInt(100000, 999999)}-${i}`,
        isRegistered: true,
        address: c.location,
        description: c.desc,
        websiteUrl: `https://${c.domain}`,
        companySize: randomInt(50, 1000),
      },
    });
    createdCompanies.push(company);
  }
  console.log(`Created ${createdCompanies.length} companies.`);

  // 2. We need a recruiter to assign jobs to, just find any existing recruiter or use null if allowed.
  // The schema allows recruiterId to be optional, but we will fetch one just in case.
  const recruiter = await prisma.recruiter.findFirst();

  // 3. Create Jobs
  let jobCount = 0;
  const jobTypes = [JobType.FULLTIME, JobType.PARTTIME, JobType.INTERNSHIP, JobType.REMOTE];

  for (let i = 0; i < 50; i++) {
    const company = randomElement(createdCompanies);
    const title = randomElement(JOB_TITLES);
    const jobType = randomElement(jobTypes);
    const minS = randomInt(500, 1500);
    const maxS = minS + randomInt(500, 2000);
    
    // expiry 1-30 days from now
    const deadline = new Date();
    deadline.setDate(deadline.getDate() + randomInt(1, 30));

    await prisma.jobPosting.create({
      data: {
        title: `${title} - ${randomInt(1, 100)}`,
        description: `We are looking for an experienced ${title} to join ${company.companyName}.`,
        requirements: `- 2+ years of experience in related field.\n- Strong problem-solving skills.\n- Team player.`,
        benefits: `- Competitive salary.\n- Health insurance.\n- Remote work options.`,
        salaryMin: minS,
        salaryMax: maxS,
        currency: 'USD',
        jobType: jobType,
        experience: '2-5 years',
        vacancies: randomInt(1, 5),
        locationCity: company.address,
        deadline: deadline,
        status: JobStatus.APPROVED,
        postType: PostType.MANUAL,
        isVerified: true,
        originalUrl: `https://${company.websiteUrl}/jobs/${i}-${Date.now()}`,
        companyId: company.companyId,
        recruiterId: recruiter?.recruiterId,
      },
    });
    jobCount++;
  }
  
  console.log(`Created ${jobCount} mock job postings.`);
  console.log('Seeding completed!');
}

main()
  .catch((e) => {
    require('fs').writeFileSync('prisma/error-clean.txt', e.message || String(e));
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
