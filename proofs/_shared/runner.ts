import { mkdirSync, writeFileSync } from "node:fs";
import { userInfo } from "node:os";
import { join } from "node:path";
import { STEP_IDS, type ProofDefinition, type ProofSetup, type StepId } from "./checklist.ts";
import {
  createContext,
  ProofBlocked,
  ProofFailure,
  type StepRecorder,
  type TermsEvidence,
} from "./context.ts";
import { renderVerified } from "./report.ts";
import type { LatencySummary } from "./timing.ts";

export type StepStatus = "passed" | "failed" | "not_applicable" | "not_run";
export type ProofStatus = "green" | "red" | "blocked" | "incomplete";

export interface StepResult {
  id: StepId;
  status: StepStatus;
  /** Why the step is not applicable or was not run. */
  reason?: string;
  error?: string;
  evidence: string[];
  fixtures: string[];
  latency?: LatencySummary;
  terms?: TermsEvidence;
}

export interface ProofResult {
  service: string;
  title: string;
  apiVersion: string;
  ranAt: string;
  ranBy: string;
  status: ProofStatus;
  blockedReason?: string;
  setupError?: string;
  steps: StepResult[];
}

export interface RunOptions {
  outDir: string;
  /** Run a single point and keep earlier results for the others. */
  only?: StepId;
  previous?: ProofResult;
  now?: () => Date;
  ranBy?: string;
}

// Minimum saved responses per point. A point that saves nothing has proven nothing.
const MIN_FIXTURES: Partial<Record<StepId, number>> = { create: 1, read: 1, remove: 1, errors: 2 };

function validate(id: StepId, recorder: StepRecorder): string | null {
  if (recorder.evidence.length === 0) {
    return "Inget bevis registrerat i steget";
  }
  const minFixtures = MIN_FIXTURES[id] ?? 0;
  if (recorder.fixtures.length < minFixtures) {
    return `Kräver minst ${minFixtures} sparade svar, fick ${recorder.fixtures.length}`;
  }
  if (id === "latency" && recorder.latency === undefined) {
    return "Svarstiden är inte mätt";
  }
  if (id === "terms" && recorder.terms === undefined) {
    return "Villkoren är inte registrerade";
  }
  return null;
}

function toResult(id: StepId, status: StepStatus, recorder: StepRecorder): StepResult {
  return {
    id,
    status,
    evidence: recorder.evidence,
    fixtures: recorder.fixtures,
    ...(recorder.latency ? { latency: recorder.latency } : {}),
    ...(recorder.terms ? { terms: recorder.terms } : {}),
  };
}

function notRun(id: StepId, reason: string): StepResult {
  return { id, status: "not_run", reason, evidence: [], fixtures: [] };
}

function messageOf(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

export function overallStatus(
  steps: readonly StepResult[],
  blockedReason: string | undefined,
  setupError: string | undefined,
): ProofStatus {
  if (setupError !== undefined || steps.some((step) => step.status === "failed")) {
    return "red";
  }
  if (blockedReason !== undefined) {
    return "blocked";
  }
  const allDone = steps.every((s) => s.status === "passed" || s.status === "not_applicable");
  const anyPassed = steps.some((s) => s.status === "passed");
  return allDone && anyPassed ? "green" : "incomplete";
}

export async function runProof(
  definition: ProofDefinition,
  options: RunOptions,
): Promise<ProofResult> {
  const now = options.now ?? (() => new Date());
  const fixturesDir = join(options.outDir, "fixtures");
  const authHeaders = definition.authHeaders ?? (async () => ({}));
  const stepsToRun: readonly StepId[] = options.only ? [options.only] : STEP_IDS;

  const results = new Map<StepId, StepResult>();
  if (options.only && options.previous) {
    for (const step of options.previous.steps) {
      results.set(step.id, step);
    }
  }

  let setup: ProofSetup | undefined;
  let blockedReason: string | undefined;
  let setupError: string | undefined;
  try {
    setup = await definition.setup();
  } catch (error) {
    if (error instanceof ProofBlocked) {
      blockedReason = error.message;
    } else {
      setupError = messageOf(error);
    }
  }

  if (setup) {
    let stopped = false;
    try {
      for (const id of stepsToRun) {
        if (stopped) {
          results.set(id, notRun(id, "Stoppat efter fel i tidigare punkt"));
          continue;
        }
        const spec = definition.steps[id];
        if (typeof spec !== "function") {
          results.set(id, {
            id,
            status: "not_applicable",
            reason: spec.notApplicable,
            evidence: [],
            fixtures: [],
          });
          continue;
        }
        const recorder: StepRecorder = { evidence: [], fixtures: [] };
        const context = createContext({
          baseUrl: setup.baseUrl,
          fixturesDir,
          authHeaders,
          recorder,
        });
        try {
          await spec(context);
          const problem = validate(id, recorder);
          if (problem !== null) {
            throw new ProofFailure(problem);
          }
          results.set(id, toResult(id, "passed", recorder));
        } catch (error) {
          results.set(id, { ...toResult(id, "failed", recorder), error: messageOf(error) });
          // Feasibility protocol: stop at the first failure, never build around it.
          stopped = true;
        }
      }
    } finally {
      await setup.teardown?.();
    }
  }

  const fallbackReason = blockedReason ?? setupError ?? "Ej kört än";
  const steps = STEP_IDS.map((id) => results.get(id) ?? notRun(id, fallbackReason));

  const result: ProofResult = {
    service: definition.service,
    title: definition.title,
    apiVersion: definition.apiVersion,
    ranAt: now().toISOString(),
    ranBy: options.ranBy ?? userInfo().username,
    status: overallStatus(steps, blockedReason, setupError),
    ...(blockedReason !== undefined ? { blockedReason } : {}),
    ...(setupError !== undefined ? { setupError } : {}),
    steps,
  };

  mkdirSync(options.outDir, { recursive: true });
  writeFileSync(
    join(options.outDir, "result.json"),
    `${JSON.stringify(result, null, 2)}\n`,
    "utf8",
  );
  writeFileSync(join(options.outDir, "VERIFIED.md"), renderVerified(result), "utf8");
  return result;
}
