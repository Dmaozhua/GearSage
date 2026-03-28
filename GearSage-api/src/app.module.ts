import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { AppController } from './modules/app/app.controller';
import { AdminJwtAuthGuard } from './common/admin-jwt-auth.guard';
import { DatabaseService } from './common/database.service';
import { JwtAuthGuard } from './common/jwt-auth.guard';
import { OptionalJwtAuthGuard } from './common/optional-jwt-auth.guard';
import { AdminAuthController } from './modules/admin/admin-auth.controller';
import { AdminAuthService } from './modules/admin/admin-auth.service';
import { AdminLogController } from './modules/admin/admin-log.controller';
import { AdminLogService } from './modules/admin/admin-log.service';
import { AdminReviewController } from './modules/admin/admin-review.controller';
import { AdminReviewService } from './modules/admin/admin-review.service';
import { AdminRuleController } from './modules/admin/admin-rule.controller';
import { AdminRuleService } from './modules/admin/admin-rule.service';
import { AdminUserController } from './modules/admin/admin-user.controller';
import { AdminUserService } from './modules/admin/admin-user.service';
import { AuthController } from './modules/auth/auth.controller';
import { AuthService } from './modules/auth/auth.service';
import { SmsService } from './modules/auth/sms.service';
import { TencentSmsService } from './modules/auth/sms.tencent.service';
import { CommentController } from './modules/comment/comment.controller';
import { CommentService } from './modules/comment/comment.service';
import { GearController } from './modules/gear/gear.controller';
import { GearService } from './modules/gear/gear.service';
import { GoodsController } from './modules/goods/goods.controller';
import { InviteController } from './modules/invite/invite.controller';
import { TaskController } from './modules/task/task.controller';
import { TaskService } from './modules/task/task.service';
import { TagController } from './modules/tag/tag.controller';
import { TagService } from './modules/tag/tag.service';
import { TopicController } from './modules/topic/topic.controller';
import { TopicService } from './modules/topic/topic.service';
import { UploadController } from './modules/upload/upload.controller';
import { UploadService } from './modules/upload/upload.service';
import { UserController } from './modules/user/user.controller';
import { UserService } from './modules/user/user.service';
import { ModerationService } from './modules/moderation/moderation.service';
import { ModerationTencentService } from './modules/moderation/moderation.tencent.service';
import { MessageController } from './modules/message/message.controller';
import { MessageService } from './modules/message/message.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),
    JwtModule.register({}),
  ],
  controllers: [
    AppController,
    AdminAuthController,
    AdminReviewController,
    AdminUserController,
    AdminLogController,
    AdminRuleController,
    AuthController,
    UserController,
    TopicController,
    CommentController,
    UploadController,
    TagController,
    GoodsController,
    GearController,
    TaskController,
    InviteController,
    MessageController,
  ],
  providers: [
    DatabaseService,
    AdminJwtAuthGuard,
    JwtAuthGuard,
    OptionalJwtAuthGuard,
    AdminAuthService,
    AdminReviewService,
    AdminUserService,
    AdminLogService,
    AdminRuleService,
    AuthService,
    SmsService,
    TencentSmsService,
    UserService,
    TopicService,
    CommentService,
    UploadService,
    GearService,
    TagService,
    TaskService,
    ModerationService,
    ModerationTencentService,
    MessageService,
  ],
})
export class AppModule {}
