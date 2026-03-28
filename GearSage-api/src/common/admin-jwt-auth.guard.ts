import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { AuthenticatedAdmin } from './authenticated-request.interface';

@Injectable()
export class AdminJwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
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
          this.configService.get<string>('ADMIN_JWT_SECRET') ||
          'gearsage-dev-admin-secret',
      });

      request.admin = {
        id: Number(payload.sub),
        username: String(payload.username || ''),
        role: String(payload.role || 'super_admin'),
      } as AuthenticatedAdmin;

      return true;
    } catch (_error) {
      throw new UnauthorizedException('invalid token');
    }
  }
}
