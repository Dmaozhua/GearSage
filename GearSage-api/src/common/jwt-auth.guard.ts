import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { AuthenticatedUser } from './authenticated-request.interface';
import { DatabaseService } from './database.service';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly databaseService: DatabaseService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = String(request.headers.authorization || '');

    if (!authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('missing bearer token');
    }

    const token = authHeader.slice('Bearer '.length).trim();
    if (!token) {
      throw new UnauthorizedException('missing bearer token');
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

      if (!userResult.rows.length) {
        throw new UnauthorizedException('user not found');
      }

      const userRow = userResult.rows[0];
      if (Number(userRow.status || 0) === 9) {
        throw new UnauthorizedException('user banned');
      }

      request.user = {
        id: Number(payload.sub),
        phone: String(userRow.phone || payload.phone || ''),
        isAdmin: Boolean(userRow.isAdmin),
        status: Number(userRow.status || 0),
      } as AuthenticatedUser;
      return true;
    } catch (_error) {
      throw new UnauthorizedException('invalid token');
    }
  }
}
