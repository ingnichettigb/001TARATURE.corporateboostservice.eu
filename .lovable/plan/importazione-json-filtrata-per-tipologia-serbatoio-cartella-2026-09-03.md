# Importazione JSON filtrata per tipologia serbatoio (cartella collegata)

## Obiettivo

Quando si importa un file JSON in un modulo (es. BOMB-CON), l'app propone **solo** i file della tipologia del modulo aperto, sfruttando il prefisso già presente nei nomi file (`BOMB-CON_...json`, `CON-BOMB_...json`, ecc.). Limite tecnico: il selettore file del sistema operativo non può filtrare per prefisso del nome — per questo si usa la File System Access API (Chrome/Edge): l'utente collega una volta la cartella dove salva i JSON e l'app mostra una lista interna filtrata.

## Cosa cambia per l'utente

- Pulsante "Importa JSON": al primo utilizzo viene chiesto di **collegare la cartella** dei file di taratura (una volta sola; il collegamento viene ricordato).
- All'importazione si apre un **pannello interno all'app** che elenca **solo** i `.json` che iniziano col prefisso della tipologia del modulo aperto (es. in CON-BOMB compaiono solo `CON-BOMB_*.json`). Un click carica il file.
- Nel pannello: nome file, data modifica, pulsante "Cambia cartella" e possibilità di ricollegare/scollegare.
- I file senza prefisso corrispondente non vengono nemmeno mostrati.
- Resta attivo come rete di sicurezza il controllo `tankType` già esistente (dialog di mismatch) nel caso un file venga caricato comunque dal percorso classico.
- **Fallback**: su browser che non supportano la File System Access API (Firefox, Safari) il pulsante continua ad aprire il selettore file classico `.json` con gli avvisi attuali.
- Nessuna modifica a salvataggio locale, export, PDF o logica di calcolo.

## Dettagli tecnici

**Nuovo `src/common/tanks/folder.ts`**
- Persistenza dell'handle della directory in IndexedDB (gli handle non sono serializzabili in localStorage): `getLinkedFolder()`, `setLinkedFolder(handle)`, `clearLinkedFolder()`.
- `supportsFolderAccess()` → feature-detect di `window.showDirectoryPicker`.
- `pickAndLinkFolder()` → apre `showDirectoryPicker()`, verifica/ri-chiede il permesso di lettura (`queryPermission`/`requestPermission`) e salva l'handle.
- `listTankFiles(handle, tankType)` → itera le entries della cartella e restituisce solo i file `.json` il cui nome inizia con `${tankType}_` (case-insensitive), ordinati per data modifica decrescente, con `name`, `lastModified`, `handle`.
- `readTankFile(fileHandle)` → legge il testo del file.

**Nuovo `src/common/tanks/ImportFromFolderDialog.tsx`**
- Modal che mostra la lista filtrata; stati: cartella non collegata (invito a collegarla), permesso scaduto (ri-autorizza), lista vuota (messaggio "nessun file <TIPO>_*.json nella cartella"), lista file con click-to-import.
- Pulsanti "Cambia cartella" e "Annulla".

**Modifiche a `SavedTanksList.tsx` dei 3 moduli completi (BOMB-CON, CON-BOMB, PIANO-CON)**
- Il pulsante "Importa JSON" diventa un bottone (non più solo `<label>` con input file):
  - se `supportsFolderAccess()` → apre `ImportFromFolderDialog`;
  - altrimenti → mantiene l'`<input type="file" accept=".json">` attuale.
- Il file scelto dal dialog viene passato allo stesso `parseTankFile`/`importParsedTank` già esistenti (mismatch dialog e avvisi legacy invariati).
- Il nome usato per l'import resta il nome reale del file su disco (senza estensione), coerente col comportamento attuale.

## Note

- Il collegamento alla cartella è per-browser e per-origine (IndexedDB); dopo un cambio browser o pulizia dati va ricollegato.
- La verifica avverrà su Chromium (preview) con la cartella dei JSON esportati: controllo che in ogni modulo compaiano solo i file col prefisso corretto e che il fallback del selettore classico resti funzionante.
