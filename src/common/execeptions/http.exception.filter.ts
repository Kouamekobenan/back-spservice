import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const status = exception.getStatus();

    // getResponse() contient les détails du ValidationPipe (liste des champs invalides)
    const exceptionBody = exception.getResponse();
    let message: string | string[];
    let errors: string[] | undefined;

    if (typeof exceptionBody === 'object' && exceptionBody !== null) {
      const body = exceptionBody as Record<string, any>;
      message = body['message'] ?? exception.message;
      // Si c'est un tableau (erreurs de validation), on expose aussi errors
      if (Array.isArray(message)) {
        errors  = message;
        message = `Validation failed: ${message.join(', ')}`;
      }
    } else {
      message = exception.message;
    }

    const errorResponse = {
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      message,
      ...(errors ? { errors } : {}),
    };

    this.logger.error(
      `HTTP Error: ${JSON.stringify(errorResponse)}`,
      exception.stack,
    );

    response.status(status).json(errorResponse);
  }
}