# Spec: platform

Modul i [CAPABILITY-MAP.md](CAPABILITY-MAP.md). Beror på: inget. Byggs parallellt med `integration-proofs`.

Status: **godkänd av Q** (2026-11-02)

## Objective

Grunden som alla andra moduler står på: kodstruktur, databas, isolering mellan kunder, arbetsflöden som tål krascher, konfiguration, tester och säkerhetskontroller i CI.

**Varför:** stabilitet och säkerhet går inte att lägga till i efterhand. Om isoleringen mellan kunder sitter i databasen från första tabellen kan ingen senare kodändring råka visa en kunds data för en annan. Om varje brief är ett arbetsflöde som sparas steg för steg tappas inget när en server startas om.

**Vem använder den:** utvecklaren (Claude Code med Q) i varje senare modul. Q ser resultatet som ett projekt som startar med ett kommando och ett grönt testresultat.

**Inte i den här modulen:** inloggning, användare och roller (`identity`), affärstabeller som `meeting` och `brief` (respektive modul), drift i Azure (`deploy`).

### Krav

1. **En kodbas, flera paket.** Monorepo med tydliga gränser: `core` får inte importera från `adapters`, `apps` eller `db`. Gränsen kontrolleras automatiskt.
2. **Lokal start med ett kommando.** Postgres med pgvector i Docker, migreringar, påhittad testdata.
3. **Isolering per kund i databasen.** Varje tabell med kunddata har `tenant_id` och tvingande radsäkerhet (RLS). Appen ansluter med en databasroll som inte kan kringgå RLS. Ett test kontrollerar automatiskt att varje sådan tabell har en policy.
4. **Hållbara arbetsflöden.** Gränssnittet `WorkflowEngine` i core. Ett arbetsflöde består av namngivna steg. Varje stegs resultat sparas. Efter krasch fortsätter flödet vid nästa ej klara steg. Ett steg med samma idempotensnyckel körs aldrig två gånger. Motorn (DBOS eller Temporal) väljs i `integration-proofs`. Tills dess finns en testimplementation i minnet.
5. **Typad konfiguration.** Alla miljövariabler valideras vid start. Saknas något stoppar appen med ett tydligt svenskt felmeddelande som säger vilken nyckel som saknas.
6. **Inga nätverksanrop i tester.** Testmiljön blockerar utgående anrop. Ett test som försöker nå internet misslyckas.
7. **Säkerhet i CI:** typkontroll, lint, tester, RLS-test, sökning efter läckta nycklar, sårbarhetsskanning av beroenden, statisk kodanalys.

## Tech Stack

Exakta versioner bestäms när projektet skapas och skrivs in här.

| Del | Val | Notering |
|---|---|---|
| Språk | TypeScript, `strict` | |
| Körmiljö | Node.js aktiv LTS | Kontrolleras vid start |
| Paket | pnpm workspaces | |
| Webb | Next.js (App Router) | Skal i `apps/web`, sidor byggs i senare moduler |
| Databas | PostgreSQL 17 + pgvector | Docker lokalt |
| ORM | Drizzle ORM + drizzle-kit | Migreringar som SQL-filer i git |
| Arbetsflöden | DBOS eller Temporal | Väljs efter bevis (B19) |
| Validering | Zod | Konfiguration och gränssnitt |
| Test | Vitest | |
| Lint/format | ESLint + Prettier | Plus regel för paketgränser |
| CI | GitHub Actions | |
| Nyckelskanning | gitleaks | I CI och pre-commit |
| Sårbarheter | Dependabot + `pnpm audit` | |
| Statisk analys | CodeQL | |

Varje nytt beroende godkänns av Q innan det installeras.

## Commands

```
pnpm install             Installera beroenden
pnpm db:up               Starta Postgres i Docker
pnpm db:migrate          Kör migreringar
pnpm db:seed             Fyll på påhittad testdata (två påhittade kunder)
pnpm db:reset            Töm, migrera och fyll på igen
pnpm dev                 Starta webben lokalt
pnpm test                Kör alla tester
pnpm test:rls            Kör bara isoleringstesterna
pnpm typecheck           Typkontroll i alla paket
pnpm lint                Lint inklusive paketgränser
pnpm check               typecheck + lint + test. Körs före varje commit.
```

## Project Structure

```
apps/
  web/                   Next.js-skal: startsida och hälsokontroll
packages/
  core/                  Domän och gränssnitt (ports). Inga beroenden till andra paket.
    src/ports/           Gränssnitt mot omvärlden: WorkflowEngine, Clock, ...
    src/shared/          Result, felklasser, id-typer
  db/                    Drizzle-schema, migreringar, RLS-policyer, withTenant
    migrations/
    src/schema/
    src/tenant-context.ts
    test/rls/            Isoleringstester
  workflow/              Implementationer av WorkflowEngine (minne nu, DBOS/Temporal sen)
  config/                Zod-schema för miljövariabler
  adapters/              Tomt nu. Fylls av senare moduler.
tools/
  eslint-boundaries/     Regel: core importerar inget annat paket
docker-compose.yml       Postgres 17 + pgvector
.env.example             Alla nycklar med tomma värden
.github/workflows/ci.yml
```

## Code Style

**Gränssnitt i core, implementation utanför.** Core beskriver vad som behövs, inte hur.

```ts
// packages/core/src/ports/workflow-engine.ts
export interface WorkflowEngine {
  start<I, O>(workflow: WorkflowDefinition<I, O>, input: I, key: IdempotencyKey): Promise<WorkflowHandle<O>>;
}

export interface WorkflowDefinition<I, O> {
  name: string;
  run(ctx: WorkflowContext, input: I): Promise<O>;
}

export interface WorkflowContext {
  // The result of each step is persisted; on resume, finished steps return their saved result.
  step<T>(name: string, fn: () => Promise<T>): Promise<T>;
}
```

**Kunden sätts per transaktion, aldrig globalt.**

```ts
// packages/db/src/tenant-context.ts
export async function withTenant<T>(db: Db, tenantId: TenantId, fn: (tx: Tx) => Promise<T>): Promise<T> {
  return db.transaction(async (tx) => {
    await tx.execute(sql`select set_config('app.tenant_id', ${tenantId}, true)`);
    return fn(tx);
  });
}
```

```sql
-- Every table with tenant data gets this pattern.
alter table example enable row level security;
alter table example force row level security;
create policy tenant_isolation on example
  using (tenant_id = current_setting('app.tenant_id', true)::uuid)
  with check (tenant_id = current_setting('app.tenant_id', true)::uuid);
```

**Konventioner:**
- Kod, filnamn, variabler, commits på engelska. Text som användaren ser på svenska, samlad i textfiler, inte hårdkodad i komponenter.
- Filnamn i kebab-case. Namngivna exporter, inga default-exporter.
- Inget `any`. Fel i core returneras som `Result<T, E>`, inte som kastade undantag.
- Id-typer är märkta (`TenantId`, `MeetingId`) så att de inte kan blandas ihop.
- Commit-meddelanden enligt Conventional Commits.

## Testing Strategy

| Nivå | Vad | Var |
|---|---|---|
| Enhet | Logik i core, konfigurationsvalidering | `packages/*/test/unit` |
| Integration | Databas, migreringar, RLS, arbetsflöden mot Postgres i Docker | `packages/db/test`, `packages/workflow/test` |
| Arkitektur | Paketgränser (core importerar inget annat paket) | lint i CI |

**Tester som måste finnas när modulen är klar:**
- **RLS-täckning:** testet listar alla tabeller med kolumnen `tenant_id` och misslyckas om någon saknar tvingande RLS och policy. Nya tabeller fångas automatiskt.
- **RLS-isolering:** två påhittade kunder. Kund A kan inte läsa, ändra eller ta bort kund B:s rader, inte ens med rätt id.
- **RLS utan kontext:** en fråga utan satt kund returnerar noll rader, inte alla.
- **Approll:** appens databasroll saknar `BYPASSRLS` och är inte superanvändare.
- **Arbetsflöde efter krasch:** ett flöde avbryts mitt i steg 2 av 3. Vid omstart körs steg 1 inte igen, steg 2 och 3 körs en gång var.
- **Idempotens:** samma flöde startat två gånger med samma nyckel ger ett resultat och en körning.
- **Konfiguration:** saknad nyckel ger ett tydligt svenskt fel och stoppar starten.
- **Inget nätverk:** ett test som försöker anropa internet misslyckas.

Täckning: minst 85 % av raderna i `core` och `db`. Siffran är ett golv, inte ett mål.

## Boundaries

**Alltid:**
- `tenant_id` och tvingande RLS på varje tabell med kunddata.
- Anslut appen med en roll utan `BYPASSRLS`. Migreringar körs med en separat roll.
- Kör `pnpm check` före varje commit.
- Lägg varje ny miljövariabel i både Zod-schemat och `.env.example`.
- Visa Q resultatet och gör en commit per avslutat steg.

**Fråga först:**
- Varje nytt beroende.
- Schemaändringar utöver det som står i en godkänd spec.
- Ändringar i CI.
- Allt som rör molnet eller kostar pengar.

**Aldrig:**
- Stänga av RLS, även tillfälligt eller i test.
- Ansluta appen som superanvändare.
- Riktig data i seed eller tester.
- Committa `.env`, nycklar eller tokens.
- Ta bort eller hoppa över ett test som fallerar utan Q:s godkännande.
- Låta `core` importera från `adapters`, `db` eller `apps`.

## Success Criteria

- [ ] `git clone` → `pnpm install` → `pnpm db:up` → `pnpm db:migrate` → `pnpm db:seed` → `pnpm dev` fungerar på Q:s Windows-dator, och startsidan visas.
- [ ] `pnpm check` är grönt lokalt och i CI.
- [ ] Alla tester i listan ovan finns och går igenom.
- [ ] CI kör gitleaks, sårbarhetsskanning och CodeQL. En medvetet inlagd falsk nyckel i en testgren stoppas av CI.
- [ ] En import från `adapters` i `core` stoppas av lint.
- [ ] Appen startar inte utan obligatoriska miljövariabler, och felet säger vilken som saknas.
- [ ] `WorkflowEngine` har en testimplementation i minnet. Den riktiga motorn kopplas in när `integration-proofs` har valt DBOS eller Temporal.
- [ ] `CLAUDE.md` har rätt kommandon.

## Open Questions

1. **Node-version:** vilken LTS är aktiv vid start? Bestäms då och låses i `.nvmrc` och `package.json`.
2. **GitHub-repo och Docker Desktop:** finns de? Krävs innan något byggs (M0).
3. **DBOS eller Temporal:** avgörs i `integration-proofs`. Valet påverkar om arbetsflödena kräver en egen server (Temporal) eller bara Postgres (DBOS).
4. **CodeQL i privat repo:** kräver GitHub Advanced Security, som kan kosta. Alternativ: Semgrep. Q bestämmer innan CI byggs.
