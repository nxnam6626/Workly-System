import { AiResilienceUtil, AiTimeoutError } from './ai-resilience.util';

describe('AiResilienceUtil', () => {
  describe('withTimeout', () => {
    it('should resolve if operation completes before timeout', async () => {
      const operation = () =>
        new Promise<string>((resolve) =>
          setTimeout(() => resolve('success'), 50),
        );
      const result = await AiResilienceUtil.withTimeout(operation, 100);
      expect(result).toBe('success');
    });

    it('should throw AiTimeoutError if operation takes longer than timeout', async () => {
      const operation = () =>
        new Promise<string>((resolve) =>
          setTimeout(() => resolve('success'), 150),
        );
      await expect(AiResilienceUtil.withTimeout(operation, 50)).rejects.toThrow(
        AiTimeoutError,
      );
    });
  });

  describe('withRetry', () => {
    it('should resolve immediately if operation succeeds on first try', async () => {
      const operation = jest.fn().mockResolvedValue('success');
      const result = await AiResilienceUtil.withRetry(operation, 3, 100);
      expect(result).toBe('success');
      expect(operation).toHaveBeenCalledTimes(1);
    });

    it('should retry on failure and resolve if a subsequent attempt succeeds', async () => {
      const operation = jest
        .fn()
        .mockRejectedValueOnce(new Error('Fail 1'))
        .mockRejectedValueOnce(new Error('Fail 2'))
        .mockResolvedValueOnce('success');

      const result = await AiResilienceUtil.withRetry(operation, 3, 10);
      expect(result).toBe('success');
      expect(operation).toHaveBeenCalledTimes(3);
    });

    it('should throw the last error if all attempts fail', async () => {
      const operation = jest
        .fn()
        .mockRejectedValue(new Error('Persistent Fail'));

      await expect(
        AiResilienceUtil.withRetry(operation, 3, 10),
      ).rejects.toThrow('Persistent Fail');
      expect(operation).toHaveBeenCalledTimes(3);
    });

    it('should not retry if the error is 400 Bad Request', async () => {
      const error = new Error('Bad Request') as any;
      error.status = 400;
      const operation = jest.fn().mockRejectedValue(error);

      await expect(
        AiResilienceUtil.withRetry(operation, 3, 10),
      ).rejects.toThrow('Bad Request');
      expect(operation).toHaveBeenCalledTimes(1); // Only tried once
    });
  });
});
