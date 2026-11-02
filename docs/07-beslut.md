# 07 – Beslut

Varje beslut har ett nummer, ett datum och en motivering. Ändra inte ett beslut utan att lägga till ett nytt som ersätter det.

| # | Datum | Beslut | Varför |
| --- | --- | --- | --- |
| B1 | 2026-10-28 | Bygg i ZenNodes regi som modul i rådgivningen, inte som fristående SaaS | Konkurrenterna har gratisnivåer och stora budgetar. ZenNodes styrka är metodik, svensk data och relation. |
| B2 | 2026-10-28 | Kärna och adaptrar. White-label av färdiga produkter undviks. | Lärdomen från Presync: den som äger plattformen kan stänga av. |
| B3 | 2026-10-28 | Claude via AWS Bedrock med EU-inferensprofil | Anthropics eget API erbjuder bara USA eller global bearbetning. Bedrock ger drift i EU. Claudes inbyggda webbsök finns inte på Bedrock, därför egen sökadapter. |
| B4 | 2026-10-28 | KB-Whisper via Berget AI | Bäst på svenska (47 % lägre felfrekvens än Whisper large-v3) och körs i Stockholm. |
| B5 | 2026-10-28 | Brave Search API som första sökadapter | Googles sök-API stängs för nya kunder, och skrapning är en juridisk risk. Testa mot Gemini med Google-grounding på 20 svenska bolag. |
| B6 | 2026-10-28 | Mobil = native Expo-app, inte webbapp | Mikrofonen i webbappar på iPhone är opålitlig. Expo stöder inspelning i bakgrunden på iOS och Android. |
| B7 | 2026-10-28 | Mötesreflektionen är privat, utan betyg | Personens utveckling, inte bedömning. Förhindrar högriskklassning och förtroendeproblem. |
| B8 | 2026-10-28 | TypeScript-monorepo, Next.js, Postgres med pgvector, Drizzle, pg-boss | Ett språk överallt och en vanlig stack som Claude Code arbetar bra med. |
| B9 | 2026-10-29 | Ingen CRM-adapter i steg 1. Gränssnittet finns i core, implementationen byggs i steg 2. | Steg 1 skriver inget till CRM. En otestad integration mindre. |
| B10 | 2026-10-29 | Steg 1 använder tre källor: Bolagsverket, bolagets egen webbplats och Brave Search (valfri per kund). SCB och Platsbanken skjuts upp. | Färre beroenden och anrop. Bolagsverket ger redan SCB:s branschkod och årsredovisningar gratis. |
| B11 | 2026-10-29 | Outlook (Microsoft Graph) först. Google-kalender som nästa kalenderadapter, med bara läsbehörighet. | Google kräver granskning av appen. Gmail-behörigheter kräver dessutom årlig säkerhetsgranskning. |
| B12 | 2026-10-29 | Säljaren väljer per möte vilka möten som får en brief. Valet loggas. | Dataminimering som går att bevisa för kundens jurist. |
| B13 | 2026-10-29 | Webbsökning görs bara på bolag, aldrig på personnamn. Langfuse får namn och e-post maskerade. | Inga personuppgifter till leverantörer utanför EU eller till loggar i onödan. |
| B14 | 2026-11-02 | Ersätter B10. Funktionalitet först. Steg 1 använder Bolagsverket (med årsredovisningar), SCB, Platsbanken, bolagets webbplats, webb- och nyhetssök, pressmeddelanden och upphandlingar. Svenskt mediearkiv som tillval. | Produkten ska imponera och mätas mot de bästa. Kostnad och antal beroenden kommer i andra hand. |
| B15 | 2026-11-02 | Ersätter B9 delvis. CRM läses i steg 1 (bolag, affär, fas, senaste aktivitet). Skrivning till CRM väntar till steg 2. | Uppföljningsmöten utan historik blir svaga. Alla ledande verktyg använder CRM-data. |
| B16 | 2026-11-02 | Outlook-tillägg är huvudytan: knappen i kalenderbokningen, briefen i sidopanelen. Webben finns kvar. | Säljaren ska inte behöva lämna Outlook. Copilot finns redan där. |
| B17 | 2026-11-02 | Researchen görs av en agent med bara läsverktyg mot godkända källor. Varje fakta kontrolleras mot ett ordagrant citat i källan. Skribenten har inga verktyg. | Djupare research utan att släppa källkravet. Gör "vi hittar inte på" bevisbart. |
| B18 | 2026-11-02 | En testsvit för kvaliteten (`evals`) styr varje release av modeller och promptar. | Kvalitet som går att mäta och visa. Gör modellbyten säkra. |
| B19 | 2026-11-02 | Hållbara arbetsflöden ersätter enkel jobbkö. DBOS eller Temporal väljs efter skarpt test. | En brief ska fortsätta efter krasch utan dubbelarbete. |
| B20 | 2026-11-02 | Mejltrådar med mötesdeltagarna läses om kunden slår på det. Bara trådar med just de personerna. | Mejlhistoriken är den starkaste förberedelsen. Avgränsningen håller dataminimeringen. |

## Öppna frågor

- Teams: Microsofts transkript eller eget med KB-Whisper? Testa båda.
- Datorinspelning: Recall.ai:s SDK eller eget? EU-region för Recall.ai behöver bekräftas.
- Vilket CRM läses först (B15)? HubSpot, Lime, Upsales, Pipedrive eller Dynamics?
