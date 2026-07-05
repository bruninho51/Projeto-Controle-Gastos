import { CallHandler, ExecutionContext } from "@nestjs/common";
import { of } from "rxjs";
import { UserContextInterceptor } from "./user-context.interceptor";
import { getUserId, runWithRequestContext } from "./correlation-id.store";

function buildContext(request: unknown): ExecutionContext {
  return {
    switchToHttp: () => ({
      getRequest: () => request,
    }),
  } as unknown as ExecutionContext;
}

function buildCallHandler(): CallHandler {
  return { handle: () => of("result") };
}

describe("UserContextInterceptor", () => {
  const interceptor = new UserContextInterceptor();

  it("enriches the request log context with the authenticated user id", (done) => {
    runWithRequestContext("corr-1", () => {
      const context = buildContext({ user: { id: 42, email: "a@b.com" } });

      interceptor.intercept(context, buildCallHandler()).subscribe(() => {
        expect(getUserId()).toBe(42);
        done();
      });
    });
  });

  it("is a no-op when the route has no authenticated user", (done) => {
    runWithRequestContext("corr-2", () => {
      const context = buildContext({});

      interceptor.intercept(context, buildCallHandler()).subscribe(() => {
        expect(getUserId()).toBeUndefined();
        done();
      });
    });
  });

  it("never throws when there is no request context at all", () => {
    const context = buildContext({ user: { id: 42 } });

    expect(() =>
      interceptor.intercept(context, buildCallHandler()),
    ).not.toThrow();
  });
});
