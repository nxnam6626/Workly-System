import { Logger } from '@nestjs/common';
import { JobType } from '@prisma/client';
import { AxiosError } from 'axios';
import { Observable, throwError } from 'rxjs';

export abstract class BaseProvider {
  protected readonly logger: Logger;

  constructor(name: string) {
    this.logger = new Logger(name);
  }

  protected extractSection(text: string, keywords: string[]): string {
    if (!text) return '';
    for (const word of keywords) {
      const index = text.toLowerCase().lastIndexOf(word.toLowerCase());
      if (index !== -1) {
        return text.substring(index).split('\n\n')[0].trim();
      }
    }
    return '';
  }

  protected parseCompanySize(sizeText: string): number | null {
    if (!sizeText) return null;
    const match = sizeText.match(/\d+/g);
    return match ? Number(match[match.length - 1]) : null;
  }

  protected parseJobType(rawType?: string): JobType | null {
    if (!rawType) return null;
    const t = String(rawType).toUpperCase().replace(/[^A-Z]/g, '');
    if (t.includes('INTERN')) return JobType.INTERNSHIP;
    if (t.includes('PARTTIME')) return JobType.PARTTIME;
    if (t.includes('CONTRACT')) return JobType.CONTRACT;
    if (t.includes('REMOTE')) return JobType.REMOTE;
    if (t.includes('FULLTIME')) return JobType.FULLTIME;
    return null;
  }

  protected handleError(error: AxiosError, source: string): Observable<never> {
    const status = error.response?.status;
    const body = error.response?.data;
    const message = (body as any)?.message ?? error.message;

    this.logger.error(
      `Lỗi gọi API ${source} [HTTP ${status ?? 'N/A'}]: ${message}`,
    );

    if (body) {
      this.logger.error(`Nội dung lỗi từ ${source}: ${JSON.stringify(body)}`);
    }

    return throwError(
      () => new Error(`Failed to fetch jobs from ${source}: ${message}`),
    );
  }
}
