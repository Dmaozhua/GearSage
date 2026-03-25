import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { AppController } from './modules/app/app.controller';
import { DatabaseService } from './common/database.service';
import { JwtAuthGuard } from './common/jwt-auth.guard';
import { OptionalJwtAuthGuard } from './common/optional-jwt-auth.guard';
import { AuthController } from './modules/auth/auth.controller';
import { AuthService } from './modules/auth/auth.service';
import { CommentController } from './modules/comment/comment.controller';
import { CommentService } from './modules/comment/comment.service';
import { GoodsController } from './modules/goods/goods.controller';
import { InviteController } from './modules/invite/invite.controller';
import { TaskController } from './modules/task/task.controller';
import { TagController } from './modules/tag/tag.controller';
import { TagService } from './modules/tag/tag.service';
import { TopicController } from './modules/topic/topic.controller';
import { TopicService } from './modules/topic/topic.service';
import { UploadController } from './modules/upload/upload.controller';
import { UploadService } from './modules/upload/upload.service';
import { UserController } from './modules/user/user.controller';
import { UserService } from './modules/user/user.service';

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
    AuthController,
    UserController,
    TopicController,
    CommentController,
    UploadController,
    TagController,
    GoodsController,
    TaskController,
    InviteController,
  ],
  providers: [
    DatabaseService,
    JwtAuthGuard,
    OptionalJwtAuthGuard,
    AuthService,
    UserService,
    TopicService,
    CommentService,
    UploadService,
    TagService,
  ],
})
export class AppModule {}
