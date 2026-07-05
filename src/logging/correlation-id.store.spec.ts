import {
  getCorrelationId,
  getRequestDurationMs,
  getUserId,
  runWithRequestContext,
  setUserId,
} from "./correlation-id.store";

describe("correlation-id.store", () => {
  it("returns undefined for every accessor outside of a request context", () => {
    expect(getCorrelationId()).toBeUndefined();
    expect(getRequestDurationMs()).toBeUndefined();
    expect(getUserId()).toBeUndefined();
  });

  it("exposes the correlation id set for the current request", () => {
    runWithRequestContext("abc-123", () => {
      expect(getCorrelationId()).toBe("abc-123");
    });
  });

  it("computes a growing duration since the context started", (done) => {
    runWithRequestContext("abc-123", () => {
      setTimeout(() => {
        const durationMs = getRequestDurationMs();

        expect(durationMs).toBeGreaterThanOrEqual(0);
        done();
      }, 5);
    });
  });

  it("lets a later interceptor enrich the context with the authenticated user", () => {
    runWithRequestContext("abc-123", () => {
      expect(getUserId()).toBeUndefined();

      setUserId(42);

      expect(getUserId()).toBe(42);
      expect(getCorrelationId()).toBe("abc-123");
    });
  });

  it("keeps each request's context isolated from the others", async () => {
    const results: Array<string | undefined> = [];

    await Promise.all([
      new Promise<void>((resolve) =>
        runWithRequestContext("request-1", () => {
          setUserId(1);
          setTimeout(() => {
            results.push(`${getCorrelationId()}:${getUserId()}`);
            resolve();
          }, 10);
        }),
      ),
      new Promise<void>((resolve) =>
        runWithRequestContext("request-2", () => {
          setUserId(2);
          setTimeout(() => {
            results.push(`${getCorrelationId()}:${getUserId()}`);
            resolve();
          }, 5);
        }),
      ),
    ]);

    expect(results.sort()).toEqual(["request-1:1", "request-2:2"]);
  });
});
