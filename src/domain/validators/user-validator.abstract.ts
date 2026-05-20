import {
  ValidationError,
  isEmail,
  isStrongPasswordLike,
  notEmptyString,
} from './validation-errors';

/** Abstract validator for credentials + basic names. */

export abstract class UserValidatorAbstract {
  protected validateBasics(email: unknown, password: unknown) {
    if (!isEmail(email)) {
      throw new ValidationError('email', 'INVALID_EMAIL');
    }
    const pwd = String(password);
    if (!isStrongPasswordLike(pwd)) {
      throw new ValidationError(
        'password',
        'PASSWORD_TOO_WEAK_USE_8_CHARS_AND_MIX',
      );
    }
  }

  protected validatePersonName(part: unknown, field: string) {
    const s = String(part ?? '').trim();
    if (!notEmptyString(s) || s.length > 120) {
      throw new ValidationError(field, 'INVALID_NAME');
    }
  }

  validateRegisterBase(input: {
    email?: unknown;
    password?: unknown;
    name?: unknown;
    lastname?: unknown;
  }) {
    this.validateBasics(input.email, input.password);
    this.validatePersonName(input.name, 'name');
    this.validatePersonName(input.lastname, 'lastname');
  }
}
