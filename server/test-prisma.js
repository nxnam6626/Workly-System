const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  const user = await prisma.user.findFirst({
    where: { userRoles: { some: { role: { name: 'CANDIDATE' } } } },
    include: { candidate: { include: { certifications: true } } }
  });
  
  if (!user || !user.candidate) {
    console.log("No candidate found");
    return;
  }
  
  const candidateId = user.candidate.candidateId;
  console.log("Found candidate:", candidateId);
  console.log("Current certs:", user.candidate.certifications);

  // Simulate update logic
  const certifications = [
    { name: "Cert 1", issuer: "Org 1" },
    { name: "Cert 2", issuer: "Org 2" }
  ];

  await prisma.$transaction(async (tx) => {
    const existingCerts = await tx.certification.findMany({ where: { candidateId } });
    await tx.certification.deleteMany({ where: { candidateId } });
    if (certifications.length > 0) {
      await tx.certification.createMany({
        data: certifications.map((cert) => {
          const name = cert.name || '';
          const existing = existingCerts.find(ec => ec.name.toLowerCase() === name.toLowerCase());
          return {
            candidateId,
            name,
            issuer: cert.issuer,
            status: existing ? existing.status : 'UNVERIFIED',
          };
        })
      });
    }
  });

  const finalCerts = await prisma.certification.findMany({ where: { candidateId } });
  console.log("Final certs:", finalCerts);
}

run().catch(console.error).finally(() => prisma.$disconnect());
