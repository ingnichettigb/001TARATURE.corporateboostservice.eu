# Matryoshka Modules

TARATURA serbatoi Crea un’app strutturata come una matrioska modulare.

1. Homepage (livello 1):

Genera una homepage che funge da menu principale.

Mostra 4–6 card/bottoni, ognuno rappresenta un sottoprogramma.

Ogni card deve avere: titolo, icona, descrizione breve.

La homepage deve essere responsive, pulita, stile dashboard.

La lista dei moduli deve essere caricata da una configurazione (es. modules.json) così posso aggiungere nuovi moduli senza modificare la homepage.

2. Struttura dei sottoprogrammi (livello 2):

Ogni bottone deve aprire un modulo autonomo.

Ogni modulo deve avere la stessa struttura estetica e funzionale, identica per tutti.

Ogni modulo deve essere contenuto in una cartella dedicata:
/src/modules/<nome-modulo>/

Ogni modulo deve avere:

una pagina principale

una sezione di input

una sezione di calcolo

una sezione di output

una sezione per generare PDF

La struttura deve essere identica per tutti i moduli, così posso duplicarla facilmente.

3. Cuore del programma (livello 3):

All’interno di ogni modulo, crea un file dedicato alla logica:
/src/modules/<nome-modulo>/core/logic.js

Questo file deve contenere funzioni vuote o placeholder, perché verrà sostituito con il codice importato da ZIP.

Ogni modulo deve poter funzionare autonomamente con la sua logica.

4. Obiettivo finale:

Voglio un’app dove la homepage è solo un menu.

Ogni bottone apre un sottoprogramma con la stessa struttura.

Ogni sottoprogramma ha un cuore logico diverso.

Ogni sottoprogramma consuma token separati.

La struttura deve essere scalabile e duplicabile.

Devo poter importare il codice ZIP dentro il cuore del modulo senza modificare la struttura generale.

5. Tecnologie:

Usa React e routing standard di Lovable.

Organizza il codice in cartelle modulari.

Prepara un file di configurazione per i moduli.

Prepara componenti riutilizzabili per input, output e PDF.

This project was built with [Lovable](https://lovable.dev).

## Stato del progetto (26 ago 2026)

**Dominio:** `001TARATURE.corporateboostservice.eu` — sottodominio e DNS configurati.

### Implementato

- **Homepage/menu principale** (`src/routes/index.tsx`): card moduli, "Dati Comuni" (intestazione report condivisa), selettore lingua persistente (IT/EN/ES/DE) + bottone Info con spiegazione multilingua della pagina.
- **Modulo BOMB-CON** (unico "Attivo"): geometria, calcolo, tabella di calibrazione, export PDF (stampa/condensata/multipla), manuale d'uso in-app, bottoni header ristilizzati (verde, ben visibili).
- **Sistema di licensing a 3 passaggi**, replica del flusso collaudato su `002MnFAT` (vedi commit `2067d48`):
  `/auth` (OTP email) → `/attivazione` (licenza + PUK) → `/condizioni` (accettazione ToS 4 lingue) → SaaS accessibile, con rivalidazione della licenza a ogni navigazione e contatore export PDF (badge + banner ultimo credito + dialog bloccante a esaurimento).
  Dati su DB esterno condiviso `ruopxyprezzxoirfrjrm`, prodotto `001TARATURE` già in `product_catalog`.

### Da fare (TODO)

1. **Secret Lovable**: impostare `EXTERNAL_SUPABASE_URL` e `EXTERNAL_SUPABASE_SERVICE_ROLE_KEY` (stessi valori già usati dagli altri prodotti sul DB condiviso) nell'ambiente di questo progetto Lovable — senza questi il login/licensing non funziona.
2. **Connector Resend**: collegare/attivare su questo specifico progetto Lovable e impostare `RESEND_API_KEY` + `LOVABLE_API_KEY` — necessari per l'invio dei codici OTP (passaggio 1). Senza, la richiesta OTP fallisce con `E-010`.
3. **Licenza di test**: generare almeno una licenza + PUK per `app_code = 001TARATURE` (via SQL diretto sul DB condiviso o script PowerShell già in uso per gli altri prodotti) e fare un test end-to-end reale: attivazione nuova, riattivazione stesso utente, PUK già claimato, PUK/licenza inesistenti, licenza scaduta, ultimo credito PDF → banner, credito a zero → dialog bloccante + rivalidazione che reindirizza a `/licenza-scaduta`.
4. **`bun.lock`**: non ancora rigenerato (aggiunta `@supabase/supabase-js` fatta con `npm` in ambiente sandbox senza `bun`) — verificare che il primo build su Lovable/Cloudflare lo risolva da solo, altrimenti rigenerarlo manualmente.
5. **Moduli "In preparazione"**: le card oltre a BOMB-CON non hanno ancora logica/UI: da implementare quando pronte, riusando la stessa struttura di cartella (`src/modules/<NOME>/`) e lo stesso `ModulePage.tsx`/pattern del contatore PDF.
6. **Verifica vincoli DB** (solo se non già controllati per questo prodotto): FK `puk_codes.user_id → public.users` (non `auth.users`), colonna `licenses.activated_at` presente, niente `license_key` duplicate per `001TARATURE`.

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/b5b3125c-0322-4e31-9fc5-99f9fbf07484).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
