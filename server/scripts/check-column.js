const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const result = await prisma.$queryRaw`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'CV' AND column_name = 'fileHash'
    `;
    console.log('Column check result:', result);
    if (result.length === 0) {
      console.log('Error: column fileHash does NOT exist in table CV');
    } else {
      console.log('Success: column fileHash EXISTS');
    }
  } catch (e) {
    console.error('Error during query:', e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
