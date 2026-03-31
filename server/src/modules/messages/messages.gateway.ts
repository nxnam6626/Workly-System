import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { MessagesService } from './messages.service';
import { JwtPayload } from '../auth/auth.service';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class MessagesGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(
    private readonly jwtService: JwtService,
    private readonly messagesService: MessagesService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      const token = client.handshake.auth?.token || client.handshake.headers?.authorization?.split(' ')[1];
      if (!token) {
        client.disconnect();
        return;
      }
      
      const payload = this.jwtService.verify<JwtPayload>(token, {
          secret: process.env.JWT_ACCESS_SECRET ?? 'access-secret'
      });
      const userId = payload.sub;
      
      client.join(`user_${userId}`);
      console.log(`Client connected: ${client.id}, joined room: user_${userId}`);
    } catch (error) {
      console.error('Socket connection error:', error.message);
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('sendMessage')
  async handleSendMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversationId: string; content: string; receiverUserId: string }
  ) {
    try {
      const token = client.handshake.auth?.token || client.handshake.headers?.authorization?.split(' ')[1];
      if (!token) return;

      const payload = this.jwtService.verify<JwtPayload>(token, {
          secret: process.env.JWT_ACCESS_SECRET ?? 'access-secret'
      });
      const senderId = payload.sub;

      const message = await this.messagesService.sendMessage(senderId, data.conversationId, data.content);

      // Emit to sender to confirm
      this.server.to(`user_${senderId}`).emit('newMessage', message);

      // Emit to receiver
      if (data.receiverUserId) {
         this.server.to(`user_${data.receiverUserId}`).emit('newMessage', message);
      }
      
    } catch (error) {
       console.error('Error handling sendMessage:', error);
    }
  }
}
