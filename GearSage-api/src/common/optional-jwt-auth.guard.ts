import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { AuthenticatedUser } from './authenticated-request.interface';

@Injectable()
export class OptionalJwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
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
      request.user = {
        id: Number(payload.sub),
        phone: String(payload.phone || ''),
      } as AuthenticatedUser;
    } catch (_error) {
      request.user = undefined;
    }

    return true;
  }
}
