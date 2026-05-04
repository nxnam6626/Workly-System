import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as dotenv from 'dotenv';

dotenv.config();

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

function calculateCompleteness(company: any) {
  const breakdown: any = {
    companyName: !!company.companyName,
    taxCode: !!company.taxCode,
    logo: !!company.logo,
    banner: !!company.banner,
    address: !!company.address,
    description: !!company.description && company.description.length > 50,
    websiteUrl: !!company.websiteUrl,
    companySize: !!company.companySize,
    mainIndustry: !!company.mainIndustry,
    branches: Array.isArray(company.branches) && company.branches.length > 0,
  };

  const weights: any = {
    companyName: 10,
    taxCode: 15,
    logo: 10,
    banner: 10,
    address: 10,
    description: 15,
    websiteUrl: 5,
    companySize: 5,
    mainIndustry: 10,
    branches: 10,
  };

  let total = 0;
  for (const key in weights) {
    if (breakdown[key]) {
      total += weights[key];
    }
  }

  return { total, breakdown };
}

async function main() {
  const company = await prisma.company.findFirst({
    include: { branches: true },
  });

  if (!company) {
    console.log('No company found.');
    return;
  }

  const result = calculateCompleteness(company);
  console.log(`Company: ${company.companyName}`);
  console.log(`Completeness Score: ${result.total}%`);
  console.log('Breakdown:', result.breakdown);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
