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

@Catch(Prisma.PrismaClientUnknownRequestError)
export class PrismaClientUnknownRequestErrorFilter implements ExceptionFilter {
  private readonly logger = new Logger(
    PrismaClientUnknownRequestErrorFilter.name,
  );

  catch(
    exception: Prisma.PrismaClientUnknownRequestError,
    host: ArgumentsHost,
  ) {
    const context = host.switchToHttp();
    const response = context.getResponse<Response>();

    const regex = /{ code: (\d+), message: "(.*)", state: "(.*)" }/;

    const match = exception.message.match(regex);

    if (match) {
      const [, code, message, state] = match;

      // Tratando erro personalizado de MySQL (estado 45000)
      if (state === "45000") {
        return response.status(HttpStatus.CONFLICT).json({
          message,
          statusCode: 409,
        });
      }

      this.logger.error(
        logEvent("error", "mysql.unknown_request_error", {
          code,
          message,
          state,
        }),
      );
    }

    return response.status(HttpStatus.INTERNAL_SERVER_ERROR).send();
  }
}
