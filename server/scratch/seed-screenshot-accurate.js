const { PrismaClient } = require('../dist/src/generated/prisma');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');
require('dotenv').config();

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const TARGET_COMPANIES = [
  {
    companyName: "Công Ty Cổ Phần Kết Nối Nhân Lực Worklink Việt Nam",
    taxCode: "0106753155",
    mainIndustry: "Kinh doanh",
    logo: "https://vcdn.jobsgo.vn/company_logos/hDIdkXzJ9W.jpg",
    jobCount: 2112
  },
  {
    companyName: "Bellsystem24 VietNam",
    taxCode: "0101859646",
    mainIndustry: "Contact Center & BPO",
    logo: "https://vcdn.jobsgo.vn/company_logos/vIAnUo6I8a.jpg",
    jobCount: 1741
  },
  {
    companyName: "Công Ty TNHH Vietnam Concentrix Services",
    taxCode: "0313084651",
    mainIndustry: "Hoạt động dịch vụ liên quan đến các...",
    logo: "https://vcdn.jobsgo.vn/company_logos/z7a7eUuN1C.jpg",
    jobCount: 1650
  },
  {
    companyName: "Công Ty TNHH Reeracoen Việt Nam",
    taxCode: "0312608476",
    mainIndustry: "Tư vấn",
    logo: "https://vcdn.jobsgo.vn/company_logos/6PIdVvXy2b.jpg",
    jobCount: 1200
  },
  {
    companyName: "Công Ty TNHH Tư Vấn Nhân Sự Kokoro",
    taxCode: "0316820841",
    mainIndustry: "Tư vấn giới thiệu việc làm",
    logo: "https://vcdn.jobsgo.vn/company_logos/j3IdMvYq5e.jpg",
    jobCount: 434
  },
  {
    companyName: "Công Ty Cổ Phần Green Speed",
    taxCode: "0309532989",
    mainIndustry: "N/A",
    logo: "https://vcdn.jobsgo.vn/company_logos/vPIdLuZq5v.jpg",
    jobCount: 262
  },
  {
    companyName: "Headhunter Vietnam Hrchannels.com",
    taxCode: "0102871239",
    mainIndustry: "Nhân sự",
    logo: "https://vcdn.jobsgo.vn/company_logos/hDIdkXzJ9W.jpg",
    jobCount: 217
  },
  {
    companyName: "Công Ty TNHH Bệnh Viện Sài Gòn Tâm Đức",
    taxCode: "0311672846",
    mainIndustry: "Bệnh Viện",
    logo: "https://vcdn.jobsgo.vn/company_logos/vIAnUo6I8a.jpg",
    jobCount: 209
  },
  {
    companyName: "Công Ty Cổ Phần Truyền Thông Kim Cương",
    taxCode: "0308563924",
    mainIndustry: "Đào tạo",
    logo: "https://vcdn.jobsgo.vn/company_logos/z7a7eUuN1C.jpg",
    jobCount: 192
  }
];

async function main() {
  console.log("Seeding exact screenshot data...");

  for (const data of TARGET_COMPANIES) {
    const company = await prisma.company.upsert({
      where: { taxCode: data.taxCode },
      update: {
        companyName: data.companyName,
        mainIndustry: data.mainIndustry,
        logo: data.logo
      },
      create: {
        companyName: data.companyName,
        taxCode: data.taxCode,
        mainIndustry: data.mainIndustry,
        logo: data.logo,
        banner: `https://picsum.photos/seed/${data.taxCode}/1200/400`,
        description: `Thông tin mô tả cho ${data.companyName}. Đang tuyển hàng ngàn vị trí hấp dẫn.`
      }
    });

    console.log(`🔥 ${company.companyName} injected. Creating jobs count: ${data.jobCount}`);

    // Insert exactly 'jobCount' placeholder jobs.
    // To make it blazing fast, we can just generate an array and createMany
    // Wait, prisma does not support createMany easily sometimes with certain configurations but let's try
    
    const jobBatches = [];
    for(let i = 0; i < data.jobCount; i++) {
      jobBatches.push({
        title: `Tuyển dụng nhân sự chuyên nghiệp #${i + 1}`,
        description: "Công việc hấp dẫn với mức lương tốt, làm việc tại TP.HCM / Hà Nội.",
        status: "APPROVED",
        companyId: company.companyId,
        vacancies: 1
      });
    }

    // Run creates in chunks of 500 to not overflow prisma
    const chunkSize = 500;
    for (let i = 0; i < jobBatches.length; i += chunkSize) {
        const chunk = jobBatches.slice(i, i + chunkSize);
        await prisma.jobPosting.createMany({
            data: chunk
        });
    }
    console.log(`✅ Success injected ${data.jobCount} jobs.`);
  }
  
  console.log("✨ MISSION COMPLETE: All screenshot items and exact job counts applied!");
}

main().catch(console.error).finally(async () => {
  await prisma.$disconnect();
});
