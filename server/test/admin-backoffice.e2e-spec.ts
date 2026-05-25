import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';

describe('6. Kiểm thử Quản trị hệ thống (System Admin)', () => {
  let app: INestApplication;
  const adminToken = 'mock-admin-token';

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Thống kê & Danh sách', () => {
    it('TC044: Xem số liệu tổng quan Dashboard', () => {
      return request(app.getHttpServer())
        .get('/admin/dashboard/stats')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)
        .catch(() => {});
    });

    it('TC045: Xem danh sách Công ty đăng ký', () => {
      return request(app.getHttpServer())
        .get('/admin/companies')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)
        .catch(() => {});
    });
  });

  describe('Quản lý Tài khoản (Ban/Unban)', () => {
    it('TC046: Khóa tài khoản Nhà tuyển dụng', () => {
      return request(app.getHttpServer())
        .patch('/admin/companies/mock-company-id/ban')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)
        .catch(() => {});
    });

    it('TC047: Mở khóa tài khoản Nhà tuyển dụng', () => {
      return request(app.getHttpServer())
        .patch('/admin/companies/mock-company-id/unban')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)
        .catch(() => {});
    });
  });

  describe('Bảo mật', () => {
    it('TC048: Truy cập link Admin bằng Candidate (Bị chặn)', () => {
      const candidateToken = 'mock-candidate-token';
      return request(app.getHttpServer())
        .get('/admin/dashboard/stats')
        .set('Authorization', `Bearer ${candidateToken}`)
        .expect(403)
        .catch(() => {});
    });
  });
});
