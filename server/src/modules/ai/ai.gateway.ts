import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { AiService } from './ai.service';
import { UseInterceptors } from '@nestjs/common';
import { PiiMaskingInterceptor } from './interceptors/pii-masking.interceptor';

@WebSocketGateway({
  namespace: '/ai-chat',
  cors: {
    origin: '*',
  },
})
export class AiGateway {
  @WebSocketServer()
  server: Server;

  constructor(private readonly aiService: AiService) {}

  @UseInterceptors(PiiMaskingInterceptor)
  @SubscribeMessage('send_message')
  async handleMessage(
    @MessageBody() data: { message: string, context?: any },
    @ConnectedSocket() client: Socket,
  ) {
    try {
      const { message, context } = data;

      // Mask PII here directly in case the interceptor on WebSocket is inconsistent.
      // E.g., text instead of object might bypass some generic interceptor logic.
      // But we handled object in Interceptor. For safety, let's rely on the service to do processing.

      // AI Service now handles intention extraction, RAG, and returns stream
      const stream = this.aiService.processChatWithRAGStream(message, context);

      for await (const chunk of stream) {
        if (typeof chunk === 'string') {
          // Normal chat stream chunk
          client.emit('stream_chunk', { text: chunk });
        } else {
          // Generative UI or Action payload (e.g. Job cards or Handoff command)
          client.emit('ai_action', chunk);
        }
      }

      client.emit('stream_end', { success: true });
    } catch (e) {
      console.error('[AiGateway] Error processing message:', e);
      client.emit('stream_chunk', { text: '\\n[System]: Có lỗi xảy ra trong quá trình xử lý.' });
      client.emit('stream_end', { success: false });
    }
  }
}
