const { PrismaClient } = require('../dist/src/generated/prisma');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

const COMPANY_TARGET = "Công Ty Cổ Phần Kết Nối Nhân Lực Worklink Việt Nam";

async function main() {
  console.log(`--- ENRICHING PROFILE: ${COMPANY_TARGET} ---`);

  const descText = `Worklink Việt Nam (Worklink) là một trong những đơn vị tư vấn nhân sự và tuyển dụng hàng đầu Việt Nam, đặc biệt thế mạnh trong lĩnh vực Headhunt (săn đầu người). 

Với sứ mệnh "Kết nối tương lai cho doanh nghiệp & người lao động", Worklink cam kết mang tới các ứng viên tài năng, chất lượng, đáp ứng 100% yêu cầu và chiến lược của khách hàng. Chúng tôi sở hữu mạng lưới mạng lưới dữ liệu khổng lồ cùng đội ngũ tư vấn viên dày dặn kinh nghiệm thực chiến trong các lĩnh vực: CNTT, Kỹ thuật, Tài chính - Ngân hàng, Sales & Marketing.`;

  const cultureText = `Tại Worklink, chúng tôi xây dựng một môi trường làm việc Động lực - Chuyên nghiệp - Gắn kết. 
- Tập trung phát triển con người: Định kỳ đào tạo, nâng cấp kỹ năng tư vấn chuẩn quốc tế.
- Thăng tiến không giới hạn: Lộ trình công danh rõ ràng cho mọi vị trí.
- Trải nghiệm làm việc 5 sao: Văn phòng hiện đại, trẻ trung, kích thích sáng tạo.
- Văn hóa Work-hard Play-hard: Liên tục có các hoạt động Teambuilding, Du lịch nghỉ dưỡng hàng năm cực kỳ sôi động.`;

  const result = await prisma.company.updateMany({
      where: { 
          companyName: { contains: "Worklink" } 
      },
      data: {
          description: descText,
          websiteUrl: "https://worklink.com.vn",
          address: "Tầng 5, Tòa nhà D2, Giảng Võ, Ba Đình, Hà Nội",
          companySize: 500,
          verifyStatus: 1, // MARK AS VERIFIED
          isRegistered: true,
          cultureContent: cultureText,
          enterpriseType: "Công ty cổ phần",
          internationalName: "WORKLINK VIETNAM MANPOWER JOINT STOCK COMPANY",
          shortName: "WORKLINK VN",
          taxAddress: "Số 12 Ngách 22/44 Láng Hạ, Phường Láng Hạ, Quận Đống Đa, Thành phố Hà Nội, Việt Nam"
      }
  });

  if (result.count === 0) {
      console.error("FAILED: Target company not found for updating.");
  } else {
      console.log(`\n✅ SUCCESS: Enriched profile for ${result.count} matching company record(s).`);
      console.log("Status set to VERIFIED. Dynamic metadata populated!");
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
