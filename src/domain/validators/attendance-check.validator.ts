import { ValidationError, notEmptyString } from './validation-errors';

export class AttendanceCheckValidator {
  validateScanJwtContainsCheckId(cid: unknown) {
    if (!notEmptyString(cid)) {
      throw new ValidationError('token', 'INVALID_SCAN_TOKEN_PAYLOAD');
    }
  }
}
