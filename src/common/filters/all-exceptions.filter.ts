import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';
const { INTERNAL_SERVER_ERROR } = HttpStatus;

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status =
      exception.response?.statusCode ??
      exception.statusCode ??
      exception.status ??
      INTERNAL_SERVER_ERROR;

    let message: string;

    if (
      exception.response &&
      Array.isArray(exception.response.message)
    ) {
      message = exception.response.message[0];
    } else if (exception.response?.message) {
      message = exception.response.message;
    } else {
      message = exception.message ?? 'ERROR';
    }

    response.status(status).json({
      success: false,
      statusCode: status,
      message: message,
      data: null,
    });
  }
}
