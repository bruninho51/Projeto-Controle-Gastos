import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpStatus,
  Logger,
} from "@nestjs/common";
import { Response } from "express";
import { DriverAdapterError } from "../modules/prisma/prisma.service";
import { logEvent } from "../logging/log-event";

@Catch(DriverAdapterError)
export class DriverAdapterErrorFilter implements ExceptionFilter {
  private readonly logger = new Logger(DriverAdapterErrorFilter.name);

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
        statusCode: 409,
      });
    }

    this.logger.error(
      logEvent("error", "mysql.driver_adapter_error", { code, message, state }),
    );

    return response.status(HttpStatus.INTERNAL_SERVER_ERROR).send();
  }
}
