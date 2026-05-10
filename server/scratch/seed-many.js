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
    companyName: "Vietcombank",
    description: "Ngân hàng Ngoại thương Việt Nam là ngân hàng thương mại cổ phần lớn nhất Việt Nam tính theo vốn hóa thị trường.",
    mainIndustry: "Tài chính / Ngân hàng",
    address: "198 Trần Quang Khải, Hoàn Kiếm, Hà Nội",
    websiteUrl: "https://vietcombank.com.vn",
    logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9f/Logo_Vietcombank.svg/1200px-Logo_Vietcombank.svg.png",
    companySize: 20000,
    taxCode: "0100112437"
  },
  {
    companyName: "Shopee Vietnam",
    description: "Shopee là sàn thương mại điện tử lớn nhất Đông Nam Á.",
    mainIndustry: "E-Commerce",
    address: "Tòa nhà Saigon Centre 2, Quận 1, TP.HCM",
    websiteUrl: "https://shopee.vn",
    logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/f/fe/Shopee.svg/1200px-Shopee.svg.png",
    companySize: 5000,
    taxCode: "0313243593"
  },
  {
    companyName: "Grab Vietnam",
    description: "Grab là siêu ứng dụng hàng đầu tại Đông Nam Á cung cấp các dịch vụ thiết yếu hàng ngày.",
    mainIndustry: "Vận tải / Logistics / Tech",
    address: "Tòa nhà Mapletree, Quận 7, TP.HCM",
    websiteUrl: "https://grab.com/vn",
    logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/43/Grab_logo.svg/1200px-Grab_logo.svg.png",
    companySize: 3000,
    taxCode: "0312650437"
  },
  {
    companyName: "Vinamilk",
    description: "Công ty Cổ phần Sữa Việt Nam, tập đoàn dinh dưỡng hàng đầu Việt Nam.",
    mainIndustry: "FMCG / Thực phẩm",
    address: "10 Tân Trào, Quận 7, TP.HCM",
    websiteUrl: "https://vinamilk.com.vn",
    logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e7/Logo_Vinamilk.svg/1200px-Logo_Vinamilk.svg.png",
    companySize: 10000,
    taxCode: "0300588569"
  },
  {
    companyName: "VNPAY",
    description: "Giải pháp thanh toán điện tử hàng đầu cho mọi doanh nghiệp.",
    mainIndustry: "Fintech / Thanh toán số",
    address: "Tòa nhà VAD, 22 Láng Hạ, Hà Nội",
    websiteUrl: "https://vnpay.vn",
    logo: "https://vnpay.vn/wp-content/uploads/2020/07/Logo-VNPAYQR-update.png",
    companySize: 1500,
    taxCode: "0102182358"
  },
  {
    companyName: "Tiki Corporation",
    description: "Hệ sinh thái thương mại All-in-one, tự hào phục vụ hàng triệu khách hàng Việt Nam.",
    mainIndustry: "E-Commerce / Retail",
    address: "52 Út Tịch, Q. Tân Bình, TP.HCM",
    websiteUrl: "https://tiki.vn",
    logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4e/Tiki.vn_logo.svg/1200px-Tiki.vn_logo.svg.png",
    companySize: 4000,
    taxCode: "0309532909"
  },
  {
    companyName: "ACB Bank",
    description: "Ngân hàng Thương mại Cổ phần Á Châu, một trong những ngân hàng tốt nhất VN.",
    mainIndustry: "Tài chính / Ngân hàng",
    address: "442 Nguyễn Thị Minh Khai, Quận 3, TP.HCM",
    websiteUrl: "https://acb.com.vn",
    logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/38/Logo_ACB.svg/1200px-Logo_ACB.svg.png",
    companySize: 10000,
    taxCode: "0300521758"
  },
  {
    companyName: "Masan Group",
    description: "Phụng sự 100 triệu người tiêu dùng Việt Nam, dẫn đầu thị trường hàng tiêu dùng.",
    mainIndustry: "FMCG / Bán lẻ",
    address: "Suite 802, Kumho Asiana Plaza, 39 Lê Duẩn, TP.HCM",
    websiteUrl: "https://masangroup.com",
    logo: "https://masangroup.com/assets/images/logo.png",
    companySize: 40000,
    taxCode: "0303576603"
  },
  {
    companyName: "Techcombank",
    description: "Vượt trội mỗi ngày. Ngân hàng số hiện đại hàng đầu dành cho người Việt.",
    mainIndustry: "Tài chính / Ngân hàng / Fintech",
    address: "6 Quang Trung, Hoàn Kiếm, Hà Nội",
    websiteUrl: "https://techcombank.com.vn",
    logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/39/Techcombank_logo.svg/1200px-Techcombank_logo.svg.png",
    companySize: 12000,
    taxCode: "0100230800"
  },
  {
    companyName: "Novaland Group",
    description: "Tập đoàn bất động sản và dịch vụ du lịch hàng đầu Việt Nam.",
    mainIndustry: "Bất động sản / Du lịch",
    address: "65 Nguyễn Du, P. Bến Nghé, Quận 1, TP.HCM",
    websiteUrl: "https://novaland.com.vn",
    logo: "https://www.novaland.com.vn/Assets/images/logo_novaland.png",
    companySize: 2500,
    taxCode: "0301444753"
  },
  {
    companyName: "TH True Milk",
    description: "Thương hiệu sữa sạch hàng đầu mang tên TH true MILK, 'Hoàn toàn từ thiên nhiên'.",
    mainIndustry: "Nông nghiệp / Thực phẩm",
    address: "Số 166 Nguyễn Thái Học, Ba Đình, Hà Nội",
    websiteUrl: "https://thmilk.vn",
    logo: "https://upload.wikimedia.org/wikipedia/vi/2/24/Logo_TH_True_Milk.png",
    companySize: 5000,
    taxCode: "2901126938"
  },
  {
    companyName: "VNPT Group",
    description: "Tập đoàn Bưu chính Viễn thông Việt Nam - Nhà cung cấp viễn thông nền tảng.",
    mainIndustry: "Viễn thông / Dịch vụ số",
    address: "57 Huỳnh Thúc Kháng, Đống Đa, Hà Nội",
    websiteUrl: "https://vnpt.com.vn",
    logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/0f/Logo_VNPT.svg/1200px-Logo_VNPT.svg.png",
    companySize: 30000,
    taxCode: "0100684378"
  },
  {
    companyName: "Lazada Vietnam",
    description: "Nền tảng thương mại điện tử tiên phong, mang cả Đông Nam Á đến cho bạn.",
    mainIndustry: "E-Commerce",
    address: "Tòa nhà Saigon Centre, Quận 1, TP.HCM",
    websiteUrl: "https://lazada.vn",
    logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c2/Lazada_logo_new.svg/1200px-Lazada_logo_new.svg.png",
    companySize: 3500,
    taxCode: "0311634336"
  },
  {
    companyName: "KMS Technology",
    description: "Dịch vụ phần mềm tiêu chuẩn toàn cầu, dẫn đầu làn sóng chuyển đổi số.",
    mainIndustry: "Công nghệ phần mềm / IT Services",
    address: "123 Cộng Hòa, Q. Tân Bình, TP.HCM",
    websiteUrl: "https://kms-technology.com",
    logo: "https://www.kms-technology.com/hubfs/Imported_Blog_Media/kms-logo-3.png",
    companySize: 1500,
    taxCode: "0306242764"
  },
  {
    companyName: "Hòa Phát Group",
    description: "Tập đoàn công nghiệp hàng đầu Việt Nam, thống trị thị trường thép xây dựng.",
    mainIndustry: "Công nghiệp nặng / Thép",
    address: "Phố Hiến, Hưng Yên / Trụ sở Hà Nội",
    websiteUrl: "https://hoaphat.com.vn",
    logo: "https://upload.wikimedia.org/wikipedia/vi/f/f7/Logo_Hoa_Phat.png",
    companySize: 25000,
    taxCode: "0900189284"
  },
  {
    companyName: "Vietnam Airlines",
    description: "Hãng hàng không quốc gia Việt Nam, sải cánh vươn cao.",
    mainIndustry: "Hàng không / Vận tải",
    address: "200 Nguyễn Sơn, Long Biên, Hà Nội",
    websiteUrl: "https://vietnamairlines.com",
    logo: "https://upload.wikimedia.org/wikipedia/vi/a/a4/Logo_Vietnam_Airlines.png",
    companySize: 21000,
    taxCode: "0100107518"
  },
  {
    companyName: "Intel Vietnam",
    description: "Nhà máy kiểm định và lắp ráp chip lớn nhất thế giới của Intel đặt tại Việt Nam.",
    mainIndustry: "Điện tử / Bán dẫn",
    address: "Khu Công nghệ cao Quận 9, TP.HCM",
    websiteUrl: "https://intel.vn",
    logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7d/Intel_logo_%282020%2C_light_blue%29.svg/1200px-Intel_logo_%282020%2C_light_blue%29.svg.png",
    companySize: 3000,
    taxCode: "0304219783"
  },
  {
    companyName: "Samsung Vina",
    description: "Gã khổng lồ điện tử dẫn đầu làn sóng công nghệ thông minh toàn cầu.",
    mainIndustry: "Điện tử tiêu dùng / Tech",
    address: "Bitexco Financial Tower, Quận 1, TP.HCM",
    websiteUrl: "https://samsung.com/vn",
    logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/24/Samsung_Logo.svg/1200px-Samsung_Logo.svg.png",
    companySize: 100000,
    taxCode: "0300489004"
  },
  {
    companyName: "Bosch Global Software",
    description: "Trung tâm R&D phần mềm xe tự lái và công nghệ cao tại Việt Nam.",
    mainIndustry: "Automotive / IoT / Software",
    address: "Etown 2, Q. Tân Bình, TP.HCM",
    websiteUrl: "https://bosch.com.vn",
    logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/16/Bosch-logo.svg/1280px-Bosch-logo.svg.png",
    companySize: 3000,
    taxCode: "0305196745"
  },
  {
    companyName: "Navigos Group",
    description: "Tập đoàn tuyển dụng nhân sự hàng đầu, sở hữu VietnamWorks và Navigos Search.",
    mainIndustry: "HR Tech / Tuyển dụng",
    address: "130 Sương Nguyệt Ánh, Quận 1, TP.HCM",
    websiteUrl: "https://navigosgroup.com",
    logo: "https://navigosgroup.com/images/navigos-group-logo.svg",
    companySize: 1000,
    taxCode: "0302846604"
  }
];

async function main() {
  console.log("Starting big seeding process (20 companies)...");
  let count = 0;
  for (const data of MOCK_COMPANIES) {
    try {
      const company = await prisma.company.upsert({
        where: { taxCode: data.taxCode },
        update: data,
        create: {
          ...data,
          banner: `https://picsum.photos/seed/${data.taxCode}/1200/400`,
          branches: {
            create: {
              name: "Trụ sở chính",
              address: data.address,
              isVerified: true
            }
          }
        }
      });
      console.log(`✅ [${++count}/20] Seeded/Updated: ${company.companyName}`);
    } catch (e) {
      console.error(`❌ Failed seeding: ${data.companyName}`, e.message);
    }
  }
  console.log("\n✨ ALL DONE! 20 HIGH-QUALITY COMPANIES INJECTED.");
}

main().catch(console.error).finally(async () => {
  await prisma.$disconnect();
});
