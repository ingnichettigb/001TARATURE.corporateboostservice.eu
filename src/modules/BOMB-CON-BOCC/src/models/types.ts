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
  hCono?: number;     // altezza totale (tronco di cono + raccordo + colletto) (mm) — solo per type='conico'
  rRaccordo?: number; // raggio raccordo cono/colletto (mm) — solo per type='conico'
  /**
   * BOMB-CON-BOCC: diametro INTERNO della base minore del tronco di cono (mm),
   * cioè del fondo piano che chiude il cono in basso. Solo per type='conico'.
   * 0 / assente = cono a punta (comportamento identico a BOMB-CON).
   */
  dMin?: number;
  /**
   * BOMB-CON-BOCC: diametro INTERNO del tronchetto/bocchello (mm) saldato sotto
   * la base minore del tronco di cono. Solo per type='conico'.
   * Vincolo: 0 <= dBocc <= dMin (non può essere più largo della base piccola del cono).
   * Se dBocc = dMin il tronchetto prosegue senza gradino; se dBocc < dMin resta un
   * disco piano di riduzione (corona circolare) tra il cono e il tronchetto.
   * 0 / assente = nessun tronchetto (comportamento identico a BOMB-TRONCOCON).
   */
  dBocc?: number;
  /**
   * BOMB-CON-BOCC: altezza del tronchetto/bocchello (mm), tratto cilindrico
   * aggiunto sotto la base minore del tronco di cono. Solo per type='conico'.
   * 0 / assente = nessun tronchetto.
   */
  hBocc?: number;
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
  lCil: number;       // lunghezza/altezza parte cilindrica (mm)
  spVirola: number;   // spessore lamiera virola (mm)
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
  /** Raggio della base minore del tronco di cono (mm). 0 per cono a punta e per le teste non coniche. */
  rMin: number;
  /** Raggio del tronchetto/bocchello (mm). 0 se assente. Sempre <= rMin. */
  rBocc: number;
  /** Altezza del tronchetto/bocchello (mm). 0 se assente. */
  hBocc: number;
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
  /**
   * Area del disco piano che chiude la base minore del tronco di cono (m²).
   * Se è presente un tronchetto (rBocc > 0) è una corona circolare
   * (π·(rMin²-rBocc²)); altrimenti è il disco pieno (π·rMin²). 0 se non presente.
   */
  Area_fondo_piatto_mq: number;
  /** Volume del tronchetto/bocchello cilindrico (litri). 0 se assente. */
  V_bocchello: number;
  /** Superficie laterale del tronchetto/bocchello (m²). 0 se assente. */
  Area_bocchello_laterale_mq: number;
  /** Disco piano che chiude il fondo del tronchetto/bocchello (m²). 0 se assente. */
  Area_bocchello_fondo_mq: number;
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
  z7: number;
  /** Quota (mm) di fine tronchetto/bocchello del fondo, misurata dalla punta del tronchetto (0 se assente). */
  z0: number;
  H_tot: number;
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
  litriCumulativi: number[]; // index is h (0 to H_tot)
  raggioProfile: number[];   // index is h (0 to H_tot), where 0 is 0
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

