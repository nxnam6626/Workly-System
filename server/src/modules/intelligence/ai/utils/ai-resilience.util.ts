import { Logger } from '@nestjs/common';

export class AiTimeoutError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AiTimeoutError';
  }
}

export class AiResilienceUtil {
  private static readonly logger = new Logger(AiResilienceUtil.name);

  /**
   * Chạy một hàm Promise với giới hạn thời gian (Timeout).
   * @param operation Hàm bất đồng bộ cần chạy
   * @param timeoutMs Thời gian tối đa (mili-giây)
   * @param context Tên context để log
   */
  static async withTimeout<T>(
    operation: () => Promise<T>,
    timeoutMs: number,
    context: string = 'Operation',
  ): Promise<T> {
    let timeoutHandle: NodeJS.Timeout;

    const timeoutPromise = new Promise<never>((_, reject) => {
      timeoutHandle = setTimeout(() => {
        reject(new AiTimeoutError(`[${context}] Timeout after ${timeoutMs}ms`));
      }, timeoutMs);
    });

    try {
      return await Promise.race([operation(), timeoutPromise]);
    } finally {
      clearTimeout(timeoutHandle!);
    }
  }

  /**
   * Chạy lại một hàm nếu gặp lỗi, sử dụng chiến lược Exponential Backoff.
   * @param operation Hàm bất đồng bộ
   * @param maxRetries Số lần thử tối đa (mặc định 3)
   * @param baseDelayMs Thời gian chờ cơ bản (mặc định 1000ms)
   * @param context Tên context để log
   */
  static async withRetry<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    baseDelayMs: number = 1000,
    context: string = 'Operation',
  ): Promise<T> {
    let lastError: any;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error: any) {
        lastError = error;

        // Nếu là lỗi cuối cùng thì ném ra ngoài
        if (attempt === maxRetries) {
          this.logger.error(
            `[${context}] Failed after ${maxRetries} attempts. Last error: ${error.message}`,
          );
          throw error;
        }

        // Không retry nếu lỗi rõ ràng là 400 Bad Request hoặc 401 Unauthorized (không phải lỗi mạng)
        if (error.status === 400 || error.status === 401) {
          throw error;
        }

        const delay = baseDelayMs * Math.pow(2, attempt - 1); // 1s, 2s, 4s...
        this.logger.warn(
          `[${context}] Attempt ${attempt} failed: ${error.message}. Retrying in ${delay}ms...`,
        );

        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }

    throw lastError;
  }
}
