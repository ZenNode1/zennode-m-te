# 04 – Steg 2: inspelning, utkast och mötesreflektion

## Inspelning

| Väg | Hur |
| --- | --- |
| Teams | Microsofts transkript hämtas via Microsoft Graph, alternativt ljudet genom KB-Whisper. Testa båda på svenska. |
| Dator | Recall.ai:s Desktop Recording SDK eller en egen lösning, bakom adaptern `capture`. Ingen bot i kundens möte. |
| Mobil | Egen Expo-app för iOS och Android, med inspelning i bakgrunden. Ingen webbapp, eftersom mikrofonen inte är pålitlig i webbappar på iPhone. |
| Telefon | iPhones egen samtalsinspelning (iOS 18.1 och senare meddelar motparten). Ljudfilen delas till appen. |
| Kunden säger nej | Röstmemo efter mötet. |

## Mobilappen

1. Dagens möten visas från kalendern, med briefen ett tryck bort.
2. Personen trycker på mötet och sedan Spela in. Inspelningen kopplas till rätt kund och affär.
3. Godkännande: en fras att läsa upp och en knapp för "Kunden har godkänt", som loggas i `consent`. Vid nej byter appen till röstmemo.
4. Inspelningen fortsätter med låst skärm. Ljudet krypteras lokalt, laddas upp i delar och raderas från telefonen efter uppladdningen.
5. Utkast och reflektion visas i appen. CRM-fälten godkänns ett i taget, och mejlet öppnas i Outlook.
6. Ad hoc-möten kan startas direkt. Appen frågar då efter kund.

Krav: inloggning med Microsoft-kontot, distribution via ZenNode AB, och en extern mikrofon i större rum.

## Utkasten

1. **Sammanfattning:** kundens behov med kundens egna ord, beslut, åtaganden från båda sidor med datum, invändningar, konkurrenter, risker och nästa steg. Ryms på en skärm.
2. **Mejl:** tackar, återger behovet med kundens ord, bekräftar åtaganden med datum och föreslår ett konkret nästa steg. Skrivs i personens ton. Aldrig priser eller löften som inte sades.
3. **CRM:** förslag per fält enligt kundprofilen, med citat och tidsstämpel. Personen godkänner, ändrar eller avvisar per fält. Åtaganden blir uppgifter, och nya personer blir kontakter.

## Mötesreflektion (privat)

- Syns bara för personen. Ingen chef ser den, det finns inga topplistor och inget går till HR.
- Inga betyg och inga poäng. Tonen är "Testa nästa gång att…".
- Varje iakttagelse har ett citat och en tidsstämpel.
- Personen kan radera reflektionen eller stänga av funktionen.
- Bedömer aldrig kunden och tolkar inga känslor (förbjudet enligt AI-förordningen, art. 5).

**Tittar på:**
- Struktur: agenda och ett bokat nästa steg.
- Frågor: Gongs data visar 11–14 i ett behovsmöte, spridda över samtalet.
- Lyssnande: säljaren pratar cirka 57 % i vunna affärer, och mer än 65 % sänker vinstchansen.
- Kundens behov med egna ord, och hur tveksamheter bemöttes.
- Svenska signaler: "det låter intressant" kan vara ett mjukt nej.

**Format:** det här fungerade (3), testa nästa gång (2, med formuleringar), kundens ord att ta med, en sak att öva på och utvecklingen över tid.

## Exceptionell svenska

- KB-Whisper large, med talaridentifiering, hos Berget i Stockholm.
- En ordlista per kund (`tenant_profile.glossary`) som skickas med som ledtråd och används vid efterkorrigering.
- Stilmall per person, inlärd från egna skickade mejl. Ingen översatt säljjargong.
- En testbank med 20 svenska möten (dialekter, telefon, mötesrum). Mät ordfelfrekvens och andel mejl som skickas nästan oförändrade, före varje release.
