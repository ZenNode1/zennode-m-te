# 05 – Säkerhet, GDPR och lag

Det här är inte juridisk rådgivning. Låt en jurist granska upplägget före första betalande kund.

## Roller

- Kunden är personuppgiftsansvarig, och ZenNode AB är personuppgiftsbiträde. Det kräver ett biträdesavtal (PUB) med varje kund.
- Underbiträden: AWS (Bedrock, EU), Berget AI (Stockholm), Microsoft (Azure Sweden Central, Graph), Brave (sök, avtal om nollagring när det finns), Langfuse (EU). Recall.ai om det väljs.

## Brief (steg 1)

- **Knappen:** research körs bara när en användare begär det (dataminimering).
- **Källor:** öppna register, bolagets egna kanaler, nyheter och kundens egna system.
- **Ingen skrapning:** ingen LinkedIn-skrapning. CNIL bötfällde Kaspr med 240 000 euro för att ha samlat kontaktuppgifter som användare dolt på LinkedIn.
- **Personsök:** bara på namn plus bolag, och bara yrkessammanhang. Rättslig grund är berättigat intresse, med en dokumenterad intresseavvägning.
- **Informationsplikt:** en rad i mötesbekräftelsen om att mötet förbereds med offentliga källor och AI, med länk till kundens integritetspolicy.
- **Gallring:** briefer som inte sparats i CRM raderas efter 90 dagar (kan ställas in per kund).

## Inspelning (steg 2)

- **Brottsbalken 4 kap. 9 a §:** den som deltar i ett samtal får spela in det. GDPR gäller ändå, så varje inspelning behöver en dokumenterad rättslig grund.
- **Kundens godkännande:** en rad i mötesbekräftelsen och en fråga muntligt vid start. Godkännandet loggas i `consent`. Vid nej spelas inget in.
- **Gallring:** ljudet raderas direkt efter transkribering. Transkript sparas i 90 dagar (kan ställas in per kund). Sammanfattningen följer kundens CRM-regler.
- **AI-förordningen:** känsloigenkänning på arbetsplatsen är förbjuden sedan 2 februari 2025. AI som bedömer anställdas prestation är högrisk från 2 december 2027. Reflektionen är därför privat och används aldrig för bedömning.
- **MBL:** har kunden kollektivavtal kan införandet kräva förhandling innan start.

## Teknisk säkerhet

- **Inloggning:** via Microsoft Entra ID. Rollbaserad åtkomst. Varje tenants data isoleras med radnivåsäkerhet i Postgres.
- **Kryptering:** vid lagring och överföring. Hemligheter i Azure Key Vault (lokalt i `.env`).
- **Granskningslogg:** `audit_log` registrerar läsning och export av briefer, transkript och reflektioner.
- **AI-anrop:** sker inte med persondata till tjänster utanför EU. Anthropics eget API används bara med påhittad testdata under utveckling.
