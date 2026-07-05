import { logEvent } from "./log-event";

describe("logEvent", () => {
  it("builds a structured payload instead of a free-text message", () => {
    expect(logEvent("application", "pix.created", { pixId: 7 })).toEqual({
      type: "application",
      event: "pix.created",
      pixId: 7,
    });
  });

  it("defaults to no extra attributes", () => {
    expect(logEvent("audit", "user.login")).toEqual({
      type: "audit",
      event: "user.login",
    });
  });
});
