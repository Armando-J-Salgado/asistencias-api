import { UserValidatorAbstract } from './user-validator.abstract';
import { ValidationError, notEmptyString } from './validation-errors';

/** Student-facing validation for profile payloads. */

export class StudentValidator extends UserValidatorAbstract {
  validateStudentCreate(input: {
    email?: unknown;
    password?: unknown;
    name?: unknown;
    lastname?: unknown;
    idCard?: unknown;
  }) {
    this.validateRegisterBase(input);
    const idCard = String(input.idCard ?? '').trim();
    if (!notEmptyString(idCard) || idCard.length > 64) {
      throw new ValidationError('idCard', 'INVALID_ID_CARD');
    }
  }

  validatePatch(input: Partial<{ name?: unknown; lastname?: unknown }>) {
    if (input.name !== undefined)
      this.validatePersonName(input.name, 'name');
    if (input.lastname !== undefined)
      this.validatePersonName(input.lastname, 'lastname');
  }
}
