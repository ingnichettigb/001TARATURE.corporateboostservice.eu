# Moduli (struttura matrioska)

Livello 1: `src/routes/index.tsx` (menu) legge `src/config/modules.json`.
Livello 2: ogni modulo vive in `src/modules/<id>/` con la stessa struttura.
Livello 3: il cuore logico è in `src/modules/<id>/core/logic.ts`.

## Aggiungere un nuovo modulo

1. Copia una cartella scheletro, es. `cp -r src/modules/bomb-bomb src/modules/nuovo-id`.
2. In `src/modules/nuovo-id/config.ts` cambia `MODULE_ID` con il nuovo id.
3. Aggiungi la voce in `src/config/modules.json` (id, title, subtitle, description, icon, status).
4. Registra la pagina in `src/routes/moduli.$moduleId.tsx` nella mappa `pages`.
5. Incolla il codice importato da ZIP dentro `core/logic.ts` mantenendo le funzioni
   esportate `getInputSchema()` e `calculate()`.

La UI (Input → Calcolo → Output → PDF) resta identica: viene da
`src/components/module/ModuleTemplatePage.tsx`.

## Modulo con UI dedicata

`bomb-con` è l'esempio di modulo completo: il codice importato vive in
`BombConApp.tsx` + `components/`, con logica in `core/logic.ts` e PDF in `core/pdf.ts`.
