import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { mkdir, writeFile } from 'fs/promises';
import { extname, join } from 'path';
import { DatabaseService } from '../../common/database.service';

@Injectable()
export class UploadService {
  constructor(
    private readonly configService: ConfigService,
    private readonly databaseService: DatabaseService,
  ) {}

  getUploadDir() {
    return (
      this.configService.get<string>('UPLOAD_DIR') ||
      join(process.cwd(), 'runtime-uploads')
    );
  }

  private normalizeBizType(bizType: string) {
    const rawBizType = String(bizType || '').trim().toLowerCase();
    if (!rawBizType || rawBizType === 'image' || rawBizType === 'post' || rawBizType === 'posts') {
      return 'topic';
    }
    if (rawBizType === 'avatar') {
      return 'avatar';
    }
    if (rawBizType === 'background') {
      return 'background';
    }
    return rawBizType.replace(/[^a-z0-9_-]/g, '') || 'topic';
  }

  private resolvePublicBaseUrl(origin: string) {
    const configuredBaseUrl = String(
      this.configService.get<string>('UPLOAD_BASE_URL') || '',
    ).trim();

    if (configuredBaseUrl) {
      return configuredBaseUrl.replace(/\/+$/, '');
    }

    return `${origin}/uploads`;
  }

  async saveFile(
    userId: number | null,
    bizType: string,
    file: Express.Multer.File,
    origin: string,
  ) {
    const uploadDir = this.getUploadDir();
    const normalizedBizType = this.normalizeBizType(bizType);
    const suffix = extname(file.originalname || '') || '.bin';
    const fileName = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}${suffix}`;
    const objectKey = `${normalizedBizType}/${fileName}`;
    const targetPath = join(uploadDir, objectKey);

    await mkdir(join(uploadDir, normalizedBizType), { recursive: true });
    await writeFile(targetPath, file.buffer);

    const url = `${this.resolvePublicBaseUrl(origin)}/${objectKey}`;

    await this.databaseService.query(
      `
      INSERT INTO media_assets
      ("userId", "bizType", "fileName", "fileExt", "mimeType", "fileSize", "objectKey", url, status, "createTime", "updateTime")
      VALUES
      ($1, $2, $3, $4, $5, $6, $7, $8, 'active', NOW(), NOW())
      `,
      [
        userId,
        normalizedBizType,
        file.originalname || fileName,
        suffix,
        file.mimetype || 'application/octet-stream',
        file.size || 0,
        objectKey,
        url,
      ],
    );

    return {
      fileName,
      objectKey,
      url,
    };
  }
}
