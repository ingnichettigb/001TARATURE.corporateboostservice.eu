/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { CalculationResult } from '../../models/types';
import { Language, translations } from '../../utils/translations';
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

  // ---- Disegno serbatoio ORIZZONTALE (ruotato dell'eventuale inclinazione) ----
  const hTot = result.H_tot;
  const Lax = result.L_tot;
  const thetaRad = (result.angolo * Math.PI) / 180;
  const sinT = Math.sin(thetaRad);
  const cosT = Math.cos(thetaRad);
  // X = x cos t - y sin t ; Z = x sin t + y cos t  (y = distanza trasversale dall'asse)
  let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
  for (let x = 0; x <= Lax; x++) {
    const r = result.raggioProfile[x] || 0;
    for (const yy of [r, -r]) {
      const X = x * cosT - yy * sinT;
      const Z = x * sinT + yy * cosT;
      if (X < minX) minX = X;
      if (X > maxX) maxX = X;
      if (Z < minZ) minZ = Z;
      if (Z > maxZ) maxZ = Z;
    }
  }
  const drawW = 400, drawH = 280;
  const spanX = Math.max(1, maxX - minX);
  const spanZ = Math.max(1, maxZ - minZ);
  const sc = Math.min(340 / spanX, 190 / spanZ);
  const xOff = (drawW - spanX * sc) / 2 - minX * sc;
  const yBase = drawH / 2 + (spanZ * sc) / 2 + 4; // y schermo del punto più basso
  const mapX = (X: number) => xOff + X * sc;
  const mapZ = (Z: number) => yBase - (Z - minZ) * sc;
  const mapLevelToY = (h: number) => yBase - h * sc;

  const nPts = Math.min(Lax, 220);
  const upPts: string[] = [];
  const loPts: string[] = [];
  for (let i = 0; i <= nPts; i++) {
    const x = Math.round((i / nPts) * Lax);
    const r = result.raggioProfile[x] || 0;
    upPts.push(`${mapX(x * cosT - r * sinT).toFixed(2)},${mapZ(x * sinT + r * cosT).toFixed(2)}`);
    loPts.unshift(`${mapX(x * cosT + r * sinT).toFixed(2)},${mapZ(x * sinT - r * cosT).toFixed(2)}`);
  }
  const tankPathData = `M ${upPts.join(' L ')} L ${loPts.join(' L ')} Z`;
  const yWater = mapLevelToY(clampedFillHeight);
  const pctFill = result.volumeTotale > 0 ? (currentVolumeLitri / result.volumeTotale) * 100 : 0;

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
          
          <div className="flex flex-col w-full px-3 gap-3.5">
            <div className="flex w-full gap-3 items-center">
            {/* Column 1: Custom Premium Vertical Slider to the left of the SVG */}
            <div className="flex flex-col items-center justify-between h-[280px] px-2 bg-white border-2 border-emerald-900/15 rounded-xl py-3.5 shrink-0 select-none w-14 animate-fade-in">
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
                className="relative h-[170px] w-6 flex items-center justify-center cursor-pointer group"
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

            {/* Column 2: SVG Plot (serbatoio orizzontale) */}
            <svg viewBox={`0 0 ${drawW} ${drawH}`} className="w-full h-[280px] select-none flex-1 min-w-0">
              <defs>
                <linearGradient id="tankGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#f5f5f5" />
                  <stop offset="50%" stopColor="#e5e5e5" />
                  <stop offset="100%" stopColor="#d4d4d4" />
                </linearGradient>
                <linearGradient id="liquidGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#7dd3fc" stopOpacity="0.75" />
                  <stop offset="100%" stopColor="#0284c7" stopOpacity="0.9" />
                </linearGradient>
                <clipPath id="liquidClip">
                  <rect x="0" y={yWater} width={drawW} height={Math.max(0, drawH - yWater)} />
                </clipPath>
              </defs>

              {/* Riferimenti livello 0 e livello massimo */}
              <line x1="14" y1={mapLevelToY(0)} x2={drawW - 14} y2={mapLevelToY(0)} stroke="#737373" strokeWidth="1.25" strokeDasharray="3,3" />
              <text x="16" y={mapLevelToY(0) + 11} className="font-mono text-[10px] font-black fill-black">0 mm</text>
              <line x1="14" y1={mapLevelToY(hTot)} x2={drawW - 14} y2={mapLevelToY(hTot)} stroke="#737373" strokeWidth="1.25" strokeDasharray="3,3" />
              <text x="16" y={mapLevelToY(hTot) - 3} className="font-mono text-[10px] font-black fill-black">{hTot} mm</text>

              {/* Corpo serbatoio */}
              <path d={tankPathData} fill="url(#tankGrad)" stroke="#737373" strokeWidth="2" strokeLinejoin="round" />

              {/* Liquido: stesso profilo, tagliato dal piano orizzontale del livello */}
              {clampedFillHeight > 0 && (
                <path d={tankPathData} fill="url(#liquidGrad)" stroke="#0284c7" strokeWidth="1" strokeLinejoin="round" clipPath="url(#liquidClip)" />
              )}

              {/* Linea del livello */}
              {clampedFillHeight > 0 && clampedFillHeight < hTot && (
                <g>
                  <line x1="14" y1={yWater} x2={drawW - 30} y2={yWater} stroke="#0284c7" strokeWidth="1.5" />
                  <polygon points={`${drawW - 30},${yWater} ${drawW - 36},${yWater - 4} ${drawW - 36},${yWater + 4}`} fill="#0284c7" />
                  <text x="16" y={yWater - 6} textAnchor="start" stroke="#ffffff" strokeWidth="3" paintOrder="stroke" className="font-mono text-[10px] font-black fill-[#0369a1]">
                    {clampedFillHeight} mm • {formatNum(pctFill, 1)}%
                  </text>
                </g>
              )}

              {/* Inclinazione */}
              {result.angolo !== 0 && (
                <text x={drawW - 14} y={16} textAnchor="end" className="font-mono text-[10px] font-black fill-[#3a471c]">
                  {lang === 'en' ? 'Tilt' : lang === 'es' ? 'Inclinación' : lang === 'de' ? 'Neigung' : 'Inclinazione'}: {formatNum(result.angolo, 1)}°
                </text>
              )}
            </svg>
            </div>

            {/* Column 3: Stats & Numerical Input with arrow buttons */}
            <div className="flex flex-col gap-3 w-full">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
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
                  <div className="text-[10px] text-sky-900 font-extrabold font-mono">({formatNum(currentVolumeLitri / 1000, 3)} m³) • {formatNum(pctFill, 1)} %</div>
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
                      {lang === 'en' ? 'Left Conical Head Volume:' : lang === 'es' ? 'Volumen Cabezal Izquierdo Cónico:' : lang === 'de' ? 'Volumen linker konischer Boden:' : 'Volume Testa Sinistra Conica:'}
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
                      {lang === 'en' ? 'Right Conical Head Volume:' : lang === 'es' ? 'Volumen Cabezal Derecho Cónico:' : lang === 'de' ? 'Volumen rechter konischer Boden:' : 'Volume Testa Destra Conica:'}
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
                      {lang === 'en' ? 'Maximum Level (H_tot):' : lang === 'es' ? 'Nivel Máximo (H_tot):' : lang === 'de' ? 'Maximaler Füllstand (H_tot):' : 'Livello Massimo (H_tot):'}
                    </span>
                    <span className="font-mono font-extrabold text-neutral-950">{result.H_tot} mm</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-neutral-200">
                    <span className="font-bold text-neutral-900">
                      {lang === 'en' ? 'Internal Axial Length (L_tot):' : lang === 'es' ? 'Longitud Axial Interna (L_tot):' : lang === 'de' ? 'Innere Axiallänge (L_tot):' : 'Lunghezza Assiale Interna (L_tot):'}
                    </span>
                    <span className="font-mono font-extrabold text-neutral-950">{result.L_tot} mm</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-neutral-200">
                    <span className="font-bold text-neutral-900">{t.tiltAngle}:</span>
                    <span className="font-mono font-extrabold text-neutral-950">{formatNum(result.angolo, 1)} °</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-neutral-200">
                    <span className="font-bold text-neutral-900">
                      {lang === 'en' ? 'Internal Diameter (D_int):' : lang === 'es' ? 'Diámetro Interno (D_int):' : lang === 'de' ? 'Innendurchmesser (D_int):' : 'Diametro Interno (D_int):'}
                    </span>
                    <span className="font-mono font-extrabold text-neutral-950">{result.input.dInt} mm</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-neutral-200">
                    <span className="font-bold text-neutral-900">
                      {lang === 'en' ? 'Cylindrical Length (L_cil):' : lang === 'es' ? 'Longitud Cilíndrica (L_cil):' : lang === 'de' ? 'Zylinderlänge (L_cil):' : 'Lunghezza Cilindrica (L_cil):'}
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
                    {lang === 'en' ? 'Left Head:' : lang === 'es' ? 'Cabezal Izquierdo:' : lang === 'de' ? 'Linker Boden:' : 'Testa Sinistra:'}
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
                      {lang === 'en' ? 'Left Head Sheet Weight:' : lang === 'es' ? 'Peso de Chapa Cabezal Izq.:' : lang === 'de' ? 'Blechgewicht linker Boden:' : 'Peso Lamiera Testa Sinistra:'}
                    </span>
                    <span className="font-mono">{formatNum(result.pesoLamieraFondo, 1)} kg</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <span className="font-black text-neutral-950 border-b-2 border-emerald-900/10 pb-1 block">
                    {lang === 'en' ? 'Right Head:' : lang === 'es' ? 'Cabezal Derecho:' : lang === 'de' ? 'Rechter Boden:' : 'Testa Destra:'}
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
                      {lang === 'en' ? 'Right Head Sheet Weight:' : lang === 'es' ? 'Peso de Chapa Cabezal Der.:' : lang === 'de' ? 'Blechgewicht rechter Boden:' : 'Peso Lamiera Testa Destra:'}
                    </span>
                    <span className="font-mono">{formatNum(result.pesoLamieraCoperchio, 1)} kg</span>
                  </div>
                  <div className="flex justify-between py-1 font-black text-neutral-950 border-t border-neutral-300 pt-1">
                    <span>
                      {lang === 'en' ? 'Shell Sheet Weight:' : lang === 'es' ? 'Peso de Chapa Virola:' : lang === 'de' ? 'Blechgewicht Mantel:' : 'Peso Lamiera Virola:'}
                    </span>
                    <span className="font-mono">{formatNum(result.pesoLamieraVirola, 1)} kg</span>
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
                  {lang === 'en' ? 'Weight per cm of cylinder length' : lang === 'es' ? 'Peso por cm de longitud de cilindro' : lang === 'de' ? 'Gewicht pro cm Zylinderlänge' : 'Peso per cm di lunghezza cilindro'}
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
                <h4 className="text-xs font-bold text-neutral-900 border-b border-neutral-200 pb-1.5 mb-2 uppercase">Parametri Testa Sinistra</h4>
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
                <h4 className="text-xs font-bold text-neutral-900 border-b border-neutral-200 pb-1.5 mb-2 uppercase">Parametri Testa Destra</h4>
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
