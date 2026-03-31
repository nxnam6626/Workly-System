const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const msgs = await prisma.message.findMany();
  console.log(`Total messages in DB: ${msgs.length}`);
  
  const counts = {};
  msgs.forEach(m => {
    counts[m.content] = (counts[m.content] || 0) + 1;
  });
  
  const duplicates = Object.entries(counts).filter(([k, v]) => v > 1);
  console.log('Duplicate messages by content:');
  duplicates.forEach(([k, v]) => console.log(`- "${k}": ${v} times`));
  
  // Checking by conversation
  const convCounts = await prisma.conversation.count();
  console.log(`Total conversations: ${convCounts}`);
}

main().finally(() => prisma.$disconnect());
