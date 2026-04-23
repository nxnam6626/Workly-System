import { PrismaClient, JobStatus, JobTier, JobType, PostType, StatusUser } from '../src/generated/prisma';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as bcrypt from 'bcrypt';
import 'dotenv/config';

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString, family: 4 } as any);
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('--- BẮT ĐẦU DỌN DẸP DỮ LIỆU CŨ ---');
  
  // Xóa theo thứ tự để tránh lỗi khóa ngoại
  await prisma.jobMatch.deleteMany({});
  await prisma.savedJob.deleteMany({});
  await prisma.candidateUnlock.deleteMany({});
  await prisma.application.deleteMany({});
  await prisma.jobPosting.deleteMany({});
  await prisma.recruiter.deleteMany({});
  await prisma.company.deleteMany({});
  
  // Xóa các user test cũ nếu cần (Optional, nhưng để tránh conflict email)
  await prisma.user.deleteMany({
    where: {
      email: {
        contains: '_hr@test.com'
      }
    }
  });

  console.log('✅ Đã dọn dẹp sạch dữ liệu cũ.');

  const password = await bcrypt.hash('password123', 10);

  // 1. Đảm bảo vai trò tồn tại
  const roles = ['CANDIDATE', 'RECRUITER', 'ADMIN'];
  for (const roleName of roles) {
    await prisma.role.upsert({
      where: { roleName },
      update: {},
      create: { roleName },
    });
  }
  const recruiterRole = await prisma.role.findUnique({ where: { roleName: 'RECRUITER' } });

  const companiesData = [
    {
      name: 'FPT Software',
      email: 'fpt_hr@test.com',
      taxCode: '0102100683',
      industry: 'Công nghệ phần mềm',
      logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/ad/FPT_Software_logo.svg/1200px-FPT_Software_logo.svg.png',
      description: 'FPT Software là công ty thành viên của Tập đoàn FPT, hoạt động trong lĩnh vực xuất khẩu phần mềm tốt nhất Việt Nam.',
      jobs: [
        { title: 'Senior Frontend Developer (Next.js/React)', tier: JobTier.URGENT, salaryMin: 35000000, salaryMax: 55000000 },
        { title: 'AI/ML Engineer (Gemini/OpenAI)', tier: JobTier.PROFESSIONAL, salaryMin: 40000000, salaryMax: 70000000 },
        { title: 'Java Backend Architect', tier: JobTier.PROFESSIONAL, salaryMin: 50000000, salaryMax: 80000000 }
      ]
    },
    {
      name: 'Viettel Group',
      email: 'viettel_hr@test.com',
      taxCode: '0100109106',
      industry: 'Viễn thông & Công nghệ',
      logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e0/Viettel_logo_2021.svg/1200px-Viettel_logo_2021.svg.png',
      description: 'Tập đoàn Công nghiệp - Viễn thông Quân đội là doanh nghiệp viễn thông lớn nhất Việt Nam.',
      jobs: [
        { title: 'Kỹ sư Hệ thống Viễn thông 5G', tier: JobTier.URGENT, salaryMin: 30000000, salaryMax: 50000000 },
        { title: 'Chuyên gia An ninh mạng (Security)', tier: JobTier.PROFESSIONAL, salaryMin: 45000000, salaryMax: 90000000 }
      ]
    },
    {
      name: 'Vingroup',
      email: 'vin_hr@test.com',
      taxCode: '0100508851',
      industry: 'Đa ngành',
      logo: 'https://vinhomes.vn/vinhomes-corporate/upload/images/vingroup-logo.png',
      description: 'Tập đoàn kinh tế tư nhân đa ngành hàng đầu Việt Nam.',
      jobs: [
        { title: 'Quản lý Dự án Bất động sản', tier: JobTier.BASIC, salaryMin: 25000000, salaryMax: 40000000 },
        { title: 'Kỹ sư Tự động hóa VinFast', tier: JobTier.URGENT, salaryMin: 30000000, salaryMax: 60000000 }
      ]
    },
    {
      name: 'MoMo',
      email: 'momo_hr@test.com',
      taxCode: '0305289153',
      industry: 'Fintech / E-Wallet',
      logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/cd/Logo_Momo.svg/1200px-Logo_Momo.svg.png',
      description: 'Siêu ứng dụng thanh toán hàng đầu Việt Nam.',
      jobs: [
        { title: 'Product Manager (Payment)', tier: JobTier.PROFESSIONAL, salaryMin: 40000000, salaryMax: 80000000 },
        { title: 'QA Automation Engineer', tier: JobTier.BASIC, salaryMin: 20000000, salaryMax: 35000000 }
      ]
    },
    {
      name: 'Zalo - VNG',
      email: 'zalo_hr@test.com',
      taxCode: '0303491414',
      industry: 'Internet / Gaming',
      logo: 'https://vinadesign.vn/uploads/images/2023/05/vng-logo-vinadesign-25-13-54-46.jpg',
      description: 'Công ty Internet hàng đầu Việt Nam với hệ sinh thái Zalo, Zing, VNG Games.',
      jobs: [
        { title: 'Mobile Developer (Flutter/React Native)', tier: JobTier.URGENT, salaryMin: 35000000, salaryMax: 60000000 },
        { title: 'Data Scientist', tier: JobTier.PROFESSIONAL, salaryMin: 50000000, salaryMax: 100000000 }
      ]
    },
    {
      name: 'Techcombank',
      email: 'tcb_hr@test.com',
      taxCode: '0100230800',
      industry: 'Ngân hàng',
      logo: 'https://vcdn1-kinhdoanh.vnecdn.net/2021/04/22/Techcombank-Logo-JPG-3814-1619080516.jpg?w=1200&h=0&q=100&dpr=1&fit=crop&s=4G_R_3_G_R_3_G_R_3_G_R_3_G_R_3',
      description: 'Ngân hàng Thương mại Cổ phần Kỹ thương Việt Nam.',
      jobs: [
        { title: 'Business Analyst (Digital Banking)', tier: JobTier.PROFESSIONAL, salaryMin: 30000000, salaryMax: 50000000 }
      ]
    },
    {
        name: 'Shopee Vietnam',
        email: 'shopee_hr@test.com',
        taxCode: '0313564175',
        industry: 'Thương mại điện tử',
        logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/fe/Shopee.svg/1200px-Shopee.svg.png',
        description: 'Nền tảng thương mại điện tử hàng đầu tại Việt Nam và Đông Nam Á.',
        jobs: [
          { title: 'Operation Specialist', tier: JobTier.BASIC, salaryMin: 15000000, salaryMax: 25000000 },
          { title: 'Business Development Executive', tier: JobTier.PROFESSIONAL, salaryMin: 20000000, salaryMax: 35000000 }
        ]
      },
      {
        name: 'Grab Vietnam',
        email: 'grab_hr@test.com',
        taxCode: '0312650437',
        industry: 'Vận tải & Công nghệ',
        logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/21/Grab_logo_2021.svg/1200px-Grab_logo_2021.svg.png',
        description: 'Siêu ứng dụng Grab cung cấp giải pháp vận chuyển, giao thức ăn và thanh toán.',
        jobs: [
          { title: 'Strategy & Planning Manager', tier: JobTier.PROFESSIONAL, salaryMin: 45000000, salaryMax: 70000000 }
        ]
      },
      {
        name: 'VNPT',
        email: 'vnpt_hr@test.com',
        taxCode: '0100684399',
        industry: 'Viễn thông',
        logo: 'https://vnpt.com.vn/static/images/logo.png',
        description: 'Tập đoàn Bưu chính Viễn thông Việt Nam.',
        jobs: [
          { title: 'Kỹ sư mạng & Cloud', tier: JobTier.BASIC, salaryMin: 18000000, salaryMax: 30000000 }
        ]
      },
      {
        name: 'Samsung Vina',
        email: 'samsung_hr@test.com',
        taxCode: '0301131142',
        industry: 'Điện tử tiêu dùng',
        logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/24/Samsung_Logo.svg/2560px-Samsung_Logo.svg.png',
        description: 'Tập đoàn điện tử hàng đầu thế giới với trung tâm nghiên cứu tại Việt Nam.',
        jobs: [
          { title: 'Software Engineer (R&D)', tier: JobTier.PROFESSIONAL, salaryMin: 30000000, salaryMax: 50000000 }
        ]
      },
      {
        name: 'TikTok Vietnam',
        email: 'tiktok_hr@test.com',
        taxCode: '0316447881',
        industry: 'Mạng xã hội',
        logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/a/a9/TikTok_logo.svg/1200px-TikTok_logo.svg.png',
        description: 'TikTok là nền tảng video âm nhạc và mạng xã hội đến từ Trung Quốc dành cho các thị trường bên ngoài Trung Quốc.',
        jobs: [
          { title: 'Community Management Specialist', tier: JobTier.BASIC, salaryMin: 20000000, salaryMax: 35000000 }
        ]
      },
      {
        name: 'Vietcombank',
        email: 'vcb_hr@test.com',
        taxCode: '0100112437',
        industry: 'Ngân hàng',
        logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/ca/Vietcombank_logo.svg/2560px-Vietcombank_logo.svg.png',
        description: 'Ngân hàng Thương mại Cổ phần Ngoại thương Việt Nam.',
        jobs: [
          { title: 'Chuyên viên Tín dụng Khách hàng Doanh nghiệp', tier: JobTier.PROFESSIONAL, salaryMin: 25000000, salaryMax: 45000000 }
        ]
      },
      {
        name: 'Vinamilk',
        email: 'vinamilk_hr@test.com',
        taxCode: '0300588569',
        industry: 'Thực phẩm & Đồ uống',
        logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1a/Vinamilk_logo.svg/1200px-Vinamilk_logo.svg.png',
        description: 'Công ty Cổ phần Sữa Việt Nam là doanh nghiệp sản xuất sữa hàng đầu tại Việt Nam.',
        jobs: [
          { title: 'Giám sát Bán hàng Khu vực', tier: JobTier.BASIC, salaryMin: 18000000, salaryMax: 30000000 }
        ]
      },
      {
        name: 'Masan Group',
        email: 'masan_hr@test.com',
        taxCode: '0303576603',
        industry: 'Tiêu dùng nhanh (FMCG)',
        logo: 'https://masangroup.com/static/version1669865611/frontend/Masan/default/vi_VN/images/logo.png',
        description: 'Tập đoàn tiêu dùng hàng đầu Việt Nam sở hữu WinMart, Masan Consumer.',
        jobs: [
          { title: 'Quản lý Chuỗi cung ứng', tier: JobTier.PROFESSIONAL, salaryMin: 35000000, salaryMax: 60000000 }
        ]
      },
      {
        name: 'Microsoft Vietnam',
        email: 'msft_hr@test.com',
        taxCode: '0101851394',
        industry: 'Công nghệ thông tin',
        logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/44/Microsoft_logo.svg/2048px-Microsoft_logo.svg.png',
        description: 'Văn phòng đại diện tập đoàn Microsoft tại Việt Nam.',
        jobs: [
          { title: 'Cloud Solution Architect', tier: JobTier.PROFESSIONAL, salaryMin: 60000000, salaryMax: 120000000 }
        ]
      },
      {
        name: 'Google Vietnam',
        email: 'google_hr@test.com',
        taxCode: '0101851395',
        industry: 'Công nghệ thông tin',
        logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2f/Google_2015_logo.svg/1200px-Google_2015_logo.svg.png',
        description: 'Văn phòng đại diện Google tại khu vực Việt Nam.',
        jobs: [
          { title: 'Account Manager (Google Ads)', tier: JobTier.PROFESSIONAL, salaryMin: 40000000, salaryMax: 80000000 }
        ]
      },
      {
        name: 'Vietjet Air',
        email: 'vietjet_hr@test.com',
        taxCode: '0102325399',
        industry: 'Hàng không',
        logo: 'https://upload.wikimedia.org/wikipedia/vi/thumb/9/9f/VietJet_Air_logo.svg/1200px-VietJet_Air_logo.svg.png',
        description: 'Hãng hàng không thế hệ mới Vietjet.',
        jobs: [
          { title: 'Tiếp viên Hàng không (Cabin Crew)', tier: JobTier.BASIC, salaryMin: 20000000, salaryMax: 35000000 }
        ]
      },
      {
        name: 'MB Bank',
        email: 'mb_hr@test.com',
        taxCode: '0100233583',
        industry: 'Ngân hàng',
        logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/25/Logo_MB_Bank.svg/1200px-Logo_MB_Bank.svg.png',
        description: 'Ngân hàng Thương mại Cổ phần Quân đội.',
        jobs: [
          { title: 'Chuyên viên Phát triển Giao dịch số', tier: JobTier.PROFESSIONAL, salaryMin: 25000000, salaryMax: 45000000 }
        ]
      },
      {
        name: 'Viettel Post',
        email: 'vtpost_hr@test.com',
        taxCode: '0100684398',
        industry: 'Logistics / Chuyển phát',
        logo: 'https://viettelpost.com.vn/wp-content/themes/viettelpost/images/logo.png',
        description: 'Tổng công ty Cổ phần Bưu chính Viettel.',
        jobs: [
          { title: 'Quản trị viên Logistics', tier: JobTier.BASIC, salaryMin: 15000000, salaryMax: 25000000 }
        ]
      },
      {
        name: 'Masan High-Tech Materials',
        email: 'mht_hr@test.com',
        taxCode: '0104443729',
        industry: 'Khai khoáng & Vật liệu',
        logo: 'https://masanhightechmaterials.com/wp-content/themes/mhtm/images/logo.png',
        description: 'Nhà cung cấp vật liệu công nghiệp chiến lược hàng đầu thế giới.',
        jobs: [
          { title: 'Kỹ sư Luyện kim', tier: JobTier.PROFESSIONAL, salaryMin: 30000000, salaryMax: 50000000 }
        ]
      }
  ];

  for (const c of companiesData) {
    // 2. Tạo User & Recruiter duy nhất cho từng công ty
    const hrUser = await prisma.user.create({
      data: {
        email: c.email,
        password,
        status: StatusUser.ACTIVE,
        userRoles: { create: { roleId: recruiterRole!.roleId } },
        candidate: { create: { fullName: `HR @ ${c.name}` } }
      }
    });

    const company = await prisma.company.create({
      data: {
        companyName: c.name,
        taxCode: c.taxCode,
        mainIndustry: c.industry,
        logo: c.logo,
        description: c.description,
        verifyStatus: 1,
        isRegistered: true,
        slug: c.name.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, ''),
        recruiters: {
          create: {
            userId: hrUser.userId,
            position: 'HR Manager',
          }
        }
      }
    });

    console.log(`✅ Đã tạo công ty: ${c.name}`);

    // Lấy recruiterId vừa tạo
    const recruiter = await prisma.recruiter.findUnique({
      where: { userId: hrUser.userId }
    });

    for (const j of c.jobs) {
      await prisma.jobPosting.create({
        data: {
          title: j.title,
          description: `Mô tả công việc cho vị trí ${j.title} tại ${c.name}. Chúng tôi đang tìm kiếm các ứng viên tài năng có khả năng thích nghi và sáng tạo trong môi trường chuyên nghiệp.`,
          requirements: '- Kinh nghiệm từ 2-5 năm trong lĩnh vực tương đương.\n- Sử dụng thành thạo các công cụ hỗ trợ công việc.\n- Kỹ năng giao tiếp và làm việc nhóm tốt.',
          benefits: '- Mức lương thưởng hấp dẫn lên tới ${j.salaryMax.toLocaleString()} VND.\n- Gói bảo hiểm sức khỏe cao cấp cho nhân viên và người thân.\n- Lộ trình thăng tiến rõ ràng, môi trường làm việc quốc tế.',
          salaryMin: j.salaryMin,
          salaryMax: j.salaryMax,
          jobTier: j.tier,
          status: JobStatus.APPROVED,
          postType: PostType.MANUAL,
          companyId: company.companyId,
          recruiterId: recruiter?.recruiterId,
          locationCity: 'Hà Nội',
          jobType: JobType.FULLTIME,
          originalUrl: `https://workly.vn/jobs/${company.companyId}-${Math.random().toString(36).substring(7)}`,
          slug: `${j.title.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '')}-${Math.random().toString(36).substring(7)}`
        }
      });
      console.log(`   - Đã tạo tin: ${j.title} (${j.tier})`);
    }
  }

  console.log('--- HOÀN TẤT SEED DỮ LIỆU THỰC TẾ ---');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
