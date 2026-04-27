import { Injectable, Logger } from '@nestjs/common';
import { IMatchingStrategy, MatchingResult } from '../../interfaces/matching.interface';

@Injectable()
export class LocationStrategy implements IMatchingStrategy {
  private readonly logger = new Logger(LocationStrategy.name);

  // Bản đồ các tỉnh lân cận hoặc cùng vùng miền
  private readonly PROXIMITY_MAP: Record<string, string[]> = {
    'hồ chí minh': ['bình dương', 'đồng nai', 'long an', 'vũng tàu', 'tây ninh'],
    'hà nội': ['hà nam', 'bắc ninh', 'vĩnh phúc', 'hưng yên', 'hải dương', 'thái nguyên'],
    'đà nẵng': ['quảng nam', 'thừa thiên huế'],
    'cần thơ': ['vĩnh long', 'hậu giang', 'an giang', 'kiên giang'],
    'hải phòng': ['quảng ninh', 'thái bình'],
  };

  async calculate(job: any, cv: any): Promise<MatchingResult> {
    try {
      const parsedCv = (cv.parsedData as any) || {};
      const candLocation = (parsedCv.location || '').toLowerCase().trim();
      const jobLocation = (job.locationCity || '').toLowerCase().trim();
      
      // 1. Công việc từ xa (Remote)
      if (job.workModel === 'REMOTE' || jobLocation.includes('remote')) {
        return {
          score: 100,
          details: { message: 'Công việc từ xa - Không giới hạn địa điểm', jobLocation, candLocation }
        };
      }

      if (!jobLocation || !candLocation) {
        return { score: 100, details: { message: 'Thiếu thông tin địa điểm, bỏ qua lọc' } };
      }

      // 2. Khớp chính xác hoặc chứa nhau
      const isExactMatch = candLocation.includes(jobLocation) || jobLocation.includes(candLocation);
      if (isExactMatch) {
        return { score: 100, details: { jobLocation, candLocation, type: 'Exact' } };
      }

      // 3. Kiểm tra vùng lân cận
      let isNear = false;
      for (const [city, neighbors] of Object.entries(this.PROXIMITY_MAP)) {
        if (jobLocation.includes(city)) {
          isNear = neighbors.some(n => candLocation.includes(n));
          if (isNear) break;
        }
        // Chiều ngược lại: ứng viên ở thành phố lớn, job ở tỉnh lân cận
        if (candLocation.includes(city)) {
          isNear = neighbors.some(n => jobLocation.includes(n));
          if (isNear) break;
        }
      }

      if (isNear) {
        return { score: 70, details: { jobLocation, candLocation, type: 'Neighbor', message: 'Vùng lân cận - Có thể di chuyển' } };
      }

      // 4. Không khớp
      return {
        score: 0,
        details: { jobLocation, candLocation, type: 'Mismatch' }
      };
    } catch (error) {
      this.logger.error(`Location Match Error: ${error.message}`);
      return { score: 100 };
    }
  }
}
