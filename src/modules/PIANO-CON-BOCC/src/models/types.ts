/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Modelli dati interni del modulo PIANO-CON-BOCC.
 *
 * NOTA: questi tipi sono usati SOLO internamente da `services/logic.ts` per
 * organizzare il calcolo. Il contratto verso `ModuleTemplatePage` resta
 * quello piatto definito in `@/common/module-types` (FieldDef / ModuleValues
 * / ModuleCalcOutput) — questo file non lo modifica e non lo estende.
 *
 * Geometria del modulo:
 *  - Coperchio: PIANO, senza bombatura (R infinita) — piastra piana +
 *    eventuale colletto.
 *  - Fondo: CONICO come in BOMB-CON (cono retto + raccordo toroidale
 *    cono/colletto + colletto), ma il cono NON termina a punta: viene
 *    troncato al diametro del BOCCHELLO e prosegue con un tratto
 *    cilindrico (il bocchello di scarico) di diametro e altezza propri.
 *    Il cono retto diventa quindi un tronco di cono.
 */

export interface TankInput {
  dInt: number; // diametro interno serbatoio (mm)
  lCil: number; // altezza sezione cilindrica / virola (mm)
  spVirola: number; // spessore lamiera virola (mm)
  rho: number; // peso specifico contenuto (kg/dm3)

  // --- fondo conico con bocchello ---
  spFondo: number; // spessore lamiera fondo (mm)
  rRaccordoFondo: number; // raggio raccordo cono/colletto (mm)
  hCollettoFondo: number; // altezza colletto fondo (mm)
  hConoFondo: number; // altezza "virtuale" fondo conico, colletto incluso, fino alla punta IDEALE del cono (mm) — serve solo a fissare l'inclinazione
  diametroBocchello: number; // diametro bocchello di scarico (mm)
  altezzaBocchello: number; // altezza bocchello di scarico (mm)

  // --- coperchio piano ---
  spCoperchio: number; // spessore lamiera coperchio piano (mm)
  hCollettoCoperchio: number; // altezza colletto coperchio piano (mm), 0 = nessun colletto

  // --- tabella di taratura ---
  passoTabella: number; // passo di campionamento della tabella (mm)
}

/** Esito del calcolo geometria fondo conico + bocchello (tronco di cono). */
export interface FondoConicoBoccResult {
  R_base: number; // raggio interno serbatoio (mm)
  r_racc: number; // raggio di raccordo cono/colletto (mm)
  alfa: number; // semiangolo al vertice del cono ideale (gradi)
  beta: number; // 90 - alfa (gradi)
  Y: number; // raggio alla sommità del tronco (= raggio base raccordo) (mm)
  r_bocc: number; // raggio del bocchello (mm)
  H_cono_ideale: number; // altezza del cono PIENO ideale (punta -> raccordo), usata solo per calcolare l'angolo (mm)
  h_taglio: number; // altezza (dalla punta ideale) alla quale il cono viene tagliato dal bocchello (mm)
  H_tronco: number; // altezza reale del tronco di cono (dal taglio al raccordo) (mm)
  H_racc: number; // altezza verticale del raccordo toroidale (mm)
  Xr: number; // ascissa baricentro raccordo (mm)
  Baric: number; // baricentro Pappo-Guldino del raccordo (mm)

  // quote cumulative dal FONDO del bocchello (nuovo zero della taratura)
  z1: number; // fine bocchello (fondo tronco)
  z2: number; // fine tronco (inizio raccordo)
  z3: number; // fine raccordo (inizio colletto)
  z4: number; // fine colletto fondo (inizio virola)

  V_bocchello_L: number;
  V_tronco_L: number;
  V_raccordo_L: number;
  V_spicchio_L: number;
  V_colletto_L: number;
  V_fondo_totale_L: number;

  Peso_lamiera_kg: number;
  Sviluppo_area_mq: number;
}

/** Esito del calcolo geometria coperchio piano. */
export interface CoperchioPianoResult {
  V_colletto_L: number;
  Peso_lamiera_kg: number;
  Area_mq: number;
}

export interface CalculationResult {
  input: TankInput;
  fondo: FondoConicoBoccResult;
  coperchio: CoperchioPianoResult;
  H_tot: number;
  volumeFondo: number;
  volumeCilindro: number;
  volumeCoperchio: number;
  volumeTotale: number; // da integrazione profilo 1 mm (autorevole, coerente con tabella)
  pesoLamieraFondo: number;
  pesoLamieraVirola: number;
  pesoLamieraCoperchio: number;
  pesoContenutoTotale: number;
  pesoContenutoPerCmCilindro: number;
  litriCumulativi: number[]; // indice = h (mm), 0..H_tot, zero = fondo bocchello
  raggioProfile: number[];
}
