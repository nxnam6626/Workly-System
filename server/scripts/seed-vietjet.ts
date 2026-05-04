import { PrismaClient } from '../src/generated/prisma';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter } as any);

async function main() {
  const vietjet = await prisma.company.findFirst({
    where: {
      companyName: {
        contains: 'Vietjet',
        mode: 'insensitive'
      }
    }
  });

  if (vietjet) {
    console.log('Found Vietjet:', vietjet.companyId);
    
    // Update basic info
    await prisma.company.update({
      where: { companyId: vietjet.companyId },
      data: {
        logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/60/VietJet_Air_logo.svg/2560px-VietJet_Air_logo.svg.png',
        banner: 'https://vcdn1-kinhdoanh.vnecdn.net/2023/04/26/VJ1-1682500000-8547-1682501046.jpg?w=1200&h=0&q=100&dpr=1&fit=crop&s=K88sHkU1VlQpY6O0p3fX6A',
        description: 'Vietjet Air là hãng hàng không tư nhân đầu tiên của Việt Nam, hoạt động theo mô hình hàng không thế hệ mới (New Age Carrier). Với tầm nhìn trở thành hãng hàng không đa quốc gia, Vietjet không ngừng mở rộng mạng bay và nâng cao chất lượng dịch vụ, mang lại cơ hội bay cho hàng triệu người dân.',
        websiteUrl: 'https://www.vietjetair.com',
        companySize: 5000,
        mainIndustry: 'Hàng không & Du lịch',
        address: '302 Kim Mã, Phường Ngọc Khánh, Quận Ba Đình, Hà Nội'
      }
    });

    // Clear old sections/benefits/history for a fresh test
    await prisma.companySection.deleteMany({ where: { companyId: vietjet.companyId } });
    await prisma.companyBenefit.deleteMany({ where: { companyId: vietjet.companyId } });
    await prisma.companyHistory.deleteMany({ where: { companyId: vietjet.companyId } });

    // Add ALL Sections
    await prisma.companySection.createMany({
      data: [
        {
          companyId: vietjet.companyId,
          title: 'Môi trường làm việc "Xanh" và Hiện đại',
          content: 'Trụ sở chính của Vietjet (Vietjet Plaza) được thiết kế theo phong cách hiện đại, thân thiện với môi trường với nhiều không gian xanh. Tại đây, nhân viên được tận hưởng các tiện ích đẳng cấp như:\n- Khu ẩm thực phong phú\n- Phòng tập Gym & Yoga hiện đại\n- Phòng chiếu phim giải trí\n- Không gian làm việc mở thúc đẩy sự sáng tạo và kết nối.',
          type: 'INTRODUCTION',
          displayOrder: 0
        },
        {
          companyId: vietjet.companyId,
          title: 'Tôn trọng sự khác biệt',
          content: 'Vietjet luôn coi con người là tài sản quý giá nhất. Chúng tôi xây dựng chính sách nhân sự dựa trên sự công bằng, minh bạch và tôn trọng sự khác biệt. Đội ngũ nhân viên đến từ hơn 50 quốc gia tạo nên một môi trường đa văn hóa, năng động.',
          type: 'HR_POLICY',
          displayOrder: 1
        },
        {
          companyId: vietjet.companyId,
          title: 'Lộ trình sự nghiệp không giới hạn',
          content: 'Tại Vietjet, lộ trình sự nghiệp được thiết kế rõ ràng cho từng vị trí. Học viện Hàng không Vietjet cung cấp các khóa đào tạo định kỳ giúp nhân viên nâng cao kỹ năng chuyên môn và kỹ năng mềm, sẵn sàng cho các vị trí quản lý cấp cao.',
          type: 'ADVANCEMENT',
          displayOrder: 2
        },
        {
          companyId: vietjet.companyId,
          title: 'Lương thưởng cạnh tranh',
          content: 'Chế độ lương thưởng cạnh tranh so với thị trường. Ngoài lương cơ bản, nhân viên còn được hưởng thưởng doanh thu, thưởng hiệu quả công việc và các khoản trợ cấp đặc thù theo ngành hàng không.',
          type: 'SALARY',
          displayOrder: 3
        },
        {
          companyId: vietjet.companyId,
          title: 'An tâm công tác',
          content: 'Đảm bảo đầy đủ các chế độ BHXH, BHYT, BHTN theo quy định. Đặc biệt, nhân viên được tham gia các gói bảo hiểm sức khỏe cao cấp (PVI/Liberty) và bảo hiểm tai nạn 24/7.',
          type: 'INSURANCE',
          displayOrder: 4
        },
        {
          companyId: vietjet.companyId,
          title: 'Kết nối đam mê',
          content: 'Các hoạt động gắn kết sôi nổi: Team building hàng năm, giải bóng đá Vietjet Cup, các câu lạc bộ sở thích (Yoga, Chạy bộ). Đặc biệt là các sự kiện văn hóa nghệ thuật lớn diễn ra thường xuyên.',
          type: 'ACTIVITIES',
          displayOrder: 5
        },
        {
          companyId: vietjet.companyId,
          title: 'Đặc quyền bay 0 đồng',
          content: 'Chế độ vé máy bay 0 đồng cho nhân viên và gia đình trên toàn mạng bay của Vietjet. Đây là đặc quyền tuyệt vời giúp bạn và người thân khám phá những vùng đất mới một cách dễ dàng.',
          type: 'GENERAL',
          displayOrder: 6
        }
      ]
    });

    // Add Benefits
    await prisma.companyBenefit.createMany({
      data: [
        { companyId: vietjet.companyId, title: 'Bảo hiểm sức khỏe cao cấp' },
        { companyId: vietjet.companyId, title: 'Vé máy bay miễn phí' },
        { companyId: vietjet.companyId, title: 'Đào tạo quốc tế' },
        { companyId: vietjet.companyId, title: 'Du lịch hàng năm' },
        { companyId: vietjet.companyId, title: 'Phụ cấp hấp dẫn' },
      ]
    });

    // Add History
    await prisma.companyHistory.createMany({
      data: [
        { companyId: vietjet.companyId, year: '2007-10-10', event: 'Nhận giấy phép thành lập hãng hàng không tư nhân đầu tiên.' },
        { companyId: vietjet.companyId, year: '2011-12-24', event: 'Thực hiện chuyến bay đầu tiên kết nối TP.HCM và Hà Nội.' },
        { companyId: vietjet.companyId, year: '2017-02-28', event: 'Niêm yết cổ phiếu VJC trên Sở Giao dịch Chứng khoán TP.HCM (HOSE).' },
        { companyId: vietjet.companyId, year: '2023-01-01', event: 'Phục vụ hơn 150 triệu lượt khách hàng trên toàn mạng bay.' },
      ]
    });

    console.log('Vietjet ALL sections updated with professional content!');
  } else {
    console.log('Vietjet not found.');
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
