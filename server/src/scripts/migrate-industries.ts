import 'dotenv/config';
import { PrismaClient } from '@/generated/prisma';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString, family: 4 } as any);
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const MAPPING: Record<string, string> = {
  'CNTT / Phần mềm': 'Công Nghệ Thông Tin',
  'Marketing / Truyền thông': 'Marketing/PR/Quảng Cáo',
  'Kinh doanh / Bán hàng': 'Kinh Doanh/Bán Hàng',
  'Hành chính / Văn phòng': 'Hành Chính/Văn Phòng',
  'Tài chính / Kế toán / Ngân hàng': 'Kế Toán/Kiểm Toán',
  'Kỹ thuật / Cơ khí / Sản xuất': 'Cơ Khí/Ô Tô/Tự Động Hoá',
  'Content / SEO': 'Marketing/PR/Quảng Cáo',
  'Thiết kế / Sáng tạo': 'Thiết Kế',
  'Xây dựng / Kiến trúc': 'Xây Dựng/Kiến Trúc/Nội Thất',
  'Vận tải / Logistics / Cung ứng': 'Chuỗi Cung Ứng/Kho Vận/Xuất Nhập Khẩu',
  'Bán lẻ / LFP / Thời trang': 'Bán Sỉ/Bán Lẻ/Quản Lý Cửa Hàng',
  'Nhà hàng / Khách sạn / Du lịch': 'Nhà Hàng/Khách sạn/Du Lịch',
  'Y tế / Dược phẩm / Sức khỏe': 'Y Tế/Sức khoẻ/Dược Phẩm',
  'Giáo dục / Đào tạo / Ngôn ngữ': 'Giáo Dục/Đào Tạo',
  'Nông nghiệp / Môi trường': 'Nông/Lâm/Ngư Nghiệp',
  'Bất động sản': 'Bất Động Sản',
  'Truyền thông / Sự kiện': 'Marketing/PR/Quảng Cáo',
  'Thể thao / Làm đẹp / Giải trí': 'Mỹ Phẩm/Spa/Làm Đẹp',
  'Bảo hiểm / Tư vấn': 'Bảo Hiểm',
  'Đa lĩnh vực / Khác': 'Ngành Nghề Khác',
};

async function main() {
  console.log('--- Bắt đầu migration ngành nghề ---');

  // 1. Migrate JobPostings
  const jobs = await prisma.jobPosting.findMany();
  console.log(`Tìm thấy ${jobs.length} tin tuyển dụng.`);

  for (const job of jobs) {
    if (job.structuredRequirements) {
      const reqs = job.structuredRequirements as any;
      if (reqs.categories && Array.isArray(reqs.categories)) {
        const newCategories = reqs.categories.map((cat: string) => MAPPING[cat] || cat);
        const uniqueCategories = Array.from(new Set(newCategories));

        if (JSON.stringify(reqs.categories) !== JSON.stringify(uniqueCategories)) {
          await prisma.jobPosting.update({
            where: { jobPostingId: job.jobPostingId },
            data: {
              structuredRequirements: {
                ...reqs,
                categories: uniqueCategories,
              },
            },
          });
          console.log(`Đã cập nhật Job: ${job.title}`);
        }
      }
    }
  }

  // 2. Migrate Candidates
  const candidates = await prisma.candidate.findMany({
    where: {
      industries: {
        isEmpty: false,
      },
    },
  });
  console.log(`Tìm thấy ${candidates.length} ứng viên có thông tin ngành nghề.`);

  for (const candidate of candidates) {
    const newIndustries = candidate.industries.map((ind) => MAPPING[ind] || ind);
    const uniqueIndustries = Array.from(new Set(newIndustries));

    if (JSON.stringify(candidate.industries) !== JSON.stringify(uniqueIndustries)) {
      await prisma.candidate.update({
        where: { candidateId: candidate.candidateId },
        data: {
          industries: uniqueIndustries,
        },
      });
      console.log(`Đã cập nhật Ứng viên: ${candidate.fullName}`);
    }
  }

  console.log('--- Hoàn tất migration ---');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
