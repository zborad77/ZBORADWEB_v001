# zboradweb

Web + poptavkovy formular s backend endpointem `/api/poptavka`.

## Spusteni

1. Nainstalujte Node.js 20+ (v tomto prostredi zatim neni dostupny `node` ani `npm`).
2. Zkopirujte `.env.example` na `.env` a doplnte SMTP udaje.
3. Spustte:
   - `npm install`
   - `npm start`
4. Otevrete `http://localhost:3000`.

## Co formular umi

- povinna pole: jmeno, e-mail, telefon, popis
- prilohy: max 8 souboru, max 10 MB/soubor
- anti-spam honeypot pole
- po odeslani:
  - e-mail s detaily + prilohami na `TARGET_EMAIL` (default `info@zborad.cz`)
  - potvrzovaci e-mail zadavateli
