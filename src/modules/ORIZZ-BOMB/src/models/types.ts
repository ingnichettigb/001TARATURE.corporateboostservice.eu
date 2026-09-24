/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import type { ReportHeader } from '@/common/report-header/types';


export type HeadType = 'decinormale' | 'pseudoellittico' | 'custom' | 'conico';

export interface HeadConfig {
  type: HeadType;
  sp: number;         // spessore lamiera (mm)
  hColletto: number;  // altezza colletto (mm)
  R_custom?: number;  // raggio bombatura custom (mm)
  r_custom?: number;  // raggio raccordo custom (mm)
  hCono?: number;     // altezza totale (cono + raccordo) (mm) — solo per type='conico'
  rRaccordo?: number; // raggio raccordo cono/colletto (mm) — solo per type='conico'
}

export interface ReportMeta {
  cliente: string;
  riferimento: string;
  nomeSerbatoio: string;
  numeroDisegno: string;
  data: string;
  compilatore?: string;
  numeroFabbrica?: string;
  tagNumber?: string;
  validitaEstesa?: string;
  /** Elenco gestito dei numeri di fabbrica a cui è estesa la validità. */
  numeriFabbricaEstesi?: { numero: string; tag?: string; incluso: boolean }[];
  /** 'unico' = un solo PDF con tutti i numeri; 'multiplo' = un PDF per numero. */
  modalitaStampa?: 'unico' | 'multiplo';
  commessa?: string;
}

export interface TankInput {
  dInt: number;       // diametro interno serbatoio (mm)
  lCil: number;       // lunghezza parte cilindrica (mm)
  spVirola: number;   // spessore lamiera virola (mm)
  /**
   * Inclinazione dell'asse del serbatoio rispetto all'orizzontale (gradi).
   * Positivo = lato COPERCHIO più alto (fondo più basso); negativo = il contrario.
   * Assente/0 = serbatoio perfettamente orizzontale. Limitato a ±INCLINAZIONE_MAX.
   */
  inclinazione?: number;
  rho: number;        // peso specifico contenuto (kg/dm3)
  fondo: HeadConfig;
  coperchio: HeadConfig;
  report: ReportMeta;
}

export interface HeadCalculated {
  R: number;
  r: number;
  DR: number;
  X: number;
  alfa: number;
  beta: number;
  H1: number;
  H_int: number;
  H2: number;
  H3: number;
  Y: number;
  Baric: number;
  K: number;
  H_esterna_totale: number;
  V_calotta: number;
  V_toro: number;
  V_raccordo: number;
  V_colletto: number;
  V_testata_LT: number;
  Sviluppo_mm: number;
  Area_disco_da_tagliare_mq: number;
  Peso_lamiera_kg: number;
}


export interface CalculationResult {
  input: TankInput;
  fondo: HeadCalculated;
  coperchio: HeadCalculated;
  z1: number;
  z2: number;
  z3: number;
  z4: number;
  z5: number;
  z6: number;
  z7: number;         // = lunghezza interna totale lungo l'asse
  /** Livello massimo del liquido (mm) = escursione verticale interna (= diametro se non inclinato). */
  H_tot: number;
  /** Lunghezza interna totale lungo l'asse (mm), fondo + colletti + mantello + coperchio. */
  L_tot: number;
  /** Inclinazione effettivamente usata nel calcolo (gradi, già limitata a ±INCLINAZIONE_MAX). */
  inclinazione: number;
  /** Quota (mm) del punto interno più basso / più alto, con origine sulla punta del fondo (asse). */
  zBasso: number;
  zAlto: number;
  volumeFondo: number;
  volumeCoperchio: number;
  volumeCilindro: number;
  volumeTotale: number;
  pesoLamieraFondo: number;
  pesoLamieraCoperchio: number;
  pesoLamieraVirola: number;
  sviluppoFondoMq: number;
  sviluppoCoperchioMq: number;
  pesoContenutoTotale: number;
  pesoContenutoPerCmCilindro: number;
  litriCumulativi: number[]; // index = livello h in mm, misurato in verticale dal punto interno più basso (0 … H_tot)
  raggioProfile: number[];   // index = posizione x in mm lungo l'asse (0 … L_tot), 0 = estremità fondo
}

export interface SavedTank {
  id: string;
  name: string;
  date: string;
  input: TankInput;
  compilerInfo?: CompilerInfo;
}

// L'intestazione report è un DATO COMUNE: vive in src/shared/report-header.
export type CompilerInfo = ReportHeader;

