import { AsyncLocalStorage } from "node:async_hooks";

/**
 * Everything a single HTTP request needs to make its way into every log
 * line emitted while it's in flight. Populated once per request by
 * `correlationIdMiddleware` and enriched later (e.g. with `userId`) once
 * more information becomes available (e.g. after auth guards run).
 */
export interface RequestLogContext {
  correlationId: string;
  startTime: bigint;
  userId?: number;
}

export const correlationIdStorage = new AsyncLocalStorage<RequestLogContext>();

export function runWithRequestContext<T>(
  correlationId: string,
  callback: () => T,
): T {
  const context: RequestLogContext = {
    correlationId,
    startTime: process.hrtime.bigint(),
  };

  return correlationIdStorage.run(context, callback);
}

export function getCorrelationId(): string | undefined {
  return correlationIdStorage.getStore()?.correlationId;
}

export function getRequestDurationMs(): number | undefined {
  const startTime = correlationIdStorage.getStore()?.startTime;

  if (startTime === undefined) {
    return undefined;
  }

  return Number(process.hrtime.bigint() - startTime) / 1e6;
}

export function getUserId(): number | undefined {
  return correlationIdStorage.getStore()?.userId;
}

export function setUserId(userId: number): void {
  const store = correlationIdStorage.getStore();

  if (store) {
    store.userId = userId;
  }
}
