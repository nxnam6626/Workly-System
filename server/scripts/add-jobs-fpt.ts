import { PrismaClient } from '../src/generated/prisma';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
// @ts-ignore
const prisma = new PrismaClient({ adapter });

async function main() {
  const companyId = '09c8a481-e83e-4bb3-9426-e2b6e2e76f8a'; // FPT Software
  
  const jobsData = [
    {
      title: 'Senior Frontend Developer (React/Next.js)',
      description: 'Tham gia phát triển các dự án web quy mô lớn cho khách hàng quốc tế. Xây dựng UI/UX hiện đại, tối ưu hiệu suất và đảm bảo tính tương thích cao.',
      requirements: 'Ít nhất 4 năm kinh nghiệm với React. Thành thạo TypeScript, Next.js. Có kiến thức về CI/CD và testing.',
      benefits: 'Lương thưởng hấp dẫn, gói bảo hiểm FPT Care, môi trường làm việc chuyên nghiệp, cơ hội onsite tại Nhật/Mỹ.',
      salaryMin: 30000000,
      salaryMax: 50000000,
      locationCity: 'Đà Nẵng',
      status: 'APPROVED',
      companyId: companyId,
      jobType: 'FULLTIME',
      jobLevel: 'STAFF',
      experience: '3-5 năm',
      jobTier: 'PROFESSIONAL',
    },
    {
      title: 'Backend Engineer (Node.js/NestJS)',
      description: 'Thiết kế và triển khai hệ thống microservices backend. Tối ưu hóa database và đảm bảo tính bảo mật cho hệ thống.',
      requirements: 'Kinh nghiệm làm việc với Node.js, NestJS, PostgreSQL. Hiểu biết về Redis, RabbitMQ là một lợi thế.',
      benefits: 'Review lương 2 lần/năm, hỗ trợ học phí các chứng chỉ quốc tế, du lịch hàng năm.',
      salaryMin: 25000000,
      salaryMax: 45000000,
      locationCity: 'Hà Nội',
      status: 'APPROVED',
      companyId: companyId,
      jobType: 'FULLTIME',
      jobLevel: 'STAFF',
      experience: '2-4 năm',
      jobTier: 'BASIC',
    },
    {
      title: 'AI/Machine Learning Engineer',
      description: 'Phát triển các mô hình AI phục vụ cho các giải pháp thông minh của công ty. Nghiên cứu và áp dụng các thuật toán mới nhất.',
      requirements: 'Nắm vững kiến thức về Python, PyTorch/TensorFlow. Có kinh nghiệm với NLP hoặc Computer Vision.',
      benefits: 'Làm việc trực tiếp với các chuyên gia hàng đầu, hỗ trợ thiết bị làm việc hiện đại, thưởng dự án.',
      salaryMin: 35000000,
      salaryMax: 60000000,
      locationCity: 'Thành phố Hồ Chí Minh',
      status: 'APPROVED',
      companyId: companyId,
      jobType: 'FULLTIME',
      jobLevel: 'STAFF',
      experience: '1-3 năm',
      jobTier: 'URGENT',
    },
  ];

  console.log('🌱 Adding 3 jobs for FPT Software...');

  for (const job of jobsData) {
    // @ts-ignore
    await prisma.jobPosting.create({
      data: job as any,
    });
  }

  console.log('✅ Added 3 jobs successfully!');
}

main()
  .catch((e) => console.error(e))
  .finally(() => prisma.$disconnect());
