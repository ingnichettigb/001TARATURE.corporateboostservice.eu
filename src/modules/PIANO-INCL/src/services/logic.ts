import type { FieldDef, ModuleCalcOutput, ModuleLogic, ModuleValues } from "@/common/module-types";

/**
 * CUORE LOGICO DEL MODULO PIANO-INCL (livello 3).
 *
 * Sostituisci il contenuto di questo file con il codice importato da ZIP.
 * Mantieni le firme esportate: la struttura del modulo non va toccata.
 */

export function getInputSchema(): FieldDef[] {
  return [
    { key: "dInt", label: "Diametro interno", unit: "mm", defaultValue: 2000 },
    { key: "lCil", label: "Altezza cilindrica", unit: "mm", defaultValue: 3000 },
    { key: "rho", label: "Peso specifico", unit: "kg/dm³", defaultValue: 1 },
  ];
}

export function calculate(values: ModuleValues): ModuleCalcOutput {
  // TODO: inserire qui il calcolo reale del modulo.
  void values;
  return {
    summary: [],
    notes: [
      "Cuore logico non ancora implementato: sostituisci src/services/logic.ts con il codice del modulo.",
    ],
  };
}

export function getPdfFooterNote(): string {
  return "Documento generato dal modulo PIANO-INCL — Taratura Serbatoi.";
}

export const logic: ModuleLogic = { getInputSchema, calculate, getPdfFooterNote };

export default logic;
