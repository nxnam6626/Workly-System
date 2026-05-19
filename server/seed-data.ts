import { PrismaClient } from './src/generated/prisma';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as bcrypt from 'bcrypt';
import * as dotenv from 'dotenv';

dotenv.config();

async function main() {
  const connectionString = process.env.DATABASE_URL;
  const pool = new Pool({ connectionString, family: 4 } as any);
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  console.log('Bắt đầu tạo dữ liệu mẫu nâng cao...');

  const passwordHash = await bcrypt.hash('password123', 10);

  // 1. Setup Roles
  const roles = ['ADMIN', 'CANDIDATE', 'RECRUITER'];
  for (const roleName of roles) {
    let role = await prisma.role.findUnique({ where: { roleName } });
    if (!role) {
      await prisma.role.create({ data: { roleName } });
    }
  }

  const getRoleId = async (roleName: string) => {
    return (await prisma.role.findUnique({ where: { roleName } }))!.roleId;
  };

  // 2. Tạo Hồ sơ Công ty (Companies)
  console.log('Đang tạo hồ sơ công ty...');
  const companiesData = [
    {
      companyName: 'Công ty Cổ phần Công nghệ TechVn',
      taxCode: '0101234567',
      address: 'Tòa nhà TechVn, Số 1, Đường Phạm Văn Đồng, Cầu Giấy, Hà Nội',
      description: 'TechVn là công ty công nghệ hàng đầu Việt Nam chuyên cung cấp giải pháp chuyển đổi số và phát triển phần mềm cho thị trường quốc tế.',
      websiteUrl: 'https://techvn.example.com',
      companySize: 500,
      industry: 'Công nghệ thông tin / Phần mềm',
    },
    {
      companyName: 'Tập đoàn Tài chính FinTop',
      taxCode: '0309876543',
      address: 'Tháp FinTop, Quận 1, TP. Hồ Chí Minh',
      description: 'FinTop cung cấp các dịch vụ tài chính, ngân hàng và đầu tư chuyên nghiệp, hướng tới mục tiêu dẫn đầu thị trường Đông Nam Á.',
      websiteUrl: 'https://fintop.example.vn',
      companySize: 2000,
      industry: 'Tài chính / Ngân hàng',
    },
    {
      companyName: 'Công ty TNHH Giáo dục EduPro',
      taxCode: '0405678901',
      address: 'Khu công nghệ cao, Quận Hải Châu, Đà Nẵng',
      description: 'EduPro là nền tảng công nghệ giáo dục (EdTech) tiên phong, mang đến giải pháp học trực tuyến chất lượng cao cho hàng triệu học viên.',
      websiteUrl: 'https://edupro.example.edu.vn',
      companySize: 150,
      industry: 'Giáo dục / Đào tạo',
    }
  ];

  const createdCompanies: any[] = [];
  for (const cData of companiesData) {
    let company = await prisma.company.findUnique({ where: { taxCode: cData.taxCode } });
    if (!company) {
      company = await prisma.company.create({
        data: {
          companyName: cData.companyName,
          taxCode: cData.taxCode,
          isRegistered: true,
          verifyStatus: 1,
          address: cData.address,
          description: cData.description,
          websiteUrl: cData.websiteUrl,
          companySize: cData.companySize,
          mainIndustry: cData.industry,
        }
      });
      await prisma.companyWallet.create({
        data: {
          companyId: company.companyId,
          balance: 10000000,
          cvUnlockQuota: 100,
          cvUnlockQuotaMax: 100,
        }
      });
    }
    createdCompanies.push(company);
  }

  // 3. Tạo Nhà tuyển dụng (Recruiters)
  console.log('Đang tạo nhà tuyển dụng...');
  const recruitersData = [
    { email: 'hr1@techvn.example.com', name: 'Trần Đại Nghĩa', position: 'Trưởng phòng Nhân sự', companyId: createdCompanies[0].companyId },
    { email: 'tuyendung@fintop.example.vn', name: 'Lê Mai Anh', position: 'Chuyên viên Tuyển dụng', companyId: createdCompanies[1].companyId },
    { email: 'contact@edupro.example.edu.vn', name: 'Phạm Văn Hùng', position: 'Giám đốc Nhân sự', companyId: createdCompanies[2].companyId },
  ];

  const createdRecruiters: any[] = [];
  for (const rData of recruitersData) {
    let user = await prisma.user.findUnique({ where: { email: rData.email } });
    if (!user) {
      user = await prisma.user.create({
        data: {
          email: rData.email,
          password: passwordHash,
          status: 'ACTIVE',
          isEmailVerified: true,
        }
      });
      await prisma.userRole.create({
        data: { userId: user.userId, roleId: await getRoleId('RECRUITER') }
      });
      const recruiter = await prisma.recruiter.create({
        data: {
          userId: user.userId,
          companyId: rData.companyId,
          fullName: rData.name,
          position: rData.position,
        }
      });
      createdRecruiters.push(recruiter);
    } else {
      const recruiter = await prisma.recruiter.findUnique({ where: { userId: user.userId }});
      if(recruiter) createdRecruiters.push(recruiter);
    }
  }

  // 4. Tạo Tin Tuyển Dụng (Job Postings)
  console.log('Đang tạo tin tuyển dụng...');
  const jobsData = [
    {
      title: 'Senior Node.js Developer',
      companyIndex: 0,
      recruiterIndex: 0,
      description: '<p>Tham gia phát triển hệ thống backend scale lớn, xử lý hàng triệu request mỗi ngày.</p>',
      requirements: '<p>- Ít nhất 4 năm kinh nghiệm làm việc với Node.js.<br>- Thành thạo NestJS, PostgreSQL, Redis.<br>- Có kinh nghiệm Microservices là lợi thế lớn.</p>',
      benefits: '<p>- Mức lương cạnh tranh: 30 - 50 triệu VNĐ.<br>- Cấp Macbook Pro M3.<br>- Review lương 2 lần/năm.</p>',
      salaryMin: 30000000,
      salaryMax: 50000000,
      jobType: 'FULLTIME',
      locationCity: 'Hà Nội',
      jobTier: 'URGENT',
    },
    {
      title: 'Frontend React Developer (Middle)',
      companyIndex: 0,
      recruiterIndex: 0,
      description: '<p>Phát triển giao diện người dùng cho các ứng dụng web phức tạp sử dụng ReactJS và NextJS.</p>',
      requirements: '<p>- 2+ năm kinh nghiệm ReactJS.<br>- Nắm vững kiến thức HTML, CSS, JavaScript (ES6+).<br>- Có kinh nghiệm sử dụng Redux, React Query.</p>',
      benefits: '<p>- Lương 15 - 25 triệu VNĐ.<br>- Bảo hiểm PVI, khám sức khỏe định kỳ.<br>- Môi trường làm việc trẻ trung.</p>',
      salaryMin: 15000000,
      salaryMax: 25000000,
      jobType: 'FULLTIME',
      locationCity: 'Hà Nội',
      jobTier: 'PROFESSIONAL',
    },
    {
      title: 'Chuyên viên Phân tích Dữ liệu Tài chính (Data Analyst)',
      companyIndex: 1,
      recruiterIndex: 1,
      description: '<p>Phân tích dữ liệu giao dịch tài chính để hỗ trợ ra quyết định kinh doanh và quản trị rủi ro.</p>',
      requirements: '<p>- Tốt nghiệp chuyên ngành Tài chính, Toán, Thống kê.<br>- Thành thạo SQL, Python (Pandas, NumPy).<br>- Biết sử dụng PowerBI hoặc Tableau.</p>',
      benefits: '<p>- Thưởng KPI tháng, quý, năm hấp dẫn.<br>- Gói vay ưu đãi dành riêng cho nhân viên.<br>- Lộ trình thăng tiến rõ ràng.</p>',
      salaryMin: 20000000,
      salaryMax: 35000000,
      jobType: 'FULLTIME',
      locationCity: 'TP. Hồ Chí Minh',
      jobTier: 'BASIC',
    },
    {
      title: 'Giảng viên Tiếng Anh Trực tuyến',
      companyIndex: 2,
      recruiterIndex: 2,
      description: '<p>Giảng dạy các khóa học Tiếng Anh giao tiếp trực tuyến cho học viên từ nhiều độ tuổi khác nhau.</p>',
      requirements: '<p>- Chứng chỉ IELTS 7.5 trở lên hoặc tương đương.<br>- Có kinh nghiệm giảng dạy tiếng Anh trực tuyến.<br>- Phát âm chuẩn, kỹ năng sư phạm tốt.</p>',
      benefits: '<p>- Thời gian làm việc linh hoạt.<br>- Mức thu nhập từ 15 - 30 triệu (tùy theo số giờ dạy).<br>- Được cung cấp tài liệu giảng dạy chuẩn quốc tế.</p>',
      salaryMin: 15000000,
      salaryMax: 30000000,
      jobType: 'REMOTE',
      locationCity: 'Toàn quốc',
      jobTier: 'PROFESSIONAL',
    },
    {
      title: 'Nhân viên Kinh doanh B2B (Sales B2B)',
      companyIndex: 0,
      recruiterIndex: 0,
      description: '<p>Tìm kiếm và chăm sóc khách hàng doanh nghiệp, giới thiệu các giải pháp phần mềm của công ty.</p>',
      requirements: '<p>- Có kinh nghiệm sales B2B ít nhất 1 năm.<br>- Kỹ năng giao tiếp, đàm phán tốt.</p>',
      benefits: '<p>- Lương cứng 10-15 triệu + Hoa hồng cao.<br>- Môi trường năng động, nhiều cơ hội thăng tiến.</p>',
      salaryMin: 10000000,
      salaryMax: 25000000,
      jobType: 'FULLTIME',
      locationCity: 'Hà Nội',
      jobTier: 'BASIC',
    },
    {
      title: 'Chuyên viên Tuyển dụng (Recruiter)',
      companyIndex: 1,
      recruiterIndex: 1,
      description: '<p>Phụ trách tuyển dụng nhân sự chất lượng cao cho các phòng ban kỹ thuật và kinh doanh.</p>',
      requirements: '<p>- Kinh nghiệm tuyển dụng IT/Tài chính từ 2 năm.<br>- Có network ứng viên tốt.</p>',
      benefits: '<p>- Lương 15-20 triệu.<br>- Thưởng theo KPIs tuyển dụng.</p>',
      salaryMin: 15000000,
      salaryMax: 20000000,
      jobType: 'FULLTIME',
      locationCity: 'TP. Hồ Chí Minh',
      jobTier: 'BASIC',
    },
    {
      title: 'Chuyên viên Pháp chế / Luật sư nội bộ',
      companyIndex: 2,
      recruiterIndex: 2,
      description: '<p>Tư vấn pháp lý cho các hoạt động kinh doanh, soạn thảo và rà soát hợp đồng.</p>',
      requirements: '<p>- Tốt nghiệp đại học chuyên ngành Luật.<br>- Có chứng chỉ hành nghề luật sư là một lợi thế.</p>',
      benefits: '<p>- Lương 20-30 triệu.<br>- Bảo hiểm sức khỏe toàn diện.</p>',
      salaryMin: 20000000,
      salaryMax: 30000000,
      jobType: 'FULLTIME',
      locationCity: 'Đà Nẵng',
      jobTier: 'PROFESSIONAL',
    },
    {
      title: 'Kế toán tổng hợp',
      companyIndex: 0,
      recruiterIndex: 0,
      description: '<p>Chịu trách nhiệm kiểm tra, hạch toán các nghiệp vụ kinh tế phát sinh, lập báo cáo tài chính.</p>',
      requirements: '<p>- Tốt nghiệp đại học chuyên ngành Kế toán - Kiểm toán.<br>- Nắm vững các chuẩn mực kế toán Việt Nam.</p>',
      benefits: '<p>- Lương 15-20 triệu.<br>- Thưởng cuối năm 2-3 tháng lương.</p>',
      salaryMin: 15000000,
      salaryMax: 20000000,
      jobType: 'FULLTIME',
      locationCity: 'Hà Nội',
      jobTier: 'BASIC',
    },
    {
      title: 'Quản lý Nhà hàng (Restaurant Manager)',
      companyIndex: 1,
      recruiterIndex: 1,
      description: '<p>Chịu trách nhiệm điều hành toàn bộ hoạt động của nhà hàng, đảm bảo doanh thu và chất lượng dịch vụ.</p>',
      requirements: '<p>- Kinh nghiệm quản lý nhà hàng từ 3 năm.<br>- Kỹ năng giải quyết vấn đề tốt.</p>',
      benefits: '<p>- Lương 20-35 triệu + Thưởng doanh thu.<br>- Ăn ca tại nhà hàng.</p>',
      salaryMin: 20000000,
      salaryMax: 35000000,
      jobType: 'FULLTIME',
      locationCity: 'TP. Hồ Chí Minh',
      jobTier: 'URGENT',
    },
    {
      title: 'Nhân viên Logistics / Forwarder',
      companyIndex: 2,
      recruiterIndex: 2,
      description: '<p>Điều phối các lô hàng xuất nhập khẩu, làm việc với hãng tàu và hải quan.</p>',
      requirements: '<p>- Kinh nghiệm logistics từ 1 năm.<br>- Tiếng Anh giao tiếp và đọc hiểu chứng từ tốt.</p>',
      benefits: '<p>- Lương 12-18 triệu.<br>- Thưởng các ngày lễ tết.</p>',
      salaryMin: 12000000,
      salaryMax: 18000000,
      jobType: 'FULLTIME',
      locationCity: 'Đà Nẵng',
      jobTier: 'BASIC',
    },
    {
      title: 'Thiết kế Đồ họa (Graphic Designer)',
      companyIndex: 0,
      recruiterIndex: 0,
      description: '<p>Thiết kế các ấn phẩm truyền thông, banner, poster phục vụ cho các chiến dịch marketing.</p>',
      requirements: '<p>- Thành thạo Adobe Photoshop, Illustrator.<br>- Có óc sáng tạo và thẩm mỹ tốt.</p>',
      benefits: '<p>- Lương 12-20 triệu.<br>- Môi trường làm việc tự do, sáng tạo.</p>',
      salaryMin: 12000000,
      salaryMax: 20000000,
      jobType: 'FULLTIME',
      locationCity: 'Hà Nội',
      jobTier: 'PROFESSIONAL',
    },
    {
      title: 'Điều dưỡng viên',
      companyIndex: 1,
      recruiterIndex: 1,
      description: '<p>Thực hiện các công việc chăm sóc bệnh nhân theo y lệnh của bác sĩ tại phòng khám quốc tế.</p>',
      requirements: '<p>- Tốt nghiệp Cao đẳng/Đại học chuyên ngành Điều dưỡng.<br>- Có chứng chỉ hành nghề.</p>',
      benefits: '<p>- Lương 10-15 triệu + Phụ cấp ca đêm.<br>- Được đào tạo liên tục.</p>',
      salaryMin: 10000000,
      salaryMax: 15000000,
      jobType: 'FULLTIME',
      locationCity: 'TP. Hồ Chí Minh',
      jobTier: 'BASIC',
    }
  ];

  for (const jData of jobsData) {
    const company = createdCompanies[jData.companyIndex];
    const recruiter = createdRecruiters[jData.recruiterIndex];
    
    // Check if job exists
    const existingJob = await prisma.jobPosting.findFirst({
        where: { title: jData.title, companyId: company.companyId }
    });

    if (!existingJob) {
        await prisma.jobPosting.create({
        data: {
            title: jData.title,
            description: jData.description,
            requirements: jData.requirements,
            benefits: jData.benefits,
            salaryMin: jData.salaryMin,
            salaryMax: jData.salaryMax,
            currency: 'VND',
            jobType: jData.jobType as any,
            locationCity: jData.locationCity,
            status: 'APPROVED',
            isVerified: true,
            companyId: company.companyId,
            recruiterId: recruiter.recruiterId,
            jobTier: jData.jobTier as any,
            vacancies: 2,
        }
        });
    }
  }

  // 5. Tạo Ứng viên và CV (Candidates & CVs)
  console.log('Đang tạo ứng viên và CV...');
  const candidatesData = [
    {
      email: 'nguyen.van.a@example.com',
      fullName: 'Nguyễn Văn Anh',
      location: 'Hà Nội',
      university: 'Đại học Bách Khoa Hà Nội',
      major: 'Công nghệ thông tin',
      isOpenToWork: true,
      skills: ['Node.js', 'ReactJS', 'PostgreSQL', 'Docker'],
      summary: 'Lập trình viên Fullstack với 3 năm kinh nghiệm trong việc xây dựng các ứng dụng web hiệu năng cao.',
      cvTitle: 'CV_Nguyen_Van_Anh_Fullstack.pdf'
    },
    {
      email: 'tran.thi.b@example.com',
      fullName: 'Trần Thị Bình',
      location: 'TP. Hồ Chí Minh',
      university: 'Đại học Kinh tế TP.HCM',
      major: 'Tài chính Ngân hàng',
      isOpenToWork: true,
      skills: ['Python', 'SQL', 'PowerBI', 'Data Analysis'],
      summary: 'Data Analyst chuyên nghiệp với khả năng biến dữ liệu thô thành thông tin hữu ích cho kinh doanh.',
      cvTitle: 'TranThiBinh_DataAnalyst_CV.pdf'
    },
    {
      email: 'le.hoang.c@example.com',
      fullName: 'Lê Hoàng Cường',
      location: 'Đà Nẵng',
      university: 'Đại học Ngoại Ngữ Đà Nẵng',
      major: 'Ngôn ngữ Anh',
      isOpenToWork: true,
      skills: ['Tiếng Anh (IELTS 8.0)', 'Giảng dạy', 'Giao tiếp', 'Quản lý lớp học'],
      summary: 'Giảng viên tiếng Anh nhiệt huyết, luôn tìm kiếm phương pháp giảng dạy sáng tạo để truyền cảm hứng cho học viên.',
      cvTitle: 'CV_LeHoangCuong_Teacher.pdf'
    }
  ];

  for (const cData of candidatesData) {
    let user = await prisma.user.findUnique({ where: { email: cData.email } });
    if (!user) {
      user = await prisma.user.create({
        data: {
          email: cData.email,
          password: passwordHash,
          status: 'ACTIVE',
          isEmailVerified: true,
        }
      });
      await prisma.userRole.create({
        data: { userId: user.userId, roleId: await getRoleId('CANDIDATE') }
      });
      const candidate = await prisma.candidate.create({
        data: {
          userId: user.userId,
          fullName: cData.fullName,
          location: cData.location,
          university: cData.university,
          major: cData.major,
          isOpenToWork: cData.isOpenToWork,
          summary: cData.summary,
        }
      });

      // Tạo kỹ năng (Skills)
      for (const skill of cData.skills) {
        await prisma.skill.create({
          data: {
            skillName: skill,
            candidateId: candidate.candidateId,
            level: 'INTERMEDIATE',
          }
        });
      }

      // Tạo CV
      await prisma.cV.create({
        data: {
          candidateId: candidate.candidateId,
          cvTitle: cData.cvTitle,
          isMain: true,
          fileUrl: 'https://example.com/dummy-cv.pdf', // URL dummy
        }
      });
    }
  }

  console.log('Tạo dữ liệu thành công!');
}

main().catch(console.error).finally(() => process.exit(0));
