import { NestFactory } from '@nestjs/core';
import { AppModule } from './src/app.module';
import { CompaniesService } from './src/modules/companies/companies.service';
import { PrismaService } from './src/prisma/prisma.service';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const prisma = app.get(PrismaService);
  const companiesService = app.get(CompaniesService);

  try {
    // 1. Create a dummy user
    const user = await prisma.user.create({
      data: {
        email: 'testrecruiter@demo.com',
        status: 'ACTIVE',
      }
    });

    // 2. Create a recruiter for this user
    const recruiter = await prisma.recruiter.create({
      data: {
        userId: user.userId,
      }
    });

    console.log('Created dummy recruiter:', recruiter.recruiterId);

    // 3. Try to update company
    const updateData = {
      companyName: '',
      taxCode: null,
      address: null,
      websiteUrl: null,
      companySize: null,
      description: null,
      logo: null,
      banner: null
    };

    console.log('Attempting to updateMyCompany...');
    const result = await companiesService.updateMyCompany(user.userId, updateData);
    console.log('Success!', result);

  } catch (err) {
    console.error('FAILED:', err);
  } finally {
    const user = await prisma.user.findUnique({ where: { email: 'testrecruiter@demo.com'} });
    if (user) {
        await prisma.recruiter.deleteMany({ where: { userId: user.userId }});
        await prisma.user.delete({ where: { userId: user.userId }});
    }
    await app.close();
  }
}
bootstrap();
