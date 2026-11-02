# 06 – Plan

Uppdateras av Claude Code när en uppgift är klar.

## Aktuell plan (från 2026-11-02)

Steg 1 styrs nu av [CAPABILITY-MAP.md](../CAPABILITY-MAP.md), specarna `SPEC-<modul>.md` och [tasks/plan.md](../tasks/plan.md) med uppgifter i [tasks/todo.md](../tasks/todo.md). Milstolparna M0–M8 nedan är ersatta och står kvar som historik.

### Logg

| Datum | Uppgift | Resultat |
| --- | --- | --- |
| 2026-11-02 | T1 | Projektet flyttat till `C:\dev\zennode-mote`, git-repo skapat, första commit. GitHub-remote saknas tills Q skapat repot. |
| 2026-11-02 | T2 (del) | pnpm 12.16.1 aktiverat via Corepack i användarmappen. Docker Desktop väntar på Q. |
| | T0 | Väntar på Q: ansökan till Bolagsverket |

## Steg 1 – Brief (MVP), ursprunglig plan (ersatt)

| # | Milstolpe | Klart när | Status |
| --- | --- | --- | --- |
| M0 | Konton och nycklar (se nedan) | Q har nycklarna i `.env` | ☐ |
| M1 | Repo-skelett: monorepo, Postgres i Docker, Drizzle-schema, testmiljö | `pnpm test` går igenom och databasen migrerar | ☐ |
| M2 | Källadaptrar: Bolagsverket, SCB, Platsbanken, Brave, webbhämtning, med fixtures | Varje adapter har tester och fungerar mot riktiga API:et med påhittade eller offentliga bolag | ☐ |
| M3 | Identifiering: mejldomän till bolag, organisationsnummer och person | Rätt bolag för 9 av 10 testdomäner, och osäkra fall flaggas | ☐ |
| M4 | Brief-motor: research → fakta → skribent → källkontroll, och `pnpm brief` i terminalen | En brief enligt mall v1 på under 2 minuter, med källa på varje påstående | ☐ |
| M5 | Kundprofil styr briefen (erbjudande, metodik, mötestyper, ton) | Två påhittade kunder får tydligt olika briefer för samma bolag | ☐ |
| M6 | Webb: logga in, se dagens möten, knappen Gör research, läsa brief, tumme per sektion | Q kan använda det för sina egna möten | ☐ |
| M7 | Microsoft 365: kalendersynk, mejl- eller Teams-kort med knapp | Briefen kommer utan att man öppnar webben | ☐ |
| M8 | Drift i Azure Sweden Central med OpenTofu | Körs i molnet med pilotkund 1 | ☐ |

**Klart för steg 1:** brief inom 2 minuter och 80 % användbara sektioner enligt tummarna, hos två piloter.

## Steg 2a – Inspelning och utkast

M9 transkribering (Berget), M10 Teams-transkript via Graph, M11 utkast (sammanfattning, mejl, CRM per fält), M12 mobilapp (Expo), M13 svensk testbank.

## Steg 2b – Mötesreflektion

M14 reflektionsmall per kund, privat vy och utveckling över tid.

## M0 – det Q behöver ordna

- [ ] GitHub: privat repo under ZenNode, till exempel `zennode/mote`
- [ ] Docker Desktop installerat (för lokal databas)
- [ ] Bolagsverket: ansök om klient till API för värdefulla datamängder (kan ta tid, ansök först)
- [ ] Brave Search API: konto och nyckel
- [ ] AWS: konto med Bedrock-åtkomst till Claude i EU-region
- [ ] Berget AI: konto och API-nyckel
- [ ] Microsoft Entra ID: appregistrering för Graph (görs i M7)
- [ ] Langfuse: konto i EU-region
