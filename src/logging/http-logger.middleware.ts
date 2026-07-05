import { Injectable, Logger, NestMiddleware } from "@nestjs/common";
import { NextFunction, Request, Response } from "express";
import { buildAccessLogFields } from "./access-log-fields";
import { getRequestDurationMs } from "./correlation-id.store";
import { logEvent } from "./log-event";

@Injectable()
export class HttpLoggerMiddleware implements NestMiddleware {
  private readonly logger = new Logger("HTTP");

  use(req: Request, res: Response, next: NextFunction) {
    // Off by default (LOG_LEVELS excludes "debug"): flip it on only when
    // actively troubleshooting hung/crashed requests, since it doubles the
    // access-log volume for every single request otherwise.
    this.logger.debug(
      logEvent("access", "request.started", {
        "http.method": req.method,
        "http.route": req.route?.path ?? req.path,
      }),
    );

    res.on("finish", () => {
      const durationMs = getRequestDurationMs() ?? 0;

      this.logger.log(
        logEvent(
          "access",
          "request.completed",
          buildAccessLogFields(req, res, durationMs),
        ),
      );
    });

    next();
  }
}
