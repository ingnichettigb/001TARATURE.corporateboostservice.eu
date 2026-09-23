/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import type {
  TankInput,
  FondoConicoBoccResult,
  CoperchioPianoResult,
  CalculationResult,
} from '../models/types';

/**
 * Motore geometrico del modulo PIANO-CON-BOCC.
 *
 * Il fondo conico riusa esattamente il metodo del modulo BOMB-CON
 * (bisezione dell'angolo del cono, raccordo toroidale cono/colletto,
 * baricentro di Pappo-Guldino) per determinare l'inclinazione del cono
 * IDEALE (a punta) a partire dall'altezza totale dichiarata.
 *
 * La sola differenza è che il cono ideale non viene realizzato fino alla
 * punta: viene troncato al raggio del bocchello e proseguito con un
 * tratto cilindrico (il bocchello). Il cono retto diventa così un tronco
 * di cono, con il relativo volume ricalcolato.
 *
 * Il coperchio piano ("Piano / Senza Bombatura") non contribuisce con
 * nessuna calotta: solo l'eventuale colletto aggiunge altezza e volume.
 */

/** Trova per bisezione l'angolo (gradi) del cono ideale che dà l'altezza netta richiesta. */
function solveConeAngle(R_base: number, r_racc: number, H_netTarget: number): number {
  const H_of = (alfaDeg: number) => {
    const a = (alfaDeg * Math.PI) / 180;
    const Z = r_racc * Math.sin(a);
    const K = r_racc - Z;
    const Y = R_base - K;
    const Hc = Y * Math.tan(a);
    const Hr = r_racc * Math.cos(a);
    return Hc + Hr;
  };
  let lo = 0.01;
  let hi = 89.99;
  for (let i = 0; i < 60; i++) {
    const mid = (lo + hi) / 2;
    if (H_of(mid) - H_netTarget < 0) lo = mid;
    else hi = mid;
  }
  return (lo + hi) / 2;
}

export function calculateFondoConicoBocchello(input: TankInput): FondoConicoBoccResult {
  const R_base = input.dInt / 2;
  const r_racc = Math.max(0, input.rRaccordoFondo);
  const H_input_totale = Math.max(1, input.hConoFondo);
  const H_netTarget = Math.max(1, H_input_totale - input.hCollettoFondo);

  const alfa = solveConeAngle(R_base, r_racc, H_netTarget);
  const alfaRad = (alfa * Math.PI) / 180;
  const betaDeg = 90 - alfa;
  const betaRad = (betaDeg * Math.PI) / 180;

  const Z = r_racc * Math.sin(alfaRad);
  const K = r_racc - Z;
  const Y = Math.max(0.01, R_base - K);
  const H_cono_ideale = Y * Math.tan(alfaRad); // altezza del cono pieno ideale (punta -> raccordo)
  const H_racc = r_racc * Math.cos(alfaRad);

  const r_bocc = input.diametroBocchello / 2;
  if (!(r_bocc > 0) || r_bocc >= Y) {
    throw new Error(
      `Il diametro bocchello (${input.diametroBocchello} mm) deve essere maggiore di 0 e inferiore al diametro alla base del raccordo del cono (Ø ${(2 * Y).toFixed(0)} mm).`,
    );
  }

  // Il cono ideale ha raggio lineare da 0 (punta) a Y (raccordo): tagliamo dove r = r_bocc.
  const h_taglio = H_cono_ideale * (r_bocc / Y);
  const H_tronco = H_cono_ideale - h_taglio;

  // Baricentro raccordo (Pappo-Guldino) — identico a BOMB-CON
  const Xr = R_base - r_racc;
  let Baric = Xr;
  if (r_racc > 0 && betaDeg > 0) {
    const denom = (r_racc * 2 * Math.PI) / 360 * betaDeg * 3;
    if (denom !== 0) {
      Baric = ((r_racc * 2 * 2 * r_racc * Math.sin(betaRad / 2)) / denom) * Math.cos(betaRad / 2) + Xr;
    }
  }

  // Quote cumulative dal fondo del bocchello (nuovo zero)
  const z1 = input.altezzaBocchello; // fine bocchello
  const z2 = z1 + H_tronco; // fine tronco (= inizio raccordo)
  const z3 = z2 + H_racc; // fine raccordo (= inizio colletto)
  const z4 = z3 + input.hCollettoFondo; // fine colletto fondo (= inizio virola)

  // Volumi (mm in ingresso, litri in uscita)
  const V_bocchello_L = (Math.PI * r_bocc * r_bocc * input.altezzaBocchello) / 1e6;
  const V_tronco_L = (Math.PI * H_tronco / 3) * (Y * Y + Y * r_bocc + r_bocc * r_bocc) / 1e6;
  const V_raccordo_L = (Math.PI * H_racc / 3) * (Y * Y + Xr * Y + Xr * Xr) / 1e6;
  const V_spicchio_L = (Baric * 2 * Math.PI * r_racc * r_racc * Math.PI / 360 * betaDeg) / 1e6;
  const V_colletto_L = (Math.PI * R_base * R_base * input.hCollettoFondo) / 1e6;
  const V_fondo_totale_L = V_bocchello_L + V_tronco_L + V_raccordo_L + V_spicchio_L + V_colletto_L;

  // Superfici (per il peso lamiera) — sviluppo tronco + bocchello + raccordo + colletto
  const slant_tronco = Math.sqrt(H_tronco * H_tronco + (Y - r_bocc) * (Y - r_bocc));
  const Area_tronco_mq = (Math.PI * (Y + r_bocc) * slant_tronco) / 1e6;
  const Area_bocchello_mq = (2 * Math.PI * r_bocc * input.altezzaBocchello) / 1e6;
  const Area_toro_mq = (2 * Math.PI * Baric * r_racc * betaRad) / 1e6;
  const Area_colletto_mq = (2 * Math.PI * R_base * input.hCollettoFondo) / 1e6;
  const Sviluppo_area_mq = Area_tronco_mq + Area_bocchello_mq + Area_toro_mq + Area_colletto_mq;
  const Peso_lamiera_kg = Sviluppo_area_mq * input.spFondo * 8; // 8 = densità acciaio kg/dm3 su mq*mm

  return {
    R_base,
    r_racc,
    alfa,
    beta: betaDeg,
    Y,
    r_bocc,
    H_cono_ideale,
    h_taglio,
    H_tronco,
    H_racc,
    Xr,
    Baric,
    z1,
    z2,
    z3,
    z4,
    V_bocchello_L,
    V_tronco_L,
    V_raccordo_L,
    V_spicchio_L,
    V_colletto_L,
    V_fondo_totale_L,
    Peso_lamiera_kg,
    Sviluppo_area_mq,
  };
}

export function calculateCoperchioPiano(input: TankInput): CoperchioPianoResult {
  const R_base = input.dInt / 2;
  const V_colletto_L = (Math.PI * R_base * R_base * input.hCollettoCoperchio) / 1e6;
  const Area_piatto_mq = (Math.PI * R_base * R_base) / 1e6;
  const Area_colletto_mq = (2 * Math.PI * R_base * input.hCollettoCoperchio) / 1e6;
  const Area_mq = Area_piatto_mq + Area_colletto_mq;
  const Peso_lamiera_kg = Area_mq * input.spCoperchio * 8;
  return { V_colletto_L, Peso_lamiera_kg, Area_mq };
}

/** Raggio del profilo interno del serbatoio all'altezza h (mm), h=0 = fondo del bocchello. */
function raggioProfiloAt(h: number, input: TankInput, fondo: FondoConicoBoccResult): number {
  const R_base = input.dInt / 2;

  if (h <= fondo.z1) {
    // zona bocchello: cilindro
    return fondo.r_bocc;
  }
  if (h <= fondo.z2) {
    // zona tronco di cono: raggio lineare da r_bocc a Y
    const t = fondo.H_tronco > 0 ? (h - fondo.z1) / fondo.H_tronco : 1;
    return fondo.r_bocc + (fondo.Y - fondo.r_bocc) * t;
  }
  if (h <= fondo.z3) {
    // zona raccordo toroidale cono/colletto (identica a BOMB-CON, zero traslato)
    const r_racc = fondo.r_racc;
    const dh = fondo.z3 - h; // 0 in cima (colletto), H_racc in fondo (tronco)
    let sinPhi = r_racc > 0 ? dh / r_racc : 0;
    if (sinPhi > 1) sinPhi = 1;
    if (sinPhi < 0) sinPhi = 0;
    const phi = Math.asin(sinPhi);
    return R_base - r_racc * (1 - Math.cos(phi));
  }
  // colletto fondo, virola, colletto coperchio: raggio costante
  return R_base;
}

export function calculateTank(input: TankInput): CalculationResult {
  const fondo = calculateFondoConicoBocchello(input);
  const coperchio = calculateCoperchioPiano(input);

  const H_tot = Math.round(fondo.z4 + input.lCil + input.hCollettoCoperchio);

  const raggioProfile = new Array<number>(H_tot + 1).fill(0);
  const litriCumulativi = new Array<number>(H_tot + 1).fill(0);

  for (let h = 1; h <= H_tot; h++) {
    const rVal = raggioProfiloAt(h, input, fondo);
    raggioProfile[h] = rVal;
    const Volume_fetta_L = (Math.PI * rVal * rVal * 1) / 1e6; // fetta di 1 mm
    litriCumulativi[h] = litriCumulativi[h - 1] + Volume_fetta_L;
  }

  const volumeFondo = fondo.V_fondo_totale_L;
  const volumeCoperchio = coperchio.V_colletto_L;
  const volumeCilindro = (Math.PI * Math.pow(input.dInt / 2, 2) * input.lCil) / 1e6;
  const volumeTotale = litriCumulativi[H_tot];

  const pesoLamieraFondo = fondo.Peso_lamiera_kg;
  const pesoLamieraCoperchio = coperchio.Peso_lamiera_kg;
  const spVirola = input.spVirola > 0 ? input.spVirola : input.spFondo;
  const pesoLamieraVirola = (Math.PI * (input.dInt + spVirola) * input.lCil * spVirola * 8) / 1e6;

  const pesoContenutoTotale = volumeTotale * input.rho;
  const pesoContenutoPerCmCilindro = (Math.PI * Math.pow(input.dInt / 2, 2) * 10 / 1e6) * input.rho;

  return {
    input,
    fondo,
    coperchio,
    H_tot,
    volumeFondo,
    volumeCilindro,
    volumeCoperchio,
    volumeTotale,
    pesoLamieraFondo,
    pesoLamieraVirola,
    pesoLamieraCoperchio,
    pesoContenutoTotale,
    pesoContenutoPerCmCilindro,
    litriCumulativi,
    raggioProfile,
  };
}
