import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

async function seed() {
  const connectionString = process.env.DATABASE_URL;
  const pool = new Pool({ connectionString, family: 4 } as any);
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });
  
  try {
    const recruiter = await prisma.recruiter.findFirst({
      where: { user: { email: 'zighdevil@gmail.com' } }
    });

    if (!recruiter || !recruiter.companyId) {
      console.log('No company found for this user');
      return;
    }

    const companyId = recruiter.companyId;

    // 1. Sections
    const sections = [
      {
        title: 'Giới thiệu công ty VN CONCENTRIX SERVICES CO., LTD',
        type: 'INTRODUCTION',
        content: 'Concentrix là một công ty hàng đầu thế giới của Mỹ trong lĩnh vực dịch vụ chăm sóc khách hàng có mặt ở trên 44 quốc gia với tổng số nhân sự lên tới trên 250.000 nhân viên. Concentrix Việt Nam luôn đầu tư và nỗ lực nhằm cung cấp môi trường tốt nhất như: Cơ hội học hỏi & phát triển Kết nối thường xuyên với nhân viên, tạo môi trường tốt để lắng nghe và tôn trọng tiếng nói nhân viên cũng như giá trị tập thể Đầy đủ cơ hội phát triển nhân viên Công nhận sự nỗ lực và sự cống hiến từ các cá nhân và tập thể Sự khác biệt lớn khi có sự đồng hành tuyệt vời từ đội ngũ nhân viên Concentrix. Với sứ mệnh luôn chú trọng con người là nhân tố chủ lực, chính điều này đã trở thành một trong các yếu tố quan trọng giúp chúng tôi chiến thắng với giải thưởng cao quý và uy tín " Công ty có môi trường làm việc tốt nhất Châu Á năm 2020" – Được bình chọn bởi Tạp chí HR Asia - Là một trong những ấn phẩm hàng đầu Châu Á dành cho Hiệp hội Nhân sự. Giải thưởng cao quý này là sự ghi nhận cho những nỗ lực của Gia đình Concentrix! Chúng tôi không quên gửi lời chân thành Cảm ơn sâu sắc tới đội ngũ Ban Lãnh đạo, Ban Quản lý cùng hơn 1000 nhân viên đã luôn nhiệt huyết, nỗ lực và đồng hành cùng Concentrix.',
        displayOrder: 1
      },
      {
        title: 'Chính sách phát triển nhân lực',
        type: 'HR_POLICY',
        content: 'Tầm nhìn, tốc độ, giá trị\n\nBộ ba nguyên tắc chỉ nam trong cách công ty chúng tôi vận hành.\n\nTầm nhìn trong toàn tổ chức giúp chúng tôi nhanh chóng nhận biết và giải quyết các vấn đề cũng như nắm bắt các cơ hội.\n\nTốc độ giúp chúng tôi nhanh chóng thích nghi và dự đoán được những thay đổi trên thị trường và trong hoạt động kinh doanh của khách hàng.\n\nGiá trị luôn được cân nhắc và duy trì trong tất cả hoạt động mà chúng tôi thực hiện với các nhân tố thay đổi cuộc chơi, cũng như phía khách hàng và cổ đông.',
        displayOrder: 2
      },
      {
        title: 'Cơ hội thăng tiến',
        type: 'ADVANCEMENT',
        content: 'Đầu tư phát triển mở rộng, cũng như tạo những cơ hội cho Nhân Viên. Concentrix luôn hỗ trợ để các bạn có thể lên nhưng cấp bậc cao hơn: Team Lead, Operation manager,..Cũng như các bộ phận và vị trí mong muốn: Hiring, Trainer, QC,....\n\nCó lộ trình thăng tiến rõ ràng qua từng giai đoạn khi các bạn gắn bó cũng như có Kết quả làm việc tốt.',
        displayOrder: 3
      },
      {
        title: 'Lương, thưởng, lợi nhuận',
        type: 'SALARY',
        content: 'Chúng tôi không ngừng đầu tư vào văn hóa công ty với sự quan tâm đặc biệt dành cho những nhân tố thay đổi cuộc chơi:\n- Chế độ đãi ngộ cạnh tranh cùng các quyền lợi bổ sung tùy theo vị trí\n- Thưởng hiệu suất hoặc thưởng chào mừng\n- Thưởng khi giới thiệu bạn bè gia nhập Concentrix\n- Hỗ trợ di dời thông qua chương trình Làm việc ở nước ngoài\n- Đào tạo và huấn luyện trả phí\n- Giảm giá, phiếu quà tặng và ưu đãi tại các doanh nghiệp đối tác của chúng tôi',
        displayOrder: 4
      }
    ];

    for (const section of sections) {
      await (prisma as any).companySection.create({
        data: { ...section, companyId }
      });
    }

    // 2. Benefits
    const benefits = [
      'Bảo hiểm sức khỏe',
      'Bảo hiểm xã hội',
      'Bóng đá',
      'Du lịch',
      'Câu lạc bộ',
      'Team building',
      'Thể thao',
      'Party',
      'Tình nguyện'
    ];

    for (const benefit of benefits) {
      await (prisma as any).companyBenefit.create({
        data: { title: benefit, companyId }
      });
    }

    // 3. History
    await (prisma as any).companyHistory.create({
      data: { year: 2017, event: 'Công ty được thành lập', companyId }
    });

    console.log('Successfully seeded Concentrix data!');
  } catch (error) {
    console.error('Error seeding data:', error);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

seed();
