import { PrismaClient } from '../src/generated/prisma';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter } as any);

async function main() {
  console.log('🌱 Seeding jobs for Nguyễn Thu Thủy...');

  // Ensure there's a company to post jobs
  let company = await prisma.company.findFirst();
  if (!company) {
    company = await prisma.company.create({
      data: {
        companyName: 'Công ty Cổ phần Công nghệ Workly',
        description: 'Nền tảng tuyển dụng thông minh hàng đầu.',
        address: 'Quận 1, TP. Hồ Chí Minh',
      },
    });
  }

  const jobsData = [
    {
      title: 'Chuyên viên Chăm sóc khách hàng (Tiếng Anh)',
      description: '• Tiếp nhận, xử lý các yêu cầu, thắc mắc và khiếu nại của khách hàng quốc tế qua đa kênh (Email, Live Chat, Hotline) theo tiêu chuẩn SLA của công ty.\n• Hướng dẫn khách hàng sử dụng các tính năng trên nền tảng phần mềm SaaS một cách hiệu quả nhất.\n• Ghi nhận phản hồi của người dùng và phối hợp chặt chẽ với đội ngũ Product & Tech để cải tiến chất lượng sản phẩm.\n• Chủ động theo dõi tiến độ xử lý các ticket lỗi và cập nhật tình trạng liên tục cho khách hàng.\n• Tham gia xây dựng hệ thống tài liệu hướng dẫn sử dụng (Help Center) bằng cả tiếng Anh và tiếng Việt.',
      requirements: '• Tốt nghiệp Đại học/Cao đẳng các chuyên ngành Kinh tế, Ngoại ngữ, Quản trị Kinh doanh hoặc tương đương.\n• Trình độ Tiếng Anh xuất sắc (tương đương IELTS 6.5 trở lên), có khả năng nghe nói đọc viết lưu loát trong môi trường kinh doanh.\n• Tối thiểu 1 năm kinh nghiệm làm việc ở vị trí Customer Service, Customer Support hoặc các vai trò tương đương (ưu tiên kinh nghiệm trong ngành IT/SaaS).\n• Kỹ năng giao tiếp khéo léo, xử lý tình huống linh hoạt và khả năng kiểm soát cảm xúc tốt.\n• Có tư duy lấy khách hàng làm trọng tâm (Customer-centric) và tinh thần trách nhiệm cao.',
      benefits: '• Mức lương cạnh tranh: 12,000,000 - 18,000,000 VNĐ (thỏa thuận theo năng lực) + Thưởng KPI hàng tháng.\n• Lương tháng 13 và review lương 2 lần/năm dựa trên hiệu suất công việc.\n• Được đóng BHXH, BHYT, BHTN đầy đủ ngay sau khi kết thúc thử việc.\n• Gói bảo hiểm sức khỏe toàn diện PVI Care cho bản thân sau 1 năm gắn bó.\n• Môi trường làm việc trẻ trung, năng động, văn hóa cởi mở, trang thiết bị làm việc hiện đại (Macbook/Dell XPS).\n• Company trip hàng năm và các hoạt động team building phong phú.',
      salaryMin: 12000000,
      salaryMax: 18000000,
      locationCity: 'Thành phố Hồ Chí Minh',
      status: 'APPROVED',
      companyId: company.companyId,
      jobType: 'FULLTIME',
      jobLevel: 'STAFF',
      experience: '1-3 năm',
    },
    {
      title: 'Chuyên viên Phát triển Thị trường & Quản trị Kinh doanh (B2B)',
      description: '• Nghiên cứu và phân tích xu hướng thị trường, đối thủ cạnh tranh để xác định các cơ hội kinh doanh mới trong mảng dịch vụ B2B.\n• Chủ động tìm kiếm, tiếp cận và thiết lập cuộc họp với các đối tác doanh nghiệp tiềm năng (Lead Generation).\n• Thuyết trình, tư vấn giải pháp và đàm phán ký kết hợp đồng thương mại với khách hàng doanh nghiệp.\n• Quản lý và duy trì mối quan hệ tốt đẹp với mạng lưới khách hàng hiện tại để khai thác cơ hội up-sell/cross-sell.\n• Phối hợp với phòng Marketing để lên kế hoạch và triển khai các chiến dịch thúc đẩy tăng trưởng doanh số.\n• Thực hiện các báo cáo định kỳ về hiệu quả kinh doanh và đề xuất chiến lược tối ưu lên Ban Giám đốc.',
      requirements: '• Tốt nghiệp Cử nhân chuyên ngành Quản trị Kinh doanh, Kinh tế, Thương mại hoặc các ngành liên quan.\n• Có kinh nghiệm dưới 1 năm hoặc mới ra trường đam mê lĩnh vực Sales/Business Development (có định hướng phát triển lâu dài).\n• Kỹ năng giao tiếp, đàm phán và thuyết trình xuất sắc; tự tin khi tiếp xúc với khách hàng cấp quản lý/C-level.\n• Tư duy phân tích nhạy bén, khả năng chịu áp lực cao và luôn định hướng kết quả (Result-oriented).\n• Sử dụng thành thạo tin học văn phòng (Word, Excel, PowerPoint) và có kinh nghiệm sử dụng CRM là một lợi thế.',
      benefits: '• Thu nhập hấp dẫn: Lương cơ bản 10,000,000 VNĐ + Hoa hồng không giới hạn (Tổng thu nhập có thể lên tới 25,000,000 - 35,000,000 VNĐ).\n• Lộ trình thăng tiến rõ ràng lên các vị trí Trưởng nhóm, Giám đốc Kinh doanh khu vực sau 1-2 năm.\n• Được đào tạo bài bản về kiến thức sản phẩm, kỹ năng bán hàng B2B chuyên nghiệp và kỹ năng quản lý.\n• Chế độ phúc lợi đầy đủ theo quy định của Luật Lao động (BHXH, ngày phép, lễ tết).\n• Trợ cấp chi phí đi lại, điện thoại, tiếp khách.\n• Tham gia các chương trình đào tạo nội bộ và workshop nâng cao năng lực định kỳ.',
      salaryMin: 10000000,
      salaryMax: 25000000,
      locationCity: 'Thành phố Hồ Chí Minh',
      status: 'APPROVED',
      companyId: company.companyId,
      jobType: 'FULLTIME',
      jobLevel: 'STAFF',
      experience: 'Dưới 1 năm',
    },
    {
      title: 'Chuyên viên Quản lý Thành công Khách hàng (Customer Success Executive)',
      description: '• Quản lý trực tiếp danh mục khách hàng doanh nghiệp (Key Accounts), đảm bảo khách hàng luôn hài lòng với chất lượng dịch vụ.\n• Tổ chức các buổi đào tạo (Onboarding & Training) để hướng dẫn khách hàng ứng dụng phần mềm vào quy trình vận hành.\n• Theo dõi và phân tích các chỉ số sức khỏe của khách hàng (Customer Health Score), tỷ lệ giữ chân (Retention Rate) để có phương án chăm sóc kịp thời.\n• Nhận diện rủi ro khách hàng rời bỏ (Churn Risk) và chủ động đưa ra các giải pháp can thiệp nhằm giữ chân khách hàng.\n• Phối hợp với đội ngũ Sales để thực hiện các chiến lược gia hạn hợp đồng (Renewal) và bán chéo sản phẩm (Cross-sell).\n• Đóng vai trò là đại diện tiếng nói của khách hàng trong nội bộ, đề xuất các cải tiến sản phẩm dựa trên nhu cầu thực tế.',
      requirements: '• Có 2-5 năm kinh nghiệm làm việc ở vị trí Customer Success, Account Management hoặc B2B Sales (đặc biệt ưu tiên ứng viên có background IT/Software/SaaS).\n• Kỹ năng quản trị mối quan hệ xuất sắc, khả năng xây dựng lòng tin với khách hàng doanh nghiệp.\n• Tư duy logic, phân tích dữ liệu tốt để hiểu rõ hành vi và nhu cầu của người dùng.\n• Khả năng giải quyết vấn đề linh hoạt (Problem-solving) và xử lý tình huống khủng hoảng hiệu quả.\n• Giao tiếp tiếng Anh tốt là một lợi thế lớn để làm việc với các đối tác nước ngoài.\n• Tinh thần làm việc nhóm cao, sẵn sàng hỗ trợ đồng nghiệp để đạt mục tiêu chung.',
      benefits: '• Mức lương cơ bản thỏa thuận theo năng lực từ 15,000,000 - 20,000,000 VNĐ.\n• Thưởng hiệu suất (Performance Bonus) hàng quý dựa trên tỷ lệ Retention và Upsell thành công.\n• Xét tăng lương định kỳ 1 lần/năm hoặc đột xuất nếu có thành tích xuất sắc.\n• Thời gian làm việc linh hoạt (Hybrid working áp dụng 2 ngày/tuần làm việc tại nhà).\n• Bảo hiểm chăm sóc sức khỏe cao cấp PVI Care.\n• Được cung cấp đầy đủ các phần mềm, công cụ làm việc hiện đại nhất (Salesforce, Zendesk, Slack, v.v.).\n• Văn phòng hạng A tại trung tâm TP.HCM, pantry luôn đầy đủ đồ ăn nhẹ và thức uống miễn phí.',
      salaryMin: 15000000,
      salaryMax: 20000000,
      locationCity: 'Thành phố Hồ Chí Minh',
      status: 'APPROVED',
      companyId: company.companyId,
      jobType: 'FULLTIME',
      jobLevel: 'STAFF',
      experience: '2-5 năm',
    },
  ];

  for (const job of jobsData) {
    await prisma.jobPosting.create({
      data: job as any,
    });
  }

  console.log('✅ Seeded 3 jobs successfully!');
}

main()
  .catch((e) => console.error(e))
  .finally(() => prisma.$disconnect());
