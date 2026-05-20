import { SetMetadata } from '@nestjs/common';

export type AppPersona = 'admin' | 'student' | 'assistant';

export const ROLES_KEY = 'roles';

export const Roles = (...roles: AppPersona[]) => SetMetadata(ROLES_KEY, roles);
