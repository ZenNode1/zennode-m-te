import { describe, expect, it } from "vitest";
import { isScannedPath, scanText } from "../_shared/scrub.ts";

// All personal data below is fictional. 121212-1212 is Skatteverket's published test number.

function kinds(text: string): string[] {
  return scanText(text).map((finding) => finding.kind);
}

describe("scanText: e-mail", () => {
  it("flags a personal address", () => {
    expect(kinds('{"email": "anna.test@bolaget.se"}')).toEqual(["email"]);
  });

  it("allows reserved domains and role addresses", () => {
    expect(kinds("kontakt@example.com info@bolaget.se noreply@bolaget.se x@y.test")).toEqual([]);
  });
});

describe("scanText: personnummer", () => {
  it("flags a valid personnummer in 10 and 12 digit form", () => {
    expect(kinds("121212-1212")).toEqual(["personnummer"]);
    expect(kinds("191212121212")).toEqual(["personnummer"]);
  });

  it("flags a samordningsnummer", () => {
    // Day 72 = 12 + 60.
    expect(kinds("121272-1219")).toEqual(["personnummer"]);
  });

  it("ignores organisation numbers and numbers with a bad checksum", () => {
    expect(kinds('"orgNumber": "556000-0000"')).toEqual([]);
    expect(kinds("121212-1213")).toEqual([]);
  });
});

describe("scanText: phone", () => {
  it("flags Swedish phone numbers in common formats", () => {
    expect(kinds("070-123 45 67")).toEqual(["phone"]);
    expect(kinds("+46 8 123 456 78")).toEqual(["phone"]);
  });

  it("ignores dates, times and amounts", () => {
    expect(kinds('"date": "Tue, 03 Nov 2026 08:39:14 GMT"')).toEqual([]);
    expect(kinds('"ranAt": "2026-11-03T08:39:14.000Z"')).toEqual([]);
    expect(kinds('"revenue": 12500000')).toEqual([]);
  });
});

describe("scanText: names", () => {
  it("flags a common first name followed by a surname", () => {
    expect(kinds('"contact": "Anna Testsson"')).toEqual(["name"]);
    expect(kinds("VD: Erik Prov-Exempel")).toEqual(["name"]);
  });

  it("ignores company names and lone first names", () => {
    expect(kinds('"name": "Påhittat Bolag AB"')).toEqual([]);
    expect(kinds("Maria")).toEqual([]);
  });
});

describe("scanText: reporting", () => {
  it("reports the line and never the full value", () => {
    const [finding] = scanText("first line\nsecond: anna.test@bolaget.se");

    expect(finding?.line).toBe(2);
    expect(finding?.masked).not.toContain("bolaget");
  });

  it("respects an allowlist entry", () => {
    const allow = [{ value: "Anna Testsson", reason: "Fiktiv person i testdata" }];

    expect(scanText("Anna Testsson", allow)).toEqual([]);
  });
});

describe("isScannedPath", () => {
  it("covers fixtures and generated reports only", () => {
    expect(isScannedPath("proofs/bolagsverket/fixtures/read-200.json")).toBe(true);
    expect(isScannedPath("proofs\\bolagsverket\\result.json")).toBe(true);
    expect(isScannedPath("proofs/bolagsverket/VERIFIED.md")).toBe(true);
    expect(isScannedPath("proofs/bolagsverket/proof.ts")).toBe(false);
    expect(isScannedPath("docs/07-beslut.md")).toBe(false);
  });
});
