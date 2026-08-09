# TARATURA SERBATOI — App matrioska modulare

Struttura a 3 livelli: homepage-menu → moduli identici → cuore logico sostituibile.

## Livello 1 — Homepage (menu)

- `/` diventa una dashboard pulita e responsive con una griglia di card.
- Ogni card: icona, titolo, descrizione breve, badge di stato (Attivo / In preparazione).
- Le card sono generate da `src/config/modules.json`: aggiungendo una voce lì compare un nuovo modulo in home, senza toccare la homepage.
- Moduli iniziali: BOMB-CON (dallo ZIP, completo) + BOMB-BOMB, COC-CON, CON-BIOM, PIANO-BOMB, PIANO-CON (scheletri pronti).

## Livello 2 — Struttura identica per ogni modulo

Cartella dedicata per ciascuno: `src/modules/<nome-modulo>/`

```text
src/modules/<nome-modulo>/
  ModulePage.tsx        pagina principale (header + 4 sezioni)
  sections/InputSection.tsx
  sections/CalcSection.tsx
  sections/OutputSection.tsx
  sections/PdfSection.tsx
  core/logic.ts         cuore logico del modulo
  core/pdf.ts           generazione PDF del modulo
  config.ts             titolo, unità, campi di input
```

Ogni pagina modulo ha lo stesso layout: intestazione con nome modulo e ritorno al menu, poi Input → Calcolo → Output → PDF. Duplicare un modulo = copiare la cartella e cambiare `core/`.

Rotte: `src/routes/moduli.$moduleId.tsx` risolve il modulo dalla configurazione e monta la pagina corrispondente (nessuna rotta da scrivere a mano per ogni nuovo modulo).

## Livello 3 — Cuore logico

`core/logic.ts` espone sempre la stessa interfaccia (`getInputSchema`, `calculate`, `getOutputTables`), così le sezioni UI restano invariate. Nei moduli nuovi le funzioni sono placeholder vuoti pronti a ricevere il codice da ZIP; ogni modulo funziona in autonomia con la sua logica e non condivide stato con gli altri.

## Importazione dello ZIP (BOMB-CON completo)

Dall'archivio `bomb-con-app-main` porto dentro `src/modules/bomb-con/`:

- `utils/calculations.ts` → `core/logic.ts`
- `utils/pdfGenerator.ts` → `core/pdf.ts`
- `types.ts`, `utils/translations.ts` → `core/`
- `App.tsx` e i componenti (TankInputForm, GeometrySchema, ResultsDashboard, CalibrationTable, SavedTanksList, InfoModal, CompilerConfigModal) → dentro il modulo, agganciati alle 4 sezioni standard.

Il file `GeometrySchema.backup.tsx` non viene importato.

## Componenti riutilizzabili

`src/components/module/`: `ModuleShell`, `SectionCard`, `NumberField` / `SelectField`, `ResultTable`, `PdfExportButton`, `ModuleCard` (homepage). Tutti i moduli usano questi, così l'estetica resta identica.

## Note tecniche

- Stack invariato: React 19 + TanStack Start/Router, Tailwind v4, shadcn/ui.
- Pacchetti da installare: `jspdf`, `jspdf-autotable`, `recharts`, `motion` (usati dal codice ZIP).
- Design system: token semantici in `src/styles.css` (tema tecnico/industriale, no viola generico); nessun colore hardcoded nei componenti.
- Nessun backend: i dati salvati restano locali al browser (come nell'app originale).
- SEO: `head()` dedicato su homepage e sulla rotta modulo.
