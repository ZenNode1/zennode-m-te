import { STEP_LABELS } from "./checklist.ts";
import type { ProofResult, ProofStatus, StepResult } from "./runner.ts";
import type { ServiceInfo } from "./services.ts";

const STATUS_LABELS: Record<ProofStatus, string> = {
  green: "🟢 Grön",
  red: "🔴 Röd",
  blocked: "⛔ Blockerad",
  incomplete: "🟡 Ofullständig",
};

const dateFormat = new Intl.DateTimeFormat("sv-SE", {
  dateStyle: "short",
  timeStyle: "short",
  timeZone: "Europe/Stockholm",
});

export function formatDate(iso: string): string {
  return dateFormat.format(new Date(iso));
}

function cell(text: string): string {
  return text.replaceAll("|", "\\|").replaceAll("\n", " ");
}

function stepOutcome(step: StepResult): string {
  switch (step.status) {
    case "passed":
      return "✅ Bevisad";
    case "failed":
      return `❌ Misslyckad: ${step.error ?? "okänt fel"}`;
    case "not_applicable":
      return `➖ Ej tillämplig: ${step.reason ?? ""}`;
    case "not_run":
      return `☐ Ej kört: ${step.reason ?? ""}`;
  }
}

export function renderVerified(result: ProofResult): string {
  const lines = [
    `# Bevis: ${result.title}`,
    "",
    "Genererad av `pnpm proof`. Redigera inte för hand.",
    "",
    "| | |",
    "|---|---|",
    `| Tjänst | \`${result.service}\` |`,
    `| Status | ${STATUS_LABELS[result.status]} |`,
    `| Kört | ${formatDate(result.ranAt)} |`,
    `| Kört av | ${cell(result.ranBy)} |`,
    `| API-version | ${cell(result.apiVersion)} |`,
  ];
  if (result.blockedReason !== undefined) {
    lines.push(`| Blockerad av | ${cell(result.blockedReason)} |`);
  }
  if (result.setupError !== undefined) {
    lines.push(`| Fel vid start | ${cell(result.setupError)} |`);
  }
  lines.push("", "## Punkter", "", "| Punkt | Resultat | Bevis |", "|---|---|---|");
  for (const step of result.steps) {
    const evidence = step.evidence.map(cell).join("<br>");
    lines.push(`| ${STEP_LABELS[step.id]} | ${cell(stepOutcome(step))} | ${evidence} |`);
  }
  lines.push("");
  return lines.join("\n");
}

export function renderStatus(
  services: readonly ServiceInfo[],
  results: ReadonlyMap<string, ProofResult>,
  generatedAt: string,
): string {
  const green = services.filter((s) => results.get(s.id)?.status === "green").length;
  const gateOpen = green === services.length;
  const lines = [
    "# Grind 0: status",
    "",
    "Genererad av `pnpm proof:status`. Redigera inte för hand.",
    "",
    `Uppdaterad ${formatDate(generatedAt)}. **${green} av ${services.length} gröna.** Grind 0 är ${gateOpen ? "**öppen**" : "**stängd**"}.`,
    "",
    "| # | Tjänst | Status | Senast kört | Blockeras av / orsak |",
    "|---|---|---|---|---|",
  ];
  for (const service of services) {
    const result = results.get(service.id);
    const status = result ? STATUS_LABELS[result.status] : "☐ Ej startad";
    const ranAt = result ? formatDate(result.ranAt) : "–";
    const failed = result?.steps.find((s) => s.status === "failed");
    const why =
      result?.blockedReason ??
      result?.setupError ??
      (failed ? `${STEP_LABELS[failed.id]}: ${failed.error ?? ""}` : undefined) ??
      (result?.status === "green" ? "–" : service.blockedBy);
    lines.push(
      `| ${service.order} | ${cell(service.title)} | ${status} | ${ranAt} | ${cell(why)} |`,
    );
  }
  lines.push("");
  return lines.join("\n");
}
