import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  STEP_IDS,
  defineProof,
  type ProofDefinition,
  type StepSpec,
} from "../_shared/checklist.ts";
import { ProofBlocked } from "../_shared/context.ts";
import { runProof } from "../_shared/runner.ts";
import { proof as exampleProof } from "../example/proof.ts";

const FIXED_NOW = () => new Date("2026-11-03T10:00:00Z");
let outDir: string;

beforeEach(() => {
  outDir = mkdtempSync(join(tmpdir(), "proof-test-"));
});

afterEach(() => {
  rmSync(outDir, { recursive: true, force: true });
});

/** The example proof with some steps replaced. */
function withSteps(steps: Partial<Record<(typeof STEP_IDS)[number], StepSpec>>): ProofDefinition {
  return defineProof({ ...exampleProof, steps: { ...exampleProof.steps, ...steps } });
}

function run(definition: ProofDefinition, extra: Partial<Parameters<typeof runProof>[1]> = {}) {
  return runProof(definition, { outDir, now: FIXED_NOW, ranBy: "test", ...extra });
}

describe("runProof against the mock service", () => {
  it("proves all nine points and turns green", async () => {
    const result = await run(exampleProof);

    expect(result.status).toBe("green");
    expect(result.steps.map((s) => s.id)).toEqual([...STEP_IDS]);
    expect(result.steps.every((s) => s.status === "passed")).toBe(true);
    expect(result.steps.find((s) => s.id === "latency")?.latency?.samples).toBe(20);
  });

  it("writes fixtures, result.json and VERIFIED.md", async () => {
    await run(exampleProof);

    for (const name of ["create-201", "read-200", "error-404", "error-401", "limit-429"]) {
      expect(existsSync(join(outDir, "fixtures", `${name}.json`))).toBe(true);
    }
    expect(existsSync(join(outDir, "result.json"))).toBe(true);
    const verified = readFileSync(join(outDir, "VERIFIED.md"), "utf8");
    expect(verified).toContain("🟢 Grön");
    expect(verified).toContain("9. Villkor");
  });

  it("never writes credentials into fixtures", async () => {
    await run(exampleProof);

    for (const name of ["read-200", "error-401", "scopes-200"]) {
      const fixture = readFileSync(join(outDir, "fixtures", `${name}.json`), "utf8");
      expect(fixture).not.toContain("fictional-test-token");
      expect(fixture.toLowerCase()).not.toContain("authorization");
    }
  });
});

describe("runProof safeguards", () => {
  it("stops at the first failure and marks the rest as not run", async () => {
    const result = await run(
      withSteps({
        read: async (ctx) => {
          ctx.expectStatus(await ctx.call("GET", "/items/does-not-exist"), 200);
        },
      }),
    );

    expect(result.status).toBe("red");
    expect(result.steps.find((s) => s.id === "read")?.status).toBe("failed");
    const after = result.steps.slice(STEP_IDS.indexOf("read") + 1);
    expect(after.every((s) => s.status === "not_run")).toBe(true);
    const verified = readFileSync(join(outDir, "VERIFIED.md"), "utf8");
    expect(verified).toContain("☐ Ej kört");
    expect(verified).toContain("❌ Misslyckad");
  });

  it("fails a step that records no evidence", async () => {
    const result = await run(withSteps({ scopes: async () => {} }));

    const scopes = result.steps.find((s) => s.id === "scopes");
    expect(scopes?.status).toBe("failed");
    expect(scopes?.error).toContain("Inget bevis");
  });

  it("requires at least two saved error responses", async () => {
    const result = await run(
      withSteps({
        errors: async (ctx) => {
          ctx.recordFixture("only-one", await ctx.call("GET", "/items/x"));
        },
      }),
    );

    expect(result.steps.find((s) => s.id === "errors")?.error).toContain("minst 2");
  });

  it("requires at least 20 latency samples", async () => {
    const result = await run(
      withSteps({
        latency: async (ctx) => {
          await ctx.measureLatency(5, () => ctx.call("GET", "/me/scopes"));
        },
      }),
    );

    expect(result.steps.find((s) => s.id === "latency")?.status).toBe("failed");
  });

  it("reports a missing account as blocked without calling anything", async () => {
    let called = false;
    const result = await run(
      defineProof({
        ...exampleProof,
        setup: async () => {
          throw new ProofBlocked("BOLAGSVERKET_CLIENT_ID saknas i .env");
        },
        steps: {
          ...exampleProof.steps,
          read: async () => {
            called = true;
          },
        },
      }),
    );

    expect(called).toBe(false);
    expect(result.status).toBe("blocked");
    expect(result.blockedReason).toContain("BOLAGSVERKET_CLIENT_ID");
    expect(result.steps.every((s) => s.status === "not_run")).toBe(true);
  });

  it("never turns green when every point is marked not applicable", async () => {
    const notApplicable = Object.fromEntries(
      STEP_IDS.map((id) => [id, { notApplicable: "test" }]),
    ) as Record<(typeof STEP_IDS)[number], StepSpec>;
    const result = await run(defineProof({ ...exampleProof, steps: notApplicable }));

    expect(result.status).toBe("incomplete");
  });

  it("runs a single point and keeps earlier results", async () => {
    const first = await run(exampleProof);
    const second = await run(exampleProof, { only: "errors", previous: first });

    expect(second.status).toBe("green");
    expect(second.steps.find((s) => s.id === "read")).toEqual(
      first.steps.find((s) => s.id === "read"),
    );
  });
});
