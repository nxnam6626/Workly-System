require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.aiQueryCache.deleteMany().then(()=>console.log('Cache cleared')).catch(console.error).finally(()=>prisma.$disconnect());
