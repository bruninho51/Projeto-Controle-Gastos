import { JsonLogger } from "./json-logger.service";
import { runWithRequestContext, setUserId } from "./correlation-id.store";

function captureStdout(run: () => void): Record<string, unknown> {
  const chunks: string[] = [];
  const original = process.stdout.write.bind(process.stdout);
  (process.stdout.write as unknown) = (chunk: string) => {
    chunks.push(chunk);
    return true;
  };

  try {
    run();
  } finally {
    process.stdout.write = original;
  }

  return JSON.parse(chunks.join(""));
}

describe("JsonLogger", () => {
  const originalLogLevels = process.env.LOG_LEVELS;

  afterEach(() => {
    process.env.LOG_LEVELS = originalLogLevels;
  });

  it("prints plain JSON with no correlationId/userId outside a request context", () => {
    const logger = new JsonLogger();

    const line = captureStdout(() => logger.log("bootstrap complete"));

    expect(line).toMatchObject({ level: "log", message: "bootstrap complete" });
    expect(line).not.toHaveProperty("correlationId");
    expect(line).not.toHaveProperty("userId");
  });

  it("attaches the correlationId for logs emitted during a request", () => {
    const logger = new JsonLogger();

    const line = runWithRequestContext("corr-123", () =>
      captureStdout(() => logger.log("handled request")),
    );

    expect(line).toMatchObject({ correlationId: "corr-123" });
  });

  it("attaches the userId only once the request context has been enriched", () => {
    const logger = new JsonLogger();

    const line = runWithRequestContext("corr-123", () => {
      setUserId(99);
      return captureStdout(() => logger.log("authenticated action"));
    });

    expect(line).toMatchObject({ correlationId: "corr-123", userId: 99 });
  });

  it("defaults to excluding debug/verbose noise, keeping error output", () => {
    delete process.env.LOG_LEVELS;
    const logger = new JsonLogger();

    const chunks: string[] = [];
    const original = process.stdout.write.bind(process.stdout);
    (process.stdout.write as unknown) = (chunk: string) => {
      chunks.push(chunk);
      return true;
    };

    try {
      logger.debug("request.started");
      logger.log("request.completed");
    } finally {
      process.stdout.write = original;
    }

    expect(chunks).toHaveLength(1);
    expect(JSON.parse(chunks[0]).message).toBe("request.completed");
  });

  it("respects LOG_LEVELS to opt back into debug output when needed", () => {
    process.env.LOG_LEVELS = "log,debug,warn,error,fatal";
    const logger = new JsonLogger();

    const line = captureStdout(() => logger.debug("request.started"));

    expect(line).toMatchObject({ level: "debug" });
  });
});
