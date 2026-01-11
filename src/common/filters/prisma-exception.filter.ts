import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';
import { Prisma } from '@prisma/client';

@Catch(Prisma.PrismaClientKnownRequestError)
export class PrismaExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(PrismaExceptionFilter.name);

  catch(exception: Prisma.PrismaClientKnownRequestError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = exception.message;

    switch (exception.code) {
      case 'P2002': // Unique constraint violation
        status = HttpStatus.CONFLICT;
        message = `Unique constraint violation: ${Array.isArray(exception.meta?.target) ? exception.meta.target.join(', ') : 'Record'}`;
        break;
      case 'P2003': // Foreign key constraint violation
        status = HttpStatus.BAD_REQUEST;
        message = `Foreign key constraint failed: ${exception.meta?.field_name || 'Field'}`;
        break;
      case 'P2025': // Record not found
        status = HttpStatus.NOT_FOUND;
        message = 'Record not found';
        break;
      default:
        status = HttpStatus.INTERNAL_SERVER_ERROR;
        message = 'An unexpected database error occurred';
    }

    this.logger.error(
      `Prisma Error: Code ${exception.code}, Message: ${exception.message}`,
    );

    response.status(status).json({
      statusCode: status,
      message: message,
      error: exception.code ? `Prisma ${exception.code}` : 'Database Error',
      timestamp: new Date().toISOString(),
      path: ctx.getRequest().url,
    });
  }
}
