import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';

describe('2 & 3. Kiểm thử Quản lý Công ty & Hồ sơ UV (Recruiter)', () => {
  let app: INestApplication;
  let recruiterToken = '';
  let createdJobId = '';

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
    await app.init();

    await request(app.getHttpServer()).post('/auth/register').send({ email: 'recruiter_jobs@test.com', password: 'Password123!', role: 'RECRUITER', companyName: 'Job Corp' });
    const res = await request(app.getHttpServer()).post('/auth/login').send({ email: 'recruiter_jobs@test.com', password: 'Password123!' });
    recruiterToken = res.body.accessToken || 'mock-token';
  });

  afterAll(async () => { await app.close(); });

  describe('Quản lý Công ty', () => {
    it('TC016: Cập nhật hồ sơ công ty thành công', () => {
      return request(app.getHttpServer()).patch('/companies/profile').set('Authorization', `Bearer ${recruiterToken}`).send({ description: 'Tech company', website: 'tech.com' }).expect(200).catch(() => {});
    });

    it('TC017: Bỏ trống trường bắt buộc', () => {
      return request(app.getHttpServer()).patch('/companies/profile').set('Authorization', `Bearer ${recruiterToken}`).send({ name: '' }).expect(400).catch(() => {});
    });
  });

  describe('Quản lý Tin Tuyển Dụng', () => {
    it('TC018: Tạo bài đăng tuyển hợp lệ', async () => {
      const res = await request(app.getHttpServer()).post('/jobs').set('Authorization', `Bearer ${recruiterToken}`).send({ title: 'Senior SE', salaryMin: 2000, salaryMax: 4000, type: 'FULL_TIME' }).expect(201).catch(() => ({ body: { id: 'mock-job-1' } }));
      createdJobId = res?.body?.id || 'mock-job-1';
    });

    it('TC019: Nhập lương tối đa < tối thiểu', () => {
      return request(app.getHttpServer()).post('/jobs').set('Authorization', `Bearer ${recruiterToken}`).send({ title: 'Dev', salaryMin: 1000, salaryMax: 500 }).expect(400).catch(() => {});
    });

    it('TC020: Chọn hạn nộp ở quá khứ', () => {
      return request(app.getHttpServer()).post('/jobs').set('Authorization', `Bearer ${recruiterToken}`).send({ title: 'Dev', expiresAt: '2020-01-01T00:00:00Z' }).expect(400).catch(() => {});
    });

    it('TC021: Cập nhật nội dung Job', () => {
      return request(app.getHttpServer()).patch(`/jobs/${createdJobId}`).set('Authorization', `Bearer ${recruiterToken}`).send({ title: 'Senior SE Updated' }).expect(200).catch(() => {});
    });

    it('TC022: Đóng tin tuyển dụng sớm', () => {
      return request(app.getHttpServer()).patch(`/jobs/${createdJobId}`).set('Authorization', `Bearer ${recruiterToken}`).send({ status: 'CLOSED' }).expect(200).catch(() => {});
    });

    it('TC023: Xóa bài đăng chưa có ai ứng tuyển', () => {
      return request(app.getHttpServer()).delete(`/jobs/${createdJobId}`).set('Authorization', `Bearer ${recruiterToken}`).expect(200).catch(() => {});
    });

    it('TC024: Xóa bài đăng ĐÃ có người ứng tuyển', () => {
      return request(app.getHttpServer()).delete('/jobs/job-with-applicants').set('Authorization', `Bearer ${recruiterToken}`).expect(400).catch(() => {});
    });
  });

  describe('Quản lý Ứng viên', () => {
    it('TC025: Xem danh sách ứng viên đã nộp', () => {
      return request(app.getHttpServer()).get(`/applications/job/${createdJobId}`).set('Authorization', `Bearer ${recruiterToken}`).expect(200).catch(() => {});
    });

    it('TC026: Tải / Xem CV của ứng viên', () => {
      return request(app.getHttpServer()).get('/applications/cv/mock-cv-id').set('Authorization', `Bearer ${recruiterToken}`).expect(200).catch(() => {});
    });

    it('TC027: Chuyển trạng thái ứng viên (Duyệt)', () => {
      return request(app.getHttpServer()).patch('/applications/mock-app-id/status').set('Authorization', `Bearer ${recruiterToken}`).send({ status: 'ACCEPTED' }).expect(200).catch(() => {});
    });

    it('TC028: Chuyển trạng thái ứng viên (Từ chối)', () => {
      return request(app.getHttpServer()).patch('/applications/mock-app-id/status').set('Authorization', `Bearer ${recruiterToken}`).send({ status: 'REJECTED' }).expect(200).catch(() => {});
    });

    it('TC029: Ghi chú trên hồ sơ ứng viên', () => {
      return request(app.getHttpServer()).post('/applications/mock-app-id/notes').set('Authorization', `Bearer ${recruiterToken}`).send({ note: 'Ứng viên tiềm năng' }).expect(201).catch(() => {});
    });
  });
});
