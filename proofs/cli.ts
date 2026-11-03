import { execFileSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { STEP_IDS, STEP_LABELS, type ProofDefinition, type StepId } from "./_shared/checklist.ts";
import { renderStatus } from "./_shared/report.ts";
import { runProof, type ProofResult } from "./_shared/runner.ts";
import { isScannedPath, scanText, type AllowEntry } from "./_shared/scrub.ts";
import { SERVICES } from "./_shared/services.ts";

const proofsDir = dirname(fileURLToPath(import.meta.url));
const rootDir = join(proofsDir, "..");
const EXAMPLE = "example";

function readResult(service: string): ProofResult | undefined {
  const file = join(proofsDir, service, "result.json");
  return existsSync(file) ? (JSON.parse(readFileSync(file, "utf8")) as ProofResult) : undefined;
}

function writeStatus(): string {
  const results = new Map<string, ProofResult>();
  for (const service of SERVICES) {
    const result = readResult(service.id);
    if (result) {
      results.set(service.id, result);
    }
  }
  const file = join(proofsDir, "STATUS.md");
  writeFileSync(file, renderStatus(SERVICES, results, new Date().toISOString()), "utf8");
  return file;
}

function usage(): never {
  const ids = [...SERVICES.map((s) => s.id), EXAMPLE].join(", ");
  console.error(
    `Användning:\n  pnpm proof <tjänst> [--step 1-9]\n  pnpm proof:status\n\nTjänster: ${ids}`,
  );
  process.exit(64);
}

function parseStep(args: readonly string[]): StepId | undefined {
  const index = args.indexOf("--step");
  if (index < 0) {
    return undefined;
  }
  const n = Number(args[index + 1]);
  const id = Number.isInteger(n) ? STEP_IDS[n - 1] : undefined;
  if (id === undefined) {
    console.error("--step måste vara ett tal mellan 1 och 9.");
    process.exit(64);
  }
  return id;
}

async function run(service: string, args: readonly string[]): Promise<number> {
  const known = new Set([...SERVICES.map((s) => s.id), EXAMPLE]);
  if (!known.has(service)) {
    usage();
  }
  const proofFile = join(proofsDir, service, "proof.ts");
  if (!existsSync(proofFile)) {
    console.error(`Inget bevis skrivet för ${service} än (${proofFile}).`);
    return 66;
  }

  // Secrets come from .env, which is never committed.
  const envFile = join(rootDir, ".env");
  if (existsSync(envFile)) {
    process.loadEnvFile(envFile);
  }

  const module = (await import(pathToFileURL(proofFile).href)) as { proof?: ProofDefinition };
  if (!module.proof) {
    console.error(`${proofFile} måste exportera \`proof\`.`);
    return 70;
  }

  const only = parseStep(args);
  const previous = readResult(service);
  const result = await runProof(module.proof, {
    outDir: join(proofsDir, service),
    ...(only ? { only } : {}),
    ...(previous ? { previous } : {}),
  });

  console.log(`\n${result.title}: ${result.status.toUpperCase()}\n`);
  for (const step of result.steps) {
    const detail = step.error ?? step.reason ?? "";
    console.log(
      `  ${step.status.padEnd(15)} ${STEP_LABELS[step.id]}${detail ? `  (${detail})` : ""}`,
    );
  }
  console.log(`\nRapport: ${join(proofsDir, service, "VERIFIED.md")}`);
  if (service !== EXAMPLE) {
    console.log(`Status:  ${writeStatus()}`);
  }
  return result.status === "green" ? 0 : 1;
}

const KIND_LABELS = {
  email: "e-postadress",
  personnummer: "personnummer",
  phone: "telefonnummer",
  name: "namn",
} as const;

function git(args: readonly string[]): string {
  return execFileSync("git", args, { cwd: rootDir, encoding: "utf8" });
}

/** Files to scan: staged proof output (pre-commit) or all proof output on disk. */
function scrubTargets(staged: boolean): { path: string; read: () => string }[] {
  if (staged) {
    return git(["diff", "--cached", "--name-only", "-z", "--diff-filter=ACMR"])
      .split("\0")
      .filter((path) => path !== "" && isScannedPath(path))
      .map((path) => ({ path, read: () => git(["show", `:${path}`]) }));
  }
  return readdirSync(proofsDir, { recursive: true, encoding: "utf8" })
    .map((relative) => `proofs/${relative.replaceAll("\\", "/")}`)
    .filter(isScannedPath)
    .map((path) => ({ path, read: () => readFileSync(join(rootDir, path), "utf8") }));
}

function scrub(staged: boolean): number {
  const allowFile = join(proofsDir, "scrub-allow.json");
  const allow = existsSync(allowFile)
    ? (JSON.parse(readFileSync(allowFile, "utf8")) as AllowEntry[])
    : [];
  const targets = scrubTargets(staged);
  let total = 0;
  for (const target of targets) {
    for (const finding of scanText(target.read(), allow)) {
      total += 1;
      console.error(
        `  ${target.path}:${finding.line}  ${KIND_LABELS[finding.kind]}  ${finding.masked}`,
      );
    }
  }
  if (total > 0) {
    console.error(
      `\nStoppat: ${total} möjliga personuppgifter i bevisfiler. Ta bort dem, eller lägg ett ` +
        `motiverat undantag i proofs/scrub-allow.json om det inte är en person.`,
    );
    return 1;
  }
  console.log(`Inga personuppgifter hittade (${targets.length} filer kontrollerade).`);
  return 0;
}

const [command, service, ...rest] = process.argv.slice(2);
if (command === "status") {
  console.log(`Status: ${writeStatus()}`);
} else if (command === "scrub") {
  process.exitCode = scrub(process.argv.includes("--staged"));
} else if (command === "run" && service) {
  process.exitCode = await run(service, rest);
} else {
  usage();
}
