/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo, useState, useEffect } from 'react';
import { TankInput, HeadType } from '../../models/types';
import { calculateTank } from '../../services/logic';
import { AlertTriangle, Info } from 'lucide-react';
import { COPERCHIO_A_SINISTRA, INCLINAZIONE_MAX } from '../../constants';

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

function TiltInput({
  value,
  max,
  onCommit,
}: {
  value: number;
  max: number;
  onCommit: (v: number) => void;
}) {
  const [txt, setTxt] = useState<string>(String(value));
  useEffect(() => {
    setTxt(String(value));
  }, [value]);
  return (
    <input
      type="text"
      inputMode="decimal"
      value={txt}
      onChange={(e) => {
        setTxt(e.target.value);
        const n = parseFloat(e.target.value.replace(',', '.'));
        if (Number.isFinite(n)) onCommit(Math.max(-max, Math.min(max, n)));
      }}
      onBlur={() => setTxt(String(value))}
      className="editable-dim"
      title={`Inclinazione dell'asse in gradi (da −${max} a +${max}). Positivo = coperchio più alto`}
      style={{
        width: '78px',
        fontSize: '14px',
        fontWeight: 700,
        color: '#000000',
        background: '#ffffff',
        border: '1px solid #94a3b8',
        borderRadius: '3px',
        padding: '1px 4px',
        outline: 'none',
        fontFamily: 'inherit',
        flexShrink: 0,
      }}
    />
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

  /* ---------- layout disegno (serbatoio ORIZZONTALE, eventualmente inclinato) ---------- */
  const drawW = 900;

  // Rotazione di 90° in senso orario rispetto a BOMB-BOMB: il fondo (quota 0 della
  // taratura) sta a sinistra, il coperchio a destra. Per invertire: constants.ts.
  const leftKey: HeadKey = COPERCHIO_A_SINISTRA ? 'coperchio' : 'fondo';
  const rightKey: HeadKey = leftKey === 'fondo' ? 'coperchio' : 'fondo';

  // inclinazione: positivo = lato coperchio più alto. Angolo di rotazione SVG (orario = +)
  const incl = result ? result.inclinazione : 0;
  const isTilted = Math.abs(incl) > 0.001;
  const aDeg = COPERCHIO_A_SINISTRA ? incl : -incl;
  const aRad = (aDeg * Math.PI) / 180;
  const sinA = Math.sin(aRad);
  const cosA = Math.cos(aRad);
  const sinAbs = Math.abs(sinA);

  // testate e virola: lunghezze GRAFICHE FISSE (rappresentative)
  const headPx = 96;
  const cilPx = 340;
  const halfH = 80;

  const totalDrawn = headPx * 2 + cilPx;
  const halfLen = totalDrawn / 2;
  const xL0 = (drawW - totalDrawn) / 2; // punta testata sinistra
  const xL1 = xL0 + headPx;             // inizio virola
  const xR1 = xL1 + cilPx;              // fine virola
  const xR0 = xR1 + headPx;             // punta testata destra
  const xMid = (xL1 + xR1) / 2;
  const cxT = (xL0 + xR0) / 2;          // centro del serbatoio (perno della rotazione)

  // spazio verticale che serve quando il serbatoio è inclinato
  const upExtent = halfLen * sinAbs + 173 * cosA + 30;
  const yc = Math.max(205, upExtent); // asse (centro) del serbatoio
  const yTop = yc - halfH;
  const yBot = yc + halfH;
  const yTotal = yc - 163; // quota totale
  const yChain = yc - 105; // catena di quote

  // rotazione di un punto attorno al centro del serbatoio
  const rot = (x: number, y: number) => ({
    x: cxT + (x - cxT) * cosA - (y - yc) * sinA,
    y: yc + (x - cxT) * sinA + (y - yc) * cosA,
  });
  const rotTransform = isTilted ? `rotate(${aDeg} ${cxT} ${yc})` : undefined;

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
  const callLeft = rot(xL1 - dxCall - 10, yCallCurve + 10);
  const callRight = rot(xR1 + dxCall + 10, yCallCurve + 10);

  // riquadri in fila sotto il serbatoio (stesso ordine del serbatoio ruotato)
  const boxW = 208;
  const box1H = 176;
  const boxSumH = 76;
  const box2H = 96;
  const boxY = yc + halfLen * sinAbs + 80 * cosA + 50;
  const drawH = boxY + box1H + 34;
  const slots: BoxName[] =
    leftKey === 'fondo'
      ? ['fondo', 'virola', 'somma', 'coperchio']
      : ['coperchio', 'somma', 'virola', 'fondo'];
  const slotGap = (drawW - 12 - 4 * boxW) / 3;
  const boxX = (name: BoxName) => 6 + slots.indexOf(name) * (boxW + slotGap);
  const boxCx = (name: BoxName) => boxX(name) + boxW / 2;

  const virolaCall = rot(
    Math.min(Math.max(boxCx('virola'), xL1 + 30), xR1 - 30),
    yBot + 20
  );

  const hLeftCalc = leftKey === 'fondo' ? hFondo_calc : hCoperchio_calc;
  const hRightCalc = rightKey === 'fondo' ? hFondo_calc : hCoperchio_calc;

  const dLineX = xR1 - 26;
  const boxCapTotW = 178;
  const boxCapTotH = 60;
  const capCenter0 = { x: xL1 + 14 + boxCapTotW / 2, y: yc };
  const capCenter = rot(capCenter0.x, capCenter0.y);
  const boxCapTotX = capCenter.x - boxCapTotW / 2;
  const boxCapTotY = capCenter.y - boxCapTotH / 2;

  const tickStyle = { stroke: '#334155', strokeWidth: 1 } as const;

  // punti (upright) di testi e campi: sempre dritti, posizionati sul punto ruotato
  const pLeftLab = rot((xL0 + xL1) / 2, yChain - 10);
  const pRightLab = rot((xR1 + xR0) / 2, yChain - 10);
  const pCil = rot(xMid, yChain - 24);
  const pTotLab = rot(cxT, yTotal - 10);
  const pDiaIn = rot(dLineX - 54, yc);
  const pDiaTxt = rot(dLineX - 108, yc);
  const tipR = rot(xR0, yc);

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
    const call = key === leftKey ? callLeft : callRight;
    return (
      <g>
        <rect x={bx} y={by} width={boxW} height={box1H} rx="5" fill="#ffffff" stroke="#0f766e" strokeWidth="1.2" />
        <line
          x1={bx + boxW / 2}
          y1={by}
          x2={call.x}
          y2={call.y + 13}
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
          Serbatoio orizzontale: il livello si misura in verticale dal punto interno più basso (0) fino al punto più alto.
          L&apos;inclinazione dell&apos;asse (da −{INCLINAZIONE_MAX}° a +{INCLINAZIONE_MAX}°, positivo = coperchio più alto) modifica la taratura.
          Clicca direttamente sui valori nello schema per modificarli.
        </p>
      </div>

      <div className="bg-white border-4 border-double border-emerald-800 rounded-xl p-2 overflow-x-auto">
        <svg
          viewBox={`0 0 ${drawW} ${drawH}`}
          className="w-full h-auto min-w-[760px]"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* CAMPO INCLINAZIONE */}
          <text x={6} y={23} fontSize="11" fill="#000000">Inclinazione °</text>
          <foreignObject x={92} y={6} width="90" height="24">
            <TiltInput
              value={incl}
              max={INCLINAZIONE_MAX}
              onCommit={(v) => patch({ inclinazione: v })}
            />
          </foreignObject>

          {/* orizzontale di riferimento (solo se inclinato) */}
          {isTilted && (
            <g>
              <line x1={tipR.x} y1={tipR.y} x2={tipR.x + 120} y2={tipR.y} stroke="#64748b" strokeWidth="1" strokeDasharray="2,3" />
              <path
                d={`M ${tipR.x + 70} ${tipR.y} A 70 70 0 0 ${aDeg > 0 ? 1 : 0} ${tipR.x + 70 * cosA} ${tipR.y + 70 * sinA}`}
                fill="none"
                stroke="#0f766e"
                strokeWidth="1.6"
              />
              <text x={tipR.x + 78} y={tipR.y + (aDeg > 0 ? 18 : -10)} fontSize="13" fontWeight="700" fill="#0f766e">
                {`${incl > 0 ? '+' : ''}${fmt(incl)}°`}
              </text>
            </g>
          )}

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
              x2={virolaCall.x}
              y2={virolaCall.y + 13}
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

          {/* GRUPPO RUOTATO: profilo, asse, quote lungo l'asse */}
          <g transform={rotTransform}>
            {/* asse del serbatoio */}
            <line
              x1={xL0 - 24}
              y1={yc}
              x2={xR0 + 40}
              y2={yc}
              stroke="#94a3b8"
              strokeWidth="1"
              strokeDasharray="6,4"
            />

            {/* PROFILO SERBATOIO */}
            <path d={pathData} fill="#f8fafc" stroke="#1e293b" strokeWidth="1.6" />
            <line x1={xL1} y1={yTop} x2={xL1} y2={yBot} stroke="#1e293b" strokeWidth="1" />
            <line x1={xR1} y1={yTop} x2={xR1} y2={yBot} stroke="#1e293b" strokeWidth="1" />

            {/* QUOTA DIAMETRO (linea) */}
            <line x1={dLineX} y1={yTop} x2={dLineX} y2={yBot} {...tickStyle} />
            <line x1={dLineX - 6} y1={yTop} x2={dLineX + 6} y2={yTop} {...tickStyle} />
            <line x1={dLineX - 6} y1={yBot} x2={dLineX + 6} y2={yBot} {...tickStyle} />

            {/* CATENA DI QUOTE (linee) */}
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

            {/* QUOTA TOTALE (linea): lunghezza interna lungo l'asse */}
            <line x1={xL0} y1={yTotal} x2={xR0} y2={yTotal} {...tickStyle} />
            <line x1={xL0} y1={yTotal - 7} x2={xL0} y2={yTotal + 7} {...tickStyle} />
            <line x1={xR0} y1={yTotal - 7} x2={xR0} y2={yTotal + 7} {...tickStyle} />
          </g>

          {/* CALLOUTS */}
          {[
            { n: leftKey === 'coperchio' ? 1 : 3, x: callLeft.x, y: callLeft.y },
            { n: 2, x: virolaCall.x, y: virolaCall.y },
            { n: rightKey === 'coperchio' ? 1 : 3, x: callRight.x, y: callRight.y },
          ].map((c, i) => (
            <g key={i}>
              <circle cx={c.x} cy={c.y} r="13" fill="#ffffff" stroke="#0f766e" strokeWidth="1.4" />
              <text x={c.x} y={c.y + 5} textAnchor="middle" fontSize="13" fontWeight="700" fill="#0f766e">
                {c.n}
              </text>
            </g>
          ))}

          {/* DIAMETRO: etichetta e campo (dritti) */}
          <text x={pDiaTxt.x} y={pDiaTxt.y + 5} textAnchor="end" fontSize="13" fontWeight="700" fill="#000000">Ø</text>
          <foreignObject x={pDiaIn.x - 46} y={pDiaIn.y - 12} width="92" height="24">
            <input
              type="number"
              value={dInt}
              onChange={(e) => setDInt(Number(e.target.value))}
              style={editableDimStyle}
              className="editable-dim"
              title="Diametro interno (mm)"
            />
          </foreignObject>

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

          {/* QUOTE (testi e campi dritti) */}
          <text x={pLeftLab.x} y={pLeftLab.y} textAnchor="middle" fontSize="14" fontWeight="600" fill="#000000">
            {fmt(hLeftCalc)}
          </text>
          <foreignObject x={pCil.x - 43} y={pCil.y - 12} width="86" height="24">
            <input
              type="number"
              value={lCil}
              onChange={(e) => patch({ lCil: Number(e.target.value) })}
              style={editableDimStyle}
              className="editable-dim"
              title="Lunghezza sezione cilindrica (mm)"
            />
          </foreignObject>
          <text x={pRightLab.x} y={pRightLab.y} textAnchor="middle" fontSize="14" fontWeight="600" fill="#000000">
            {fmt(hRightCalc)}
          </text>
          <text x={pTotLab.x} y={pTotLab.y} textAnchor="middle" fontSize="13" fontWeight="700" fill="#000000">
            {fmt(lTot)}
          </text>

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
