import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { summarize, type LatencySummary } from "./timing.ts";

/** A proof step did not get the response it needed. Stops the run. */
export class ProofFailure extends Error {
  override name = "ProofFailure";
}

/** Something Q must arrange is missing (account, key, approval). Nothing is called. */
export class ProofBlocked extends Error {
  override name = "ProofBlocked";
}

export interface RecordedResponse {
  method: string;
  url: string;
  status: number;
  headers: Record<string, string>;
  body: unknown;
  durationMs: number;
}

export interface CallOptions {
  body?: unknown;
  headers?: Record<string, string>;
  query?: Record<string, string>;
}

export interface TermsEvidence {
  url: string;
  checkedOn: string;
  trainsOnData: "no" | "yes" | "unclear";
  region: string;
  retention: string;
  subprocessors?: string;
}

export interface StepRecorder {
  evidence: string[];
  fixtures: string[];
  latency?: LatencySummary;
  terms?: TermsEvidence;
}

export interface ProofContext {
  call(method: string, path: string, options?: CallOptions): Promise<RecordedResponse>;
  callWithoutAuth(method: string, path: string, options?: CallOptions): Promise<RecordedResponse>;
  expectStatus(response: RecordedResponse, expected: number): void;
  /** Returns the header value, or fails the step when it is missing. */
  expectHeader(response: RecordedResponse, name: string): string;
  recordFixture(name: string, response: RecordedResponse): void;
  note(text: string): void;
  measureLatency(samples: number, call: () => Promise<unknown>): Promise<LatencySummary>;
  recordTerms(terms: TermsEvidence): void;
}

export const MIN_LATENCY_SAMPLES = 20;

const TRAINS_LABELS: Record<TermsEvidence["trainsOnData"], string> = {
  no: "nej",
  yes: "JA",
  unclear: "oklart",
};

// Never written to fixtures: they can carry credentials or session state.
const DROPPED_HEADERS = new Set(["set-cookie", "authorization", "cookie", "proxy-authorization"]);
const FIXTURE_NAME = /^[a-z0-9][a-z0-9-]*$/;

function parseBody(text: string, contentType: string | null): unknown {
  if (text === "") {
    return null;
  }
  if (contentType?.includes("json")) {
    try {
      return JSON.parse(text);
    } catch {
      return text;
    }
  }
  return text;
}

export interface ContextOptions {
  baseUrl: string;
  fixturesDir: string;
  authHeaders: () => Promise<Record<string, string>>;
  recorder: StepRecorder;
}

export function createContext(options: ContextOptions): ProofContext {
  const { recorder } = options;

  async function send(
    method: string,
    path: string,
    callOptions: CallOptions,
    withAuth: boolean,
  ): Promise<RecordedResponse> {
    const url = new URL(path, options.baseUrl);
    for (const [key, value] of Object.entries(callOptions.query ?? {})) {
      url.searchParams.set(key, value);
    }
    const headers: Record<string, string> = {
      ...(withAuth ? await options.authHeaders() : {}),
      ...callOptions.headers,
    };
    let body: string | undefined;
    if (callOptions.body !== undefined) {
      body = JSON.stringify(callOptions.body);
      headers["content-type"] ??= "application/json";
    }

    const started = performance.now();
    const response = await fetch(url, { method, headers, ...(body === undefined ? {} : { body }) });
    const text = await response.text();
    const durationMs = Math.round(performance.now() - started);

    const responseHeaders: Record<string, string> = {};
    response.headers.forEach((value, name) => {
      responseHeaders[name] = value;
    });

    return {
      method,
      url: url.pathname + url.search,
      status: response.status,
      headers: responseHeaders,
      body: parseBody(text, response.headers.get("content-type")),
      durationMs,
    };
  }

  return {
    call: (method, path, callOptions = {}) => send(method, path, callOptions, true),
    callWithoutAuth: (method, path, callOptions = {}) => send(method, path, callOptions, false),

    expectStatus(response, expected) {
      if (response.status !== expected) {
        throw new ProofFailure(
          `Väntade status ${expected}, fick ${response.status} för ${response.method} ${response.url}`,
        );
      }
    },

    expectHeader(response, name) {
      const value = response.headers[name.toLowerCase()];
      if (value === undefined) {
        throw new ProofFailure(
          `Headern ${name} saknas i svaret på ${response.method} ${response.url}`,
        );
      }
      recorder.evidence.push(
        `Header \`${name.toLowerCase()}\` finns i ${response.method} ${response.url}`,
      );
      return value;
    },

    recordFixture(name, response) {
      if (!FIXTURE_NAME.test(name)) {
        throw new ProofFailure(`Ogiltigt fixture-namn "${name}". Använd a-z, 0-9 och bindestreck.`);
      }
      const headers = Object.fromEntries(
        Object.entries(response.headers).filter(([key]) => !DROPPED_HEADERS.has(key)),
      );
      const fixture = {
        method: response.method,
        url: response.url,
        status: response.status,
        headers,
        body: response.body,
      };
      mkdirSync(options.fixturesDir, { recursive: true });
      writeFileSync(
        join(options.fixturesDir, `${name}.json`),
        `${JSON.stringify(fixture, null, 2)}\n`,
        "utf8",
      );
      recorder.fixtures.push(name);
      recorder.evidence.push(
        `Sparat svar \`${name}\`: ${response.method} ${response.url} → ${response.status}`,
      );
    },

    note(text) {
      recorder.evidence.push(text);
    },

    async measureLatency(samples, call) {
      if (samples < MIN_LATENCY_SAMPLES) {
        throw new ProofFailure(
          `Svarstid kräver minst ${MIN_LATENCY_SAMPLES} anrop, fick ${samples}`,
        );
      }
      const durations: number[] = [];
      for (let i = 0; i < samples; i += 1) {
        const started = performance.now();
        await call();
        durations.push(performance.now() - started);
      }
      const summary = summarize(durations);
      recorder.latency = summary;
      recorder.evidence.push(
        `Svarstid över ${summary.samples} anrop: p50 ${summary.p50Ms} ms, p95 ${summary.p95Ms} ms, max ${summary.maxMs} ms`,
      );
      return summary;
    },

    recordTerms(terms) {
      recorder.terms = terms;
      recorder.evidence.push(
        `Villkor (${terms.checkedOn}): tränar på data: ${TRAINS_LABELS[terms.trainsOnData]}, region: ${terms.region}, lagring: ${terms.retention}. Källa: ${terms.url}`,
      );
    },
  };
}
