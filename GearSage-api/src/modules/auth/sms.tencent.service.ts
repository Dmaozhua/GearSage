import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHash, createHmac, randomUUID } from 'crypto';

type TencentSmsResponse = {
  Response?: {
    SendStatusSet?: Array<{
      Code?: string;
      Message?: string;
      SerialNo?: string;
      PhoneNumber?: string;
      Fee?: number;
      SessionContext?: string;
    }>;
    RequestId?: string;
    Error?: { Code?: string; Message?: string };
  };
};

type SmsSendResult = {
  success: boolean;
  provider: 'tencent';
  requestId: string;
  channel: string;
  raw: Record<string, any>;
};

@Injectable()
export class TencentSmsService {
  private static readonly HOST = 'sms.tencentcloudapi.com';
  private static readonly SERVICE = 'sms';
  private static readonly ACTION = 'SendSms';
  private static readonly VERSION = '2021-01-11';

  constructor(private readonly configService: ConfigService) {}

  isConfigured() {
    return !!(
      this.configService.get<string>('TENCENT_SMS_SECRET_ID') &&
      this.configService.get<string>('TENCENT_SMS_SECRET_KEY') &&
      this.configService.get<string>('TENCENT_SMS_SDK_APP_ID') &&
      this.configService.get<string>('TENCENT_SMS_SIGN_NAME') &&
      this.configService.get<string>('TENCENT_SMS_TEMPLATE_ID_LOGIN')
    );
  }

  async sendLoginCode(phone: string, code: string, expiresSeconds: number): Promise<SmsSendResult> {
    const appId = String(this.configService.get<string>('TENCENT_SMS_SDK_APP_ID') || '').trim();
    const signName = String(this.configService.get<string>('TENCENT_SMS_SIGN_NAME') || '').trim();
    const templateId = String(
      this.configService.get<string>('TENCENT_SMS_TEMPLATE_ID_LOGIN') || '',
    ).trim();
    const expiresMinutes = Math.max(1, Math.floor(expiresSeconds / 60)).toString();

    const response = await this.request<TencentSmsResponse>({
      host: TencentSmsService.HOST,
      service: TencentSmsService.SERVICE,
      action: TencentSmsService.ACTION,
      version: TencentSmsService.VERSION,
      body: {
        SmsSdkAppId: appId,
        SignName: signName,
        TemplateId: templateId,
        TemplateParamSet: [String(code || ''), expiresMinutes],
        PhoneNumberSet: [`+86${phone}`],
        SessionContext: randomUUID().replace(/-/g, '').slice(0, 32),
      },
    });

    const payload = response.Response || {};
    const sendStatus = Array.isArray(payload.SendStatusSet) ? payload.SendStatusSet[0] || {} : {};
    const codeValue = String(sendStatus.Code || '').trim();
    if (codeValue && codeValue !== 'Ok') {
      throw new Error(`${codeValue}: ${String(sendStatus.Message || 'sms send failed')}`);
    }

    return {
      success: true,
      provider: 'tencent',
      requestId: String(payload.RequestId || sendStatus.SerialNo || ''),
      channel: 'tencent_sms',
      raw: response,
    };
  }

  private async request<T>(options: {
    host: string;
    service: string;
    action: string;
    version: string;
    body: Record<string, any>;
  }): Promise<T> {
    const secretId = String(this.configService.get<string>('TENCENT_SMS_SECRET_ID') || '').trim();
    const secretKey = String(this.configService.get<string>('TENCENT_SMS_SECRET_KEY') || '').trim();
    const region = String(this.configService.get<string>('TENCENT_SMS_REGION') || 'ap-guangzhou').trim();

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

    const authorization = [
      'TC3-HMAC-SHA256',
      `Credential=${secretId}/${credentialScope}`,
      `SignedHeaders=${signedHeaders}`,
      `Signature=${signature}`,
    ].join(', ');

    const response = await fetch(`https://${options.host}/`, {
      method: 'POST',
      headers: {
        Authorization: authorization,
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
      const message = json?.Response?.Error?.Message || `sms request failed: ${response.status}`;
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
