# Todo: integration-proofs + platform

Plan: [plan.md](plan.md). Status: **godkänd av Q** (2026-11-02).

Varje uppgift avslutas med: tester gröna, Q har sett resultatet, commit, `docs/06-plan.md` uppdaterad.

---

## Fas 0

### T0: Q startar det som tar längst tid
**Vem:** Q. Claude gör inget av detta.
**Beskrivning:** Skicka ansökan om API-åtkomst till Bolagsverket direkt. Börja ordna övriga konton enligt tabellen "Vad Q behöver ordna" i SPEC-integration-proofs.md.
**Acceptans:**
- [ ] Ansökan till Bolagsverket skickad, datum noterat i `docs/06-plan.md`
- [ ] Beslut om Microsoft-testmiljö taget
**Beroenden:** inga

---

## Fas 1: Miljö och skelett

### T1: Flytta projektet, skapa git-repo och första commit
**Beskrivning:** Kopiera projektet från OneDrive till vald plats. Initiera git, lägg till `.gitignore` (med `.env`, `node_modules`), committa dokumentationen. Koppla till Q:s privata GitHub-repo.
**Acceptans:**
- [x] Projektet ligger utanför OneDrive och originalet finns kvar tills Q bekräftar
- [x] `git log` visar en första commit med dokumentationen
- [x] `.env` är ignorerad
**Verifiering:** `git status` rent, `git check-ignore .env` svarar `.env`. Q ser repot på GitHub.
**Beroenden:** inga (GitHub-repo från Q)
**Filer:** `.gitignore`
**Storlek:** XS

### T2: Installera pnpm och Docker Desktop
**Beskrivning:** Claude aktiverar pnpm via Corepack efter Q:s ok. Q installerar Docker Desktop.
**Acceptans:**
- [x] `pnpm --version` svarar
- [ ] `docker run --rm hello-world` fungerar
**Beroenden:** inga
**Storlek:** XS

### T3: Monorepo-skelett
**Beskrivning:** Rot-`package.json`, `pnpm-workspace.yaml`, gemensam `tsconfig` med `strict`, Vitest, ESLint, Prettier, `.nvmrc`, `.env.example`. Skriptet `pnpm check` kör typecheck, lint och test.
**Acceptans:**
- [ ] `pnpm install` och `pnpm check` går igenom på ett tomt projekt med ett exempeltest
- [ ] Node-version låst i `.nvmrc` och `package.json`
**Verifiering:** `pnpm check`
**Beroenden:** T1, T2
**Filer:** `package.json`, `pnpm-workspace.yaml`, `tsconfig.base.json`, `vitest.config.ts`, `eslint.config.js`, `.nvmrc`
**Storlek:** M

### Checkpoint A
- [ ] `pnpm check` grönt
- [ ] Q har sett det
- [ ] Commit finns

---

## Fas 2: Testverktyget

### T4: Testverktyg för tjänster
**Beskrivning:** `proofs/_shared/` med `defineProof`, de nio punkterna som typ, inspelning av svar (body, status, headers) till fixtures, tidtagning (p50/p95), generering av `VERIFIED.md` och `proofs/STATUS.md`. Kommandona `pnpm proof <tjänst>` och `pnpm proof:status`.
**Acceptans:**
- [ ] Ett exempelbevis mot en lokal låtsastjänst går igenom alla nio punkter
- [ ] En punkt utan körning visas som `☐` med orsak, aldrig som grön
- [ ] `STATUS.md` genereras med alla 16 tjänster
**Verifiering:** `pnpm test proofs`, `pnpm proof example`, öppna `proofs/STATUS.md`
**Beroenden:** T3
**Filer:** `proofs/_shared/checklist.ts`, `record.ts`, `timing.ts`, `report.ts`, `proofs/run.ts`
**Storlek:** M

### T5: Kontroll av personuppgifter i fixtures
**Beskrivning:** `pnpm proof:scrub` letar efter e-post, personnummer, telefonnummer och vanliga svenska namn i fixtures. Körs automatiskt före commit.
**Acceptans:**
- [ ] En fixture med påhittad e-postadress stoppar committen
- [ ] En ren fixture går igenom
**Verifiering:** `pnpm test proofs/_shared/scrub`, prova en commit med smutsig fixture
**Beroenden:** T4
**Filer:** `proofs/_shared/scrub.ts`, pre-commit-konfiguration
**Storlek:** S

### Checkpoint B
- [ ] Verktyget klarar alla nio punkter mot låtsastjänsten
- [ ] Scrub stoppar personuppgifter
- [ ] Q har sett `STATUS.md`

---

## Fas 3: Grunden

### T6: Konfiguration och nätverksspärr i tester
**Beskrivning:** `packages/config` med Zod-schema för miljövariabler. Global testsetup som blockerar utgående nätverk.
**Acceptans:**
- [ ] Saknad nyckel ger ett svenskt fel som namnger nyckeln och stoppar starten
- [ ] Ett test som anropar internet misslyckas
**Verifiering:** `pnpm test packages/config`
**Beroenden:** T3
**Filer:** `packages/config/src/env.ts`, `test/setup-no-network.ts`
**Storlek:** S

### T7: Databas
**Beskrivning:** `docker-compose.yml` med Postgres 17 + pgvector. Drizzle och drizzle-kit. Två roller: `migrator` (äger schemat) och `app` (utan `BYPASSRLS`, inte superanvändare). Tabellen `tenant`. Seed med två påhittade kunder.
**Acceptans:**
- [ ] `pnpm db:up`, `db:migrate`, `db:seed`, `db:reset` fungerar
- [ ] Appens roll saknar `BYPASSRLS` (test)
**Verifiering:** `pnpm test packages/db`
**Beroenden:** T2, T6
**Filer:** `docker-compose.yml`, `packages/db/src/schema/tenant.ts`, `migrations/`, `seed.ts`
**Storlek:** M

### T8: Kundisolering (RLS)
**Beskrivning:** `withTenant`, RLS-mönstret och de fyra RLS-testerna i platform-specen. En exempeltabell med `tenant_id` bevisar mönstret.
**Acceptans:**
- [ ] Täckningstestet misslyckas om en tabell med `tenant_id` saknar policy
- [ ] Kund A kan inte läsa, ändra eller ta bort kund B:s rader
- [ ] Fråga utan satt kund ger noll rader
**Verifiering:** `pnpm test:rls`
**Beroenden:** T7
**Filer:** `packages/db/src/tenant-context.ts`, `migrations/`, `packages/db/test/rls/*.test.ts`
**Storlek:** M

### T9: Core-grund och paketgränser
**Beskrivning:** `packages/core` med `Result`, märkta id-typer och felklasser. Lint-regel som stoppar import från `adapters`, `db` och `apps` i core.
**Acceptans:**
- [ ] En import från `adapters` i core stoppas av `pnpm lint`
- [ ] `TenantId` och `MeetingId` kan inte blandas (typtest)
**Verifiering:** `pnpm check`
**Beroenden:** T3
**Filer:** `packages/core/src/shared/result.ts`, `ids.ts`, `errors.ts`, `tools/eslint-boundaries/`
**Storlek:** S

### T10: Arbetsflöden mot gränssnitt
**Beskrivning:** `WorkflowEngine` i core. Implementation i minnet i `packages/workflow`. Gemensam testsvit som senare körs mot den riktiga motorn.
**Acceptans:**
- [ ] Flöde avbrutet i steg 2 av 3 fortsätter utan att köra steg 1 igen
- [ ] Samma nyckel två gånger ger en körning
- [ ] Testsviten är skriven så att den kan köras mot valfri implementation
**Verifiering:** `pnpm test packages/workflow`
**Beroenden:** T9
**Filer:** `packages/core/src/ports/workflow-engine.ts`, `packages/workflow/src/in-memory.ts`, `packages/workflow/test/contract.ts`
**Storlek:** M

### T11: Webbskal
**Beskrivning:** Next.js i `apps/web` med svensk startsida och `/api/health` som kontrollerar databasen.
**Acceptans:**
- [ ] `pnpm dev` visar startsidan
- [ ] `/api/health` svarar 200 med databasen uppe och 503 utan
**Verifiering:** `pnpm dev`, öppna sidan, stoppa databasen och kontrollera 503
**Beroenden:** T7
**Filer:** `apps/web/`
**Storlek:** S

### T12: CI
**Beskrivning:** GitHub Actions kör `pnpm check` och RLS-tester mot Postgres. gitleaks, Dependabot, `pnpm audit` och statisk analys (CodeQL eller Semgrep enligt Q:s val).
**Acceptans:**
- [ ] CI grönt på huvudgrenen
- [ ] En falsk nyckel i en testgren stoppas
**Verifiering:** öppna en testgren med falsk nyckel, se CI fallera, ta bort grenen
**Beroenden:** T8, T10, T11, Q:s val av statisk analys
**Filer:** `.github/workflows/ci.yml`, `.github/dependabot.yml`, `.gitleaks.toml`
**Storlek:** M

### Checkpoint C
- [ ] Platform-specens framgångskriterier uppfyllda, utom riktig arbetsflödesmotor
- [ ] Q har sett startsidan, ett grönt CI och ett stoppat nyckelläckage

---

## Fas 4: Skarpa tester av tjänster

En uppgift per tjänst. Varje uppgift: skriv `proofs/<tjänst>/proof.ts`, kör alla nio punkter mot riktig tjänst med Q:s ok, spara fixtures, fyll `VERIFIED.md`. Om ett test misslyckas: stoppa och rapportera till Q, bygg ingen omväg.

**Gemensam acceptans:** punkt 1–9 bevisade eller motiverat ej tillämpliga, scrub ren, inga kvarlämnade resurser.
**Gemensam verifiering:** `pnpm proof <tjänst>`, `pnpm proof:scrub`, `pnpm proof:status`.

| # | Tjänst | Blockeras av (Q) | Klar |
|---|---|---|---|
| P1 | Bolagsverket, värdefulla datamängder | Godkänd ansökan | ☐ |
| P2 | Microsoft Graph, kalender och ändringsnotiser | Microsoft-testmiljö, appregistrering | ☐ |
| P3 | Outlook-tillägg (nya, webb, klassiska) | Microsoft-testmiljö | ☐ |
| P4 | AWS Bedrock EU, huvud- och reservmodell | AWS-konto, modellåtkomst | ☐ |
| P5 | CRM, läsning | Val av CRM, sandlådekonto | ☐ |
| P6 | Microsoft Graph, mejl | Microsoft-testmiljö | ☐ |
| P7 | Teams, leverans | Microsoft-testmiljö | ☐ |
| P8 | Entra ID, inloggning och SCIM | Microsoft-testmiljö | ☐ |
| P9 | DBOS mot Temporal | T10 klar | ☐ |
| P10 | SCB företagsregister | SCB-åtkomst | ☐ |
| P11 | JobTech JobSearch | – | ☐ |
| P12 | Brave Search, webb och nyheter | Brave-nyckel | ☐ |
| P13 | Pressmeddelanden | Val av källa | ☐ |
| P14 | Upphandlingar | Val av källa | ☐ |
| P15 | Hämtning av bolagswebbplatser | – | ☐ |
| P16 | Langfuse EU | Langfuse-konto | ☐ |

### Checkpoint D: Grind 0
- [ ] `proofs/STATUS.md` visar 16 gröna, eller beslut i `07-beslut.md` för varje som inte är grön
- [ ] Beslut om DBOS eller Temporal i `07-beslut.md`
- [ ] Q har sett STATUS.md

---

## Fas 5

### T13: Riktig arbetsflödesmotor
**Beskrivning:** Implementera `WorkflowEngine` med vald motor. Kör samma testsvit som i T10.
**Acceptans:**
- [ ] Testsviten från T10 grön mot riktig motor
- [ ] Krasch mitt i steg testad med riktig process som dödas
**Verifiering:** `pnpm test packages/workflow`
**Beroenden:** P9, T10
**Filer:** `packages/workflow/src/<motor>.ts`, `packages/workflow/test/`
**Storlek:** M

### Checkpoint E
- [ ] Alla framgångskriterier i båda specarna uppfyllda
- [ ] Q godkänner. Därefter specas `identity` och `evals`.
