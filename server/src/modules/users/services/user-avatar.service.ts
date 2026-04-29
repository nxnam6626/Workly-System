import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { SupabaseService } from '../../../common/supabase/supabase.service';

@Injectable()
export class UserAvatarService {
  constructor(
    private prisma: PrismaService,
    private supabaseService: SupabaseService,
  ) { }

  async updateAvatar(userId: string, file: Express.Multer.File) {
    const user = await this.prisma.user.findUnique({
      where: { userId },
    });
    if (!user) throw new NotFoundException('Không tìm thấy người dùng.');

    // 1. Upload new avatar
    const fileExt = file.originalname.split('.').pop();
    const fileName = `${userId}-${Date.now()}.${fileExt}`;
    const path = `avatars/${userId}/${fileName}`;

    const avatarUrl = await this.supabaseService.uploadFile(
      file.buffer,
      path,
      file.mimetype,
    );

    // 2. Update DB
    await this.prisma.user.update({
      where: { userId },
      data: { avatar: avatarUrl },
    });

    // 3. Cleanup old avatar
    if (user.avatar) {
      const oldPath = this.supabaseService.extractPathFromUrl(user.avatar);
      if (oldPath) {
        try {
          await this.supabaseService.deleteFile(oldPath);
        } catch (e) {
          console.error('[UserAvatarService] Failed to delete old avatar:', e);
        }
      }
    }

    return { avatarUrl };
  }
}
