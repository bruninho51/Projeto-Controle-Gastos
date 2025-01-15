import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpStatus,
} from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { Response } from "express";

@Catch(Prisma.PrismaClientKnownRequestError)
export class PrismaClientKnownRequestErrorFilter implements ExceptionFilter {
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
      .json({ message: "Registro não encontrado." });
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
        });
      }
    }

    return response.status(HttpStatus.CONFLICT).json({
      message: "Violação de restrição única. Verifique os dados inseridos.",
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
    };

    const message = messages[fieldName] || "Entidade associada não encontrada.";
    return response.status(HttpStatus.NOT_FOUND).json({ message });
  }

  private handleUnknownError(
    exception: Prisma.PrismaClientKnownRequestError,
    response: Response,
  ) {
    console.error("Erro desconhecido do Prisma:", exception);
    return response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      message:
        "Erro interno no servidor. Por favor, tente novamente mais tarde.",
    });
  }
}
