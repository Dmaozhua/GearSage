import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  app.enableCors();

  app.useStaticAssets(
    process.env.UPLOAD_DIR || join(process.cwd(), 'runtime-uploads'),
    {
      prefix: '/uploads/',
    },
  );

  await app.listen(process.env.PORT || 3001, '0.0.0.0');
}
bootstrap();
