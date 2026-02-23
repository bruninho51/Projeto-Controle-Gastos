import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpStatus,
} from "@nestjs/common";
import { Response } from "express";
import { DriverAdapterError } from "../modules/prisma/prisma.service";

@Catch(DriverAdapterError)
export class DriverAdapterErrorFilter implements ExceptionFilter {
  catch(exception: DriverAdapterError, host: ArgumentsHost) {
    const context = host.switchToHttp();
    const response = context.getResponse<Response>();

    const {
      cause: { code, message, state },
    } = exception;

    // Tratando erro personalizado de MySQL (estado 45000)
    if (state === "45000") {
      return response.status(HttpStatus.CONFLICT).json({
        message,
      });
    }

    console.error(
      "Erro MySQL - Code:",
      code,
      "Message:",
      message,
      "State:",
      state,
    );

    return response.status(HttpStatus.INTERNAL_SERVER_ERROR).send();
  }
}
