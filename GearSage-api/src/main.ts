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
    process.env.UPLOAD_DIR || join(__dirname, '..', 'runtime-uploads'),
    {
      prefix: '/uploads/',
    },
  );

  app.useStaticAssets(join(process.cwd(), 'admin-ui'), {
    prefix: '/admin-console/',
  });

  const expressApp = app.getHttpAdapter().getInstance();
  expressApp.get('/admin-console', (_req: any, res: any) => {
    res.redirect('/admin-console/index.html');
  });

  await app.listen(process.env.PORT || 3001, '0.0.0.0');
}
bootstrap();
