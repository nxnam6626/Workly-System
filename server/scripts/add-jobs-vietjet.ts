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
  const companyId = '7ea88e91-9e49-4221-9275-079b6e697795'; // Vietjet Air
  
  const jobsData = [
    {
      title: 'Tiếp viên hàng không (Cabin Crew)',
      description: '• Đảm bảo an toàn và an ninh cho hành khách trong suốt chuyến bay.\n• Cung cấp dịch vụ chất lượng cao, phục vụ ăn uống và hỗ trợ hành khách.\n• Thực hiện các quy trình khẩn cấp khi cần thiết.\n• Đại diện hình ảnh chuyên nghiệp và thân thiện của Vietjet Air.',
      requirements: '• Tốt nghiệp THPT trở lên. Chiều cao: Nữ từ 1m60, Nam từ 1m70.\n• Tiếng Anh giao tiếp tốt (TOEIC 500 trở lên).\n• Ngoại hình ưa nhìn, sức khỏe tốt, không có hình xăm lộ diện.\n• Kỹ năng giao tiếp và xử lý tình huống tốt.',
      benefits: '• Thu nhập hấp dẫn, cơ hội đi du lịch khắp nơi.\n• Môi trường làm việc quốc tế, năng động.\n• Chế độ vé máy bay ưu đãi cho bản thân và gia đình.\n• Đào tạo bài bản theo tiêu chuẩn hàng không quốc tế.',
      salaryMin: 15000000,
      salaryMax: 30000000,
      locationCity: 'Toàn quốc',
      status: 'APPROVED',
      companyId: companyId,
      jobType: 'FULLTIME',
      jobLevel: 'STAFF',
      experience: 'Không yêu cầu kinh nghiệm',
      jobTier: 'URGENT',
    },
    {
      title: 'Kỹ sư Bảo dưỡng Máy bay (Aircraft Maintenance Engineer)',
      description: '• Thực hiện bảo dưỡng, sửa chữa máy bay theo đúng quy trình và tiêu chuẩn an toàn.\n• Kiểm tra định kỳ các hệ thống kỹ thuật của máy bay.\n• Phối hợp với đội ngũ kỹ thuật để đảm bảo máy bay luôn trong tình trạng sẵn sàng bay.\n• Ghi chép và báo cáo kỹ thuật đầy đủ.',
      requirements: '• Tốt nghiệp Đại học chuyên ngành Kỹ thuật Hàng không hoặc các ngành liên quan.\n• Có chứng chỉ hành nghề bảo dưỡng máy bay (B1/B2) là một lợi thế lớn.\n• Tiếng Anh chuyên ngành tốt (TOEIC 600 trở lên).\n• Cẩn thận, tỉ mỉ và có trách nhiệm cao với công việc.',
      benefits: '• Mức lương thỏa thuận theo năng lực và chứng chỉ.\n• Tham gia các khóa đào tạo chuyên sâu tại nước ngoài.\n• Bảo hiểm sức khỏe cao cấp, thưởng lễ tết.\n• Cơ hội thăng tiến rõ ràng trong ngành hàng không.',
      salaryMin: 25000000,
      salaryMax: 50000000,
      locationCity: 'Thành phố Hồ Chí Minh',
      status: 'APPROVED',
      companyId: companyId,
      jobType: 'FULLTIME',
      jobLevel: 'STAFF',
      experience: '2-5 năm',
      jobTier: 'PROFESSIONAL',
    },
  ];

  console.log('🌱 Adding 2 jobs for Vietjet Air...');

  for (const job of jobsData) {
    // @ts-ignore
    await prisma.jobPosting.create({
      data: job as any,
    });
  }

  console.log('✅ Added 2 jobs for Vietjet Air successfully!');
}

main()
  .catch((e) => console.error(e))
  .finally(() => prisma.$disconnect());
