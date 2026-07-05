import { randomUUID } from "node:crypto";
import { NextFunction, Request, Response } from "express";
import { runWithRequestContext } from "./correlation-id.store";

export const CORRELATION_ID_HEADER = "x-correlation-id";

export function correlationIdMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const incoming = req.header(CORRELATION_ID_HEADER);
  const correlationId = incoming?.trim() || randomUUID();

  res.setHeader("X-Correlation-Id", correlationId);

  runWithRequestContext(correlationId, next);
}
