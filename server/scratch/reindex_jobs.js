
const { PrismaClient } = require('@prisma/client');
const { Client } = require('@elastic/elasticsearch');

const prisma = new PrismaClient();
const esClient = new Client({
  node: process.env.ELASTICSEARCH_NODE || 'http://localhost:9200',
});

async function main() {
  console.log('🚀 Bắt đầu Re-index toàn bộ tin tuyển dụng...');

  const jobs = await prisma.jobPosting.findMany({
    where: { status: 'APPROVED' },
    include: {
      company: true,
    }
  });

  console.log(` tìm thấy ${jobs.length} tin tuyển dụng cần đồng bộ.`);

  for (const job of jobs) {
    try {
      await esClient.index({
        index: 'jobs',
        id: job.jobPostingId,
        body: {
          title: job.title,
          description: job.description,
          companyId: job.companyId,
          companyName: job.company?.companyName || undefined,
          originalUrl: job.originalUrl,
          locationCity: job.locationCity,
          jobType: job.jobType,
          experience: job.experience,
          salaryMin: job.salaryMin ? Number(job.salaryMin) : undefined,
          salaryMax: job.salaryMax ? Number(job.salaryMax) : undefined,
          createdAt: job.createdAt,
          refreshedAt: job.refreshedAt,
          jobTier: job.jobTier,
          jobLevel: job.jobLevel, // TRƯỜNG QUAN TRỌNG NHẤT
          status: job.status,
          industry: (job.structuredRequirements)?.categories?.length > 0 
            ? (job.structuredRequirements).categories 
            : ['Đa lĩnh vực / Khác'],
        },
      });
      process.stdout.write('.');
    } catch (e) {
      console.error(`\n❌ Lỗi khi sync job ${job.jobPostingId}:`, e.message);
    }
  }

  console.log('\n✅ Hoàn thành Re-index!');
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
