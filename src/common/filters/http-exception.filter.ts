import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import type { Response } from 'express';
import { ValidationError } from '../../domain/validators/validation-errors';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    if (exception instanceof ValidationError) {

      response.status(400).json({
        statusCode: 400,
        message: 'Validation failed',

        errors: [{ field: exception.field, code: exception.code }],
        timestamp: new Date().toISOString(),
      });


      return;
    }

    let status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string | string[] | Record<string, unknown> =
      exception instanceof HttpException
        ? (exception.getResponse() as Record<string, unknown>)
        : { message: 'Internal server error' };

    const body =
      typeof message === 'object' &&
      message !== null &&
      !(message instanceof String)
        ? (message as Record<string, unknown>)
        : { message };

    response.status(status).json({
      statusCode: status,
      ...body,
      timestamp: new Date().toISOString(),
    });
  }
}
