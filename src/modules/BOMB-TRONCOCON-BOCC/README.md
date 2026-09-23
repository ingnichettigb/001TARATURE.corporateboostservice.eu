# Moduli — struttura a carte autonome

Il core (`src/routes/`, `src/common/`) non contiene logica di modulo.
Ogni carta è una cartella autonoma che può essere aggiunta o rimossa senza
toccare il core.

```text
src/modules/<NOME-MODULO>/
  index.ts                 export run<NomeModulo>() → { id, definition, Page }
  src/
    controllers/           pagina principale e componenti UI del modulo
    services/              logica di calcolo, PDF, esportazioni
    utils/                 formattazioni, traduzioni
    models/                tipi e strutture dati
  assets/
    images/                icona della carta
    data/module.json       id, titolo, sottotitolo, descrizione, immagine, stato
```

File condivisi: `src/common/` (config, logger, helpers, tipi comuni, UI
riutilizzabile, dati comuni dell'intestazione report).

## Aggiungere una carta in 3 passi

1. `cp -r src/modules/BOMB-BOMB src/modules/NUOVO-MODULO`
2. Aggiorna `assets/data/module.json` (id univoco, titolo, descrizione, icona)
   e rinomina la funzione esportata in `index.ts` (es. `runNuovoModulo`).
3. Aggiungi la riga in `src/modules/registry.ts`.

La carta compare subito in homepage e su `/moduli/<id>`.

## Sostituire il cuore logico (codice da ZIP)

Il calcolo vive in `src/services/logic.ts` e mantiene sempre le stesse firme
(`getInputSchema`, `calculate`, `getPdfFooterNote`): puoi sostituire il file con
il codice importato senza modificare la struttura del modulo né il core.

`BOMB-CON` è l'esempio di carta completa: controller in `src/controllers/`,
calcoli e PDF in `src/services/`, tipi in `src/models/`, traduzioni in
`src/utils/`.
