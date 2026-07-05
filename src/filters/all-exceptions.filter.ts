import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from "@nestjs/common";
import { Request, Response } from "express";
import { getRequestDurationMs } from "../logging/correlation-id.store";
import { logEvent } from "../logging/log-event";

const DEFAULT_MESSAGE = "Internal server error";

/**
 * Catch-all fallback: logs every exception that the more specific filters
 * (Prisma, DriverAdapter) don't handle themselves — plain HttpExceptions
 * thrown by guards/pipes/controllers, and truly unexpected errors.
 *
 * It must be the FIRST entry in `globalFilters` (see the comment there for
 * why Nest's internal filter-matching order is reversed relative to
 * registration order) — otherwise it silently swallows every exception
 * before the Prisma/DriverAdapter filters ever see it.
 *
 * It deliberately does NOT extend Nest's `BaseExceptionFilter` — that class
 * relies on `httpAdapterHost` being injected by the DI container, but this
 * app instantiates filters manually (`new AllExceptionsFilter()`) outside
 * of it, matching how the other filters already work. Instead, it
 * reproduces Nest's default response body exactly, so callers see no
 * difference; only the logging is new.
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const httpContext = host.switchToHttp();
    const response = httpContext.getResponse<Response>();
    const request = httpContext.getRequest<Request>();

    const isHttpException = exception instanceof HttpException;
    const statusCode = isHttpException
      ? exception.getStatus()
      : HttpStatus.INTERNAL_SERVER_ERROR;

    this.logException(exception, request, statusCode);

    if (response.headersSent) {
      return response.end();
    }

    const body = isHttpException
      ? this.buildHttpExceptionBody(exception)
      : { statusCode, message: DEFAULT_MESSAGE };

    return response.status(statusCode).json(body);
  }

  private buildHttpExceptionBody(exception: HttpException) {
    const payload = exception.getResponse();

    return typeof payload === "string"
      ? { statusCode: exception.getStatus(), message: payload }
      : payload;
  }

  private logException(
    exception: unknown,
    request: Request,
    statusCode: number,
  ) {
    const error = exception instanceof Error ? exception : undefined;

    const payload = logEvent("error", "http.exception", {
      exceptionName: error?.constructor?.name ?? "UnknownError",
      statusCode,
      message: error?.message ?? String(exception),
      "http.method": request?.method,
      "http.route": request?.route?.path ?? request?.originalUrl,
      durationMs: getRequestDurationMs(),
    });

    // 4xx are expected client errors (validation, not-found, etc.) — logging
    // them as "warn" keeps "error" reserved for what actually pages someone.
    if (statusCode >= HttpStatus.INTERNAL_SERVER_ERROR) {
      this.logger.error(payload, error?.stack);
    } else {
      this.logger.warn(payload);
    }
  }
}
