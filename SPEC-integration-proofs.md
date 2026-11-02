# Spec: integration-proofs

Modul i [CAPABILITY-MAP.md](CAPABILITY-MAP.md). Beror på: inget. Byggs parallellt med `platform`.

Status: **godkänd av Q** (2026-11-02)

## Objective

Bevisa med riktiga anrop att varje extern tjänst i steg 1 gör exakt det vi tänker bygga på, innan någon plan eller tidsuppskattning görs. Det här är grind 0 i kartan och följer Feasibility Protocol i Q:s globala instruktioner.

**Varför:** dokumentation och "det borde fungera" räcker inte. En tjänst som inte beter sig som väntat ska upptäckas dag 1, inte vecka 6. Bolagsverkets ansökan kan ta veckor och kan nekas. Microsofts behörigheter kan kräva admin-godkännande som kunden inte ger. Det vill vi veta först.

**Vem använder resultatet:**
- Q, som ser en tabell över vad som är grönt, rött och vad Q behöver ordna.
- Alla senare moduler, som bygger sina adaptrar och tester på de sparade svaren (fixtures) härifrån.

**Klart betyder:** alla 16 tjänster i grind 0 är gröna, eller ersatta/strukna genom ett nytt beslut i `docs/07-beslut.md`.

### Vad varje bevis ska visa

| # | Punkt | Vad som räknas som bevisat |
|---|---|---|
| 1 | Skapa | Anropet skapar resursen, och den syns i tjänstens UI eller i ett efterföljande GET. För tjänster som bara läser: "ej tillämpligt, läs-API utan sidoeffekter" skrivs ut. |
| 2 | Läsa | Exakt svarsformat sparat: body, statuskod och de headers vi behöver. |
| 3 | Ta bort / ångra | Det skapade tas bort och borttagningen bekräftas. Om borttagning saknas: skriftlig motivering varför det är acceptabelt. |
| 4 | Felformat | Minst två förväntade fel framkallade (t.ex. fel id → 404, saknad behörighet → 401/403, felaktig parameter → 400/422). Formatet sparat. |
| 5 | Behörigheter | Varje behörighet (scope) vi behöver testad med ett anrop. Ingen behörighet antas från dokumentation. Den minsta uppsättningen som räcker noteras. |
| 6 | Headers | Varje header vi tänker läsa (t.ex. `Retry-After`, `ETag`, `Location`) har setts i ett riktigt svar. |
| 7 | Gränser | Hastighetsgräns (rate limit) observerad eller dokumenterad, och hur tjänsten svarar när den nås. |
| 8 | Svarstid | p50 och p95 mätt över minst 20 anrop. Används för att räkna på SLO:n p95 brief < 120 s. |
| 9 | Villkor | Länk och datum till leverantörens villkor/PUB: tränar inte på data, region, lagringstid, underleverantörer. |

### Tjänster och vad som bevisas

Ordning: störst risk först.

| Ordning | Tjänst | Det som måste bevisas särskilt |
|---|---|---|
| 1 | Bolagsverket, värdefulla datamängder | Ansökan godkänd. Exakta fält per orgnr. Att årsredovisningar går att lista och hämta, och att omsättning, resultat och antal anställda går att läsa ur dem (iXBRL). |
| 2 | Microsoft Graph, kalender | Delegerad `Calendars.Read`. Ändringsnotiser (webhook) tas emot, förnyas och tas bort. Delta-frågor fungerar. Admin-godkännande krävs eller inte. |
| 3 | Outlook-tillägg | Tillägget installeras i testmiljön och knappen syns i en kalenderhändelse i nya Outlook, på webben och i klassiska Outlook. Inloggning (SSO) i sidopanelen fungerar. Avinstallation fungerar. |
| 4 | AWS Bedrock EU | Modellåtkomst beviljad. EU-inferensprofilens id hämtat från konsolen och vilka regioner den använder. Huvudmodell och reservmodell svarar. Strömmande svar fungerar. |
| 5 | CRM, läsning | Valt CRM: bolag, affär, fas och senaste aktivitet går att läsa i ett sandlådekonto. |
| 6 | Microsoft Graph, mejl | Delegerad `Mail.Read`. Det går att hämta bara trådar där en viss deltagare finns med, utan att läsa hela inkorgen. |
| 7 | Microsoft Graph / Teams, leverans | Ett meddelande med kort och knapp skickas till en testanvändare och tas bort. Vilken behörighet som minst krävs. |
| 8 | Entra ID, inloggning och SCIM | Inloggning med flera kunder (multi-tenant). SCIM skapar, ändrar och tar bort en användare. Vilken Entra-licens SCIM kräver. |
| 9 | Hållbara arbetsflöden | DBOS och Temporal jämförs: ett arbetsflöde dödas mitt i ett steg, startas om och fortsätter utan att steget körs två gånger. Fungerar på Windows lokalt och i Azure. Beslut skrivs in i `07-beslut.md`. |
| 10 | SCB företagsregister | Fält per orgnr: storleksklass, arbetsställen. Hur åtkomst ges (nyckel eller certifikat). |
| 11 | JobTech JobSearch | Annonser per arbetsgivare/orgnr de senaste 90 dagarna. |
| 12 | Brave Search API | Webb- och nyhetssök med svenska resultat. Villkor: lagras sökfrågorna? |
| 13 | Pressmeddelanden | Källa väljs. Pressmeddelanden per noterat bolag de senaste 90 dagarna. |
| 14 | Upphandlingar | Källa väljs (t.ex. EU:s TED). Upphandlingar per köpande organisation. |
| 15 | Hämtning av webbplatser | 20 svenska bolagswebbplatser: andel som går att läsa, robots.txt respekteras, hur ofta vi blockeras. |
| 16 | Langfuse EU | Spår skapas, läses och tas bort via API. Maskering av namn och e-post innan sändning fungerar. |

## Tech Stack

- TypeScript, körs med `tsx`. Inget ramverk.
- Node.js aktiv LTS, samma version som `platform` väljer.
- Varje bevis är ett fristående skript. Det delar inget med produktkoden, så att bevisen kan börja innan `platform` finns.
- Hemligheter läses från `.env` (aldrig committad). Varje ny nyckel läggs i `.env.example` med tom placeholder.

## Commands

```
pnpm proof <tjänst>          Kör beviset för en tjänst mot riktig tjänst, skriver fixtures och rapport
pnpm proof <tjänst> --step 4 Kör bara en punkt, t.ex. felformat
pnpm proof:status            Skriver ut tabellen över alla tjänster och deras status
pnpm proof:scrub             Kontrollerar att inga fixtures innehåller personuppgifter
```

Bevisen körs bara lokalt och bara när Q har sagt ok. De körs aldrig i CI.

## Project Structure

```
proofs/
  README.md                  Hur man kör ett bevis och läser resultatet
  STATUS.md                  Genererad tabell: tjänst, status, datum, blockerare
  _shared/
    checklist.ts             De nio punkterna som typ, så att inget glöms
    record.ts                Sparar svar (body, status, headers) som fixture
    scrub.ts                 Hittar och tar bort personuppgifter i fixtures
    timing.ts                Mäter p50/p95
  bolagsverket/
    proof.ts                 Själva beviset
    VERIFIED.md              Resultat per punkt, med datum och vem som körde
    fixtures/                Sparade svar, utan personuppgifter
  m365-calendar/
  outlook-addin/
  bedrock/
  crm/
  m365-mail/
  teams-delivery/
  entra-scim/
  workflow-engine/
  scb/
  jobtech/
  brave/
  pressreleases/
  procurement/
  webfetch/
  langfuse/
```

Fixtures flyttas senare till `packages/adapters/<namn>/test/fixtures` när adaptern byggs.

## Code Style

Varje bevis följer samma form, så att `VERIFIED.md` blir jämförbar mellan tjänster.

```ts
// proofs/bolagsverket/proof.ts
import { defineProof } from "../_shared/checklist";

export default defineProof({
  service: "bolagsverket",
  steps: {
    create: { notApplicable: "Read-only API without side effects" },
    read: async (ctx) => {
      // Endpoint path is illustrative until the proof confirms the real one.
      const res = await ctx.call("GET", `/organisationer/${ctx.fixtureOrgNumber}`);
      ctx.expectStatus(res, 200);
      ctx.recordFixture("organisation-200", res);
    },
    remove: { notApplicable: "Nothing is created" },
    errors: async (ctx) => {
      ctx.recordFixture("organisation-404", await ctx.call("GET", "/organisationer/0000000000"));
      ctx.recordFixture("unauthorized-401", await ctx.callWithoutToken("GET", "/organisationer/0000000000"));
    },
    // scopes, headers, limits, latency, terms ...
  },
});
```

- Kod, filnamn och variabelnamn på engelska. `VERIFIED.md` på svenska.
- En punkt utan bevis står som `☐` med orsak. Den får aldrig fyllas i för hand utan körning.
- Varje `VERIFIED.md` börjar med: tjänst, datum, kört av, version av API:et, status (grön/röd/blockerad).

## Testing Strategy

- Bevisen är själva testerna. De körs manuellt mot riktiga tjänster.
- `pnpm proof:scrub` körs automatiskt innan fixtures committas (pre-commit) och letar efter e-postadresser, personnummer, telefonnummer och namn från en lista med vanliga svenska namn. Träff stoppar committen.
- När en adapter byggs i en senare modul testas den mot fixtures härifrån. Om tjänsten ändrar format körs beviset om och fixtures uppdateras.

## Boundaries

**Alltid:**
- Städa upp allt som skapats i testmiljön och bekräfta det.
- Spara datum, API-version och exakt svar för varje punkt.
- Använd minsta möjliga behörighet. Notera om en större behövdes och varför.
- Använd testkonton och påhittade testpersoner i Microsoft- och CRM-testmiljöerna.

**Fråga först:**
- Skapa konton, ansöka om API-åtkomst eller godkänna villkor. Q gör det själv.
- Allt som kostar pengar, även små belopp.
- Admin-godkännande av behörigheter i en Microsoft-miljö.
- Byta ut eller stryka en tjänst. Det kräver ett nytt beslut i `07-beslut.md`.

**Aldrig:**
- Riktiga kunders eller personers data i anrop, fixtures eller rapporter. Offentliga bolagsuppgifter om stora kända bolag går bra, men inga personuppgifter.
- Committa nycklar, tokens eller `.env`.
- Bygga en omväg runt ett bevis som misslyckas. Stoppa och rapportera till Q.
- Markera en punkt som grön utan körning.

## Success Criteria

- [ ] Alla 16 tjänster har en `VERIFIED.md` där punkt 1–9 är bevisade eller motiverat ej tillämpliga.
- [ ] `proofs/STATUS.md` visar 16 gröna, eller så finns ett beslut i `07-beslut.md` för varje som inte är grön.
- [ ] Varje tjänst har fixtures för minst ett lyckat svar och två felsvar.
- [ ] `pnpm proof:scrub` hittar inga personuppgifter i någon fixture.
- [ ] Inga kvarlämnade resurser i någon testmiljö.
- [ ] Svarstider mätta, och summan av p95 för en brief visar att 120 s är realistiskt. Annars justeras SLO:n genom beslut.
- [ ] Beslut om DBOS eller Temporal finns i `07-beslut.md`.
- [ ] Q har sett `STATUS.md`.

## Vad Q behöver ordna (M0)

Q gör allt nedan själv. Inget av det får Claude göra.

| Vad | För tjänst | Notering |
|---|---|---|
| Ansökan om API-åtkomst hos Bolagsverket | 1 | **Gör först**, kan ta veckor |
| Microsoft 365-testmiljö med 2–3 påhittade användare | 2, 3, 6, 7, 8 | Separat från ZenNodes riktiga miljö |
| Registrering av appen i Entra ID | 2, 3, 6, 7, 8 | |
| AWS-konto med Bedrock-åtkomst i EU | 4 | Modellåtkomst måste begäras i konsolen |
| Sandlådekonto i valt CRM | 5 | Efter att CRM är valt |
| Nyckel till Brave Search API | 12 | |
| Åtkomst till SCB:s företagsregister-API | 10 | |
| Langfuse-konto i EU | 16 | |
| GitHub-repo (privat) och Docker Desktop | alla | |

## Open Questions

1. **Microsoft-testmiljö:** egen testmiljö eller en testanvändare i ZenNodes befintliga Microsoft-konto? Rekommendation: egen testmiljö, så att inget riktigt mejl eller möte kan läcka in.
2. **Vilket CRM** läses först? Påverkar tjänst 5.
3. **Källa för pressmeddelanden** och **för upphandlingar.**
4. **Entra-licens för SCIM:** kräver automatisk användarhantering en betald Entra-licens hos kunden? Bevisas i tjänst 8, men påverkar vad vi kan lova i säljet.
5. **Svenskt mediearkiv** som tillval: provas i steg 1 eller senare?
