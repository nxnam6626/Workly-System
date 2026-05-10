import { PrismaClient } from './src/generated/prisma';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as dotenv from 'dotenv';

dotenv.config();

async function main() {
  const connectionString = process.env.DATABASE_URL;
  const pool = new Pool({ connectionString, family: 4 } as any);
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  console.log('Updating company to REAL data...');

  const recruiterEmail = 'recruiter@workly.vn';
  const user = await prisma.user.findUnique({ 
    where: { email: recruiterEmail },
    include: { recruiter: true }
  });

  if (!user || !user.recruiter || !user.recruiter.companyId) {
    console.log('Recruiter not found or missing companyId.');
    return;
  }

  const realCompanyData = {
    companyName: 'CÔNG TY CỔ PHẦN MISA',
    taxCode: '0101243150',
    address: 'Tầng 9, Tòa nhà Technosoft, Phố Duy Tân, Dịch Vọng Hậu, Cầu Giấy, Hà Nội',
    description: 'MISA là một trong những doanh nghiệp hàng đầu tại Việt Nam trong lĩnh vực phát triển phần mềm quản trị doanh nghiệp và nhà nước.',
    websiteUrl: 'https://www.misa.vn',
    companySize: 2500,
    isRegistered: true,
    verifyStatus: 1, // Verified
    enterpriseType: 'CỔ PHẦN',
    mainIndustry: 'Công nghệ thông tin',
    slug: 'cong-ty-co-phan-misa'
  };

  // Update Company and link to the existing recruiter's companyId
  const updatedCompany = await prisma.company.update({
    where: { companyId: user.recruiter.companyId },
    data: realCompanyData
  });

  console.log('Updated Company Details:');
  console.log('Name:', updatedCompany.companyName);
  console.log('Tax Code:', updatedCompany.taxCode);
  
  // Also update recruiter's full name to make it sound like a real HR manager from MISA
  await prisma.recruiter.update({
    where: { recruiterId: user.recruiter.recruiterId },
    data: {
      fullName: 'Nguyễn Thị Phương Thảo',
      position: 'Trưởng phòng Tuyển dụng'
    }
  });
  console.log('Updated Recruiter Name and Position.');

  console.log('COMPLETED!');
}

main().catch(console.error).finally(() => process.exit(0));
