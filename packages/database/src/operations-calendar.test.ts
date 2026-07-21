import { describe, expect, it } from "vitest";
import { getOperationsCalendarWindow } from "./operations-calendar";

describe("getOperationsCalendarWindow", () => {
  const now = new Date("2026-07-21T14:30:00.000Z");

  it("uses one UTC calendar day for today", () => {
    const window = getOperationsCalendarWindow("today", now);
    expect(window.start.toISOString()).toBe("2026-07-21T00:00:00.000Z");
    expect(window.end.toISOString()).toBe("2026-07-22T00:00:00.000Z");
  });

  it("uses seven days for the weekly view", () => {
    const window = getOperationsCalendarWindow("week", now);
    expect(window.end.toISOString()).toBe("2026-07-28T00:00:00.000Z");
  });

  it("uses a rolling thirty-day monthly view", () => {
    const window = getOperationsCalendarWindow("month", now);
    expect(window.end.toISOString()).toBe("2026-08-20T00:00:00.000Z");
  });
});
