/** Shared validation primitives for validators. */

export class ValidationError extends Error {
  constructor(
    readonly field: string,
    readonly code: string,
  ) {
    super(`${field}:${code}`);
  }
}

export function isEmail(v: unknown): v is string {
  if (typeof v !== 'string') return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}

export function notEmptyString(v: unknown): v is string {
  return typeof v === 'string' && v.trim().length > 0;
}

/** Conservative policy for coursework apps (not exhaustive OWASP guidance). */

export function isStrongPasswordLike(pwd: string): boolean {
  return pwd.length >= 8 && /[a-z]/i.test(pwd) && /[0-9]/.test(pwd);
}
