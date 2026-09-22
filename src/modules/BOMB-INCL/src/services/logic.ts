/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { TankInput, HeadConfig, HeadCalculated, CalculationResult } from '../models/types';

/**
 * Calculates geometry and volumes for a single head (coperchio or fondo)
 */
/** Dislivello (mm) del fondo inclinato in funzione dell'angolo: Δ = Ø · tan(α). */
export function dislivelloFromAngle(alfaDeg: number, dInt: number): number {
  return dInt * Math.tan((alfaDeg * Math.PI) / 180);
}

/** Angolo (gradi) del fondo inclinato in funzione del dislivello: α = atan(Δ / Ø). */
export function angleFromDislivello(delta: number, dInt: number): number | null {
  if (!(dInt > 0) || !(delta > 0)) return null;
  const a = (Math.atan(delta / dInt) * 180) / Math.PI;
  return isFinite(a) && a > 0 && a < 90 ? a : null;
}

/** Raggio di raccordo massimo ammesso: 10% del diametro interno. */
export function raggioRaccordoMax(dInt: number): number {
  return Math.max(0, dInt * 0.1);
}

/** Vincola il raggio di raccordo all'intervallo [0, 10%·Ø] e comunque r < R. */
export function clampRaggioRaccordo(rIn: number, dInt: number): number {
  const R = dInt / 2;
  const max = Math.min(raggioRaccordoMax(dInt), R * 0.999);
  if (!isFinite(rIn) || rIn < 0) return 0;
  return Math.min(rIn, Math.max(0, max));
}

interface InclinedGeom {
  R: number;
  alfa: number;         // rad
  r: number;            // raggio di raccordo effettivo (mm)
  zMin: number;         // punto più basso reale = r·tanα·(1+sinα)
  Hr: number;           // quota di fine raccordo = Δ + r·(secα − tanα)
  rEqProfile: number[]; // raggio equivalente (mm) per mm dal punto più basso
  volumeCuneoMm3: number;
  areaPianoMm2: number;
  areaRaccordoMm2: number;
  areaStrisciaMm2: number; // striscia di VIROLA fra profilo fondo e quota Hr
}

/**
 * Superficie del fondo inclinato con raccordo a raggio costante (sfera rotolante
 * fra piano inclinato e parete cilindrica). z_b(x,y) = max(piano, envelope raccordo).
 * Integrazione numerica su griglia: volume, aree bagnate mm per mm.
 */
function buildInclinedGeom(dInt: number, delta: number, rIn: number): InclinedGeom {
  const R = dInt / 2;
  const alfa = Math.atan(delta / dInt);
  const m = Math.tan(alfa);
  const sec = 1 / Math.cos(alfa);
  const r = clampRaggioRaccordo(rIn, dInt);
  const rho = R - r;

  const Hr = m * (R + rho) + r * sec;          // = Δ + r(secα − tanα)
  const zMin = r * m * (1 + Math.sin(alfa));   // punto di tangenza più basso

  const N = 600;
  const step = (2 * R) / N;
  const cell = step * step;
  const PH = 360;
  const cosT = new Float64Array(PH);
  const sinT = new Float64Array(PH);
  const zcT = new Float64Array(PH);
  for (let k = 0; k < PH; k++) {
    const phi = (2 * Math.PI * k) / PH;
    cosT[k] = Math.cos(phi);
    sinT[k] = Math.sin(phi);
    zcT[k] = m * (R + rho * Math.cos(phi)) + r * sec;
  }

  const nBuckets = Math.max(2, Math.ceil(Hr - zMin) + 2);
  const hist = new Float64Array(nBuckets);
  let cells = 0;
  let sumDepth = 0;
  const r2 = r * r;

  // La curva di tangenza fra piano e raccordo è la circonferenza di raggio rho
  // centrata in (r·sinα, 0): dentro di essa la superficie è il piano inclinato,
  // fuori è la faccia INFERIORE dell'inviluppo delle sfere (minimo, non massimo).
  const xT = r * Math.sin(alfa);

  for (let i = 0; i < N; i++) {
    const x = -R + (i + 0.5) * step;
    for (let j = 0; j < N; j++) {
      const y = -R + (j + 0.5) * step;
      if (x * x + y * y > R * R) continue;
      cells++;
      let z = m * (R + x);
      if (r > 0) {
        const sx = x - xT;
        if (sx * sx + y * y > rho * rho) {
          let best = Infinity;
          for (let k = 0; k < PH; k++) {
            const dx = x - rho * cosT[k];
            const dy = y - rho * sinT[k];
            const d2 = dx * dx + dy * dy;
            if (d2 < r2) {
              const cand = zcT[k] - Math.sqrt(r2 - d2);
              if (cand < best) best = cand;
            }
          }
          if (isFinite(best) && best > z) z = best;
        }
      }
      if (z > Hr) z = Hr;
      if (z < zMin) z = zMin;
      sumDepth += Hr - z;
      let b = Math.floor(z - zMin);
      if (b < 0) b = 0;
      if (b >= nBuckets) b = nBuckets - 1;
      hist[b] += 1;
    }
  }


  const areaDisco = Math.PI * R * R;
  const norm = cells > 0 ? areaDisco / (cells * cell) : 1;
  const cumul = new Float64Array(nBuckets);
  let acc = 0;
  for (let b = 0; b < nBuckets; b++) {
    acc += hist[b] * cell * norm;
    cumul[b] = Math.min(acc, areaDisco);
  }

  // Area bagnata (mm²) alla quota t misurata dal punto più basso reale.
  // CDF campionata nei punti (b+1, cumul[b]) e interpolata linearmente.
  const areaAt = (t: number): number => {
    if (t <= 0) return 0;
    if (t >= Hr - zMin) return areaDisco;
    const p = t - 1; // indice reale nella tabella cumul
    if (p <= 0) return cumul[0] * t;
    const i0 = Math.min(nBuckets - 1, Math.floor(p));
    const i1 = Math.min(nBuckets - 1, i0 + 1);
    const f = p - i0;
    return cumul[i0] + (cumul[i1] - cumul[i0]) * f;
  };

  // Area analitica esatta del solo cuneo (segmento circolare), usata quando r = 0
  const areaCuneoAnalitica = (z: number): number => {
    if (z <= 0) return 0;
    if (z >= delta) return areaDisco;
    const a = Math.max(-R, Math.min(R, (2 * R * z) / delta - R));
    return R * R * Math.acos(-a / R) + a * Math.sqrt(Math.max(0, R * R - a * a));
  };

  const hMax = Math.ceil(Hr - zMin);
  const rEqProfile = new Array<number>(hMax + 1).fill(0);
  for (let h = 1; h <= hMax; h++) {
    // area a metà fetta (regola del punto medio): integrazione mm per mm accurata
    const tMid = h - 0.5;
    const A = r > 0 ? areaAt(tMid) : areaCuneoAnalitica(tMid);
    rEqProfile[h] = Math.sqrt(Math.max(0, A) / Math.PI);
  }

  const volumeCuneoMm3 = r > 0 ? sumDepth * cell * norm : (Math.PI * R * R * delta) / 2;


  // Lamiera del FONDO: piano inclinato residuo (dentro la curva di tangenza,
  // raggio rho) + fascia di raccordo (Pappo-Guldino sull'arco di raggio r).
  const areaPianoMm2 = Math.PI * rho * rho * sec;
  const areaRaccordoMm2 =
    2 * Math.PI * r * ((rho - r * Math.sin(alfa)) * (Math.PI / 2 - alfa) + r * Math.cos(alfa));
  // Lamiera di VIROLA: striscia fra il profilo del fondo e la quota Hr
  const areaStrisciaMm2 = 2 * Math.PI * m * R * rho;


  return { R, alfa, r, zMin, Hr, rEqProfile, volumeCuneoMm3, areaPianoMm2, areaRaccordoMm2, areaStrisciaMm2 };
}

export function calculateHead(dInt: number, config: HeadConfig): HeadCalculated {
  // === Fondo inclinato (piano tagliato in obliquo + raccordo verso il colletto) ===
  if (config.type === 'inclinato') {
    const R_base = dInt / 2;
    const delta = Math.max(0.1, config.hDislivello ?? dislivelloFromAngle(5, dInt));
    const alfa = angleFromDislivello(delta, dInt) ?? 0;
    const geom = buildInclinedGeom(dInt, delta, config.rRaccordo ?? 0);

    const H_fondo = geom.Hr - geom.zMin;     // altezza utile del fondo (senza colletto)
    const V_cuneo_L = geom.volumeCuneoMm3 / 1e6;
    const V_colletto_L = (Math.PI * R_base * R_base * config.hColletto) / 1e6;

    // Lamiera FONDO (spessore fondo): piano + raccordo + colletto
    const Area_fondo_mm2 = geom.areaPianoMm2 + geom.areaRaccordoMm2 + 2 * Math.PI * R_base * config.hColletto;
    const Area_fondo_mq = Area_fondo_mm2 / 1e6;
    const Peso_lamiera_kg = Area_fondo_mq * config.sp * 8;

    return {
      R: 0,
      r: geom.r,
      DR: 0,
      X: 0,
      alfa,
      beta: 90 - alfa,
      H1: 0,
      H_int: H_fondo,
      H2: 0,                // il raccordo è già compreso nella zona 1 integrata
      H3: H_fondo,          // zona 1 = cuneo inclinato + raccordo
      Y: R_base,
      Baric: 0,
      K: 0,
      H_esterna_totale: H_fondo + config.hColletto + config.sp,
      V_calotta: V_cuneo_L,
      V_toro: 0,
      V_raccordo: 0,
      V_colletto: V_colletto_L,
      V_testata_LT: V_cuneo_L + V_colletto_L,
      // D_eq = diametro equivalente per area (solo area FONDO, striscia esclusa)
      Sviluppo_mm: 2 * Math.sqrt(Area_fondo_mm2 / Math.PI),
      Area_disco_da_tagliare_mq: Area_fondo_mq,
      Peso_lamiera_kg,
      z_min: geom.zMin,
      H_r: geom.Hr,
      Area_striscia_virola_mq: geom.areaStrisciaMm2 / 1e6,
      rEqProfile: geom.rEqProfile,
    };
  }


  // === Testa conica (fondo conico retto con raccordo cono/colletto) ===
  if (config.type === 'conico') {
    const R_base = dInt / 2;
    const r_racc = Math.max(0, config.rRaccordo ?? 30);
    // config.hCono è l'ALTEZZA TOTALE DEL FONDO CONICO, COLLETTO INCLUSO.
    // La geometria cono+raccordo lavora sulla quota netta (senza colletto).
    const H_input_totale = Math.max(1, config.hCono ?? (R_base + config.hColletto));
    const H_totale_target = Math.max(1, H_input_totale - config.hColletto);

    // Data H_totale_target = H_cono_puro + H_racc, ricava alfa via bisezione.
    // H_totale(alfa) = (R_base - r_racc*(1 - sin(alfa))) * tan(alfa) + r_racc*cos(alfa)
    const H_of = (alfaDeg: number) => {
      const a = alfaDeg * Math.PI / 180;
      const Z = r_racc * Math.sin(a);
      const K = r_racc - Z;
      const Y = R_base - K;
      const Hc = Y * Math.tan(a);
      const Hr = r_racc * Math.cos(a);
      return Hc + Hr;
    };
    let lo = 0.01, hi = 89.99;
    for (let i = 0; i < 60; i++) {
      const mid = (lo + hi) / 2;
      if (H_of(mid) - H_totale_target < 0) lo = mid; else hi = mid;
    }
    const alfa = (lo + hi) / 2;
    const alfaRad = alfa * Math.PI / 180;
    const betaDeg = 90 - alfa;
    const betaRad = betaDeg * Math.PI / 180;

    // Geometria raccordo
    const Z = r_racc * Math.sin(alfaRad);
    const K = r_racc - Z;
    const Y = Math.max(0, R_base - K);
    const H_cono = Y * Math.tan(alfaRad);
    const H_racc = r_racc * Math.cos(alfaRad);
    const H_totale = H_cono + H_racc;

    // Baricentro dello spicchio di raccordo (Pappo-Guldino)
    const Xr = R_base - r_racc;
    let Baric = Xr;
    if (r_racc > 0 && betaDeg > 0) {
      const denom = (r_racc * 2 * Math.PI / 360 * betaDeg * 3);
      if (denom !== 0) {
        Baric = ((r_racc * 2 * 2 * r_racc * Math.sin(betaRad / 2)) / denom) * Math.cos(betaRad / 2) + Xr;
      }
    }

    // Volumi (mm in ingresso, litri in uscita)
    const V_cono_L = (Math.PI * Y * Y * H_cono) / 3 / 1e6;
    const V_tronco_L = (Math.PI * H_racc / 3) * (Y * Y + Xr * Y + Xr * Xr) / 1e6;
    const V_spicchio_L = (Baric * 2 * Math.PI * r_racc * r_racc * Math.PI / 360 * betaDeg) / 1e6;
    const V_cono_totale_L = V_cono_L + V_tronco_L + V_spicchio_L;

    const V_colletto_L = (Math.PI * R_base * R_base * config.hColletto) / 1e6;

    // Sviluppo lamiera: settore conico (approssimato con Y come raggio base cono) + fascia raccordo + colletto
    const slant_cono = Math.sqrt(Y * Y + H_cono * H_cono);
    const Sviluppo_mm = 2 * Math.PI * (R_base + config.sp / 2); // arco base (mm)
    const Area_lat_cono_mq = (Math.PI * Y * slant_cono) / 1e6;
    const Area_raccordo_mq = (2 * Math.PI * Xr * r_racc * betaDeg / 360 + 2 * Math.PI * r_racc * r_racc * (1 - Math.cos(betaRad)) / (2 * Math.PI)) / 1e6;
    // Fascia toroidale (approssimazione Pappo): 2π·Baric · (arco = r_racc·βRad)
    const Area_toro_mq = (2 * Math.PI * Baric * r_racc * betaRad) / 1e6;
    const Area_colletto_mq = (2 * Math.PI * R_base * config.hColletto) / 1e6;
    const Area_totale_mq = Area_lat_cono_mq + Area_toro_mq + Area_colletto_mq;
    void Area_raccordo_mq;
    const Peso_lamiera_kg = Area_totale_mq * config.sp * 8;

    return {
      R: 0,
      r: r_racc,
      DR: 0,
      X: Xr,
      alfa,
      beta: betaDeg,
      H1: H_racc,          // riusato: altezza verticale del raccordo
      H_int: H_totale,
      H2: H_racc,          // usato dal loop di taratura (zona 2 = raccordo)
      H3: H_cono,          // usato dal loop di taratura (zona 1 = cono puro)
      Y,
      Baric,
      K,
      H_esterna_totale: H_totale + config.hColletto + config.sp,
      V_calotta: V_cono_totale_L, // ora è cono + tronco + spicchio
      V_toro: 0,
      V_raccordo: 0,
      V_colletto: V_colletto_L,
      V_testata_LT: V_cono_totale_L + V_colletto_L,
      Sviluppo_mm,
      Area_disco_da_tagliare_mq: Area_totale_mq,
      Peso_lamiera_kg,
    };
  }

  let R = 0;
  let r = 0;

  if (config.type === 'decinormale') {
    R = dInt;
    r = dInt / 10;
  } else if (config.type === 'pseudoellittico') {
    R = 0.833 * dInt;
    r = 0.156 * dInt;
  } else {
    R = config.R_custom ?? dInt;
    r = config.r_custom ?? (dInt / 10);
  }

  const DR = R - r;
  const X = dInt / 2 - r;

  // Guard against division by zero or out of bounds for ASIN
  let sinVal = DR !== 0 ? (X / DR) : 0;
  if (sinVal > 1) sinVal = 1;
  if (sinVal < -1) sinVal = -1;

  const alfa = Math.asin(sinVal) * 180 / Math.PI;
  const beta = 90 - alfa;

  // H1 = SQRT(DR^2 - X^2)
  let diffSq = DR * DR - X * X;
  if (diffSq < 0) diffSq = 0;
  const H1 = Math.sqrt(diffSq);

  const H_int = R - H1; // altezza interna totale della calotta+raccordo
  const alfaRad = alfa * Math.PI / 180;
  const betaRad = beta * Math.PI / 180;

  const H2 = r * Math.cos(alfaRad); // altezza verticale zona toroidale
  const H3 = H_int - H2;            // altezza verticale calotta sferica
  const Y = R * Math.sin(alfaRad);

  // Baricentro del toro (Pappo-Guldino)
  let Baric = X;
  if (beta !== 0 && r !== 0) {
    const denom = (r * 2 * Math.PI / 360 * beta * 3);
    if (denom !== 0) {
      Baric = ((r * 2 * 2 * r * Math.sin(betaRad / 2)) / denom) * Math.cos(betaRad / 2) + X;
    }
  }

  const K = dInt / 2 - Y;
  const H_esterna_totale = R - H1 + config.hColletto + config.sp;

  // Volumi (mm come unità di input, risultato in LITRI: si divide per 1.000.000)
  const V_calotta = 0.523598775 * H3 * (3 * Y * Y + H3 * H3) / 1e6;
  const V_toro = 1.04719 * H2 * (Y * Y + X * X + Y * X) / 1e6;
  const V_raccordo = r * r * Math.PI / 360 * (90 - alfa) * Baric * 2 * Math.PI / 1e6;
  const V_colletto = Math.pow(dInt / 2, 2) * Math.PI * config.hColletto / 1e6;
  const V_testata_LT = V_calotta + V_toro + V_raccordo + V_colletto;

  // Sviluppo lamiera (per il taglio del disco grezzo)
  const Sviluppo_mm = (R * 2 + config.sp) * Math.PI / 360 * alfa * 2 + (r * 2 + config.sp) * Math.PI / 360 * beta * 2 + config.hColletto * 2;
  const Area_disco_da_tagliare_mq = Math.pow(Sviluppo_mm / 2000, 2) * Math.PI;
  const Peso_lamiera_kg = Area_disco_da_tagliare_mq * config.sp * 8; // 8 = densità acciaio

  return {
    R,
    r,
    DR,
    X,
    alfa,
    beta,
    H1,
    H_int,
    H2,
    H3,
    Y,
    Baric,
    K,
    H_esterna_totale,
    V_calotta,
    V_toro,
    V_raccordo,
    V_colletto,
    V_testata_LT,
    Sviluppo_mm,
    Area_disco_da_tagliare_mq,
    Peso_lamiera_kg,
  };
}

/**
 * Perform full tank profile integration and strapping table calculations
 */
export function calculateTank(input: TankInput): CalculationResult {
  const dInt = input.dInt;
  const lCil = input.lCil;
  const rho = input.rho;

  // Compute coperchio and fondo geometries
  const fondo = calculateHead(dInt, input.fondo);
  const coperchio = calculateHead(dInt, input.coperchio);

  const isInclinedFondo = input.fondo.type === 'inclinato';
  const isConicFondo = input.fondo.type === 'conico' || isInclinedFondo;

  // Altezze zone
  const H3_fondo = fondo.H3; // per conico = H_cono puro (sotto il raccordo)
  const H2_fondo = isConicFondo ? fondo.H2 : fondo.H2; // per conico = H_racc (raccordo)
  const h_colletto_fondo = input.fondo.hColletto;
  const H3_coperchio = coperchio.H3;
  const H2_coperchio = coperchio.H2;
  const h_colletto_coperchio = input.coperchio.hColletto;

  // Altezze cumulative (quote, in mm, misurate dal fondo = 0)
  const z1 = H3_fondo;                       // fine cono puro (o calotta) fondo
  const z2 = z1 + H2_fondo;                  // fine raccordo (toroidale o cono/colletto)
  const z3 = z2 + h_colletto_fondo;          // fine colletto fondo
  const z4 = z3 + lCil;                      // fine mantello cilindrico
  const z5 = z4 + h_colletto_coperchio;      // fine colletto coperchio
  const z6 = z5 + H2_coperchio;              // fine raccordo toroidale coperchio
  const z7 = z6 + H3_coperchio;              // H_tot

  const H_tot = Math.round(z7);

  // Precalcolo costanti zona 2 fondo bombato
  const raggio_fine_zona1 = isConicFondo ? fondo.Y : Math.sqrt(H3_fondo * (2 * fondo.R - H3_fondo));
  const BH_fondo = isConicFondo ? 0 : (raggio_fine_zona1 - fondo.X) * 2;
  let termSqFondo = isConicFondo ? 0 : fondo.r * fondo.r - Math.pow(BH_fondo / 2, 2);
  if (termSqFondo < 0) termSqFondo = 0;
  const BI_fondo = isConicFondo ? 0 : fondo.r - Math.sqrt(termSqFondo);

  const raggioProfile = new Array<number>(H_tot + 1).fill(0);
  const litriCumulativi = new Array<number>(H_tot + 1).fill(0);

  for (let h = 1; h <= H_tot; h++) {
    let rVal = 0;

    if (h <= z1) {
      if (isInclinedFondo) {
        // Zona 1 — cuneo inclinato + raccordo: profilo equivalente per area,
        // calcolato dall'integratore della superficie (quote dal punto più basso reale).
        const prof = fondo.rEqProfile ?? [];
        const idx = Math.min(prof.length - 1, Math.max(0, Math.round(h)));
        rVal = prof.length > 0 ? prof[idx] : 0;
      } else if (isConicFondo) {
        // Cono retto puro: raggio lineare da 0 (a h=0) fino a Y (a h=H_cono)
        rVal = H3_fondo > 0 ? fondo.Y * (h / H3_fondo) : 0;
      } else {
        // Zona 1 — calotta sferica fondo bombato
        const h_zona = h;
        let term = h_zona * (2 * fondo.R - h_zona);
        if (term < 0) term = 0;
        rVal = Math.sqrt(term);
      }
    } else if (h <= z2) {
      if (isConicFondo) {
        // Zona 2 conica — raccordo cono/colletto (arco tangente).
        // Centro arco: (R_base - r_racc, z2). Punto: (R_base - r_racc*(1-cos(phi)), z2 - r_racc*sin(phi))
        const r_racc = fondo.r;
        const R_base = dInt / 2;
        const dh = z2 - h; // 0 in cima, H_racc in fondo
        let sinPhi = r_racc > 0 ? dh / r_racc : 0;
        if (sinPhi > 1) sinPhi = 1;
        if (sinPhi < 0) sinPhi = 0;
        const phi = Math.asin(sinPhi);
        rVal = R_base - r_racc * (1 - Math.cos(phi));
      } else {
        // Zona 2 — raccordo toroidale fondo bombato
        const h_zona = h - z1;
        const BJ = BI_fondo + h_zona;
        let term = BJ * (2 * fondo.r - BJ);
        if (term < 0) term = 0;
        rVal = Math.sqrt(term) + fondo.X;
      }
    } else if (h <= z5) {
      // Zone 3, 4, 5 — colletti e parte cilindrica
      rVal = dInt / 2;
    } else if (h <= z6) {
      // Zona 6 — raccordo toroidale coperchio
      const h_zona = h - z5;
      const BL = coperchio.r - h_zona + 1;
      let term = BL * (2 * coperchio.r - BL);
      if (term < 0) term = 0;
      const BM = Math.sqrt(term);
      rVal = (dInt / 2 - coperchio.r) + BM;
    } else {
      // Zona 7 — calotta sferica coperchio
      const h_zona = h - z6;
      const BN = H3_coperchio - h_zona;
      let term = BN * (2 * coperchio.R - BN);
      if (term < 0) term = 0;
      rVal = Math.sqrt(term);
    }

    raggioProfile[h] = rVal;

    const Area_sezione = Math.PI * rVal * rVal;
    const Volume_fetta = Area_sezione * 1 / 1e6;
    litriCumulativi[h] = litriCumulativi[h - 1] + Volume_fetta;
  }

  // Summary Volumes
  const volumeFondo = fondo.V_testata_LT;
  const volumeCoperchio = coperchio.V_testata_LT;
  const volumeCilindro = Math.PI * Math.pow(dInt / 2, 2) * lCil / 1e6;
  const volumeTotale = litriCumulativi[H_tot];

  // Weights and surfaces
  const pesoLamieraFondo = fondo.Peso_lamiera_kg;
  const pesoLamieraCoperchio = coperchio.Peso_lamiera_kg;
  // Peso lamiera virola: circonferenza media x lunghezza x spessore x densità (8 kg/dm3 acciaio)
  const spVirola = input.spVirola && input.spVirola > 0 ? input.spVirola : input.fondo.sp;
  const areaVirolaCilindricaMq = (Math.PI * (dInt + spVirola) * lCil) / 1e6;
  // Striscia di parete tagliata lungo il piano inclinato: è lamiera di VIROLA
  const areaStrisciaVirolaMq = fondo.Area_striscia_virola_mq ?? 0;
  const areaVirolaMq = areaVirolaCilindricaMq + areaStrisciaVirolaMq;
  const pesoStrisciaVirola = areaStrisciaVirolaMq * spVirola * 8;
  const pesoLamieraVirola = areaVirolaMq * spVirola * 8;
  const sviluppoFondoMq = fondo.Area_disco_da_tagliare_mq;
  const sviluppoCoperchioMq = coperchio.Area_disco_da_tagliare_mq;


  const pesoContenutoTotale = volumeTotale * rho;
  const pesoContenutoPerCmCilindro = (Math.PI * Math.pow(dInt / 2, 2) * 10 / 1e6) * rho; // 10 mm = 1 cm

  return {
    input,
    fondo,
    coperchio,
    z1,
    z2,
    z3,
    z4,
    z5,
    z6,
    z7,
    H_tot,
    volumeFondo,
    volumeCoperchio,
    volumeCilindro,
    volumeTotale,
    pesoLamieraFondo,
    pesoLamieraCoperchio,
    pesoLamieraVirola,
    sviluppoFondoMq,
    sviluppoCoperchioMq,
    areaVirolaMq,
    areaStrisciaVirolaMq,
    pesoStrisciaVirola,
    pesoContenutoTotale,
    pesoContenutoPerCmCilindro,
    litriCumulativi,
    raggioProfile,
  };
}
