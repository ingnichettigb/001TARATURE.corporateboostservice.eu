# Struttura modulare a cartelle autonome

Riorganizzo il progetto secondo lo schema richiesto, mantenendo il build React/TanStack funzionante: le cartelle dei moduli vivono sotto `src/modules/`, i file condivisi in `src/common/`, e un unico router centrale.

## Struttura finale

```text
src/
├── common/                 file condivisi (nessuna logica di modulo)
│   ├── config.ts           costanti + caricamento elenco moduli
│   ├── logger.ts
│   ├── helpers.ts
│   ├── module-types.ts     contratto comune dei moduli
│   └── report-header/      intestazione report (dati comuni)
│
├── modules/
│   ├── BOMB-CON/
│   │   ├── index.ts        export runBombCon()
│   │   ├── src/
│   │   │   ├── controllers/   pagina + sezioni UI del modulo
│   │   │   ├── services/      calcoli, PDF, cattura schema
│   │   │   ├── utils/         formattazioni, traduzioni
│   │   │   └── models/        tipi e strutture dati
│   │   └── assets/
│   │       ├── images/
│   │       └── data/          config del modulo (json)
│   ├── BOMB-BOMB/    (stessa struttura)
│   ├── CON-BOMB/     (stessa struttura)
│   ├── CON-CON/      (stessa struttura)
│   ├── PIANO-BOMB/   (stessa struttura)
│   └── PIANO-CON/    (stessa struttura)
│
└── routes/
    ├── index.tsx           menu (card dai moduli registrati)
    ├── moduli.$moduleId.tsx  router: importa solo gli index dei moduli
    └── dati-comuni.tsx     pagina dati comuni
```

## Contratto di ogni modulo

Ogni `index.ts` esporta una funzione principale che restituisce il controller principale del modulo:

- `runBombCon()`, `runBombBomb()`, `runConBomb()`, `runConCon()`, `runPianoBomb()`, `runPianoCon()`

Ogni funzione restituisce `{ id, definition, Page }`, dove `Page` è il controller principale della cartella `src/controllers/`. Il router centrale non conosce nulla del contenuto: legge il registro dei moduli e monta `Page`.

## Router centrale

`src/modules/registry.ts` contiene solo l'elenco degli import lazy degli `index.ts`. Aggiungere o togliere una carta = aggiungere/togliere una riga lì e la cartella. Homepage e rotta modulo non cambiano.

Ogni modulo porta la propria scheda (titolo, sottotitolo, descrizione, icona, stato) in `assets/data/module.json` + `assets/images/`, quindi `src/config/modules.json` centrale viene rimosso: la homepage costruisce le card dal registro.

## Spostamento del codice BOMB-CON

Comportamento identico, solo riorganizzazione:

- `core/logic.ts`, `core/pdf.ts`, `core/extended-validity.ts`, `core/captureGeometry.tsx` → `src/services/`
- `core/types.ts` → `src/models/`
- `core/translations.ts` → `src/utils/`
- `BombConApp.tsx`, `ModulePage.tsx`, `components/*` → `src/controllers/`
- icona → `assets/images/`

## Moduli scheletro

Gli altri cinque conservano il loro placeholder in `src/services/logic.ts` con le stesse firme (`getInputSchema`, `calculate`, `getPdfFooterNote`), pronte per ricevere il codice da ZIP senza toccare la struttura.

## Note tecniche

- I componenti UI riutilizzabili (`ModuleShell`, `SectionCard`, `FieldGrid`, `ResultView`, `PdfExportButton`, `ModuleTemplatePage`, `ModuleCard`) restano condivisi in `src/common/ui/`, non duplicati nei moduli.
- Nomi cartelle in maiuscolo come richiesto; gli id di rotta restano minuscoli (`/moduli/bomb-con`) per non rompere i link esistenti.
- `README.md` dei moduli aggiornato con la procedura "aggiungi una carta in 3 passi".
- Nessun cambio di logica di calcolo, PDF o dati salvati.
