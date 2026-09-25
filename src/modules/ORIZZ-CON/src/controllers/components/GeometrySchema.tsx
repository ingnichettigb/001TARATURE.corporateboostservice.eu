/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo } from 'react';
import { TankInput } from '../../models/types';
import { AlertTriangle, Info } from 'lucide-react';

import { CalculationResult } from '../../models/types';

interface GeometrySchemaProps {
  input: TankInput;
  onChange: (input: TankInput) => void;
  result: CalculationResult | null;
}

/* ---------- helpers geometria testata conica (stessa convenzione del motore) ---------- */
// h_cono = ALTEZZA TOTALE della testata conica, COLLETTO INCLUSO.
const hNetFromAngle = (alfaDeg: number, R_base: number, r_racc: number): number => {
  const a = (alfaDeg * Math.PI) / 180;
  const Z = r_racc * Math.sin(a);
  const K = r_racc - Z;
  const Y = R_base - K;
  if (Y <= 0) return NaN;
  return Y * Math.tan(a) + r_racc * Math.cos(a);
};

const hTotFromAngle = (alfaDeg: number, R_base: number, r_racc: number, hColl: number): number =>
  hNetFromAngle(alfaDeg, R_base, r_racc) + hColl;

const angleFromHTot = (
  H_target: number,
  R_base: number,
  r_racc: number,
  hColl: number
): number | null => {
  if (R_base <= 0) return null;
  const H_net = H_target - hColl;
  if (H_net <= 0) return null;
  let lo = 0.01;
  let hi = 89.99;
  for (let i = 0; i < 60; i++) {
    const mid = (lo + hi) / 2;
    const v = hNetFromAngle(mid, R_base, r_racc);
    if (isNaN(v)) {
      hi = mid;
      continue;
    }
    if (v - H_net < 0) lo = mid;
    else hi = mid;
  }
  const ang = (lo + hi) / 2;
  const check = hNetFromAngle(ang, R_base, r_racc);
  if (isNaN(check) || Math.abs(check - H_net) > Math.max(2, H_net * 0.02)) return null;
  return ang;
};

const fmt = (n: number): string =>
  !isFinite(n) ? '—' : Number.isInteger(n) ? String(n) : n.toFixed(1);

// capacità nei riquadri: numero intero, senza decimali
const fmtL0 = (n: number): string =>
  !isFinite(n) ? '—' : Math.round(n).toLocaleString('it-IT', { maximumFractionDigits: 0 });

/* ---------- sub components ---------- */

const editableDimStyle: React.CSSProperties = {
  width: '84px',
  fontSize: '14px',
  fontWeight: 700,
  color: '#000000',
  background: '#ffffff',
  border: '1px solid #94a3b8',
  borderRadius: '3px',
  padding: '1px 4px',
  outline: 'none',
  fontFamily: 'inherit',
};

function MiniField({
  label,
  value,
  onChange,
  readOnly,
  labelWidth,
  width,
}: {
  label: string;
  value: number;
  onChange?: (v: number) => void;
  readOnly?: boolean;
  labelWidth?: string;
  width?: string;
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
      <span
        style={{
          fontSize: '11px',
          color: '#000000',
          whiteSpace: 'nowrap',
          width: labelWidth || '50px',
          flexShrink: 0,
        }}
      >
        {label}
      </span>
      <input
        type="number"
        value={value}
        readOnly={readOnly}
        onChange={(e) => !readOnly && onChange?.(Number(e.target.value))}
        className={readOnly ? '' : 'editable-dim'}
        title={readOnly ? 'Calcolato automaticamente dallo standard scelto' : undefined}
        style={{
          width: width || '78px',
          fontSize: '14px',
          fontWeight: 700,
          color: '#000000',
          background: readOnly ? '#f1f5f9' : '#ffffff',
          border: readOnly ? '1px solid #e2e8f0' : '1px solid #94a3b8',
          borderRadius: '3px',
          padding: '1px 4px',
          outline: 'none',
          fontFamily: 'inherit',
          flexShrink: 0,
          cursor: readOnly ? 'not-allowed' : 'text',
        }}
      />
    </div>
  );
}

function HDimLine({
  y,
  x1,
  x2,
  label,
}: {
  y: number;
  x1: number;
  x2: number;
  label: string;
}) {
  const midX = (x1 + x2) / 2;
  return (
    <g>
      <line x1={x1} y1={y - 7} x2={x1} y2={y + 7} stroke="#334155" strokeWidth="1" />
      <line x1={x2} y1={y - 7} x2={x2} y2={y + 7} stroke="#334155" strokeWidth="1" />
      <line x1={x1} y1={y} x2={x2} y2={y} stroke="#334155" strokeWidth="1" />
      <text x={midX} y={y - 8} fontSize="13" fontWeight={700} fill="#000000" textAnchor="middle">
        {label}
      </text>
    </g>
  );
}

/* ---------- main ---------- */

export default function GeometrySchema({ input, onChange, result }: GeometrySchemaProps) {
  const dInt = input.dInt;
  const lCil = input.lCil;

  // TESTA SINISTRA CONICA (fondo)
  const rRaccFondo = input.fondo.rRaccordo ?? 30;
  const hCollettoFondo = input.fondo.hColletto;
  const hConoFondo = input.fondo.hCono ?? Math.round(dInt / 2 + hCollettoFondo);

  // TESTA DESTRA CONICA (coperchio)
  const rRaccCoperchio = input.coperchio.rRaccordo ?? 30;
  const hCollettoCoperchio = input.coperchio.hColletto;
  const hConoCoperchio = input.coperchio.hCono ?? Math.round(dInt / 2 + hCollettoCoperchio);

  const angoloFondo = useMemo(() => {
    const a = angleFromHTot(hConoFondo, dInt / 2, rRaccFondo, hCollettoFondo);
    return a != null ? Math.round(a * 10) / 10 : null;
  }, [hConoFondo, dInt, rRaccFondo, hCollettoFondo]);

  const angoloCoperchio = useMemo(() => {
    const a = angleFromHTot(hConoCoperchio, dInt / 2, rRaccCoperchio, hCollettoCoperchio);
    return a != null ? Math.round(a * 10) / 10 : null;
  }, [hConoCoperchio, dInt, rRaccCoperchio, hCollettoCoperchio]);


  const hConoFondo_calc = hConoFondo;
  const hConoCoperchio_calc = hConoCoperchio;
  const lTot = result ? result.L_tot : hConoCoperchio_calc + lCil + hConoFondo_calc;
  const hTot = result ? result.H_tot : dInt;
  const angoloTank = input.angolo ?? 0;

  const raccordoError =
    angoloFondo == null || angoloCoperchio == null
      ? 'Il raggio di raccordo o l\u2019altezza inseriti non sono compatibili con questo diametro.'
      : null;

  /* --- patch helpers --- */
  const patch = (p: Partial<TankInput>) => onChange({ ...input, ...p });
  const patchFondo = (p: Partial<TankInput['fondo']>) =>
    onChange({ ...input, fondo: { ...input.fondo, ...p } });
  const patchCoperchio = (p: Partial<TankInput['coperchio']>) =>
    onChange({ ...input, coperchio: { ...input.coperchio, ...p } });

  const setDInt = (v: number) => {
    if (!(v > 0)) return;
    const next: TankInput = { ...input, dInt: v };
    // mantiene gli angoli dei coni costanti al variare del diametro
    if (angoloFondo != null) {
      const h = hTotFromAngle(angoloFondo, v / 2, rRaccFondo, hCollettoFondo);
      if (isFinite(h)) next.fondo = { ...input.fondo, hCono: Math.round(h * 10) / 10 };
    }
    if (angoloCoperchio != null) {
      const h = hTotFromAngle(angoloCoperchio, v / 2, rRaccCoperchio, hCollettoCoperchio);
      if (isFinite(h)) next.coperchio = { ...input.coperchio, hCono: Math.round(h * 10) / 10 };
    }
    onChange(next);
  };

  const setAngoloFondo = (v: number) => {
    if (!(v > 0 && v < 90)) return;
    const h = hTotFromAngle(v, dInt / 2, rRaccFondo, hCollettoFondo);
    if (!isFinite(h)) return;
    patchFondo({ hCono: Math.round(h * 10) / 10 });
  };

  const setAngoloCoperchio = (v: number) => {
    if (!(v > 0 && v < 90)) return;
    const h = hTotFromAngle(v, dInt / 2, rRaccCoperchio, hCollettoCoperchio);
    if (!isFinite(h)) return;
    patchCoperchio({ hCono: Math.round(h * 10) / 10 });
  };

  /* ---------- layout disegno: serbatoio ORIZZONTALE ---------- */
  const drawW = 820;
  const drawH = 575;
  const SAFE = 40;
  const zoneX0 = SAFE;
  const zoneX1 = drawW - SAFE;

  const cy = 250;          // asse del serbatoio
  const halfH = 90;        // semi-altezza grafica (Ø)
  const yTop = cy - halfH;
  const yBot = cy + halfH;
  const scaleBase = halfH / (dInt / 2 || 1);

  // cilindro: lunghezza GRAFICA FISSA (rappresentativa)
  const lCil_px = 300;

  // le due teste coniche sono scalate proporzionalmente al Ø, con tetto sullo spazio disponibile
  const maxConiPx = Math.max(80, zoneX1 - zoneX0 - lCil_px);
  const idealL = hConoFondo_calc * scaleBase;
  const idealR = hConoCoperchio_calc * scaleBase;
  const idealTot = idealL + idealR || 1;
  const shrink = idealTot > maxConiPx ? maxConiPx / idealTot : 1;
  const wConoL_px = Math.max(40, idealL * shrink);
  const wConoR_px = Math.max(40, idealR * shrink);

  const totalDrawn = wConoL_px + lCil_px + wConoR_px;
  const xApexL = zoneX0 + Math.max(0, (zoneX1 - zoneX0 - totalDrawn) / 2);
  const xCilL = xApexL + wConoL_px;
  const xCilR = xCilL + lCil_px;
  const xApexR = xCilR + wConoR_px;
  const xMid = (xCilL + xCilR) / 2;

  const pathData = `
    M ${xApexL} ${cy}
    L ${xCilL} ${yTop}
    L ${xCilR} ${yTop}
    L ${xApexR} ${cy}
    L ${xCilR} ${yBot}
    L ${xCilL} ${yBot}
    Z
  `;

  // quote assiali
  const yChain = 128;
  const yTotDim = 78;

  // callout 1 (testa sinistra) e 3 (testa destra): a metà della falda inferiore
  const lvx = xCilL - xApexL;
  const lLen = Math.hypot(lvx, halfH) || 1;
  const callout1X = (xApexL + xCilL) / 2 + (-halfH / lLen) * 16;
  const callout1Y = cy + halfH / 2 + (lvx / lLen) * 16;
  const rvx = xApexR - xCilR;
  const rLen = Math.hypot(rvx, halfH) || 1;
  const callout3X = (xCilR + xApexR) / 2 + (halfH / rLen) * 16;
  const callout3Y = cy + halfH / 2 + (rvx / rLen) * 16;
  const callout2X = xMid;
  const callout2Y = yBot + 20;

  // riquadri in basso
  const boxW = 240;
  const boxY = 398;
  const boxH = 155;
  const boxLX = 6;
  const boxMX = drawW / 2 - boxW / 2;
  const boxRX = drawW - boxW - 6;
  const boxMH = 100;

  // riquadro capacità totale (dentro il cilindro)
  const boxCapW = 158;
  const boxCapH = 60;
  const boxCapX = xCilL + 138;
  const boxCapY = cy - boxCapH / 2;
  const xDia = xCilL + 26;

  const clampTilt = (v: number) => (Number.isFinite(v) ? Math.max(-60, Math.min(60, v)) : 0);

  const headBox = (
    x: number,
    title: string,
    cfg: TankInput['fondo'],
    rRacc: number,
    hColl: number,
    patchHead: (p: Partial<TankInput['fondo']>) => void,
    litri: number | null
  ) => (
    <g>
      <rect x={x} y={boxY} width={boxW} height={boxH} rx="5" fill="#ffffff" stroke="#0f766e" strokeWidth="1.2" />
      <text x={x + boxW / 2} y={boxY + 18} textAnchor="middle" fontSize="11" fontWeight="600" fill="#000000">
        {title}
      </text>
      <foreignObject x={x + 6} y={boxY + 26} width={boxW - 18} height="24">
        <MiniField label="R racc." value={rRacc} onChange={(v) => patchHead({ rRaccordo: v })} labelWidth="58px" width="78px" />
      </foreignObject>
      <foreignObject x={x + 6} y={boxY + 52} width={boxW - 18} height="24">
        <MiniField label="Colletto" value={hColl} onChange={(v) => patchHead({ hColletto: v })} labelWidth="58px" width="78px" />
      </foreignObject>
      <foreignObject x={x + 6} y={boxY + 78} width={boxW - 18} height="24">
        <MiniField label="Sp." value={cfg.sp} onChange={(v) => patchHead({ sp: v })} labelWidth="58px" width="78px" />
      </foreignObject>
      <text x={x + boxW / 2} y={boxY + 124} textAnchor="middle" fontSize="11" fontWeight="600" fill="#000000">
        {title} — litri
      </text>
      <text x={x + boxW / 2} y={boxY + 142} textAnchor="middle" fontSize="12" fontWeight="700" fill="#0f766e">
        {litri != null ? fmtL0(litri) : '—'}
      </text>
    </g>
  );

  // arco inclinazione cono in corrispondenza dello spigolo cono/cilindro (angolo tra falda e piano di base)
  const angleArc = (vx: number, vy: number, apexX: number, side: 'L' | 'R', label: number | null) => {
    const rArc = 30;
    const dxS = apexX - vx;
    const dyS = cy - vy;
    const lenS = Math.hypot(dxS, dyS) || 1;
    const ax = vx;
    const ay = vy + rArc; // lungo il piano di base (verso l'asse)
    const bx = vx + (dxS / lenS) * rArc;
    const by = vy + (dyS / lenS) * rArc;
    const bis = { x: (ax - vx) / rArc + (bx - vx) / rArc, y: (ay - vy) / rArc + (by - vy) / rArc };
    const bl = Math.hypot(bis.x, bis.y) || 1;
    const labX = vx + (bis.x / bl) * (rArc + 14);
    const labY = vy + (bis.y / bl) * (rArc + 14);
    return (
      <g>
        <line x1={vx} y1={vy} x2={apexX} y2={cy} stroke="#94a3b8" strokeWidth="1" strokeDasharray="3,3" />
        <path d={`M ${ax} ${ay} A ${rArc} ${rArc} 0 0 ${side === 'L' ? 1 : 0} ${bx} ${by}`} fill="none" stroke="#0f766e" strokeWidth="1.4" />
        <circle cx={vx} cy={vy} r="2.4" fill="#0f766e" />
        <text x={labX} y={labY + 4} textAnchor="middle" fontSize="12" fontWeight="700" fill="#0f766e">
          {label != null ? `${label.toFixed(1)}°` : ''}
        </text>
      </g>
    );
  };

  const angBoxW = 122;
  const angBoxH = 42;

  return (
    <div className="space-y-4">
      <style>{`
        .editable-dim { transition: border-color .15s, box-shadow .15s; }
        .editable-dim:hover { border-color: #0f766e !important; cursor: text; }
        .editable-dim:focus { border-color: #0f766e !important; box-shadow: 0 0 0 2px rgba(15,118,110,.15); }
      `}</style>

      <div className="bg-amber-50 border border-amber-300 rounded-xl p-3 flex items-start gap-2">
        <AlertTriangle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
        <p className="text-xs font-bold text-amber-900">
          Tutte le misure da inserire (diametro, lunghezze, ecc.) sono <span className="underline">misure interne</span>.
          Serbatoio orizzontale: il livello è misurato dal punto interno più basso. Inclinazione 0° = perfettamente orizzontale.
          Clicca direttamente sui valori nello schema per modificarli.
        </p>
      </div>

      <div className="bg-white border-4 border-double border-emerald-800 rounded-xl p-2 overflow-x-auto">
        <svg viewBox={`0 0 ${drawW} ${drawH}`} className="w-full h-auto min-w-[680px]" xmlns="http://www.w3.org/2000/svg">

          {/* RIQUADRI TESTE + CILINDRO */}
          {headBox(boxLX, 'Testa sinistra conica', input.fondo, rRaccFondo, hCollettoFondo, patchFondo, result ? result.volumeFondo : null)}
          {headBox(boxRX, 'Testa destra conica', input.coperchio, rRaccCoperchio, hCollettoCoperchio, patchCoperchio, result ? result.volumeCoperchio : null)}

          <g>
            <rect x={boxMX} y={boxY} width={boxW} height={boxMH} rx="5" fill="#ffffff" stroke="#0f766e" strokeWidth="1.2" />
            <text x={boxMX + boxW / 2} y={boxY + 16} textAnchor="middle" fontSize="11" fontWeight="600" fill="#000000">
              Sezione cilindrica
            </text>
            <text x={boxMX + boxW / 2} y={boxY + 34} textAnchor="middle" fontSize="11" fontWeight="600" fill="#000000">
              Capacità in litri
            </text>
            <text x={boxMX + boxW / 2} y={boxY + 54} textAnchor="middle" fontSize="12" fontWeight="700" fill="#0f766e">
              {result ? fmtL0(result.volumeCilindro) : '—'}
            </text>
            <foreignObject x={boxMX + 6} y={boxY + 64} width={boxW - 18} height="26">
              <MiniField label="Sp. virola" value={input.spVirola} onChange={(v) => patch({ spVirola: v })} labelWidth="66px" width="78px" />
            </foreignObject>
          </g>

          {/* linee callout → riquadri */}
          <line x1={boxLX + boxW / 2} y1={boxY} x2={callout1X} y2={callout1Y + 13} stroke="#0f766e" strokeWidth="1" strokeDasharray="3,3" />
          <line x1={boxMX + boxW / 2} y1={boxY} x2={callout2X} y2={callout2Y + 13} stroke="#0f766e" strokeWidth="1" strokeDasharray="3,3" />
          <line x1={boxRX + boxW / 2} y1={boxY} x2={callout3X} y2={callout3Y + 13} stroke="#0f766e" strokeWidth="1" strokeDasharray="3,3" />

          {/* PROFILO SERBATOIO */}
          <path d={pathData} fill="#f8fafc" stroke="#1e293b" strokeWidth="1.6" />
          <line x1={xCilL} y1={yTop} x2={xCilL} y2={yBot} stroke="#1e293b" strokeWidth="1" />
          <line x1={xCilR} y1={yTop} x2={xCilR} y2={yBot} stroke="#1e293b" strokeWidth="1" />

          {/* LINEA DI CENTRO ORIZZONTALE (asse di riferimento, sopra il profilo) */}
          <line x1={xApexL - 28} y1={cy} x2={xApexR + 28} y2={cy} stroke="#475569" strokeWidth="1" strokeDasharray="14,3,2,3" />

          {/* LINEA INCLINATA: mostra l'inclinazione del serbatoio (solo se angolo ≠ 0) */}
          {angoloTank !== 0 && (() => {
            const th = (clampTilt(angoloTank) * Math.PI) / 180;
            const sT = Math.sin(th);
            const cT = Math.cos(th);
            const halfSpan = (xApexR - xApexL) / 2 + 28;
            const Ln = Math.min(halfSpan, Math.abs(sT) > 1e-6 ? 120 / Math.abs(sT) : halfSpan);
            const x1 = xMid - Ln * cT;
            const y1 = cy + Ln * sT;
            const x2 = xMid + Ln * cT;
            const y2 = cy - Ln * sT; // angolo positivo = testa destra sollevata
            const ex = xMid + Ln; // punto sulla linea orizzontale, stesso raggio
            const arcSweep = th > 0 ? 0 : 1;
            return (
              <g>
                <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#b45309" strokeWidth="1.6" strokeDasharray="10,3,2,3" />
                <circle cx={xMid} cy={cy} r="2.6" fill="#b45309" />
                <path d={`M ${ex} ${cy} A ${Ln} ${Ln} 0 0 ${arcSweep} ${x2} ${y2}`} fill="none" stroke="#b45309" strokeWidth="1.2" />
                <text x={ex - 6} y={cy - (Ln * sT) / 2 + 4} textAnchor="end" fontSize="12" fontWeight="700" fill="#b45309" stroke="#ffffff" strokeWidth="3" paintOrder="stroke">
                  {`${angoloTank.toFixed(1)}°`}
                </text>
              </g>
            );
          })()}

          {/* ARCHI INCLINAZIONE CONI */}
          {angleArc(xCilL, yTop, xApexL, 'L', angoloFondo)}
          {angleArc(xCilR, yTop, xApexR, 'R', angoloCoperchio)}

          {/* CALLOUTS */}
          {[
            { x: callout1X, y: callout1Y, n: '1' },
            { x: callout2X, y: callout2Y, n: '2' },
            { x: callout3X, y: callout3Y, n: '3' },
          ].map((c) => (
            <g key={c.n}>
              <circle cx={c.x} cy={c.y} r="13" fill="#ffffff" stroke="#0f766e" strokeWidth="1.4" />
              <text x={c.x} y={c.y + 5} textAnchor="middle" fontSize="13" fontWeight="700" fill="#0f766e">{c.n}</text>
            </g>
          ))}

          {/* QUOTA DIAMETRO (verticale, dentro il cilindro) */}
          <g>
            <line x1={xDia} y1={yTop} x2={xDia} y2={yBot} stroke="#334155" strokeWidth="1" />
            <line x1={xDia - 6} y1={yTop} x2={xDia + 6} y2={yTop} stroke="#334155" strokeWidth="1" />
            <line x1={xDia - 6} y1={yBot} x2={xDia + 6} y2={yBot} stroke="#334155" strokeWidth="1" />
            <text x={xDia + 8} y={cy - 22} fontSize="13" fontWeight="700" fill="#000000">Ø</text>
            <foreignObject x={xDia + 8} y={cy - 12} width="92" height="24">
              <input
                type="number"
                value={dInt}
                onChange={(e) => setDInt(Number(e.target.value))}
                style={editableDimStyle}
                className="editable-dim"
                title="Diametro interno (mm)"
              />
            </foreignObject>
          </g>

          {/* CAPACITÀ TOTALE */}
          <g>
            <rect x={boxCapX} y={boxCapY} width={boxCapW} height={boxCapH} rx="5" fill="#ffffff" stroke="#0f766e" strokeWidth="1.2" />
            <text x={boxCapX + boxCapW / 2} y={boxCapY + 23} textAnchor="middle" fontSize="12" fontWeight="600" fill="#000000">
              Capacità totale lt.
            </text>
            <text x={boxCapX + boxCapW / 2} y={boxCapY + 45} textAnchor="middle" fontSize="15" fontWeight="700" fill="#0f766e">
              {result ? fmtL0(result.volumeTotale) : '—'}
            </text>
          </g>

          {/* CATENA DI QUOTE ASSIALI: testa sx + cilindro + testa dx */}
          <g>
            <line x1={xApexL} y1={yChain} x2={xApexR} y2={yChain} stroke="#334155" strokeWidth="1" />
            {[xApexL, xCilL, xCilR, xApexR].map((xx, i) => (
              <line key={i} x1={xx} y1={yChain - 7} x2={xx} y2={yChain + 7} stroke="#334155" strokeWidth="1" />
            ))}
            {/* linee di richiamo */}
            <line x1={xApexL} y1={yChain + 7} x2={xApexL} y2={cy} stroke="#94a3b8" strokeWidth="1" strokeDasharray="3,3" />
            <line x1={xCilL} y1={yChain + 7} x2={xCilL} y2={yTop} stroke="#94a3b8" strokeWidth="1" strokeDasharray="3,3" />
            <line x1={xCilR} y1={yChain + 7} x2={xCilR} y2={yTop} stroke="#94a3b8" strokeWidth="1" strokeDasharray="3,3" />
            <line x1={xApexR} y1={yChain + 7} x2={xApexR} y2={cy} stroke="#94a3b8" strokeWidth="1" strokeDasharray="3,3" />

            <foreignObject x={(xApexL + xCilL) / 2 - 43} y={yChain - 34} width="86" height="24">
              <input
                type="number"
                value={hConoFondo}
                onChange={(e) => patchFondo({ hCono: Number(e.target.value) })}
                style={editableDimStyle}
                className="editable-dim"
                title="Lunghezza testa sinistra conica, colletto incluso (mm)"
              />
            </foreignObject>
            <foreignObject x={xMid - 43} y={yChain - 34} width="86" height="24">
              <input
                type="number"
                value={lCil}
                onChange={(e) => patch({ lCil: Number(e.target.value) })}
                style={editableDimStyle}
                className="editable-dim"
                title="Lunghezza sezione cilindrica (mm)"
              />
            </foreignObject>
            <foreignObject x={(xCilR + xApexR) / 2 - 43} y={yChain - 34} width="86" height="24">
              <input
                type="number"
                value={hConoCoperchio}
                onChange={(e) => patchCoperchio({ hCono: Number(e.target.value) })}
                style={editableDimStyle}
                className="editable-dim"
                title="Lunghezza testa destra conica, colletto incluso (mm)"
              />
            </foreignObject>
          </g>

          {/* QUOTA TOTALE ASSIALE */}
          <HDimLine y={yTotDim} x1={xApexL} x2={xApexR} label={`L tot = ${fmt(lTot)}`} />
          <line x1={xApexL} y1={yTotDim + 7} x2={xApexL} y2={yChain - 7} stroke="#94a3b8" strokeWidth="1" strokeDasharray="3,3" />
          <line x1={xApexR} y1={yTotDim + 7} x2={xApexR} y2={yChain - 7} stroke="#94a3b8" strokeWidth="1" strokeDasharray="3,3" />

          {/* INCLINAZIONE TESTA SINISTRA */}
          <g>
            <rect x={6} y={6} width={angBoxW} height={angBoxH} rx="5" fill="#ffffff" stroke="#0f766e" strokeWidth="1.2" />
            <text x={13} y={20} fontSize="10" fontWeight="700" fill="#000000">Inclin. testa sx</text>
            <foreignObject x={11} y={24} width={angBoxW - 10} height="22">
              <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
                <input
                  type="number"
                  value={angoloFondo ?? ''}
                  onChange={(e) => setAngoloFondo(Number(e.target.value))}
                  style={{ ...editableDimStyle, width: '82px' }}
                  className="editable-dim"
                  title="Inclinazione del cono sinistro (gradi)"
                />
                <span style={{ fontSize: '11px', color: '#000000' }}>°</span>
              </div>
            </foreignObject>
          </g>

          {/* INCLINAZIONE TESTA DESTRA */}
          <g>
            <rect x={drawW - angBoxW - 6} y={6} width={angBoxW} height={angBoxH} rx="5" fill="#ffffff" stroke="#0f766e" strokeWidth="1.2" />
            <text x={drawW - angBoxW + 1} y={20} fontSize="10" fontWeight="700" fill="#000000">Inclin. testa dx</text>
            <foreignObject x={drawW - angBoxW - 1} y={24} width={angBoxW - 10} height="22">
              <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
                <input
                  type="number"
                  value={angoloCoperchio ?? ''}
                  onChange={(e) => setAngoloCoperchio(Number(e.target.value))}
                  style={{ ...editableDimStyle, width: '82px' }}
                  className="editable-dim"
                  title="Inclinazione del cono destro (gradi)"
                />
                <span style={{ fontSize: '11px', color: '#000000' }}>°</span>
              </div>
            </foreignObject>
          </g>

          {/* INCLINAZIONE ASSE SERBATOIO (0 = orizzontale) */}
          <g>
            <rect x={drawW / 2 - 90} y={6} width={180} height={angBoxH} rx="5" fill="#ffffff" stroke="#0f766e" strokeWidth="1.2" />
            <text x={drawW / 2} y={20} textAnchor="middle" fontSize="10" fontWeight="700" fill="#000000">Inclinazione serbatoio (0 = orizz.)</text>
            <foreignObject x={drawW / 2 - 50} y={24} width="100" height="22">
              <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
                <input
                  type="number"
                  step="0.1"
                  min={-60}
                  max={60}
                  value={angoloTank}
                  onChange={(e) => patch({ angolo: clampTilt(Number(e.target.value)) })}
                  style={{ ...editableDimStyle, width: '82px' }}
                  className="editable-dim"
                  title="Inclinazione dell'asse rispetto all'orizzontale (gradi). Positivo = testa destra sollevata"
                />
                <span style={{ fontSize: '11px', color: '#000000' }}>°</span>
              </div>
            </foreignObject>
          </g>

          <text x={drawW - 8} y={drawH - 5} textAnchor="end" fontSize="13" fill="#000000">
            Tutte le misure in mm (interne)
          </text>
        </svg>
      </div>

      {/* PESO SPECIFICO */}
      <div className="bg-white border border-emerald-300 rounded-xl p-3 flex items-center gap-3">
        <label className="text-xs font-black uppercase text-neutral-700">
          Peso specifico contenuto (kg/dm³)
        </label>
        <input
          type="number"
          step="0.001"
          value={input.rho}
          onChange={(e) => patch({ rho: Number(e.target.value) })}
          className="w-32 text-sm font-black border border-neutral-300 rounded-lg px-2 py-1 focus:outline-hidden focus:ring-1 focus:ring-emerald-800"
        />
      </div>

      {/* ERRORI GEOMETRICI */}
      {raccordoError && (
        <div className="bg-rose-50 border border-rose-300 rounded-xl p-3 space-y-1">
          <p className="text-xs font-bold text-rose-900">{raccordoError}</p>
        </div>
      )}

      {/* VERIFICA COERENZA LUNGHEZZE INTERNE */}
      <div className="bg-emerald-50/50 border border-emerald-300 rounded-xl p-3">
        <div className="flex items-center gap-2 mb-2">
          <Info className="w-4 h-4 text-emerald-800 shrink-0" />
          <h4 className="text-xs font-black uppercase text-emerald-900">
            Verifica coerenza lunghezze interne
          </h4>
        </div>
        <div className="grid grid-cols-2 gap-y-1 text-xs font-bold text-neutral-800">
          <span>Testa sinistra conica (colletto incluso)</span>
          <span className="text-right font-mono">{fmt(hConoFondo_calc)} mm</span>
          <span>Sezione cilindrica</span>
          <span className="text-right font-mono">{fmt(lCil)} mm</span>
          <span>Testa destra conica (colletto incluso)</span>
          <span className="text-right font-mono">{fmt(hConoCoperchio_calc)} mm</span>
          <span className="border-t border-emerald-300 pt-1">Somma</span>
          <span className="text-right font-mono border-t border-emerald-300 pt-1">
            {fmt(hConoCoperchio_calc + lCil + hConoFondo_calc)} mm
          </span>
          <span className="font-black">Lunghezza assiale interna (L_tot)</span>
          <span className="text-right font-mono font-black">{fmt(lTot)} mm</span>
          <span className="font-black">Livello massimo (H_tot){angoloTank !== 0 ? ` — inclinazione ${fmt(angoloTank)}°` : ''}</span>
          <span className="text-right font-mono font-black">{fmt(hTot)} mm</span>
        </div>
        <p
          className={`mt-2 text-xs font-black ${
            Math.abs(hConoCoperchio_calc + lCil + hConoFondo_calc - lTot) <= 1.5 ? 'text-emerald-800' : 'text-rose-800'
          }`}
        >
          {Math.abs(hConoCoperchio_calc + lCil + hConoFondo_calc - lTot) <= 1.5
            ? '✓ Lunghezze coerenti (scarto ≤ 1,5 mm per arrotondamento)'
            : '⚠ Scarto rilevato: verifica i parametri geometrici'}
        </p>
      </div>
    </div>
  );
}
