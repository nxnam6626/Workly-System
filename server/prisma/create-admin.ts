import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { StatusUser } from '@prisma/client';
import * as bcrypt from 'bcrypt';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const prisma = app.get(PrismaService);

  const email = 'admin@workly.com';
  const rawPassword = 'admin123';

  console.log(`Setting up admin account for ${email}...`);

  try {
    // 1. Ensure ADMIN role exists
    let adminRole = await prisma.role.findUnique({
      where: { roleName: 'ADMIN' },
    });

    if (!adminRole) {
      adminRole = await prisma.role.create({
        data: { roleName: 'ADMIN' },
      });
      console.log('Created ADMIN role.');
    }

    // 2. Hash password
    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(rawPassword, salt);

    // 3. Create or Update user
    let user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          status: StatusUser.ACTIVE,
          isEmailVerified: true,
        },
      });
      console.log(`Created new Admin User: ${email}`);
    } else {
      user = await prisma.user.update({
        where: { email },
        data: {
          password: hashedPassword,
          status: StatusUser.ACTIVE,
        }
      });
      console.log(`Updated existing user: ${email} to be an Admin`);
    }

    // 4. Create Admin profile
    let adminProfile = await prisma.admin.findUnique({
      where: { userId: user.userId },
    });

    if (!adminProfile) {
      adminProfile = await prisma.admin.create({
        data: {
          userId: user.userId,
          adminLevel: 1,
        },
      });
      console.log('Created Admin profile.');
    }

    // 5. Link User to ADMIN Role
    const existingUserRole = await prisma.userRole.findUnique({
      where: {
        userId_roleId: {
          userId: user.userId,
          roleId: adminRole.roleId,
        },
      },
    });

    if (!existingUserRole) {
      await prisma.userRole.create({
        data: {
          userId: user.userId,
          roleId: adminRole.roleId,
        },
      });
      console.log('Linked User to ADMIN role.');
    }

    console.log('\n✅ Admin Account is ready!');
    console.log(`Email: ${email}`);
    console.log(`Password: ${rawPassword}`);
  } catch (error) {
    console.error('FAILED:', error);
  } finally {
    await app.close();
  }
}

bootstrap();
