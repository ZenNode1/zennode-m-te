# Capability Map: ZenNode Möte – Steg 1

Index över vad som byggs i steg 1. Varje modul får en egen spec, `SPEC-<modul-id>.md`, i projektroten. Modul-id ändras aldrig under projektet.

Status: **godkänd av Q** (v3, 2026-11-02)

| Modul-id | Spec | Status |
|---|---|---|
| `integration-proofs` | [SPEC-integration-proofs.md](SPEC-integration-proofs.md) | Godkänd 2026-11-02 |
| `platform` | [SPEC-platform.md](SPEC-platform.md) | Godkänd 2026-11-02 |
| Övriga | – | Specas i byggordning |

Ledstjärna: funktionalitet först. Det ska fungera imponerande, vara säkert, stabilt och enkelt. Måttstock: Copilot, Gong, Sybill, Agentforce. Kostnad och antal beroenden kommer i andra hand (B14).

## Var vi vinner och var vi måste matcha

| | Marknaden | ZenNode Möte |
|---|---|---|
| **Vinner** | Tunn extern data, få källhänvisningar | Svensk förstahandsdata, kontrollerade citat på varje påstående, säljmetodik i briefen, drift i EU, kräver ingen Copilot-licens |
| **Matchar** | Brief i Outlook och Teams, historik från mejl och CRM, följdfrågor | `outlook-addin`, `relationship-context`, frågor mot briefen |

## Moduler

| Modul-id | Ansvar | Beror på |
|---|---|---|
| `integration-proofs` | Bevisa varje extern tjänst skarpt: skapa → läsa → ta bort, behörigheter, exakt svarsformat, headers, felformat. Kontrollera leverantörens villkor: ingen träning på data, EU-region, lagringstid. Resultat: sparade svar (fixtures) och `VERIFIED.md` per tjänst. | — |
| `platform` | Monorepo, Postgres + pgvector i Docker, Drizzle-schema, radsäkerhet (RLS) per kund, hållbara arbetsflöden (varje steg sparas, fortsätter efter krasch, inget görs dubbelt), typad konfiguration, Vitest, sårbarhets- och nyckelskanning i CI. | — |
| `identity` | Inloggning med Entra ID, automatisk användarhantering (SCIM), roller, adminkonsol för kundens IT, RLS-kontext per anrop, `audit_log` med export till kundens säkerhetssystem. | `platform` |
| `tenant-profile` | Kundprofil: erbjudande, säljmetodik, mötestyper, ton, ordlista, påslagna källor och tillval, leveranstid före möte, lagringstider. | `platform`, `identity` |
| `privacy` | Gallring enligt lagringstid, export och radering per person, informationsrad till mötesbekräftelsen. | `platform`, `identity`, `tenant-profile` |
| `evals` | Testsvit för kvaliteten: 30 påhittade och offentliga bolag som facit. Mäter källträffsäkerhet, andel påhitt, fullständighet och svensk kvalitet. Ingen modell- eller promptändring släpps utan godkänt resultat. Byggs tidigt, så att kvaliteten mäts från första brief. | `platform` |
| `source-adapters` | Bakom gränssnitt i core: `bolagsverket` (bolagsfakta och årsredovisningar som treårstrend), `scb` (storlek, arbetsställen), `platsbanken` (rekryteringar), `webfetch` (bolagets webbplats), `websearch` (webb och nyheter), `pressreleases` (noterade bolag), `procurement` (offentliga upphandlingar). Tillval: svenskt mediearkiv. Omförsök, kretsbrytare, cache per orgnr. Webbsökning bara på bolag, aldrig på personnamn. | `integration-proofs`, `platform` |
| `calendar-sync` | Gränssnittet `calendar` i core. Adaptern `m365` först: säljarens egen kalender med delegerad läsbehörighet. Händelsestyrd: Microsoft meddelar ändringar direkt, så ombokning, inställt möte och ny deltagare slår igenom utan fördröjning. Sparar tid, rubrik och deltagaradresser, inte mötestext. | `integration-proofs`, `identity` |
| `relationship-context` | Tidigare briefer och möten med bolaget. Mejltrådar med just mötesdeltagarna (kunden slår på, säljaren ser vad som används). CRM som läsåtkomst: bolag, affär, fas, senaste aktivitet. Inget skrivs till CRM i steg 1. | `integration-proofs`, `identity`, `calendar-sync` |
| `meeting-selection` | Mötesval: externa möten föreslås, men inget körs förrän säljaren slår på knappen. Varje val loggas (vem, när, vilket möte). Samma tillstånd visas på webben och i Outlook. | `calendar-sync`, `identity` |
| `resolution` | E-postdomän → bolag → orgnr → personer och yrkesroller. Säkerhetsgrad, stoppar och frågar säljaren vid osäkerhet. | `source-adapters` |
| `research-agent` | Planerar researchen, följer spår och håller en tidsbudget. Har bara läsverktyg mot godkända källor. Varje fakta får ett ordagrant citat som programmet kontrollerar mot den hämtade sidan. Fakta utan godkänt citat kastas. | `resolution`, `source-adapters`, `relationship-context`, `tenant-profile` |
| `brief-engine` | Skribent utan verktyg och utan databasåtkomst. Mall per mötestyp, köpgrupp per möte (beslutsfattare, påverkare, användare, bara yrkesroll). Källkontroll som stänger: utan källa ingen publicering. Frågor mot briefen, besvarade bara från insamlade fakta. "Nytt sedan sist" vid uppdatering. Reservmodell inom EU, kostnadstak per kund. | `research-agent`, `tenant-profile` |
| `brief-delivery` | Webbvy där avsnitten visas efter hand som de blir klara. Tumme upp/ned per avsnitt. Automatisk leverans före mötet via Teams eller mejl, uppdatering samma morgon. Nedgraderad brief med markerad lucka när en källa ligger nere. | `brief-engine`, `meeting-selection` |
| `outlook-addin` | Knappen direkt i kalenderbokningen i Outlook. Briefen i sidopanelen, med frågor mot briefen. Fungerar i nya Outlook, på webben och i klassiska Outlook. | `meeting-selection`, `brief-delivery` |
| `value-metrics` | ROI-vy per kund: sparad tid, andel användbara avsnitt, användning, möten med bokat nästa steg. Bara på teamnivå, aldrig per person. | `brief-delivery` |
| `ops` | OpenTelemetry från knapptryck till levererad brief. Langfuse med maskering av namn och e-post, kort lagring. Strukturerad loggning, hälsokontroller, SLO-mätning. | `platform` |
| `deploy` | Azure Sweden Central, OpenTofu, Key Vault, kundunika krypteringsnycklar som tillval, backup och återläsningstest, SLO-larm (p95 brief < 120 s, första avsnitt < 15 s). | alla ovan |
| `trust-pack` | Underlag till köparen: PUB-mall, lista över underleverantörer, intresseavvägning, konsekvensbedömning (DPIA), säkerhetsblad, penetrationstest, plan mot ISO 27001. Jurist granskar före första pilot. | `deploy`, `privacy` |

## Byggordning

```
integration-proofs + platform
  → identity + evals
  → tenant-profile + ops
  → privacy + source-adapters + calendar-sync
  → relationship-context + resolution + meeting-selection
  → research-agent
  → brief-engine
  → brief-delivery
  → outlook-addin + value-metrics
  → deploy
  → trust-pack
```

Inga cykler. `evals` anropar brief-motorn via dess gränssnitt i core och styr releaser, men koden beror inte åt andra hållet. Varje steg kan visas för Q innan nästa börjar.

## Grind 0

Ingen plan och ingen tidsuppskattning förrän `integration-proofs` är grön för alla tjänster nedan.

| Tjänst | Används av | Skarpt testad |
|---|---|---|
| Bolagsverket, värdefulla datamängder (inkl. årsredovisningar) | `source-adapters` | ☐ |
| SCB företagsregister | `source-adapters` | ☐ |
| JobTech JobSearch (Platsbanken) | `source-adapters` | ☐ |
| Brave Search API (webb och nyheter) | `source-adapters` | ☐ |
| Källa för pressmeddelanden (väljs) | `source-adapters` | ☐ |
| Upphandlingsdata (väljs, t.ex. EU:s TED) | `source-adapters` | ☐ |
| Hämtning av bolagswebbplatser (robots.txt, blockeringar) | `source-adapters` | ☐ |
| AWS Bedrock EU, huvudmodell och reservmodell | `research-agent`, `brief-engine` | ☐ |
| Microsoft Graph: kalender, delegerad, ändringsnotiser | `calendar-sync` | ☐ |
| Microsoft Graph: mejl, delegerad läsning | `relationship-context` | ☐ |
| Microsoft Graph / Teams: leverans av meddelande | `brief-delivery` | ☐ |
| Outlook-tillägg: installation och knapp i händelse | `outlook-addin` | ☐ |
| Entra ID: inloggning och SCIM | `identity` | ☐ |
| CRM, läsning (väljs) | `relationship-context` | ☐ |
| Hållbara arbetsflöden (DBOS eller Temporal) | `platform` | ☐ |
| Langfuse EU | `ops` | ☐ |

## Öppna frågor

- Vilket CRM läses först? HubSpot, Lime, Upsales, Pipedrive eller Dynamics?
- DBOS (på vår Postgres) eller Temporal för hållbara arbetsflöden? Avgörs i `integration-proofs`.
- Källa för pressmeddelanden och för upphandlingar.
- Svenskt mediearkiv som tillval: vilken leverantör och vad kostar det per kund?
- Standardtid för leverans före mötet: 24 timmar?

## Utanför steg 1

| Vad | När | Varför |
|---|---|---|
| Google-kalender | Efter Outlook | Kräver Googles granskning av appen. Bara kalenderläsning, inga Gmail-behörigheter. |
| Skriva till CRM | Steg 2 | Kräver utkast och godkännande, som byggs i steg 2 |
| Mobilapp, inspelning, transkribering, utkast, reflektion | Steg 2 | Egen capability map |
