import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHash, randomInt } from 'crypto';
import { DatabaseService } from '../../common/database.service';
import { TencentSmsService } from './sms.tencent.service';

type SmsSendContext = {
  requestIp?: string;
  clientId?: string;
};

@Injectable()
export class SmsService {
  private static readonly TEST_CODE = '123456';

  constructor(
    private readonly databaseService: DatabaseService,
    private readonly configService: ConfigService,
    private readonly tencentSmsService: TencentSmsService,
  ) {}

  async sendLoginCode(phone: string, context: SmsSendContext = {}) {
    this.assertPhone(phone);
    await this.expireStaleCodes(phone);
    await this.assertSendQuota(phone);

    const expiresIn = this.getExpiresSeconds();
    const expiresAt = new Date(Date.now() + expiresIn * 1000);
    const isTestMode = this.isTestMode();
    const code = isTestMode ? SmsService.TEST_CODE : this.generateCode();

    let sendChannel = 'test_mode';
    let providerRequestId = '';

    if (!isTestMode) {
      if (!this.tencentSmsService.isConfigured()) {
        throw new BadRequestException('sms provider not configured');
      }
      const sendResult = await this.tencentSmsService.sendLoginCode(phone, code, expiresIn);
      sendChannel = sendResult.channel;
      providerRequestId = sendResult.requestId || '';
    }

    await this.databaseService.query(
      `
      INSERT INTO auth_sms_codes
      (phone, "codeHash", scene, status, "sendChannel", "providerRequestId", "expiredAt", "requestIp", "clientId", "createTime")
      VALUES
      ($1, $2, 'login', 'sent', $3, $4, $5, $6, $7, NOW())
      `,
      [
        phone,
        this.hashCode(phone, code),
        sendChannel,
        providerRequestId,
        expiresAt.toISOString(),
        String(context.requestIp || '').trim().slice(0, 64),
        String(context.clientId || '').trim().slice(0, 64),
      ],
    );

    return {
      phone,
      code: isTestMode ? code : '',
      expiresIn,
      isTestCode: isTestMode,
    };
  }

  async verifyLoginCode(phone: string, code: string) {
    this.assertPhone(phone);
    const normalizedCode = String(code || '').trim();
    if (!/^\d{4,8}$/.test(normalizedCode)) {
      throw new UnauthorizedException('invalid verification code');
    }

    await this.expireStaleCodes(phone);

    const result = await this.databaseService.query(
      `
      SELECT id, "codeHash", "expiredAt", status
      FROM auth_sms_codes
      WHERE phone = $1
        AND scene = 'login'
        AND status = 'sent'
      ORDER BY "createTime" DESC, id DESC
      LIMIT 1
      `,
      [phone],
    );

    if (!result.rows.length) {
      throw new UnauthorizedException('verification code expired');
    }

    const row = result.rows[0];
    if (new Date(row.expiredAt).getTime() <= Date.now()) {
      await this.expireStaleCodes(phone);
      throw new UnauthorizedException('verification code expired');
    }

    if (String(row.codeHash || '') !== this.hashCode(phone, normalizedCode)) {
      throw new UnauthorizedException('invalid verification code');
    }

    await this.databaseService.query(
      `
      UPDATE auth_sms_codes
      SET status = 'used', "usedAt" = NOW()
      WHERE id = $1
      `,
      [row.id],
    );

    return true;
  }

  private async assertSendQuota(phone: string) {
    const intervalSeconds = this.getNumber('SMS_SEND_INTERVAL_SECONDS', 60);
    const hourlyLimit = this.getNumber('SMS_SEND_HOURLY_LIMIT', 5);
    const dailyLimit = this.getNumber('SMS_SEND_DAILY_LIMIT', 10);

    const latestResult = await this.databaseService.query(
      `
      SELECT "createTime"
      FROM auth_sms_codes
      WHERE phone = $1
        AND scene = 'login'
        AND status IN ('sent', 'used', 'expired')
      ORDER BY "createTime" DESC, id DESC
      LIMIT 1
      `,
      [phone],
    );

    if (latestResult.rows.length) {
      const latestTime = new Date(latestResult.rows[0].createTime).getTime();
      if (latestTime + intervalSeconds * 1000 > Date.now()) {
        throw new BadRequestException(`请${intervalSeconds}秒后再试`);
      }
    }

    const hourlyResult = await this.databaseService.query(
      `
      SELECT COUNT(*)::int AS count
      FROM auth_sms_codes
      WHERE phone = $1
        AND scene = 'login'
        AND status IN ('sent', 'used', 'expired')
        AND "createTime" >= NOW() - INTERVAL '1 hour'
      `,
      [phone],
    );

    if (Number(hourlyResult.rows[0]?.count || 0) >= hourlyLimit) {
      throw new BadRequestException('该手机号1小时内发送次数过多，请稍后再试');
    }

    const dailyResult = await this.databaseService.query(
      `
      SELECT COUNT(*)::int AS count
      FROM auth_sms_codes
      WHERE phone = $1
        AND scene = 'login'
        AND status IN ('sent', 'used', 'expired')
        AND "createTime" >= NOW() - INTERVAL '24 hours'
      `,
      [phone],
    );

    if (Number(dailyResult.rows[0]?.count || 0) >= dailyLimit) {
      throw new BadRequestException('该手机号今日发送次数已达上限');
    }
  }

  private async expireStaleCodes(phone: string) {
    await this.databaseService.query(
      `
      UPDATE auth_sms_codes
      SET status = 'expired'
      WHERE phone = $1
        AND scene = 'login'
        AND status = 'sent'
        AND "expiredAt" <= NOW()
      `,
      [phone],
    );
  }

  private assertPhone(phone: string) {
    if (!/^\d{11}$/.test(String(phone || '').trim())) {
      throw new BadRequestException('phone is invalid');
    }
  }

  private getExpiresSeconds() {
    return this.getNumber('SMS_CODE_EXPIRES_SECONDS', 300);
  }

  private isTestMode() {
    return String(this.configService.get<string>('SMS_TEST_MODE') || 'true')
      .trim()
      .toLowerCase() === 'true';
  }

  private generateCode() {
    return String(randomInt(100000, 1000000));
  }

  private hashCode(phone: string, code: string) {
    return createHash('sha256')
      .update(`${String(phone || '').trim()}::${String(code || '').trim()}`, 'utf8')
      .digest('hex');
  }

  private getNumber(key: string, fallback: number) {
    const raw = Number(this.configService.get<string>(key) || fallback);
    return Number.isFinite(raw) && raw > 0 ? raw : fallback;
  }
}
