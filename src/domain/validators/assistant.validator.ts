import type { AssistantRole } from '@prisma/client';
import { UserValidatorAbstract } from './user-validator.abstract';
import { ValidationError } from './validation-errors';

/** Assistant onboarding validation + role enums. */

export class AssistantValidator extends UserValidatorAbstract {
  validateAssistantCreate(input: {
    email?: unknown;
    password?: unknown;
    name?: unknown;
    lastname?: unknown;
    role?: unknown;
  }) {
    this.validateRegisterBase(input);
    if (input.role !== 'AYUDANTE' && input.role !== 'TUTOR') {
      throw new ValidationError('role', 'INVALID_ASSISTANT_ROLE');
    }
  }

  isRole(role: unknown): role is AssistantRole {
    return role === 'AYUDANTE' || role === 'TUTOR';
  }
}
