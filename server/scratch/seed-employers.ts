import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seed() {
  console.log('--- Seeding Top Employers Data ---');

  const companies = [
    {
      companyName: 'FPT Software',
      slug: 'fpt-software',
      logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/ad/FPT_Software_logo.svg/1200px-FPT_Software_logo.svg.png',
      mainIndustry: 'Công nghệ Thông tin',
      description: 'Công ty xuất khẩu phần mềm lớn nhất Việt Nam.',
      isRegistered: true,
      verifyStatus: 1,
    },
    {
      companyName: 'Viettel Group',
      slug: 'viettel-group',
      logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e0/Viettel_logo_2021.svg/1200px-Viettel_logo_2021.svg.png',
      mainIndustry: 'Viễn thông & CNTT',
      description: 'Tập đoàn viễn thông lớn nhất Việt Nam.',
      isRegistered: true,
      verifyStatus: 1,
    },
    {
      companyName: 'Vingroup',
      slug: 'vingroup',
      logo: 'https://vinhomes.vn/vinhomes-corporate/upload/images/vingroup-logo.png',
      mainIndustry: 'Đa ngành',
      description: 'Tập đoàn kinh tế tư nhân đa ngành hàng đầu Việt Nam.',
      isRegistered: true,
      verifyStatus: 1,
    },
    {
      companyName: 'Momo',
      slug: 'momo',
      logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/cd/Logo_Momo.svg/1200px-Logo_Momo.svg.png',
      mainIndustry: 'Fintech',
      description: 'Ví điện tử hàng đầu Việt Nam.',
      isRegistered: true,
      verifyStatus: 1,
    },
    {
      companyName: 'Shopee Vietnam',
      slug: 'shopee-vietnam',
      logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/fe/Shopee.svg/1200px-Shopee.svg.png',
      mainIndustry: 'Thương mại điện tử',
      description: 'Nền tảng thương mại điện tử hàng đầu.',
      isRegistered: true,
      verifyStatus: 1,
    },
    {
      companyName: 'Grab Vietnam',
      slug: 'grab-vietnam',
      logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/21/Grab_logo_2021.svg/1200px-Grab_logo_2021.svg.png',
      mainIndustry: 'Vận tải & Công nghệ',
      description: 'Ứng dụng đặt xe và giao hàng hàng đầu.',
      isRegistered: true,
      verifyStatus: 1,
    },
    {
      companyName: 'Techcombank',
      slug: 'techcombank',
      logo: 'https://vcdn1-kinhdoanh.vnecdn.net/2021/04/22/Techcombank-Logo-JPG-3814-1619080516.jpg?w=1200&h=0&q=100&dpr=1&fit=crop&s=4G_R_3_G_R_3_G_R_3_G_R_3_G_R_3',
      mainIndustry: 'Ngân hàng',
      description: 'Ngân hàng TMCP Kỹ thương Việt Nam.',
      isRegistered: true,
      verifyStatus: 1,
    },
    {
      companyName: 'VNPT',
      slug: 'vnpt',
      logo: 'https://vnpt.com.vn/static/images/logo.png',
      mainIndustry: 'Viễn thông',
      description: 'Tập đoàn Bưu chính Viễn thông Việt Nam.',
      isRegistered: true,
      verifyStatus: 1,
    },
    {
      companyName: 'Samsung Vina',
      slug: 'samsung-vina',
      logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/24/Samsung_Logo.svg/2560px-Samsung_Logo.svg.png',
      mainIndustry: 'Điện tử',
      description: 'Tập đoàn điện tử hàng đầu thế giới.',
      isRegistered: true,
      verifyStatus: 1,
    },
    {
      companyName: 'TikTok Vietnam',
      slug: 'tiktok-vietnam',
      logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/a/a9/TikTok_logo.svg/1200px-TikTok_logo.svg.png',
      mainIndustry: 'Mạng xã hội',
      description: 'Nền tảng video ngắn hàng đầu.',
      isRegistered: true,
      verifyStatus: 1,
    }
  ];

  for (const companyData of companies) {
    const company = await prisma.company.upsert({
      where: { slug: companyData.slug },
      update: companyData,
      create: companyData,
    });

    console.log(`Created/Updated company: ${company.companyName}`);

    // Create 3-7 dummy approved jobs for each company
    const jobCount = Math.floor(Math.random() * 5) + 3;
    for (let i = 0; i < jobCount; i++) {
       const jobSlug = `${companyData.slug}-job-${Date.now()}-${i}`;
       await prisma.jobPosting.create({
         data: {
           title: `Tuyển dụng ${companyData.mainIndustry} Specialist ${i+1}`,
           description: 'Mô tả công việc hấp dẫn với nhiều chế độ đãi ngộ tốt cho nhân viên.',
           requirements: 'Yêu cầu 1-3 năm kinh nghiệm trong lĩnh vực liên quan.',
           benefits: 'Quyền lợi: Lương cao, bảo hiểm, du lịch hàng năm.',
           locationCity: 'Hà Nội',
           jobType: 'FULLTIME',
           status: 'APPROVED',
           companyId: company.companyId,
           jobTier: 'BASIC',
           isVerified: true,
           originalUrl: `https://workly.ai/job/${jobSlug}`,
           slug: jobSlug,
         }
       });
    }
    console.log(`  -> Added ${jobCount} approved jobs.`);
  }

  console.log('--- Seeding Completed ---');
}

seed()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
