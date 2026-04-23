import { PrismaClient } from '../src/generated/prisma';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as dotenv from 'dotenv';

dotenv.config();

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString, family: 4 } as any);
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const COMPANIES = [
  {
    name: "Tập đoàn Công nghệ FPT",
    logo: "https://vcdn.jobsgo.vn/company_logos/hDIdkXzJ9W.jpg",
    banner: "https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&q=80&w=1000",
    industries: ["Công nghệ thông tin", "Viễn thông"],
    jobs: ["Lập trình viên Java", "Kỹ sư Cầu nối (BrSE)", "ReactJS Developer"]
  },
  {
    name: "Ngân hàng Techcombank",
    logo: "https://vcdn.jobsgo.vn/company_logos/vIAnUo6I8a.jpg",
    banner: "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?auto=format&fit=crop&q=80&w=1000",
    industries: ["Ngân hàng", "Tài chính"],
    jobs: ["Chuyên viên Tư vấn Tài chính", "Giao dịch viên", "Data Analyst"]
  },
  {
    name: "Công ty Cổ phần VNG",
    logo: "https://vcdn.jobsgo.vn/company_logos/z7a7eUuN1C.jpg",
    banner: "https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&q=80&w=1000",
    industries: ["Internet", "Trò chơi trực tuyến"],
    jobs: ["Game Designer", "Product Manager", "Backend Engineer (Go)"]
  },
  {
    name: "Viettel Group",
    logo: "https://vcdn.jobsgo.vn/company_logos/vPIdLuZq5v.jpg",
    banner: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&q=80&w=1000",
    industries: ["Viễn thông", "Công nghệ"],
    jobs: ["Kỹ sư Viễn thông", "Chuyên viên Marketing", "DevOps Engineer"]
  },
  {
    name: "Vinamilk",
    logo: "https://vcdn.jobsgo.vn/company_logos/9PIdGvTq1z.jpg",
    banner: "https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&q=80&w=1000",
    industries: ["Thực phẩm", "Hàng tiêu dùng"],
    jobs: ["Quản lý Khu vực", "Nhân viên Kiểm định Chất lượng", "Kỹ sư Sản xuất"]
  },
  {
    name: "Shopee Việt Nam",
    logo: "https://vcdn.jobsgo.vn/company_logos/6PIdVvXy2b.jpg",
    banner: "https://images.unsplash.com/photo-1557821552-17105176677c?auto=format&fit=crop&q=80&w=1000",
    industries: ["Thương mại điện tử"],
    jobs: ["Business Development", "Customer Service Specialist", "Warehouse Manager"]
  },
  {
    name: "Grab Việt Nam",
    logo: "https://vcdn.jobsgo.vn/company_logos/8NAnUo6I2p.jpg",
    banner: "https://images.unsplash.com/photo-1533240332313-0dbf2f65d38a?auto=format&fit=crop&q=80&w=1000",
    industries: ["Vận tải", "Công nghệ"],
    jobs: ["Operations Coordinator", "Android Developer", "Market Research Analyst"]
  },
  {
    name: "Momo (M_Service)",
    logo: "https://vcdn.jobsgo.vn/company_logos/5WIdKvfM9x.jpg",
    banner: "https://images.unsplash.com/photo-1559136555-9303baea8ebd?auto=format&fit=crop&q=80&w=1000",
    industries: ["Fintech", "Công nghệ"],
    jobs: ["UI/UX Designer", "Software Engineer", "Merchant Support"]
  },
  {
    name: "Suntory PepsiCo",
    logo: "https://vcdn.jobsgo.vn/company_logos/2PIdQvJq4a.jpg",
    banner: "https://images.unsplash.com/photo-1556761175-b413da4baf72?auto=format&fit=crop&q=80&w=1000",
    industries: ["Đồ uống", "F&B"],
    jobs: ["Brand Manager", "Sales Representative", "Supply Chain Planner"]
  },
  {
    name: "Samsung Electronics",
    logo: "https://vcdn.jobsgo.vn/company_logos/j3IdMvYq5e.jpg",
    banner: "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&q=80&w=1000",
    industries: ["Điện tử", "Sản xuất"],
    jobs: ["Hardware Engineer", "Production Supervisor", "R&D Specialist"]
  },
  {
    name: "Vietjet Air",
    logo: "https://vcdn.jobsgo.vn/company_logos/vAnUo6I8a2.jpg",
    banner: "https://images.unsplash.com/photo-1436491865332-7a61a109c0f3?auto=format&fit=crop&q=80&w=1000",
    industries: ["Hàng không", "Du lịch"],
    jobs: ["Tiếp viên hàng không", "Kỹ sư bảo dưỡng tàu bay", "Chuyên viên nhân sự"]
  },
  {
    name: "Thế giới Di động (MWG)",
    logo: "https://vcdn.jobsgo.vn/company_logos/hDIdkXzJ9W1.jpg",
    banner: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&q=80&w=1000",
    industries: ["Bán lẻ", "Điện máy"],
    jobs: ["Quản lý cửa hàng", "Nhân viên bán hàng", "Kế toán kho"]
  }
];

async function seed() {
  const recruiter = await prisma.recruiter.findFirst({
    include: { company: true }
  });

  if (!recruiter) {
    console.error('No recruiter found!');
    return;
  }

  const branch = await prisma.companyBranch.findFirst({
    where: { companyId: recruiter.companyId || undefined }
  });

  console.log(`Using recruiter: ${recruiter.recruiterId}`);

  for (const compData of COMPANIES) {
    console.log(`Creating company: ${compData.name}`);
    
    const company = await prisma.company.create({
      data: {
        companyName: compData.name,
        logo: compData.logo,
        banner: compData.banner,
        description: `${compData.name} là một trong những doanh nghiệp hàng đầu trong lĩnh vực ${compData.industries.join(', ')} tại Việt Nam.`,
        websiteUrl: `https://www.${compData.name.toLowerCase().replace(/ /g, '')}.com.vn`,
        companySize: Math.floor(Math.random() * 5000) + 500,
        status: 'VERIFIED'
      }
    });

    const newBranch = await prisma.companyBranch.create({
      data: {
        name: "Trụ sở chính",
        address: "TP. Hồ Chí Minh",
        companyId: company.companyId
      }
    });

    // Create 3-5 jobs for each company to ensure they rank high
    const jobCount = Math.floor(Math.random() * 5) + 3;
    for (let i = 0; i < jobCount; i++) {
        const jobTitle = compData.jobs[i % compData.jobs.length] + (i > 0 ? ` (Cấp bậc ${i})` : '');
        await prisma.jobPosting.create({
          data: {
            title: jobTitle,
            description: `Mô tả công việc cho vị trí ${jobTitle} tại ${compData.name}.`,
            requirements: `Yêu cầu cho vị trí ${jobTitle}.`,
            salaryMin: 10 + i * 2,
            salaryMax: 20 + i * 5,
            recruiterId: recruiter.recruiterId,
            companyId: company.companyId,
            status: 'APPROVED',
            jobType: 'FULLTIME',
            originalUrl: `https://www.${compData.name.toLowerCase().replace(/ /g, '')}.com.vn/job/${Date.now()}-${i}`,
            branches: {
                connect: [{ branchId: newBranch.branchId }]
            }
          }
        });
    }
  }

  console.log('Seed completed successfully!');
}

seed()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
