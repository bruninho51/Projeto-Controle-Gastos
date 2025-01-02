import { ExceptionFilter, Catch, ArgumentsHost, HttpStatus } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Response } from 'express';

@Catch(Prisma.PrismaClientKnownRequestError)
export class PrismaClientKnownRequestErrorFilter implements ExceptionFilter {
  catch(exception: Prisma.PrismaClientKnownRequestError, host: ArgumentsHost) {
    const context = host.switchToHttp();
    const response = context.getResponse<Response>();

    switch (exception.code) {
      case 'P2025': // "An operation failed because it depends on one or more records that were required but not found. {cause}"
        return response
        .status(HttpStatus.NOT_FOUND)
        .send();
      case 'P2002': // "Unique constraint failed on the {constraint}"
        return response
        .status(HttpStatus.CONFLICT)
        .send();
      default:
        console.error(exception);

        return response
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .send();
    }    
  }
}
