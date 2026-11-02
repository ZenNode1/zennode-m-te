# 02 – Arkitektur

## Kärna och adaptrar

```
 Källor (adaptrar)            Kärnan (ZenNode äger)              Leverans (adaptrar)
 ───────────────────          ─────────────────────────          ───────────────────
 m365 (kalender, mejl)  ─┐    datamodell (orgnr som nyckel)  ┌─  webb (Next.js)
 crm                     ├──▶ brief-motor                   ─┼─  mejl (utkast)
 bolagsverket, scb       │    mallar per mötestyp            ├─  Teams-kort
 platsbanken             │    kundprofil (tenant_profile)    └─  crm (förslag)
 websearch (Brave)       │    spårbarhet och logg
 webfetch                ┘            │
                                      ▼
                         llm (Claude via Bedrock EU)   stt (KB-Whisper via Berget)
```

Regel: ett adapter-gränssnitt definieras i `packages/core` som en TypeScript-interface. Implementationen ligger i `packages/adapters/<namn>`. Kärnan känner bara till gränssnittet. Att byta leverantör betyder att skriva en ny implementation.

## Datamodell (första versionen)

| Tabell | Innehåll |
| --- | --- |
| `tenant` | ZenNodes kund (bolaget som köper verktyget) |
| `tenant_profile` | Kundprofil: erbjudande, idealkund, säljmetodik, mötestyper, konkurrenter, ton, CRM-fält, påslagna källor, regler, ordlista |
| `app_user` | Användare hos kunden (kopplad till Microsoft-konto) |
| `organization` | Bolag som man möter. Nyckel: `org_number`. Även domäner. |
| `person` | Kontaktperson: namn, roll, `organization_id`. Bara yrkesuppgifter. |
| `meeting` | Kalendermöte: tid, deltagare, typ, `organization_id`, eventuell affär |
| `brief` | Brief för ett möte: status, mall, version, skapad av, levererad |
| `brief_section` | Sektion med innehåll och tumme upp eller ned |
| `fact` | Ett faktum som researchsteget har hittat: text, `source_id`, datum, säkerhet |
| `source` | Källa: typ (bolagsverket, webb …), URL, hämtad tid |
| `commitment` | Åtagande från ett möte: vem, vad, datum, status |
| `consent` | Godkännande för inspelning: möte, tid, hur det gavs (steg 2) |
| `recording` | Inspelning: status. Ljudet raderas efter transkribering. (Steg 2) |
| `transcript` | Transkript med talare och tidsstämplar, gallras (steg 2) |
| `draft` | Utkast: sammanfattning, mejl, CRM-fältförslag, status (steg 2) |
| `reflection` | Privat mötesreflektion, bara synlig för ägaren (steg 2b) |
| `audit_log` | Vem gjorde vad och när |

## Brief-motorn: tre steg

1. **Identifiera.** Från deltagarnas mejldomän tas bolaget och organisationsnumret fram. Därefter personen, utifrån namn och bolag. Är det osäkert stannar motorn och frågar användaren.
2. **Researcha.** Alla påslagna källadaptrar körs parallellt. Varje fynd blir en rad i `fact`, med källa och datum. Bolagsdata cachas per organisationsnummer.
3. **Skriva.** Skribenten får bara se `fact`-raderna, kundprofilen och mallen. Varje mening i briefen pekar på ett eller flera fakta. En kontroll efteråt underkänner påståenden utan källa.

## Steg 2: flödet

Godkännande → inspelning (Teams via Graph, datorinspelning eller mobilappen, eller röstmemo om kunden säger nej) → transkribering med KB-Whisper → kärnan kopplar mötet till rätt affär → utkast (sammanfattning, mejl, CRM-förslag per fält med citat) → personen godkänner → leverans till Outlook och CRM → åtagandena blir underlag för nästa brief. Reflektionen går bara till personen.
