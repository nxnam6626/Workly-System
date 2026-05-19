const { PrismaClient } = require('../src/generated/prisma');
const bcrypt = require('bcrypt');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');
require('dotenv').config();

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const password = await bcrypt.hash('password123', 10);
  
  // Ensure CANDIDATE role exists
  const candidateRole = await prisma.role.upsert({
    where: { roleName: 'CANDIDATE' },
    update: {},
    create: { roleName: 'CANDIDATE' },
  });

  const industries = [
    'Công Nghệ Thông Tin', 'Marketing', 'Kế toán / Kiểm toán', 'Tài chính / Ngân hàng',
    'Nhân sự', 'Bán hàng / Kinh doanh', 'Y tế / Chăm sóc sức khỏe', 'Giáo dục / Đào tạo',
    'Xây dựng / Kiến trúc', 'Thiết kế / Nghệ thuật', 'Kỹ thuật / Cơ khí', 'Du lịch / Khách sạn',
    'Logistics / Vận tải', 'Pháp lý', 'Sản xuất'
  ];
  
  const locations = [
    'Hà Nội', 'TP.HCM', 'Đà Nẵng', 'Cần Thơ', 'Hải Phòng', 'Bình Dương', 'Đồng Nai'
  ];

  const firstNames = ['Nguyễn', 'Trần', 'Lê', 'Phạm', 'Hoàng', 'Huỳnh', 'Phan', 'Vũ', 'Võ', 'Đặng', 'Bùi', 'Đỗ', 'Hồ', 'Ngô', 'Dương'];
  const middleNames = ['Văn', 'Thị', 'Hữu', 'Minh', 'Thanh', 'Ngọc', 'Quốc', 'Đức', 'Gia', 'Hoài'];
  const lastNames = ['An', 'Bình', 'Châu', 'Dũng', 'Em', 'Phong', 'Giang', 'Hải', 'Linh', 'Khánh', 'Lan', 'Mai', 'Nam', 'Oanh', 'Phương', 'Quân', 'Sơn', 'Trang', 'Uyên', 'Vinh', 'Xuân', 'Yến'];

  const universities = [
    'Đại học Bách Khoa', 'Đại học Kinh tế Quốc dân', 'Đại học Ngoại thương',
    'Đại học Quốc gia', 'Đại học Tôn Đức Thắng', 'RMIT', 'Đại học FPT', 'Đại học Sư phạm'
  ];

  function getRandom(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  const candidatesData = [];
  for (let i = 1; i <= 50; i++) {
    const fullName = `${getRandom(firstNames)} ${getRandom(middleNames)} ${getRandom(lastNames)}`;
    const industry = getRandom(industries);
    
    candidatesData.push({
      email: `cand_bulk${i}@test.com`,
      fullName,
      location: getRandom(locations),
      university: getRandom(universities),
      industries: [industry],
      skills: [
        { skillName: 'Teamwork', level: 'ADVANCED' },
        { skillName: 'Communication', level: 'INTERMEDIATE' }
      ],
      experiences: [
        { company: 'Company A', role: 'Staff', duration: '1-3 years', description: `Kinh nghiệm làm việc trong lĩnh vực ${industry}` }
      ]
    });
  }

  for (const cand of candidatesData) {
    await prisma.user.upsert({
      where: { email: cand.email },
      update: {},
      create: {
        email: cand.email,
        password,
        status: 'ACTIVE',
        userRoles: {
          create: { roleId: candidateRole.roleId },
        },
        candidate: {
          create: {
            fullName: cand.fullName,
            location: cand.location,
            university: cand.university,
            industries: cand.industries,
            skills: {
              create: cand.skills
            },
            experiences: {
              create: cand.experiences
            },
            cvs: {
              create: [{
                cvTitle: 'CV Mặc định',
                isMain: true,
                parsedData: {
                  industry: cand.industries[0],
                  location: cand.location
                }
              }]
            }
          }
        }
      }
    });
    console.log(`Created bulk candidate: ${cand.fullName} (${cand.email}) - ${cand.industries[0]}`);
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
