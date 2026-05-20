import type { AssistantRole } from '@prisma/client';

export interface JwtPrincipal {
  sub: string;
  email: string;
  personas: AppPersonaKind[];
}

export type AppPersonaKind = 'ADMIN' | 'STUDENT' | 'ASSISTANT';

/** Shape stored inside scan QR JWT (no PII embedded). */
export interface ScanJwtPayload {
  cid: string; // attendanceCheckId
}

export interface JwtTokenPairDto {
  accessToken: string;
  refreshToken: string;
}

export interface RegisterAssistantPart {
  role: AssistantRole;
}
