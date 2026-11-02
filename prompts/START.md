# Kom igång med Claude Code

## Engångsförberedelse (cirka 15 minuter)

1. Packa upp mappen `zennode-mote` där du har dina projekt, till exempel `C:\Projekt\zennode-mote`.
2. Öppna mappen i VS Code.
3. Öppna terminalen i VS Code och skriv `claude`.
4. Claude Code läser `CLAUDE.md` automatiskt. Du behöver inte klistra in någon bakgrund.

Kopiera sedan in en prompt i taget nedan. Vänta tills varje steg är klart och godkänt innan du tar nästa.

---

## Prompt 1 – Läs in och planera

```
Läs CLAUDE.md och alla filer i docs/. Sammanfatta på svenska, med högst
10 punkter, vad vi ska bygga och i vilken ordning. Lista sedan exakt vad
jag behöver installera eller skaffa (konton och nycklar) för milstolpe
M1 och M2, och hur jag kontrollerar att det är på plats på Windows.
Skriv ingen kod ännu.
```

## Prompt 2 – Git och GitHub

```
Initiera git i projektet, lägg till en .gitignore som stänger ute .env
och node_modules, och gör en första commit. Guida mig steg för steg
till att koppla repot till ett nytt privat repo på GitHub. Förklara
varje kommando kort innan du kör det.
```

## Prompt 3 – M1: skelett

```
Genomför milstolpe M1 i docs/06-plan.md. Börja med en kort plan och
vänta på mitt ok. Bygg sedan pnpm-monorepot med apps/web,
packages/core, packages/adapters och packages/db, Postgres med pgvector
i Docker, Drizzle-schemat enligt docs/02-arkitektur.md (steg 1-tabellerna)
och Vitest. Lägg en påhittad testkund i seed-data. Avsluta med att visa
att pnpm test och pnpm db:migrate fungerar, och uppdatera planen.
```

## Prompt 4 – M2: första källan

```
Genomför den första delen av M2: adaptern för Bolagsverket. Definiera
först gränssnittet i packages/core och sedan implementationen i
packages/adapters/bolagsverket. Testa mot sparade svar (fixtures),
aldrig mot riktiga API:et i testerna. Visa mig sedan ett riktigt anrop
för ett stort, välkänt börsbolag så att jag ser att det fungerar.
```

## Prompt 5 – Resten av M2

```
Gör samma sak för SCB, Platsbanken (JobTech JobSearch), Brave Search
och webbhämtning (läs hela sidan, respektera robots.txt). En adapter
i taget, med en commit efter varje.
```

## Prompt 6 – M3 och M4: den första briefen

```
Genomför M3 och M4. Briefen ska följa docs/03-brief-mall.md. Researchen
sparar varje fynd som fact med källa och datum. Skribenten får bara
använda fakta, och en kontroll underkänner påståenden utan källa. Gör
kommandot pnpm brief -- --email <adress>. Testa med en påhittad person
på ett riktigt, stort börsbolag och visa mig briefen.
```

---

## Bra att veta

- **Om något går fel:** klistra in hela felmeddelandet och skriv "förklara på svenska vad som är fel och föreslå en lösning".
- **Ny session:** skriv "läs CLAUDE.md och docs/06-plan.md och berätta var vi är".
- **Inga riktiga kunddata:** använd inte riktiga kunders data när du testar, förrän säkerheten i M8 är på plats.
