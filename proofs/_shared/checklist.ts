import type { ProofContext } from "./context.ts";

/** The nine points every external service must prove. Order matters: it is the run order. */
export const STEP_IDS = [
  "create",
  "read",
  "remove",
  "errors",
  "scopes",
  "headers",
  "limits",
  "latency",
  "terms",
] as const;

export type StepId = (typeof STEP_IDS)[number];

export const STEP_LABELS: Record<StepId, string> = {
  create: "1. Skapa",
  read: "2. Läsa",
  remove: "3. Ta bort / ångra",
  errors: "4. Felformat",
  scopes: "5. Behörigheter",
  headers: "6. Headers",
  limits: "7. Gränser",
  latency: "8. Svarstid",
  terms: "9. Villkor",
};

export type StepRun = (ctx: ProofContext) => Promise<void>;

/** Used when a point cannot apply, e.g. "create" on a read-only API. The reason is required. */
export interface NotApplicable {
  notApplicable: string;
}

export type StepSpec = StepRun | NotApplicable;

export interface ProofSetup {
  baseUrl: string;
  teardown?: () => Promise<void>;
}

export interface ProofDefinition {
  service: string;
  title: string;
  apiVersion: string;
  /** Reads credentials and returns where to call. Throw ProofBlocked when something Q must arrange is missing. */
  setup: () => Promise<ProofSetup>;
  authHeaders?: () => Promise<Record<string, string>>;
  /** Every point is required by the type, so none can be forgotten. */
  steps: Record<StepId, StepSpec>;
}

export function defineProof(definition: ProofDefinition): ProofDefinition {
  return definition;
}
