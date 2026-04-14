import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable()
export class PiiMaskingInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    
    // For HTTP requests: mask the body or query
    if (request) {
      if (request.body && typeof request.body.message === 'string') {
        request.body.message = this.maskPII(request.body.message);
      }
      if (request.query && typeof request.query.message === 'string') {
        request.query.message = this.maskPII(request.query.message);
      }
    }
    
    // For WS requests
    const wsContext = context.switchToWs();
    if (wsContext && wsContext.getClient()) {
      const data = wsContext.getData<any>();
      if (data && typeof data === 'object' && typeof data.message === 'string') {
        data.message = this.maskPII(data.message);
      }
    }

    return next.handle().pipe(
      map(data => data) // Post-response masking if needed (not needed for AI response typically unless AI generates PII)
    );
  }

  maskPII(text: string): string {
    let maskedText = text;

    // Mask Email
    const emailRegex = /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/gi;
    maskedText = maskedText.replace(emailRegex, '[BẢO MẬT]');

    // Mask Phone Number (10 digits starting with 0 or +84)
    const phoneRegex = /(?:\+84|0)[3|5|7|8|9][0-9]{8}/g;
    maskedText = maskedText.replace(phoneRegex, '[BẢO MẬT]');

    // Mask CCCD (12 digits)
    const cccdRegex = /\b\d{12}\b/g;
    maskedText = maskedText.replace(cccdRegex, '[BẢO MẬT]');

    return maskedText;
  }
}
