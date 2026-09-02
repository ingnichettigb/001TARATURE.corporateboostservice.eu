# Numero di relazione progressivo per stampa multipla

## Problema confermato
Il numero di relazione è formato come `AAAAMMGGhhmm-01` (timestamp + suffisso fisso "-01") ed è calcolato **una sola volta** nel controller (`reportNumber` in `BombConApp.tsx` e negli equivalenti CON-BOMB e PIANO-CON). In modalità di stampa "multiplo" (un PDF per ogni numero di fabbrica) tutti i PDF escono con lo **stesso numero**, perché vengono generati nello stesso minuto e il suffisso non cambia.

## Soluzione
Nella stampa multipla, il suffisso finale del numero di relazione diventa **progressivo per ogni PDF generato**:

```text
1° serbatoio → 202609020830-01
2° serbatoio → 202609020830-02
3° serbatoio → 202609020830-03
...
```

- La parte timestamp (`AAAAMMGGhhmm`) resta identica per tutto il ciclo di stampa (è il "lotto" della stampa).
- Il suffisso riparte da `01` a ogni nuova sessione di stampa multipla.
- La stampa singola (modalità "unico") resta invariata con suffisso `-01`.
- Il numero progressivo comparirà ovunque il numero di relazione è stampato nel PDF (intestazione pagina 1 e intestazioni delle pagine successive), perché viene passato come parametro a `generateCalibrationPDF`.

## Modifiche tecniche
Nei controller dei moduli che supportano la stampa multipla:
- `src/modules/BOMB-CON/src/controllers/BombConApp.tsx`
- `src/modules/CON-BOMB/src/controllers/ConBombApp.tsx`
- `src/modules/PIANO-CON/src/controllers/PianoConApp.tsx`

Nel ciclo `for` della stampa multipla:
1. Derivare la base del numero (`reportNumber` senza suffisso, oppure sostituire il suffisso finale).
2. Per l'indice `i` del ciclo, comporre `reportNumberPerDoc = base + '-' + String(i + 1).padStart(2, '0')`.
3. Passare `reportNumberPerDoc` a `generateCalibrationPDF` al posto del `reportNumber` fisso.

Nessuna modifica a `pdf.ts` (riceve già il numero come parametro) né alla quota export (resta 1 credito per PDF).

## Verifica
- Stampa multipla con 3 numeri di fabbrica → 3 PDF con relazione `-01`, `-02`, `-03`.
- Stampa singola → relazione `-01` come prima.
- Build/typecheck OK.
