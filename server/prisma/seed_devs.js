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
  
  const candidateRole = await prisma.role.upsert({
    where: { roleName: 'CANDIDATE' },
    update: {},
    create: { roleName: 'CANDIDATE' },
  });

  const locations = [
    'TP.HCM', 'TP.HCM', 'TP.HCM', 'TP.HCM', 'TP.HCM', 'TP.HCM', 'Hà Nội', 'Đà Nẵng'
  ]; // Mostly HCM

  const firstNames = ['Nguyễn', 'Trần', 'Lê', 'Phạm', 'Hoàng', 'Huỳnh', 'Phan', 'Vũ', 'Võ', 'Đặng', 'Bùi', 'Đỗ', 'Hồ', 'Ngô', 'Dương'];
  const middleNames = ['Văn', 'Thị', 'Hữu', 'Minh', 'Thanh', 'Ngọc', 'Quốc', 'Đức', 'Gia', 'Hoài', 'Thành', 'Tuấn'];
  const lastNames = ['An', 'Bình', 'Châu', 'Dũng', 'Em', 'Phong', 'Giang', 'Hải', 'Linh', 'Khánh', 'Lan', 'Mai', 'Nam', 'Oanh', 'Phương', 'Quân', 'Sơn', 'Trang', 'Uyên', 'Vinh', 'Xuân', 'Yến', 'Tiến', 'Tài', 'Tâm'];

  const universities = [
    'Đại học Khoa học Tự nhiên TP.HCM', 'Đại học Bách Khoa TP.HCM', 'Đại học Công nghệ Thông tin',
    'Đại học FPT', 'RMIT', 'Đại học Sư phạm Kỹ thuật TP.HCM', 'Đại học Tôn Đức Thắng'
  ];

  function getRandom(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  const profiles = [
    {
      type: 'Fullstack Developer',
      industry: 'Công Nghệ Thông Tin',
      count: 20,
      skills: [
        { skillName: 'ReactJS', level: 'ADVANCED' },
        { skillName: 'NodeJS', level: 'ADVANCED' },
        { skillName: 'TypeScript', level: 'INTERMEDIATE' },
        { skillName: 'MongoDB', level: 'INTERMEDIATE' },
        { skillName: 'Docker', level: 'BEGINNER' }
      ]
    },
    {
      type: 'Automation Tester',
      industry: 'Công Nghệ Thông Tin',
      count: 20,
      skills: [
        { skillName: 'Selenium', level: 'ADVANCED' },
        { skillName: 'Appium', level: 'INTERMEDIATE' },
        { skillName: 'Java', level: 'INTERMEDIATE' },
        { skillName: 'TestComplete', level: 'INTERMEDIATE' },
        { skillName: 'Cypress', level: 'BEGINNER' }
      ]
    },
    {
      type: 'Frontend Developer',
      industry: 'Công Nghệ Thông Tin',
      count: 20,
      skills: [
        { skillName: 'ReactJS', level: 'ADVANCED' },
        { skillName: 'VueJS', level: 'INTERMEDIATE' },
        { skillName: 'JavaScript', level: 'ADVANCED' },
        { skillName: 'CSS/SASS', level: 'ADVANCED' },
        { skillName: 'Figma', level: 'BEGINNER' }
      ]
    }
  ];

  const candidatesData = [];
  let emailCounter = 1;
  for (const profile of profiles) {
    for (let i = 0; i < profile.count; i++) {
      const fullName = `${getRandom(firstNames)} ${getRandom(middleNames)} ${getRandom(lastNames)}`;
      
      candidatesData.push({
        email: `cand_dev_${emailCounter}@test.com`,
        fullName,
        location: getRandom(locations),
        university: getRandom(universities),
        industries: [profile.industry],
        skills: profile.skills,
        experiences: [
          { company: 'Tech Company', role: profile.type, duration: '2-5 years', description: `Làm việc ở vị trí ${profile.type}` }
        ],
        type: profile.type
      });
      emailCounter++;
    }
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
            isOpenToWork: true,
            skills: {
              create: cand.skills
            },
            experiences: {
              create: cand.experiences
            },
            cvs: {
              create: [{
                cvTitle: `CV ${cand.type}`,
                isMain: true,
                parsedData: {
                  industry: cand.industries[0],
                  location: cand.location,
                  skills: cand.skills.map(s => s.skillName),
                  experience: cand.experiences[0].description,
                  summary: `Là một ${cand.type} đam mê công nghệ`
                }
              }]
            }
          }
        }
      }
    });
    console.log(`Created dev candidate: ${cand.fullName} (${cand.email}) - ${cand.type} - ${cand.location}`);
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
