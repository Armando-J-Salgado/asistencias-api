import { ValidationError, notEmptyString } from './validation-errors';

export class GroupValidator {
  validateUpsert(payload: Partial<{ name?: unknown; number?: unknown }>) {
    const name = String(payload.name ?? '').trim();
    if (!notEmptyString(name) || name.length > 160) {
      throw new ValidationError('name', 'INVALID_GROUP_NAME');
    }
    const number = payload.number as number;
    if (typeof number !== 'number' || !Number.isInteger(number) || number < 1) {
      throw new ValidationError('number', 'INVALID_GROUP_NUMBER');
    }
  }
}
