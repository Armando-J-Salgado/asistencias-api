import { ValidationError } from './validation-errors';

export class AssistantshipValidator {
  validateCreate(input: {
    date?: unknown;
    startTime?: unknown;
    endTime?: unknown;
  }) {
    const date = input.date instanceof Date ? input.date : new Date(String(input.date));
    if (Number.isNaN(date.valueOf()))
      throw new ValidationError('date', 'INVALID_DATE');

    const st = String(input.startTime ?? '');
    const et = String(input.endTime ?? '');
    if (!/^\d{2}:\d{2}(:\d{2})?$/.test(st) || !/^\d{2}:\d{2}(:\d{2})?$/.test(et)) {
      throw new ValidationError('time', 'INVALID_TIME_FORMAT_EXPECT_HH_MM');
    }
  }
}
