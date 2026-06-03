import { Injectable, Logger } from '@nestjs/common';
import {
  IMatchingStrategy,
  MatchingResult,
} from '../../interfaces/matching.interface';

@Injectable()
export class LocationStrategy implements IMatchingStrategy {
  private readonly logger = new Logger(LocationStrategy.name);

  // Bản đồ các tỉnh lân cận hoặc cùng vùng miền
  private readonly PROXIMITY_MAP: Record<string, string[]> = {
    'hồ chí minh': [
      'bình dương',
      'đồng nai',
      'long an',
      'vũng tàu',
      'tây ninh',
    ],
    'hà nội': [
      'hà nam',
      'bắc ninh',
      'vĩnh phúc',
      'hưng yên',
      'hải dương',
      'thái nguyên',
    ],
    'đà nẵng': ['quảng nam', 'thừa thiên huế'],
    'cần thơ': ['vĩnh long', 'hậu giang', 'an giang', 'kiên giang'],
    'hải phòng': ['quảng ninh', 'thái bình'],
  };

  async calculate(job: any, cv: any): Promise<MatchingResult> {
    try {
      const parsedCv = cv.parsedData || {};
      const rawCandLocations = [
        cv.candidate?.location,
        parsedCv.location,
      ].filter(Boolean);
      let candLocation = '';
      if (rawCandLocations.length > 0) {
        const cities = rawCandLocations.map((loc) =>
          this.extractCityFromAddress(loc),
        );
        candLocation = [...new Set(cities.filter(Boolean))].join(', ');
      }

      let jobLocation = (job.locationCity || '').trim();
      if (!jobLocation && job.branches && job.branches.length > 0) {
        const cities = job.branches
          .map((b: any) => this.extractCityFromAddress(b.branch?.address))
          .filter(Boolean);
        jobLocation = [...new Set(cities)].join(', ');
      } else if (jobLocation) {
        jobLocation = this.extractCityFromAddress(jobLocation);
      }

      const candLocLower = candLocation.toLowerCase();
      const jobLocLower = jobLocation.toLowerCase();

      // 1. Công việc từ xa (Remote)
      if (job.jobType === 'REMOTE' || jobLocLower.includes('remote')) {
        return {
          score: 100,
          details: {
            message: 'Công việc từ xa - Không giới hạn địa điểm',
            jobLocation,
            candLocation,
            type: 'Công việc từ xa',
          },
        };
      }

      if (!jobLocation || !candLocation) {
        return {
          score: 100,
          details: {
            message: 'Thiếu thông tin địa điểm, bỏ qua lọc',
            jobLocation: jobLocation || 'Không yêu cầu',
            candLocation: candLocation || 'Chưa cập nhật',
            type: 'Không áp dụng',
          },
        };
      }

      // 2. Khớp chính xác hoặc chứa nhau
      const isExactMatch =
        candLocLower.includes(jobLocLower) ||
        jobLocLower.includes(candLocLower);
      if (isExactMatch) {
        return {
          score: 100,
          details: { jobLocation, candLocation, type: 'Khớp chính xác' },
        };
      }

      // 3. Kiểm tra vùng lân cận
      let isNear = false;
      for (const [city, neighbors] of Object.entries(this.PROXIMITY_MAP)) {
        if (jobLocLower.includes(city)) {
          isNear = neighbors.some((n) => candLocLower.includes(n));
          if (isNear) break;
        }
        // Chiều ngược lại: ứng viên ở thành phố lớn, job ở tỉnh lân cận
        if (candLocLower.includes(city)) {
          isNear = neighbors.some((n) => jobLocLower.includes(n));
          if (isNear) break;
        }
      }

      if (isNear) {
        return {
          score: 70,
          details: {
            jobLocation,
            candLocation,
            type: 'Vùng lân cận',
            message: 'Vùng lân cận - Có thể di chuyển',
          },
        };
      }

      // 4. Không khớp
      return {
        score: 0,
        details: { jobLocation, candLocation, type: 'Không khớp' },
      };
    } catch (error) {
      this.logger.error(`Location Match Error: ${error.message}`);
      return { score: 100 };
    }
  }

  private normalizeCity(city: string): string {
    if (!city) return '';
    let normalized = city.toLowerCase().trim();
    normalized = normalized.replace(/^(thành phố|tp\.|tp|tỉnh)\s*/g, '').trim();
    if (['hcm', 'hồ chí minh', 'ho chi minh'].includes(normalized))
      return 'Hồ Chí Minh';
    if (['hn', 'hà nội', 'ha noi'].includes(normalized)) return 'Hà Nội';
    if (['đn', 'đà nẵng', 'da nang'].includes(normalized)) return 'Đà Nẵng';

    // Capitalize each word (Unicode support)
    return normalized.replace(/(^|\s)\S/g, (l) => l.toUpperCase());
  }

  private extractCityFromAddress(address: string): string {
    if (!address) return '';
    const parts = address.split(',').map((p) => p.trim());
    let cityPart = parts[parts.length - 1];

    // Nếu phần cuối là "Việt Nam", lấy phần liền trước đó (Thành phố/Tỉnh)
    if (
      parts.length > 1 &&
      (cityPart.toLowerCase() === 'việt nam' ||
        cityPart.toLowerCase() === 'vietnam')
    ) {
      cityPart = parts[parts.length - 2];
    }

    return this.normalizeCity(cityPart);
  }
}
