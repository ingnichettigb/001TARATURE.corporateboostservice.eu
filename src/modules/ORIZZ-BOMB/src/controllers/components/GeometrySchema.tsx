/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo } from 'react';
import { TankInput, HeadType } from '../../models/types';
import { calculateTank } from '../../services/logic';
import { AlertTriangle, Info } from 'lucide-react';
import { COPERCHIO_A_SINISTRA } from '../../constants';

interface GeometrySchemaProps {
  input: TankInput;
  onChange: (input: TankInput) => void;
}

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

const selectStyle: React.CSSProperties = {
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
      <text x={midX} y={y - 10} fontSize="13" fontWeight={700} fill="#000000" textAnchor="middle">
        {label}
      </text>
    </g>
  );
}

/* ---------- main ---------- */

type Preset = 'klopper' | 'korbbogen' | 'pseudoellittico' | 'custom';
type HeadKey = 'fondo' | 'coperchio';
type BoxName = HeadKey | 'virola' | 'somma';

const presetOf = (head: TankInput['fondo'], dInt: number): Preset =>
  head.type === 'decinormale'
    ? 'klopper'
    : head.type === 'pseudoellittico'
      ? 'pseudoellittico'
      : Math.abs((head.R_custom ?? 0) - 0.8 * dInt) < 0.6 &&
          Math.abs((head.r_custom ?? 0) - 0.154 * dInt) < 0.6
        ? 'korbbogen'
        : 'custom';

export default function GeometrySchema({ input, onChange }: GeometrySchemaProps) {
  const dInt = input.dInt;
  const lCil = input.lCil;
  const hCollettoFondo = input.fondo.hColletto;
  const hCollettoCoperchio = input.coperchio.hColletto;

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
  const hFondo_calc = result ? result.fondo.H_int + hCollettoFondo : hCollettoFondo;
  // lunghezza interna totale lungo l'asse (serbatoio orizzontale)
  const lTot = result ? result.L_tot : hCoperchio_calc + lCil + hFondo_calc;

  const headValida = (R: number, r: number) =>
    Math.pow(R - r, 2) - Math.pow(dInt / 2 - r, 2) >= 0;

  const geometriaCoperchioValida = useMemo(
    () => headValida(result?.coperchio.R ?? 0, result?.coperchio.r ?? 0),
    [result, dInt]
  );
  const geometriaFondoValida = useMemo(
    () => headValida(result?.fondo.R ?? 0, result?.fondo.r ?? 0),
    [result, dInt]
  );

  /* --- patch helpers --- */
  const patch = (p: Partial<TankInput>) => onChange({ ...input, ...p });
  const patchFondo = (p: Partial<TankInput['fondo']>) =>
    onChange({ ...input, fondo: { ...input.fondo, ...p } });
  const patchCoperchio = (p: Partial<TankInput['coperchio']>) =>
    onChange({ ...input, coperchio: { ...input.coperchio, ...p } });

  const setDInt = (v: number) => {
    if (!(v > 0)) return;
    onChange({ ...input, dInt: v });
  };

  /* --- preset testate (fondo e coperchio, indipendenti) --- */
  const presetCoperchio = presetOf(input.coperchio, dInt);
  const presetFondo = presetOf(input.fondo, dInt);

  const presetPatch = (p: Preset, head: TankInput['fondo']): Partial<TankInput['fondo']> => {
    if (p === 'klopper') return { type: 'decinormale' as HeadType };
    if (p === 'pseudoellittico') return { type: 'pseudoellittico' as HeadType };
    if (p === 'korbbogen')
      return {
        type: 'custom' as HeadType,
        R_custom: Math.round(0.8 * dInt * 10) / 10,
        r_custom: Math.round(0.154 * dInt * 10) / 10,
      };
    return {
      type: 'custom' as HeadType,
      R_custom: head.R_custom ?? dInt,
      r_custom: head.r_custom ?? dInt / 10,
    };
  };

  const R_cop = result?.coperchio.R ?? 0;
  const r_cop = result?.coperchio.r ?? 0;
  const R_fon = result?.fondo.R ?? 0;
  const r_fon = result?.fondo.r ?? 0;
  const isCustomCoperchio = input.coperchio.type === 'custom';
  const isCustomFondo = input.fondo.type === 'custom';

  /* ---------- layout disegno (serbatoio ORIZZONTALE) ---------- */
  const drawW = 900;
  const drawH = 545;

  // Rotazione di 90° in senso orario rispetto a BOMB-BOMB: il fondo (quota 0 della
  // taratura) sta a sinistra, il coperchio a destra. Per invertire: constants.ts.
  const leftKey: HeadKey = COPERCHIO_A_SINISTRA ? 'coperchio' : 'fondo';
  const rightKey: HeadKey = leftKey === 'fondo' ? 'coperchio' : 'fondo';

  // testate e virola: lunghezze GRAFICHE FISSE (rappresentative)
  const headPx = 96;
  const cilPx = 340;
  const halfH = 80;

  const totalDrawn = headPx * 2 + cilPx;
  const xL0 = (drawW - totalDrawn) / 2; // punta testata sinistra
  const xL1 = xL0 + headPx;             // inizio virola
  const xR1 = xL1 + cilPx;              // fine virola
  const xR0 = xR1 + headPx;             // punta testata destra
  const xMid = (xL1 + xR1) / 2;

  const yc = 205; // asse del serbatoio
  const yTop = yc - halfH;
  const yBot = yc + halfH;

  const yTotal = 42; // quota totale
  const yChain = 100; // catena di quote

  // curve bombate: peak reale della bezier = 0.75 * rise
  const rise = Math.max(headPx / 0.75, 18);

  const pathData = `
    M ${xL1} ${yTop}
    L ${xR1} ${yTop}
    C ${xR1 + rise} ${yTop}, ${xR1 + rise} ${yBot}, ${xR1} ${yBot}
    L ${xL1} ${yBot}
    C ${xL1 - rise} ${yBot}, ${xL1 - rise} ${yTop}, ${xL1} ${yTop}
    Z
  `;

  // punto su bezier cubica (componente singola, per i callout)
  const bez = (t: number, a: number, b: number, c: number, d: number) => {
    const mt = 1 - t;
    return mt * mt * mt * a + 3 * mt * mt * t * b + 3 * mt * t * t * c + t * t * t * d;
  };
  const tCall = 0.18;
  const dxCall = bez(tCall, 0, rise, rise, 0); // sporgenza orizzontale al punto di callout
  const yCallCurve = bez(tCall, yBot, yBot, yTop, yTop);
  const callLeftX = xL1 - dxCall - 10;
  const callRightX = xR1 + dxCall + 10;
  const callHeadY = yCallCurve + 10;

  // riquadri in fila sotto il serbatoio (stesso ordine del serbatoio ruotato)
  const boxW = 208;
  const box1H = 176;
  const boxSumH = 76;
  const box2H = 96;
  const box3H = 176;
  const boxY = 335;
  const slots: BoxName[] =
    leftKey === 'fondo'
      ? ['fondo', 'virola', 'somma', 'coperchio']
      : ['coperchio', 'somma', 'virola', 'fondo'];
  const slotGap = (drawW - 12 - 4 * boxW) / 3;
  const boxX = (name: BoxName) => 6 + slots.indexOf(name) * (boxW + slotGap);
  const boxCx = (name: BoxName) => boxX(name) + boxW / 2;

  const virolaCallX = Math.min(Math.max(boxCx('virola'), xL1 + 30), xR1 - 30);
  const virolaCallY = yBot + 20;

  const hLeftCalc = leftKey === 'fondo' ? hFondo_calc : hCoperchio_calc;
  const hRightCalc = rightKey === 'fondo' ? hFondo_calc : hCoperchio_calc;

  const dLineX = xR1 - 26;
  const boxCapTotW = 178;
  const boxCapTotH = 60;
  const boxCapTotX = xL1 + 14;
  const boxCapTotY = yc - boxCapTotH / 2;

  const tickStyle = { stroke: '#334155', strokeWidth: 1 } as const;

  /* ---------- riquadro testata (fondo o coperchio) ---------- */
  const headBox = (key: HeadKey) => {
    const bx = boxX(key);
    const by = boxY;
    const isFondo = key === 'fondo';
    const preset = isFondo ? presetFondo : presetCoperchio;
    const Rv = isFondo ? R_fon : R_cop;
    const rv = isFondo ? r_fon : r_cop;
    const custom = isFondo ? isCustomFondo : isCustomCoperchio;
    const patchH = isFondo ? patchFondo : patchCoperchio;
    const cfg = isFondo ? input.fondo : input.coperchio;
    const hCol = isFondo ? hCollettoFondo : hCollettoCoperchio;
    const vol = result ? (isFondo ? result.volumeFondo : result.volumeCoperchio) : NaN;
    const cx0 = key === leftKey ? callLeftX : callRightX;
    return (
      <g>
        <rect x={bx} y={by} width={boxW} height={box1H} rx="5" fill="#ffffff" stroke="#0f766e" strokeWidth="1.2" />
        <line
          x1={bx + boxW / 2}
          y1={by}
          x2={cx0}
          y2={callHeadY + 13}
          stroke="#0f766e"
          strokeWidth="1"
          strokeDasharray="3,3"
        />
        <foreignObject x={bx + 6} y={by + 5} width={boxW - 12} height="24">
          <select
            value={preset}
            onChange={(e) => patchH(presetPatch(e.target.value as Preset, cfg))}
            style={selectStyle}
          >
            <option value="klopper">Klopper DIN 28011 (decinormale)</option>
            <option value="korbbogen">Korbbogen DIN 28013</option>
            <option value="pseudoellittico">Pseudoellittico</option>
            <option value="custom">Fuori Standard</option>
          </select>
        </foreignObject>
        <foreignObject x={bx + 6} y={by + 31} width={boxW - 12} height="24">
          <MiniField
            label="R grande"
            value={Math.round(Rv * 10) / 10}
            onChange={(v) => patchH({ R_custom: v })}
            readOnly={!custom}
          />
        </foreignObject>
        <foreignObject x={bx + 6} y={by + 57} width={boxW - 12} height="24">
          <MiniField
            label="r piccolo"
            value={Math.round(rv * 10) / 10}
            onChange={(v) => patchH({ r_custom: v })}
            readOnly={!custom}
          />
        </foreignObject>
        <foreignObject x={bx + 6} y={by + 83} width={boxW - 12} height="24">
          <MiniField label="Colletto" value={hCol} onChange={(v) => patchH({ hColletto: v })} />
        </foreignObject>
        <foreignObject x={bx + 6} y={by + 109} width={boxW - 12} height="24">
          <MiniField label="Sp." value={cfg.sp} onChange={(v) => patchH({ sp: v })} />
        </foreignObject>
        <text x={bx + boxW / 2} y={by + 148} textAnchor="middle" fontSize="11" fontWeight="600" fill="#000000">
          {isFondo ? 'Fondo bombato — litri' : 'Coperchio bombato — litri'}
        </text>
        <text x={bx + boxW / 2} y={by + 166} textAnchor="middle" fontSize="12" fontWeight="700" fill="#0f766e">
          {result ? fmtL0(vol) : '—'}
        </text>
      </g>
    );
  };

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
          Serbatoio orizzontale: il livello si misura dal punto più basso del cilindro (0) fino al diametro.
          Clicca direttamente sui valori nello schema per modificarli.
        </p>
      </div>

      <div className="bg-white border-4 border-double border-emerald-800 rounded-xl p-2 overflow-x-auto">
        <svg
          viewBox={`0 0 ${drawW} ${drawH}`}
          className="w-full h-auto min-w-[760px]"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* asse del serbatoio */}
          <line
            x1={xL0 - 24}
            y1={yc}
            x2={xR0 + 24}
            y2={yc}
            stroke="#94a3b8"
            strokeWidth="1"
            strokeDasharray="6,4"
          />

          {/* RIQUADRI (in fila sotto il serbatoio) */}
          {headBox(leftKey)}
          {headBox(rightKey)}

          {/* RIQUADRO SOMMA — SEZIONE CILINDRICA + FONDO */}
          <g>
            <rect x={boxX('somma')} y={boxY} width={boxW} height={boxSumH} rx="5" fill="#ffffff" stroke="#0f766e" strokeWidth="1.2" />
            <text x={boxCx('somma')} y={boxY + 18} textAnchor="middle" fontSize="11" fontWeight="600" fill="#000000">
              Sezione cilindrica + fondo
            </text>
            <text x={boxCx('somma')} y={boxY + 40} textAnchor="middle" fontSize="11" fontWeight="600" fill="#000000">
              Capacità in litri
            </text>
            <text x={boxCx('somma')} y={boxY + 62} textAnchor="middle" fontSize="12" fontWeight="700" fill="#0f766e">
              {result ? fmtL0(result.volumeCilindro + result.volumeFondo) : '—'}
            </text>
          </g>

          {/* RIQUADRO 2 — VIROLA */}
          <g>
            <rect x={boxX('virola')} y={boxY} width={boxW} height={box2H} rx="5" fill="#ffffff" stroke="#0f766e" strokeWidth="1.2" />
            <line
              x1={boxCx('virola')}
              y1={boxY}
              x2={virolaCallX}
              y2={virolaCallY + 13}
              stroke="#0f766e"
              strokeWidth="1"
              strokeDasharray="3,3"
            />
            <text x={boxCx('virola')} y={boxY + 16} textAnchor="middle" fontSize="11" fontWeight="600" fill="#000000">
              Sezione cilindrica
            </text>
            <text x={boxCx('virola')} y={boxY + 34} textAnchor="middle" fontSize="11" fontWeight="600" fill="#000000">
              Capacità in litri
            </text>
            <text x={boxCx('virola')} y={boxY + 54} textAnchor="middle" fontSize="12" fontWeight="700" fill="#0f766e">
              {result ? fmtL0(result.volumeCilindro) : '—'}
            </text>
            <foreignObject x={boxX('virola') + 6} y={boxY + 64} width={boxW - 12} height="26">
              <MiniField
                label="Sp. virola"
                value={input.spVirola}
                onChange={(v) => patch({ spVirola: v })}
                labelWidth="66px"
                width="78px"
              />
            </foreignObject>
          </g>

          {/* PROFILO SERBATOIO */}
          <path d={pathData} fill="#f8fafc" stroke="#1e293b" strokeWidth="1.6" />
          <line x1={xL1} y1={yTop} x2={xL1} y2={yBot} stroke="#1e293b" strokeWidth="1" />
          <line x1={xR1} y1={yTop} x2={xR1} y2={yBot} stroke="#1e293b" strokeWidth="1" />

          {/* CALLOUTS */}
          {[
            { n: leftKey === 'coperchio' ? 1 : 3, x: callLeftX, y: callHeadY },
            { n: 2, x: virolaCallX, y: virolaCallY },
            { n: rightKey === 'coperchio' ? 1 : 3, x: callRightX, y: callHeadY },
          ].map((c, i) => (
            <g key={i}>
              <circle cx={c.x} cy={c.y} r="13" fill="#ffffff" stroke="#0f766e" strokeWidth="1.4" />
              <text x={c.x} y={c.y + 5} textAnchor="middle" fontSize="13" fontWeight="700" fill="#0f766e">
                {c.n}
              </text>
            </g>
          ))}

          {/* QUOTA DIAMETRO (verticale, dentro la virola) */}
          <g>
            <line x1={dLineX} y1={yTop} x2={dLineX} y2={yBot} {...tickStyle} />
            <line x1={dLineX - 6} y1={yTop} x2={dLineX + 6} y2={yTop} {...tickStyle} />
            <line x1={dLineX - 6} y1={yBot} x2={dLineX + 6} y2={yBot} {...tickStyle} />
            <text x={dLineX - 108} y={yc + 5} textAnchor="end" fontSize="13" fontWeight="700" fill="#000000">Ø</text>
            <foreignObject x={dLineX - 100} y={yc - 12} width="92" height="24">
              <input
                type="number"
                value={dInt}
                onChange={(e) => setDInt(Number(e.target.value))}
                style={editableDimStyle}
                className="editable-dim"
                title="Diametro interno (mm) = livello massimo"
              />
            </foreignObject>
          </g>

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

          {/* CATENA DI QUOTE (sopra): testata sinistra + virola + testata destra */}
          <g>
            {[xL0, xR0].map((xx, i) => (
              <line key={`ext${i}`} x1={xx} y1={yTotal} x2={xx} y2={yc} stroke="#cbd5e1" strokeWidth="1" strokeDasharray="4,4" />
            ))}
            {[xL1, xR1].map((xx, i) => (
              <line key={`ext2${i}`} x1={xx} y1={yChain} x2={xx} y2={yTop} stroke="#cbd5e1" strokeWidth="1" strokeDasharray="4,4" />
            ))}
            <line x1={xL0} y1={yChain} x2={xR0} y2={yChain} {...tickStyle} />
            {[xL0, xL1, xR1, xR0].map((xx, i) => (
              <line key={i} x1={xx} y1={yChain - 7} x2={xx} y2={yChain + 7} {...tickStyle} />
            ))}
            <text x={(xL0 + xL1) / 2} y={yChain - 10} textAnchor="middle" fontSize="14" fontWeight="600" fill="#000000">
              {fmt(hLeftCalc)}
            </text>
            <foreignObject x={xMid - 43} y={yChain - 36} width="86" height="24">
              <input
                type="number"
                value={lCil}
                onChange={(e) => patch({ lCil: Number(e.target.value) })}
                style={editableDimStyle}
                className="editable-dim"
                title="Lunghezza sezione cilindrica (mm)"
              />
            </foreignObject>
            <text x={(xR1 + xR0) / 2} y={yChain - 10} textAnchor="middle" fontSize="14" fontWeight="600" fill="#000000">
              {fmt(hRightCalc)}
            </text>
          </g>

          {/* QUOTA TOTALE (lunghezza interna lungo l'asse) */}
          <DimLine y={yTotal} x1={xL0} x2={xR0} label={fmt(lTot)} />

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
      {(!geometriaCoperchioValida || !geometriaFondoValida) && (
        <div className="bg-rose-50 border border-rose-300 rounded-xl p-3 space-y-1">
          {!geometriaCoperchioValida && (
            <p className="text-xs font-bold text-rose-900">
              I raggi del coperchio bombato non sono geometricamente compatibili con il diametro interno.
            </p>
          )}
          {!geometriaFondoValida && (
            <p className="text-xs font-bold text-rose-900">
              I raggi del fondo bombato non sono geometricamente compatibili con il diametro interno.
            </p>
          )}
        </div>
      )}

      {/* VERIFICA COERENZA ALTEZZE INTERNE */}
      <div className="bg-emerald-50/50 border border-emerald-300 rounded-xl p-3">
        <div className="flex items-center gap-2 mb-2">
          <Info className="w-4 h-4 text-emerald-800 shrink-0" />
          <h4 className="text-xs font-black uppercase text-emerald-900">
            Verifica coerenza lunghezze interne
          </h4>
        </div>
        <div className="grid grid-cols-2 gap-y-1 text-xs font-bold text-neutral-800">
          <span>Fondo bombato (colletto incluso)</span>
          <span className="text-right font-mono">{fmt(hFondo_calc)} mm</span>
          <span>Sezione cilindrica (virola)</span>
          <span className="text-right font-mono">{fmt(lCil)} mm</span>
          <span>Coperchio bombato (colletto incluso)</span>
          <span className="text-right font-mono">{fmt(hCoperchio_calc)} mm</span>
          <span className="border-t border-emerald-300 pt-1">Somma</span>
          <span className="text-right font-mono border-t border-emerald-300 pt-1">
            {fmt(hFondo_calc + lCil + hCoperchio_calc)} mm
          </span>
          <span className="font-black">Lunghezza totale interna (L_tot)</span>
          <span className="text-right font-mono font-black">{fmt(lTot)} mm</span>
        </div>
        <p
          className={`mt-2 text-xs font-black ${
            Math.abs(hFondo_calc + lCil + hCoperchio_calc - lTot) <= 1.5
              ? 'text-emerald-800'
              : 'text-rose-800'
          }`}
        >
          {Math.abs(hFondo_calc + lCil + hCoperchio_calc - lTot) <= 1.5
            ? '✓ Lunghezze coerenti (scarto ≤ 1,5 mm per arrotondamento)'
            : '⚠ Scarto rilevato: verifica i parametri geometrici'}
        </p>
      </div>
    </div>
  );
}
