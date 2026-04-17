import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';
dotenv.config();

const prisma = new PrismaClient();
async function main() {
  const result = await prisma.recruiterSubscription.updateMany({
    where: { planType: 'GROWTH' },
    data: { maxBasicPosts: 20, maxVipPosts: 10, maxUrgentPosts: 3 }
  });
  console.log('Fixed limits for GROWTH plan records. Updated count: ', result.count);
}
main().finally(() => prisma.$disconnect());
