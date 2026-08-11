/**
 * Contratto comune a tutti i moduli (livello 3 — "cuore logico").
 *
 * Ogni modulo espone un oggetto `ModuleLogic` con la stessa firma:
 * le sezioni Input / Calcolo / Output / PDF restano identiche per tutti,
 * cambia solo il contenuto di `core/logic.ts`.
 */

export type FieldType = "number" | "text" | "select";

export interface FieldDef {
  key: string;
  label: string;
  unit?: string;
  type?: FieldType;
  options?: { value: string; label: string }[];
  defaultValue?: number | string;
  help?: string;
}

export interface ResultRow {
  label: string;
  value: string | number;
  unit?: string;
  highlight?: boolean;
}

export interface ResultTableData {
  title?: string;
  columns: string[];
  rows: (string | number)[][];
}

export interface ModuleCalcOutput {
  summary: ResultRow[];
  table?: ResultTableData;
  notes?: string[];
}

export type ModuleValues = Record<string, number | string>;

export interface ModuleLogic {
  /** Campi mostrati nella sezione di input. */
  getInputSchema: () => FieldDef[];
  /** Cuore del calcolo: da sostituire con il codice importato da ZIP. */
  calculate: (values: ModuleValues) => ModuleCalcOutput;
  /** Etichette/righe extra per il PDF (opzionale). */
  getPdfFooterNote?: () => string;
}

export interface ModuleDefinition {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  /** Icona Lucide (es. "Cylinder"). */
  icon?: string;
  /** URL immagine personalizzata; ha la precedenza su `icon`. */
  image?: string;
  status: "active" | "draft";
}
