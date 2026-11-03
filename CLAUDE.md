# ZenNode Möte

Ett mötesverktyg för svenska B2B-säljare och chefer, byggt och sålt av ZenNode AB (zennode.se).

1. **Före mötet:** en brief i världsklass om bolaget och personerna, som startas med en knapp.
2. **Under mötet:** inspelning och transkribering på svenska, efter kundens godkännande, från dator eller mobil.
3. **Efter mötet:** sammanfattning, mejlutkast och CRM-förslag som personen godkänner, plus en privat mötesreflektion.

Detaljerna finns i `docs/`. Läs `docs/01-vision.md` och `docs/02-arkitektur.md` innan du föreslår större ändringar.

## Hur du arbetar med Q

- Q äger projektet. Q är säljare och affärsutvecklare, inte utvecklare.
- Prata svenska med Q. Förklara kort och konkret vad du ska göra och varför, utan jargong.
- Planera före kod. Vid varje ny uppgift: skriv en kort plan i punktform och vänta på Q:s ok.
- Ta små steg. En sak i taget, testa, visa resultatet och gör en commit.
- Fråga innan du installerar nya beroenden, raderar filer eller kör något som kostar pengar eller rör molnet.
- Säg till direkt när något är osäkert eller när en tjänst kräver konto eller nyckel, och vad Q behöver göra.

## Principer som inte får brytas

1. **Kärna och adaptrar.** All affärslogik bor i `packages/core`. Varje extern tjänst ligger bakom en adapter i `packages/adapters` med ett eget gränssnitt. En adapter innehåller aldrig affärslogik.
2. **En kodbas för alla kunder.** Kundinställningar finns i databasen (tabellen `tenant_profile`), inte i koden. Lägg aldrig till kundspecifika if-satser.
3. **Utkast, aldrig automatik.** AI-output är alltid ett utkast. Inget mejl skickas och inget skrivs till CRM utan att en människa har godkänt det.
4. **Källa på allt.** Varje påstående i en brief eller sammanfattning har källa och datum, eller citat och tidsstämpel. Skribentsteget får bara använda fakta som researchsteget har hittat.
5. **EU och GDPR.** Persondata behandlas och lagras bara i EU. AI-modellen körs via AWS Bedrock med EU-inferensprofil. Transkriberingen sker hos Berget AI i Stockholm. Ingen LinkedIn-skrapning, och personinformation begränsas till yrkesroll.
6. **Dataminimering.** Research körs bara när någon trycker på knappen. Ljud raderas direkt efter transkribering. Allt annat gallras enligt `docs/05-sakerhet-gdpr.md`.
7. **Reflektionen är privat.** Mötesreflektionen syns bara för personen som hade mötet. Den innehåller inga betyg och ingen känsloanalys, och den bedömer aldrig kunden.
8. **Svenska först.** Användargränssnitt, briefer, mejl och reflektioner är på svenska och ska låta som en skicklig svensk säljare. Kod, variabelnamn och commit-meddelanden skrivs på engelska.
9. **Inga hemligheter i koden.** API-nycklar ligger i `.env`, som aldrig committas. Lägg varje ny nyckel i `.env.example` med en tom placeholder.
10. **Bara påhittad testdata** under utveckling. Använd aldrig riktiga kunders eller personers data i tester, fixtures eller exempel.

## Teknikval

Ändras bara efter beslut i `docs/07-beslut.md`.

- **Språk:** TypeScript överallt. Node.js LTS. pnpm workspaces (monorepo).
- **Webb:** Next.js i `apps/web`, för administration, visning av briefer och godkännande av utkast.
- **Mobil:** Expo (React Native) i `apps/mobile`. Byggs i steg 2.
- **Databas:** PostgreSQL med pgvector, och Drizzle ORM för schema och migreringar. Lokalt i Docker.
- **Jobb:** hållbara arbetsflöden, DBOS eller Temporal, väljs efter skarpt test (B19).
- **AI-modell:** Claude via AWS Bedrock med EU-inferensprofil, bakom adaptern `llm`. Kontrollera aktuella modell-ID i Bedrock-konsolen, gissa inte.
- **Transkribering:** Berget AI med KBLab/kb-whisper-large via ett OpenAI-kompatibelt API, bakom adaptern `stt`.
- **Källor (steg 1, se B14):** Bolagsverket (värdefulla datamängder, inkl. årsredovisningar), SCB, Platsbanken (JobTech JobSearch), hämtning av bolagets egna webbsidor, Brave Search API (webb och nyheter), pressmeddelanden och upphandlingar. Svenskt mediearkiv som tillval.
- **Microsoft 365:** Microsoft Graph för kalender (med ändringsnotiser), mejlläsning (B20), Teams och senare mejlutkast. Outlook-tillägg i `apps/outlook-addin` (B16).
- **CRM:** läsning i steg 1 (B15), skrivning i steg 2.
- **Kvalitet:** testsvit `evals` styr releaser av modeller och promptar (B18).
- **Observability:** Langfuse för spårning av AI-anrop.
- **Drift:** Azure Sweden Central, infrastruktur som kod med OpenTofu. Kommer efter MVP.
- **Test:** Vitest. Varje adapter har tester mot sparade svar (fixtures) och anropar inte riktiga API:er i CI.

## Struktur

```
apps/web            Next.js: admin, briefer, godkännande
apps/outlook-addin  Outlook-tillägg: knapp i bokningen, brief i sidopanel
apps/mobile         Expo: inspelning (steg 2)
packages/core       domän, researchagent, brief-motor, mallar, regler
packages/adapters   bolagsverket, scb, platsbanken, websearch, webfetch,
                    pressreleases, procurement, m365, crm, llm, stt
packages/evals      testsvit för briefkvalitet
packages/db         Drizzle-schema och migreringar
docs/               specifikationer och beslut
prompts/            startpromptar för Claude Code
```

## Kommandon

Uppdatera listan när kommandona finns.

- `pnpm install`: installera beroenden
- `pnpm check`: typkontroll, lint, formatering och tester. Körs före varje commit.
- `pnpm format`: formatera koden
- `pnpm proof <tjänst> [--step 1-9]`: testa en extern tjänst skarpt (bara lokalt, med Q:s ok)
- `pnpm proof:status`: uppdatera `proofs/STATUS.md`
- `pnpm dev`: starta webben lokalt (finns efter T11)
- `pnpm test`: kör alla tester
- `pnpm db:migrate`: kör databasmigreringar
- `pnpm brief -- --email <adress>`: skapa en brief från terminalen

## När en uppgift är klar

1. Testerna går igenom.
2. Q har sett resultatet.
3. Det finns en commit med ett tydligt meddelande.
4. `docs/06-plan.md` är uppdaterad med det som blivit klart.
