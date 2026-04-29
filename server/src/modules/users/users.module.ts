import { Module, forwardRef } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { UserCreationService } from './services/user-creation.service';
import { CandidateProfileService } from './services/candidate-profile.service';
import { UserAvatarService } from './services/user-avatar.service';
import { UserModerationService } from './services/user-moderation.service';
import { UserDataService } from './services/user-data.service';
import { SupabaseModule } from '../../common/supabase/supabase.module';
import { SearchModule } from '../search/search.module';
import { MailModule } from '../../mail/mail.module';
import { CompaniesModule } from '../companies/companies.module';
import { AiModule } from '../ai/ai.module';
import { BullModule } from '@nestjs/bullmq';
import { MessagesModule } from '../messages/messages.module';

import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [
    PrismaModule,
    SupabaseModule,
    SearchModule,
    MailModule,
    CompaniesModule,
    AiModule,
    BullModule.registerQueue({ name: 'matching' }),
    forwardRef(() => MessagesModule),
  ],
  providers: [
    UsersService,
    UserCreationService,
    CandidateProfileService,
    UserAvatarService,
    UserModerationService,
    UserDataService,
  ],
  controllers: [UsersController],
  exports: [
    UsersService,
    UserCreationService,
    CandidateProfileService,
    UserAvatarService,
    UserModerationService,
    UserDataService,
  ],
})
export class UsersModule { }
