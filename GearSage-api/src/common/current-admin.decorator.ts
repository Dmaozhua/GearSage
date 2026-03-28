import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { AuthenticatedAdmin } from './authenticated-request.interface';

export const CurrentAdmin = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthenticatedAdmin | undefined => {
    const request = ctx.switchToHttp().getRequest();
    return request.admin;
  },
);
