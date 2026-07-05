import { Request, Response } from "express";
import { buildAccessLogFields } from "./access-log-fields";

function buildRequest(overrides: Partial<Request> = {}): Request {
  return {
    method: "GET",
    originalUrl: "/api/v1/orcamentos/42",
    path: "/api/v1/orcamentos/42",
    route: undefined,
    headers: {},
    ip: "127.0.0.1",
    protocol: "http",
    httpVersion: "1.1",
    hostname: "localhost",
    socket: { remoteAddress: "127.0.0.1" },
    ...overrides,
  } as unknown as Request;
}

function buildResponse(overrides: Partial<Response> = {}): Response {
  return {
    statusCode: 200,
    getHeader: jest.fn().mockReturnValue(undefined),
    ...overrides,
  } as unknown as Response;
}

describe("buildAccessLogFields", () => {
  it("maps the request/response into OpenTelemetry-flavored attributes", () => {
    const req = buildRequest({
      headers: { "user-agent": "curl/8.0", "content-length": "123" },
    });
    const res = buildResponse({
      statusCode: 201,
      getHeader: jest.fn().mockReturnValue("456"),
    });

    const fields = buildAccessLogFields(req, res, 12.345);

    expect(fields).toEqual({
      "http.method": "GET",
      "http.route": "/api/v1/orcamentos/42",
      "http.status_code": 201,
      "url.path": "/api/v1/orcamentos/42",
      "network.peer.ip": "127.0.0.1",
      "user_agent.original": "curl/8.0",
      "network.protocol.name": "http",
      "network.protocol.version": "1.1",
      "server.address": "localhost",
      "http.request.body.size": 123,
      "http.response.body.size": 456,
      duration_ms: 12.35,
    });
  });

  it("prefers the matched route pattern over the raw path when available", () => {
    const req = buildRequest({
      route: { path: "/api/v1/orcamentos/:id" } as Request["route"],
    });

    const fields = buildAccessLogFields(req, buildResponse(), 1);

    expect(fields["http.route"]).toBe("/api/v1/orcamentos/:id");
  });

  it("extracts the query string separately from the path, only when present", () => {
    const withQuery = buildRequest({
      originalUrl: "/api/v1/orcamentos?status=ativo",
      path: "/api/v1/orcamentos",
    });
    const withoutQuery = buildRequest({
      originalUrl: "/api/v1/orcamentos",
      path: "/api/v1/orcamentos",
    });

    expect(
      buildAccessLogFields(withQuery, buildResponse(), 1)["url.query"],
    ).toBe("status=ativo");
    expect(
      buildAccessLogFields(withoutQuery, buildResponse(), 1),
    ).not.toHaveProperty("url.query");
  });

  it("omits content-length fields entirely when the headers are absent", () => {
    const fields = buildAccessLogFields(buildRequest(), buildResponse(), 1);

    expect(fields).not.toHaveProperty("http.request.body.size");
    expect(fields).not.toHaveProperty("http.response.body.size");
  });

  it("never includes authorization, cookie or other sensitive headers", () => {
    const req = buildRequest({
      headers: {
        authorization: "Bearer secret-token",
        cookie: "session=abc",
        "user-agent": "curl/8.0",
      },
    });

    const fields = buildAccessLogFields(req, buildResponse(), 1);

    expect(JSON.stringify(fields)).not.toContain("secret-token");
    expect(JSON.stringify(fields)).not.toContain("session=abc");
  });
});
