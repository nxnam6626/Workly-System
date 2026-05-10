const { PrismaClient } = require('../dist/src/generated/prisma');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

async function main() {
  console.log(">>> POPULATING RICH CULTURE DATA FOR WORKLINK...");

  const company = await prisma.company.findUnique({
    where: { taxCode: "0106753155" }
  });

  if (!company) {
    console.error("Target company NOT found!");
    return;
  }

  const companyId = company.companyId;
  console.log(`Found Target Company ID: ${companyId}`);

  // 1. Clear previous culture arrays for a clean slate overwrite
  await prisma.companySection.deleteMany({ where: { companyId } });
  await prisma.companyBenefit.deleteMany({ where: { companyId } });
  await prisma.companyHistory.deleteMany({ where: { companyId } });

  console.log("Cleared existing stale culture tables...");

  // 2. Add Core Sections
  await prisma.companySection.createMany({
    data: [
      {
        companyId,
        type: 'HR_POLICY',
        title: 'Chính sách nhân sự',
        content: `Tại Worklink, yếu tố Con người là tài sản quý giá nhất. Chúng tôi áp dụng quy trình minh bạch:
- Quy chuẩn Onboarding chuyên nghiệp, kèm cặp 1-1 trong 2 tháng đầu.
- Đánh giá KPI 6 tháng/lần minh bạch, cởi mở.
- Khuyến khích sự sáng tạo cá nhân và không phân biệt thứ bậc trong đóng góp ý tưởng.`
      },
      {
        companyId,
        type: 'ADVANCEMENT',
        title: 'Cơ hội thăng tiến',
        content: `Lộ trình sự nghiệp rõ ràng từ Trainee -> Consultant -> Senior -> Team Leader -> Manager.
Hàng quý công ty tài trợ 100% các khóa học nâng cao kỹ năng headhunt quốc tế và chứng chỉ SHRM chuyên sâu.`
      },
      {
        companyId,
        type: 'SALARY',
        title: 'Lương & Thưởng',
        content: `Chính sách đãi ngộ TOP thị trường HR:
- Lương cứng cạnh tranh + % Commission hoa hồng cao nhất khối Headhunt.
- Lương tháng 13 chắc chắn và thưởng mềm kinh doanh lên tới 4-6 tháng lương.
- Review lương cố định hàng năm.`
      },
      {
        companyId,
        type: 'INSURANCE',
        title: 'Bảo hiểm',
        content: `Ngoài BHXH theo Luật quy định, Worklink mua tặng gói bảo hiểm sức khỏe tư nhân cao cấp PVI/Liberty cho CBNV thâm niên trên 1 năm và người thân.`
      },
      {
        companyId,
        type: 'ACTIVITIES',
        title: 'Hoạt động',
        content: `Teambuilding quý sôi động tại các khu resort nghỉ dưỡng. Tiệc sinh nhật hàng tháng, câu lạc bộ Yoga chiều thứ 6 tại văn phòng và Giải đá bóng nam/nữ Worklink Cup thường niên.`
      },
      // 3 CUSTOM GENERAL SECTIONS!
      {
        companyId,
        type: 'GENERAL',
        title: 'Giá trị cốt lõi: TÂM - TÍN - NHÂN',
        content: `3 Trụ cột văn hóa soi sáng mọi hành động của chúng tôi:
- TÂM: Làm nghề bằng sự tử tế và đặt đạo đức tuyển dụng lên hàng đầu.
- TÍN: Luôn giữ cam kết về chất lượng ứng viên đối với doanh nghiệp đối tác.
- NHÂN: Coi trọng yếu tố nhân văn, sẻ chia trách nhiệm xã hội.`
      },
      {
        companyId,
        type: 'GENERAL',
        title: 'Văn phòng Hiện đại & Xanh',
        content: `Tọa lạc tại Tầng 5 tòa nhà D2 trung tâm, văn phòng Worklink thiết kế không gian mở, 40% diện tích phủ xanh cây thật, có khu vực Pantry đầy ắp đồ ăn vặt miễn phí và Ghế massage thư giãn cho nhân viên.`
      }
    ]
  });

  // 3. Add Rich History Milestones
  await prisma.companyHistory.createMany({
    data: [
      { companyId, year: '2013', event: 'Thành lập Startup nhân sự nhỏ với quy mô 5 thành viên sáng lập tại Hà Nội.' },
      { companyId, year: '2015', event: 'Cán mốc 500 khách hàng doanh nghiệp đầu tiên tin tưởng sử dụng dịch vụ headhunt.' },
      { companyId, year: '2018', event: 'Chính thức Nam tiến, khai trương chi nhánh Văn phòng TP.HCM quy mô lớn.' },
      { companyId, year: '2022', event: 'Đạt giải thưởng Top 10 Công ty Cung ứng nhân lực Uy tín nhất Việt Nam.' },
      { companyId, year: '2024', event: 'Chuyển đổi số toàn diện quy trình tuyển dụng AI và đặt mục tiêu vươn tầm Đông Nam Á.' }
    ]
  });

  // 4. Add Visual Benefits
  await prisma.companyBenefit.createMany({
    data: [
      { companyId, title: 'Bảo hiểm sức khỏe PVI' },
      { companyId, title: 'Du lịch trong & ngoài nước hàng năm' },
      { companyId, title: 'Team building hàng quý' },
      { companyId, title: 'Lương thưởng hấp dẫn + Hoa hồng lũy tiến' },
      { companyId, title: 'Laptop đời mới xịn sò' },
      { companyId, title: 'Café & Snack pantry free every day' },
      { companyId, title: 'Khóa đào tạo nghiệp vụ chuyên sâu' },
      { companyId, title: 'Cơ hội thăng tiến công bằng' }
    ]
  });

  console.log("\n🎉 ALL RICHDATA INJECTED SUCCESSFULLY!");
  console.log("✅ 7 Core & Custom Sections created.");
  console.log("✅ 5 History milestones injected.");
  console.log("✅ 8 Corporate Benefits mapped.");
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
