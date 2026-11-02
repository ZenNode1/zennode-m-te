# Implementation Plan: integration-proofs + platform

Specar: [SPEC-integration-proofs.md](../SPEC-integration-proofs.md), [SPEC-platform.md](../SPEC-platform.md). Karta: [CAPABILITY-MAP.md](../CAPABILITY-MAP.md).

Status: **godkänd av Q** (2026-11-02). Uppgifterna finns i [todo.md](todo.md).

## Overview

Planen täcker bara grind 0 och grunden. Först byggs ett litet verktyg för att testa tjänster, sedan testas de 16 tjänsterna skarpt när Q har ordnat konton. Parallellt byggs grunden: kodstruktur, databas med kundisolering, arbetsflöden som tål krascher och automatiska kontroller. Ingen produktfunktion byggs här.

## Feasibility Protocol: status

| Kontrollpunkt | Status |
|---|---|
| Hela livscykeln (skapa → läsa → ta bort) testad med riktiga nycklar | ❌ 0 av 16 tjänster |
| Behörigheter bekräftade med riktiga anrop | ❌ |
| Exakt svarsformat (body + headers) bekräftat | ❌ |
| Borttagning/ångra testad | ❌ |
| Felsvar förstådda | ❌ |

Därför gäller:
- Den här planen innehåller bara testarbetet och en lokal grund som inte använder någon otestad tjänst.
- Ingen plan för `identity` och senare moduler görs förrän alla 16 är gröna eller ersatta genom beslut.
- Inga tidsuppskattningar.

## Lokal miljö (kontrollerad 2026-11-02)

| Verktyg | Status |
|---|---|
| git | ✅ 2.53 |
| Node.js | ✅ 24.14.1. Kontrollera om 24 eller 26 ska låsas (öppen fråga i platform-specen). |
| pnpm | ❌ saknas. Installeras via Corepack, som följer med Node. |
| Docker Desktop | ❌ saknas. Q installerar. |
| Git-repo | ❌ projektet är inte ett repo än |

## Architecture Decisions

- **Projektet flyttas ut ur OneDrive** till t.ex. `C:\dev\zennode-mote`. OneDrive synkar `node_modules` (tiotusentals filer) och låser filer under bygget, vilket ger slumpmässiga fel. Git och GitHub ersätter synken.
- **Skelettet byggs före testverktyget.** Testverktyget behöver TypeScript, pnpm och Vitest, så ett minimalt skelett från platform kommer först.
- **Testverktyget testas självt mot en lokal låtsastjänst** innan det används mot riktiga tjänster. Annars vet vi inte om ett fel ligger i tjänsten eller i verktyget.
- **Varje tjänst är en egen uppgift.** De blockeras av olika konton och kan bli klara i valfri ordning. Riskordningen i specen styr vad som görs först när flera är möjliga.
- **Arbetsflöden byggs mot gränssnittet med en implementation i minnet.** Den riktiga motorn kopplas in efter att DBOS och Temporal har jämförts (P9). Samma tester ska gå igenom med båda.

## Task List

Detaljer, acceptanskriterier och verifiering per uppgift finns i [todo.md](todo.md).

### Fas 0: Q startar det som tar längst tid
- [ ] T0: Q skickar ansökan till Bolagsverket och börjar ordna konton

### Fas 1: Miljö och skelett
- [ ] T1: Flytta projektet, skapa git-repo och första commit
- [ ] T2: Installera pnpm och Docker Desktop
- [ ] T3: Monorepo-skelett med TypeScript, Vitest, lint och `pnpm check`

### Checkpoint A
- [ ] `pnpm check` grönt, Q har sett det, commit finns

### Fas 2: Testverktyget
- [ ] T4: Testverktyg för tjänster (checklista, inspelning, tidtagning, status)
- [ ] T5: Kontroll av personuppgifter i fixtures och spärr före commit

### Checkpoint B
- [ ] Verktyget klarar alla nio punkter mot en lokal låtsastjänst

### Fas 3: Grunden (parallellt med fas 4)
- [ ] T6: Konfiguration med Zod och blockering av nätverk i tester
- [ ] T7: Postgres i Docker, Drizzle, migreringar, två databasroller, seed
- [ ] T8: Kundisolering (RLS) med `withTenant` och alla RLS-tester
- [ ] T9: Core: Result, märkta id-typer, regel för paketgränser
- [ ] T10: `WorkflowEngine` med implementation i minnet och krasch-/idempotenstester
- [ ] T11: Next.js-skal med hälsokontroll
- [ ] T12: CI: kontroller, nyckelskanning, sårbarheter, statisk analys

### Checkpoint C
- [ ] Platform-specens framgångskriterier uppfyllda, utom den riktiga arbetsflödesmotorn

### Fas 4: Skarpa tester av tjänster (när Q:s konton finns)
- [ ] P1–P16: en uppgift per tjänst, i riskordning

### Checkpoint D: Grind 0
- [ ] `proofs/STATUS.md` visar 16 gröna, eller beslut finns för varje som inte är grön
- [ ] Beslut om DBOS eller Temporal finns i `07-beslut.md`

### Fas 5: Avsluta platform
- [ ] T13: Koppla in vald arbetsflödesmotor, samma tester gröna

### Checkpoint E
- [ ] Alla framgångskriterier i båda specarna uppfyllda
- [ ] Q godkänner. Därefter specas `identity` och `evals`.

## Parallellt arbete

- Fas 3 och fas 4 kan gå samtidigt. De rör olika mappar (`packages/` mot `proofs/`).
- Inom fas 4 kan tjänsterna testas i vilken ordning som helst när konton finns.
- Fas 3 är sekventiell (T7 → T8 och T9 → T10), eftersom databas och gränssnitt bygger på varandra.

## Risks and Mitigations

| Risk | Påverkan | Åtgärd |
|---|---|---|
| Bolagsverket nekar eller drar ut på ansökan | Hög | Ansök i T0. Om nej: beslut om ersättning (t.ex. SCB plus årsredovisningar på annat sätt) innan något annat byggs. |
| Microsoft-testmiljö är svår att få gratis | Medel | Microsofts gratis utvecklarmiljö är begränsad. Alternativ: provperiod av Microsoft 365 Business. Q avgör, kostar eventuellt pengar. |
| OneDrive förstör bygget | Medel | Flytta projektet i T1. |
| Outlook-tillägg beter sig olika i nya och klassiska Outlook | Medel | Testa alla tre varianterna i P3. |
| SCIM kräver betald Entra-licens hos kunden | Medel | Bevisas i P8. Påverkar vad som lovas i säljet. |
| Temporal kräver egen server | Låg | Jämförs mot DBOS i P9. |

## Open Questions

Från specarna, besvaras av Q:
1. Egen Microsoft-testmiljö (rekommenderas) eller testanvändare i ZenNodes miljö?
2. Vilket CRM läses först?
3. Källa för pressmeddelanden och upphandlingar.
4. CodeQL (kan kosta i privat repo) eller Semgrep (gratis)? Behövs före T12.
5. Var ska projektet ligga efter flytten? Förslag: `C:\dev\zennode-mote`.
