/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Link } from '@tanstack/react-router';
import { useReportHeader } from '@/common/report-header/useReportHeader';
import { TankInput, CalculationResult, CompilerInfo } from '../models/types';
import { calculateTank } from '../services/logic';
import GeometrySchema from './components/GeometrySchema';
import ResultsDashboard from './components/ResultsDashboard';
import CalibrationTable from './components/CalibrationTable';
import SavedTanksList from './components/SavedTanksList';
import { TANK_TYPE } from '../constants';
import { addTank, newTankId, formatTankDate } from '@/common/tanks/storage';
import { buildTankFile, buildTankFileName, downloadTankFile } from '@/common/tanks/file';

import InfoModal from './components/InfoModal';
import { Language, translations } from '../utils/translations';
import { 
  Cylinder, 
  FileText, 
  Info, 
  HardHat, 
  Calendar, 
  Building2,
  Compass,
  Wrench,
  Gauge,
  ShieldCheck,
  PenTool,
  Globe,
  Printer,
  Save,
  Download,
  X,
  ChevronLeft,
  ChevronRight,
  ChevronDown
} from 'lucide-react';
import { generateCalibrationPDF } from '../services/pdf';
import { captureGeometryImage } from '../services/captureGeometry';
import { getExtendedNumbers, getSelectedExtendedEntries, getExtendedValidityText, formatExtendedEntry } from '../services/extended-validity';
import { loadLanguage, saveLanguage } from '@/common/language/storage';
import { useExportQuota } from '@/common/exports/useExportQuota';
import ExportCountBadge from '@/common/exports/ExportCountBadge';



export default function App() {
  // Lingua persistente e condivisa con il menu principale e gli altri moduli
  // (src/common/language/storage.ts). Valore iniziale neutro per l'SSR,
  // allineato allo storage subito dopo il mount.
  const [lang, setLang] = useState<Language>('it');
  useEffect(() => {
    setLang(loadLanguage() as Language);
  }, []);
  const t = translations[lang];

  // Contatore export PDF rimanenti, legato alla licenza attivata
  // (src/lib/license.functions.ts + gate in src/routes/__root.tsx).
  // null = nessuna licenza / illimitato → badge non mostrato.
  const {
    remaining: pdfExportsBadge,
    blocked: exportsBlocked,
    showLastExportWarning,
    consume: consumeExport,
    dialog: pdfExportsExhaustedDialog,
  } = useExportQuota();

  
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);
  const headerRef = useRef<HTMLElement>(null);
  const wizardCardRef = useRef<HTMLDivElement>(null);
  const [stickyOffset, setStickyOffset] = useState(0);
  const [isLangMenuOpen, setIsLangMenuOpen] = useState(false);
  const langOptions: { code: Language; flag: string }[] = [
    { code: 'it', flag: '🇮🇹' },
    { code: 'en', flag: '🇬🇧' },
    { code: 'es', flag: '🇪🇸' },
    { code: 'de', flag: '🇩🇪' }
  ];
  // Intestazione report: DATO COMUNE condiviso da tutti i moduli (src/shared/report-header)
  const { header: compilerInfo, update: handleSaveCompilerInfo } = useReportHeader();


  const renderCompilerLogo = (type: CompilerInfo['logoType'], sizeClass: string = "w-6 h-6") => {
    switch (type) {
      case 'standard': return <Compass className={sizeClass} />;
      case 'building': return <Building2 className={sizeClass} />;
      case 'wrench': return <Wrench className={sizeClass} />;
      case 'gauge': return <Gauge className={sizeClass} />;
      case 'shield': return <ShieldCheck className={sizeClass} />;
      case 'custom':
        if (compilerInfo.customLogoData) {
          return <img src={compilerInfo.customLogoData} className={`${sizeClass} object-contain rounded-xs`} alt="Custom Logo" referrerPolicy="no-referrer" />;
        }
        return <Compass className={sizeClass} />;
      default: return null;
    }
  };

  // Pre-populate with a highly realistic, complete industrial gasoil tank example
  const defaultInput: TankInput = {
    dInt: 2200,      // 2.2 meters diameter
    lCil: 5200,      // 5.2 meters cylindrical shell
    rho: 0.85,       // Gazole/diesel density
    spVirola: 6,     // spessore lamiera virola (mm)
    fondo: {
      type: 'pseudoellittico',
      sp: 6,
      hColletto: 30,
    },
    coperchio: {
      type: 'conico',
      sp: 8,
      hColletto: 40,
      hCono: 900, // altezza totale (cono puro + raccordo)
      rRaccordo: 30, // raccordo cono/colletto (mm)
    },

    report: {
      cliente: 'Petrolchimica Padana S.p.A.',
      riferimento: 'Parco Serbatoi - Area Stoccaggio Sud',
      nomeSerbatoio: 'Serbatoio Diesel TK-104',
      numeroDisegno: 'BOMB-TK-104-REV02',
      data: new Date().toISOString().split('T')[0],
      compilatore: 'Ing. Marco Rossi',
      numeroFabbrica: '24/1098-S',
      tagNumber: 'TK-104',
      validitaEstesa: '24/1099-S, 24/1100-S',
      commessa: 'JOB-2026-PET-04'
    }
  };

  const [input, setInput] = useState<TankInput>(defaultInput);
  const [newExtendedNumber, setNewExtendedNumber] = useState<string>('');
  const [newExtendedTag, setNewExtendedTag] = useState<string>('');

  // Elenco numeri di fabbrica (validità estesa) + modalità di stampa
  const extendedNumbers = getExtendedNumbers(input.report);
  const printMode: 'unico' | 'multiplo' = input.report.modalitaStampa || 'unico';

  const setExtendedNumbers = (list: { numero: string; tag?: string; incluso: boolean }[]) =>
    setInput(prev => ({
      ...prev,
      report: {
        ...prev.report,
        numeriFabbricaEstesi: list,
        validitaEstesa: list.filter(n => n.incluso).map(n => formatExtendedEntry(n)).join(', '),
      },
    }));

  const addExtendedNumber = () => {
    const value = newExtendedNumber.trim();
    if (!value) return;
    setExtendedNumbers([...extendedNumbers, { numero: value, tag: newExtendedTag.trim(), incluso: true }]);
    setNewExtendedNumber('');
    setNewExtendedTag('');
  };

  const updateExtendedEntry = (idx: number, patch: { numero?: string; tag?: string }) =>
    setExtendedNumbers(extendedNumbers.map((n, i) => (i === idx ? { ...n, ...patch } : n)));

  const toggleExtendedNumber = (idx: number) =>
    setExtendedNumbers(extendedNumbers.map((n, i) => (i === idx ? { ...n, incluso: !n.incluso } : n)));

  const removeExtendedNumber = (idx: number) =>
    setExtendedNumbers(extendedNumbers.filter((_, i) => i !== idx));

  const setPrintMode = (mode: 'unico' | 'multiplo') =>
    setInput(prev => ({ ...prev, report: { ...prev.report, modalitaStampa: mode } }));

  /**
   * Esporta il PDF: uno solo (con l'elenco dei numeri spuntati) oppure
   * uno per ogni numero di fabbrica spuntato (validità estesa = UNICO).
   * La quota è gestita centralmente da useExportQuota (PDF + CSV dello stesso
   * ciclo = 1 sola esportazione).
   */
  const handleExportPdf = async (condensed: boolean) => {
    if (printMode !== 'multiplo') {
      const allowed = await consumeExport('pdf');
      if (!allowed) return;
    }

    const geometryImage = await captureGeometryImage(input);

    if (printMode !== 'multiplo') {
      await generateCalibrationPDF(result, lang, compilerInfo, condensed, reportNumber, geometryImage);
      return;
    }

    const primaryEntry = {
      numero: input.report.numeroFabbrica || '',
      tag: input.report.tagNumber || '',
      incluso: true,
    };
    const extendedEntries = getSelectedExtendedEntries(input.report);
    const lista = primaryEntry.numero
      ? [primaryEntry, ...extendedEntries.filter((e) => e.numero !== primaryEntry.numero)]
      : extendedEntries;

    // Base del numero di relazione senza suffisso: il progressivo riparte da 01 per ogni stampa multipla.
    const reportBase = reportNumber.replace(/-\d+$/, '');

    for (const [index, entry] of lista.entries()) {
      // Ogni PDF generato consuma una esportazione.
      const allowedSingle = await consumeExport('pdf');
      if (!allowedSingle) break;

      const reportNumberPerDoc = `${reportBase}-${String(index + 1).padStart(2, '0')}`;
      const singleResult = {
        ...result,
        input: {
          ...result.input,
          report: {
            ...result.input.report,
            numeroFabbrica: entry.numero,
            tagNumber: entry.tag || result.input.report.tagNumber,
          },
        },
      };
      await generateCalibrationPDF(singleResult, lang, compilerInfo, condensed, reportNumberPerDoc, geometryImage);
      await new Promise((r) => setTimeout(r, 400));
    }
  };

  /** Consuma la quota per un'esportazione CSV (gratuita se nello stesso ciclo del PDF). */
  const handleExportCsvGate = () => consumeExport('csv');



  const [formKey, setFormKey] = useState<number>(0);
  const [step, setStep] = useState<number>(1);
  const stepStripRef = useRef<HTMLDivElement>(null);

  const scrollStrip = (dir: number) => {
    const el = stepStripRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * Math.max(160, el.clientWidth * 0.6), behavior: 'smooth' });
  };

  // Keep the active step button horizontally centered in the carousel
  useEffect(() => {
    const el = stepStripRef.current;
    if (!el) return;
    const btn = el.querySelector<HTMLElement>(`[data-step="${step}"]`);
    if (!btn) return;
    el.scrollTo({ left: btn.offsetLeft - el.clientWidth / 2 + btn.offsetWidth / 2, behavior: 'smooth' });
  }, [step, lang]);


  useEffect(() => {
    const headerEl = headerRef.current;
    const cardEl = wizardCardRef.current;
    if (!headerEl || !cardEl) return;

    const measure = () => {
      setStickyOffset(headerEl.offsetHeight + cardEl.offsetHeight);
    };
    measure();

    const observer = new ResizeObserver(measure);
    observer.observe(headerEl);
    observer.observe(cardEl);
    return () => observer.disconnect();
  }, [step, lang]);
  const [appClosed, setAppClosed] = useState<boolean>(false);
  const TOTAL_STEPS = 7;
  const stepLabels: string[] = lang === 'en'
    ? ['Compiler & Logo', 'Tank Identification', 'Tank Geometry', 'Simulator & Charts', 'Volumes & Weights', 'Calibration Table', 'Save & Export']
    : lang === 'es'
    ? ['Datos Compilador & Logo', 'Identificación Tanque', 'Geometría del Tanque', 'Simulador y Gráficos', 'Volúmenes y Pesos', 'Tabla de Calibración', 'Guardar y Exportar']
    : lang === 'de'
    ? ['Ersteller & Logo', 'Tank-Identifikation', 'Tank-Geometrie', 'Simulator & Diagramme', 'Volumen & Gewichte', 'Kalibriertabelle', 'Speichern & Export']
    : ['Dati Compilatore & Logo', 'Dati Identificativi Serbatoio', 'Configurazione Geometrica', 'Simulatore & Grafici', 'Sintesi Volumi & Pesi', 'Tabella di Taratura', 'Salvataggio & Esportazione'];
  const [saveFeedback, setSaveFeedback] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [activeTankId, setActiveTankId] = useState<string | null>(null);

  // Perform full physics & strapping table integration
  const result: CalculationResult = useMemo(() => {
    return calculateTank(input);
  }, [input]);

  const reportNumber = useMemo(() => {
    const now = new Date();
    let yyyy = String(now.getFullYear());
    let mm = String(now.getMonth() + 1).padStart(2, '0');
    let dd = String(now.getDate()).padStart(2, '0');
    
    if (input.report.data) {
      const parts = input.report.data.split('-');
      if (parts.length === 3) {
        yyyy = parts[0];
        mm = parts[1].padStart(2, '0');
        dd = parts[2].padStart(2, '0');
      }
    }
    const hh = String(now.getHours()).padStart(2, '0');
    const min = String(now.getMinutes()).padStart(2, '0');
    return `${yyyy}${mm}${dd}${hh}${min}-01`;
  }, [input.report.data]);

  const formatDateToIT = (dateStr?: string) => {
    if (!dateStr) {
      const now = new Date();
      const dd = String(now.getDate()).padStart(2, '0');
      const mm = String(now.getMonth() + 1).padStart(2, '0');
      const yyyy = now.getFullYear();
      return `${dd}/${mm}/${yyyy}`;
    }
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return dateStr;
  };

  const getLocality = (address?: string) => {
    if (!address) return '';
    const parts = address.split(',');
    if (parts.length > 1) {
      return parts[parts.length - 1].trim();
    }
    return address.trim();
  };

  const handleLoadTank = (loadedInput: TankInput, loadedCompilerInfo?: CompilerInfo, tankId?: string) => {
    // Retrocompatibilità: i file salvati prima dell'introduzione di spVirola
    // ereditano lo spessore del fondo.
    const normalized: TankInput = {
      ...loadedInput,
      spVirola: loadedInput.spVirola && loadedInput.spVirola > 0 ? loadedInput.spVirola : loadedInput.fondo.sp,
    };
    setInput(normalized);
    if (loadedCompilerInfo) {
      handleSaveCompilerInfo(loadedCompilerInfo);
    }
    if (tankId) {
      setActiveTankId(tankId);
    }
    setFormKey(prev => prev + 1);
  };

  // Proposed save name, built with the standard naming logic
  const suggestedSaveName = useMemo(() => {
    const relNum = reportNumber || 'RELAZIONE';
    const commessa = input.report.commessa || input.report.riferimento || 'COMMESSA';
    const desc = (input.report.nomeSerbatoio || 'SERBATOIO').substring(0, 10);
    const numFabbrica = input.report.numeroFabbrica || 'NUMERO-FABBRICA';
    return `${relNum}-${commessa}-${desc}-${numFabbrica}`
      .replace(/[^a-zA-Z0-9.\-_]/g, '-')
      .replace(/-+/g, '-');
  }, [reportNumber, input.report.commessa, input.report.riferimento, input.report.nomeSerbatoio, input.report.numeroFabbrica]);

  const handleSaveAndDownload = () => {
    const safeFileName = suggestedSaveName;
    const downloadName = buildTankFileName(TANK_TYPE, safeFileName);



    // Create SavedTank data structure
    const newSaved = {
      id: newTankId(),
      name: safeFileName,
      date: formatTankDate(),
      input: JSON.parse(JSON.stringify(input)),
      compilerInfo: JSON.parse(JSON.stringify(compilerInfo)),
    };

    // Save to localStorage (chiave dedicata alla tipologia serbatoio)
    addTank(TANK_TYPE, newSaved as any, { replaceSameName: true });
    setActiveTankId(newSaved.id);

    // Download file
    try {
      downloadTankFile(
        downloadName,
        buildTankFile(TANK_TYPE, newSaved.name, input, compilerInfo)
      );

      setSaveFeedback({
        text: lang === 'en'
          ? `Configuration successfully saved in memory and downloaded as "${downloadName}.json"`
          : `Configurazione salvata con successo in memoria e scaricata come "${downloadName}.json"`,
        type: 'success'
      });
    } catch (err) {
      console.error(err);
      setSaveFeedback({
        text: lang === 'en'
          ? `Configuration saved in memory (file download failed)`
          : `Configurazione salvata in memoria (download automatico del file fallito)`,
        type: 'error'
      });
    }

    setTimeout(() => {
      setSaveFeedback(null);
    }, 6000);
  };

  const formatNum = (num: number, decimals: number = 2) => {
    if (num === undefined || isNaN(num)) return '0,00';
    return num.toLocaleString('it-IT', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
  };

  // Generate static tank SVG path data for the Print view
  const { printTankPathData, mapHToYPrint } = useMemo(() => {
    const dInt = result.input.dInt;
    const hTot = result.H_tot;
    const mapHToYPrint = (h: number) => {
      return 370 - (h / hTot) * 360;
    };
    const steps = 100;
    let leftPoints: string[] = [];
    let rightPoints: string[] = [];
    for (let i = 0; i <= steps; i++) {
      const hSample = Math.round((i / steps) * hTot);
      const y = mapHToYPrint(hSample);
      const rSample = result.raggioProfile[hSample] || 0;
      const rScale = dInt > 0 ? (rSample / (dInt / 2)) * 60 : 0;
      leftPoints.push(`${160 - rScale},${y}`);
      rightPoints.unshift(`${160 + rScale},${y}`);
    }
    const path = `M ${leftPoints.join(' L ')} L ${rightPoints.join(' L ')} Z`;
    return { printTankPathData: path, mapHToYPrint };
  }, [result]);

  if (appClosed) {
    return (
      <div className="min-h-dvh bg-[#ebf2ee] text-neutral-900 font-sans antialiased flex items-center justify-center p-6">
        <div className="bg-white border-4 border-double border-emerald-800 rounded-xl p-8 max-w-md w-full text-center space-y-4 shadow-xs">
          <h1 className="text-xl font-black uppercase text-emerald-950">CON-BOMB TARATURA</h1>
          <p className="text-sm font-semibold text-emerald-900">
            {lang === 'en' ? 'Application closed. You can safely close this browser tab.' :
             lang === 'es' ? 'Aplicación cerrada. Puede cerrar esta pestaña del navegador.' :
             lang === 'de' ? 'Anwendung geschlossen. Sie können diesen Browser-Tab schließen.' :
             'Applicazione chiusa. Puoi chiudere questa scheda del browser.'}
          </p>
          <button
            type="button"
            onClick={() => setAppClosed(false)}
            className="bg-emerald-900 hover:bg-emerald-950 text-white font-bold text-xs px-5 py-2.5 rounded-lg transition-all cursor-pointer shadow-md"
          >
            {lang === 'en' ? 'Reopen application' : lang === 'es' ? 'Reabrir aplicación' : lang === 'de' ? 'Anwendung erneut öffnen' : 'Riapri applicazione'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#ebf2ee] text-neutral-900 font-sans antialiased">
      {/* HEADER SECTION - Minimal & Sticky - Hidden on Print */}
      <header ref={headerRef} className="sticky top-0 z-30 bg-white border-b border-neutral-200 py-2 px-4 md:px-6 print:hidden">
        <div className="max-w-7xl mx-auto grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <div className="p-2 bg-emerald-900 text-white rounded-xl shadow-xs shrink-0">
              <Cylinder className="w-5 h-5 animate-pulse text-emerald-300" />
            </div>
            <h1 className="truncate text-base md:text-lg font-black tracking-tight text-emerald-950 uppercase">
              {t.appName}
            </h1>
          </div>

          {/* Header actions: PDF, Condensed PDF, Language, Info, Close */}
          <div className="flex items-center gap-1.5 flex-nowrap justify-end">
            <ExportCountBadge count={pdfExportsBadge} lang={lang}>
              <button
                type="button"
                disabled={exportsBlocked}
                onClick={() => handleExportPdf(false)}
                className="bg-emerald-800 hover:bg-emerald-900 text-white font-extrabold py-1.5 px-2.5 rounded-lg text-[11px] shadow-xs transition-all flex items-center gap-1.5 cursor-pointer border border-emerald-950 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Printer className="w-3.5 h-3.5 text-emerald-100" />
                {lang === 'en' ? 'Print PDF' : lang === 'es' ? 'Imprimir PDF' : lang === 'de' ? 'PDF Drucken' : 'Stampa PDF'}
              </button>
            </ExportCountBadge>
            <ExportCountBadge count={pdfExportsBadge} lang={lang}>
              <button
                type="button"
                disabled={exportsBlocked}
                onClick={() => handleExportPdf(true)}
                className="bg-teal-700 hover:bg-teal-800 text-white font-extrabold py-1.5 px-2.5 rounded-lg text-[11px] shadow-xs transition-all flex items-center gap-1.5 cursor-pointer border border-teal-900 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Printer className="w-3.5 h-3.5 text-teal-100" />
                {lang === 'en' ? 'Condensed PDF' : lang === 'es' ? 'PDF Condensado' : lang === 'de' ? 'Kompakt PDF' : 'PDF condensata'}
              </button>
            </ExportCountBadge>



            {/* Language Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsLangMenuOpen((v) => !v)}
                className="flex items-center gap-1.5 bg-neutral-100 hover:bg-neutral-200 border border-neutral-200 rounded-lg px-2.5 py-1.5 text-[11px] font-extrabold uppercase text-neutral-700 transition-all cursor-pointer"
                title="Seleziona Lingua / Select Language"
              >
                <Globe className="w-3.5 h-3.5" />
                <span>{langOptions.find((o) => o.code === lang)?.flag}</span>
                <span>{lang.toUpperCase()}</span>
                <ChevronDown className={`w-3 h-3 transition-transform ${isLangMenuOpen ? 'rotate-180' : ''}`} />
              </button>
              {isLangMenuOpen && (
                <div className="absolute right-0 mt-1 bg-white border border-neutral-200 rounded-lg shadow-md overflow-hidden z-40 min-w-[110px]">
                  {langOptions.map((item) => (
                    <button
                      key={item.code}
                      type="button"
                      onClick={() => { setLang(item.code); saveLanguage(item.code); setIsLangMenuOpen(false); }}
                      className={`w-full flex items-center gap-2 px-3 py-2 text-[11px] font-bold uppercase text-left transition-all cursor-pointer ${
                        lang === item.code ? 'bg-emerald-900 text-white' : 'text-neutral-700 hover:bg-neutral-100'
                      }`}
                    >
                      <span>{item.flag}</span>
                      <span>{item.code.toUpperCase()}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Information Button */}
            <button
              type="button"
              id="informazione"
              onClick={() => setIsInfoModalOpen(true)}
              className="bg-emerald-800 hover:bg-emerald-900 text-white py-1.5 px-2.5 rounded-lg border border-emerald-950 transition-all flex items-center justify-center gap-1.5 shadow-xs hover:scale-102 cursor-pointer font-bold text-[11px]"
              title={lang === 'en' ? 'Program Manual & Information' : 'Manuale e Informazioni'}
            >
              <Info className="w-3.5 h-3.5 text-emerald-200" />
              <span>Info</span>
            </button>

            {/* Close Application Button */}
            <button
              type="button"
              onClick={() => {
                if (typeof window === 'undefined') return;
                const msg = lang === 'en' ? 'Close the application?' : lang === 'es' ? '¿Cerrar la aplicación?' : lang === 'de' ? 'Anwendung schließen?' : 'Chiudere l\'applicazione?';
                if (!window.confirm(msg)) return;
                window.close();
                window.setTimeout(() => setAppClosed(true), 150);
              }}
              className="bg-red-600 hover:bg-red-700 text-white py-1.5 px-2.5 rounded-lg border border-red-800 transition-all flex items-center justify-center gap-1.5 shadow-xs hover:scale-102 cursor-pointer font-bold text-[11px]"
              title={lang === 'it' ? 'Chiudi applicazione' : lang === 'en' ? 'Close application' : lang === 'es' ? 'Cerrar aplicación' : 'Anwendung schließen'}
            >
              <X className="w-3.5 h-3.5 text-red-100" />
              <span>
                {lang === 'it' ? 'Chiudi' :
                 lang === 'en' ? 'Close' :
                 lang === 'es' ? 'Cerrar' :
                 'Schließen'}
              </span>
            </button>
          </div>
        </div>

        {showLastExportWarning && (
          <div className="max-w-7xl mx-auto mt-1.5 flex items-center gap-2 rounded-lg border border-amber-300 bg-amber-50 px-3 py-1.5 text-[11px] font-semibold text-amber-800">
            <Info className="w-3.5 h-3.5 shrink-0 text-amber-600" />
            {lang === 'en'
              ? 'This is the last PDF generation available for this licence.'
              : lang === 'es'
              ? 'Esta es la última generación de PDF disponible para esta licencia.'
              : lang === 'de'
              ? 'Dies ist die letzte verfügbare PDF-Generierung für diese Lizenz.'
              : "Questa è l'ultima generazione PDF disponibile per questa licenza."}
          </div>
        )}

        {/* STEP CAROUSEL - single scrollable row, active step auto-centered */}
        <div className="max-w-7xl mx-auto mt-1.5 flex items-center gap-1">
          <button
            type="button"
            onClick={() => scrollStrip(-1)}
            aria-label="Scorri a sinistra"
            className="shrink-0 w-6 h-7 grid place-items-center rounded-md bg-emerald-800 hover:bg-emerald-700 text-white cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <div
            ref={stepStripRef}
            className="flex-1 min-w-0 overflow-x-auto scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            <div className="flex gap-1.5 w-max px-1 py-0.5">
              {stepLabels.map((label, i) => (
                <button
                  key={label}
                  type="button"
                  data-step={i + 1}
                  onClick={() => setStep(i + 1)}
                  className={`whitespace-nowrap px-2.5 py-1.5 rounded-lg text-[10px] font-extrabold uppercase border transition-all cursor-pointer ${
                    step === i + 1
                      ? 'bg-emerald-800 text-white border-emerald-950 shadow-xs'
                      : 'bg-emerald-50 text-emerald-900 border-emerald-200 hover:bg-emerald-100'
                  }`}
                >
                  {i + 1}. {label}
                </button>
              ))}
            </div>
          </div>
          <button
            type="button"
            onClick={() => scrollStrip(1)}
            aria-label="Scorri a destra"
            className="shrink-0 w-6 h-7 grid place-items-center rounded-md bg-emerald-800 hover:bg-emerald-700 text-white cursor-pointer"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </header>


      {/* PRIMARY CONTAINER */}
      <main className="max-w-7xl mx-auto p-4 md:p-6 print:p-0">
        {/* WIZARD PROGRESS INDICATOR - Sticky navigation card */}
        <div
          ref={wizardCardRef}
          className="print:hidden mb-3 sticky z-20 bg-white border-4 border-double border-emerald-800 rounded-xl p-4 shadow-xs space-y-3"
          style={{ top: headerRef.current?.offsetHeight ?? 53 }}
        >
          {/* Previous Step Triangle - hidden on first step */}
          {step > 1 && (
            <button
              type="button"
              onClick={() => setStep(step - 1)}
              aria-label={lang === 'en' ? 'Previous step' : lang === 'es' ? 'Paso anterior' : lang === 'de' ? 'Vorheriger Schritt' : 'Passo precedente'}
              title={lang === 'en' ? 'Previous step' : lang === 'es' ? 'Paso anterior' : lang === 'de' ? 'Vorheriger Schritt' : 'Passo precedente'}
              className="hidden md:flex absolute left-0 top-1/2 -translate-y-1/2 -translate-x-[calc(100%+6px)] z-30 items-center justify-center w-7 h-10 bg-emerald-800 hover:bg-emerald-700 hover:scale-110 transition-all cursor-pointer shadow-md"
              style={{ clipPath: 'polygon(100% 0%, 100% 100%, 0% 50%)' }}
            />
          )}
          {/* Next Step Triangle - hidden on last step */}
          {step < TOTAL_STEPS && (
            <button
              type="button"
              onClick={() => setStep(step + 1)}
              aria-label={lang === 'en' ? 'Next step' : lang === 'es' ? 'Paso siguiente' : lang === 'de' ? 'Nächster Schritt' : 'Passo successivo'}
              title={lang === 'en' ? 'Next step' : lang === 'es' ? 'Paso siguiente' : lang === 'de' ? 'Nächster Schritt' : 'Passo successivo'}
              className="hidden md:flex absolute right-0 top-1/2 -translate-y-1/2 translate-x-[calc(100%+6px)] z-30 items-center justify-center w-7 h-10 bg-emerald-800 hover:bg-emerald-700 hover:scale-110 transition-all cursor-pointer shadow-md"
              style={{ clipPath: 'polygon(0% 0%, 0% 100%, 100% 50%)' }}
            />
          )}

          {/* Single Row: Title + Step badge */}
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <h2 className="text-sm font-black uppercase text-emerald-950 tracking-tight min-w-0 truncate">
              {step}. {stepLabels[step - 1]}
            </h2>
            <span className="text-[11px] font-extrabold text-emerald-800 bg-emerald-100 px-3 py-1 rounded-full uppercase shrink-0">
              {lang === 'en' ? `Step ${step} of ${TOTAL_STEPS}` :
               lang === 'es' ? `Paso ${step} de ${TOTAL_STEPS}` :
               lang === 'de' ? `Schritt ${step} von ${TOTAL_STEPS}` :
               `Passo ${step} di ${TOTAL_STEPS}`}
            </span>
          </div>

          <div className="h-2 w-full bg-emerald-100 rounded-full overflow-hidden">
            <div className="h-full bg-emerald-800 rounded-full transition-all duration-300" style={{ width: `${(step / TOTAL_STEPS) * 100}%` }} />
          </div>

        </div>

        <div className="space-y-6 print:block">

          {/* WIZARD STEP CONTENT - Hidden on Print */}
          <section className="space-y-4 print:hidden">
            {/* STEP 1 - Compiler Settings & Logo */}
            {step === 1 && (
            <div className="bg-white border-4 border-double border-emerald-800 rounded-xl p-4 shadow-sm flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-emerald-100 rounded-lg text-emerald-800">
                    {compilerInfo.logoType !== 'none' ? (
                      renderCompilerLogo(compilerInfo.logoType, "w-4 h-4")
                    ) : (
                      <Building2 className="w-4 h-4" />
                    )}
                  </div>
                  <div>
                    <h4 className="text-xs font-extrabold uppercase text-emerald-950 truncate max-w-[170px]">
                      {compilerInfo.ditta}
                    </h4>
                    <p className="text-[10px] text-neutral-600 font-semibold">P.IVA: {compilerInfo.partitaIva}</p>
                  </div>
                </div>
                <span className="text-[9px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full uppercase shrink-0">
                  {t.active}
                </span>
              </div>
              
              <Link
                to="/dati-comuni"
                className="w-full bg-emerald-800 hover:bg-emerald-900 text-white font-bold py-2 px-3 rounded-lg text-xs shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <PenTool className="w-3.5 h-3.5" />
                {t.compilerBtn}
              </Link>
              <p className="mt-1.5 text-[10px] text-emerald-800/80 font-semibold text-center">
                Dati comuni: si compilano una volta sola per tutti i moduli.
              </p>
            </div>
            )}

            {/* STEP 7 - Saved configurations management */}
            {step === 7 && (
            <SavedTanksList 
              tankType={TANK_TYPE}
              currentInput={input} 
              onLoadTank={handleLoadTank} 
              lang={lang} 
              activeTankId={activeTankId} 
              setActiveTankId={setActiveTankId} 
              suggestedName={suggestedSaveName}
              onSaveAndDownload={handleSaveAndDownload}
            />
            )}


            {/* STEP 2 - Dati Identificativi Serbatoio */}
            {step === 2 && (
            <div className="bg-white border-4 border-double border-emerald-800 rounded-xl p-4 shadow-xs space-y-3">
              <h4 className="text-xs font-black uppercase text-emerald-950 flex items-center gap-1.5 border-b border-emerald-100 pb-2">
                <FileText className="w-4 h-4 text-emerald-800" />
                {t.metaTitle}
              </h4>
              
              <div className="space-y-3 text-xs">
                {/* Descrizione / Titolo Disegno */}
                <div>
                  <label className="block text-[10px] font-extrabold uppercase text-neutral-800 mb-1">
                    {t.metaDesc}
                  </label>
                  <input
                    type="text"
                    value={input.report.nomeSerbatoio || ''}
                    onChange={(e) => setInput(prev => ({
                      ...prev,
                      report: { ...prev.report, nomeSerbatoio: e.target.value }
                    }))}
                    placeholder={t.metaDescPlaceholder}
                    className="w-full text-xs bg-emerald-50/20 border border-emerald-300 rounded-lg px-2.5 py-1.5 font-bold text-neutral-900 focus:outline-hidden focus:ring-1 focus:ring-emerald-800"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {/* Numero Disegno */}
                  <div>
                    <label className="block text-[10px] font-extrabold uppercase text-neutral-800 mb-1">
                      {t.metaDwg}
                    </label>
                    <input
                      type="text"
                      value={input.report.numeroDisegno || ''}
                      onChange={(e) => setInput(prev => ({
                        ...prev,
                        report: { ...prev.report, numeroDisegno: e.target.value }
                      }))}
                      placeholder={t.metaDwgPlaceholder}
                      className="w-full text-xs bg-emerald-50/20 border border-emerald-300 rounded-lg px-2.5 py-1.5 font-bold text-neutral-900 focus:outline-hidden focus:ring-1 focus:ring-emerald-800"
                    />
                  </div>
                  {/* Data */}
                  <div>
                    <label className="block text-[10px] font-extrabold uppercase text-neutral-800 mb-1">
                      {t.metaDate}
                    </label>
                    <input
                      type="date"
                      value={input.report.data || ''}
                      onChange={(e) => setInput(prev => ({
                        ...prev,
                        report: { ...prev.report, data: e.target.value }
                      }))}
                      className="w-full text-xs bg-emerald-50/20 border border-emerald-300 rounded-lg px-2.5 py-1.5 font-bold text-neutral-900 focus:outline-hidden focus:ring-1 focus:ring-emerald-800"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {/* Nome Compilatore */}
                  <div>
                    <label className="block text-[10px] font-extrabold uppercase text-neutral-800 mb-1">
                      {t.metaCompiler}
                    </label>
                    <input
                      type="text"
                      value={input.report.compilatore || ''}
                      onChange={(e) => setInput(prev => ({
                        ...prev,
                        report: { ...prev.report, compilatore: e.target.value }
                      }))}
                      placeholder={t.metaCompilerPlaceholder}
                      className="w-full text-xs bg-emerald-50/20 border border-emerald-300 rounded-lg px-2.5 py-1.5 font-bold text-neutral-900 focus:outline-hidden focus:ring-1 focus:ring-emerald-800"
                    />
                  </div>
                  {/* Commessa */}
                  <div>
                    <label className="block text-[10px] font-extrabold uppercase text-neutral-800 mb-1">
                      {t.metaCommessa}
                    </label>
                    <input
                      type="text"
                      value={input.report.commessa || ''}
                      onChange={(e) => setInput(prev => ({
                        ...prev,
                        report: { ...prev.report, commessa: e.target.value }
                      }))}
                      placeholder={t.metaCommessaPlaceholder}
                      className="w-full text-xs bg-emerald-50/20 border border-emerald-300 rounded-lg px-2.5 py-1.5 font-bold text-neutral-900 focus:outline-hidden focus:ring-1 focus:ring-emerald-800"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {/* Numero di Fabbrica */}
                  <div>
                    <label className="block text-[10px] font-extrabold uppercase text-neutral-800 mb-1">
                      {t.metaFabbrica}
                    </label>
                    <input
                      type="text"
                      value={input.report.numeroFabbrica || ''}
                      onChange={(e) => setInput(prev => ({
                        ...prev,
                        report: { ...prev.report, numeroFabbrica: e.target.value }
                      }))}
                      placeholder={t.metaFabbricaPlaceholder}
                      className="w-full text-xs bg-emerald-50/20 border border-emerald-300 rounded-lg px-2.5 py-1.5 font-bold text-neutral-900 focus:outline-hidden focus:ring-1 focus:ring-emerald-800"
                    />
                  </div>
                  {/* Tag Number */}
                  <div>
                    <label className="block text-[10px] font-extrabold uppercase text-neutral-800 mb-1">
                      {t.metaTag}
                    </label>
                    <input
                      type="text"
                      value={input.report.tagNumber || ''}
                      onChange={(e) => setInput(prev => ({
                        ...prev,
                        report: { ...prev.report, tagNumber: e.target.value }
                      }))}
                      placeholder={t.metaTagPlaceholder}
                      className="w-full text-xs bg-emerald-50/20 border border-emerald-300 rounded-lg px-2.5 py-1.5 font-bold text-neutral-900 focus:outline-hidden focus:ring-1 focus:ring-emerald-800"
                    />
                  </div>
                </div>

                {/* Cliente */}
                <div>
                  <label className="block text-[10px] font-extrabold uppercase text-neutral-800 mb-1">
                    {t.metaCliente}
                  </label>
                  <input
                    type="text"
                    value={input.report.cliente || ''}
                    onChange={(e) => setInput(prev => ({
                      ...prev,
                      report: { ...prev.report, cliente: e.target.value }
                    }))}
                    placeholder={t.metaClientePlaceholder}
                    className="w-full text-xs bg-emerald-50/20 border border-emerald-300 rounded-lg px-2.5 py-1.5 font-bold text-neutral-900 focus:outline-hidden focus:ring-1 focus:ring-emerald-800"
                  />
                </div>

                {/* Validità estesa ai seguenti numeri di fabbrica */}
                <div>
                  <label className="block text-[10px] font-extrabold uppercase text-neutral-800 mb-1">
                    {t.metaExtended}
                  </label>

                  <div className="rounded-lg border border-emerald-300 bg-emerald-50/20 p-2 space-y-2">
                    {/* Elenco numeri */}
                    {extendedNumbers.length === 0 ? (
                      <p className="text-[11px] font-semibold text-neutral-500">
                        Nessun numero di fabbrica aggiuntivo.
                      </p>
                    ) : (
                      <ul className="space-y-1">
                        {extendedNumbers.map((n, idx) => (
                          <li key={idx} className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={n.incluso}
                              onChange={() => toggleExtendedNumber(idx)}
                              className="h-3.5 w-3.5 accent-emerald-700 cursor-pointer"
                            />
                            <input
                              type="text"
                              value={n.numero}
                              onChange={(e) => updateExtendedEntry(idx, { numero: e.target.value })}
                              placeholder="N. fabbrica"
                              className="flex-1 min-w-0 text-xs bg-white border border-emerald-300 rounded-lg px-2 py-1 font-bold text-neutral-900 focus:outline-hidden focus:ring-1 focus:ring-emerald-800"
                            />
                            <input
                              type="text"
                              value={n.tag || ''}
                              onChange={(e) => updateExtendedEntry(idx, { tag: e.target.value })}
                              placeholder="Tag number"
                              className="flex-1 min-w-0 text-xs bg-white border border-emerald-300 rounded-lg px-2 py-1 font-bold text-neutral-900 focus:outline-hidden focus:ring-1 focus:ring-emerald-800"
                            />
                            <button
                              type="button"
                              onClick={() => removeExtendedNumber(idx)}
                              className="text-[10px] font-extrabold uppercase text-rose-700 hover:text-rose-900 cursor-pointer"
                            >
                              Elimina
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}

                    {/* Aggiunta nuovo numero */}
                    <div className="flex flex-wrap items-center gap-2">
                      <input
                        type="text"
                        value={newExtendedNumber}
                        onChange={(e) => setNewExtendedNumber(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            addExtendedNumber();
                          }
                        }}
                        placeholder={t.metaExtendedPlaceholder}
                        className="flex-1 min-w-0 text-xs bg-white border border-emerald-300 rounded-lg px-2.5 py-1.5 font-bold text-neutral-900 focus:outline-hidden focus:ring-1 focus:ring-emerald-800"
                      />
                      <input
                        type="text"
                        value={newExtendedTag}
                        onChange={(e) => setNewExtendedTag(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            addExtendedNumber();
                          }
                        }}
                        placeholder="Tag number"
                        className="flex-1 min-w-0 text-xs bg-white border border-emerald-300 rounded-lg px-2.5 py-1.5 font-bold text-neutral-900 focus:outline-hidden focus:ring-1 focus:ring-emerald-800"
                      />
                      <button
                        type="button"
                        onClick={addExtendedNumber}
                        className="bg-emerald-800 hover:bg-emerald-900 text-white text-[10px] font-extrabold uppercase px-2.5 py-1.5 rounded-lg cursor-pointer"
                      >
                        Aggiungi
                      </button>
                    </div>

                    {/* Modalità di stampa */}
                    <div className="pt-1 border-t border-emerald-200 space-y-1">
                      <span className="block text-[10px] font-extrabold uppercase text-neutral-800">
                        Modalità di stampa PDF
                      </span>
                      <label className="flex items-center gap-2 text-[11px] font-bold text-neutral-800 cursor-pointer">
                        <input
                          type="radio"
                          className="accent-emerald-700"
                          checked={printMode === 'unico'}
                          onChange={() => setPrintMode('unico')}
                        />
                        PDF unico con tutti i numeri di fabbrica
                      </label>
                      <label className="flex items-center gap-2 text-[11px] font-bold text-neutral-800 cursor-pointer">
                        <input
                          type="radio"
                          className="accent-emerald-700"
                          checked={printMode === 'multiplo'}
                          onChange={() => setPrintMode('multiplo')}
                        />
                        Un PDF per ogni numero di fabbrica (validità estesa: UNICO)
                      </label>
                    </div>
                  </div>
                </div>

              </div>
            </div>
            )}

            {/* STEP 3 - Configurazione geometrica */}
            {step === 3 && (
              <GeometrySchema key={formKey} input={input} onChange={setInput} />
            )}
          </section>

          {/* RESULTS VIEWPORT */}
          <section className="space-y-6 print:w-full">
            

            {/* STEP 7 - Save feedback */}
            {step === 7 && saveFeedback && (
              <div className={`print:hidden p-4 rounded-xl border text-xs font-black text-center shadow-xs transition-all animate-fade-in ${
                saveFeedback.type === 'success'
                  ? 'bg-emerald-50 text-emerald-900 border-emerald-300'
                  : 'bg-rose-50 text-rose-900 border-rose-300'
              }`}>
                {saveFeedback.text}
              </div>
            )}


            {/* STEP OUTPUTS */}
            <div className="print:block">
              {step === 4 && (
                <div className="print:hidden">
                  <ResultsDashboard result={result} lang={lang} section="simulator" />
                </div>
              )}
              {step === 5 && (
                <div className="print:hidden">
                  <ResultsDashboard result={result} lang={lang} section="summary" />
                </div>
              )}
              {step === 6 && (
                <div className="print:hidden">
                  <CalibrationTable result={result} lang={lang} compilerInfo={compilerInfo} onExportPdf={handleExportPdf} onExportCsvGate={handleExportCsvGate} exportsBlocked={exportsBlocked} exportsRemaining={pdfExportsBadge} />
                </div>
              )}
            </div>




            {/* Informational Guidelines Footer - Hidden on Print */}
            <footer className="p-4 bg-white border-4 border-double border-emerald-800 rounded-xl flex gap-3 text-xs text-neutral-500 print:hidden shadow-xs">
              <Info className="w-4 h-4 text-neutral-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-neutral-800 block">
                  {lang === 'en' ? 'Calculation Notes (Strapping)' :
                   lang === 'es' ? 'Notas de cálculo (Strapping)' :
                   lang === 'de' ? 'Berechnungshinweise (Strapping)' :
                   'Note di calcolo (Strapping)'}
                </span>
                <p className="mt-0.5 leading-relaxed">
                  {lang === 'en' ? 'The total height of the tank is determined by dynamically summing the caps, toroidal knuckles, cylindrical collars, and the central shell. Cumulative volume calibration considers sheet thicknesses and calculates inner radii for each millimetric level to maximize industrial precision.' :
                   lang === 'es' ? 'La altura total del tanque se determina sumando dinámicamente los casquetes, los raccordi toroidales, los collares cilíndricos y el cuerpo central. La calibración del volumen acumulado considera el espesor de la chapa y calcula los radios internos para cada nivel milimétrico para maximizar la precisión industrial.' :
                   lang === 'de' ? 'Die Gesamthöhe des Tanks wird durch dynamische Summierung der Kappen, Krempen, zylindrischen Hälse und des zentralen Mantels bestimmt. Die Kalibrierung des kumulierten Volumens berücksichtigt die Blechdicken und berechnet die Innenradien für jede Millimeterstufe, um die industrielle Präzision zu maximieren.' :
                   "L'altezza totale del serbatoio viene determinata sommando dinamicamente le calotte, i raccordi toroidali, i colletti cilindrici e il mantello centrale. La taratura del volume cumulativo considera lo spessore delle lamiere e calcola i raggi interni per ciascun livello millimetrico per massimizzare la precisione industriale."}
                </p>
              </div>
            </footer>
          </section>

        </div>
      </main>

      {/* PRINT-ONLY INDUSTRIAL REPORT SHEET */}
      <div className="hidden print:block p-4 text-neutral-900 bg-white">
        
        {/* ================= PAGE 1: CERTIFICATE HEADER, SVG SCHEMATIC, AND TECHNICAL SPECS ================= */}
        <div className="border-2 border-neutral-950 p-6 rounded-xl space-y-6 bg-white min-h-[270mm] flex flex-col justify-between" style={{ pageBreakAfter: 'always', breakAfter: 'page' }}>
          <div className="space-y-4">
            {/* Official Stamp Header with Compiler details */}
            <div className="flex justify-between items-start border-b-2 border-neutral-950 pb-4">
              <div className="flex items-center gap-4">
                <div>
                  <h1 className="text-xl font-black uppercase tracking-tight">{compilerInfo.ditta}</h1>
                  <p className="text-xs text-neutral-800 font-extrabold uppercase">
                    {lang === 'en' ? "CALIBRATION CERTIFICATE & TECHNICAL TESTING" :
                     lang === 'es' ? "CERTIFICADO DE CALIBRACIÓN Y PRUEBA TÉCNICA" :
                     lang === 'de' ? "KALIBRIERZERTIFIKAT & TECHNISCHER PRÜFBERICHT" :
                     "CERTIFICATO DI TARATURA E COLLAUDO TECNICO"}
                  </p>
                  <div className="text-[10px] text-neutral-700 mt-1 space-y-0.5">
                    <div>
                      <strong>{lang === 'en' ? 'VAT ID' : lang === 'es' ? 'CIF / IVA' : lang === 'de' ? 'USt-IdNr.' : 'Partita IVA'}:</strong> {compilerInfo.partitaIva} • <strong>{lang === 'en' ? 'Tel' : lang === 'es' ? 'Tel' : lang === 'de' ? 'Tel' : 'Tel'}:</strong> {compilerInfo.telefono}
                    </div>
                    <div>
                      <strong>Email:</strong> {compilerInfo.email}
                      {compilerInfo.emailPec && <> • <strong>PEC:</strong> {compilerInfo.emailPec}</>}
                      {compilerInfo.iscrizioneRegistro && <> • <strong>{lang === 'en' ? 'Reg.' : lang === 'es' ? 'Reg.' : lang === 'de' ? 'Reg.' : 'Iscrizione'}:</strong> {compilerInfo.iscrizioneRegistro}</>}
                    </div>
                    <div><strong>{lang === 'en' ? 'Address' : lang === 'es' ? 'Dirección' : lang === 'de' ? 'Adresse' : 'Sede'}:</strong> {compilerInfo.indirizzo}</div>
                    {compilerInfo.customNote && <div className="text-[9px] text-neutral-500 italic">{compilerInfo.customNote}</div>}
                  </div>
                </div>
              </div>
              <div className="text-right border-l-2 border-neutral-950 pl-6 font-mono text-xs space-y-1 shrink-0">
                <div><strong>{lang === 'en' ? 'REPORT DATE' : lang === 'es' ? 'FECHA REPORTE' : lang === 'de' ? 'BERICHTSDATUM' : 'DATA REPORT'}:</strong> {result.input.report.data || '-'}</div>
                <div><strong>{lang === 'en' ? 'REPORT' : lang === 'es' ? 'RELACIÓN' : lang === 'de' ? 'BERICHT' : 'RELAZIONE'}:</strong> {reportNumber}</div>
              </div>
            </div>

            {/* Report Metadata */}
            <div className="grid grid-cols-3 gap-x-6 gap-y-2 text-xs bg-neutral-50 p-3.5 rounded-lg border border-neutral-250">
              <div className="space-y-1.5">
                <div><strong>{t.metaCliente.split('/')[0].trim().toUpperCase()}:</strong> <span className="font-semibold">{result.input.report.cliente || '-'}</span></div>
                <div><strong>{t.metaCommessa.toUpperCase()}:</strong> <span className="font-semibold">{result.input.report.commessa || result.input.report.riferimento || '-'}</span></div>
              </div>
              <div className="space-y-1.5">
                <div><strong>{lang === 'en' ? 'DESCRIPTION' : lang === 'es' ? 'DESCRIPCIÓN' : lang === 'de' ? 'BESCHREIBUNG' : 'DESCRIZIONE'}:</strong> <span className="font-semibold">{result.input.report.nomeSerbatoio || '-'}</span></div>
                <div><strong>{t.metaDwg.toUpperCase()}:</strong> <span className="font-semibold">{result.input.report.numeroDisegno || '-'}</span></div>
              </div>
              <div className="space-y-1.5">
                <div><strong>{t.metaFabbrica.toUpperCase()}:</strong> <span className="font-semibold">{result.input.report.numeroFabbrica || '-'}</span></div>
                <div><strong>{t.metaTag.toUpperCase()}:</strong> <span className="font-semibold">{result.input.report.tagNumber || '-'}</span></div>
                {getExtendedValidityText(result.input.report) && (
                  <div className="text-[10px] leading-tight">
                    <strong>{lang === 'en' ? 'EXTENDED TO S/N' : lang === 'es' ? 'EXTENDIDO A FABR.' : lang === 'de' ? 'ERWEITERT AUF FABR.' : 'ESTESO A FABBR.'}:</strong> <span className="font-semibold text-neutral-700">{getExtendedValidityText(result.input.report)}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Middle Section: 2-Column layout with Tank Silhouette on the Left and specs on the Right */}
            <div className="grid grid-cols-12 gap-6 pt-2">
              
              {/* Left Column: Tank Shape & Zonizzazione */}
              <div className="col-span-5 flex flex-col items-center p-3 border border-neutral-300 rounded-xl bg-neutral-50/40">
                <h3 className="text-[10px] font-black uppercase text-[#3a471c] mb-2 tracking-wide border-b border-neutral-200 pb-1 w-full text-center">
                  1. {t.interactivePlot}
                </h3>
                
                <svg viewBox="0 0 320 400" className="w-full max-w-[210px] h-[280px] select-none">
                  <defs>
                    <linearGradient id="tankPrintGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#f3f4f6" />
                      <stop offset="50%" stopColor="#ffffff" />
                      <stop offset="100%" stopColor="#e5e7eb" />
                    </linearGradient>
                  </defs>

                  {/* Height grids */}
                  <line x1="80" y1="370" x2="240" y2="370" stroke="#a3a3a3" strokeWidth="0.75" strokeDasharray="2,2" />
                  <text x="85" y="380" className="font-mono text-[8px] font-bold fill-black">0 mm ({lang === 'en' ? 'Bottom' : lang === 'es' ? 'Fondo' : lang === 'de' ? 'Boden' : 'Fondo'})</text>
                  <line x1="80" y1="10" x2="240" y2="10" stroke="#a3a3a3" strokeWidth="0.75" strokeDasharray="2,2" />
                  <text x="85" y="8" className="font-mono text-[8px] font-bold fill-black">{result.H_tot} mm ({lang === 'en' ? 'Cover' : lang === 'es' ? 'Tapa' : lang === 'de' ? 'Deckel' : 'Coperchio'})</text>

                  {/* Profile shape */}
                  <path
                    d={printTankPathData}
                    fill="url(#tankPrintGrad)"
                    stroke="#4b5563"
                    strokeWidth="1.2"
                  />

                  {/* Separators with thin double lines in shiny olive green */}
                  {[
                    { label: 'Z1/Z2', val: result.z1 },
                    { label: 'Z2/Z3', val: result.z2 },
                    { label: 'Z3/Z4', val: result.z3 },
                    { label: 'Z4/Z5', val: result.z4 },
                    { label: 'Z5/Z6', val: result.z5 },
                    { label: 'Z6/Z7', val: result.z6 },
                  ].map((zone, idx) => {
                    const y = mapHToYPrint(zone.val);
                    const isRight = idx === 5 || idx === 3 || idx === 2 || idx === 0;
                    const textX = isRight ? 245 : 75;
                    const textAnchor = isRight ? "start" : "end";
                    return (
                      <g key={idx}>
                        <line
                          x1="80"
                          y1={y - 1}
                          x2="240"
                          y2={y - 1}
                          stroke="#708238"
                          strokeWidth="0.7"
                          opacity="0.95"
                        />
                        <line
                          x1="80"
                          y1={y + 1}
                          x2="240"
                          y2={y + 1}
                          stroke="#708238"
                          strokeWidth="0.7"
                          opacity="0.95"
                        />
                        <text
                          x={textX}
                          y={y + 2.5}
                          textAnchor={textAnchor}
                          className="font-mono text-[8.5px] font-black fill-black"
                        >
                          {zone.label}
                        </text>
                      </g>
                    );
                  })}

                  {/* Progressive numbers inside the 7 zones */}
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
                    const yCenter = mapHToYPrint(midH);
                    if (zone.max - zone.min <= 0) return null;
                    return (
                      <g key={zone.num}>
                        <circle
                          cx="160"
                          cy={yCenter}
                          r="5.5"
                          fill="#fbfdf7"
                          stroke="#708238"
                          strokeWidth="0.9"
                        />
                        <text
                          x="160"
                          y={yCenter + 2}
                          textAnchor="middle"
                          className="font-sans text-[6.5px] font-black fill-[#3a471c]"
                        >
                          {zone.num}
                        </text>
                      </g>
                    );
                  })}
                </svg>

                {/* Legend for the 7 zones */}
                <div className="w-full text-[7.5px] font-mono text-neutral-600 mt-2 space-y-0.5 border-t border-neutral-200 pt-1.5 leading-tight">
                  <div><strong>Zone 1:</strong> {lang === 'en' ? 'Bottom dome (spherical)' : lang === 'es' ? 'Cúpula fondo (esférica)' : lang === 'de' ? 'Bodenkuppel (sphärisch)' : 'Calotta Fondo sferica'}</div>
                  <div><strong>Zone 2:</strong> {lang === 'en' ? 'Bottom knuckle (toroidal)' : lang === 'es' ? 'Raccordo fondo (toroidal)' : lang === 'de' ? 'Bodenkrempe (toroidal)' : 'Raccordo toroidale Fondo'}</div>
                  <div><strong>Zone 3:</strong> {lang === 'en' ? 'Bottom straight flange' : lang === 'es' ? 'Cuello fondo (cilíndrico)' : lang === 'de' ? 'Bodenbord (zylindrisch)' : 'Colletto cilindrico Fondo'}</div>
                  <div><strong>Zone 4:</strong> {lang === 'en' ? 'Cylindrical shell' : lang === 'es' ? 'Cuerpo cilíndrico' : lang === 'de' ? 'Zylindrischer Mantel' : 'Mantello cilindrico Centrale'}</div>
                  <div><strong>Zone 5:</strong> {lang === 'en' ? 'Top straight flange' : lang === 'es' ? 'Cuello tapa (cilíndrico)' : lang === 'de' ? 'Deckelbord (zylindrisch)' : 'Colletto cilindrico Coperchio'}</div>
                  <div><strong>Zone 6:</strong> {lang === 'en' ? 'Top knuckle (toroidal)' : lang === 'es' ? 'Raccordo tapa (toroidal)' : lang === 'de' ? 'Deckelkrempe (toroidal)' : 'Raccordo toroidale Coperchio'}</div>
                  <div><strong>Zone 7:</strong> {lang === 'en' ? 'Top dome (spherical)' : lang === 'es' ? 'Cúpula tapa (esférica)' : lang === 'de' ? 'Deckelkuppel (sphärisch)' : 'Calotta Coperchio sferica'}</div>
                </div>
              </div>

              {/* Right Column: Numeric data and weight calculations */}
              <div className="col-span-7 flex flex-col justify-between space-y-4">
                
                {/* Technical Specs */}
                <div className="space-y-1.5">
                  <h3 className="text-[10px] font-black uppercase text-neutral-950 border-b border-neutral-950 pb-0.5 tracking-wide">
                    2. {t.dashTitle}
                  </h3>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[10px] font-mono">
                    <div className="flex justify-between border-b border-neutral-100 py-0.5">
                      <span className="text-neutral-500">{t.dInt}:</span>
                      <span className="font-bold">{result.input.dInt} mm</span>
                    </div>
                    <div className="flex justify-between border-b border-neutral-100 py-0.5">
                      <span className="text-neutral-500">{t.fondoCapacity}:</span>
                      <span className="font-bold text-emerald-800">{formatNum(result.volumeFondo, 1)} l</span>
                    </div>
                    <div className="flex justify-between border-b border-neutral-100 py-0.5">
                      <span className="text-neutral-500">{t.lCil}:</span>
                      <span className="font-bold">{result.input.lCil} mm</span>
                    </div>
                    <div className="flex justify-between border-b border-neutral-100 py-0.5">
                      <span className="text-neutral-500">{t.cylinderCapacity}:</span>
                      <span className="font-bold text-emerald-800">{formatNum(result.volumeCilindro, 1)} l</span>
                    </div>
                    <div className="flex justify-between border-b border-neutral-100 py-0.5">
                      <span className="text-neutral-500">{t.totalHeight}:</span>
                      <span className="font-bold">{result.H_tot} mm</span>
                    </div>
                    <div className="flex justify-between border-b border-neutral-100 py-0.5">
                      <span className="text-neutral-500">{t.coperchioCapacity}:</span>
                      <span className="font-bold text-emerald-800">{formatNum(result.volumeCoperchio, 1)} l</span>
                    </div>
                    <div className="flex justify-between border-b border-neutral-100 py-0.5">
                      <span className="text-neutral-500">{t.rho}:</span>
                      <span className="font-bold">{formatNum(result.input.rho, 3)} kg/dm³</span>
                    </div>
                    <div className="flex justify-between font-black text-neutral-950 border-t border-dashed border-neutral-450 pt-1 col-span-2 text-xs">
                      <span>{t.totalCapacity.toUpperCase()}:</span>
                      <span className="text-emerald-900">{formatNum(result.volumeTotale, 1)} litri ({formatNum(result.volumeTotale / 1000, 3)} m³)</span>
                    </div>
                  </div>
                </div>

                {/* Sheet Metal development info */}
                <div className="space-y-1.5">
                  <h3 className="text-[10px] font-black uppercase text-neutral-950 border-b border-neutral-950 pb-0.5 tracking-wide">
                    3. {lang === 'en' ? 'SHEET METAL DEVELOPMENT & ESTIMATED WEIGHTS (Steel 7.85 kg/dm³)' :
                        lang === 'es' ? 'DESARROLLO DE CORTE Y PESOS DE CHAPA (Acero 7.85 kg/dm³)' :
                        lang === 'de' ? 'ZUSCHNITT & BLECHGEWICHTE (Stahl 7.85 kg/dm³)' :
                        'SVILUPPO TAGLIO & PESI LAMIERA (Acciaio 7.85 kg/dm³)'}
                  </h3>
                  <div className="grid grid-cols-2 gap-4 text-[9.5px] font-mono">
                    <div className="bg-neutral-50 p-2.5 rounded-lg border border-neutral-200 space-y-1">
                      <div className="font-black text-emerald-950 uppercase border-b border-neutral-200 pb-0.5">{t.inferiorHead}</div>
                      <div className="flex justify-between">
                        <span>{t.plateThickness}:</span>
                        <span className="font-bold">{result.input.fondo.sp} mm</span>
                      </div>
                      <div className="flex justify-between">
                        <span>{lang === 'en' ? 'Cutting Diam.:' : lang === 'es' ? 'Diám. Corte:' : lang === 'de' ? 'Zuschnitt-DM:' : 'Diametro Taglio:'}</span>
                        <span className="font-bold">{formatNum(result.fondo.Sviluppo_mm, 1)} mm</span>
                      </div>
                      <div className="flex justify-between">
                        <span>{lang === 'en' ? 'Est. Weight:' : lang === 'es' ? 'Peso Est.:' : lang === 'de' ? 'Gewicht ca.:' : 'Peso Stimato:'}</span>
                        <span className="font-bold">{formatNum(result.pesoLamieraFondo, 1)} kg</span>
                      </div>
                      <div className="flex justify-between border-t border-neutral-200 pt-1 mt-1 text-[8.5px]">
                        <span>
                          {lang === 'en' ? 'Dish Radius (R):' :
                           lang === 'es' ? 'Radio bombado (R):' :
                           lang === 'de' ? 'Wölbungsradius (R):' :
                           'Raggio bombatura (R):'}
                        </span>
                        <span className="font-bold">{formatNum(result.fondo.R, 1)} mm</span>
                      </div>
                      <div className="flex justify-between text-[8.5px]">
                        <span>
                          {lang === 'en' ? 'Knuckle Radius (r):' :
                           lang === 'es' ? 'Radio raccordo (r):' :
                           lang === 'de' ? 'Krempenradius (r):' :
                           'Raggio di raccordo (r):'}
                        </span>
                        <span className="font-bold">{formatNum(result.fondo.r, 1)} mm</span>
                      </div>
                      <div className="flex justify-between text-[8.5px]">
                        <span>
                          {lang === 'en' ? 'Straight Flange (h1):' :
                           lang === 'es' ? 'Altura cuello (h1):' :
                           lang === 'de' ? 'Bordhöhe (h1):' :
                           'Altezza del colletto (h1):'}
                        </span>
                        <span className="font-bold">{result.input.fondo.hColletto} mm</span>
                      </div>
                    </div>

                    <div className="bg-neutral-50 p-2.5 rounded-lg border border-neutral-200 space-y-1">
                      <div className="font-black text-emerald-950 uppercase border-b border-neutral-200 pb-0.5">{t.superiorHead}</div>
                      <div className="flex justify-between">
                        <span>{t.plateThickness}:</span>
                        <span className="font-bold">{result.input.coperchio.sp} mm</span>
                      </div>
                      <div className="flex justify-between">
                        <span>{lang === 'en' ? 'Cutting Diam.:' : lang === 'es' ? 'Diám. Corte:' : lang === 'de' ? 'Zuschnitt-DM:' : 'Diametro Taglio:'}</span>
                        <span className="font-bold">{formatNum(result.coperchio.Sviluppo_mm, 1)} mm</span>
                      </div>
                      <div className="flex justify-between">
                        <span>{lang === 'en' ? 'Est. Weight:' : lang === 'es' ? 'Peso Est.:' : lang === 'de' ? 'Gewicht ca.:' : 'Peso Stimato:'}</span>
                        <span className="font-bold">{formatNum(result.pesoLamieraCoperchio, 1)} kg</span>
                      </div>
                      <div className="flex justify-between border-t border-neutral-200 pt-1 mt-1 text-[8.5px]">
                        <span>
                          {lang === 'en' ? 'Dish Radius (R):' :
                           lang === 'es' ? 'Radio bombado (R):' :
                           lang === 'de' ? 'Wölbungsradius (R):' :
                           'Raggio bombatura (R):'}
                        </span>
                        <span className="font-bold">{formatNum(result.coperchio.R, 1)} mm</span>
                      </div>
                      <div className="flex justify-between text-[8.5px]">
                        <span>
                          {lang === 'en' ? 'Knuckle Radius (r):' :
                           lang === 'es' ? 'Radio raccordo (r):' :
                           lang === 'de' ? 'Krempenradius (r):' :
                           'Raggio di raccordo (r):'}
                        </span>
                        <span className="font-bold">{formatNum(result.coperchio.r, 1)} mm</span>
                      </div>
                      <div className="flex justify-between text-[8.5px]">
                        <span>
                          {lang === 'en' ? 'Straight Flange (h1):' :
                           lang === 'es' ? 'Altura cuello (h1):' :
                           lang === 'de' ? 'Bordhöhe (h1):' :
                           'Altezza del colletto (h1):'}
                        </span>
                        <span className="font-bold">{result.input.coperchio.hColletto} mm</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Content Density info */}
                <div className="bg-neutral-950 text-white border border-neutral-900 rounded-xl p-3 flex justify-between gap-4">
                  <div>
                    <span className="text-[8px] font-black text-neutral-300 uppercase tracking-wider block">
                      {lang === 'en' ? 'Full Load Weight' : lang === 'es' ? 'Peso con Carga Máxima' : lang === 'de' ? 'Gewicht bei Vollfüllung' : 'Peso Contenuto a Pieno'}
                    </span>
                    <div className="text-sm font-black text-white mt-0.5">
                      {formatNum(result.pesoContenutoTotale, 1)} kg
                      <span className="text-[10px] font-bold text-neutral-400 ml-1.5">({formatNum(result.pesoContenutoTotale / 1000, 3)} t)</span>
                    </div>
                  </div>
                  <div className="border-l border-neutral-800 pl-4 text-right">
                    <span className="text-[8px] font-black text-neutral-300 uppercase tracking-wider block">
                      {lang === 'en' ? 'Shell Weight Linearity' : lang === 'es' ? 'Linealidad Peso Cuerpo' : lang === 'de' ? 'Gewichtslinearität Mantel' : 'Linearità Peso Mantello'}
                    </span>
                    <div className="text-sm font-black text-emerald-400 mt-0.5">
                      {formatNum(result.pesoContenutoPerCmCilindro, 1)} kg/cm
                    </div>
                  </div>
                </div>

              </div>

            </div>
          </div>

          {/* Signatures block at the bottom of Page 1 */}
          <div className="pt-6 border-t border-neutral-200 flex justify-between items-start text-[10px] font-mono">
            <div className="text-center w-56 border-t border-neutral-950 pt-2 space-y-1">
              <strong>
                {lang === 'en' ? 'Compiler Signature' :
                 lang === 'es' ? 'Firma del Compilatore' :
                 lang === 'de' ? 'Unterschrift des Erstellers' :
                 "Firma del Compilatore"}
              </strong>
              <div className="text-[10px] font-black text-neutral-950 uppercase tracking-tight">
                {result.input.report.compilatore || '-'}
              </div>
              <div className="text-[8.5px] text-neutral-500 italic leading-none">
                ({compilerInfo.ditta})
              </div>
            </div>

            <div className="text-center flex flex-col items-center justify-center px-4 max-w-[180px]">
              {compilerInfo.logoType !== 'none' && (
                <div className="p-1.5 bg-neutral-950 text-white rounded-lg shrink-0 mb-1.5">
                  {renderCompilerLogo(compilerInfo.logoType, "w-6 h-6")}
                </div>
              )}
              <strong className="text-neutral-500 text-[8px] tracking-wider uppercase">
                {lang === 'en' ? 'PLACE AND DATE' :
                 lang === 'es' ? 'LUGAR Y FECHA' :
                 lang === 'de' ? 'ORT UND DATUM' :
                 "LUOGO E DATA"}
              </strong>
              <span className="font-extrabold text-neutral-900 mt-0.5 leading-tight">
                {getLocality(compilerInfo.indirizzo)}, {formatDateToIT(result.input.report.data)}
              </span>
            </div>

            <div className="text-center w-56 border-t border-neutral-950 pt-2">
              <strong>
                {lang === 'en' ? 'Technical Direction / Approval' :
                 lang === 'es' ? 'Dirección Técnica / Aprobación' :
                 lang === 'de' ? 'Technische Leitung / Genehmigung' :
                 "Direzione Tecnica / Approvazione"}
              </strong><br />
              <span className="text-[9px] text-neutral-500 italic">({result.input.report.cliente || 'Collaudatore'})</span>
            </div>
          </div>

        </div>

        {/* ================= PAGE 2 & ONWARDS: FULL CENTIMETRE CALIBRATION TABLE ================= */}
        <div className="p-2 space-y-4 bg-white">
          
          {/* Header repeating on table sheets */}
          <div className="flex justify-between items-center border-b-2 border-neutral-950 pb-2">
            <div>
              <span className="text-[9px] font-bold text-neutral-500 uppercase">
                {lang === 'en' ? 'Millimeter Calibration Certificate' :
                 lang === 'es' ? 'Certificado de Calibración Milimétrica' :
                 lang === 'de' ? 'Millimetergenaues Kalibrierzertifikat' :
                 'Certificato di Taratura Millimetrica'}
              </span>
              <h2 className="text-sm font-black uppercase tracking-tight text-neutral-900">
                {lang === 'en' ? 'Centimeter Strapping Table' :
                 lang === 'es' ? 'Tabla de Calibración Centimétrica' :
                 lang === 'de' ? 'Zentimeter-Peiltabelle' :
                 'Tabella di Taratura Centimetrica'} • {result.input.report.nomeSerbatoio || 'Serbatoio'}
              </h2>
            </div>
            <div className="text-right text-[10px] font-mono text-neutral-600">
              <div>{t.metaDwg.toUpperCase()}: {result.input.report.numeroDisegno || '-'}</div>
              <div>H TOT: {result.H_tot} mm • {t.totalCapacity.toUpperCase()}: {formatNum(result.volumeTotale, 1)} litri</div>
            </div>
          </div>

          {/* Table Explanation info */}
          <div className="text-[9px] text-neutral-500 font-mono flex justify-between">
            <span>
              {lang === 'en' ? 'Values indicate cumulative liters contained at each centimeter of height.' :
               lang === 'es' ? 'Los valores indican los litros acumulativos contenidos en correspondencia con el centímetro de altura.' :
               lang === 'de' ? 'Die Werte geben das kumulierte Volumen in Litern pro Zentimeter Füllhöhe an.' :
               "I valori indicano i litri cumulativi contenuti in corrispondenza del centimetro d'altezza."}
            </span>
            <span className="font-black text-neutral-800">
              {lang === 'en' ? 'All calculations comply with strapping geometries.' :
               lang === 'es' ? 'Todos los cálculos cumplen con las geometrías de strapping.' :
               lang === 'de' ? 'Alle Berechnungen entsprechen den Peiltabellen-Geometrien.' :
               "Tutti i calcoli sono conformi alle geometrie di strapping."}
            </span>
          </div>

          {/* Complete 2D Strapping Matrix Grid */}
          <div className="pt-1">
            <table className="w-full text-center border-collapse text-[10px] font-mono border border-neutral-950">
              <thead>
                <tr className="bg-neutral-100 font-black border-b border-neutral-950 text-[9px] uppercase">
                  <th className="py-1 px-2 text-left border-r border-neutral-950 bg-neutral-200/50">{t.tableHeightBase}</th>
                  <th className="py-1 px-0.5 border-r border-neutral-200">+0 cm</th>
                  <th className="py-1 px-0.5 border-r border-neutral-200">+1 cm</th>
                  <th className="py-1 px-0.5 border-r border-neutral-200">+2 cm</th>
                  <th className="py-1 px-0.5 border-r border-neutral-200">+3 cm</th>
                  <th className="py-1 px-0.5 border-r border-neutral-200">+4 cm</th>
                  <th className="py-1 px-0.5 border-r border-neutral-200">+5 cm</th>
                  <th className="py-1 px-0.5 border-r border-neutral-200">+6 cm</th>
                  <th className="py-1 px-0.5 border-r border-neutral-200">+7 cm</th>
                  <th className="py-1 px-0.5 border-r border-neutral-200">+8 cm</th>
                  <th className="py-1 px-0.5 text-neutral-950">+9 cm</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200 text-[9.5px]">
                {Array.from({ length: Math.ceil((Math.ceil(result.H_tot / 10) + 1) / 10) }).map((_, r) => {
                  const baseCm = r * 10;
                  return (
                    <tr key={r} className="border-b border-neutral-200 last:border-b-0 odd:bg-neutral-50/30">
                      <td className="py-1 px-2 text-left font-bold border-r border-neutral-950 bg-neutral-100/70">
                        {baseCm} cm
                      </td>
                      {Array.from({ length: 10 }).map((_, c) => {
                        const currentCm = baseCm + c;
                        const mm = currentCm * 10;
                        const isOverMax = currentCm > Math.ceil(result.H_tot / 10);

                        let valToDisplay = '-';
                        if (!isOverMax) {
                          const val = result.litriCumulativi[Math.min(mm, result.H_tot)] || 0;
                          valToDisplay = Math.round(val).toLocaleString(lang === 'it' ? 'it-IT' : 'en-US');
                        }

                        return (
                          <td
                            key={c}
                            className={`py-1 px-0.5 border-r border-neutral-200 last:border-r-0 ${
                              currentCm === Math.ceil(result.H_tot / 10) ? 'bg-emerald-50 text-emerald-950 font-black' : ''
                            }`}
                          >
                            {valToDisplay}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Small Footer metadata for pages */}
          <div className="pt-4 flex justify-between items-center text-[8px] font-mono text-neutral-400">
            <span>
              {lang === 'en' ? 'Generated via CON-BOMB TARATURA v1.2' :
               lang === 'es' ? 'Generado mediante CON-BOMB TARATURA v1.2' :
               lang === 'de' ? 'Generiert über CON-BOMB TARATURA v1.2' :
               'Generato tramite CON-BOMB TARATURA v1.2'}
            </span>
            <span>
              {lang === 'en' ? `Report: ${reportNumber} • Page 2 of 2` :
               lang === 'es' ? `Informe: ${reportNumber} • Página 2 di 2` :
               lang === 'de' ? `Bericht: ${reportNumber} • Seite 2 von 2` :
               `Relazione: ${reportNumber} • Pagina 2 di 2`}
            </span>
          </div>

        </div>

      </div>

      {/* L'intestazione report si modifica nella pagina Dati Comuni (/dati-comuni) */}



      {/* Manual / Information Modal */}
      <InfoModal
        isOpen={isInfoModalOpen}
        onClose={() => setIsInfoModalOpen(false)}
        lang={lang}
      />

      {/* Dialog bloccante: plafond export PDF della licenza esaurito */}
      {pdfExportsExhaustedDialog}
    </div>
  );
}

