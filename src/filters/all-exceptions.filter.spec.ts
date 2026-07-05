import { ArgumentsHost, BadRequestException, Logger } from "@nestjs/common";
import { AllExceptionsFilter } from "./all-exceptions.filter";

function buildHost(request: unknown, response: unknown): ArgumentsHost {
  return {
    switchToHttp: () => ({
      getRequest: () => request,
      getResponse: () => response,
    }),
  } as unknown as ArgumentsHost;
}

function buildResponse() {
  return {
    headersSent: false,
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
    end: jest.fn(),
  };
}

describe("AllExceptionsFilter", () => {
  const filter = new AllExceptionsFilter();

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("reproduces Nest's default response body for a plain HttpException", () => {
    const response = buildResponse();
    const request = { method: "POST", originalUrl: "/api/v1/orcamentos" };
    const exception = new BadRequestException("dados inválidos");

    filter.catch(exception, buildHost(request, response));

    expect(response.status).toHaveBeenCalledWith(400);
    expect(response.json).toHaveBeenCalledWith(exception.getResponse());
  });

  it("returns a generic 500 body for a non-HttpException, without leaking internals", () => {
    const response = buildResponse();
    const request = { method: "GET", originalUrl: "/api/v1/orcamentos" };
    const exception = new Error("connection refused: 10.0.0.5:5432");

    filter.catch(exception, buildHost(request, response));

    expect(response.status).toHaveBeenCalledWith(500);
    expect(response.json).toHaveBeenCalledWith({
      statusCode: 500,
      message: "Internal server error",
    });
  });

  it("does not attempt to write a response when headers were already sent", () => {
    const response = { ...buildResponse(), headersSent: true };
    const request = { method: "GET", originalUrl: "/api/v1/orcamentos" };

    filter.catch(new Error("boom"), buildHost(request, response));

    expect(response.status).not.toHaveBeenCalled();
    expect(response.end).toHaveBeenCalled();
  });

  it("logs 5xx as error (with stack) and 4xx as warn, never duplicating the response", () => {
    const errorSpy = jest
      .spyOn(Logger.prototype, "error")
      .mockImplementation(() => undefined);
    const warnSpy = jest
      .spyOn(Logger.prototype, "warn")
      .mockImplementation(() => undefined);

    const request = { method: "GET", originalUrl: "/api/v1/orcamentos" };

    filter.catch(new Error("unexpected"), buildHost(request, buildResponse()));
    expect(errorSpy).toHaveBeenCalledTimes(1);
    expect(warnSpy).not.toHaveBeenCalled();

    errorSpy.mockClear();
    warnSpy.mockClear();

    filter.catch(
      new BadRequestException("dados inválidos"),
      buildHost(request, buildResponse()),
    );
    expect(warnSpy).toHaveBeenCalledTimes(1);
    expect(errorSpy).not.toHaveBeenCalled();
  });

  it("tags every log payload with the structured error event convention", () => {
    const errorSpy = jest
      .spyOn(Logger.prototype, "error")
      .mockImplementation(() => undefined);
    const request = { method: "GET", originalUrl: "/api/v1/orcamentos" };

    filter.catch(new Error("unexpected"), buildHost(request, buildResponse()));

    const [payload] = errorSpy.mock.calls[0];
    expect(payload).toMatchObject({
      type: "error",
      event: "http.exception",
      exceptionName: "Error",
      statusCode: 500,
    });
  });
});
