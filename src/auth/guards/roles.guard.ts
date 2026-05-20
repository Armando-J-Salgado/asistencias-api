import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import {
  ROLES_KEY,
  type AppPersona,
} from '../../common/decorators/roles.decorator';
import type { JwtPrincipal } from '../auth.types';

function hasPersona(
  personas: JwtPrincipal['personas'],
  persona: AppPersona,
): boolean {
  switch (persona) {
    case 'admin':
      return personas.includes('ADMIN');
    case 'student':
      return personas.includes('STUDENT');
    case 'assistant':
      return personas.includes('ASSISTANT');
    default:
      return false;
  }
}

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const roles = this.reflector.getAllAndOverride<AppPersona[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!roles?.length) {
      return true;
    }

    const request = context.switchToHttp().getRequest<{ user: JwtPrincipal }>();
    const personas = request.user?.personas ?? [];

    const ok = roles.some((required) => hasPersona(personas, required));
    if (!ok) {
      throw new ForbiddenException('Insufficient permissions');
    }
    return true;
  }
}
