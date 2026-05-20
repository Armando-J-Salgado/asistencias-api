import { ValidationError } from './validation-errors';

export class SectionValidator {
  validateUpsert(sectionNumber?: unknown) {
    const sn = typeof sectionNumber === 'string' ? parseInt(sectionNumber, 10) : sectionNumber;
    if (
      typeof sn !== 'number' ||
      Number.isNaN(sn) ||
      !Number.isInteger(sn) ||
      sn < 1
    ) {
      throw new ValidationError('sectionNumber', 'INVALID_SECTION_NUMBER');
    }
  }
}
