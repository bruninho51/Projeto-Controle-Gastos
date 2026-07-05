import { Logger } from "@nestjs/common";
import { Request, Response } from "express";
import { HttpLoggerMiddleware } from "./http-logger.middleware";
import { runWithRequestContext } from "./correlation-id.store";

function buildRequest(): Request {
  return {
    method: "GET",
    originalUrl: "/api/v1/orcamentos",
    path: "/api/v1/orcamentos",
    route: undefined,
    headers: {},
    ip: "127.0.0.1",
    protocol: "http",
    httpVersion: "1.1",
    hostname: "localhost",
    socket: { remoteAddress: "127.0.0.1" },
  } as unknown as Request;
}

function buildResponse(): Response {
  const listeners: Record<string, () => void> = {};

  return {
    statusCode: 200,
    getHeader: jest.fn().mockReturnValue(undefined),
    on: jest.fn((event: string, cb: () => void) => {
      listeners[event] = cb;
    }),
    emitFinish: () => listeners.finish?.(),
  } as unknown as Response & { emitFinish: () => void };
}

describe("HttpLoggerMiddleware", () => {
  const middleware = new HttpLoggerMiddleware();

  it("calls next() synchronously regardless of logging", () => {
    const next = jest.fn();

    middleware.use(buildRequest(), buildResponse(), next);

    expect(next).toHaveBeenCalledTimes(1);
  });

  it("logs a structured request.completed access event once the response finishes", () => {
    const logSpy = jest
      .spyOn(Logger.prototype, "log")
      .mockImplementation(() => undefined);
    const req = buildRequest();
    const res = buildResponse() as Response & { emitFinish: () => void };

    runWithRequestContext("corr-1", () => {
      middleware.use(req, res, jest.fn());
      res.emitFinish();
    });

    expect(logSpy).toHaveBeenCalledTimes(1);
    const [payload] = logSpy.mock.calls[0];
    expect(payload).toMatchObject({
      type: "access",
      event: "request.completed",
      "http.method": "GET",
      "http.status_code": 200,
    });
  });
});
