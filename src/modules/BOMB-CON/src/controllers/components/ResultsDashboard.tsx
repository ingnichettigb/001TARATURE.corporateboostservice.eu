/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { CalculationResult } from '../core/types';
import { Language, translations } from '../core/translations';
import { Layers, Activity, Scale, Info, ChevronRight, HelpCircle, ChevronUp, ChevronDown } from 'lucide-react';

interface ResultsDashboardProps {
  result: CalculationResult;
  lang?: Language;
  section?: 'all' | 'simulator' | 'summary';
}

export default function ResultsDashboard({ result, lang = 'it', section = 'all' }: ResultsDashboardProps) {
  const t = translations[lang];
  const [fillHeight, setFillHeight] = useState<number>(result.H_tot);
  const [activeSubTab, setActiveSubTab] = useState<'sintesi' | 'geometria'>('sintesi');
  const [isDragging, setIsDragging] = useState(false);
  const sliderRef = useRef<HTMLDivElement>(null);

  // Sync fill height when result changes
  useEffect(() => {
    setFillHeight(result.H_tot);
  }, [result.H_tot]);

  // Handle vertical slider drag logic
  const handleSliderMove = (clientY: number) => {
    if (!sliderRef.current) return;
    const rect = sliderRef.current.getBoundingClientRect();
    const height = rect.height;
    // Calculate distance from bottom (since bottom is 0 and top is max)
    const relativeY = clientY - rect.top;
    const pct = Math.min(Math.max(0, 1 - relativeY / height), 1);
    const newVal = Math.round(pct * result.H_tot);
    setFillHeight(newVal);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    handleSliderMove(e.clientY);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setIsDragging(true);
    if (e.touches[0]) {
      handleSliderMove(e.touches[0].clientY);
    }
  };

  useEffect(() => {
    const handleGlobalMove = (e: MouseEvent) => {
      if (isDragging) {
        handleSliderMove(e.clientY);
      }
    };
    const handleGlobalTouchMove = (e: TouchEvent) => {
      if (isDragging && e.touches[0]) {
        if (e.cancelable) {
          e.preventDefault();
        }
        handleSliderMove(e.touches[0].clientY);
      }
    };
    const handleGlobalUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleGlobalMove);
      window.addEventListener('mouseup', handleGlobalUp);
      window.addEventListener('touchmove', handleGlobalTouchMove, { passive: false });
      window.addEventListener('touchend', handleGlobalUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleGlobalMove);
      window.removeEventListener('mouseup', handleGlobalUp);
      window.removeEventListener('touchmove', handleGlobalTouchMove);
      window.removeEventListener('touchend', handleGlobalUp);
    };
  }, [isDragging]);

  // Find volume at the current slider fillHeight (in mm)
  const clampedFillHeight = Math.min(Math.max(0, Math.round(fillHeight)), result.H_tot);
  const currentVolumeLitri = result.litriCumulativi[clampedFillHeight] || 0;
  const currentWeightKg = currentVolumeLitri * result.input.rho;

  // Format Helper
  const formatNum = (num: number, decimals: number = 2) => {
    if (num === undefined || isNaN(num)) return '0,00';
    return num.toLocaleString(lang === 'it' ? 'it-IT' : 'en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
  };

  // Generate scaling factor for SVG
  const dInt = result.input.dInt;
  const hTot = result.H_tot;

  // We have 360px vertical space to draw the tank.
  // Map h (0 to hTot) to y (370 to 10)
  const mapHToY = (h: number) => {
    return 370 - (h / hTot) * 360;
  };

  // Generate SVG path for the tank container
  const steps = 100;
  let leftPoints: string[] = [];
  let rightPoints: string[] = [];

  for (let i = 0; i <= steps; i++) {
    const hSample = Math.round((i / steps) * hTot);
    const y = mapHToY(hSample);
    const rSample = result.raggioProfile[hSample] || 0;
    // Map radius relative to max radius (dInt / 2), scaling max radius to 60px
    const rScale = dInt > 0 ? (rSample / (dInt / 2)) * 60 : 0;
    
    leftPoints.push(`${160 - rScale},${y}`);
    rightPoints.unshift(`${160 + rScale},${y}`); // unshift to reverse right side points
  }

  const tankPathData = `M ${leftPoints.join(' L ')} L ${rightPoints.join(' L ')} Z`;

  // Generate SVG path for the liquid
  let liquidLeftPoints: string[] = [];
  let liquidRightPoints: string[] = [];
  const liquidSteps = Math.max(2, Math.round((clampedFillHeight / hTot) * steps));
  
  for (let i = 0; i <= liquidSteps; i++) {
    const hSample = Math.round((i / liquidSteps) * clampedFillHeight);
    const y = mapHToY(hSample);
    const rSample = result.raggioProfile[hSample] || 0;
    const rScale = dInt > 0 ? (rSample / (dInt / 2)) * 60 : 0;
    
    liquidLeftPoints.push(`${160 - rScale},${y}`);
    liquidRightPoints.unshift(`${160 + rScale},${y}`);
  }

  const liquidPathData = clampedFillHeight > 0 
    ? `M ${liquidLeftPoints.join(' L ')} L ${liquidRightPoints.join(' L ')} Z` 
    : '';

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Simulation / Interactive Tank Section (Left / Top) */}
      {(section === 'all' || section === 'simulator') && (
      <div className={`${section === 'all' ? 'lg:col-span-5' : 'lg:col-span-12'} bg-white border-4 border-double border-emerald-800 rounded-xl p-5 shadow-xs flex flex-col`}>
        <h3 className="text-sm font-semibold text-neutral-900 pb-2 border-b border-neutral-100 flex items-center gap-1.5 mb-4">
          <Activity className="w-4 h-4 text-neutral-500" />
          {t.realtimeLevel}
        </h3>

        {/* Dynamic Interactive SVG Container */}
        <div className="flex-1 flex flex-col items-center justify-center py-4 bg-neutral-50 rounded-xl border border-neutral-150 relative">
          
          <div className="flex w-full px-3 gap-3.5 items-center">
            {/* Column 1: Custom Premium Vertical Slider to the left of the SVG */}
            <div className="flex flex-col items-center justify-between h-[360px] px-2 bg-white border-2 border-emerald-900/15 rounded-xl py-3.5 shrink-0 select-none w-14 animate-fade-in">
              <div className="text-center">
                <span className="text-[8px] font-black text-neutral-800 uppercase tracking-wider block leading-none">
                  {lang === 'en' ? 'Full' : lang === 'es' ? 'Lleno' : lang === 'de' ? 'Voll' : 'Pieno'}
                </span>
                <span className="text-[10px] font-mono font-extrabold text-neutral-950 block mt-0.5">100%</span>
              </div>
              
              {/* Custom Track Container */}
              <div 
                ref={sliderRef}
                onMouseDown={handleMouseDown}
                onTouchStart={handleTouchStart}
                className="relative h-[230px] w-6 flex items-center justify-center cursor-pointer group"
                title={lang === 'en' ? 'Drag to change level' : lang === 'es' ? 'Arrastre para cambiar el nivel' : lang === 'de' ? 'Ziehen um Füllstand zu ändern' : 'Trascina per variare il livello'}
                style={{ touchAction: 'none' }}
              >
                {/* Track background */}
                <div className="w-1.5 bg-neutral-200 rounded-full h-full border border-neutral-300 relative overflow-hidden">
                  {/* Filled track (from bottom up) */}
                  <div 
                    className="absolute bottom-0 left-0 right-0 bg-emerald-800 rounded-full"
                    style={{ height: `${(clampedFillHeight / result.H_tot) * 100}%` }}
                  />
                </div>

                {/* Thumb Button */}
                <div 
                  className={`absolute w-6 h-6 bg-emerald-900 rounded-full border-2 border-white shadow-md cursor-grab active:cursor-grabbing transition-transform group-hover:scale-110 flex items-center justify-center ${isDragging ? 'cursor-grabbing scale-110 ring-2 ring-emerald-900/30' : ''}`}
                  style={{ 
                    bottom: `calc(${(clampedFillHeight / result.H_tot) * 100}% - 12px)`,
                    left: '50%',
                    transform: 'translateX(-50%)'
                  }}
                >
                  {/* Small inner dot */}
                  <div className="w-1.5 h-1.5 bg-white rounded-full opacity-90" />
                </div>
              </div>
              
              <div className="text-center">
                <span className="text-[10px] font-mono font-extrabold text-neutral-950 block mb-0.5">0%</span>
                <span className="text-[8px] font-black text-neutral-800 uppercase tracking-wider block leading-none">
                  {lang === 'en' ? 'Empty' : lang === 'es' ? 'Vacío' : lang === 'de' ? 'Leer' : 'Vuoto'}
                </span>
              </div>
            </div>

            {/* Column 2: SVG Plot */}
            <svg viewBox="0 0 320 400" className="w-full max-w-[245px] h-[360px] select-none shrink-0">
              <defs>
                <linearGradient id="tankGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#e5e5e5" />
                  <stop offset="50%" stopColor="#f5f5f5" />
                  <stop offset="100%" stopColor="#d4d4d4" />
                </linearGradient>
                <linearGradient id="liquidGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.8" />
                  <stop offset="50%" stopColor="#7dd3fc" stopOpacity="0.7" />
                  <stop offset="100%" stopColor="#0284c7" stopOpacity="0.9" />
                </linearGradient>
              </defs>

              {/* Grid or Scale Lines */}
              <line x1="80" y1="370" x2="240" y2="370" stroke="#737373" strokeWidth="1.25" strokeDasharray="3,3" />
              <text x="85" y="382" className="font-mono text-[10px] font-black fill-black">0 mm</text>
              <line x1="80" y1="10" x2="240" y2="10" stroke="#737373" strokeWidth="1.25" strokeDasharray="3,3" />
              <text x="85" y="8" className="font-mono text-[10px] font-black fill-black">{result.H_tot} mm</text>

              {/* Tank Body Outline */}
              <path
                d={tankPathData}
                fill="url(#tankGrad)"
                stroke="#737373"
                strokeWidth="2"
                strokeLinejoin="round"
              />

              {/* Liquid Fill */}
              {clampedFillHeight > 0 && (
                <path
                  d={liquidPathData}
                  fill="url(#liquidGrad)"
                  stroke="#0284c7"
                  strokeWidth="1"
                  strokeLinejoin="round"
                  className="transition-all duration-100 ease-out"
                />
              )}

              {/* 7 Zones Lines indicators (Delimitatori Doppia Riga Verde Oliva Sottile) */}
              {[
                { label: lang === 'en' ? 'Z1/Z2 (Cone apex end)' : lang === 'es' ? 'Z1/Z2 (Fin del cono)' : lang === 'de' ? 'Z1/Z2 (Konusende)' : 'Z1/Z2 (Fine cono)', val: result.z1 },
                { label: lang === 'en' ? 'Z2/Z3 (Bottom flange)' : lang === 'es' ? 'Z2/Z3 (Pestaña inf.)' : lang === 'de' ? 'Z2/Z3 (Unterer Bord)' : 'Z2/Z3 (Colletto f.)', val: result.z2 },
                { label: lang === 'en' ? 'Z3/Z4 (Bottom shell)' : lang === 'es' ? 'Z3/Z4 (Cuerpo inf.)' : lang === 'de' ? 'Z3/Z4 (Unterer Mantel)' : 'Z3/Z4 (Mantello f.)', val: result.z3 },
                { label: lang === 'en' ? 'Z4/Z5 (Top flange)' : lang === 'es' ? 'Z4/Z5 (Pestaña sup.)' : lang === 'de' ? 'Z4/Z5 (Oberer Bord)' : 'Z4/Z5 (Colletto c.)', val: result.z4 },
                { label: lang === 'en' ? 'Z5/Z6 (Top trans.)' : lang === 'es' ? 'Z5/Z6 (Trans. sup.)' : lang === 'de' ? 'Z5/Z6 (Oberer Übergang)' : 'Z5/Z6 (Raccordo c.)', val: result.z5 },
                { label: lang === 'en' ? 'Z6/Z7 (Top crown)' : lang === 'es' ? 'Z6/Z7 (Corona sup.)' : lang === 'de' ? 'Z6/Z7 (Obere Wölbung)' : 'Z6/Z7 (Calotta c.)', val: result.z6 },
              ].map((zone, idx) => {
                const y = mapHToY(zone.val);
                const isRight = idx === 5 || idx === 3 || idx === 2 || idx === 0;
                const textX = isRight ? 245 : 75;
                const textAnchor = isRight ? "start" : "end";
                return (
                  <g key={idx}>
                    {/* Doppia riga sottile Verde Oliva Lucido */}
                    <line
                      x1="80"
                      y1={y - 1}
                      x2="240"
                      y2={y - 1}
                      stroke="#708238"
                      strokeWidth="0.8"
                      opacity="0.9"
                    />
                    <line
                      x1="80"
                      y1={y + 1}
                      x2="240"
                      y2={y + 1}
                      stroke="#708238"
                      strokeWidth="0.8"
                      opacity="0.9"
                    />
                    <text
                      x={textX}
                      y={y + 3}
                      textAnchor={textAnchor}
                      className="font-mono text-[9.5px] font-black fill-black select-none"
                    >
                      {zone.label}
                    </text>
                  </g>
                );
              })}

              {/* Progressive numbering of the 7 zones (1 to 7) inside the tank */}
              {[
                { num: 1, min: 0, max: result.z1 },
                { num: 2, min: result.z1, max: result.z2 },
                { num: 3, min: result.z2, max: result.z3 },
                { num: 4, min: result.z3, max: result.z4 },
                { num: 5, min: result.z4, max: result.z5 },
                { num: 6, min: result.z5, max: result.z6 },
                { num: 7, min: result.z6, max: result.H_tot },
              ].map((zone) => {
                const midH = (zone.min + zone.max) / 2;
                const yCenter = mapHToY(midH);
                if (zone.max - zone.min <= 0) return null;
                return (
                  <g key={zone.num} className="opacity-95">
                    {/* Elegant circular badge centered at X=160 with premium olive theme */}
                    <circle
                      cx="160"
                      cy={yCenter}
                      r="6.5"
                      fill="#fbfdf7"
                      stroke="#708238"
                      strokeWidth="1.2"
                    />
                    <text
                      x="160"
                      y={yCenter + 2.5}
                      textAnchor="middle"
                      className="font-sans text-[7.5px] font-black fill-[#3a471c] select-none"
                    >
                      {zone.num}
                    </text>
                  </g>
                );
              })}

              {/* Water Line Indicator */}
              {clampedFillHeight > 0 && clampedFillHeight < result.H_tot && (
                <g className="transition-all duration-100 ease-out">
                  <line
                    x1="80"
                    y1={mapHToY(clampedFillHeight)}
                    x2="240"
                    y2={mapHToY(clampedFillHeight)}
                    stroke="#0284c7"
                    strokeWidth="1.5"
                  />
                  <polygon
                    points={`240,${mapHToY(clampedFillHeight)} 246,${mapHToY(clampedFillHeight) - 4} 246,${mapHToY(clampedFillHeight) + 4}`}
                    fill="#0284c7"
                  />
                </g>
              )}
            </svg>

            {/* Column 3: Stats & Numerical Input with arrow buttons */}
            <div className="flex-1 flex flex-col justify-between h-[360px] py-1">
              <div className="space-y-3">
                {/* Quota Attuale - Now an Input Field with Up/Down Arrows */}
                <div className="bg-white rounded-lg p-2.5 border-2 border-emerald-900/15">
                  <span className="text-[10px] font-bold text-neutral-800 uppercase block tracking-wider mb-1">{t.currentHeight}</span>
                  <div className="flex items-center gap-1.5 mt-1">
                    <div className="relative flex-1">
                      <input
                        type="number"
                        min="0"
                        max={result.H_tot}
                        step="1"
                        value={clampedFillHeight}
                        onChange={(e) => {
                          const val = e.target.value === '' ? 0 : parseInt(e.target.value);
                          if (!isNaN(val)) {
                            setFillHeight(Math.min(Math.max(0, val), result.H_tot));
                          }
                        }}
                        className="w-full text-base font-bold text-neutral-950 bg-[#d7ecd7]/60 border border-emerald-300 rounded-lg px-2 py-1 pr-10 focus:ring-2 focus:ring-emerald-800 focus:outline-hidden font-mono"
                      />
                      <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-extrabold text-neutral-700 pointer-events-none">
                        mm
                      </span>
                    </div>

                    <div className="flex flex-col gap-0.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => setFillHeight(prev => Math.min(prev + 10, result.H_tot))}
                        className="p-1 hover:bg-neutral-100 active:bg-neutral-200 rounded-md text-neutral-900 transition-colors border border-neutral-300 bg-white cursor-pointer shadow-2xs"
                        title={lang === 'en' ? 'Increase by 10 mm (1 cm)' : lang === 'es' ? 'Aumentar en 10 mm (1 cm)' : lang === 'de' ? 'Erhöhen um 10 mm (1 cm)' : 'Aumenta di 10 mm (1 cm)'}
                      >
                        <ChevronUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setFillHeight(prev => Math.max(prev - 10, 0))}
                        className="p-1 hover:bg-neutral-100 active:bg-neutral-200 rounded-md text-neutral-900 transition-colors border border-neutral-300 bg-white cursor-pointer shadow-2xs"
                        title={lang === 'en' ? 'Decrease by 10 mm (1 cm)' : lang === 'es' ? 'Disminuir en 10 mm (1 cm)' : lang === 'de' ? 'Verringern um 10 mm (1 cm)' : 'Diminuisci di 10 mm (1 cm)'}
                      >
                        <ChevronDown className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="text-[10px] text-neutral-600 font-mono mt-1.5 flex justify-between">
                    <span>{lang === 'en' ? 'In centimeters:' : lang === 'es' ? 'En centímetros:' : lang === 'de' ? 'In Zentimeter:' : 'In centimetri:'}</span>
                    <span className="font-extrabold text-neutral-950">{formatNum(clampedFillHeight / 10, 1)} cm</span>
                  </div>
                </div>

                <div className="bg-sky-50 rounded-lg p-2.5 border border-sky-200 shadow-2xs">
                  <span className="text-[10px] font-black text-sky-900 uppercase block tracking-wider">{t.currentVolume}</span>
                  <div className="text-lg font-black text-sky-950 mt-0.5">
                    {formatNum(currentVolumeLitri, 1)} <span className="text-xs font-bold text-sky-850">{lang === 'en' ? 'liters' : lang === 'es' ? 'litros' : lang === 'de' ? 'Liter' : 'litri'}</span>
                  </div>
                  <div className="text-[10px] text-sky-900 font-extrabold font-mono">({formatNum(currentVolumeLitri / 1000, 3)} m³)</div>
                </div>

                <div className="bg-amber-50 rounded-lg p-2.5 border border-amber-200 shadow-2xs">
                  <span className="text-[10px] font-black text-amber-950 uppercase block tracking-wider">
                    {lang === 'en' ? 'Product Weight' : lang === 'es' ? 'Peso del Producto' : lang === 'de' ? 'Produktgewicht' : 'Peso Prodotto'}
                  </span>
                  <div className="text-lg font-black text-amber-950 mt-0.5">
                    {formatNum(currentWeightKg, 1)} <span className="text-xs font-bold text-amber-850">kg</span>
                  </div>
                  <div className="text-[10px] text-amber-900 font-extrabold font-mono">({formatNum(currentWeightKg / 1000, 3)} t)</div>
                </div>
              </div>

              {/* Help tip instead of old slider */}
              <div className="pt-2.5 border-t border-neutral-200 text-[10px] text-neutral-800 font-medium flex items-start gap-1 leading-snug">
                <Info className="w-3.5 h-3.5 text-emerald-800 shrink-0 mt-0.5" />
                <span>
                  {lang === 'en' ? 'Use the draggable bar, arrows, or enter the height directly to change the level.' :
                   lang === 'es' ? 'Use la barra de arrastre, las flechas o ingrese la altura directamente para cambiar el nivel.' :
                   lang === 'de' ? 'Nutzen Sie den Schieberegler, die Pfeile oder geben Sie die Höhe direkt ein, um den Füllstand zu ändern.' :
                   'Usa la barra trascinabile, le frecce o immetti direttamente la quota per variare il livello.'}
                </span>
              </div>
            </div>
          </div>
          
        </div>
      </div>
      )}

      {/* Numerical and Mechanical Summaries (Right / Bottom) */}
      {(section === 'all' || section === 'summary') && (
      <div className={`${section === 'all' ? 'lg:col-span-7' : 'lg:col-span-12'} space-y-6 flex flex-col`}>
        {/* Tab Selection */}
        <div className="flex border-b border-neutral-300 text-sm font-medium">
          <button
            onClick={() => setActiveSubTab('sintesi')}
            className={`py-2 px-4 border-b-2 font-black cursor-pointer transition-all ${
              activeSubTab === 'sintesi'
                ? 'border-emerald-800 text-emerald-950'
                : 'border-transparent text-neutral-600 hover:text-neutral-900'
            }`}
          >
            {lang === 'en' ? 'Volumes & Weights Summary' : lang === 'es' ? 'Resumen de Volúmenes y Pesos' : lang === 'de' ? 'Zusammenfassung Füllvolumen & Gewichte' : 'Sintesi Volumi & Pesi'}
          </button>
          <button
            onClick={() => setActiveSubTab('geometria')}
            className={`py-2 px-4 border-b-2 font-black cursor-pointer transition-all ${
              activeSubTab === 'geometria'
                ? 'border-emerald-800 text-emerald-950'
                : 'border-transparent text-neutral-600 hover:text-neutral-900'
            }`}
          >
            {lang === 'en' ? 'Detailed Geometry (Audit)' : lang === 'es' ? 'Geometría Detallada (Auditoría)' : lang === 'de' ? 'Detaillierte Geometrie (Audit)' : 'Geometria Dettagliata (Audit)'}
          </button>
        </div>

        {activeSubTab === 'sintesi' && (
          <div className="space-y-6 flex-1 flex flex-col justify-between">
            {/* Row 1: Volumes Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white border-4 border-double border-emerald-800 rounded-xl p-4 shadow-xs">
                <span className="text-[10px] font-extrabold text-neutral-800 uppercase tracking-wider block">
                  {lang === 'en' ? 'Volumes of Individual Components' : lang === 'es' ? 'Volúmenes de los Componentes Individuales' : lang === 'de' ? 'Füllvolumen der einzelnen Komponenten' : 'Volumi dei Singoli Componenti'}
                </span>
                <div className="space-y-2 mt-3 text-xs text-neutral-800">
                  <div className="flex justify-between py-1 border-b border-neutral-200">
                    <span className="font-bold text-neutral-900">
                      {lang === 'en' ? 'Bottom Cone Volume:' : lang === 'es' ? 'Volumen del Fondo Cónico:' : lang === 'de' ? 'Volumen des Konusbodens:' : 'Volume Fondo Conico:'}
                    </span>
                    <span className="font-mono font-extrabold text-neutral-950">{formatNum(result.volumeFondo, 2)} {lang === 'en' ? 'liters' : lang === 'es' ? 'litros' : lang === 'de' ? 'Liter' : 'litri'}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-neutral-200">
                    <span className="font-bold text-neutral-900">
                      {lang === 'en' ? 'Cylindrical Shell Volume:' : lang === 'es' ? 'Volumen del Cuerpo Cilíndrico:' : lang === 'de' ? 'Volumen des zylindrischen Mantels:' : 'Volume Mantello Cilindrico:'}
                    </span>
                    <span className="font-mono font-extrabold text-neutral-950">{formatNum(result.volumeCilindro, 2)} {lang === 'en' ? 'liters' : lang === 'es' ? 'litros' : lang === 'de' ? 'Liter' : 'litri'}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-neutral-200">
                    <span className="font-bold text-neutral-900">
                      {lang === 'en' ? 'Top Head Volume:' : lang === 'es' ? 'Volumen del Extremo Superior:' : lang === 'de' ? 'Volumen des oberen Deckels:' : 'Volume Coperchio Bombato:'}
                    </span>
                    <span className="font-mono font-extrabold text-neutral-950">{formatNum(result.volumeCoperchio, 2)} {lang === 'en' ? 'liters' : lang === 'es' ? 'litros' : lang === 'de' ? 'Liter' : 'litri'}</span>
                  </div>
                  <div className="flex justify-between pt-2 text-emerald-950 font-black text-sm">
                    <span>
                      {lang === 'en' ? 'TOTAL NOMINAL VOLUME:' : lang === 'es' ? 'VOLUMEN NOMINAL TOTAL:' : lang === 'de' ? 'GESAMTES NENNFÜLLVOLUMEN:' : 'VOLUME TOTALE NOMINALE:'}
                    </span>
                    <span className="font-mono text-base">{formatNum(result.volumeTotale, 2)} {lang === 'en' ? 'liters' : lang === 'es' ? 'litros' : lang === 'de' ? 'Liter' : 'litri'}</span>
                  </div>
                </div>
              </div>

              <div className="bg-white border-4 border-double border-emerald-800 rounded-xl p-4 shadow-xs">
                <span className="text-[10px] font-extrabold text-neutral-800 uppercase tracking-wider block font-sans">
                  {lang === 'en' ? 'Total Physical Dimensions' : lang === 'es' ? 'Dimensiones Físicas Totales' : lang === 'de' ? 'Gesamte physische Abmessungen' : 'Dimensioni Fisiche Totali'}
                </span>
                <div className="space-y-2 mt-3 text-xs text-neutral-800">
                  <div className="flex justify-between py-1 border-b border-neutral-200">
                    <span className="font-bold text-neutral-900">
                      {lang === 'en' ? 'Total Internal Height (H_tot):' : lang === 'es' ? 'Altura Interna Total (H_tot):' : lang === 'de' ? 'Innere Gesamthöhe (H_tot):' : 'Altezza Interna Totale (H_tot):'}
                    </span>
                    <span className="font-mono font-extrabold text-neutral-950">{result.H_tot} mm</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-neutral-200">
                    <span className="font-bold text-neutral-900">
                      {lang === 'en' ? 'Internal Diameter (D_int):' : lang === 'es' ? 'Diámetro Interno (D_int):' : lang === 'de' ? 'Innendurchmesser (D_int):' : 'Diametro Interno (D_int):'}
                    </span>
                    <span className="font-mono font-extrabold text-neutral-950">{result.input.dInt} mm</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-neutral-200">
                    <span className="font-bold text-neutral-900">
                      {lang === 'en' ? 'Cylindrical Height (L_cil):' : lang === 'es' ? 'Altura Cilíndrica (L_cil):' : lang === 'de' ? 'Zylindrische Höhe (L_cil):' : 'Altezza Cilindrica (L_cil):'}
                    </span>
                    <span className="font-mono font-extrabold text-neutral-950">{result.input.lCil} mm</span>
                  </div>
                  <div className="flex justify-between pt-2 text-emerald-950 font-black text-sm">
                    <span>
                      {lang === 'en' ? 'Specific Fluid Weight (rho):' : lang === 'es' ? 'Peso Específico del Fluido (rho):' : lang === 'de' ? 'Spezifisches Gewicht des Fluids (rho):' : 'Peso Specifico Fluido (rho):'}
                    </span>
                    <span className="font-mono text-base">{formatNum(result.input.rho, 3)} kg/dm³</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Row 2: Mechanicals / Sheet Metals */}
            <div className="bg-white border-4 border-double border-emerald-800 rounded-xl p-5 shadow-xs">
              <h4 className="text-xs font-black text-neutral-900 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <Scale className="w-3.5 h-3.5 text-emerald-800" />
                {lang === 'en' ? 'Construction & Sheet Metal Details (Steel)' : lang === 'es' ? 'Datos de Fabricación y Chapa (Acero)' : lang === 'de' ? 'Konstruktionsdaten & Zuschnittbleche (Stahl)' : 'Dati Costruttivi e Lamiere (Acciaio)'}
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs text-neutral-800">
                <div className="space-y-2">
                  <span className="font-black text-neutral-950 border-b-2 border-emerald-900/10 pb-1 block">
                    {lang === 'en' ? 'Bottom Head:' : lang === 'es' ? 'Extremo Inferior:' : lang === 'de' ? 'Unterer Boden:' : 'Fondo Calotta:'}
                  </span>
                  <div className="flex justify-between py-1">
                    <span className="font-medium text-neutral-700">
                      {lang === 'en' ? 'Sheet Thickness (s):' : lang === 'es' ? 'Espesor de Chapa (s):' : lang === 'de' ? 'Blechdicke (s):' : 'Spessore Lamiera (Sp):'}
                    </span>
                    <span className="font-mono font-bold text-neutral-950">{result.input.fondo.sp} mm</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="font-medium text-neutral-700 font-sans">
                      {lang === 'en' ? 'Sheet Metal Cutting Development (Diameter):' : lang === 'es' ? 'Desarrollo de Corte de Chapa (Diámetro):' : lang === 'de' ? 'Blech-Zuschnittsentwicklung (Durchmesser):' : 'Sviluppo Taglio Lamiera (Diametro):'}
                    </span>
                    <span className="font-mono font-bold text-neutral-950">{formatNum(result.fondo.Sviluppo_mm, 1)} mm</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="font-medium text-neutral-700">
                      {lang === 'en' ? 'Raw Disc Cutting Area:' : lang === 'es' ? 'Área del Disco Bruto de Corte:' : lang === 'de' ? 'Fläche des rohen Zuschnittsblechs:' : 'Area Disco Grezzo Taglio:'}
                    </span>
                    <span className="font-mono font-bold text-neutral-950">{formatNum(result.sviluppoFondoMq, 3)} m²</span>
                  </div>
                  <div className="flex justify-between py-1 font-black text-neutral-950 border-t border-neutral-300 pt-1">
                    <span>
                      {lang === 'en' ? 'Bottom Head Sheet Weight:' : lang === 'es' ? 'Peso de Chapa de Fondo:' : lang === 'de' ? 'Blechgewicht des Bodens:' : 'Peso Lamiera Fondo:'}
                    </span>
                    <span className="font-mono">{formatNum(result.pesoLamieraFondo, 1)} kg</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <span className="font-black text-neutral-950 border-b-2 border-emerald-900/10 pb-1 block">
                    {lang === 'en' ? 'Top Head:' : lang === 'es' ? 'Extremo Superior:' : lang === 'de' ? 'Oberer Deckel:' : 'Coperchio Calotta:'}
                  </span>
                  <div className="flex justify-between py-1">
                    <span className="font-medium text-neutral-700">
                      {lang === 'en' ? 'Sheet Thickness (s):' : lang === 'es' ? 'Espesor de Chapa (s):' : lang === 'de' ? 'Blechdicke (s):' : 'Spessore Lamiera (Sp):'}
                    </span>
                    <span className="font-mono font-bold text-neutral-950">{result.input.coperchio.sp} mm</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="font-medium text-neutral-700">
                      {lang === 'en' ? 'Sheet Metal Cutting Development (Diameter):' : lang === 'es' ? 'Desarrollo de Corte de Chapa (Diámetro):' : lang === 'de' ? 'Blech-Zuschnittsentwicklung (Durchmesser):' : 'Sviluppo Taglio Lamiera (Diametro):'}
                    </span>
                    <span className="font-mono font-bold text-neutral-950">{formatNum(result.coperchio.Sviluppo_mm, 1)} mm</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="font-medium text-neutral-700">
                      {lang === 'en' ? 'Raw Disc Cutting Area:' : lang === 'es' ? 'Área del Disco Bruto de Corte:' : lang === 'de' ? 'Fläche des rohen Zuschnittsblechs:' : 'Area Disco Grezzo Taglio:'}
                    </span>
                    <span className="font-mono font-bold text-neutral-950">{formatNum(result.sviluppoCoperchioMq, 3)} m²</span>
                  </div>
                  <div className="flex justify-between py-1 font-black text-neutral-950 border-t border-neutral-300 pt-1">
                    <span>
                      {lang === 'en' ? 'Top Head Sheet Weight:' : lang === 'es' ? 'Peso de Chapa de Tapa:' : lang === 'de' ? 'Blechgewicht des Deckels:' : 'Peso Lamiera Coperchio:'}
                    </span>
                    <span className="font-mono">{formatNum(result.pesoLamieraCoperchio, 1)} kg</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Weights and contents */}
            <div className="bg-white text-neutral-900 border-4 border-double border-emerald-800 rounded-xl p-4 flex flex-col sm:flex-row justify-between gap-4 shadow-xs">
              <div>
                <span className="text-[10px] font-black text-emerald-950 uppercase tracking-wider block">
                  {lang === 'en' ? 'Full Load Weight' : lang === 'es' ? 'Peso con Carga Máxima' : lang === 'de' ? 'Gewicht bei Vollfüllung' : 'Peso Contenuto Pieno'}
                </span>
                <div className="text-xl font-black text-emerald-950 mt-1">
                  {formatNum(result.pesoContenutoTotale, 1)} kg
                  <span className="text-xs font-bold text-neutral-500 ml-2">({formatNum(result.pesoContenutoTotale / 1000, 3)} t)</span>
                </div>
              </div>
              <div className="sm:border-l sm:border-neutral-200 sm:pl-6">
                <span className="text-[10px] font-black text-emerald-950 uppercase tracking-wider block">
                  {lang === 'en' ? 'Weight per cm of cylindrical shell' : lang === 'es' ? 'Peso por cm de cuerpo cilíndrico' : lang === 'de' ? 'Gewicht pro cm des zylindrischen Mantels' : 'Peso per cm di mantello cilindrico'}
                </span>
                <div className="text-lg font-black text-emerald-700 mt-1">
                  {formatNum(result.pesoContenutoPerCmCilindro, 2)} kg/cm
                </div>
              </div>
            </div>
          </div>
        )}

        {activeSubTab === 'geometria' && (
          <div className="space-y-4 max-h-[480px] overflow-y-auto pr-1">
            <div className="p-3 bg-blue-50 text-blue-800 text-xs rounded-lg border border-blue-100 flex gap-2 items-start">
              <Info className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
              <p>
                {lang === 'en' ? 'These data represent all the trigonometric and geometric variables calculated internally. Use them to verify calculation accuracy by comparing them to cells BG-BO of the Excel sheet.' :
                 lang === 'es' ? 'Estos datos representan todas las variables trigonométricas y geométricas calculadas internamente. Utilícelos para verificar la precisión del cálculo comparándolos con las celdas BG-BO de la hoja de Excel.' :
                 lang === 'de' ? 'Diese Daten stellen alle intern berechneten trigonometrischen und geometrischen Variablen dar. Verwenden Sie sie, um die Genauigkeit der Berechnung zu überprüfen, indem Sie sie mit den Zellen BG-BO des Excel-Arbeitsblatts vergleichen.' :
                 'Questi dati rappresentano tutte le variabili trigonometriche e geometriche calcolate internamente. Utilizzali per verificare la correttezza del calcolo confrontandoli con le celle BG→BO del foglio Excel.'}
              </p>
            </div>

            {/* Geometric Audit Tables */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Fondo audit */}
              <div className="bg-white border-4 border-double border-emerald-800 rounded-xl p-4 shadow-xs">
                <h4 className="text-xs font-bold text-neutral-900 border-b border-neutral-200 pb-1.5 mb-2 uppercase">Parametri Fondo</h4>
                <div className="space-y-1 text-xs font-mono">
                  <div className="flex justify-between py-0.5 border-b border-neutral-100">
                    <span className="text-neutral-500">R:</span>
                    <span className="font-bold text-neutral-800">{formatNum(result.fondo.R, 1)} mm</span>
                  </div>
                  <div className="flex justify-between py-0.5 border-b border-neutral-100">
                    <span className="text-neutral-500">r:</span>
                    <span className="font-bold text-neutral-800">{formatNum(result.fondo.r, 1)} mm</span>
                  </div>
                  <div className="flex justify-between py-0.5 border-b border-neutral-100">
                    <span className="text-neutral-500">DR (R - r):</span>
                    <span className="font-bold text-neutral-800">{formatNum(result.fondo.DR, 2)} mm</span>
                  </div>
                  <div className="flex justify-between py-0.5 border-b border-neutral-100">
                    <span className="text-neutral-500">X (D/2 - r):</span>
                    <span className="font-bold text-neutral-800">{formatNum(result.fondo.X, 2)} mm</span>
                  </div>
                  <div className="flex justify-between py-0.5 border-b border-neutral-100">
                    <span className="text-neutral-500">Alfa (gradi):</span>
                    <span className="font-bold text-neutral-800">{formatNum(result.fondo.alfa, 4)}°</span>
                  </div>
                  <div className="flex justify-between py-0.5 border-b border-neutral-100">
                    <span className="text-neutral-500">Beta (gradi):</span>
                    <span className="font-bold text-neutral-800">{formatNum(result.fondo.beta, 4)}°</span>
                  </div>
                  <div className="flex justify-between py-0.5 border-b border-neutral-100">
                    <span className="text-neutral-500">H1:</span>
                    <span className="font-bold text-neutral-800">{formatNum(result.fondo.H1, 2)} mm</span>
                  </div>
                  <div className="flex justify-between py-0.5 border-b border-neutral-100">
                    <span className="text-neutral-500">H_int:</span>
                    <span className="font-bold text-neutral-800">{formatNum(result.fondo.H_int, 2)} mm</span>
                  </div>
                  <div className="flex justify-between py-0.5 border-b border-neutral-100">
                    <span className="text-neutral-500">H2 (toro):</span>
                    <span className="font-bold text-neutral-800">{formatNum(result.fondo.H2, 2)} mm</span>
                  </div>
                  <div className="flex justify-between py-0.5 border-b border-neutral-100">
                    <span className="text-neutral-500">H3 (calotta):</span>
                    <span className="font-bold text-neutral-800">{formatNum(result.fondo.H3, 2)} mm</span>
                  </div>
                  <div className="flex justify-between py-0.5 border-b border-neutral-100">
                    <span className="text-neutral-500">Y:</span>
                    <span className="font-bold text-neutral-800">{formatNum(result.fondo.Y, 2)} mm</span>
                  </div>
                  <div className="flex justify-between py-0.5 border-b border-neutral-100">
                    <span className="text-neutral-500">Baricentro Toro:</span>
                    <span className="font-bold text-neutral-800">{formatNum(result.fondo.Baric, 2)} mm</span>
                  </div>
                  <div className="flex justify-between py-0.5 border-b border-neutral-100">
                    <span className="text-neutral-500">K:</span>
                    <span className="font-bold text-neutral-800">{formatNum(result.fondo.K, 2)} mm</span>
                  </div>
                  <div className="flex justify-between py-0.5">
                    <span className="text-neutral-500">H Esterna Tot:</span>
                    <span className="font-bold text-neutral-800">{formatNum(result.fondo.H_esterna_totale, 1)} mm</span>
                  </div>
                </div>
              </div>

              {/* Coperchio audit */}
              <div className="bg-white border-4 border-double border-emerald-800 rounded-xl p-4 shadow-xs">
                <h4 className="text-xs font-bold text-neutral-900 border-b border-neutral-200 pb-1.5 mb-2 uppercase">Parametri Coperchio</h4>
                <div className="space-y-1 text-xs font-mono">
                  <div className="flex justify-between py-0.5 border-b border-neutral-100">
                    <span className="text-neutral-500">R:</span>
                    <span className="font-bold text-neutral-800">{formatNum(result.coperchio.R, 1)} mm</span>
                  </div>
                  <div className="flex justify-between py-0.5 border-b border-neutral-100">
                    <span className="text-neutral-500">r:</span>
                    <span className="font-bold text-neutral-800">{formatNum(result.coperchio.r, 1)} mm</span>
                  </div>
                  <div className="flex justify-between py-0.5 border-b border-neutral-100">
                    <span className="text-neutral-500">DR (R - r):</span>
                    <span className="font-bold text-neutral-800">{formatNum(result.coperchio.DR, 2)} mm</span>
                  </div>
                  <div className="flex justify-between py-0.5 border-b border-neutral-100">
                    <span className="text-neutral-500">X (D/2 - r):</span>
                    <span className="font-bold text-neutral-800">{formatNum(result.coperchio.X, 2)} mm</span>
                  </div>
                  <div className="flex justify-between py-0.5 border-b border-neutral-100">
                    <span className="text-neutral-500">Alfa (gradi):</span>
                    <span className="font-bold text-neutral-800">{formatNum(result.coperchio.alfa, 4)}°</span>
                  </div>
                  <div className="flex justify-between py-0.5 border-b border-neutral-100">
                    <span className="text-neutral-500">Beta (gradi):</span>
                    <span className="font-bold text-neutral-800">{formatNum(result.coperchio.beta, 4)}°</span>
                  </div>
                  <div className="flex justify-between py-0.5 border-b border-neutral-100">
                    <span className="text-neutral-500">H1:</span>
                    <span className="font-bold text-neutral-800">{formatNum(result.coperchio.H1, 2)} mm</span>
                  </div>
                  <div className="flex justify-between py-0.5 border-b border-neutral-100">
                    <span className="text-neutral-500">H_int:</span>
                    <span className="font-bold text-neutral-800">{formatNum(result.coperchio.H_int, 2)} mm</span>
                  </div>
                  <div className="flex justify-between py-0.5 border-b border-neutral-100">
                    <span className="text-neutral-500">H2 (toro):</span>
                    <span className="font-bold text-neutral-800">{formatNum(result.coperchio.H2, 2)} mm</span>
                  </div>
                  <div className="flex justify-between py-0.5 border-b border-neutral-100">
                    <span className="text-neutral-500">H3 (calotta):</span>
                    <span className="font-bold text-neutral-800">{formatNum(result.coperchio.H3, 2)} mm</span>
                  </div>
                  <div className="flex justify-between py-0.5 border-b border-neutral-100">
                    <span className="text-neutral-500">Y:</span>
                    <span className="font-bold text-neutral-800">{formatNum(result.coperchio.Y, 2)} mm</span>
                  </div>
                  <div className="flex justify-between py-0.5 border-b border-neutral-100">
                    <span className="text-neutral-500">Baricentro Toro:</span>
                    <span className="font-bold text-neutral-800">{formatNum(result.coperchio.Baric, 2)} mm</span>
                  </div>
                  <div className="flex justify-between py-0.5 border-b border-neutral-100">
                    <span className="text-neutral-500">K:</span>
                    <span className="font-bold text-neutral-800">{formatNum(result.coperchio.K, 2)} mm</span>
                  </div>
                  <div className="flex justify-between py-0.5">
                    <span className="text-neutral-500">H Esterna Tot:</span>
                    <span className="font-bold text-neutral-800">{formatNum(result.coperchio.H_esterna_totale, 1)} mm</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      )}
    </div>
  );
}
