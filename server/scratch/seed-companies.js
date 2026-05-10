const { PrismaClient } = require('../dist/src/generated/prisma');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');
require('dotenv').config();

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const MOCK_COMPANIES = [
  {
    companyName: "FPT Software",
    description: "FPT Software is the leading software exporter in Vietnam and a major global provider of IT & business services.",
    mainIndustry: "Công nghệ phần mềm / IT Outsourcing",
    address: "Khu Công nghệ cao Hòa Lạc, Hà Nội",
    websiteUrl: "https://fptsoftware.com",
    logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/11/FPT_logo.svg/1200px-FPT_logo.svg.png",
    banner: "https://fptsoftware.com/-/media/project/fpt-software/fpt-software/image/career/home-banner.png",
    companySize: 15000,
    taxCode: "0101248141"
  },
  {
    companyName: "VNG Corporation",
    description: "VNG is Vietnam's first unicorn tech company, specializing in digital content, online entertainment, social networking and e-commerce.",
    mainIndustry: "Internet / Giải trí số",
    address: "VNG Campus, Quận 7, TP.HCM",
    websiteUrl: "https://vng.com.vn",
    logo: "https://vng.com.vn/assets/images/vng-logo.png",
    banner: "https://vng.com.vn/assets/images/banner-about.jpg",
    companySize: 3500,
    taxCode: "0303493756"
  },
  {
    companyName: "MOMO (M-Service)",
    description: "MoMo is Vietnam's top Super App, offering users access to a wide spectrum of financial services.",
    mainIndustry: "Fintech / Ví điện tử",
    address: "Tòa nhà M-Service, Quận 7, TP.HCM",
    websiteUrl: "https://momo.vn",
    logo: "https://upload.wikimedia.org/wikipedia/vi/archive/f/fe/20210712092156%21MoMo_Logo.png",
    banner: "https://static.mservice.io/img/momo-upload-api-230110100123-638089224838825952.jpg",
    companySize: 1500,
    taxCode: "0305327873"
  },
  {
    companyName: "Viettel Group",
    description: "Viettel is the largest telecommunication service provider in Southeast Asia.",
    mainIndustry: "Viễn thông / Công nghệ thông tin",
    address: "Lô D26 Khu đô thị mới Cầu Giấy, Hà Nội",
    websiteUrl: "https://viettel.com.vn",
    logo: "https://upload.wikimedia.org/wikipedia/vi/c/cd/Viettel_logo_2021.svg",
    banner: "https://viettel.com.vn/img/default-banner.jpg",
    companySize: 25000,
    taxCode: "0100109106"
  },
  {
    companyName: "Vingroup",
    description: "Vingroup is one of the biggest multi-sector conglomerates in Asia with presence in real estate, technology, retail, healthcare.",
    mainIndustry: "Đa ngành",
    address: "Số 7 Đường Bằng Lăng 1, Việt Hưng, Long Biên, Hà Nội",
    websiteUrl: "https://vingroup.net",
    logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e4/Logo-VinGroup.png/640px-Logo-VinGroup.png",
    banner: "https://vingroup.net/Assets/Vingroup/img/bg-header.jpg",
    companySize: 50000,
    taxCode: "0101245486"
  }
];

async function main() {
  console.log("Starting company seeding...");
  for (const data of MOCK_COMPANIES) {
    const company = await prisma.company.upsert({
      where: { taxCode: data.taxCode },
      update: data,
      create: {
        ...data,
        branches: {
          create: {
            name: "Trụ sở chính",
            address: data.address,
            isVerified: true
          }
        }
      }
    });
    console.log(`✅ Seeded company: ${company.companyName}`);
  }
  console.log("COMPLETED SUCCESSFULLY!");
}

main().catch(console.error).finally(async () => {
  await prisma.$disconnect();
});
