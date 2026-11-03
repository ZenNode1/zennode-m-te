import { defineProof } from "../_shared/checklist.ts";
import { ProofFailure, type ProofContext } from "../_shared/context.ts";
import { MOCK_SCOPES, MOCK_TOKEN, startMockServer } from "./mock-server.ts";

/** Creates a fictional item and returns its path. Every step cleans up what it creates. */
async function createItem(ctx: ProofContext): Promise<string> {
  const response = await ctx.call("POST", "/items", { body: { name: "Påhittat Bolag AB" } });
  ctx.expectStatus(response, 201);
  return ctx.expectHeader(response, "location");
}

/**
 * Proves the proof tool itself against a local mock service.
 * Real services follow the same shape in proofs/<service>/proof.ts.
 */
export const proof = defineProof({
  service: "example",
  title: "Låtsastjänst (test av verktyget)",
  apiVersion: "mock-1",

  setup: async () => {
    const server = await startMockServer();
    return { baseUrl: server.baseUrl, teardown: server.close };
  },
  authHeaders: async () => ({ authorization: `Bearer ${MOCK_TOKEN}` }),

  steps: {
    create: async (ctx) => {
      const response = await ctx.call("POST", "/items", { body: { name: "Påhittat Bolag AB" } });
      ctx.expectStatus(response, 201);
      ctx.recordFixture("create-201", response);
      const location = ctx.expectHeader(response, "location");
      const check = await ctx.call("GET", location);
      ctx.expectStatus(check, 200);
      ctx.note(`Resursen syns via GET ${location}`);
      ctx.expectStatus(await ctx.call("DELETE", location), 204);
    },

    read: async (ctx) => {
      const location = await createItem(ctx);
      const response = await ctx.call("GET", location);
      ctx.expectStatus(response, 200);
      ctx.recordFixture("read-200", response);
      ctx.expectStatus(await ctx.call("DELETE", location), 204);
    },

    remove: async (ctx) => {
      const location = await createItem(ctx);
      const removed = await ctx.call("DELETE", location);
      ctx.expectStatus(removed, 204);
      ctx.recordFixture("remove-204", removed);
      const gone = await ctx.call("GET", location);
      ctx.expectStatus(gone, 404);
      ctx.recordFixture("remove-verify-404", gone);
    },

    errors: async (ctx) => {
      const missing = await ctx.call("GET", "/items/does-not-exist");
      ctx.expectStatus(missing, 404);
      ctx.recordFixture("error-404", missing);

      const unauthorized = await ctx.callWithoutAuth("GET", "/me/scopes");
      ctx.expectStatus(unauthorized, 401);
      ctx.recordFixture("error-401", unauthorized);

      const invalid = await ctx.call("POST", "/items", { body: {} });
      ctx.expectStatus(invalid, 422);
      ctx.recordFixture("error-422", invalid);
    },

    scopes: async (ctx) => {
      const response = await ctx.call("GET", "/me/scopes");
      ctx.expectStatus(response, 200);
      ctx.recordFixture("scopes-200", response);
      const granted = (response.body as { scopes: string[] }).scopes;
      for (const scope of MOCK_SCOPES) {
        if (!granted.includes(scope)) {
          throw new ProofFailure(`Behörigheten ${scope} saknas`);
        }
      }
      ctx.note(`Behörigheter bekräftade: ${granted.join(", ")}`);
    },

    headers: async (ctx) => {
      const location = await createItem(ctx);
      ctx.expectHeader(await ctx.call("GET", location), "etag");
      ctx.expectStatus(await ctx.call("DELETE", location), 204);
    },

    limits: async (ctx) => {
      for (let i = 0; i < 10; i += 1) {
        const response = await ctx.call("GET", "/limited");
        if (response.status === 429) {
          ctx.recordFixture("limit-429", response);
          ctx.expectHeader(response, "retry-after");
          ctx.note(`Gränsen nåddes efter ${i} lyckade anrop`);
          return;
        }
      }
      throw new ProofFailure("Ingen hastighetsgräns observerad på 10 anrop");
    },

    latency: async (ctx) => {
      await ctx.measureLatency(20, () => ctx.call("GET", "/me/scopes"));
    },

    terms: async (ctx) => {
      ctx.recordTerms({
        url: "https://example.invalid/terms",
        checkedOn: "2026-11-03",
        trainsOnData: "no",
        region: "lokal dator",
        retention: "ingen lagring",
      });
    },
  },
});
