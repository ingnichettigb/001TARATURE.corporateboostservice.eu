/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { CalculationResult, CompilerInfo } from '../../models/types';
import { Search, Download, Printer, Grid, List } from 'lucide-react';
import { Language, translations } from '../../utils/translations';
import { generateCalibrationPDF } from '../../services/pdf';
import { getExtendedValidityText } from '../../services/extended-validity';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import ExportCountBadge from '@/common/exports/ExportCountBadge';


interface CalibrationTableProps {
  result: CalculationResult;
  lang?: Language;
  compilerInfo?: CompilerInfo;
  /**
   * Esportazione PDF condivisa con l'header del modulo (PianoBombApp.handleExportPdf).
   * Include cattura dello schema geometrico, numero di relazione coerente e
   * gestione della modalità di stampa (unico / un PDF per numero di fabbrica).
   * Se non fornita, si ricade sulla generazione diretta (senza questi arricchimenti).
   */
  onExportPdf?: (condensed: boolean) => Promise<void> | void;
  /**
   * Gate centralizzato per l'export CSV: restituisce false se la quota è
   * esaurita (in tal caso il CSV non viene generato).
   */
  onExportCsvGate?: () => Promise<boolean> | boolean;
  /** Quota esaurita: disabilita tutti i pulsanti di esportazione. */
  exportsBlocked?: boolean;
  /** Esportazioni rimanenti mostrate nel badge sopra i pulsanti. */
  exportsRemaining?: number | null;
}

export default function CalibrationTable({ result, lang = 'it', compilerInfo, onExportPdf, onExportCsvGate, exportsBlocked = false, exportsRemaining = null }: CalibrationTableProps) {

  const t = translations[lang];
  const [viewType, setViewType] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [listPage, setListPage] = useState(1);
  const rowsPerPage = 100;

  // Round up total height in centimeters
  const maxCm = Math.ceil(result.H_tot / 10);

  // Generate data rows for the 1D list
  const listData = useMemo(() => {
    const data = [];
    for (let cm = 0; cm <= maxCm; cm++) {
      const mm = cm * 10;
      // Get volume at exactly this mm height
      const hClamped = Math.min(mm, result.H_tot);
      const litriVal = result.litriCumulativi[hClamped] || 0;
      data.push({
        cm,
        mm,
        litri: litriVal,
        delta: cm > 0 ? litriVal - (result.litriCumulativi[Math.min((cm - 1) * 10, result.H_tot)] || 0) : 0
      });
    }
    return data;
  }, [maxCm, result]);

  // Filter 1D list based on search query
  const filteredListData = useMemo(() => {
    if (!searchQuery.trim()) return listData;
    const query = searchQuery.trim().toLowerCase();
    return listData.filter((row) => {
      return (
        row.cm.toString().includes(query) ||
        row.mm.toString().includes(query) ||
        Math.round(row.litri).toString().includes(query)
      );
    });
  }, [listData, searchQuery]);

  // Paginate 1D list
  const paginatedListData = useMemo(() => {
    const start = (listPage - 1) * rowsPerPage;
    return filteredListData.slice(start, start + rowsPerPage);
  }, [filteredListData, listPage]);

  const totalPages = Math.ceil(filteredListData.length / rowsPerPage);

  // Direct lookup: quota (mm) typed in the search field -> litres
  const searchLookup = useMemo(() => {
    const raw = searchQuery.trim().replace(',', '.');
    if (!raw || !/^\d+(\.\d+)?$/.test(raw)) return null;
    const mm = Math.round(parseFloat(raw));
    if (mm < 0) return null;
    const clamped = Math.min(mm, result.H_tot);
    return {
      mm,
      out: mm > result.H_tot,
      litri: result.litriCumulativi[clamped] || 0,
    };
  }, [searchQuery, result]);


  // Helper to format numbers
  const formatNum = (num: number, decimals: number = 2) => {
    if (num === undefined || isNaN(num)) return lang === 'en' ? '0.00' : '0,00';
    const locale = lang === 'en' ? 'en-US' : lang === 'es' ? 'es-ES' : lang === 'de' ? 'de-DE' : 'it-IT';
    return num.toLocaleString(locale, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
  };

  // Export 1D list to CSV
  const handleExportListCSV = () => {
    let csvContent = 'data:text/csv;charset=utf-8,';
    
    // Localized Headers
    const hHeightCm = lang === 'en' ? 'Height (cm)' : lang === 'es' ? 'Altura (cm)' : lang === 'de' ? 'Höhe (cm)' : 'Altezza (cm)';
    const hHeightMm = lang === 'en' ? 'Height (mm)' : lang === 'es' ? 'Altura (mm)' : lang === 'de' ? 'Höhe (mm)' : 'Altezza (mm)';
    const hVolume = lang === 'en' ? 'Volume (liters)' : lang === 'es' ? 'Volumen (litros)' : lang === 'de' ? 'Füllvolumen (Liter)' : 'Volume (litri)';
    const hDelta = lang === 'en' ? 'Delta (liters/cm)' : lang === 'es' ? 'Delta (litros/cm)' : lang === 'de' ? 'Delta (Liter/cm)' : 'Delta (litri/cm)';
    
    csvContent += `${hHeightCm};${hHeightMm};${hVolume};${hDelta}\n`;
    
    listData.forEach((row) => {
      csvContent += `${row.cm};${row.mm};${row.litri.toFixed(2)};${row.delta.toFixed(2)}\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    const prefix = lang === 'en' ? 'linear_calibration_table' : lang === 'es' ? 'tabla_calibracion_lineal' : lang === 'de' ? 'lineare_kalibriertabelle' : 'tabella_taratura_lineare';
    link.setAttribute('download', `${prefix}_${result.input.report.nomeSerbatoio || 'serbatoio'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export 2D Strapping Grid to CSV
  const handleExportGridCSV = () => {
    let csvContent = 'data:text/csv;charset=utf-8,';
    
    const hBaseHeight = lang === 'en' ? 'Base Height' : lang === 'es' ? 'Altura Base' : lang === 'de' ? 'Basis-Höhe' : 'Altezza Base';
    csvContent += `${hBaseHeight};+0 cm;+1 cm;+2 cm;+3 cm;+4 cm;+5 cm;+6 cm;+7 cm;+8 cm;+9 cm\n`;

    const gridRowsCount = Math.ceil((maxCm + 1) / 10);
    for (let r = 0; r < gridRowsCount; r++) {
      const baseCm = r * 10;
      let line = `${baseCm} cm`;
      for (let c = 0; c < 10; c++) {
        const currentCm = baseCm + c;
        if (currentCm <= maxCm) {
          const mm = currentCm * 10;
          const litriVal = result.litriCumulativi[Math.min(mm, result.H_tot)] || 0;
          line += `;${litriVal.toFixed(1)}`;
        } else {
          line += ';';
        }
      }
      csvContent += line + '\n';
    }

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    const prefix = lang === 'en' ? 'grid_calibration_table' : lang === 'es' ? 'tabla_calibracion_rejilla' : lang === 'de' ? 'raster_kalibriertabelle' : 'tabella_taratura_griglia';
    link.setAttribute('download', `${prefix}_${result.input.report.nomeSerbatoio || 'serbatoio'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  /**
   * Export CSV con gate di quota centralizzato: PDF e CSV dello stesso ciclo
   * contano come una sola esportazione.
   */
  const handleExportCSV = async () => {
    if (onExportCsvGate) {
      const allowed = await onExportCsvGate();
      if (!allowed) return;
    }
    if (viewType === 'grid') handleExportGridCSV();
    else handleExportListCSV();
  };



  // Trigger Print Dialog — usa la STESSA funzione dei bottoni "Stampa PDF" /
  // "PDF condensata" nell'header (PianoBombApp.handleExportPdf), garantendo che
  // schema geometrico, numero di relazione e modalità di stampa multipla
  // vengano gestiti in modo identico. Fallback diretto solo se il modulo
  // chiamante non passa la prop (retro-compatibilità).
  const handlePrint = async () => {
    if (onExportPdf) {
      await onExportPdf(false);
      return;
    }
    await generateCalibrationPDF(result, lang, compilerInfo, false);
  };

  const handlePrintCondensed = async () => {
    if (onExportPdf) {
      await onExportPdf(true);
      return;
    }
    await generateCalibrationPDF(result, lang, compilerInfo, true);
  };
  return (
    <div className="space-y-4">
      {/* Table Toolbar */}
      <div className="flex flex-row items-center justify-between gap-1.5 bg-white p-2 border-4 border-double border-emerald-800 rounded-xl shadow-xs overflow-hidden">
        <div className="flex items-center gap-1.5 min-w-0 flex-1">
          <div className="flex items-center gap-1 bg-white border border-neutral-300 rounded-lg px-2 py-1 shadow-xs w-32 sm:w-40 shrink-0">
            <Search className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
            <input
              type="text"
              placeholder={
                lang === 'en' ? 'Height (mm)...' :
                lang === 'es' ? 'Altura (mm)...' :
                lang === 'de' ? 'Höhe (mm)...' :
                'Quota (mm)...'
              }
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setListPage(1);
              }}
              className="text-[11px] bg-transparent w-full text-neutral-900 placeholder-neutral-400 focus:outline-hidden"
            />
            <span className="text-[10px] font-bold text-neutral-400 shrink-0">mm</span>
          </div>
          {searchLookup && (
            <div className="text-[11px] font-bold text-emerald-900 bg-emerald-50 border border-emerald-300 rounded-lg px-2 py-1 whitespace-nowrap truncate">
              {searchLookup.mm} mm = {formatNum(searchLookup.litri, 2)} L
              {searchLookup.out && ' (max)'}
            </div>
          )}
        </div>


        <div className="flex flex-row items-center gap-1.5">
          {/* View Toggle */}
          <div className="flex bg-neutral-200 p-0.5 rounded-lg text-[11px] font-semibold text-neutral-600 shrink-0">
            <button
              onClick={() => setViewType('grid')}
              className={`flex items-center gap-1 py-1.5 px-2.5 rounded-md transition-all cursor-pointer ${
                viewType === 'grid' ? 'bg-white text-neutral-900 shadow-xs' : 'hover:bg-neutral-300'
              }`}
              title={
                lang === 'en' ? 'Grid View (Strapping)' :
                lang === 'es' ? 'Vista de Rejilla (Strapping)' :
                lang === 'de' ? 'Rasteransicht (Strapping)' :
                'Vista Griglia (Strapping)'
              }
            >
              <Grid className="w-3.5 h-3.5" />
              <span>
                {lang === 'en' ? 'Grid' :
                 lang === 'es' ? 'Rejilla' :
                 lang === 'de' ? 'Raster' :
                 'Griglia'}
              </span>
            </button>
            <button
              onClick={() => setViewType('list')}
              className={`flex items-center gap-1 py-1.5 px-2.5 rounded-md transition-all cursor-pointer ${
                viewType === 'list' ? 'bg-white text-neutral-900 shadow-xs' : 'hover:bg-neutral-300'
              }`}
              title={
                lang === 'en' ? 'Linear List View' :
                lang === 'es' ? 'Vista de Lista Lineal' :
                lang === 'de' ? 'Lineare Listenansicht' :
                'Vista Lista Lineare'
              }
            >
              <List className="w-3.5 h-3.5" />
              <span>
                {lang === 'en' ? 'List' :
                 lang === 'es' ? 'Lineal' :
                 lang === 'de' ? 'Liste' :
                 'Lineare'}
              </span>
            </button>
          </div>

          {/* Export & Print */}
          <div className="flex gap-1 shrink-0">
            <ExportCountBadge count={exportsRemaining} lang={lang}>
            <button
              onClick={handleExportCSV}
              disabled={exportsBlocked}
              className="bg-white border border-neutral-300 hover:bg-neutral-50 text-neutral-700 text-[11px] font-bold py-1.5 px-2.5 rounded-lg shadow-xs flex items-center gap-1 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
              title={
                lang === 'en' ? 'Export CSV' :
                lang === 'es' ? 'Exportar CSV' :
                lang === 'de' ? 'CSV Exportieren' :
                'Esporta CSV'
              }
            >
              <Download className="w-3.5 h-3.5" />
              <span>CSV</span>
            </button>
            </ExportCountBadge>
            <ExportCountBadge count={exportsRemaining} lang={lang}>
            <button
              onClick={handlePrint}
              disabled={exportsBlocked}
              className="bg-emerald-800 hover:bg-emerald-900 border border-emerald-950 text-white text-[11px] font-bold py-1.5 px-2.5 rounded-lg shadow-xs flex items-center gap-1 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
              title={
                lang === 'en' ? 'Print PDF' :
                lang === 'es' ? 'Imprimir PDF' :
                lang === 'de' ? 'PDF Drucken' :
                'Stampa PDF'
              }
            >
              <Printer className="w-3.5 h-3.5 text-emerald-100" />
              <span>PDF</span>
            </button>
            </ExportCountBadge>
            <ExportCountBadge count={exportsRemaining} lang={lang}>
            <button
              onClick={handlePrintCondensed}
              disabled={exportsBlocked}
              className="bg-teal-700 hover:bg-teal-800 border border-teal-900 text-white text-[11px] font-bold py-1.5 px-2.5 rounded-lg shadow-xs flex items-center gap-1 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
              title={
                lang === 'en' ? 'Condensed PDF' :
                lang === 'es' ? 'PDF Condensado' :
                lang === 'de' ? 'Kompakt PDF' :
                'PDF condensata'
              }
            >
              <Printer className="w-3.5 h-3.5 text-teal-100" />
              <span>
                {lang === 'en' ? 'Cond.' :
                 lang === 'es' ? 'Cond.' :
                 lang === 'de' ? 'Komp.' :
                 'Cond.'}
              </span>
            </button>
            </ExportCountBadge>
          </div>
        </div>
      </div>

      {/* Grid strapping table view */}
      {viewType === 'grid' && (
        <div className="bg-white border-4 border-double border-emerald-800 rounded-xl overflow-hidden shadow-xs">
          <div className="p-4 bg-neutral-50 border-b border-neutral-200 flex justify-between items-center">
            <div>
              <h4 className="text-sm font-bold text-neutral-900">
                {lang === 'en' ? 'Strapping Calibration Table (Centimetric)' :
                 lang === 'es' ? 'Tabla de Calibración de Strapping (Centimétrica)' :
                 lang === 'de' ? 'Kalkulationstabelle zur Kalibrierung (Zentimeter)' :
                 'Tabella Taratura Strapping (Centimetrica)'}
              </h4>
              <p className="text-[10px] text-neutral-500 mt-0.5">
                {lang === 'en' ? 'Contained liters shown at the intersection of base height (left) and additional centimeters (columns).' :
                 lang === 'es' ? 'Litros contenidos indicados en la intersección de la altura base (izquierda) y los centímetros adicionales (columnas).' :
                 lang === 'de' ? 'Füllvolumen in Litern an dem Schnittpunkt zwischen Basishöhe (links) und zusätzlichen Zentimetern (Spalten) angezeigt.' :
                 "Litri contenuti indicati all'incrocio tra altezza base (sinistra) e centimetri addizionali (colonne)."}
              </p>
            </div>
            <span className="text-[10px] font-mono bg-neutral-200 text-neutral-700 font-bold px-2 py-0.5 rounded-full">
              {lang === 'en' ? 'Max Capacity' : lang === 'es' ? 'Capacidad Máx' : lang === 'de' ? 'Max. Kapazität' : 'Capacità max'}: {formatNum(result.volumeTotale, 1)} l ({formatNum(result.volumeTotale / 1000, 3)} m³)
            </span>
          </div>

          <div className="overflow-x-auto print:overflow-visible">
            <table className="w-full text-center border-collapse min-w-[700px]">
              <thead>
                <tr className="bg-neutral-100 text-neutral-700 font-bold text-[11px] uppercase border-b border-neutral-200">
                  <th className="py-2.5 px-3 text-left border-r border-neutral-200 bg-neutral-100/50">
                    {lang === 'en' ? 'Base Height' : lang === 'es' ? 'Altura Base' : lang === 'de' ? 'Basis-Höhe' : 'Altezza Base'}
                  </th>
                  <th className="py-2.5 px-1 border-r border-neutral-200/50">+0 cm</th>
                  <th className="py-2.5 px-1 border-r border-neutral-200/50">+1 cm</th>
                  <th className="py-2.5 px-1 border-r border-neutral-200/50">+2 cm</th>
                  <th className="py-2.5 px-1 border-r border-neutral-200/50">+3 cm</th>
                  <th className="py-2.5 px-1 border-r border-neutral-200/50">+4 cm</th>
                  <th className="py-2.5 px-1 border-r border-neutral-200/50">+5 cm</th>
                  <th className="py-2.5 px-1 border-r border-neutral-200/50">+6 cm</th>
                  <th className="py-2.5 px-1 border-r border-neutral-200/50">+7 cm</th>
                  <th className="py-2.5 px-1 border-r border-neutral-200/50">+8 cm</th>
                  <th className="py-2.5 px-1 bg-neutral-100/50">+9 cm</th>
                </tr>
              </thead>
              <tbody className="text-xs font-mono text-neutral-800 divide-y divide-neutral-150">
                {Array.from({ length: Math.ceil((maxCm + 1) / 10) }).map((_, r) => {
                  const baseCm = r * 10;
                  return (
                    <tr key={r} className="hover:bg-neutral-50/60 even:bg-neutral-50/20">
                      <td className="py-2 px-3 text-left font-bold text-neutral-900 border-r border-neutral-200 bg-neutral-100/20">
                        {baseCm} cm
                      </td>
                      {Array.from({ length: 10 }).map((_, c) => {
                        const currentCm = baseCm + c;
                        const isOverMax = currentCm > maxCm;
                        const mm = currentCm * 10;
                        const isTotalCapacityCell = currentCm === maxCm;

                        let valToDisplay = '-';
                        if (!isOverMax) {
                          const val = result.litriCumulativi[Math.min(mm, result.H_tot)] || 0;
                          valToDisplay = formatNum(val, 1);
                        }

                        return (
                          <td
                            key={c}
                            className={`py-2 px-1 border-r border-neutral-150/60 last:border-r-0 ${
                              isTotalCapacityCell ? 'bg-sky-50 text-sky-800 font-bold' : ''
                            } ${isOverMax ? 'text-neutral-300 bg-neutral-50/40 select-none' : ''}`}
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
        </div>
      )}

      {/* List view */}
      {viewType === 'list' && (
        <div className="bg-white border-4 border-double border-emerald-800 rounded-xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-neutral-100 text-neutral-700 font-bold text-[11px] uppercase border-b border-neutral-200">
                  <th className="py-3 px-4">
                    {lang === 'en' ? 'Height (cm)' : lang === 'es' ? 'Altura (cm)' : lang === 'de' ? 'Höhe (cm)' : 'Altezza (cm)'}
                  </th>
                  <th className="py-3 px-4">
                    {lang === 'en' ? 'Height (mm)' : lang === 'es' ? 'Altura (mm)' : lang === 'de' ? 'Höhe (mm)' : 'Altezza (mm)'}
                  </th>
                  <th className="py-3 px-4">
                    {lang === 'en' ? 'Cumulative Volume (liters)' : lang === 'es' ? 'Volumen Acumulado (litros)' : lang === 'de' ? 'Kumuliertes Volumen (Liter)' : 'Volume Cumulativo (litri)'}
                  </th>
                  <th className="py-3 px-4">Delta (l/cm)</th>
                </tr>
              </thead>
              <tbody className="text-xs font-mono text-neutral-800 divide-y divide-neutral-100">
                {paginatedListData.length > 0 ? (
                  paginatedListData.map((row) => (
                    <tr key={row.cm} className="hover:bg-neutral-50 even:bg-neutral-50/20">
                      <td className="py-2.5 px-4 font-bold text-neutral-900">{row.cm} cm</td>
                      <td className="py-2.5 px-4 text-neutral-500">{row.mm} mm</td>
                      <td className="py-2.5 px-4 text-neutral-950 font-semibold">{formatNum(row.litri, 2)} l</td>
                      <td className="py-2.5 px-4 text-emerald-700 font-medium">+{formatNum(row.delta, 2)} l</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="py-6 px-4 text-center italic text-neutral-400">
                      {lang === 'en' ? 'No match found for your search.' :
                       lang === 'es' ? 'No se encontraron coincidencias para su búsqueda.' :
                       lang === 'de' ? 'Keine Übereinstimmungen für Ihre Suche gefunden.' :
                       'Nessuna corrispondenza trovata per la ricerca.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="p-4 bg-neutral-50 border-t border-neutral-200 flex justify-between items-center text-xs">
              <span className="text-neutral-500">
                {lang === 'en' ? `Showing ${paginatedListData.length} of ${filteredListData.length} centimeters` :
                 lang === 'es' ? `Mostrando ${paginatedListData.length} de ${filteredListData.length} centímetros` :
                 lang === 'de' ? `Zeige ${paginatedListData.length} von ${filteredListData.length} Zentimetern` :
                 `Mostrati ${paginatedListData.length} di ${filteredListData.length} centimetri`}
              </span>
              <div className="flex gap-1.5">
                <button
                  disabled={listPage === 1}
                  onClick={() => setListPage((prev) => prev - 1)}
                  className="bg-white border border-neutral-300 hover:bg-neutral-50 disabled:opacity-40 disabled:hover:bg-white text-neutral-700 font-semibold py-1 px-3 rounded-md shadow-xs transition-colors cursor-pointer"
                >
                  {lang === 'en' ? 'Back' : lang === 'es' ? 'Atrás' : lang === 'de' ? 'Zurück' : 'Indietro'}
                </button>
                <span className="py-1 px-2.5 font-bold text-neutral-800">
                  {listPage} / {totalPages}
                </span>
                <button
                  disabled={listPage === totalPages}
                  onClick={() => setListPage((prev) => prev + 1)}
                  className="bg-white border border-neutral-300 hover:bg-neutral-50 disabled:opacity-40 disabled:hover:bg-white text-neutral-700 font-semibold py-1 px-3 rounded-md shadow-xs transition-colors cursor-pointer"
                >
                  {lang === 'en' ? 'Next' : lang === 'es' ? 'Siguiente' : lang === 'de' ? 'Weiter' : 'Avanti'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
