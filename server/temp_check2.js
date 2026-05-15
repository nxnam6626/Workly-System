const { PrismaClient } = require('./src/generated/prisma');
const prisma = new PrismaClient();
prisma.jobPosting.findUnique({where: {jobPostingId: 'd75c72b0-ad4e-4344-8339-3c33b36cb199'}}).then(r => {
  console.log('Job status:', r.status);
  process.exit(0);
});
