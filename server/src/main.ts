import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, forbidNonWhitelisted: false }),
  );

  app.enableCors({
    origin: ['http://localhost:3000', process.env.FRONTEND_URL || ''], 
    credentials: true,
  });

  const config = new DocumentBuilder()
    .setTitle('Workly API')
    .setDescription('API cho hệ thống Workly')
    .setVersion('1.0')
    .addTag('auth', 'Xác thực: đăng ký, đăng nhập, token')
    .addTag('users', 'Quản lý người dùng')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  const port = process.env.PORT ?? 3000;

  await app.listen(port);
}

bootstrap().catch((err) => {
  console.error('❌ Application failed to start', err);
  process.exit(1);
});
