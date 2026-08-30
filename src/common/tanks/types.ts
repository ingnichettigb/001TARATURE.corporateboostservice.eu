/** Tipi condivisi per import/export/salvataggio delle configurazioni serbatoio. */

export const TANK_FILE_VERSION = "1.0" as const;

/** Struttura del file JSON esportato (formato v1). */
export interface TankFileV1<TInput = unknown, TCompiler = unknown> {
  version: typeof TANK_FILE_VERSION;
  /** Nome esatto della cartella del modulo, es. "BOMB-CON". */
  tankType: string;
  name: string;
  /** Data ISO di salvataggio. */
  savedAt: string;
  input: TInput;
  compilerInfo?: TCompiler;
}

/** Voce salvata nella lista locale del modulo. */
export interface SavedTankRecord<TInput = unknown, TCompiler = unknown> {
  id: string;
  name: string;
  /** Data leggibile (it-IT) mostrata in lista. */
  date: string;
  savedAt?: string;
  tankType?: string;
  input: TInput;
  compilerInfo?: TCompiler;
}

export type ParseStatus = "ok" | "mismatch" | "legacy" | "invalid";

export interface ParsedTankFile<TInput = unknown, TCompiler = unknown> {
  status: ParseStatus;
  /** tankType dichiarato nel file (assente nei file legacy). */
  tankType?: string;
  name: string;
  input?: TInput;
  compilerInfo?: TCompiler;
  message?: string;
}
