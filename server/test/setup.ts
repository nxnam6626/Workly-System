import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Thiết lập trước khi chạy bất kỳ test nào
beforeAll(async () => {
  // Đảm bảo kết nối DB thành công
  await prisma.$connect();
});

// Dọn dẹp dữ liệu DB sau mỗi file Test Suite chạy xong
afterAll(async () => {
  // Lấy tất cả tên bảng trong database schema public (PostgreSQL)
  const tablenames = await prisma.$queryRaw<
    Array<{ tablename: string }>
  >`SELECT tablename FROM pg_tables WHERE schemaname='public'`;

  const tables = tablenames
    .map(({ tablename }) => tablename)
    .filter((name) => name !== '_prisma_migrations')
    .map((name) => `"public"."${name}"`)
    .join(', ');

  try {
    // Xóa trắng dữ liệu tất cả các bảng (Cascade) để đảm bảo môi trường Test sạch
    if (tables.length > 0) {
      await prisma.$executeRawUnsafe(`TRUNCATE TABLE ${tables} CASCADE;`);
    }
  } catch (error) {
    console.log({ error });
  } finally {
    await prisma.$disconnect();
  }
});
