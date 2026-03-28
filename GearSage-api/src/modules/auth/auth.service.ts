import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { randomBytes } from 'crypto';
import { DatabaseService } from '../../common/database.service';
import { LoginDto } from './dto/login.dto';
import { SmsService } from './sms.service';

type UserRow = {
  id: string | number;
  phone: string;
  nickName: string;
  avatarUrl: string;
  bio: string;
  background: string;
  shipAddress: string;
  status: number;
  points: number;
  level: number;
  inviteCode: string;
  invitedByUserId: string | number | null;
  inviteSuccessCount: number;
  inviteRewardPoints: number;
  isAdmin: boolean;
};

@Injectable()
export class AuthService {
  private static readonly ACCESS_EXPIRES_IN_SECONDS = 2 * 60 * 60;
  private static readonly REFRESH_EXPIRES_IN_SECONDS = 30 * 24 * 60 * 60;
  private static readonly NEW_USER_TEST_POINTS = 10000;

  constructor(
    private readonly databaseService: DatabaseService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly smsService: SmsService,
  ) {}

  async sendCode(phone: string, context?: { requestIp?: string; clientId?: string }) {
    return this.smsService.sendLoginCode(phone, context);
  }

  async login(dto: LoginDto) {
    await this.smsService.verifyLoginCode(dto.phone, dto.code);

    const user = await this.findOrCreateUser(dto);
    this.assertUserActive(user);
    const tokenBundle = await this.issueTokens(Number(user.id), user.phone);
    return {
      token: tokenBundle.accessToken,
      refreshToken: tokenBundle.refreshToken,
      expiresIn: AuthService.ACCESS_EXPIRES_IN_SECONDS,
      userInfo: this.mapUser(user),
    };
  }

  async refresh(refreshToken: string) {
    const tokenRow = await this.databaseService.query(
      `
      SELECT rt.id, rt."userId", rt."expiresAt", rt."revokedAt", u.*
      FROM auth_refresh_tokens rt
      INNER JOIN bz_mini_user u ON u.id = rt."userId"
      WHERE rt.token = $1
      LIMIT 1
      `,
      [refreshToken],
    );

    if (!tokenRow.rows.length) {
      throw new UnauthorizedException('refresh token not found');
    }

    const row = tokenRow.rows[0] as UserRow & {
      expiresAt: string;
      revokedAt: string | null;
    };

    this.assertUserActive(row);

    if (row.revokedAt) {
      throw new UnauthorizedException('refresh token revoked');
    }

    if (new Date(row.expiresAt).getTime() <= Date.now()) {
      throw new UnauthorizedException('refresh token expired');
    }

    await this.databaseService.query(
      `
      UPDATE auth_refresh_tokens
      SET "revokedAt" = NOW(), "updateTime" = NOW()
      WHERE token = $1
      `,
      [refreshToken],
    );

    const tokenBundle = await this.issueTokens(Number(row.id), row.phone);
    return {
      token: tokenBundle.accessToken,
      refreshToken: tokenBundle.refreshToken,
      expiresIn: AuthService.ACCESS_EXPIRES_IN_SECONDS,
      userInfo: this.mapUser(row),
    };
  }

  async logout(refreshToken?: string) {
    if (refreshToken) {
      await this.databaseService.query(
        `
        UPDATE auth_refresh_tokens
        SET "revokedAt" = NOW(), "updateTime" = NOW()
        WHERE token = $1
        `,
        [refreshToken],
      );
    }
    return { success: true };
  }

  async getMe(userId: number) {
    const result = await this.databaseService.query(
      `
      SELECT *
      FROM bz_mini_user
      WHERE id = $1
      LIMIT 1
      `,
      [userId],
    );

    if (!result.rows.length) {
      throw new UnauthorizedException('user not found');
    }

    return this.mapUser(result.rows[0] as UserRow);
  }

  private async findOrCreateUser(dto: LoginDto) {
    const existing = await this.databaseService.query(
      `
      SELECT *
      FROM bz_mini_user
      WHERE phone = $1
      LIMIT 1
      `,
      [dto.phone],
    );

    if (existing.rows.length) {
      return existing.rows[0] as UserRow;
    }

    const inviteCode = this.buildInviteCode(dto.phone);
    const nickName = `钓友${dto.phone.slice(-4)}`;

    const inserted = await this.databaseService.query(
      `
      INSERT INTO bz_mini_user
      (
        phone,
        "nickName",
        "avatarUrl",
        bio,
        background,
        "shipAddress",
        status,
        points,
        level,
        "inviteCode",
        "invitedByUserId",
        "inviteSuccessCount",
        "inviteRewardPoints",
        "inviteRewardCount",
        "isAdmin",
        "createTime",
        "updateTime"
      )
      VALUES
      ($1, $2, '', '', '', '', 0, $4, 1, $3, NULL, 0, 0, 0, FALSE, NOW(), NOW())
      RETURNING *
      `,
      [dto.phone, nickName, inviteCode, AuthService.NEW_USER_TEST_POINTS],
    );

    const user = inserted.rows[0] as UserRow;

    await this.databaseService.query(
      `
      INSERT INTO auth_identities
      ("userId", "identityType", "identityValue", "verifiedAt", "createTime", "updateTime")
      VALUES
      ($1, 'phone', $2, NOW(), NOW(), NOW())
      ON CONFLICT ("identityType", "identityValue")
      DO UPDATE SET "userId" = EXCLUDED."userId", "verifiedAt" = NOW(), "updateTime" = NOW()
      `,
      [user.id, dto.phone],
    );

    await this.tryBindInvite(user, dto);

    return user;
  }

  private async tryBindInvite(user: UserRow, dto: LoginDto) {
    const normalizedInviteCode = String(dto.inviteCode || '').trim().toUpperCase();

    if (!normalizedInviteCode || user.invitedByUserId) {
      return;
    }

    const inviterResult = await this.databaseService.query(
      `
      SELECT id
      FROM bz_mini_user
      WHERE "inviteCode" = $1
        AND id <> $2
      LIMIT 1
      `,
      [normalizedInviteCode, Number(user.id)],
    );

    if (!inviterResult.rows.length) {
      return;
    }

    const inviterId = Number(inviterResult.rows[0].id);

    await this.databaseService.query(
      `
      UPDATE bz_mini_user
      SET
        "invitedByUserId" = $1,
        "updateTime" = NOW()
      WHERE id = $2
      `,
      [inviterId, Number(user.id)],
    );

    await this.databaseService.query(
      `
      UPDATE bz_mini_user
      SET
        "inviteSuccessCount" = "inviteSuccessCount" + 1,
        "inviteRewardCount" = "inviteRewardCount" + 1,
        "updateTime" = NOW()
      WHERE id = $1
      `,
      [inviterId],
    );
  }

  private async issueTokens(userId: number, phone: string) {
    const accessToken = await this.jwtService.signAsync(
      {
        sub: userId,
        phone,
      },
      {
        secret:
          this.configService.get<string>('JWT_SECRET') ||
          'gearsage-dev-access-secret',
        expiresIn: `${AuthService.ACCESS_EXPIRES_IN_SECONDS}s`,
      },
    );

    const refreshToken = randomBytes(32).toString('hex');
    const expiresAt = new Date(
      Date.now() + AuthService.REFRESH_EXPIRES_IN_SECONDS * 1000,
    );

    await this.databaseService.query(
      `
      INSERT INTO auth_refresh_tokens
      ("userId", token, "expiresAt", "createTime", "updateTime")
      VALUES
      ($1, $2, $3, NOW(), NOW())
      `,
      [userId, refreshToken, expiresAt.toISOString()],
    );

    return {
      accessToken,
      refreshToken,
    };
  }

  private assertUserActive(user: UserRow) {
    if (Number(user.status || 0) === 9) {
      throw new UnauthorizedException('user banned');
    }
  }

  private mapUser(row: UserRow) {
    return {
      id: Number(row.id),
      phone: row.phone || '',
      nickName: row.nickName || '',
      nickname: row.nickName || '',
      avatarUrl: row.avatarUrl || '',
      avatar: row.avatarUrl || '',
      bio: row.bio || '',
      background: row.background || '',
      backgroundImage: row.background || '',
      shipAddress: row.shipAddress || '',
      status: Number(row.status || 0),
      points: Number(row.points || 0),
      level: Number(row.level || 1),
      inviteCode: row.inviteCode || '',
      invitedByUserId: row.invitedByUserId ? Number(row.invitedByUserId) : null,
      inviteSuccessCount: Number(row.inviteSuccessCount || 0),
      inviteRewardPoints: Number(row.inviteRewardPoints || 0),
      isAdmin: Boolean(row.isAdmin),
    };
  }

  private buildInviteCode(phone: string) {
    return `GS${phone.slice(-6)}`.toUpperCase();
  }
}
