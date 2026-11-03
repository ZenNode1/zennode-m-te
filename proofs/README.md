# Bevis för externa tjänster (grind 0)

Varje extern tjänst testas skarpt på nio punkter innan något byggs på den. Se `SPEC-integration-proofs.md`.

## Köra ett bevis

```
pnpm proof <tjänst>            Alla nio punkter
pnpm proof <tjänst> --step 4   Bara en punkt (1–9), övriga resultat behålls
pnpm proof:status              Uppdatera STATUS.md
pnpm proof example             Testa verktyget mot en lokal låtsastjänst
```

Bevisen anropar riktiga tjänster med nycklar från `.env`. De körs bara lokalt, bara med Q:s ok och aldrig i CI.

## Läsa resultatet

- `STATUS.md`: alla 16 tjänster och om grind 0 är öppen.
- `<tjänst>/VERIFIED.md`: varje punkt med bevis. Genereras, redigeras aldrig för hand.
- `<tjänst>/fixtures/`: sparade svar som adaptrarnas tester senare bygger på. Nycklar och cookies tas bort automatiskt.

## Regler i verktyget

- Körningen stoppar vid första fel. Inga omvägar byggs.
- En punkt utan registrerat bevis räknas som misslyckad.
- Skapa, läsa och ta bort kräver ett sparat svar. Felformat kräver minst två. Svarstid kräver minst 20 anrop.
- En tjänst där alla punkter är "ej tillämplig" blir aldrig grön.
- Saknas ett konto eller en nyckel blir tjänsten "blockerad" utan att något anropas.

## Spärr mot personuppgifter

`pnpm proof:scrub` letar efter e-postadresser, personnummer, telefonnummer och namn i `fixtures/`, `result.json` och `VERIFIED.md`. Den körs automatiskt före varje commit och stoppar commiten vid träff. Hooken aktiveras av `pnpm install`.

Rolladresser som `info@` och reserverade domäner som `example.com` är tillåtna. Är en träff inte en person, lägg ett motiverat undantag i `scrub-allow.json`:

```json
[{ "value": "Exakt text", "reason": "Varför det inte är en person" }]
```

## Skriva ett nytt bevis

Kopiera `example/proof.ts` till `<tjänst>/proof.ts`. Varje punkt är antingen en funktion som anropar tjänsten eller `{ notApplicable: "motivering" }`.
