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
import { JwtPayload } from '../auth/token.service';
import { PrismaService } from '../../prisma/prisma.service';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class MessagesGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private activeUsers = new Map<string, number>();

  constructor(
    private readonly jwtService: JwtService,
    private readonly messagesService: MessagesService,
    private readonly prismaService: PrismaService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      const token =
        client.handshake.auth?.token ||
        client.handshake.headers?.authorization?.split(' ')[1];
      if (!token) {
        client.disconnect();
        return;
      }

      const payload = this.jwtService.verify<JwtPayload>(token, {
        secret: process.env.JWT_ACCESS_SECRET ?? 'access-secret',
      });
      const userId = payload.sub;
      client.data.userId = userId;

      client.join(`user_${userId}`);
      console.log(
        `Client connected: ${client.id}, joined room: user_${userId}`,
      );

      const count = this.activeUsers.get(userId) || 0;
      this.activeUsers.set(userId, count + 1);

      if (count === 0) {
        try {
          const result = await this.prismaService.user.updateMany({
            where: { userId },
            data: { isOnline: true },
          });
          if (result.count > 0) {
            this.server.emit('userStatusChanged', { userId, isOnline: true });
          }
        } catch (e) {
          console.error('Failed to update online status:', e);
        }
      }
    } catch (error) {
      console.error('Socket connection error:', error.message);
      client.disconnect();
    }
  }

  async handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);

    const userId = client.data?.userId;
    if (!userId) return;

    const count = this.activeUsers.get(userId) || 1;
    this.activeUsers.set(userId, Math.max(0, count - 1));

    if (count - 1 === 0) {
      try {
        const lastActive = new Date();
        const result = await this.prismaService.user.updateMany({
          where: { userId },
          data: { isOnline: false, lastActive },
        });
        if (result.count > 0) {
          this.server.emit('userStatusChanged', {
            userId,
            isOnline: false,
            lastActive,
          });
        }
      } catch (e) {
        console.error('Failed to update offline status:', e);
      }
    }
  }

  @SubscribeMessage('sendMessage')
  async handleSendMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    data: { conversationId: string; content: string; receiverUserId: string },
  ) {
    try {
      const token =
        client.handshake.auth?.token ||
        client.handshake.headers?.authorization?.split(' ')[1];
      if (!token) return;

      const payload = this.jwtService.verify<JwtPayload>(token, {
        secret: process.env.JWT_ACCESS_SECRET ?? 'access-secret',
      });
      const senderId = payload.sub;

      const message = await this.messagesService.sendMessage(
        senderId,
        data.conversationId,
        data.content,
      );

      // Emit to sender to confirm
      this.server.to(`user_${senderId}`).emit('newMessage', message);

      // Emit to receiver
      if (data.receiverUserId) {
        this.server
          .to(`user_${data.receiverUserId}`)
          .emit('newMessage', message);
      }
    } catch (error) {
      console.error('Error handling sendMessage:', error);
    }
  }
}
