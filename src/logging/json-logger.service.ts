import { ConsoleLogger, LOG_LEVELS, LogLevel } from "@nestjs/common";
import { getCorrelationId, getUserId } from "./correlation-id.store";

type JsonLogObjectOptions = {
  context: string;
  logLevel: LogLevel;
  writeStreamType?: "stdout" | "stderr";
  errorStack?: unknown;
};

/**
 * `debug`/`verbose` are excluded by default to keep production output lean
 * (e.g. the opt-in `request.started` event). Override with LOG_LEVELS, a
 * comma-separated list such as "log,warn,error,fatal,debug".
 */
const DEFAULT_LOG_LEVELS: LogLevel[] = ["fatal", "error", "warn", "log"];

function resolveLogLevels(): LogLevel[] {
  const configured = process.env.LOG_LEVELS;

  if (!configured) {
    return DEFAULT_LOG_LEVELS;
  }

  const requested = configured.split(",").map((level) => level.trim());
  const valid = requested.filter((level): level is LogLevel =>
    (LOG_LEVELS as readonly string[]).includes(level),
  );

  return valid.length ? valid : DEFAULT_LOG_LEVELS;
}

export class JsonLogger extends ConsoleLogger {
  constructor() {
    super({ json: true, logLevels: resolveLogLevels() });
  }

  protected getJsonLogObject(message: unknown, options: JsonLogObjectOptions) {
    const logObject = super.getJsonLogObject(message, options);
    const correlationId = getCorrelationId();
    const userId = getUserId();

    return {
      ...logObject,
      ...(correlationId ? { correlationId } : {}),
      ...(userId !== undefined ? { userId } : {}),
    };
  }
}
