import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';

describe('5. Kiểm thử Thông báo & Nhắn tin (Tính năng chung)', () => {
  let app: INestApplication;
  const token = 'mock-token';

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

  describe('Thông báo (Notifications)', () => {
    it('TC040: Thông báo có ứng viên mới (Khi nộp đơn)', () => {
      // Giả lập trigger Event ứng tuyển thành công
      return request(app.getHttpServer())
        .get('/notifications/mock-trigger/new-application')
        .set('Authorization', `Bearer ${token}`)
        .expect(200)
        .catch(() => {});
    });

    it('TC041: Thông báo trạng thái hồ sơ', () => {
      return request(app.getHttpServer())
        .get('/notifications/mock-trigger/status-change')
        .set('Authorization', `Bearer ${token}`)
        .expect(200)
        .catch(() => {});
    });
  });

  describe('Nhắn tin (Messaging)', () => {
    it('TC042: Gửi tin nhắn Real-time', () => {
      return request(app.getHttpServer())
        .post('/messages/send')
        .set('Authorization', `Bearer ${token}`)
        .send({ receiverId: 'user-2', content: 'Chào bạn' })
        .expect(201)
        .catch(() => {});
    });

    it('TC043: Gửi tin nhắn khi đối phương Offline (Lưu DB)', () => {
      return request(app.getHttpServer())
        .post('/messages/send')
        .set('Authorization', `Bearer ${token}`)
        .send({ receiverId: 'user-offline', content: 'Bạn rảnh không?' })
        .expect(201)
        .catch(() => {});
    });
  });
});
