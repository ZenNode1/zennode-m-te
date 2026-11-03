import { describe, expect, it } from "vitest";
import { percentile, summarize } from "../_shared/timing.ts";

describe("percentile", () => {
  const oneToTwenty = Array.from({ length: 20 }, (_, i) => i + 1);

  it("uses nearest rank", () => {
    expect(percentile(oneToTwenty, 50)).toBe(10);
    expect(percentile(oneToTwenty, 95)).toBe(19);
    expect(percentile(oneToTwenty, 100)).toBe(20);
  });

  it("rejects an empty list and invalid percentiles", () => {
    expect(() => percentile([], 50)).toThrow();
    expect(() => percentile(oneToTwenty, 0)).toThrow();
    expect(() => percentile(oneToTwenty, 101)).toThrow();
  });
});

describe("summarize", () => {
  it("sorts before computing and rounds to whole milliseconds", () => {
    expect(summarize([30.4, 10.2, 20.6])).toEqual({ samples: 3, p50Ms: 21, p95Ms: 30, maxMs: 30 });
  });
});
