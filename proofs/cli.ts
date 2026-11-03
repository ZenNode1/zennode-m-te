import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { STEP_IDS, STEP_LABELS, type ProofDefinition, type StepId } from "./_shared/checklist.ts";
import { renderStatus } from "./_shared/report.ts";
import { runProof, type ProofResult } from "./_shared/runner.ts";
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

const [command, service, ...rest] = process.argv.slice(2);
if (command === "status") {
  console.log(`Status: ${writeStatus()}`);
} else if (command === "run" && service) {
  process.exitCode = await run(service, rest);
} else {
  usage();
}
