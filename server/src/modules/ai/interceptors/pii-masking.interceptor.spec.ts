import { PiiMaskingInterceptor } from './pii-masking.interceptor';

describe('PiiMaskingInterceptor', () => {
  let interceptor: PiiMaskingInterceptor;

  beforeEach(() => {
    interceptor = new PiiMaskingInterceptor();
  });

  it('should be defined', () => {
    expect(interceptor).toBeDefined();
  });

  describe('maskPII', () => {
    it('should mask email addresses', () => {
      const input = 'My email is test@gmail.com and also contact abc.xyz@company.vn';
      const output = interceptor.maskPII(input);
      expect(output).toBe('My email is [BẢO MẬT] and also contact [BẢO MẬT]');
    });

    it('should mask Vietnamese phone numbers', () => {
      const input = 'Call me at 0912345678 or +84987654321';
      const output = interceptor.maskPII(input);
      expect(output).toBe('Call me at [BẢO MẬT] or [BẢO MẬT]');
    });

    it('should mask CCCD (12 digits)', () => {
      const input = 'My ID is 012345678901';
      const output = interceptor.maskPII(input);
      expect(output).toBe('My ID is [BẢO MẬT]');
    });

    it('should not mask normal numbers', () => {
      const input = 'The price is 1000000 VND and I have 5 apple';
      const output = interceptor.maskPII(input);
      expect(output).toBe(input);
    });

    it('should mask multiple types in one string', () => {
      const input = 'Email: test@gmail.com, Tel: 0909090909, ID: 123456789012';
      const output = interceptor.maskPII(input);
      expect(output).toBe('Email: [BẢO MẬT], Tel: [BẢO MẬT], ID: [BẢO MẬT]');
    });
  });
});
