import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { AuthenticatedUser } from './authenticated-request.interface';
import { DatabaseService } from './database.service';

@Injectable()
export class OptionalJwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly databaseService: DatabaseService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = String(request.headers.authorization || '');

    if (!authHeader.startsWith('Bearer ')) {
      return true;
    }

    const token = authHeader.slice('Bearer '.length).trim();
    if (!token) {
      return true;
    }

    try {
      const payload = this.jwtService.verify(token, {
        secret:
          this.configService.get<string>('JWT_SECRET') ||
          'gearsage-dev-access-secret',
      });

      const userResult = await this.databaseService.query(
        `
        SELECT phone, status, "isAdmin"
        FROM bz_mini_user
        WHERE id = $1
        LIMIT 1
        `,
        [Number(payload.sub)],
      );

      if (!userResult.rows.length || Number(userResult.rows[0].status || 0) === 9) {
        request.user = undefined;
        return true;
      }

      request.user = {
        id: Number(payload.sub),
        phone: String(userResult.rows[0].phone || payload.phone || ''),
        isAdmin: Boolean(userResult.rows[0].isAdmin),
        status: Number(userResult.rows[0].status || 0),
      } as AuthenticatedUser;
    } catch (_error) {
      request.user = undefined;
    }

    return true;
  }
}
