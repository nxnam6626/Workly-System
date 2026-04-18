import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { MatchingOrchestratorService } from '../src/modules/matching-engine/services/matching-orchestrator.service';
import { Logger } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

async function seed() {
  const logger = new Logger('TestDataSeeder');
  logger.log('🌱 Đang bắt đầu tạo dữ liệu test...');

  const app = await NestFactory.createApplicationContext(AppModule);
  const prisma = app.get(PrismaService);
  const orchestrator = app.get(MatchingOrchestratorService);

  try {
    const password = await bcrypt.hash('password123', 10);

    // 1. Tạo Role nếu chưa có
    const recruiterRole = await prisma.role.upsert({
      where: { roleName: 'RECRUITER' },
      update: {},
      create: { roleName: 'RECRUITER' },
    });

    const candidateRole = await prisma.role.upsert({
      where: { roleName: 'CANDIDATE' },
      update: {},
      create: { roleName: 'CANDIDATE' },
    });

    // 2. Tạo Tài khoản Nhà tuyển dụng & Công ty
    const recruiterUser = await prisma.user.upsert({
      where: { email: 'recruiter-test@workly.vn' },
      update: {},
      create: {
        email: 'recruiter-test@workly.vn',
        password,
        status: 'ACTIVE',
      },
    });

    await prisma.userRole.upsert({
      where: { userId_roleId: { userId: recruiterUser.userId, roleId: recruiterRole.roleId } },
      update: {},
      create: { userId: recruiterUser.userId, roleId: recruiterRole.roleId },
    });

    const company = await prisma.company.create({
      data: {
        companyName: 'Workly Global Tech',
        description: 'Công ty công nghệ hàng đầu về giải pháp AI.',
        address: 'Quận 1, TP.HCM',
        verifyStatus: 1,
      },
    });

    const recruiter = await prisma.recruiter.upsert({
      where: { userId: recruiterUser.userId },
      update: { companyId: company.companyId },
      create: {
        userId: recruiterUser.userId,
        companyId: company.companyId,
      },
    });

    // 3. Tạo 3 Tin tuyển dụng (Jobs)
    const jobsData = [
      {
        title: 'NodeJS Developer (Mid-level)',
        description: 'Xây dựng hệ thống backend hiệu năng cao sử dụng NodeJS và PostgreSQL.',
        requirements: 'Ít nhất 2 năm kinh nghiệm với NodeJS, Express, PostgreSQL, Docker.',
        salaryMin: 1500,
        salaryMax: 2500,
        experience: '2',
        structuredRequirements: {
          minEducation: 'Bachelor',
          requiredMajor: 'Computer Science',
        }
      },
      {
        title: 'Senior Frontend Engineer (React)',
        description: 'Dẫn dắt đội ngũ phát triển giao diện người dùng hiện đại.',
        requirements: 'Ít nhất 5 năm kinh nghiệm với React, Redux, Performance Optimization, Unit Testing.',
        salaryMin: 3000,
        salaryMax: 4500,
        experience: '5',
        structuredRequirements: {
          minEducation: 'Bachelor',
          requiredMajor: 'Information Technology',
        }
      },
      {
        title: 'Java Spring Boot Architect',
        description: 'Thiết kế hệ thống core ngân hàng sử dụng Java Microservices.',
        requirements: 'Chuyên gia Java, Spring Boot, Kafka, Kubernetes, SQL Server.',
        salaryMin: 4000,
        salaryMax: 6000,
        experience: '8',
        structuredRequirements: {
          minEducation: 'Master',
          requiredMajor: 'Software Engineering',
        }
      }
    ];

    const createdJobs: any[] = [];
    for (const data of jobsData) {
      const job = await prisma.jobPosting.create({
        data: {
          ...data,
          companyId: company.companyId,
          recruiterId: recruiter.recruiterId,
          status: 'APPROVED',
          locationCity: 'Hồ Chí Minh',
          jobType: 'FULLTIME',
          originalUrl: `https://workly.vn/test-job/${Math.random()}`,
        }
      });
      createdJobs.push(job);
      logger.log(`✅ Đã tạo Job: ${job.title}`);
    }

    // 4. Tạo 4 Ứng viên & CV theo các kịch bản test
    const candidatesData = [
      {
        email: 'perfect@candidate.vn',
        name: 'Nguyễn Văn Hoàn Hảo',
        cvTitle: 'NodeJS Developer CV',
        parsedData: {
          summary: 'Kỹ sư NodeJS với 3 năm kinh nghiệm phát triển Backend.',
          skills: ['NodeJS', 'Express', 'PostgreSQL', 'Docker', 'Redis'],
          experience: 'Đã làm việc 3 năm tại công ty X, xây dựng API cho hệ thống thương mại điện tử.',
          yearsOfExperience: 3,
          education: { level: 'Bachelor', major: 'Computer Science' },
          location: 'Hồ Chí Minh',
          expectedSalary: 2000,
        }
      },
      {
        email: 'master@candidate.vn',
        name: 'Trần Thạc Sĩ',
        cvTitle: 'Master Researcher',
        parsedData: {
          summary: 'Thạc sĩ Khoa học máy tính, chuyên sâu về thuật toán.',
          skills: ['Algorithms', 'Python', 'Data Science'],
          experience: 'Nghiên cứu sinh tại viện công nghệ.',
          yearsOfExperience: 2,
          education: { level: 'Master', major: 'Computer Science' },
          location: 'Hồ Chí Minh',
          expectedSalary: 2200,
        }
      },
      {
        email: 'location@candidate.vn',
        name: 'Lê Ở Hà Nội',
        cvTitle: 'Hanoi Developer',
        parsedData: {
          summary: 'Kỹ sư NodeJS giỏi nhưng đang sống tại Hà Nội.',
          skills: ['NodeJS', 'Express', 'PostgreSQL'],
          experience: '3 năm kinh nghiệm.',
          yearsOfExperience: 3,
          education: { level: 'Bachelor', major: 'Computer Science' },
          location: 'Hà Nội',
          expectedSalary: 2000,
        }
      },
      {
        email: 'expensive@candidate.vn',
        name: 'Phạm Lương Cao',
        cvTitle: 'Junior High Salary',
        parsedData: {
          summary: 'Junior mới ra trường nhưng muốn lương nghìn đô.',
          skills: ['NodeJS', 'Javascript'],
          experience: 'Thực tập sinh.',
          yearsOfExperience: 1,
          education: { level: 'Bachelor', major: 'Information Technology' },
          location: 'Hồ Chí Minh',
          expectedSalary: 3500, // Vượt quá max 2500 của Job
        }
      }
    ];

    for (const data of candidatesData) {
      const candUser = await prisma.user.upsert({
        where: { email: data.email },
        update: {},
        create: {
          email: data.email,
          password,
          status: 'ACTIVE',
        }
      });

      await prisma.userRole.upsert({
        where: { userId_roleId: { userId: candUser.userId, roleId: candidateRole.roleId } },
        update: {},
        create: { userId: candUser.userId, roleId: candidateRole.roleId }
      });

      const candidate = await prisma.candidate.upsert({
        where: { userId: candUser.userId },
        update: { fullName: data.name },
        create: {
          userId: candUser.userId,
          fullName: data.name,
        }
      });

      await prisma.cV.upsert({
        where: { cvId: (await prisma.cV.findFirst({ where: { candidateId: candidate.candidateId, cvTitle: data.cvTitle } }))?.cvId || 'unreal-id' },
        update: { parsedData: data.parsedData as any },
        create: {
          candidateId: candidate.candidateId,
          cvTitle: data.cvTitle,
          isMain: true,
          parsedData: data.parsedData as any,
        }
      });
      logger.log(`✅ Đã xử lý Candidate: ${data.name}`);
    }

    // 5. Chạy Matching Orchestrator
    logger.log('🔄 Đang chạy Matching Orchestrator...');
    for (const job of createdJobs) {
      await orchestrator.runMatchingForJob(job.jobPostingId);
      logger.log(`🧬 Đã hoàn thành Matching cho Job: ${job.title}`);
    }

    logger.log('🚀 SEED DỮ LIỆU THÀNH CÔNG!');

  } catch (error) {
    logger.error(`❌ Lỗi khi seed dữ liệu: ${error.message}`);
    console.error(error);
  } finally {
    await app.close();
  }
}

seed();
