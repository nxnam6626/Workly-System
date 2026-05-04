
const { Client } = require('pg');
require('dotenv').config();

const client = new Client({
  connectionString: process.env.DATABASE_URL,
});

async function run() {
  await client.connect();
  console.log('Connected to database');

  try {
    // 1. Find Vietjet
    let res = await client.query("SELECT \"companyId\" FROM \"Company\" WHERE \"companyName\" ILIKE '%Vietjet%' LIMIT 1");
    if (res.rows.length === 0) {
      console.log('Vietjet not found!');
      return;
    }
    const companyId = res.rows[0].companyId;

    // 2. Update Company Description (UNIFIED)
    const introContent = `Trụ sở chính của Vietjet (Vietjet Plaza) được thiết kế theo phong cách hiện đại, thân thiện với môi trường với nhiều không gian xanh. Tại đây, nhân viên được tận hưởng các tiện ích đẳng cấp như:\n- Khu ẩm thực phong phú\n- Phòng tập Gym & Yoga hiện đại\n- Phòng chiếu phim giải trí\n- Không gian làm việc mở thúc đẩy sự sáng tạo và kết nối.`;
    
    await client.query("UPDATE \"Company\" SET \"description\" = $1 WHERE \"companyId\" = $2", [introContent, companyId]);

    // 3. Clear sections and re-insert ONLY non-intro sections
    await client.query("DELETE FROM \"CompanySection\" WHERE \"companyId\" = $1", [companyId]);

    await client.query(`
      INSERT INTO "CompanySection" ("id", "companyId", "title", "content", "type", "displayOrder")
      VALUES 
      (gen_random_uuid(), $1, 'Tôn trọng sự khác biệt', 'Vietjet luôn coi con người là tài sản quý giá nhất. Chúng tôi xây dựng chính sách nhân sự dựa trên sự công bằng, minh bạch và tôn trọng sự khác biệt. Đội ngũ nhân viên đến từ hơn 50 quốc gia tạo nên một môi trường đa văn hóa, năng động.', 'HR_POLICY', 1),
      (gen_random_uuid(), $1, 'Lộ trình sự nghiệp không giới hạn', 'Tại Vietjet, lộ trình sự nghiệp được thiết kế rõ ràng cho từng vị trí. Học viện Hàng không Vietjet cung cấp các khóa đào tạo định kỳ giúp nhân viên nâng cao kỹ năng chuyên môn và kỹ năng mềm, sẵn sàng cho các vị trí quản lý cấp cao.', 'ADVANCEMENT', 2),
      (gen_random_uuid(), $1, 'Lương thưởng cạnh tranh', 'Chế độ lương thưởng cạnh tranh so với thị trường. Ngoài lương cơ bản, nhân viên còn được hưởng thưởng doanh thu, thưởng hiệu quả công việc và các khoản trợ cấp đặc thù theo ngành hàng không.', 'SALARY', 3),
      (gen_random_uuid(), $1, 'An tâm công tác', 'Đảm bảo đầy đủ các chế độ BHXH, BHYT, BHTN theo quy định. Đặc biệt, nhân viên được tham gia các gói bảo hiểm sức khỏe cao cấp (PVI/Liberty) và bảo hiểm tai nạn 24/7.', 'INSURANCE', 4),
      (gen_random_uuid(), $1, 'Kết nối đam mê', 'Các hoạt động gắn kết sôi nổi: Team building hàng năm, giải bóng đá Vietjet Cup, các câu lạc bộ sở thích (Yoga, Chạy bộ). Đặc biệt là các sự kiện văn hóa nghệ thuật lớn diễn ra thường xuyên.', 'ACTIVITIES', 5),
      (gen_random_uuid(), $1, 'Đặc quyền bay 0 đồng', 'Chế độ vé máy bay 0 đồng cho nhân viên và gia đình trên toàn mạng bay của Vietjet. Đây là đặc quyền tuyệt vời giúp bạn và người thân khám phá những vùng đất mới một cách dễ dàng.', 'GENERAL', 6)
    `, [companyId]);

    console.log('Vietjet data UNIFIED: Intro moved to description, sections updated!');

  } catch (err) {
    console.error('Error executing query', err.stack);
  } finally {
    await client.end();
  }
}

run();
