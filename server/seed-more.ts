import { PrismaClient } from './src/generated/prisma';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as bcrypt from 'bcrypt';
import * as dotenv from 'dotenv';

dotenv.config();

async function main() {
  const connectionString = process.env.DATABASE_URL;
  const pool = new Pool({ connectionString, family: 4 } as any);
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  console.log('Bắt đầu thêm 20 ứng viên và 20 job...');

  const passwordHash = await bcrypt.hash('password123', 10);

  const getRoleId = async (roleName: string) => {
    return (await prisma.role.findUnique({ where: { roleName } }))!.roleId;
  };
  const candidateRoleId = await getRoleId('CANDIDATE');

  // Lấy danh sách recruiter và company hiện có
  const recruiters = await prisma.recruiter.findMany({ include: { company: true } });
  if (recruiters.length === 0) {
    console.error('Không tìm thấy nhà tuyển dụng nào để tạo job!');
    process.exit(1);
  }

  // Tạo 20 Jobs
  console.log('Đang tạo 20 tin tuyển dụng...');
  const jobTitles = [
    'Frontend Developer (React/Vue)', 'Backend Developer (Node.js)', 'Fullstack Developer',
    'Mobile App Developer (Flutter)', 'iOS Developer (Swift)', 'Android Developer (Kotlin)',
    'DevOps Engineer', 'System Administrator', 'Database Administrator',
    'Data Scientist', 'Data Engineer', 'Machine Learning Engineer',
    'UI/UX Designer', 'Product Designer', 'Graphic Designer',
    'Project Manager', 'Product Manager', 'Scrum Master',
    'Business Analyst', 'Quality Assurance (QA)'
  ];

  for (let i = 0; i < 20; i++) {
    const rIndex = i % recruiters.length;
    const recruiter = recruiters[rIndex];
    if (!recruiter.companyId) continue;
    
    const salaryBase = 10000000 + (Math.random() * 20000000);
    
    await prisma.jobPosting.create({
      data: {
        title: `${jobTitles[i]} - Cấp bách`,
        description: `<p>Chúng tôi đang tìm kiếm ${jobTitles[i]} tham gia vào các dự án lớn.</p>`,
        requirements: `<p>- Ít nhất 2 năm kinh nghiệm trong lĩnh vực liên quan.<br>- Tinh thần trách nhiệm cao.</p>`,
        benefits: `<p>- Lương tháng 13.<br>- Bảo hiểm sức khỏe đầy đủ.</p>`,
        salaryMin: salaryBase,
        salaryMax: salaryBase + 10000000,
        currency: 'VND',
        jobType: i % 2 === 0 ? 'FULLTIME' : 'REMOTE',
        locationCity: i % 3 === 0 ? 'Hà Nội' : (i % 3 === 1 ? 'TP. Hồ Chí Minh' : 'Đà Nẵng'),
        status: 'APPROVED',
        isVerified: true,
        companyId: recruiter.companyId,
        recruiterId: recruiter.recruiterId,
        jobTier: i % 4 === 0 ? 'URGENT' : (i % 4 === 1 ? 'PROFESSIONAL' : 'BASIC'),
        vacancies: Math.floor(Math.random() * 5) + 1,
      }
    });
  }

  // Tạo 20 Candidates
  console.log('Đang tạo 20 ứng viên...');
  const names = ['Tuấn', 'Minh', 'Hải', 'Huy', 'Cường', 'Nam', 'Phúc', 'Lâm', 'Tùng', 'Đức', 'Mai', 'Hoa', 'Lan', 'Ngọc', 'Hương', 'Linh', 'Thảo', 'Trang', 'Phương', 'Ly'];
  const ho = ['Nguyễn', 'Trần', 'Lê', 'Phạm', 'Hoàng', 'Huỳnh', 'Phan', 'Vũ', 'Võ', 'Đặng'];

  for (let i = 0; i < 20; i++) {
    const email = `ungvien_${Date.now()}_${i}@example.com`;
    const fullName = `${ho[Math.floor(Math.random() * ho.length)]} ${names[i]}`;
    
    const user = await prisma.user.create({
      data: {
        email: email,
        password: passwordHash,
        status: 'ACTIVE',
        isEmailVerified: true,
      }
    });
    
    await prisma.userRole.create({
      data: { userId: user.userId, roleId: candidateRoleId }
    });
    
    const candidate = await prisma.candidate.create({
      data: {
        userId: user.userId,
        fullName: fullName,
        location: i % 2 === 0 ? 'Hà Nội' : 'TP. Hồ Chí Minh',
        isOpenToWork: true,
        summary: `Ứng viên ${fullName} năng động, nhiệt huyết.`,
      }
    });

    // Tạo Skill
    await prisma.skill.create({
      data: {
        skillName: 'Teamwork',
        candidateId: candidate.candidateId,
        level: 'INTERMEDIATE',
      }
    });

    // Tạo CV
    await prisma.cV.create({
      data: {
        candidateId: candidate.candidateId,
        cvTitle: `CV_${fullName.replace(/ /g, '_')}.pdf`,
        isMain: true,
        fileUrl: 'https://example.com/dummy-cv.pdf',
      }
    });
  }

  console.log('Đã tạo xong 20 ứng viên và 20 job!');
}

main().catch(console.error).finally(() => process.exit(0));
