# Dati comuni: intestazione report condivisa

Nome cartella proposto: `src/shared/` (etichetta in UI: "Dati Comuni"). E' il nome piu' appropriato perche' conterra' in futuro anche altri dati trasversali (unita' di misura, anagrafiche clienti, preferenze lingua), non solo l'intestazione.

## Cosa cambia per te

- Una pagina dedicata `/dati-comuni` dove compili una sola volta l'intestazione del report (ditta, P.IVA, telefono, email, PEC, registro, indirizzo, logo, note).
- Sulla homepage una card/pulsante "Dati Comuni — Intestazione Report", visivamente distinta dalle card dei moduli.
- Dentro ogni sottoprogramma un link "Intestazione report" che porta alla stessa pagina comune (in BOMB-CON sostituisce il salvataggio locale del modulo).
- I dati compilati vengono letti automaticamente da tutti i moduli e stampati nei PDF/certificati, senza doverli reinserire.
- I dati gia' salvati oggi in BOMB-CON vengono migrati automaticamente alla prima apertura, quindi non perdi nulla.

## Struttura tecnica

```text
src/shared/
  report-header/
    types.ts        // tipo ReportHeader (ex CompilerInfo)
    storage.ts      // load/save su localStorage chiave "taratura_report_header" + migrazione da bomb_bomb_compiler_info
    useReportHeader.ts // hook con stato condiviso + sync tra tab
    ReportHeaderForm.tsx // form riusabile (dal CompilerConfigModal esistente, senza modale)
src/routes/dati-comuni.tsx  // pagina livello 1 con head() dedicato
```

- `CompilerInfo` in `src/modules/bomb-con/core/types.ts` diventa un alias di `ReportHeader` per non rompere gli import esistenti.
- `BombConApp.tsx`: rimuove lo stato locale/localStorage dell'intestazione e usa `useReportHeader()`; il pulsante attuale apre la pagina comune (il modale resta disponibile solo se preferisci la modifica in-place — di default lo rimuovo a favore della pagina).
- `ModuleShell` (usato dai moduli skeleton) e la barra di BOMB-CON ricevono il link "Intestazione report".
- La homepage `src/routes/index.tsx` legge le card moduli da `modules.json` come ora e aggiunge in cima/fondo una sezione "Dati Comuni".
- Persistenza solo lato browser (localStorage), come oggi. Nessun backend.
