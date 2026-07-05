import { Request, Response } from "express";

/**
 * Attribute names follow OpenTelemetry HTTP semantic conventions
 * (https://opentelemetry.io/docs/specs/semconv/http/) so the same log line
 * reads naturally if these fields are ever promoted to span attributes.
 */
export interface AccessLogFields {
  [attribute: string]: unknown;
  "http.method": string;
  "http.route": string;
  "http.status_code": number;
  "url.path": string;
  "url.query"?: string;
  "network.peer.ip"?: string;
  "user_agent.original"?: string;
  "network.protocol.name": string;
  "network.protocol.version"?: string;
  "server.address"?: string;
  "http.request.body.size"?: number;
  "http.response.body.size"?: number;
  duration_ms: number;
}

export function buildAccessLogFields(
  req: Request,
  res: Response,
  durationMs: number,
): AccessLogFields {
  const queryIndex = req.originalUrl.indexOf("?");
  const requestContentLength = toNumber(req.headers["content-length"]);
  const responseContentLength = toNumber(res.getHeader("content-length"));

  return {
    "http.method": req.method,
    "http.route": req.route?.path ?? req.path,
    "http.status_code": res.statusCode,
    "url.path": req.path,
    ...(queryIndex >= 0
      ? { "url.query": req.originalUrl.slice(queryIndex + 1) }
      : {}),
    "network.peer.ip": req.ip ?? req.socket?.remoteAddress,
    "user_agent.original": req.headers["user-agent"],
    "network.protocol.name": req.protocol,
    "network.protocol.version": req.httpVersion,
    "server.address": req.hostname,
    ...(requestContentLength !== undefined
      ? { "http.request.body.size": requestContentLength }
      : {}),
    ...(responseContentLength !== undefined
      ? { "http.response.body.size": responseContentLength }
      : {}),
    duration_ms: Math.round(durationMs * 100) / 100,
  };
}

function toNumber(value: unknown): number | undefined {
  if (value === undefined) {
    return undefined;
  }

  const raw = Array.isArray(value) ? value[0] : value;
  const parsed = Number(raw);

  return Number.isNaN(parsed) ? undefined : parsed;
}
