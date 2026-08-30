# Import / export e salvataggio serbatoi per tipologia

Oggi il salvataggio locale usa una chiave unica (`bomb_bomb_saved_tanks`) condivisa da tutti i moduli, e i file JSON esportati non contengono alcun identificativo di tipologia: un file di BOMB-CON può essere caricato per errore in CON-BOMB. Va introdotto un `tankType` e una separazione dei dati per modulo, tramite un unico helper condiviso.

Nota sullo stato attuale: dei 19 moduli registrati solo BOMB-CON e CON-BOMB hanno il programma completo con lista serbatoi salvati; gli altri sono ancora schede/placeholder. L'helper viene scritto una volta in `src/common/` e agganciato ai due moduli completi; ogni nuovo modulo lo userà senza scrivere altro codice.

## Cosa cambia per l'utente

- Ogni tipologia di serbatoio ha la propria lista di configurazioni salvate, indipendente dalle altre.
- I file JSON esportati contengono la tipologia di serbatoio, il nome e la data di salvataggio.
- Importando un JSON di un'altra tipologia compare un avviso chiaro con la tipologia del file e quella del modulo aperto, e un pulsante per aprire il modulo corretto.
- I vecchi file JSON senza tipologia restano importabili, con un avviso giallo di avvertimento.

## Dettagli tecnici

**Nuovo modulo condiviso `src/common/tanks/`**

- `types.ts`: `TankFileV1 = { version: "1.0"; tankType: string; name: string; savedAt: string; input: unknown; compilerInfo?: unknown }` e tipo `SavedTankRecord`.
- `storage.ts`:
  - `savedTanksKey(tankType) => \`tanks_saved_${tankType}\``
  - `loadSavedTanks(tankType)`, `saveTanks(tankType, tanks)`, `addTank`, `removeTank`, `renameTank`, con dispatch dell'evento `saved-tanks-updated` già in uso.
  - migrazione una-tantum: al primo accesso di BOMB-CON, se esiste `bomb_bomb_saved_tanks` e non esiste ancora `tanks_saved_BOMB-CON`, i dati vengono copiati nella nuova chiave (la vecchia resta intatta).
- `file.ts`:
  - `buildTankFile(tankType, name, input, compilerInfo)` produce l'oggetto con i metadati richiesti; `downloadTankFile(...)` gestisce il download.
  - `parseTankFile(raw, currentTankType)` restituisce `{ status: 'ok' | 'mismatch' | 'legacy' | 'invalid', tankType?, name, input, compilerInfo, message }`, riconoscendo sia il nuovo formato sia i due formati legacy già supportati (oggetto `{name, input}` e input grezzo con `dInt/lCil/fondo`).
- `ImportMismatchDialog.tsx`: modal riutilizzabile con il messaggio "questo file appartiene al serbatoio tipo X, ma ti trovi nel modulo Y", pulsante "Apri modulo X" (navigazione a `/moduli/<id>` risolto dal registro moduli) e "Annulla".

**tankType**

Costante esportata dal modulo (es. `export const TANK_TYPE = 'BOMB-CON'` in `src/modules/BOMB-CON/src/constants.ts`), coincidente col nome cartella. La mappatura `tankType -> route id` (es. `BOMB-CON` -> `bomb-con`) è una semplice minuscolizzazione, validata contro `moduleEntries`.

**Aggiornamenti nei moduli BOMB-CON e CON-BOMB**

- `SavedTanksList.tsx`: nuova prop `tankType`; letture/scritture localStorage tramite `storage.ts`; export singolo ed export in salvataggio tramite `buildTankFile`; import tramite `parseTankFile` con dialog in caso di mismatch e avviso in caso di file legacy.
- `BombConApp.tsx` / `ConBombApp.tsx`: `handleSaveAndDownload` usa gli helper condivisi al posto della chiave hardcoded e passa `tankType` a `SavedTanksList`.

Nessuna modifica alla logica di calcolo, ai PDF o alla quota di esportazione.
