/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { TankInput, HeadConfig, HeadCalculated, CalculationResult } from '../models/types';
import { INCLINAZIONE_MAX } from '../constants';

/**
 * Calculates geometry and volumes for a single head (coperchio or fondo)
 */
export function calculateHead(dInt: number, config: HeadConfig): HeadCalculated {
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
 * Serbatoio ORIZZONTALE: profilo lungo l'asse + tabella di taratura per livello (0 … diametro)
 */
export function calculateTank(input: TankInput): CalculationResult {
  const dInt = input.dInt;
  const lCil = input.lCil;
  const rho = input.rho;

  // Compute coperchio and fondo geometries
  const fondo = calculateHead(dInt, input.fondo);
  const coperchio = calculateHead(dInt, input.coperchio);

  const isConicFondo = input.fondo.type === 'conico';

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

  // Lunghezza interna totale LUNGO L'ASSE (serbatoio orizzontale): è la vecchia
  // "altezza totale" del serbatoio verticale. Indice di raggioProfile.
  const L_tot = Math.round(z7);

  // Precalcolo costanti zona 2 fondo bombato
  const raggio_fine_zona1 = isConicFondo ? fondo.Y : Math.sqrt(H3_fondo * (2 * fondo.R - H3_fondo));
  const BH_fondo = isConicFondo ? 0 : (raggio_fine_zona1 - fondo.X) * 2;
  let termSqFondo = isConicFondo ? 0 : fondo.r * fondo.r - Math.pow(BH_fondo / 2, 2);
  if (termSqFondo < 0) termSqFondo = 0;
  const BI_fondo = isConicFondo ? 0 : fondo.r - Math.sqrt(termSqFondo);

  // raggioProfile[x] = raggio della sezione a distanza x (mm) dal fondo, lungo l'asse.
  const raggioProfile = new Array<number>(L_tot + 1).fill(0);

  for (let h = 1; h <= L_tot; h++) {
    let rVal = 0;

    if (h <= z1) {
      if (isConicFondo) {
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
  }

  // === TARATURA ORIZZONTALE (con eventuale inclinazione dell'asse) ===
  // Riferimento: asse del serbatoio nel piano verticale, origine sulla punta del fondo (s = 0).
  // Con inclinazione θ (positivo = coperchio più alto) il centro della fetta a distanza s
  // dal fondo sta a quota zc(s) = s·sinθ. Ogni fetta (perpendicolare all'asse, spessore 1 mm)
  // è un cerchio di raggio ρ(s) = raggioProfile[s]. Con la superficie libera a quota habs,
  // l'area bagnata è il segmento circolare sotto la corda alla distanza (misurata nel piano
  // della fetta)  u = (zc(s) − habs)/cosθ  dal centro:
  //   A(u) = ρ²·acos(u/ρ) − u·√(ρ² − u²)     (0 se u ≥ ρ, πρ² se u ≤ −ρ)
  // Il livello h è misurato in VERTICALE dal punto interno più basso (zBasso).
  // Con θ = 0 coincide col serbatoio orizzontale: h = 0 … diametro.
  const c = dInt / 2;
  const inclRaw = Number.isFinite(input.inclinazione as number) ? (input.inclinazione as number) : 0;
  const inclinazione = Math.max(-INCLINAZIONE_MAX, Math.min(INCLINAZIONE_MAX, inclRaw));
  const tilted = Math.abs(inclinazione) > 1e-9;
  const thetaRad = (inclinazione * Math.PI) / 180;
  const sinT = Math.sin(thetaRad);
  const cosT = Math.cos(thetaRad);
  const tanT = Math.tan(thetaRad);

  let zBasso = -c;
  let zAlto = c;
  if (tilted) {
    zBasso = Infinity;
    zAlto = -Infinity;
    for (let sIdx = 0; sIdx <= L_tot; sIdx++) {
      const rr = raggioProfile[sIdx];
      const zc = sIdx * sinT;
      zBasso = Math.min(zBasso, zc - rr * cosT);
      zAlto = Math.max(zAlto, zc + rr * cosT);
    }
  }

  // Livello massimo del liquido = escursione verticale interna del serbatoio
  const H_tot = Math.max(1, Math.round(zAlto - zBasso));
  // litriCumulativi[h] = litri con il liquido al livello h (mm) sopra il punto più basso
  const litriCumulativi = new Array<number>(H_tot + 1).fill(0);

  const segmentArea = (rho: number, u: number): number => {
    if (rho <= 0 || u >= rho) return 0;
    if (u <= -rho) return Math.PI * rho * rho;
    return rho * rho * Math.acos(u / rho) - u * Math.sqrt(rho * rho - u * u);
  };
  // Primitiva di A(u) rispetto a u (serve a sommare in forma chiusa le fette del cilindro)
  const segmentAreaIntegral = (rho: number, u: number): number => {
    if (u >= rho) return 0;
    if (u <= -rho) return Math.PI * rho * rho * u;
    const a = rho * rho * Math.acos(u / rho) - u * Math.sqrt(rho * rho - u * u);
    return u * a - (2 / 3) * Math.pow(rho * rho - u * u, 1.5);
  };

  // Raggruppo le fette consecutive con lo stesso raggio (cilindro e colletti = 1 gruppo)
  const runs: { rho: number; start: number; n: number }[] = [];
  for (let x = 1; x <= L_tot; x++) {
    const rr = raggioProfile[x];
    const last = runs[runs.length - 1];
    if (last && last.rho === rr) last.n += 1;
    else runs.push({ rho: rr, start: x, n: 1 });
  }

  for (let h = 1; h <= H_tot; h++) {
    // all'ultima riga il livello coincide col punto più alto (serbatoio pieno)
    const habs = h === H_tot ? zAlto : zBasso + h;
    let acc = 0;
    if (!tilted) {
      const u = -habs; // zc = 0 per ogni fetta
      for (const run of runs) acc += segmentArea(run.rho, u) * run.n;
    } else {
      const uOf = (sPos: number) => (sPos * sinT - habs) / cosT;
      for (const run of runs) {
        if (run.n < 8 || Math.abs(tanT) < 1e-6) {
          for (let k = 0; k < run.n; k++) acc += segmentArea(run.rho, uOf(run.start + k));
        } else {
          // u varia linearmente lungo il tratto: integrale in forma chiusa
          const uLo = uOf(run.start - 0.5);
          const uHi = uOf(run.start + run.n - 0.5);
          acc += (segmentAreaIntegral(run.rho, uHi) - segmentAreaIntegral(run.rho, uLo)) / tanT;
        }
      }
    }
    litriCumulativi[h] = acc / 1e6;
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
  const pesoLamieraVirola = (Math.PI * (dInt + spVirola) * lCil * spVirola * 8) / 1e6;
  const sviluppoFondoMq = fondo.Area_disco_da_tagliare_mq;
  const sviluppoCoperchioMq = coperchio.Area_disco_da_tagliare_mq;

  const pesoContenutoTotale = volumeTotale * rho;
  // kg per ogni cm di LUNGHEZZA del mantello cilindrico a serbatoio pieno
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
    L_tot,
    inclinazione,
    zBasso,
    zAlto,
    volumeFondo,
    volumeCoperchio,
    volumeCilindro,
    volumeTotale,
    pesoLamieraFondo,
    pesoLamieraCoperchio,
    pesoLamieraVirola,
    sviluppoFondoMq,
    sviluppoCoperchioMq,
    pesoContenutoTotale,
    pesoContenutoPerCmCilindro,
    litriCumulativi,
    raggioProfile,
  };
}


/* ------------------------------------------------------------------ */
/* Sagoma del serbatoio (vista laterale, eventualmente inclinato)      */
/* ------------------------------------------------------------------ */

export interface SilhouetteBox {
  x0: number;
  x1: number;
  yTop: number;
  yBottom: number;
  /** true = coperchio a sinistra (specchia il disegno) */
  mirror?: boolean;
}

/**
 * Costruisce la sagoma in coordinate di disegno, a scala UNIFORME, dentro `box`.
 * pt(s, off): punto a distanza assiale s (mm dal fondo) e scostamento radiale `off` (mm,
 * positivo = lato alto). levelY(h): ordinata del livello h (mm sopra il punto più basso).
 */
export function buildSilhouette(result: CalculationResult, box: SilhouetteBox, steps = 160) {
  const L = Math.max(1, result.L_tot);
  const th = (result.inclinazione * Math.PI) / 180;
  const sin = Math.sin(th);
  const cos = Math.cos(th);
  const wx = (s: number, off: number) => s * cos - off * sin;
  const wz = (s: number, off: number) => s * sin + off * cos;

  const samples: { s: number; r: number }[] = [];
  for (let i = 0; i <= steps; i++) {
    const s = Math.round((i / steps) * L);
    samples.push({ s, r: result.raggioProfile[s] || 0 });
  }
  let xmin = Infinity;
  let xmax = -Infinity;
  for (const p of samples) {
    for (const off of [p.r, -p.r]) {
      const x = wx(p.s, off);
      xmin = Math.min(xmin, x);
      xmax = Math.max(xmax, x);
    }
  }
  const zmin = result.zBasso;
  const zmax = result.zAlto;
  const boxW = box.x1 - box.x0;
  const boxH = box.yBottom - box.yTop;
  const k = Math.min(boxW / Math.max(1, xmax - xmin), boxH / Math.max(1, zmax - zmin));
  const offX = (boxW - (xmax - xmin) * k) / 2;
  const yBase = box.yBottom - (boxH - (zmax - zmin) * k) / 2;

  const X = (x: number) =>
    box.mirror ? box.x1 - offX - (x - xmin) * k : box.x0 + offX + (x - xmin) * k;
  const Y = (z: number) => yBase - (z - zmin) * k;

  const pt = (s: number, off: number) => ({ x: X(wx(s, off)), y: Y(wz(s, off)) });
  const levelY = (h: number) => Y(zmin + h);

  const upper = samples.map((p) => pt(p.s, p.r));
  const lower = [...samples].reverse().map((p) => pt(p.s, -p.r));
  const path =
    'M ' + upper.map((q) => `${q.x},${q.y}`).join(' L ') +
    ' L ' + lower.map((q) => `${q.x},${q.y}`).join(' L ') + ' Z';

  return { path, pt, levelY, k, yBottom: yBase, yTop: yBase - (zmax - zmin) * k };
}
