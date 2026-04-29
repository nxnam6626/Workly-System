import { Injectable } from '@nestjs/common';
import { Client } from '@elastic/elasticsearch';

@Injectable()
export class UserEsService {
  constructor(private readonly client: Client) { }

  async indexUser(user: { id: string; email: string; roles: string[] }) {
    try {
      await this.client.index({
        index: 'users',
        id: user.id,
        body: {
          email: user.email,
          roles: user.roles,
        },
      });
    } catch (e: any) {
      console.error('[UserEsService] Error indexing user:', e.message);
    }
  }
}
