import { PrismaClient } from './src/generated/prisma';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import 'dotenv/config';

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL is not defined in .env');
  }
  const pool = new Pool({ connectionString, family: 4 } as any);
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  try {
    // PRE-SEED CLEANUP: Delete previous sample jobs to avoid duplicates
    console.log('Cleaning up previous sample jobs...');
    await prisma.jobMatch.deleteMany({}); // Clean matches first due to relations
    await prisma.jobPosting.deleteMany({
      where: {
        OR: [
          { title: { startsWith: '[TUYỂN GẤP]' } }
        ]
      }
    });

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
      console.log('Candidate nxnam6626@gmail.com not found. Aborting creation of tailored jobs.');
    } else {
      console.log('Target candidate found:', user.candidate.fullName);
      
      const candidateSkills = (user.candidate.cvs[0]?.parsedData as any)?.skills || ['React', 'Node.js', 'TypeScript', 'Next.js', 'PostgreSQL'];
      console.log('Skills for matching:', candidateSkills);

      const recruiter = await prisma.recruiter.findFirst();
      const company = await prisma.company.findFirst();

      if (!recruiter || !company) {
          throw new Error('No recruiter or company found to assign jobs.');
      }

      // 1. Create 5 Tailored Jobs
      const tailoredJobs = [
        { title: 'Senior Frontend Engineer (React/Next.js)', skills: ['React', 'Next.js', 'TypeScript', 'Tailwind CSS'] },
        { title: 'Backend Developer (Node.js/NestJS)', skills: ['Node.js', 'NestJS', 'PostgreSQL', 'TypeScript'] },
        { title: 'Fullstack Web Developer', skills: ['React', 'Node.js', 'TypeScript', 'SQL'] },
        { title: 'Software Architect (AI Integration)', skills: ['AI', 'Node.js', 'TypeScript', 'React'] },
        { title: 'Frontend Specialist (Creative UI)', skills: ['React', 'Framer Motion', 'Tailwind CSS', 'TypeScript'] },
      ];

      for (const tJob of tailoredJobs) {
        await prisma.jobPosting.create({
          data: {
            title: tJob.title,
            description: `Công việc tuyệt vời dành cho chuyên gia ${tJob.skills.join(', ')}.`,
            requirements: `Kỹ năng: ${tJob.skills.join(', ')}. Có kinh nghiệm làm việc với các hệ thống lớn.`,
            structuredRequirements: {
              hardSkills: tJob.skills,
              minExperienceYears: 2
            },
            salaryMin: 30000000,
            salaryMax: 60000000,
            experience: '1_TO_3_YEARS',
            locationCity: 'Hà Nội',
            status: 'APPROVED',
            jobTier: 'PROFESSIONAL',
            companyId: company.companyId,
            recruiterId: recruiter.recruiterId
          }
        });
      }
      console.log('✅ Created 5 tailored jobs for the candidate.');
    }

    // 2. Create 18 Urgent Jobs (one for each industry)
    const industries = [
      "Kinh Doanh / Bán Hàng", "Công Nghệ Thông Tin", "Marketing / Truyền Thông",
      "Content / SEO", "Tài Chính / Kế Toán / Ngân Hàng", "Nhân Sự / Hành Chính / Pháp Lý",
      "Thiết Kế / Sáng Tạo", "Kỹ Thuật / Cơ Khí / Sản Xuất", "Xây Dựng / Kiến Trúc",
      "Vận Tải / Logistics", "Bán Lẻ / Tiêu Dùng", "Nhà Hàng / Khách Sạn / Du lịch",
      "Y Tế / Dược Phẩm", "Giáo Dục / Đào Tạo", "Nông Nghiệp / Môi Trường",
      "Bất Động Sản", "Truyền Thông / Báo Chí", "Thể Thao / Làm Đẹp / Giải Trí",
      "Luật / Tư Vấn Pháp Lý", "Dệt May / Da Giày", "Thực Phẩm & Đồ Uống (F&B)",
      "Viễn Thông", "Bảo Hiểm", "Điện / Điện Tử / Điện Lạnh", "Hóa Học / Sinh Học",
      "Thời Trang / Mỹ Phẩm", "Cơ Khí / Chế Tạo Máy", "Xuất Nhập Khẩu",
      "Thẩm Mỹ / Spa / Massage", "Bảo Vệ / An Ninh", "Lao Động Phổ Thông",
      "Freelance / Việc Làm Tự Do"
    ];

    const recruiter = await prisma.recruiter.findFirst();
    const company = await prisma.company.findFirst();

    for (const industry of industries) {
        await prisma.jobPosting.create({
            data: {
                title: `[TUYỂN GẤP] Chuyên viên ${industry}`,
                description: `Cơ hội nghề nghiệp hấp dẫn trong lĩnh vực ${industry}.`,
                requirements: `Yêu cầu kinh nghiệm và chuyên môn trong ngành ${industry}.`,
                salaryMin: 15000000,
                salaryMax: 35000000,
                experience: '1_TO_3_YEARS',
                locationCity: 'Hà Nội',
                status: 'APPROVED',
                jobTier: 'URGENT',
                companyId: company!.companyId,
                recruiterId: recruiter!.recruiterId,
                structuredRequirements: {
                    industry: industry,
                    hardSkills: [industry]
                }
            }
        });
    }
    console.log('✅ Created 18 urgent jobs for all industries.');

  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

main().catch(console.error);
