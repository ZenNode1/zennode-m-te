import { describe, expect, it } from "vitest";
import { renderStatus } from "../_shared/report.ts";
import type { ProofResult } from "../_shared/runner.ts";
import { SERVICES } from "../_shared/services.ts";

const NOW = "2026-11-03T10:00:00Z";

describe("renderStatus", () => {
  it("lists all 16 services as not started when nothing has run", () => {
    const status = renderStatus(SERVICES, new Map(), NOW);

    expect(SERVICES).toHaveLength(16);
    for (const service of SERVICES) {
      expect(status).toContain(service.title);
    }
    expect(status.match(/☐ Ej startad/g)).toHaveLength(16);
    expect(status).toContain("0 av 16 gröna");
    expect(status).toContain("**stängd**");
  });

  it("shows why a service is blocked", () => {
    const blocked: ProofResult = {
      service: "bolagsverket",
      title: "Bolagsverket",
      apiVersion: "v1",
      ranAt: NOW,
      ranBy: "test",
      status: "blocked",
      blockedReason: "BOLAGSVERKET_CLIENT_ID saknas i .env",
      steps: [],
    };
    const status = renderStatus(SERVICES, new Map([["bolagsverket", blocked]]), NOW);

    expect(status).toContain("⛔ Blockerad");
    expect(status).toContain("BOLAGSVERKET_CLIENT_ID saknas i .env");
  });
});
