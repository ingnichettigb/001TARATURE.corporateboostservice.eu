/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { TankInput, HeadType, HeadConfig, ReportMeta } from '../../models/types';
import { Settings2, ShieldCheck, HelpCircle, Layers, Check, RefreshCw, RotateCcw, Info, AlertTriangle } from 'lucide-react';
import { motion } from 'motion/react';
import { Language, translations } from '../../utils/translations';
import { calculateHead } from '../../services/logic';


interface TankInputFormProps {
  key?: React.Key | number;
  initialInput: TankInput;
  onSubmit: (input: TankInput) => void;
  lang?: Language;
  stickyOffset?: number;
}

export default function TankInputForm({ initialInput, onSubmit, lang = 'it', stickyOffset = 0 }: TankInputFormProps) {
  const t = translations[lang];
  // Main dimensions
  const [dInt, setDInt] = useState<number>(initialInput.dInt);
  const [lCil, setLCil] = useState<number>(initialInput.lCil);
  const [rho, setRho] = useState<number>(initialInput.rho);

  // Spin animation trigger count
  const [spinCount, setSpinCount] = useState<number>(0);

  // Coperchio State (sempre CONICO)
  const [coperchioSp, setCoperchioSp] = useState<number>(initialInput.coperchio.sp);
  const [coperchioColletto, setCoperchioColletto] = useState<number>(initialInput.coperchio.hColletto);
  const [coperchioRRaccordo, setCoperchioRRaccordo] = useState<number>(initialInput.coperchio.rRaccordo ?? 30);
  const [coperchioHCono, setCoperchioHCono] = useState<number>(initialInput.coperchio.hCono ?? Math.round(initialInput.dInt / 2 + initialInput.coperchio.hColletto));

  // NOTA: h_cono qui è l'ALTEZZA TOTALE DEL COPERCHIO CONICO, COLLETTO INCLUSO.
  // La geometria (cono puro + raccordo) lavora sulla quota netta = h_cono - h_colletto.
  const hTotFromAngle = (alfaDeg: number, R_base: number, r_racc: number, hColl: number = 0): number => {
    const a = alfaDeg * Math.PI / 180;
    const Z = r_racc * Math.sin(a);
    const K = r_racc - Z;
    const Y = R_base - K;
    if (Y <= 0) return NaN;
    return Y * Math.tan(a) + r_racc * Math.cos(a) + hColl;
  };
  // Bisezione: dato altezza totale target (colletto incluso), trova angolo
  const angleFromHTot = (H_target: number, R_base: number, r_racc: number, hColl: number = 0): number | null => {
    if (R_base <= 0) return null;
    const H_net = H_target - hColl;
    if (H_net <= 0) return null;
    let lo = 0.01, hi = 89.99;
    for (let i = 0; i < 60; i++) {
      const mid = (lo + hi) / 2;
      const v = hTotFromAngle(mid, R_base, r_racc);
      if (isNaN(v)) { hi = mid; continue; }
      if (v - H_net < 0) lo = mid; else hi = mid;
    }
    const ang = (lo + hi) / 2;
    const check = hTotFromAngle(ang, R_base, r_racc);
    if (isNaN(check) || Math.abs(check - H_net) > Math.max(2, H_net * 0.02)) return null;
    return ang;
  };

  const [coperchioAngolo, setCoperchioAngolo] = useState<number | null>(() => {
    const r = initialInput.dInt / 2;
    const h = initialInput.coperchio.hCono ?? Math.round(r + initialInput.coperchio.hColletto);
    const rracc = initialInput.coperchio.rRaccordo ?? 30;
    if (r <= 0) return null;
    const ang = angleFromHTot(h, r, rracc, initialInput.coperchio.hColletto);
    return ang != null ? Math.round(ang * 100) / 100 : null;
  });
  // lockedBy: 'h' means user typed altezza → angle is derived/disabled; 'angolo' means user typed angolo → altezza derived/disabled
  const [lockedBy, setLockedBy] = useState<'h' | 'angolo' | null>('h');
  const [raccordoError, setRaccordoError] = useState<string | null>(null);
  const [showAngleHelp, setShowAngleHelp] = useState<boolean>(false);
  const [coperchioCollettoConfirmed, setCoperchioCollettoConfirmed] = useState<boolean>(true);

  // Costante: coperchio sempre conico
  const coperchioType: HeadType = 'conico';
  const coperchioRCustom = 0;
  const coperchioRCustomVal = 0;

  // Fondo State (sempre BOMBATO)
  const [fondoType, setFondoType] = useState<HeadType>(
    initialInput.fondo.type === 'conico' ? 'pseudoellittico' : initialInput.fondo.type
  );
  const [fondoSp, setFondoSp] = useState<number>(initialInput.fondo.sp);
  const [fondoColletto, setFondoColletto] = useState<number>(initialInput.fondo.hColletto);
  const [fondoRCustom, setFondoRCustom] = useState<number>(initialInput.fondo.R_custom ?? initialInput.dInt);
  const [fondoRCustomVal, setFondoRCustomVal] = useState<number>(initialInput.fondo.r_custom ?? (initialInput.dInt / 10));
  const [fondoCollettoConfirmed, setFondoCollettoConfirmed] = useState<boolean>(true);
  const fondoUgualeAlCoperchio = false;
  const setFondoUgualeAlCoperchio = (_: boolean) => {};

  // Report Meta State
  const [cliente, setCliente] = useState(initialInput.report.cliente);
  const [riferimento, setRiferimento] = useState(initialInput.report.riferimento);
  const [nomeSerbatoio, setNomeSerbatoio] = useState(initialInput.report.nomeSerbatoio);
  const [numeroDisegno, setNumeroDisegno] = useState(initialInput.report.numeroDisegno);
  const [dataReport, setDataReport] = useState(initialInput.report.data);

  // Accordion controls
  const [activeTab, setActiveTab] = useState<'dims' | 'coperchio' | 'fondo' | 'report'>('dims');

  // Load external initial values when they change (e.g. loaded from localStorage/sidebar)
  useEffect(() => {
    setCliente(initialInput.report.cliente);
    setRiferimento(initialInput.report.riferimento);
    setNomeSerbatoio(initialInput.report.nomeSerbatoio);
    setNumeroDisegno(initialInput.report.numeroDisegno);
    setDataReport(initialInput.report.data);
  }, [initialInput.report]);

  // Synchronize fondo with coperchio when active
  useEffect(() => {
    if (fondoUgualeAlCoperchio) {
      setFondoType(coperchioType);
      setFondoSp(coperchioSp);
      setFondoColletto(coperchioColletto);
      setFondoRCustom(coperchioRCustom);
      setFondoRCustomVal(coperchioRCustomVal);
      setFondoCollettoConfirmed(true);
    }
  }, [fondoUgualeAlCoperchio, coperchioType, coperchioSp, coperchioColletto, coperchioRCustom, coperchioRCustomVal]);

  // Recalcolo automatico del campo DERIVATO quando D_int o r_raccordo cambia
  useEffect(() => {
    const r = dInt / 2;
    if (r <= 0) return;
    if (lockedBy === 'h') {
      const ang = angleFromHTot(coperchioHCono, r, coperchioRRaccordo, coperchioColletto);
      if (ang != null) {
        setCoperchioAngolo(Math.round(ang * 100) / 100);
        setRaccordoError(null);
      } else {
        setRaccordoError("Il raggio di raccordo inserito è troppo grande per questa combinazione di diametro e altezza.");
      }
    } else if (lockedBy === 'angolo' && coperchioAngolo != null) {
      const h = hTotFromAngle(coperchioAngolo, r, coperchioRRaccordo, coperchioColletto);
      if (!isNaN(h)) {
        setCoperchioHCono(Math.max(1, Math.round(h)));
        setRaccordoError(null);
      } else {
        setRaccordoError("Il raggio di raccordo inserito è troppo grande per questa combinazione di diametro e angolo.");
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dInt, coperchioRRaccordo, coperchioColletto]);

  const handleCoperchioHConoChange = (raw: string) => {
    if (raw === '') {
      setLockedBy(null);
      setCoperchioHCono(0);
      setCoperchioAngolo(null);
      setRaccordoError(null);
      return;
    }
    const val = Math.max(1, parseInt(raw) || 0);
    setCoperchioHCono(val);
    setLockedBy('h');
    const r = dInt / 2;
    if (r > 0) {
      const ang = angleFromHTot(val, r, coperchioRRaccordo, coperchioColletto);
      if (ang != null) {
        setCoperchioAngolo(Math.round(ang * 100) / 100);
        setRaccordoError(null);
      } else {
        setCoperchioAngolo(null);
        setRaccordoError("Il raggio di raccordo inserito è troppo grande per questa combinazione di diametro e altezza.");
      }
    } else {
      setCoperchioAngolo(null);
    }
  };

  const handleCoperchioAngoloChange = (raw: string) => {
    if (raw === '') {
      setLockedBy(null);
      setCoperchioAngolo(null);
      setRaccordoError(null);
      return;
    }
    let val = parseFloat(raw);
    if (isNaN(val)) return;
    if (val <= 0) val = 0.01;
    if (val >= 90) val = 89.99;
    setCoperchioAngolo(Math.round(val * 100) / 100);
    setLockedBy('angolo');
    const r = dInt / 2;
    if (r > 0) {
      const h = hTotFromAngle(val, r, coperchioRRaccordo, coperchioColletto);
      if (!isNaN(h)) {
        setCoperchioHCono(Math.max(1, Math.round(h)));
        setRaccordoError(null);
      } else {
        setRaccordoError("Il raggio di raccordo inserito è troppo grande per questa combinazione di diametro e angolo.");
      }
    }
  };

  const resetCoperchioConoFields = () => {
    setLockedBy(null);
    setCoperchioHCono(0);
    setCoperchioAngolo(null);
    setRaccordoError(null);
  };


  // Effect to handle automatic proposal of colletto height when spessore changes
  const handleCoperchioSpChange = (val: number) => {
    setCoperchioSp(val);
    const calculatedColletto = val * 5;
    setCoperchioColletto(calculatedColletto);
    setCoperchioCollettoConfirmed(false); // prompt to confirm
  };

  const handleFondoSpChange = (val: number) => {
    setFondoSp(val);
    const calculatedColletto = val * 5;
    setFondoColletto(calculatedColletto);
    setFondoCollettoConfirmed(false); // prompt to confirm
  };

  const handleCalculate = (e: React.FormEvent) => {
    e.preventDefault();

    // Compile values
    const finalInput: TankInput = {
      dInt: dInt || 1000,
      lCil: lCil || 2000,
      rho: rho || 1,
      coperchio: {
        type: 'conico',
        sp: coperchioSp || 5,
        hColletto: coperchioColletto || 25,
        hCono: coperchioHCono || Math.round((dInt || 1000) / 2 + (coperchioColletto || 25)),
        rRaccordo: coperchioRRaccordo || 30,
      },
      fondo: {
        type: fondoType,
        sp: fondoSp || 5,
        hColletto: fondoColletto || 25,
        ...(fondoType === 'custom' ? { R_custom: fondoRCustom, r_custom: fondoRCustomVal } : {})
      },
      report: {
        ...initialInput.report,
        cliente,
        riferimento,
        nomeSerbatoio,
        numeroDisegno,
        data: dataReport
      }
    };

    // Auto mark as confirmed when submit is clicked
    setCoperchioCollettoConfirmed(true);
    setFondoCollettoConfirmed(true);

    // Trigger spin animation
    setSpinCount(prev => prev + 1);

    onSubmit(finalInput);
  };

  return (
    <form onSubmit={handleCalculate} className="space-y-4">
      {/* Tab Selectors - Sticky, agganciata subito sotto la carta di navigazione fissa */}
      <div
        className="sticky z-10 flex bg-sky-50/90 p-1.5 border-4 border-double border-emerald-800 rounded-xl text-xs font-bold gap-1.5 shadow-inner"
        style={{ top: stickyOffset }}
      >
        <button
          type="button"
          onClick={() => setActiveTab('dims')}
          className={`flex-1 py-1.5 px-2.5 rounded-md transition-all border ${
            activeTab === 'dims' 
              ? 'bg-sky-300 text-sky-950 border-sky-400 shadow-xs font-extrabold' 
              : 'bg-sky-100/80 text-sky-900 border-sky-200 hover:bg-sky-200/90 hover:text-sky-950'
          }`}
        >
          Dimensioni
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('coperchio')}
          className={`flex-1 py-1.5 px-2.5 rounded-md transition-all flex items-center justify-center gap-1 border ${
            activeTab === 'coperchio' 
              ? 'bg-sky-300 text-sky-950 border-sky-400 shadow-xs font-extrabold' 
              : 'bg-sky-100/80 text-sky-900 border-sky-200 hover:bg-sky-200/90 hover:text-sky-950'
          }`}
        >
          Coperchio conico
          {!coperchioCollettoConfirmed && <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />}
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('fondo')}
          className={`flex-1 py-1.5 px-2.5 rounded-md transition-all flex items-center justify-center gap-1 border ${
            activeTab === 'fondo' 
              ? 'bg-sky-300 text-sky-950 border-sky-400 shadow-xs font-extrabold' 
              : 'bg-sky-100/80 text-sky-900 border-sky-200 hover:bg-sky-200/90 hover:text-sky-950'
          }`}
        >
          Fondo bombato
          {!fondoCollettoConfirmed && <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />}
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('report')}
          className={`flex-1 py-1.5 px-2.5 rounded-md transition-all border ${
            activeTab === 'report' 
              ? 'bg-sky-300 text-sky-950 border-sky-400 shadow-xs font-extrabold' 
              : 'bg-sky-100/80 text-sky-900 border-sky-200 hover:bg-sky-200/90 hover:text-sky-950'
          }`}
        >
          Report
        </button>
      </div>

      {/* Tab Panels */}
      <div className="bg-white border-4 border-double border-emerald-800 rounded-xl p-5 shadow-xs">
        {activeTab === 'dims' && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-neutral-950 pb-2 border-b border-neutral-200 flex items-center gap-1.5">
              <Settings2 className="w-4 h-4 text-emerald-800" />
              Dimensioni Generali Serbatoio
            </h3>

            <div className="p-2.5 bg-amber-50 border border-amber-300 rounded-lg flex items-start gap-2 text-[11px] text-amber-900">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-amber-600" />
              <span><strong>Tutte le misure da inserire</strong> (diametro, altezza, ecc.) sono <strong>misure interne</strong>. Non inserire le misure esterne.</span>
            </div>
            
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-neutral-900 mb-1 flex items-center gap-1 uppercase tracking-wide">
                  Diametro Interno (D_int)
                  <span className="text-[10px] text-neutral-700 font-bold">(mm)</span>
                </label>
                <input
                  type="number"
                  min="100"
                  max="10000"
                  required
                  value={dInt || ''}
                  onChange={(e) => setDInt(Math.max(1, parseInt(e.target.value) || 0))}
                  className="w-full text-sm bg-[#d7ecd7]/80 border-2 border-emerald-300/80 rounded-lg px-3 py-2 text-emerald-950 font-bold focus:bg-[#cde9cd] focus:ring-2 focus:ring-emerald-800 focus:outline-hidden transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-900 mb-1 flex items-center gap-1 uppercase tracking-wide">
                  Altezza Parte Cilindrica (L_cil)
                  <span className="text-[10px] text-neutral-700 font-bold">(mm)</span>
                </label>
                <input
                  type="number"
                  min="0"
                  max="50000"
                  required
                  value={lCil || ''}
                  onChange={(e) => setLCil(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-full text-sm bg-[#d7ecd7]/80 border-2 border-emerald-300/80 rounded-lg px-3 py-2 text-emerald-950 font-bold focus:bg-[#cde9cd] focus:ring-2 focus:ring-emerald-800 focus:outline-hidden transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-neutral-900 mb-1 flex items-center gap-1 uppercase tracking-wide">
                Peso Specifico del Contenuto (rho)
                <span className="text-[10px] text-neutral-700 font-bold">(kg/dm³)</span>
              </label>
              <div className="relative rounded-lg shadow-xs">
                <input
                  type="number"
                  step="0.001"
                  min="0.01"
                  max="5.0"
                  required
                  value={rho || ''}
                  onChange={(e) => setRho(parseFloat(e.target.value) || 1)}
                  className="w-full text-sm bg-[#d7ecd7]/80 border-2 border-emerald-300/80 rounded-lg px-3 py-2 text-emerald-950 font-bold focus:bg-[#cde9cd] focus:ring-2 focus:ring-emerald-800 focus:outline-hidden transition-colors"
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <span className="text-xs text-neutral-700 font-bold">Default: 1.0 (acqua)</span>
                </div>
              </div>
            </div>
            
            <div className="p-3 bg-emerald-50/50 rounded-lg border border-emerald-200 flex items-start gap-2.5 text-xs text-neutral-800 mt-2">
              <HelpCircle className="w-4 h-4 text-emerald-800 shrink-0 mt-0.5" />
              <p className="font-medium">
                Il serbatoio è composto da un mantello cilindrico centrale, un coperchio conico e un fondo bombato calcolato secondo il profilo torosferico prescelto.
              </p>
            </div>
          </div>
        )}

        {activeTab === 'coperchio' && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-neutral-950 pb-2 border-b border-neutral-200 flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-emerald-800" />
              Geometria Coperchio Conico
            </h3>

            <div className="p-3 bg-emerald-50/60 border border-emerald-200 rounded-lg text-[11px] text-emerald-950 font-medium">
              Il coperchio è un <strong>cono retto</strong> con vertice rivolto verso il basso. Definire l'altezza del cono (dalla base cilindrica al vertice).
            </div>

            <div className="p-2.5 bg-amber-50 border border-amber-300 rounded-lg flex items-start gap-2 text-[11px] text-amber-900">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-amber-600" />
              <span><strong>Tutte le misure da inserire</strong> (diametro, altezza, ecc.) sono <strong>misure interne</strong>. Non inserire le misure esterne.</span>
            </div>

            {/* Diametro Interno (read-only, dalla tab Dimensioni) */}
            <div>
              <label className="block text-xs font-bold text-neutral-900 mb-1 flex items-center gap-1 uppercase tracking-wide">
                Diametro Interno (D_int)
                <span className="text-[10px] text-neutral-700 font-bold">(mm)</span>
                <span className="text-[9px] bg-neutral-200 text-neutral-700 px-1 py-0.5 rounded font-bold">DA TAB DIMENSIONI</span>
              </label>
              <input
                type="number"
                value={dInt || ''}
                readOnly
                disabled
                className="w-full text-sm bg-neutral-100 border-2 border-neutral-300 rounded-lg px-3 py-2 text-neutral-700 font-bold cursor-not-allowed"
              />
            </div>

            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-neutral-900 uppercase tracking-wide">Geometria Cono</span>
                <button
                  type="button"
                  onClick={() => setShowAngleHelp((v) => !v)}
                  className="text-emerald-700 hover:text-emerald-900 cursor-pointer"
                  title="Come è misurato l'angolo?"
                  aria-label="Info angolo cono"
                >
                  <Info className="w-3.5 h-3.5" />
                </button>
              </div>
              <button
                type="button"
                onClick={resetCoperchioConoFields}
                className="flex items-center gap-1 text-[10px] font-bold text-emerald-800 hover:text-emerald-950 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-md px-2 py-1 transition-colors cursor-pointer"
                title="Sblocca entrambi i campi"
              >
                <RotateCcw className="w-3 h-3" /> Reset
              </button>
            </div>

            {showAngleHelp && (
              <div className="p-3 bg-white border border-emerald-300 rounded-lg flex items-start gap-3 animate-fade-in">
                <svg viewBox="0 0 120 90" className="w-28 h-20 shrink-0">
                  <line x1="10" y1="20" x2="110" y2="20" stroke="#065f46" strokeWidth="2" />
                  <line x1="10" y1="20" x2="10" y2="10" stroke="#94a3b8" strokeDasharray="2 2" />
                  <line x1="110" y1="20" x2="110" y2="10" stroke="#94a3b8" strokeDasharray="2 2" />
                  <line x1="10" y1="20" x2="60" y2="80" stroke="#065f46" strokeWidth="2" />
                  <line x1="110" y1="20" x2="60" y2="80" stroke="#065f46" strokeWidth="2" />
                  <path d="M 30 20 A 20 20 0 0 0 22 32" fill="none" stroke="#dc2626" strokeWidth="1.5" />
                  <text x="34" y="34" fontSize="9" fill="#dc2626" fontWeight="bold">α</text>
                  <text x="55" y="16" fontSize="7" fill="#334155">base D_int</text>
                </svg>
                <div className="text-[11px] text-neutral-800 leading-snug">
                  L'angolo <strong>α</strong> è misurato tra la <strong>linea orizzontale della base cilindrica</strong> e la <strong>parete obliqua del cono</strong>, nel punto di attacco.
                  <br />Non è l'angolo rispetto all'asse verticale.
                  <br /><em>h_cono (compresa di colletto) = cono + raccordo + colletto</em>
                </div>
              </div>
            )}

            {dInt <= 0 && (
              <div className="p-2.5 bg-sky-50 border border-sky-300 rounded-lg text-[11px] text-sky-900">
                Inserisci prima il diametro interno nella tab <strong>Dimensioni</strong> per calcolare l'angolo.
              </div>
            )}

            {/* Selettore campo di input principale */}
            <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-lg">
              <span className="block text-[11px] font-bold text-emerald-950 uppercase tracking-wide mb-2">
                Scegli il campo da compilare
              </span>
              <div className="grid grid-cols-2 gap-2">
                <label className={`flex items-center gap-2 p-2 rounded-md border-2 cursor-pointer transition-all ${
                  lockedBy !== 'angolo' ? 'border-emerald-700 bg-white' : 'border-neutral-200 bg-neutral-50'
                }`}>
                  <input
                    type="radio"
                    name="coperchioInputMode"
                    checked={lockedBy !== 'angolo'}
                    onChange={() => {
                      setLockedBy('h');
                      const r = dInt / 2;
                      if (r > 0 && coperchioHCono > 0) {
                        const ang = angleFromHTot(coperchioHCono, r, coperchioRRaccordo, coperchioColletto);
                        if (ang != null) setCoperchioAngolo(Math.round(ang * 100) / 100);
                      }
                    }}
                    className="accent-emerald-700"
                  />
                  <span className="text-[11px] font-bold text-neutral-900">Altezza Cono compresa di colletto</span>
                </label>
                <label className={`flex items-center gap-2 p-2 rounded-md border-2 cursor-pointer transition-all ${
                  lockedBy === 'angolo' ? 'border-emerald-700 bg-white' : 'border-neutral-200 bg-neutral-50'
                } ${dInt <= 0 ? 'opacity-50 cursor-not-allowed' : ''}`}>
                  <input
                    type="radio"
                    name="coperchioInputMode"
                    checked={lockedBy === 'angolo'}
                    disabled={dInt <= 0}
                    onChange={() => {
                      setLockedBy('angolo');
                      const r = dInt / 2;
                      if (r > 0 && coperchioAngolo == null && coperchioHCono > 0) {
                        const ang = angleFromHTot(coperchioHCono, r, coperchioRRaccordo, coperchioColletto);
                        if (ang != null) setCoperchioAngolo(Math.round(ang * 100) / 100);
                      }
                    }}
                    className="accent-emerald-700"
                  />
                  <span className="text-[11px] font-bold text-neutral-900">Gradi di Inclinazione</span>
                </label>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-neutral-900 mb-1 flex items-center gap-1 uppercase tracking-wide">
                  Altezza Cono compresa di colletto (h_cono)
                  <span className="text-[10px] text-neutral-700 font-bold">(mm)</span>
                  {lockedBy === 'angolo' && <span className="text-[9px] bg-neutral-200 text-neutral-700 px-1 py-0.5 rounded font-bold">CALCOLATO</span>}
                </label>
                <input
                  type="number"
                  min="1"
                  max="10000"
                  disabled={lockedBy === 'angolo'}
                  value={coperchioHCono || ''}
                  onChange={(e) => handleCoperchioHConoChange(e.target.value)}
                  className={`w-full text-sm border-2 rounded-lg px-3 py-2 font-bold focus:ring-2 focus:ring-emerald-800 focus:outline-hidden transition-colors ${
                    lockedBy === 'angolo'
                      ? 'bg-neutral-100 text-neutral-500 border-neutral-300 cursor-not-allowed'
                      : 'bg-[#d7ecd7]/80 border-emerald-300/80 text-emerald-950 focus:bg-[#cde9cd]'
                  }`}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-neutral-900 mb-1 flex items-center gap-1 uppercase tracking-wide">
                  Gradi di Inclinazione
                  <span className="text-[10px] text-neutral-700 font-bold">(°)</span>
                  {lockedBy !== 'angolo' && <span className="text-[9px] bg-neutral-200 text-neutral-700 px-1 py-0.5 rounded font-bold">CALCOLATO</span>}
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  max="89.99"
                  disabled={lockedBy !== 'angolo' || dInt <= 0}
                  value={coperchioAngolo ?? ''}
                  onChange={(e) => handleCoperchioAngoloChange(e.target.value)}
                  className={`w-full text-sm border-2 rounded-lg px-3 py-2 font-bold focus:ring-2 focus:ring-emerald-800 focus:outline-hidden transition-colors ${
                    lockedBy !== 'angolo' || dInt <= 0
                      ? 'bg-neutral-100 text-neutral-500 border-neutral-300 cursor-not-allowed'
                      : 'bg-[#d7ecd7]/80 border-emerald-300/80 text-emerald-950 focus:bg-[#cde9cd]'
                  }`}
                />
              </div>
            </div>
            <span className="text-[10px] text-neutral-600 block">Seleziona sopra il campo che vuoi compilare: l'altro verrà calcolato automaticamente. <strong>L'altezza del cono è comprensiva di colletto</strong> (cono retto + raggio di raccordo + colletto cilindrico). Tutte le misure sono interne.</span>

            {/* Verifica coerenza altezze interne */}
            {(() => {
              const hCoperchio = coperchioHCono || 0;
              const hVirola = lCil || 0;
              let hCop = 0;
              try {
                const cop = calculateHead(dInt || 1000, {
                  type: fondoType,
                  sp: fondoSp || 5,
                  hColletto: fondoColletto || 25,
                  ...(fondoType === 'custom' ? { R_custom: fondoRCustom, r_custom: fondoRCustomVal } : {})
                } as HeadConfig);
                hCop = cop.H_int + (fondoColletto || 0);
              } catch { hCop = 0; }
              const somma = hCoperchio + hVirola + hCop;
              return (
                <div className="p-2.5 bg-emerald-50 border border-emerald-300 rounded-lg text-[11px] text-emerald-950">
                  <span className="block font-bold uppercase tracking-wide mb-1">Verifica coerenza altezze interne</span>
                  <div className="grid grid-cols-2 gap-x-3 gap-y-0.5">
                    <span>Coperchio conico (colletto incl.)</span><span className="font-bold text-right">{Math.round(hCoperchio)} mm</span>
                    <span>Virola cilindrica</span><span className="font-bold text-right">{Math.round(hVirola)} mm</span>
                    <span>Fondo bombato (colletto incl.)</span><span className="font-bold text-right">{Math.round(hCop)} mm</span>
                    <span className="border-t border-emerald-300 pt-0.5 font-bold">Altezza totale interna</span>
                    <span className="border-t border-emerald-300 pt-0.5 font-bold text-right">{Math.round(somma)} mm</span>
                  </div>
                </div>
              );
            })()}

            <div>
              <label className="block text-xs font-bold text-neutral-900 mb-1 flex items-center gap-1 uppercase tracking-wide">
                Raggio Raccordo (r_raccordo)
                <span className="text-[10px] text-neutral-700 font-bold">(mm)</span>
              </label>
              <input
                type="number"
                min="0"
                max="1000"
                required
                value={coperchioRRaccordo || ''}
                onChange={(e) => setCoperchioRRaccordo(Math.max(0, parseInt(e.target.value) || 0))}
                className="w-full text-sm bg-[#d7ecd7]/80 border-2 border-emerald-300/80 rounded-lg px-3 py-2 text-emerald-950 font-bold focus:bg-[#cde9cd] focus:ring-2 focus:ring-emerald-800 focus:outline-hidden transition-colors"
              />
              <p className="text-[10px] text-neutral-700 mt-1 leading-snug">
                Il raccordo tra il cono e il colletto non è a spigolo vivo ma è arrotondato con questo raggio. Il volume del coperchio tiene conto di questa curvatura. <em>Default suggerito: 30 mm.</em>
              </p>
            </div>

            {raccordoError && (
              <div className="p-2.5 bg-red-50 border border-red-300 rounded-lg text-[11px] text-red-800 flex items-start gap-2">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-red-600" />
                <span>{raccordoError}</span>
              </div>
            )}

            <div className="p-2.5 bg-sky-50 border border-sky-200 rounded-lg text-[11px] text-sky-900 flex items-start gap-2">
              <Info className="w-3.5 h-3.5 shrink-0 mt-0.5 text-sky-600" />
              <span>⚠️ Il volume calcolato tiene ora conto del raccordo (raggio bordo) tra la parete conica e il colletto. Con raggi di raccordo maggiori o diametri maggiori, la differenza rispetto a un cono a spigolo vivo diventa più significativa.</span>
            </div>




            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-neutral-900 mb-1 flex items-center gap-1 uppercase tracking-wide">
                  Spessore Lamiera (Sp)
                  <span className="text-[10px] text-neutral-700 font-bold">(mm)</span>
                </label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  required
                  value={coperchioSp || ''}
                  onChange={(e) => handleCoperchioSpChange(Math.max(1, parseInt(e.target.value) || 0))}
                  className="w-full text-sm bg-[#d7ecd7]/80 border-2 border-emerald-300/80 rounded-lg px-3 py-2 text-emerald-950 font-bold focus:bg-[#cde9cd] focus:ring-2 focus:ring-emerald-800 focus:outline-hidden transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-900 mb-1 flex items-center gap-1 uppercase tracking-wide">
                  Altezza Colletto (h_colletto)
                  <span className="text-[10px] text-neutral-700 font-bold">(mm)</span>
                </label>
                <input
                  type="number"
                  min="0"
                  max="1000"
                  required
                  value={coperchioColletto ?? ''}
                  onChange={(e) => {
                    setCoperchioColletto(Math.max(0, parseInt(e.target.value) || 0));
                    setCoperchioCollettoConfirmed(true);
                  }}
                  className="w-full text-sm bg-[#d7ecd7]/80 border-2 border-emerald-300/80 rounded-lg px-3 py-2 text-emerald-950 font-bold focus:bg-[#cde9cd] focus:ring-2 focus:ring-emerald-800 focus:outline-hidden transition-colors"
                />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'fondo' && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-neutral-950 pb-2 border-b border-neutral-200 flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-emerald-800" />
              Geometria Fondo Bombato
            </h3>

            <div className="p-2.5 bg-amber-50 border border-amber-300 rounded-lg flex items-start gap-2 text-[11px] text-amber-900">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-amber-600" />
              <span><strong>Tutte le misure da inserire</strong> (diametro, altezza, ecc.) sono <strong>misure interne</strong>. Non inserire le misure esterne.</span>
            </div>

            <div>
              <label className="block text-xs font-bold text-neutral-900 mb-1 flex items-center gap-1 uppercase tracking-wide">
                Diametro Interno (D_int)
                <span className="text-[10px] text-neutral-700 font-bold">(mm)</span>
                <span className="text-[9px] bg-neutral-200 text-neutral-700 px-1 py-0.5 rounded font-bold">DA TAB DIMENSIONI</span>
              </label>
              <input
                type="number"
                value={dInt || ''}
                readOnly
                disabled
                className="w-full text-sm bg-neutral-100 border-2 border-neutral-300 rounded-lg px-3 py-2 text-neutral-700 font-bold cursor-not-allowed"
              />
            </div>


            <div>
              <label className="block text-xs font-bold text-neutral-900 mb-2 flex items-center gap-1.5 uppercase tracking-wide">
                Tipologia Testa Fondo
                {fondoUgualeAlCoperchio && <span className="text-[10px] bg-emerald-100 text-emerald-800 font-extrabold px-1.5 py-0.5 rounded-sm uppercase">Sincronizzato</span>}
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'decinormale', label: 'Decinormale', desc: 'R=1×D, r=D/10' },
                  { id: 'pseudoellittico', label: 'Pseudoellittico', desc: 'R=0.833×D, r=0.156×D' },
                  { id: 'custom', label: 'Custom', desc: 'Misure non std.' },
                ].map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    disabled={fondoUgualeAlCoperchio}
                    onClick={() => !fondoUgualeAlCoperchio && setFondoType(t.id as HeadType)}
                    className={`flex flex-col items-center justify-center p-3 border-2 rounded-xl text-center transition-all ${
                      fondoUgualeAlCoperchio ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'
                    } ${
                      fondoType === t.id
                        ? 'border-emerald-800 bg-emerald-50 text-emerald-950 font-extrabold ring-1 ring-emerald-800'
                        : 'border-neutral-200 bg-white text-neutral-600 hover:border-neutral-300'
                    }`}
                  >
                    <span className="text-xs font-bold block">{t.label}</span>
                    <span className="text-[9px] text-neutral-700 mt-0.5 leading-tight font-medium">{t.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-neutral-900 mb-1 flex items-center gap-1 uppercase tracking-wide">
                  Spessore Lamiera (Sp)
                  <span className="text-[10px] text-neutral-700 font-bold">(mm)</span>
                </label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  required
                  disabled={fondoUgualeAlCoperchio}
                  value={fondoSp || ''}
                  onChange={(e) => handleFondoSpChange(Math.max(1, parseInt(e.target.value) || 0))}
                  className={`w-full text-sm border-2 rounded-lg px-3 py-2 text-emerald-950 font-bold focus:ring-2 focus:ring-emerald-800 focus:outline-hidden ${
                    fondoUgualeAlCoperchio
                      ? 'bg-neutral-100 text-neutral-500 border-neutral-300 cursor-not-allowed'
                      : 'bg-[#d7ecd7]/80 border-emerald-300/80 focus:bg-[#cde9cd]'
                  }`}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-900 mb-1 flex items-center gap-1 uppercase tracking-wide">
                  Altezza Colletto (h_colletto)
                  <span className="text-[10px] text-neutral-700 font-bold">(mm)</span>
                </label>
                <div className="relative rounded-md shadow-xs">
                  <input
                    type="number"
                    min="0"
                    max="1000"
                    required
                    disabled={fondoUgualeAlCoperchio}
                    value={fondoColletto ?? ''}
                    onChange={(e) => {
                      setFondoColletto(Math.max(0, parseInt(e.target.value) || 0));
                      setFondoCollettoConfirmed(true);
                    }}
                    className={`w-full text-sm border-2 rounded-lg px-3 py-2 text-emerald-950 font-bold focus:ring-2 focus:ring-emerald-800 focus:outline-hidden ${
                      fondoUgualeAlCoperchio
                        ? 'bg-neutral-100 text-neutral-500 border-neutral-300 cursor-not-allowed'
                        : !fondoCollettoConfirmed
                        ? 'bg-amber-100 border-amber-400 ring-2 ring-amber-200'
                        : 'bg-[#d7ecd7]/80 border-emerald-300/80 focus:bg-[#cde9cd]'
                    }`}
                  />
                  {fondoColletto === fondoSp * 5 && (
                    <span className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-[10px] text-emerald-900 font-bold italic">
                      5 × Sp
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Colletto Confirmation Prompt */}
            {!fondoCollettoConfirmed && !fondoUgualeAlCoperchio && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-center justify-between gap-2 animate-fade-in">
                <div className="flex items-start gap-2 text-xs text-amber-800">
                  <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold block">Nuovo Colletto Proposto: {fondoSp * 5} mm</span>
                    <span className="text-[11px] opacity-80">Calcolato automaticamente (5 × Spessore).</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setFondoCollettoConfirmed(true)}
                  className="bg-amber-600 hover:bg-amber-700 text-white text-[10px] font-bold py-1 px-2.5 rounded-md transition-colors flex items-center gap-1 shadow-xs"
                >
                  <Check className="w-3 h-3" />
                  Conferma
                </button>
              </div>
            )}

            {fondoType === 'custom' && (
              <div className="p-4 bg-emerald-50/50 rounded-xl border border-emerald-200 space-y-3 animate-fade-in">
                <span className="text-xs font-bold text-emerald-950 uppercase tracking-wider block">Misure Non Standard (Fondo)</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-neutral-900 mb-1 uppercase tracking-wide">
                      Roggio Bombatura (R_custom) (mm)
                    </label>
                    <input
                      type="number"
                      required
                      min="1"
                      disabled={fondoUgualeAlCoperchio}
                      value={fondoRCustom || ''}
                      onChange={(e) => setFondoRCustom(Math.max(1, parseInt(e.target.value) || 0))}
                      className={`w-full text-sm border-2 rounded-lg px-3 py-1.5 text-emerald-950 font-bold focus:ring-2 focus:ring-emerald-800 focus:outline-hidden ${
                        fondoUgualeAlCoperchio
                          ? 'bg-neutral-100 text-neutral-500 border-neutral-300 cursor-not-allowed'
                          : 'bg-[#d7ecd7]/80 border-emerald-300/80 focus:bg-[#cde9cd]'
                      }`}
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-neutral-900 mb-1 uppercase tracking-wide">
                      Raggio Toro Raccordo (r_custom) (mm)
                    </label>
                    <input
                      type="number"
                      required
                      min="1"
                      disabled={fondoUgualeAlCoperchio}
                      value={fondoRCustomVal || ''}
                      onChange={(e) => setFondoRCustomVal(Math.max(1, parseInt(e.target.value) || 0))}
                      className={`w-full text-sm border-2 rounded-lg px-3 py-1.5 text-emerald-950 font-bold focus:ring-2 focus:ring-emerald-800 focus:outline-hidden ${
                        fondoUgualeAlCoperchio
                          ? 'bg-neutral-100 text-neutral-500 border-neutral-300 cursor-not-allowed'
                          : 'bg-[#d7ecd7]/80 border-emerald-300/80 focus:bg-[#cde9cd]'
                      }`}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'report' && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-neutral-950 pb-2 border-b border-neutral-200 uppercase tracking-wide">
              Dati Anagrafici Report (Opzionali)
            </h3>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-neutral-900 mb-1 uppercase tracking-wide">Cliente</label>
                <input
                  type="text"
                  placeholder="es. Eni S.p.A. - Raffineria Sannazzaro"
                  value={cliente}
                  onChange={(e) => setCliente(e.target.value)}
                  className="w-full text-sm bg-[#d7ecd7]/80 border-2 border-emerald-300/80 rounded-lg px-3 py-2 text-emerald-950 font-bold focus:bg-[#cde9cd] focus:ring-2 focus:ring-emerald-800 focus:outline-hidden transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-900 mb-1 uppercase tracking-wide">Riferimento / Commessa</label>
                <input
                  type="text"
                  placeholder="es. Commessa B-349_2026"
                  value={riferimento}
                  onChange={(e) => setRiferimento(e.target.value)}
                  className="w-full text-sm bg-[#d7ecd7]/80 border-2 border-emerald-300/80 rounded-lg px-3 py-2 text-emerald-950 font-bold focus:bg-[#cde9cd] focus:ring-2 focus:ring-emerald-800 focus:outline-hidden transition-colors"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-neutral-900 mb-1 uppercase tracking-wide">Serbatoio Codice/Tag</label>
                  <input
                    type="text"
                    placeholder="es. TK-01 / V-502"
                    value={nomeSerbatoio}
                    onChange={(e) => setNomeSerbatoio(e.target.value)}
                    className="w-full text-sm bg-[#d7ecd7]/80 border-2 border-emerald-300/80 rounded-lg px-3 py-2 text-emerald-950 font-bold focus:bg-[#cde9cd] focus:ring-2 focus:ring-emerald-800 focus:outline-hidden transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-neutral-900 mb-1 uppercase tracking-wide">Numero Disegno</label>
                  <input
                    type="text"
                    placeholder="es. DWG-BOMB-01-A"
                    value={numeroDisegno}
                    onChange={(e) => setNumeroDisegno(e.target.value)}
                    className="w-full text-sm bg-[#d7ecd7]/80 border-2 border-emerald-300/80 rounded-lg px-3 py-2 text-emerald-950 font-bold focus:bg-[#cde9cd] focus:ring-2 focus:ring-emerald-800 focus:outline-hidden transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-900 mb-1 uppercase tracking-wide">Data del Rilievo / Report</label>
                <input
                  type="date"
                  value={dataReport}
                  onChange={(e) => setDataReport(e.target.value)}
                  className="w-full text-sm bg-[#d7ecd7]/80 border-2 border-emerald-300/80 rounded-lg px-3 py-2 text-emerald-950 font-bold focus:bg-[#cde9cd] focus:ring-2 focus:ring-emerald-800 focus:outline-hidden transition-colors"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Calculate Button */}
      <button
        type="submit"
        className="w-full bg-emerald-900 hover:bg-emerald-950 text-white font-extrabold py-3.5 px-4 rounded-xl shadow-md transition-colors cursor-pointer flex items-center justify-center gap-2 text-sm uppercase tracking-wide"
      >
        <motion.div
          animate={{ rotate: spinCount * 1080 }}
          transition={{ duration: 1.5, ease: "easeInOut" }}
          className="inline-flex shrink-0"
        >
          <RefreshCw className="w-4 h-4 text-emerald-300" />
        </motion.div>
        Esegui Calcolo Taratura e Volumi
      </button>
    </form>
  );
}
