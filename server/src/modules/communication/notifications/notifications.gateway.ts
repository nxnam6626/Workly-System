import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { JwtPayload } from '@/modules/identity/auth/token.service';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class NotificationsGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  constructor(private readonly jwtService: JwtService) {}

  async handleConnection(client: Socket) {
    try {
      const token =
        client.handshake.auth?.token ||
        client.handshake.headers?.authorization?.split(' ')[1];
      
      if (token) {
        try {
          const payload = this.jwtService.verify<JwtPayload>(token, {
            secret: process.env.JWT_ACCESS_SECRET ?? 'access-secret',
          });
          const userId = payload.sub;
          client.join(`user_${userId}`);
          console.log(`User ${userId} joined notifications room`);
        } catch (err) {
          console.warn('Invalid socket token provided');
        }
      } else {
        console.log('Guest client connected to socket');
      }
    } catch (error) {
      // Ignore connection errors for now
    }
  }

  handleDisconnect(client: Socket) {
    // No specific logic needed
  }

  @SubscribeMessage('join_room')
  handleJoinRoom(client: Socket, room: string) {
    client.join(room);
    console.log(`Client joined room: ${room}`);
    return { status: 'success', room };
  }

  emitToUser(userId: string, event: string, data: any) {
    this.server.to(`user_${userId}`).emit(event, data);
  }

  emitToCompany(companyId: string, event: string, data: any) {
    this.server.to(`company_${companyId}`).emit(event, data);
  }
}
