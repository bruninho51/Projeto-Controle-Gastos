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
        return this.handleUniqueConstraintError(exception, response);
        
      default:
        console.error('Erro desconhecido do Prisma:', exception);

        return response
          .status(HttpStatus.INTERNAL_SERVER_ERROR)
          .send();
    }    
  }

  private handleUniqueConstraintError(
    exception: Prisma.PrismaClientKnownRequestError,
    response: Response
  ) {
    const regex = /Unique constraint failed on the constraint: `(.*)`/;
    const match = exception.message.match(regex);

    if (match) {
      const [, constraint] = match;
      if (constraint === 'unique_categoria_gasto') {
        return response.status(HttpStatus.CONFLICT).json({
          message: 'A categoria já existe. Por favor, escolha outro nome.',
        });
      }
    }

    console.error('Erro desconhecido de unique constraint:', exception);

    return response.status(HttpStatus.CONFLICT).send();
  }
}
