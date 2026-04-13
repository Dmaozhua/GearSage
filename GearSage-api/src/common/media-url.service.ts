import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class MediaUrlService {
  constructor(private readonly configService: ConfigService) {}

  normalizeUrl(value: any) {
    const raw = String(value || '').trim();
    if (!raw) {
      return '';
    }

    const publicBase = this.getPublicUploadBase();
    if (!publicBase) {
      return raw;
    }

    if (raw.startsWith(publicBase)) {
      return raw;
    }

    const localPrefixes = [
      'http://127.0.0.1:3001/uploads',
      'http://localhost:3001/uploads',
      'https://api.gearsage.club/uploads',
      'http://api.gearsage.club/uploads',
    ];

    const matchedPrefix = localPrefixes.find((prefix) => raw.startsWith(prefix));
    if (matchedPrefix) {
      return `${publicBase}${raw.slice(matchedPrefix.length)}`;
    }

    try {
      const parsed = new URL(raw);
      if (
        (parsed.hostname === '127.0.0.1' || parsed.hostname === 'localhost' || parsed.hostname === 'api.gearsage.club') &&
        parsed.pathname.startsWith('/uploads/')
      ) {
        return `${publicBase}${parsed.pathname.slice('/uploads'.length)}`;
      }
    } catch (error) {
      return raw;
    }

    return raw;
  }

  normalizeUrlArray(value: any) {
    if (!Array.isArray(value)) {
      return [];
    }
    return value
      .map((item) => this.normalizeUrl(item))
      .filter((item) => !!item);
  }

  normalizeTopicExtra(value: any) {
    const extra = value && typeof value === 'object' && !Array.isArray(value) ? { ...value } : {};

    if (Array.isArray(extra.contentImages)) {
      extra.contentImages = this.normalizeUrlArray(extra.contentImages);
    }

    if (Array.isArray(extra.receiptImages)) {
      extra.receiptImages = this.normalizeUrlArray(extra.receiptImages);
    }

    if (extra.coverImg !== undefined) {
      extra.coverImg = this.normalizeUrl(extra.coverImg);
    }

    if (extra.verifyImage !== undefined) {
      extra.verifyImage = this.normalizeUrl(extra.verifyImage);
    }

    return extra;
  }

  private getPublicUploadBase() {
    const configuredBaseUrl = String(this.configService.get<string>('UPLOAD_BASE_URL') || '').trim();
    return configuredBaseUrl.replace(/\/+$/, '');
  }
}
