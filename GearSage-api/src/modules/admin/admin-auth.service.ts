import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { randomBytes, scryptSync, timingSafeEqual } from 'crypto';
import { DatabaseService } from '../../common/database.service';
import { AdminLoginDto } from './dto/admin-login.dto';

@Injectable()
export class AdminAuthService {
  private static readonly ACCESS_EXPIRES_IN_SECONDS = 12 * 60 * 60;

  constructor(
    private readonly databaseService: DatabaseService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async login(dto: AdminLoginDto) {
    await this.ensureDefaultAdmin();

    const result = await this.databaseService.query(
      `
      SELECT *
      FROM admin_users
      WHERE username = $1
      LIMIT 1
      `,
      [dto.username.trim()],
    );

    if (!result.rows.length) {
      throw new UnauthorizedException('invalid username or password');
    }

    const admin = result.rows[0];
    if (Number(admin.status || 0) !== 0) {
      throw new UnauthorizedException('admin user disabled');
    }

    if (!this.verifyPassword(dto.password, admin.passwordHash || '')) {
      throw new UnauthorizedException('invalid username or password');
    }

    await this.databaseService.query(
      `
      UPDATE admin_users
      SET "lastLoginAt" = NOW(), "updateTime" = NOW()
      WHERE id = $1
      `,
      [admin.id],
    );

    return {
      token: this.jwtService.sign(
        {
          sub: Number(admin.id),
          username: admin.username,
          role: admin.role || 'super_admin',
        },
        {
          secret:
            this.configService.get<string>('ADMIN_JWT_SECRET') ||
            'gearsage-dev-admin-secret',
          expiresIn: AdminAuthService.ACCESS_EXPIRES_IN_SECONDS,
        },
      ),
      expiresIn: AdminAuthService.ACCESS_EXPIRES_IN_SECONDS,
      adminUser: this.mapAdmin(admin),
    };
  }

  async logout() {
    return { success: true };
  }

  async getMe(adminUserId: number) {
    await this.ensureDefaultAdmin();

    const result = await this.databaseService.query(
      `
      SELECT *
      FROM admin_users
      WHERE id = $1
      LIMIT 1
      `,
      [adminUserId],
    );

    if (!result.rows.length) {
      throw new UnauthorizedException('admin user not found');
    }

    return this.mapAdmin(result.rows[0]);
  }

  private async ensureDefaultAdmin() {
    const username =
      this.configService.get<string>('ADMIN_DEFAULT_USERNAME') || 'admin';
    const password =
      this.configService.get<string>('ADMIN_DEFAULT_PASSWORD') || 'admin123456';

    const existing = await this.databaseService.query(
      `
      SELECT id
      FROM admin_users
      WHERE username = $1
      LIMIT 1
      `,
      [username],
    );

    if (existing.rows.length) {
      return;
    }

    await this.databaseService.query(
      `
      INSERT INTO admin_users
      (username, "passwordHash", status, role, "createTime", "updateTime")
      VALUES
      ($1, $2, 0, 'super_admin', NOW(), NOW())
      `,
      [username, this.hashPassword(password)],
    );
  }

  private hashPassword(password: string) {
    const salt = randomBytes(16).toString('hex');
    const hash = scryptSync(password, salt, 64).toString('hex');
    return `scrypt$${salt}$${hash}`;
  }

  private verifyPassword(password: string, stored: string) {
    const [algorithm, salt, hash] = String(stored || '').split('$');
    if (algorithm !== 'scrypt' || !salt || !hash) {
      return false;
    }

    const derived = scryptSync(password, salt, 64);
    const expected = Buffer.from(hash, 'hex');
    if (derived.length !== expected.length) {
      return false;
    }

    return timingSafeEqual(derived, expected);
  }

  private mapAdmin(row: any) {
    return {
      id: Number(row.id),
      username: row.username || '',
      status: Number(row.status || 0),
      role: row.role || 'super_admin',
      lastLoginAt: row.lastLoginAt || null,
      createTime: row.createTime,
      updateTime: row.updateTime,
    };
  }
}
