import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './modules/app/app.controller';
import { DatabaseService } from './common/database.service';
import { TopicController } from './modules/topic/topic.controller';
import { TopicService } from './modules/topic/topic.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
  ],
  controllers: [AppController, TopicController],
  providers: [DatabaseService, TopicService],
})
export class AppModule {}
