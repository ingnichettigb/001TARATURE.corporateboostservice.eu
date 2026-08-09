/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo } from 'react';
import { TankInput, HeadType } from '../core/types';
import { calculateTank } from '../core/logic';
import { AlertTriangle, Info } from 'lucide-react';

interface GeometrySchemaProps {
  input: TankInput;
  onChange: (input: TankInput) => void;
}

/* ---------- helpers geometria fondo conico (stessa convenzione del motore) ---------- */
// h_cono = ALTEZZA TOTALE del fondo conico, COLLETTO INCLUSO.
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

const fmtL = (n: number): string =>
  !isFinite(n) ? '—' : n.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

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

function DimLine({
  x,
  y1,
  y2,
  label,
}: {
  x: number;
  y1: number;
  y2: number;
  label: string;
}) {
  const midY = (y1 + y2) / 2;
  return (
    <g>
      <line x1={x - 7} y1={y1} x2={x + 7} y2={y1} stroke="#334155" strokeWidth="1" />
      <line x1={x - 7} y1={y2} x2={x + 7} y2={y2} stroke="#334155" strokeWidth="1" />
      <line x1={x} y1={y1} x2={x} y2={y2} stroke="#334155" strokeWidth="1" />
      <text
        x={x - 14}
        y={midY}
        fontSize="13"
        fontWeight={700}
        fill="#000000"
        textAnchor="middle"
        transform={`rotate(-90 ${x - 14} ${midY})`}
      >
        {label}
      </text>

    </g>
  );
}

/* ---------- main ---------- */

export default function GeometrySchema({ input, onChange }: GeometrySchemaProps) {
  const dInt = input.dInt;
  const lCil = input.lCil;
  const rRaccordoCono = input.fondo.rRaccordo ?? 30;
  const hCollettoCono = input.fondo.hColletto;
  const hCono = input.fondo.hCono ?? Math.round(dInt / 2 + hCollettoCono);
  const hCollettoCoperchio = input.coperchio.hColletto;

  const angolo = useMemo(() => {
    const a = angleFromHTot(hCono, dInt / 2, rRaccordoCono, hCollettoCono);
    return a != null ? Math.round(a * 10) / 10 : null;
  }, [hCono, dInt, rRaccordoCono, hCollettoCono]);

  const result = useMemo(() => {
    try {
      return calculateTank(input);
    } catch {
      return null;
    }
  }, [input]);

  const hCoperchio_calc = result
    ? result.coperchio.H_int + hCollettoCoperchio
    : hCollettoCoperchio;
  const hCono_calc = hCono;
  const hTot = result ? result.H_tot : hCoperchio_calc + lCil + hCono_calc;

  const geometriaCoperchioValida = useMemo(() => {
    const R = result?.coperchio.R ?? 0;
    const r = result?.coperchio.r ?? 0;
    const half = dInt / 2;
    return Math.pow(R - r, 2) - Math.pow(half - r, 2) >= 0;
  }, [result, dInt]);

  const raccordoError =
    angolo == null
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
    // ricalcola R/r del coperchio se standard
    if (input.coperchio.type === 'decinormale') {
      next.coperchio = { ...input.coperchio };
    } else if (input.coperchio.type === 'pseudoellittico') {
      next.coperchio = { ...input.coperchio };
    }
    // mantiene l'angolo del cono costante al variare del diametro
    if (angolo != null) {
      const h = hTotFromAngle(angolo, v / 2, rRaccordoCono, hCollettoCono);
      if (isFinite(h)) next.fondo = { ...input.fondo, hCono: Math.round(h * 10) / 10 };
    }
    onChange(next);
  };

  const setAngolo = (v: number) => {
    if (!(v > 0 && v < 90)) return;
    const h = hTotFromAngle(v, dInt / 2, rRaccordoCono, hCollettoCono);
    if (!isFinite(h)) return;
    patchFondo({ hCono: Math.round(h * 10) / 10 });
  };

  /* --- tipo coperchio (preset) --- */
  type Preset = 'klopper' | 'korbbogen' | 'pseudoellittico' | 'custom';
  const presetCoperchio: Preset =
    input.coperchio.type === 'decinormale'
      ? 'klopper'
      : input.coperchio.type === 'pseudoellittico'
        ? 'pseudoellittico'
        : Math.abs((input.coperchio.R_custom ?? 0) - 0.8 * dInt) < 0.6 &&
            Math.abs((input.coperchio.r_custom ?? 0) - 0.154 * dInt) < 0.6
          ? 'korbbogen'
          : 'custom';

  const setPreset = (p: Preset) => {
    if (p === 'klopper') {
      patchCoperchio({ type: 'decinormale' as HeadType });
    } else if (p === 'pseudoellittico') {
      patchCoperchio({ type: 'pseudoellittico' as HeadType });
    } else if (p === 'korbbogen') {
      patchCoperchio({
        type: 'custom' as HeadType,
        R_custom: Math.round(0.8 * dInt * 10) / 10,
        r_custom: Math.round(0.154 * dInt * 10) / 10,
      });
    } else {
      patchCoperchio({
        type: 'custom' as HeadType,
        R_custom: input.coperchio.R_custom ?? dInt,
        r_custom: input.coperchio.r_custom ?? dInt / 10,
      });
    }
  };

  const R_disp = result?.coperchio.R ?? 0;
  const r_disp = result?.coperchio.r ?? 0;
  const isCustomHead = input.coperchio.type === 'custom';

  /* ---------- layout disegno: 5 fasce fisse indipendenti ---------- */
  const drawW = 800;
  const drawH = 660;

  const LEFT_W = 220;   // 1.1 colonna riquadri dati
  const RIGHT_W = 110;  // 1.2 colonna quote
  const TOP_BAND = 28;  // 1.3 fascia superiore incomprimibile
  const BOTTOM_BAND = 84; // 1.4 fascia riquadro "Inclin. cono"
  const SAFE = 24;      // 1.5 margine di sicurezza

  const zoneX0 = LEFT_W + SAFE;
  const zoneX1 = drawW - RIGHT_W - SAFE;
  const zoneY0 = TOP_BAND;
  const zoneY1 = drawH - BOTTOM_BAND;
  const availH = zoneY1 - zoneY0;
  const cx = (zoneX0 + zoneX1) / 2;

  // 2.1 larghezza disegno fissa: dipende solo dal Ø, mai riscalata in orizzontale
  const halfW = Math.min(150, (zoneX1 - zoneX0) * 0.36);
  const scaleBase = halfW / (dInt / 2 || 1);

  // 3.1 / 3.2 coperchio e virola: altezze GRAFICHE FISSE (non scalate, solo rappresentative)
  const hCoperchio_px = 96;
  const lCil_px = 250;

  // 3.3 fondo conico: unica parte scalata — inclinazione proporzionale alla larghezza (Ø)
  const hConoIdeal = hCono_calc * scaleBase;
  const maxConoPx = Math.max(40, availH - hCoperchio_px - lCil_px);
  const hCono_px = Math.min(hConoIdeal, maxConoPx);

  const totalDrawn = hCoperchio_px + lCil_px + hCono_px;
  // 4.1 spazio in eccesso: disegno centrato verticalmente
  const yDomeTop = zoneY0 + Math.max(0, (availH - totalDrawn) / 2);
  const yCilTop = yDomeTop + hCoperchio_px;
  const yCilBot = yCilTop + lCil_px;
  const yApex = yCilBot + hCono_px;


  const leftX = cx - halfW;
  const rightX = cx + halfW;
  const yCilMid = (yCilTop + yCilBot) / 2;

  // curva coperchio bombato (in ALTO): peak reale della bezier = 0.75 * rise
  const domeRise = Math.max(hCoperchio_px / 0.75, 18);

  const pathData = `
    M ${leftX} ${yCilTop}
    C ${leftX} ${yCilTop - domeRise}, ${rightX} ${yCilTop - domeRise}, ${rightX} ${yCilTop}
    L ${rightX} ${yCilBot}
    L ${cx} ${yApex}
    L ${leftX} ${yCilBot}
    Z
  `;

  // callout 1 — ancoraggio percentuale sull'altezza disegnata del coperchio
  const domeT = 0.15;
  const p0 = { x: leftX, y: yCilTop };
  const p1 = { x: leftX, y: yCilTop - domeRise };
  const p2 = { x: rightX, y: yCilTop - domeRise };
  const p3 = { x: rightX, y: yCilTop };
  const mt = 1 - domeT;
  const domePtX =
    mt * mt * mt * p0.x + 3 * mt * mt * domeT * p1.x + 3 * mt * domeT * domeT * p2.x + domeT ** 3 * p3.x;
  const domePtY =
    mt * mt * mt * p0.y + 3 * mt * mt * domeT * p1.y + 3 * mt * domeT * domeT * p2.y + domeT ** 3 * p3.y;
  const callout1X = domePtX - 15;
  const callout1Y = domePtY - 6;

  // callout 3 — 50% dell'altezza disegnata del cono (percentuale, non px assoluti)
  const coneT = 0.5;
  const coneVX = cx - leftX;
  const coneVY = yApex - yCilBot;
  const coneLen = Math.sqrt(coneVX * coneVX + coneVY * coneVY) || 1;
  const conePointX = leftX + coneVX * coneT;
  const conePointY = yCilBot + coneVY * coneT;
  const callout3X = conePointX + (-coneVY / coneLen) * 16;
  const callout3Y = conePointY + (coneVX / coneLen) * 16;

  // colonna quote (destra, larghezza fissa)
  const chainX = drawW - RIGHT_W + 16;   // 706
  const dim4X = drawW - RIGHT_W - 8;     // 682 (quota totale, testo verso sinistra)

  const boxW = 208;
  const box1H = 176;
  // spazio bianco uniforme fra tutti i riquadri verdi
  const BOX_GAP = 12;
  // riquadro 3 (fondo conico): allineato in basso, in linea con il riquadro "Inclin. cono"
  const box3H = 155;
  const box3Y = drawH - box3H - 6;
  // riquadro 2 (sezione cilindrica): include lo spessore virola
  const box2H = 96;
  const box2Y = box3Y - BOX_GAP - box2H;
  // riquadro somma cilindrica + conica
  const boxSumH = 76;
  const boxSumY = box2Y - BOX_GAP - boxSumH;
  // riquadro 1 (coperchio)
  const box1Y = Math.max(4, Math.min(callout1Y - 50, boxSumY - box1H - BOX_GAP));
  // ancoraggio del callout 2 alla quota del riquadro 2
  const callout2Y = Math.min(Math.max(box2Y + box2H / 2, yCilTop + 18), yCilBot - 18);

  const boxCapTotW = Math.max(150, Math.min(230, (rightX - leftX) * 0.86));
  const boxCapTotH = 60;
  const boxCapTotX = cx - boxCapTotW / 2;
  const boxCapTotY = yCilMid - 20 - boxCapTotH;



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
          Tutte le misure da inserire (diametro, altezze, ecc.) sono <span className="underline">misure interne</span>.
          Clicca direttamente sui valori nello schema per modificarli.
        </p>
      </div>

      <div className="bg-white border-4 border-double border-emerald-800 rounded-xl p-2 overflow-x-auto">
        <svg
          viewBox={`0 0 ${drawW} ${drawH}`}
          className="w-full h-auto min-w-[680px]"
          xmlns="http://www.w3.org/2000/svg"
        >
          <line
            x1={cx}
            y1={yDomeTop - 20}
            x2={cx}
            y2={yApex + 20}
            stroke="#94a3b8"
            strokeWidth="1"
            strokeDasharray="6,4"
          />

          {/* RIQUADRO 1 — COPERCHIO BOMBATO */}
          <g>
            <rect x={6} y={box1Y} width={boxW} height={box1H} rx="5" fill="#ffffff" stroke="#0f766e" strokeWidth="1.2" />
            <line
              x1={6 + boxW}
              y1={Math.min(Math.max(callout1Y, box1Y + 16), box1Y + box1H - 10)}
              x2={callout1X + 13}
              y2={callout1Y}
              stroke="#0f766e"
              strokeWidth="1"
              strokeDasharray="3,3"
            />
            <foreignObject x={12} y={box1Y + 5} width={boxW - 18} height="24">
              <select
                value={presetCoperchio}
                onChange={(e) => setPreset(e.target.value as Preset)}
                style={{
                  width: '100%',
                  fontSize: '11px',
                  fontWeight: 600,
                  color: '#0f172a',
                  background: '#ffffff',
                  border: '1px solid #94a3b8',
                  borderRadius: '3px',
                  padding: '2px 4px',
                  outline: 'none',
                  fontFamily: 'inherit',
                }}
              >
                <option value="klopper">Klopper DIN 28011 (decinormale)</option>
                <option value="korbbogen">Korbbogen DIN 28013</option>
                <option value="pseudoellittico">Pseudoellittico</option>
                <option value="custom">Fuori Standard</option>
              </select>
            </foreignObject>
            <foreignObject x={12} y={box1Y + 31} width={boxW - 18} height="24">
              <MiniField
                label="R grande"
                value={Math.round(R_disp * 10) / 10}
                onChange={(v) => patchCoperchio({ R_custom: v })}
                readOnly={!isCustomHead}
              />
            </foreignObject>
            <foreignObject x={12} y={box1Y + 57} width={boxW - 18} height="24">
              <MiniField
                label="r piccolo"
                value={Math.round(r_disp * 10) / 10}
                onChange={(v) => patchCoperchio({ r_custom: v })}
                readOnly={!isCustomHead}
              />
            </foreignObject>
            <foreignObject x={12} y={box1Y + 83} width={boxW - 18} height="24">
              <MiniField label="Colletto" value={hCollettoCoperchio} onChange={(v) => patchCoperchio({ hColletto: v })} />
            </foreignObject>
            <foreignObject x={12} y={box1Y + 109} width={boxW - 18} height="24">
              <MiniField label="Sp." value={input.coperchio.sp} onChange={(v) => patchCoperchio({ sp: v })} />
            </foreignObject>
            <text x={6 + boxW / 2} y={box1Y + 148} textAnchor="middle" fontSize="11" fontWeight="600" fill="#000000">
              Coperchio bombato — litri
            </text>
            <text x={6 + boxW / 2} y={box1Y + 166} textAnchor="middle" fontSize="12" fontWeight="700" fill="#0f766e">
              {result ? fmtL(result.volumeCoperchio) : '—'}
            </text>
          </g>

          {/* RIQUADRO SOMMA — SEZIONE CILINDRICA + CONICA */}
          <g>
            <rect x={6} y={boxSumY} width={boxW} height={boxSumH} rx="5" fill="#ffffff" stroke="#0f766e" strokeWidth="1.2" />
            <text x={6 + boxW / 2} y={boxSumY + 18} textAnchor="middle" fontSize="11" fontWeight="600" fill="#000000">
              Sezione cilindrica + conica
            </text>
            <text x={6 + boxW / 2} y={boxSumY + 40} textAnchor="middle" fontSize="11" fontWeight="600" fill="#000000">
              Capacità in litri
            </text>
            <text x={6 + boxW / 2} y={boxSumY + 62} textAnchor="middle" fontSize="12" fontWeight="700" fill="#0f766e">
              {result ? fmtL(result.volumeCilindro + result.volumeFondo) : '—'}
            </text>
          </g>

          {/* RIQUADRO 2 — VIROLA */}
          <g>
            <rect x={6} y={box2Y} width={boxW} height={box2H} rx="5" fill="#ffffff" stroke="#0f766e" strokeWidth="1.2" />
            <line
              x1={6 + boxW}
              y1={Math.min(Math.max(callout2Y, box2Y + 16), box2Y + box2H - 10)}
              x2={leftX - 28}
              y2={callout2Y}
              stroke="#0f766e"
              strokeWidth="1"
              strokeDasharray="3,3"
            />
            <text x={6 + boxW / 2} y={box2Y + 18} textAnchor="middle" fontSize="11" fontWeight="600" fill="#000000">
              Sezione cilindrica
            </text>
            <text x={6 + boxW / 2} y={box2Y + 40} textAnchor="middle" fontSize="11" fontWeight="600" fill="#000000">
              Capacità in litri
            </text>
            <text x={6 + boxW / 2} y={box2Y + 62} textAnchor="middle" fontSize="12" fontWeight="700" fill="#0f766e">
              {result ? fmtL(result.volumeCilindro) : '—'}
            </text>
          </g>


          {/* RIQUADRO 3 — FONDO CONICO */}
          <g>
            <rect x={6} y={box3Y} width={boxW} height={box3H} rx="5" fill="#ffffff" stroke="#0f766e" strokeWidth="1.2" />
            <line
              x1={6 + boxW}
              y1={Math.min(Math.max(callout3Y, box3Y + 20), box3Y + box3H - 18)}
              x2={callout3X - 13}
              y2={callout3Y}
              stroke="#0f766e"
              strokeWidth="1"
              strokeDasharray="3,3"
            />
            <text x={6 + boxW / 2} y={box3Y + 18} textAnchor="middle" fontSize="11" fontWeight="600" fill="#000000">
              Fondo conico
            </text>
            <foreignObject x={12} y={box3Y + 26} width={boxW - 18} height="24">
              <MiniField
                label="R racc."
                value={rRaccordoCono}
                onChange={(v) => patchFondo({ rRaccordo: v })}
                labelWidth="58px"
                width="78px"
              />
            </foreignObject>
            <foreignObject x={12} y={box3Y + 52} width={boxW - 18} height="24">
              <MiniField
                label="Colletto"
                value={hCollettoCono}
                onChange={(v) => patchFondo({ hColletto: v })}
                labelWidth="58px"
                width="78px"
              />
            </foreignObject>
            <foreignObject x={12} y={box3Y + 78} width={boxW - 18} height="24">
              <MiniField
                label="Sp."
                value={input.fondo.sp}
                onChange={(v) => patchFondo({ sp: v })}
                labelWidth="58px"
                width="78px"
              />
            </foreignObject>
            <text x={6 + boxW / 2} y={box3Y + 124} textAnchor="middle" fontSize="11" fontWeight="600" fill="#000000">
              Fondo conico — litri
            </text>
            <text x={6 + boxW / 2} y={box3Y + 142} textAnchor="middle" fontSize="12" fontWeight="700" fill="#0f766e">
              {result ? fmtL(result.volumeFondo) : '—'}
            </text>

          </g>

          {/* PROFILO SERBATOIO */}
          <path d={pathData} fill="#f8fafc" stroke="#1e293b" strokeWidth="1.6" />
          <line x1={leftX} y1={yCilTop} x2={rightX} y2={yCilTop} stroke="#1e293b" strokeWidth="1" />
          <line x1={leftX} y1={yCilBot} x2={rightX} y2={yCilBot} stroke="#1e293b" strokeWidth="1" />

          {/* CALLOUTS */}
          <g>
            <circle cx={callout1X} cy={callout1Y} r="13" fill="#ffffff" stroke="#0f766e" strokeWidth="1.4" />
            <text x={callout1X} y={callout1Y + 5} textAnchor="middle" fontSize="13" fontWeight="700" fill="#0f766e">1</text>
          </g>
          <g>
            <circle cx={leftX - 15} cy={callout2Y} r="13" fill="#ffffff" stroke="#0f766e" strokeWidth="1.4" />
            <text x={leftX - 15} y={callout2Y + 5} textAnchor="middle" fontSize="13" fontWeight="700" fill="#0f766e">2</text>
          </g>
          <g>
            <circle cx={callout3X} cy={callout3Y} r="13" fill="#ffffff" stroke="#0f766e" strokeWidth="1.4" />
            <text x={callout3X} y={callout3Y + 5} textAnchor="middle" fontSize="13" fontWeight="700" fill="#0f766e">3</text>
          </g>

          {/* QUOTA DIAMETRO */}
          <g>
            <line x1={leftX} y1={yCilMid + 46} x2={rightX} y2={yCilMid + 46} stroke="#334155" strokeWidth="1" />
            <line x1={leftX} y1={yCilMid + 40} x2={leftX} y2={yCilMid + 52} stroke="#334155" strokeWidth="1" />
            <line x1={rightX} y1={yCilMid + 40} x2={rightX} y2={yCilMid + 52} stroke="#334155" strokeWidth="1" />
            <text x={cx - 58} y={yCilMid + 33} textAnchor="end" fontSize="13" fontWeight="700" fill="#000000">Ø</text>
            <foreignObject x={cx - 46} y={yCilMid + 14} width="92" height="24">
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

          {/* CATENA DI QUOTE: coperchio + virola + fondo conico */}
          <g>
            <line x1={chainX} y1={yDomeTop} x2={chainX} y2={yApex} stroke="#334155" strokeWidth="1" />
            {[yDomeTop, yCilTop, yCilBot, yApex].map((yy, i) => (
              <line key={i} x1={chainX - 7} y1={yy} x2={chainX + 7} y2={yy} stroke="#334155" strokeWidth="1" />
            ))}
            <text x={chainX + 10} y={(yDomeTop + yCilTop) / 2 + 5} fontSize="14" fontWeight="600" fill="#000000">
              {fmt(hCoperchio_calc)}
            </text>
            <foreignObject x={chainX + 8} y={yCilMid - 12} width="86" height="24">
              <input
                type="number"
                value={lCil}
                onChange={(e) => patch({ lCil: Number(e.target.value) })}
                style={editableDimStyle}
                className="editable-dim"
                title="Altezza sezione cilindrica (mm)"
              />
            </foreignObject>
            <foreignObject x={chainX + 8} y={(yCilBot + yApex) / 2 - 12} width="86" height="24">
              <input
                type="number"
                value={hCono}
                onChange={(e) => patchFondo({ hCono: Number(e.target.value) })}
                style={editableDimStyle}
                className="editable-dim"
                title="Altezza fondo conico, colletto incluso (mm)"
              />
            </foreignObject>
          </g>

          {/* QUOTA TOTALE */}
          <DimLine x={dim4X} y1={yDomeTop} y2={yApex} label={fmt(hTot)} />

          {/* CAPACITÀ TOTALE */}
          <g>
            <rect x={boxCapTotX} y={boxCapTotY} width={boxCapTotW} height={boxCapTotH} rx="5" fill="#ffffff" stroke="#0f766e" strokeWidth="1.2" />
            <text x={boxCapTotX + boxCapTotW / 2} y={boxCapTotY + 23} textAnchor="middle" fontSize="12" fontWeight="600" fill="#000000">
              Capacità totale lt.
            </text>
            <text x={boxCapTotX + boxCapTotW / 2} y={boxCapTotY + 45} textAnchor="middle" fontSize="15" fontWeight="700" fill="#0f766e">
              {result ? fmtL(result.volumeTotale) : '—'}
            </text>
          </g>

          {/* INCLINAZIONE CONO — riquadro nella fascia inferiore fissa */}
          {(() => {
            const angBoxW = 108;
            const angBoxH = 42;
            const angBoxX = Math.min(cx + halfW + 24, drawW - RIGHT_W - SAFE - angBoxW);
            const angBoxY = drawH - BOTTOM_BAND + 14;

            // vertice dell'angolo: incrocio virola verticale / linea inclinata destra del cono
            const vx = rightX;
            const vy = yCilBot;
            const dxS = cx - rightX;
            const dyS = yApex - yCilBot;
            const lenS = Math.hypot(dxS, dyS) || 1;
            const rArc = 34;
            const ax = vx - rArc; // direzione orizzontale (verso l'interno)
            const ay = vy;
            const bx = vx + (dxS / lenS) * rArc;
            const by = vy + (dyS / lenS) * rArc;
            const labX = vx - rArc * 0.72;
            const labY = vy + rArc * 0.46;
            return (
              <g>
                {/* linea inclinata di riferimento */}
                <line x1={cx} y1={yApex} x2={rightX} y2={yCilBot} stroke="#94a3b8" strokeWidth="1" strokeDasharray="3,3" />
                {/* semicerchio dell'angolo */}
                <path
                  d={`M ${ax} ${ay} A ${rArc} ${rArc} 0 0 0 ${bx} ${by}`}
                  fill="none"
                  stroke="#0f766e"
                  strokeWidth="1.4"
                />
                <circle cx={vx} cy={vy} r="2.4" fill="#0f766e" />
                <text x={labX} y={labY} textAnchor="middle" fontSize="12" fontWeight="700" fill="#0f766e">
                  {angolo != null ? `${angolo.toFixed(1)}°` : ''}
                </text>
                {/* richiamo dal riquadro al vertice */}
                <line
                  x1={angBoxX + angBoxW / 2}
                  y1={angBoxY}
                  x2={vx}
                  y2={vy}
                  stroke="#0f766e"
                  strokeWidth="1"
                  strokeDasharray="4,3"
                />
                <rect x={angBoxX} y={angBoxY} width={angBoxW} height={angBoxH} rx="5" fill="#ffffff" stroke="#0f766e" strokeWidth="1.2" />
                <text x={angBoxX + 7} y={angBoxY + 14} fontSize="10" fontWeight="700" fill="#000000">Inclin. cono</text>
                <foreignObject x={angBoxX + 5} y={angBoxY + 18} width={angBoxW - 10} height="22">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
                    <input
                      type="number"
                      value={angolo ?? ''}
                      onChange={(e) => setAngolo(Number(e.target.value))}
                      style={{ ...editableDimStyle, width: '82px' }}
                      className="editable-dim"
                      title="Inclinazione del cono (gradi)"
                    />
                    <span style={{ fontSize: '11px', color: '#000000' }}>°</span>
                  </div>
                </foreignObject>
              </g>
            );
          })()}


          <text x={drawW - 8} y={drawH - 8} textAnchor="end" fontSize="13" fill="#000000">
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
      {(raccordoError || !geometriaCoperchioValida) && (
        <div className="bg-rose-50 border border-rose-300 rounded-xl p-3 space-y-1">
          {raccordoError && <p className="text-xs font-bold text-rose-900">{raccordoError}</p>}
          {!geometriaCoperchioValida && (
            <p className="text-xs font-bold text-rose-900">
              I raggi del coperchio bombato non sono geometricamente compatibili con il diametro interno.
            </p>
          )}
        </div>
      )}

      {/* VERIFICA COERENZA ALTEZZE INTERNE */}
      <div className="bg-emerald-50/50 border border-emerald-300 rounded-xl p-3">
        <div className="flex items-center gap-2 mb-2">
          <Info className="w-4 h-4 text-emerald-800 shrink-0" />
          <h4 className="text-xs font-black uppercase text-emerald-900">
            Verifica coerenza altezze interne
          </h4>
        </div>
        <div className="grid grid-cols-2 gap-y-1 text-xs font-bold text-neutral-800">
          <span>Fondo conico (colletto incluso)</span>
          <span className="text-right font-mono">{fmt(hCono_calc)} mm</span>
          <span>Sezione cilindrica (virola)</span>
          <span className="text-right font-mono">{fmt(lCil)} mm</span>
          <span>Coperchio bombato (colletto incluso)</span>
          <span className="text-right font-mono">{fmt(hCoperchio_calc)} mm</span>
          <span className="border-t border-emerald-300 pt-1">Somma</span>
          <span className="text-right font-mono border-t border-emerald-300 pt-1">
            {fmt(hCono_calc + lCil + hCoperchio_calc)} mm
          </span>
          <span className="font-black">Altezza totale interna (H_tot)</span>
          <span className="text-right font-mono font-black">{fmt(hTot)} mm</span>
        </div>
        <p
          className={`mt-2 text-xs font-black ${
            Math.abs(hCono_calc + lCil + hCoperchio_calc - hTot) <= 1.5
              ? 'text-emerald-800'
              : 'text-rose-800'
          }`}
        >
          {Math.abs(hCono_calc + lCil + hCoperchio_calc - hTot) <= 1.5
            ? '✓ Altezze coerenti (scarto ≤ 1,5 mm per arrotondamento)'
            : '⚠ Scarto rilevato: verifica i parametri geometrici'}
        </p>
      </div>
    </div>
  );
}
