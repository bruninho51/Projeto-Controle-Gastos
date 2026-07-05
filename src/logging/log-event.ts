/**
 * Broad category of a log line, so log backends can filter/route by intent
 * (e.g. ship `access` logs to a different index than `application` ones).
 */
export type LogEventType = "access" | "application" | "error" | "audit";

/**
 * Structured log payload convention: a stable `event` name (e.g.
 * "pix.created", "request.completed") instead of a free-text message, plus
 * whatever typed attributes matter for that event.
 *
 * This is opt-in infrastructure, not a rewrite of every `logger.log(...)`
 * call in the app: adopt it gradually, starting with new/touched code,
 * instead of "Pix criado" prefer:
 *
 *   this.logger.log(logEvent("application", "pix.created", { pixId }));
 */
export interface LogEventPayload {
  type: LogEventType;
  event: string;
  [attribute: string]: unknown;
}

export function logEvent(
  type: LogEventType,
  event: string,
  attributes: Record<string, unknown> = {},
): LogEventPayload {
  return { type, event, ...attributes };
}
