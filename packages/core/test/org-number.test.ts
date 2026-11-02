import { describe, expect, it } from "vitest";
import { formatOrgNumber } from "../src/index.js";

describe("formatOrgNumber", () => {
  it("formats ten digits with a hyphen", () => {
    expect(formatOrgNumber("5560000000")).toBe("556000-0000");
  });

  it("accepts input that already has a hyphen or spaces", () => {
    expect(formatOrgNumber("556000-0000")).toBe("556000-0000");
    expect(formatOrgNumber(" 556000 0000 ")).toBe("556000-0000");
  });

  it("rejects input without exactly ten digits", () => {
    expect(formatOrgNumber("55600000")).toBeNull();
    expect(formatOrgNumber("55600000001")).toBeNull();
    expect(formatOrgNumber("")).toBeNull();
  });
});
