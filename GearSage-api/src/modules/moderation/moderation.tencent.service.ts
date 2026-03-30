import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHash, createHmac, randomUUID } from 'crypto';
import { ModerationDecision, ModerationMetadata, ModerationScene } from './moderation.types';

type TencentTextResponse = {
  Response?: {
    Suggestion?: string;
    Label?: string;
    SubLabel?: string;
    Score?: number;
    Keywords?: string[];
    DetailResults?: Array<{
      Label?: string;
      Suggestion?: string;
      SubLabel?: string;
      Keywords?: string[];
      Score?: number;
    }>;
    RequestId?: string;
    Error?: { Code?: string; Message?: string };
  };
};

type TencentImageResponse = {
  Response?: {
    Suggestion?: string;
    Label?: string;
    SubLabel?: string;
    Score?: number;
    LabelResults?: Array<{
      Scene?: string;
      Label?: string;
      Suggestion?: string;
      SubLabel?: string;
      Score?: number;
    }>;
    RequestId?: string;
    Error?: { Code?: string; Message?: string };
  };
};

@Injectable()
export class ModerationTencentService {
  private readonly logger = new Logger(ModerationTencentService.name);

  private static readonly TEXT_HOST = 'tms.tencentcloudapi.com';
  private static readonly TEXT_SERVICE = 'tms';
  private static readonly TEXT_ACTION = 'TextModeration';
  private static readonly TEXT_VERSION = '2020-12-29';

  private static readonly IMAGE_HOST = 'ims.tencentcloudapi.com';
  private static readonly IMAGE_SERVICE = 'ims';
  private static readonly IMAGE_ACTION = 'ImageModeration';
  private static readonly IMAGE_VERSION = '2020-07-13';

  private static readonly TEXT_BIZ_TYPE_BY_SCENE: Record<ModerationScene, string | null> = {
    comment_content: 'comment_content',
    topic_title: 'topic_publish',
    topic_content: 'topic_publish',
    user_nickname: 'nickname_input',
    user_bio: 'user_bio',
    avatar_image: null,
    background_image: null,
    topic_image: null,
  };

  private static readonly IMAGE_BIZ_TYPE_BY_SCENE: Record<ModerationScene, string | null> = {
    comment_content: null,
    topic_title: null,
    topic_content: null,
    user_nickname: null,
    user_bio: null,
    avatar_image: 'avatar_image',
    background_image: 'background_image',
    topic_image: 'topic_image',
  };

  constructor(private readonly configService: ConfigService) {}

  isConfigured() {
    return !!(
      this.configService.get<string>('TENCENT_MODERATION_SECRET_ID') &&
      this.configService.get<string>('TENCENT_MODERATION_SECRET_KEY')
    );
  }

  async reviewText(
    scene: ModerationScene,
    content: string,
    metadata: ModerationMetadata,
  ): Promise<ModerationDecision> {
    const bizType = this.resolveBizType('text', scene);
    const dataId = this.resolveDataId(metadata);
    const response = await this.request<TencentTextResponse>({
      host: ModerationTencentService.TEXT_HOST,
      service: ModerationTencentService.TEXT_SERVICE,
      action: ModerationTencentService.TEXT_ACTION,
      version: ModerationTencentService.TEXT_VERSION,
      body: {
        Content: Buffer.from(String(content || ''), 'utf8').toString('base64'),
        BizType: bizType,
        DataId: dataId,
        SourceLanguage: 'zh',
        Type: 'TEXT',
      },
    });

    const payload = response.Response || {};
    const detailResults = Array.isArray(payload.DetailResults) ? payload.DetailResults : [];
    return this.mapDecision({
      provider: 'tencent_text',
      suggestion:
        payload.Suggestion ||
        this.pickStrongestSuggestion(
          detailResults.map((item) => String(item.Suggestion || '').trim()),
        ),
      label: payload.Label,
      subLabel: payload.SubLabel,
      score: payload.Score,
      keywords: [
        ...(Array.isArray(payload.Keywords) ? payload.Keywords : []),
        ...detailResults.flatMap((item) =>
          Array.isArray(item.Keywords) ? item.Keywords : [],
        ),
      ],
      detailLabels: detailResults
        .map((item) => String(item.Label || '').trim())
        .filter(Boolean),
      requestId: payload.RequestId,
      raw: {
        scene,
        bizType,
        dataId,
        response,
      },
    });
  }

  async reviewImage(
    scene: ModerationScene,
    fileBuffer: Buffer,
    metadata: ModerationMetadata,
  ): Promise<ModerationDecision> {
    const bizType = this.resolveBizType('image', scene);
    const dataId = this.resolveDataId(metadata);
    const response = await this.request<TencentImageResponse>({
      host: ModerationTencentService.IMAGE_HOST,
      service: ModerationTencentService.IMAGE_SERVICE,
      action: ModerationTencentService.IMAGE_ACTION,
      version: ModerationTencentService.IMAGE_VERSION,
      body: {
        FileContent: fileBuffer.toString('base64'),
        BizType: bizType,
        DataId: dataId,
      },
    });

    const payload = response.Response || {};
    return this.mapDecision({
      provider: 'tencent_image',
      suggestion: payload.Suggestion,
      label: payload.Label,
      subLabel: payload.SubLabel,
      score: payload.Score,
      keywords: [],
      detailLabels: (payload.LabelResults || [])
        .map((item) => String(item.Label || item.Scene || '').trim())
        .filter(Boolean),
      requestId: payload.RequestId,
      raw: {
        scene,
        bizType,
        dataId,
        response,
      },
    });
  }

  private resolveBizType(contentType: 'text' | 'image', scene: ModerationScene) {
    const fixedMap =
      contentType === 'text'
        ? ModerationTencentService.TEXT_BIZ_TYPE_BY_SCENE
        : ModerationTencentService.IMAGE_BIZ_TYPE_BY_SCENE;
    const fixedBizType = fixedMap[scene];
    if (fixedBizType) {
      return fixedBizType;
    }

    this.logger.warn(
      `missing fixed biztype mapping for ${contentType}:${scene}, fallback to TencentCloudDefault`,
    );
    return 'TencentCloudDefault';
  }

  private resolveDataId(metadata: ModerationMetadata) {
    const rawDataId = metadata.dataId ?? metadata.targetId;
    if (rawDataId !== undefined && rawDataId !== null && String(rawDataId).trim()) {
      return String(rawDataId).trim().slice(0, 64);
    }
    return randomUUID().replace(/-/g, '').slice(0, 32);
  }

  private mapDecision(input: {
    provider: string;
    suggestion?: string;
    label?: string;
    subLabel?: string;
    score?: number;
    keywords?: string[];
    detailLabels?: string[];
    requestId?: string;
    raw: Record<string, any>;
  }): ModerationDecision {
    const suggestion = String(input.suggestion || '').trim().toLowerCase();
    const label = String(input.label || '').trim();
    const subLabel = String(input.subLabel || '').trim();
    const keywords = Array.isArray(input.keywords) ? input.keywords.filter(Boolean) : [];
    const detailLabels = Array.isArray(input.detailLabels)
      ? input.detailLabels.filter(Boolean)
      : [];

    let result: ModerationDecision['result'] = 'PASS';
    if (suggestion === 'block') {
      result = 'REJECT';
    } else if (suggestion === 'review') {
      result = 'REVIEW';
    }

    const riskLevelParts = [label, subLabel].filter(Boolean);
    if (typeof input.score === 'number' && Number.isFinite(input.score)) {
      riskLevelParts.push(`score=${input.score}`);
    }

    const riskReasonParts = [
      keywords.length ? `keywords=${keywords.join(',')}` : '',
      label ? `label=${label}` : '',
      subLabel ? `subLabel=${subLabel}` : '',
    ].filter(Boolean);

    return {
      result,
      provider: input.provider,
      riskLevel: riskLevelParts.join('|') || 'normal',
      riskReason: riskReasonParts.join('; ') || 'provider_pass',
      hitLabels: Array.from(new Set([label, ...detailLabels].filter(Boolean))),
      requestId: input.requestId,
      raw: input.raw || {},
    };
  }

  private pickStrongestSuggestion(suggestions: string[]) {
    const normalized = suggestions
      .map((item) => String(item || '').trim().toLowerCase())
      .filter(Boolean);
    if (normalized.includes('block')) {
      return 'Block';
    }
    if (normalized.includes('review')) {
      return 'Review';
    }
    if (normalized.includes('pass')) {
      return 'Pass';
    }
    return '';
  }

  private async request<T>(options: {
    host: string;
    service: string;
    action: string;
    version: string;
    body: Record<string, any>;
  }): Promise<T> {
    const secretId = String(
      this.configService.get<string>('TENCENT_MODERATION_SECRET_ID') || '',
    ).trim();
    const secretKey = String(
      this.configService.get<string>('TENCENT_MODERATION_SECRET_KEY') || '',
    ).trim();
    const region = String(
      this.configService.get<string>('TENCENT_MODERATION_REGION') || 'ap-guangzhou',
    ).trim();

    const payload = JSON.stringify(options.body);
    const timestamp = Math.floor(Date.now() / 1000);
    const date = new Date(timestamp * 1000).toISOString().slice(0, 10);
    const canonicalHeaders =
      `content-type:application/json; charset=utf-8\n` +
      `host:${options.host}\n` +
      `x-tc-action:${options.action.toLowerCase()}\n`;
    const signedHeaders = 'content-type;host;x-tc-action';
    const hashedPayload = this.sha256(payload);
    const canonicalRequest = [
      'POST',
      '/',
      '',
      canonicalHeaders,
      signedHeaders,
      hashedPayload,
    ].join('\n');

    const credentialScope = `${date}/${options.service}/tc3_request`;
    const stringToSign = [
      'TC3-HMAC-SHA256',
      String(timestamp),
      credentialScope,
      this.sha256(canonicalRequest),
    ].join('\n');

    const secretDate = this.hmac(`TC3${secretKey}`, date);
    const secretService = this.hmac(secretDate, options.service);
    const secretSigning = this.hmac(secretService, 'tc3_request');
    const signature = this.hmacHex(secretSigning, stringToSign);

    const finalAuthorization = `TC3-HMAC-SHA256 Credential=${secretId}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;

    const response = await fetch(`https://${options.host}/`, {
      method: 'POST',
      headers: {
        Authorization: finalAuthorization,
        'Content-Type': 'application/json; charset=utf-8',
        Host: options.host,
        'X-TC-Action': options.action,
        'X-TC-Timestamp': String(timestamp),
        'X-TC-Version': options.version,
        'X-TC-Region': region,
      },
      body: payload,
    });

    const json = (await response.json()) as T & {
      Response?: { Error?: { Code?: string; Message?: string } };
    };

    if (!response.ok || json?.Response?.Error) {
      const code = json?.Response?.Error?.Code || `HTTP_${response.status}`;
      const message =
        json?.Response?.Error?.Message || `moderation request failed: ${response.status}`;
      throw new Error(`${code}: ${message}`);
    }

    return json as T;
  }

  private sha256(content: string) {
    return createHash('sha256').update(content, 'utf8').digest('hex');
  }

  private hmac(key: string | Buffer, content: string) {
    return createHmac('sha256', key).update(content, 'utf8').digest();
  }

  private hmacHex(key: string | Buffer, content: string) {
    return createHmac('sha256', key).update(content, 'utf8').digest('hex');
  }
}
