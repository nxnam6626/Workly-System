import { PrismaClient, JobStatus, JobTier } from '../src/generated/prisma';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import 'dotenv/config';

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  try {
    const recruiter = await prisma.recruiter.findFirst({
        include: { company: true }
    });

    if (!recruiter || !recruiter.companyId) {
      console.error('No recruiter or company found to assign jobs.');
      return;
    }

    console.log(`Seeding internships for recruiter: ${recruiter.recruiterId} at company: ${recruiter.company?.companyName}`);

    const branches = await prisma.companyBranch.findMany({
        where: { companyId: recruiter.companyId },
        take: 1
    });

    const internshipJobs = [
      {
        title: "Thực Tập Sinh Lập Trình ReactJS/NextJS",
        industry: "IT",
        description: "Tham gia phát triển các dự án web sử dụng ReactJS và NextJS. Hỗ trợ team frontend tối ưu hóa UI/UX.",
        requirements: "Có kiến thức cơ bản về JS/TS, React. Có tư duy logic tốt.",
        benefits: "Được đào tạo bài bản, hỗ trợ đóng dấu thực tập, cơ hội trở thành nhân viên chính thức.",
        locationCity: "Hồ Chí Minh",
        salaryMin: 2000000,
        salaryMax: 5000000
      },
      {
        title: "Thực Tập Sinh Marketing & Content Creator",
        industry: "Marketing",
        description: "Lên kế hoạch nội dung cho các kênh Social Media. Tham gia triển khai các chiến dịch Marketing.",
        requirements: "Có khả năng viết lách, sáng tạo. Biết sử dụng Canva/CapCut là điểm cộng.",
        benefits: "Môi trường năng động, trẻ trung. Trợ cấp thực tập cạnh tranh.",
        locationCity: "Hà Nội",
        salaryMin: 3000000,
        salaryMax: 5000000
      },
      {
        title: "Thực Tập Sinh Kinh Doanh (Sales Intern)",
        industry: "Kinh Doanh",
        description: "Hỗ trợ đội ngũ kinh doanh tìm kiếm khách hàng tiềm năng. Tư vấn giải pháp cho khách hàng.",
        requirements: "Kỹ năng giao tiếp tốt, tự tin. Ham học hỏi.",
        benefits: "Bonus theo doanh số, đào tạo kỹ năng telesales chuyên nghiệp.",
        locationCity: "Hà Nội",
        salaryMin: 2000000,
        salaryMax: 7000000
      },
      {
        title: "Thực Tập Sinh Tuyển Dụng & Nhân Sự",
        industry: "Tuyển Dụng",
        description: "Sàng lọc hồ sơ ứng viên, đặt lịch phỏng vấn. Hỗ trợ các hoạt động văn hóa nội bộ.",
        requirements: "Yêu thích ngành nhân sự. Chăm chỉ, cẩn thận.",
        benefits: "Học hỏi quy trình tuyển dụng chuẩn chỉnh.",
        locationCity: "Hồ Chí Minh",
        salaryMin: 2000000,
        salaryMax: 3000000
      },
      {
        title: "Thực Tập Sinh Kế Toán Tổng Hợp",
        industry: "Kế Toán",
        description: "Hỗ trợ hạch toán chứng từ, sắp xếp hồ sơ kế toán. Chăm sóc các báo cáo thuế cơ bản.",
        requirements: "Sinh viên năm cuối ngành Kế toán/Tài chính. Trung thực.",
        benefits: "Có lương hỗ trợ, môi trường làm việc chuyên nghiệp.",
        locationCity: "Đà Nẵng",
        salaryMin: 1000000,
        salaryMax: 3000000
      }
    ];

    for (const job of internshipJobs) {
      const slug = `${job.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Math.random().toString(36).substring(7)}`;
      
      await prisma.jobPosting.create({
        data: {
          title: job.title,
          slug: slug,
          description: job.description,
          requirements: job.requirements,
          benefits: job.benefits,
          salaryMin: job.salaryMin,
          salaryMax: job.salaryMax,
          currency: 'VND',
          locationCity: job.locationCity,
          jobType: 'INTERNSHIP',
          jobTier: 'BASIC',
          status: 'APPROVED',
          recruiterId: recruiter.recruiterId,
          companyId: recruiter.companyId,
          experience: 'NO_EXPERIENCE',
          originalUrl: `seed-intern-${slug}`,
          structuredRequirements: {
             industry: job.industry,
             hardSkills: [job.industry],
             softSkills: ["Communication"]
          },
          branches: branches.length > 0 ? { connect: { branchId: branches[0].branchId } } : undefined
        }
      });
      console.log(`Created internship: ${job.title}`);
    }

    console.log('Seeding internships completed.');

  } catch (error) {
    console.error('Error seeding internships:', error);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

main();
