import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpStatus,
  Logger,
} from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { Response } from "express";
import { logEvent } from "../logging/log-event";

@Catch(Prisma.PrismaClientKnownRequestError)
export class PrismaClientKnownRequestErrorFilter implements ExceptionFilter {
  private readonly logger = new Logger(
    PrismaClientKnownRequestErrorFilter.name,
  );

  catch(exception: Prisma.PrismaClientKnownRequestError, host: ArgumentsHost) {
    const context = host.switchToHttp();
    const response = context.getResponse<Response>();

    switch (exception.code) {
      case "P2025":
        return this.handleRecordNotFound(response);
      case "P2002":
        return this.handleUniqueConstraintError(exception, response);
      case "P2003":
        return this.handleForeignKeyConstraintFailed(exception, response);
      default:
        return this.handleUnknownError(exception, response);
    }
  }

  private handleRecordNotFound(response: Response) {
    return response
      .status(HttpStatus.NOT_FOUND)
      .json({ message: "Registro não encontrado.", statusCode: 404 });
  }

  private handleUniqueConstraintError(
    exception: Prisma.PrismaClientKnownRequestError,
    response: Response,
  ) {
    const regex = /Unique constraint failed on the constraint: `(.*)`/;
    const match = exception.message.match(regex);

    if (match) {
      const [, constraint] = match;
      if (constraint === "unique_categoria_gasto") {
        return response.status(HttpStatus.CONFLICT).json({
          message: "A categoria já existe. Por favor, escolha outro nome.",
          statusCode: 409,
        });
      }
    }

    return response.status(HttpStatus.CONFLICT).json({
      message: "Violação de restrição única. Verifique os dados inseridos.",
      statusCode: 409,
    });
  }

  private handleForeignKeyConstraintFailed(
    exception: Prisma.PrismaClientKnownRequestError,
    response: Response,
  ) {
    const fieldName = exception.meta?.["field_name"] as string;
    const messages: Record<string, string> = {
      categoria_id: "A categoria informada não foi encontrada.",
      orcamento_id: "O orçamento informado não foi encontrado.",
      investimento_id: "O investimento informado não foi encontrado.",
    };

    const message = messages[fieldName] || "Entidade associada não encontrada.";
    return response.status(HttpStatus.NOT_FOUND).json({ message });
  }

  private handleUnknownError(
    exception: Prisma.PrismaClientKnownRequestError,
    response: Response,
  ) {
    this.logger.error(
      logEvent("error", "prisma.known_request_error.unmapped", {
        code: exception.code,
        message: exception.message,
      }),
      exception.stack,
    );
    return response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      message:
        "Erro interno no servidor. Por favor, tente novamente mais tarde.",
      statusCode: 500,
    });
  }
}
