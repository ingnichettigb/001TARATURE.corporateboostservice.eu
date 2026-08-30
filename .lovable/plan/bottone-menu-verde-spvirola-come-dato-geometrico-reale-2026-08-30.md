# Bottone "Menu" verde + spVirola come dato geometrico reale

## 1. Bottone "Menu" più visibile (Dati Comuni)

In `src/routes/dati-comuni.tsx` il link "← Menu" oggi è grigio su bianco. Diventa:
sfondo verde chiaro, bordo sottile verde scuro, testo nero in grassetto, hover leggermente
più intenso. Stessa cosa applicata al bottone "Menu" di `src/common/ui/ModuleShell.tsx`
(usato da tutti i sottoprogrammi) per coerenza visiva.

## 2. spVirola come campo geometrico permanente (BOMB-CON e CON-BOMB)

Oggi `spVirola` è opzionale (`spVirola?: number`), non ha un valore di default, non è
presente nel form e nello schema grafico è legato con fallback `?? 0` — per questo si
"azzera" e non compare nei salvataggi.

Interventi, identici nei due moduli:

- **types.ts**: `spVirola: number;` obbligatorio in `TankInput`. Nuovo campo
  `pesoLamieraVirola: number;` in `CalculationResult`.
- **BombConApp.tsx / ConBombApp.tsx**: `spVirola: 6` nel `defaultInput`; in
  `handleLoadTank` (caricamento serbatoi salvati / JSON) retrocompatibilità:
  se `spVirola` manca o è 0, usa `input.fondo.sp`. Il salvataggio già serializza
  l'intero `input`, quindi il campo verrà incluso automaticamente.
- **TankInputForm.tsx**: nuovo campo numerico "Spessore virola (mm)" nella sezione
  del mantello cilindrico, accanto a diametro e altezza, con label tradotta.
- **GeometrySchema.tsx**: binding diretto `value={input.spVirola}` senza `?? 0`;
  l'onChange continua ad aggiornare lo stato principale via `patch`.

## 3. Peso lamiera della virola

- **logic.ts**: calcolo unico
  `pesoLamieraVirola = π · (dInt + spVirola) · lCil · spVirola · 7,85e-6` (kg),
  restituito nel risultato e riusato ovunque.
- **pdf.ts** (PDF completo): riga "Peso lamiera" nel gruppo sezione cilindrica e
  `pesoTotLamiera = fondo + coperchio + virola`.
- **ResultsDashboard.tsx**: riga peso lamiera anche per la sezione cilindrica.
- **CalibrationTable.tsx** (PDF condensato): aggiungo la riga della virola anche qui,
  così i due PDF sono coerenti.

## Verifica

Typecheck/build e controllo a video delle due carte BOMB-CON e CON-BOMB: campo
spVirola valorizzato e persistente, pesi coerenti fra schermata, PDF completo e
PDF condensato.
