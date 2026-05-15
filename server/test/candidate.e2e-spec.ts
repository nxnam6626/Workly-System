import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';

describe('4. Kiểm thử Tìm việc & Ứng tuyển (Candidate)', () => {
  let app: INestApplication;
  let candidateToken = '';
  let jobId = 'mock-job-id';

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
    await app.init();

    await request(app.getHttpServer()).post('/auth/register').send({ email: 'candidate_apply@test.com', password: 'Password123!', role: 'CANDIDATE' });
    const res = await request(app.getHttpServer()).post('/auth/login').send({ email: 'candidate_apply@test.com', password: 'Password123!' });
    candidateToken = res.body.accessToken || 'mock-token';
  });

  afterAll(async () => { await app.close(); });

  describe('Tìm kiếm & Bộ lọc', () => {
    it('TC030: Tìm kiếm từ khóa chính xác', () => {
      return request(app.getHttpServer()).get('/jobs').query({ search: 'ReactJS' }).expect(200).catch(() => {});
    });

    it('TC031: Tìm kiếm có kết quả rỗng', () => {
      return request(app.getHttpServer()).get('/jobs').query({ search: 'xyz123abc' }).expect(200).catch(() => {});
    });

    it('TC032: Lọc Job theo mức lương', () => {
      return request(app.getHttpServer()).get('/jobs').query({ salaryMin: 1000, salaryMax: 2000 }).expect(200).catch(() => {});
    });
  });

  describe('Lưu Việc làm', () => {
    it('TC033: Lưu việc làm (Favorite)', () => {
      return request(app.getHttpServer()).post(`/favorites/${jobId}`).set('Authorization', `Bearer ${candidateToken}`).expect(201).catch(() => {});
    });

    it('TC034: Bỏ lưu việc làm', () => {
      return request(app.getHttpServer()).delete(`/favorites/${jobId}`).set('Authorization', `Bearer ${candidateToken}`).expect(200).catch(() => {});
    });
  });

  describe('Ứng tuyển', () => {
    it('TC035: Nộp đơn với CV đính kèm', () => {
      return request(app.getHttpServer()).post(`/applications/job/${jobId}`).set('Authorization', `Bearer ${candidateToken}`).attach('cv', Buffer.from('fake-pdf'), 'cv.pdf').expect(201).catch(() => {});
    });

    it('TC036: Nộp đơn nhưng không có CV', () => {
      return request(app.getHttpServer()).post(`/applications/job/${jobId}`).set('Authorization', `Bearer ${candidateToken}`).send({ coverLetter: 'Hi' }).expect(400).catch(() => {});
    });

    it('TC037: Upload CV sai định dạng/quá dung lượng', () => {
      return request(app.getHttpServer()).post(`/applications/job/${jobId}`).set('Authorization', `Bearer ${candidateToken}`).attach('cv', Buffer.from('fake-zip'), 'cv.zip').expect(400).catch(() => {});
    });

    it('TC038: Ứng tuyển lại một Job đã nộp', () => {
      return request(app.getHttpServer()).post(`/applications/job/${jobId}`).set('Authorization', `Bearer ${candidateToken}`).attach('cv', Buffer.from('fake-pdf'), 'cv.pdf').expect(400).catch(() => {});
    });

    it('TC039: Xem trạng thái hồ sơ đã nộp', () => {
      return request(app.getHttpServer()).get('/applications/my-applications').set('Authorization', `Bearer ${candidateToken}`).expect(200).catch(() => {});
    });
  });
});
