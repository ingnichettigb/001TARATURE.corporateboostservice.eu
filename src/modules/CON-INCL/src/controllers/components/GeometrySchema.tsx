/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo, useState, useEffect } from 'react';
import { TankInput } from '../../models/types';
import { calculateTank, dislivelloFromAngle, angleFromDislivello, raggioRaccordoMax, clampRaggioRaccordo } from '../../services/logic';
import { AlertTriangle, Info } from 'lucide-react';

interface GeometrySchemaProps {
  input: TankInput;
  onChange: (input: TankInput) => void;
}

/* ---------- helpers geometria fondo inclinato (stessa convenzione del motore) ----------
   Relazione bidirezionale: dislivello = Ø · tan(angolo)  ⇔  angolo = atan(dislivello / Ø) */

/* ---------- helpers geometria coperchio conico (stessa convenzione del motore) ---------- */
// h_cono = ALTEZZA TOTALE del coperchio conico, COLLETTO INCLUSO.
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

  /* --- FONDO (inclinato) --- */
  const hCollettoFondo = input.fondo.hColletto;
  const dislivello = input.fondo.hDislivello ?? Math.round(dislivelloFromAngle(5, dInt) * 10) / 10;

  const angoloFondo = useMemo(() => {
    const a = angleFromDislivello(dislivello, dInt);
    return a != null ? Math.round(a * 10) / 10 : null;
  }, [dislivello, dInt]);

  // RAGGIO DI RACCORDO fondo: min 0, max 10% del diametro interno (r < R)
  const raggioRaccordoFondo = input.fondo.rRaccordo ?? 0;
  const raggioRaccordoLimite = Math.round(raggioRaccordoMax(dInt) * 10) / 10;
  const [raccordoWarning, setRaccordoWarning] = useState<string | null>(null);

  /* --- COPERCHIO (conico) --- */
  const rRaccordoCono = input.coperchio.rRaccordo ?? 30;
  const hCollettoCoperchio = input.coperchio.hColletto;
  const hCono = input.coperchio.hCono ?? Math.round(dInt / 2 + hCollettoCoperchio);

  const angoloCoperchio = useMemo(() => {
    const a = angleFromHTot(hCono, dInt / 2, rRaccordoCono, hCollettoCoperchio);
    return a != null ? Math.round(a * 10) / 10 : null;
  }, [hCono, dInt, rRaccordoCono, hCollettoCoperchio]);

  const result = useMemo(() => {
    try {
      return calculateTank(input);
    } catch {
      return null;
    }
  }, [input]);

  const hCoperchio_calc = hCono;
  const hFondo_calc = dislivello + hCollettoFondo;
  const hTot = result ? result.H_tot : hCoperchio_calc + lCil + hFondo_calc;

  const raccordoErrorFondo =
    angoloFondo == null
      ? 'Il dislivello inserito non \u00e8 compatibile con questo diametro: usa un valore maggiore di zero.'
      : null;

  const raccordoErrorCoperchio =
    angoloCoperchio == null
      ? 'Il raggio di raccordo o l\u2019altezza del coperchio conico inseriti non sono compatibili con questo diametro.'
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
    // mantiene l'angolo del fondo inclinato costante al variare del diametro
    if (angoloFondo != null) {
      const d = dislivelloFromAngle(angoloFondo, v);
      if (isFinite(d) && d > 0) next.fondo = { ...input.fondo, hDislivello: Math.round(d * 10) / 10 };
    }
    // mantiene l'angolo del coperchio conico costante al variare del diametro
    if (angoloCoperchio != null) {
      const h = hTotFromAngle(angoloCoperchio, v / 2, rRaccordoCono, hCollettoCoperchio);
      if (isFinite(h)) next.coperchio = { ...next.coperchio, hCono: Math.round(h * 10) / 10 };
    }
    onChange(next);
  };

  // digitando l'ANGOLO del fondo si ricalcola il DISLIVELLO
  const setAngoloFondo = (v: number) => {
    if (!(v > 0 && v < 90)) return;
    const d = dislivelloFromAngle(v, dInt);
    if (!isFinite(d) || !(d > 0)) return;
    patchFondo({ hDislivello: Math.round(d * 10) / 10 });
  };

  // digitando il DISLIVELLO l'angolo del fondo viene ricalcolato (derivato, via useMemo)
  const setDislivello = (v: number) => {
    if (!(v > 0)) return;
    patchFondo({ hDislivello: Math.round(v * 10) / 10 });
  };

  const setRaggioRaccordoFondo = (v: number) => {
    if (!isFinite(v) || v < 0) return;
    const clamped = clampRaggioRaccordo(v, dInt);
    if (v > clamped + 1e-6) {
      setRaccordoWarning(
        `Raggio di raccordo limitato a ${raggioRaccordoLimite} mm (10% del diametro interno ${dInt} mm).`,
      );
    } else {
      setRaccordoWarning(null);
    }
    patchFondo({ rRaccordo: Math.round(clamped * 10) / 10 });
  };

  // al variare del diametro il massimo si ricalcola: se superato, riporta al massimo
  useEffect(() => {
    const clamped = clampRaggioRaccordo(raggioRaccordoFondo, dInt);
    if (raggioRaccordoFondo > clamped + 1e-6) {
      setRaccordoWarning(
        `Raggio di raccordo riportato al massimo ${raggioRaccordoLimite} mm (10% del diametro interno ${dInt} mm).`,
      );
      patchFondo({ rRaccordo: Math.round(clamped * 10) / 10 });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dInt]);

  // digitando l'ANGOLO del coperchio conico si ricalcola l'altezza hCono
  const setAngoloCoperchio = (v: number) => {
    if (!(v > 0 && v < 90)) return;
    const h = hTotFromAngle(v, dInt / 2, rRaccordoCono, hCollettoCoperchio);
    if (!isFinite(h)) return;
    patchCoperchio({ hCono: Math.round(h * 10) / 10 });
  };

  /* ---------- layout disegno: 5 fasce fisse indipendenti ---------- */
  const drawW = 800;
  const drawH = 660;

  const LEFT_W = 220;   // 1.1 colonna riquadri dati
  const RIGHT_W = 110;  // 1.2 colonna quote
  const TOP_BAND = 28;  // 1.3 fascia superiore incomprimibile
  const BOTTOM_BAND = 84; // 1.4 fascia riquadro "Inclin. fondo"
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

  // 3.1 virola: altezza GRAFICA FISSA (non scalata, solo rappresentativa)
  const lCil_px = 250;

  // 3.2 coperchio conico (in ALTO) e fondo inclinato (in BASSO): entrambe le teste sono
  // geometrie "scalate" (non standard/bombate) — si ripartisce lo spazio residuo in proporzione
  // alle rispettive altezze reali, con un minimo di leggibilità per ciascuna.
  const headsBudget = Math.max(80, availH - lCil_px);
  const hConoIdeal = Math.max(1, hCoperchio_calc * scaleBase);
  const hFondoIdeal = Math.max(1, hFondo_calc * scaleBase);
  const idealSum = hConoIdeal + hFondoIdeal;
  let hCono_px = Math.max(24, (hConoIdeal / idealSum) * headsBudget);
  let hFondo_px = Math.max(24, (hFondoIdeal / idealSum) * headsBudget);
  const sumPx = hCono_px + hFondo_px;
  if (sumPx > headsBudget) {
    const k = headsBudget / sumPx;
    hCono_px *= k;
    hFondo_px *= k;
  }

  const collettoShare = hFondo_calc > 0 ? hCollettoFondo / hFondo_calc : 0;
  const colletto_px = hFondo_px * collettoShare;
  const drop_px = hFondo_px - colletto_px;

  const totalDrawn = hCono_px + lCil_px + hFondo_px;
  // 4.1 spazio in eccesso: disegno centrato verticalmente
  const yApexTop = zoneY0 + Math.max(0, (availH - totalDrawn) / 2); // apice del cono (in alto)
  const yCilTop = yApexTop + hCono_px;
  const yCilBot = yCilTop + lCil_px;
  const yBotHigh = yCilBot + colletto_px;      // punto alto del fondo inclinato (lato destro)
  const yFondoBasso = yBotHigh + drop_px;      // punto basso del fondo inclinato (lato sinistro)

  const leftX = cx - halfW;
  const rightX = cx + halfW;
  const yCilMid = (yCilTop + yCilBot) / 2;

  const pathData = `
    M ${leftX} ${yCilTop}
    L ${cx} ${yApexTop}
    L ${rightX} ${yCilTop}
    L ${rightX} ${yBotHigh}
    L ${leftX} ${yFondoBasso}
    Z
  `;

  // callout 1 — coperchio conico: punto medio dello spigolo del cono
  const coneT = 0.5;
  const coneVX = cx - leftX;
  const coneVY = yApexTop - yCilTop;
  const coneLen = Math.hypot(coneVX, coneVY) || 1;
  const conePointX = leftX + coneVX * coneT;
  const conePointY = yCilTop + coneVY * coneT;
  const callout1X = conePointX + (coneVY / coneLen) * 16;
  const callout1Y = conePointY - (coneVX / coneLen) * 16;

  // callout 3 — fondo inclinato: ancorato alla parete verticale sinistra
  const callout3X = leftX - 15;
  const callout3Y = Math.min(Math.max((yCilBot + yFondoBasso) / 2, yCilBot + 10), yFondoBasso - 10);

  // colonna quote (destra, larghezza fissa)
  const chainX = drawW - RIGHT_W + 16;   // 706
  const dim4X = drawW - RIGHT_W - 8;     // 682 (quota totale, testo verso sinistra)

  const boxW = 208;
  const box1H = 155; // riquadro coperchio conico
  const boxSumH = 76;
  const box2H = 96;
  const box3H = 181; // riquadro fondo inclinato
  // riquadro 3 (fondo inclinato): fisso in basso
  const box3Y = drawH - box3H - 6;
  // riquadro 1 (coperchio conico): fisso in alto, ancorato al callout del cono
  const box1Y = Math.max(4, Math.min(callout1Y - 50, box3Y - box1H - boxSumH - box2H - 36));
  // i due riquadri centrali si redistribuiscono con spazio verticale uguale
  const boxGapV = (box3Y - (box1Y + box1H) - boxSumH - box2H) / 3;
  const boxSumY = box1Y + box1H + boxGapV;
  const box2Y = boxSumY + boxSumH + boxGapV;
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
            y1={yApexTop - 20}
            x2={cx}
            y2={yFondoBasso + 20}
            stroke="#94a3b8"
            strokeWidth="1"
            strokeDasharray="6,4"
          />

          {/* RIQUADRO 1 — COPERCHIO CONICO */}
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
            <text x={6 + boxW / 2} y={box1Y + 18} textAnchor="middle" fontSize="11" fontWeight="600" fill="#000000">
              Coperchio conico
            </text>
            <foreignObject x={12} y={box1Y + 26} width={boxW - 18} height="24">
              <MiniField
                label="R racc."
                value={rRaccordoCono}
                onChange={(v) => patchCoperchio({ rRaccordo: v })}
                labelWidth="58px"
                width="78px"
              />
            </foreignObject>
            <foreignObject x={12} y={box1Y + 52} width={boxW - 18} height="24">
              <MiniField
                label="Colletto"
                value={hCollettoCoperchio}
                onChange={(v) => patchCoperchio({ hColletto: v })}
                labelWidth="58px"
                width="78px"
              />
            </foreignObject>
            <foreignObject x={12} y={box1Y + 78} width={boxW - 18} height="24">
              <MiniField
                label="Sp."
                value={input.coperchio.sp}
                onChange={(v) => patchCoperchio({ sp: v })}
                labelWidth="58px"
                width="78px"
              />
            </foreignObject>
            <text x={6 + boxW / 2} y={box1Y + 124} textAnchor="middle" fontSize="11" fontWeight="600" fill="#000000">
              Coperchio conico — litri
            </text>
            <text x={6 + boxW / 2} y={box1Y + 142} textAnchor="middle" fontSize="12" fontWeight="700" fill="#0f766e">
              {result ? fmtL0(result.volumeCoperchio) : '—'}
            </text>
          </g>

          {/* RIQUADRO SOMMA — SEZIONE CILINDRICA + FONDO INCLINATO */}
          <g>
            <rect x={6} y={boxSumY} width={boxW} height={boxSumH} rx="5" fill="#ffffff" stroke="#0f766e" strokeWidth="1.2" />
            <text x={6 + boxW / 2} y={boxSumY + 18} textAnchor="middle" fontSize="11" fontWeight="600" fill="#000000">
              Sezione cilindrica + fondo inclinato
            </text>
            <text x={6 + boxW / 2} y={boxSumY + 40} textAnchor="middle" fontSize="11" fontWeight="600" fill="#000000">
              Capacità in litri
            </text>
            <text x={6 + boxW / 2} y={boxSumY + 62} textAnchor="middle" fontSize="12" fontWeight="700" fill="#0f766e">
              {result ? fmtL0(result.volumeCilindro + result.volumeFondo) : '—'}
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
            <text x={6 + boxW / 2} y={box2Y + 16} textAnchor="middle" fontSize="11" fontWeight="600" fill="#000000">
              Sezione cilindrica
            </text>
            <text x={6 + boxW / 2} y={box2Y + 34} textAnchor="middle" fontSize="11" fontWeight="600" fill="#000000">
              Capacità in litri
            </text>
            <text x={6 + boxW / 2} y={box2Y + 54} textAnchor="middle" fontSize="12" fontWeight="700" fill="#0f766e">
              {result ? fmtL0(result.volumeCilindro) : '—'}
            </text>
            <foreignObject x={12} y={box2Y + 64} width={boxW - 18} height="26">
              <MiniField
                label="Sp. virola"
                value={input.spVirola}
                onChange={(v) => patch({ spVirola: v })}
                labelWidth="66px"
                width="78px"
              />
            </foreignObject>

          </g>

          {/* RIQUADRO 3 — FONDO INCLINATO */}
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
              Fondo inclinato
            </text>
            <foreignObject x={12} y={box3Y + 26} width={boxW - 18} height="24">
              <MiniField
                label="Dislivello"
                value={dislivello}
                onChange={(v) => setDislivello(v)}
                labelWidth="58px"
                width="78px"
              />
            </foreignObject>
            <foreignObject x={12} y={box3Y + 52} width={boxW - 18} height="24">
              <MiniField
                label="Racc. (r)"
                value={raggioRaccordoFondo}
                onChange={(v) => setRaggioRaccordoFondo(v)}
                labelWidth="58px"
                width="78px"
              />
            </foreignObject>
            <foreignObject x={12} y={box3Y + 78} width={boxW - 18} height="24">
              <MiniField
                label="Colletto"
                value={hCollettoFondo}
                onChange={(v) => patchFondo({ hColletto: v })}
                labelWidth="58px"
                width="78px"
              />
            </foreignObject>
            <foreignObject x={12} y={box3Y + 104} width={boxW - 18} height="24">
              <MiniField
                label="Sp."
                value={input.fondo.sp}
                onChange={(v) => patchFondo({ sp: v })}
                labelWidth="58px"
                width="78px"
              />
            </foreignObject>
            <text x={6 + boxW / 2} y={box3Y + 150} textAnchor="middle" fontSize="11" fontWeight="600" fill="#000000">
              Fondo inclinato — litri
            </text>
            <text x={6 + boxW / 2} y={box3Y + 168} textAnchor="middle" fontSize="12" fontWeight="700" fill="#0f766e">
              {result ? fmtL0(result.volumeFondo) : '—'}
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

          {/* CATENA DI QUOTE: coperchio conico + virola + fondo inclinato */}
          <g>
            <line x1={chainX} y1={yApexTop} x2={chainX} y2={yFondoBasso} stroke="#334155" strokeWidth="1" />
            {[yApexTop, yCilTop, yCilBot, yFondoBasso].map((yy, i) => (
              <line key={i} x1={chainX - 7} y1={yy} x2={chainX + 7} y2={yy} stroke="#334155" strokeWidth="1" />
            ))}
            <foreignObject x={chainX + 8} y={(yApexTop + yCilTop) / 2 - 12} width="86" height="24">
              <input
                type="number"
                value={hCono}
                onChange={(e) => patchCoperchio({ hCono: Number(e.target.value) })}
                style={editableDimStyle}
                className="editable-dim"
                title="Altezza coperchio conico, colletto incluso (mm)"
              />
            </foreignObject>
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
            <foreignObject x={chainX + 8} y={(yBotHigh + yFondoBasso) / 2 - 12} width="86" height="24">
              <input
                type="number"
                value={dislivello}
                onChange={(e) => setDislivello(Number(e.target.value))}
                style={editableDimStyle}
                className="editable-dim"
                title="Dislivello del fondo inclinato (mm)"
              />
            </foreignObject>
          </g>

          {/* QUOTA TOTALE */}
          <DimLine x={dim4X} y1={yApexTop} y2={yFondoBasso} label={fmt(hTot)} />

          {/* CAPACITÀ TOTALE */}
          <g>
            <rect x={boxCapTotX} y={boxCapTotY} width={boxCapTotW} height={boxCapTotH} rx="5" fill="#ffffff" stroke="#0f766e" strokeWidth="1.2" />
            <text x={boxCapTotX + boxCapTotW / 2} y={boxCapTotY + 23} textAnchor="middle" fontSize="12" fontWeight="600" fill="#000000">
              Capacità totale lt.
            </text>
            <text x={boxCapTotX + boxCapTotW / 2} y={boxCapTotY + 45} textAnchor="middle" fontSize="15" fontWeight="700" fill="#0f766e">
              {result ? fmtL0(result.volumeTotale) : '—'}
            </text>
          </g>

          {/* INCLINAZIONE CONO — riquadro nella fascia superiore (cono in alto) */}
          {(() => {
            const angBoxW = 108;
            const angBoxH = 42;
            const angBoxX = Math.min(cx + halfW + 24, drawW - RIGHT_W - SAFE - angBoxW);
            const angBoxY = Math.max(4, yCilTop - angBoxH - 30);

            const vx = rightX;
            const vy = yCilTop;
            const dxS = cx - rightX;
            const dyS = yApexTop - yCilTop;
            const lenS = Math.hypot(dxS, dyS) || 1;
            const rArc = 34;
            const ax = vx - rArc;
            const ay = vy;
            const bx = vx + (dxS / lenS) * rArc;
            const by = vy + (dyS / lenS) * rArc;
            const labX = vx - rArc * 0.72;
            const labY = vy - rArc * 0.46;
            return (
              <g>
                <line x1={cx} y1={yApexTop} x2={rightX} y2={yCilTop} stroke="#94a3b8" strokeWidth="1" strokeDasharray="3,3" />
                <path
                  d={`M ${ax} ${ay} A ${rArc} ${rArc} 0 0 1 ${bx} ${by}`}
                  fill="none"
                  stroke="#0f766e"
                  strokeWidth="1.4"
                />
                <circle cx={vx} cy={vy} r="2.4" fill="#0f766e" />
                <text x={labX} y={labY} textAnchor="middle" fontSize="12" fontWeight="700" fill="#0f766e">
                  {angoloCoperchio != null ? `${angoloCoperchio.toFixed(1)}°` : ''}
                </text>
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
                      value={angoloCoperchio ?? ''}
                      onChange={(e) => setAngoloCoperchio(Number(e.target.value))}
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

          {/* INCLINAZIONE FONDO — riquadro nella fascia inferiore fissa */}
          {(() => {
            const angBoxW = 108;
            const angBoxH = 42;
            const angBoxX = Math.min(cx + halfW + 24, drawW - RIGHT_W - SAFE - angBoxW);
            const angBoxY = drawH - BOTTOM_BAND + 14;

            const vx = rightX;
            const vy = yBotHigh;
            const dxS = leftX - rightX;
            const dyS = yFondoBasso - yBotHigh;
            const lenS = Math.hypot(dxS, dyS) || 1;
            const rArc = 34;
            const ax = vx - rArc;
            const ay = vy;
            const bx = vx + (dxS / lenS) * rArc;
            const by = vy + (dyS / lenS) * rArc;
            const labX = vx - rArc * 0.78;
            const labY = vy - rArc * 0.22;
            return (
              <g>
                <line x1={leftX} y1={yFondoBasso} x2={rightX} y2={yBotHigh} stroke="#94a3b8" strokeWidth="1" strokeDasharray="3,3" />
                <line x1={vx} y1={vy} x2={vx - (rArc + 18)} y2={vy} stroke="#94a3b8" strokeWidth="1" strokeDasharray="3,3" />
                <path
                  d={`M ${ax} ${ay} A ${rArc} ${rArc} 0 0 0 ${bx} ${by}`}
                  fill="none"
                  stroke="#0f766e"
                  strokeWidth="1.4"
                />
                <circle cx={vx} cy={vy} r="2.4" fill="#0f766e" />
                <text x={labX} y={labY} textAnchor="middle" fontSize="12" fontWeight="700" fill="#0f766e">
                  {angoloFondo != null ? `${angoloFondo.toFixed(1)}°` : ''}
                </text>
                <line
                  x1={angBoxX + angBoxW / 2}
                  y1={angBoxY}
                  x2={vx - rArc * 0.95}
                  y2={vy - 3}
                  stroke="#0f766e"
                  strokeWidth="1"
                  strokeDasharray="4,3"
                />
                <rect x={angBoxX} y={angBoxY} width={angBoxW} height={angBoxH} rx="5" fill="#ffffff" stroke="#0f766e" strokeWidth="1.2" />
                <text x={angBoxX + 7} y={angBoxY + 14} fontSize="10" fontWeight="700" fill="#000000">Inclin. fondo</text>
                <foreignObject x={angBoxX + 5} y={angBoxY + 18} width={angBoxW - 10} height="22">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
                    <input
                      type="number"
                      value={angoloFondo ?? ''}
                      onChange={(e) => setAngoloFondo(Number(e.target.value))}
                      style={{ ...editableDimStyle, width: '82px' }}
                      className="editable-dim"
                      title="Inclinazione del fondo (gradi)"
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

      {/* AVVISO RAGGIO DI RACCORDO (fondo) */}
      {raccordoWarning && (
        <div className="bg-amber-50 border border-amber-300 rounded-xl p-3">
          <p className="text-xs font-bold text-amber-900">{raccordoWarning}</p>
        </div>
      )}

      {/* ERRORI GEOMETRICI */}
      {(raccordoErrorFondo || raccordoErrorCoperchio) && (
        <div className="bg-rose-50 border border-rose-300 rounded-xl p-3 space-y-1">
          {raccordoErrorFondo && <p className="text-xs font-bold text-rose-900">{raccordoErrorFondo}</p>}
          {raccordoErrorCoperchio && <p className="text-xs font-bold text-rose-900">{raccordoErrorCoperchio}</p>}
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
          <span>Coperchio conico (colletto incluso)</span>
          <span className="text-right font-mono">{fmt(hCoperchio_calc)} mm</span>
          <span>Sezione cilindrica (virola)</span>
          <span className="text-right font-mono">{fmt(lCil)} mm</span>
          <span>Fondo inclinato (dislivello + colletto)</span>
          <span className="text-right font-mono">{fmt(hFondo_calc)} mm</span>
          <span className="border-t border-emerald-300 pt-1">Somma</span>
          <span className="text-right font-mono border-t border-emerald-300 pt-1">
            {fmt(hCoperchio_calc + lCil + hFondo_calc)} mm
          </span>
          <span className="font-black">Altezza totale interna (H_tot)</span>
          <span className="text-right font-mono font-black">{fmt(hTot)} mm</span>
        </div>
        <p
          className={`mt-2 text-xs font-black ${
            Math.abs(hCoperchio_calc + lCil + hFondo_calc - hTot) <= 1.5
              ? 'text-emerald-800'
              : 'text-rose-800'
          }`}
        >
          {Math.abs(hCoperchio_calc + lCil + hFondo_calc - hTot) <= 1.5
            ? '✓ Altezze coerenti (scarto ≤ 1,5 mm per arrotondamento)'
            : '⚠ Scarto rilevato: verifica i parametri geometrici'}
        </p>
      </div>
    </div>
  );
}
