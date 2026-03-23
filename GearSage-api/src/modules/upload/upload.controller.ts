import {
  Controller,
  Post,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { CurrentUser } from '../../common/current-user.decorator';
import { JwtAuthGuard } from '../../common/jwt-auth.guard';
import { UploadService } from './upload.service';

@Controller()
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Post('upload')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('file'))
  async uploadLegacy(
    @CurrentUser() user: { id: number },
    @UploadedFile() file: Express.Multer.File,
    @Req() req: any,
  ) {
    const data = await this.uploadService.saveFile(
      Number(user.id),
      String(req.body?.bizType || 'image'),
      file,
      this.resolveOrigin(req),
    );

    return {
      code: 0,
      message: 'ok',
      data,
    };
  }

  @Post('upload/image')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('file'))
  async uploadImage(
    @CurrentUser() user: { id: number },
    @UploadedFile() file: Express.Multer.File,
    @Req() req: any,
  ) {
    return {
      code: 0,
      message: 'ok',
      data: await this.uploadService.saveFile(
        Number(user.id),
        'image',
        file,
        this.resolveOrigin(req),
      ),
    };
  }

  @Post('upload/avatar')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('file'))
  async uploadAvatar(
    @CurrentUser() user: { id: number },
    @UploadedFile() file: Express.Multer.File,
    @Req() req: any,
  ) {
    return {
      code: 0,
      message: 'ok',
      data: await this.uploadService.saveFile(
        Number(user.id),
        'avatar',
        file,
        this.resolveOrigin(req),
      ),
    };
  }

  @Post('upload/background')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('file'))
  async uploadBackground(
    @CurrentUser() user: { id: number },
    @UploadedFile() file: Express.Multer.File,
    @Req() req: any,
  ) {
    return {
      code: 0,
      message: 'ok',
      data: await this.uploadService.saveFile(
        Number(user.id),
        'background',
        file,
        this.resolveOrigin(req),
      ),
    };
  }

  private resolveOrigin(req: any) {
    const forwardedProto = String(req.headers['x-forwarded-proto'] || '').trim();
    const protocol = forwardedProto || req.protocol || 'http';
    const host = String(req.headers.host || '127.0.0.1:3001');
    return `${protocol}://${host}`;
  }
}
