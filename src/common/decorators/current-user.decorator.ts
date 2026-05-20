import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { JwtPrincipal } from '../../auth/auth.types';

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): JwtPrincipal => {
    const request = ctx.switchToHttp().getRequest<{ user: JwtPrincipal }>();
    return request.user;
  },
);
