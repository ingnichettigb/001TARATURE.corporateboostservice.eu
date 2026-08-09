/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { CalculationResult, CompilerInfo } from '../types';
import { Search, Download, Printer, Grid, List } from 'lucide-react';
import { Language, translations } from '../utils/translations';
import { generateCalibrationPDF } from '../utils/pdfGenerator';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

interface CalibrationTableProps {
  result: CalculationResult;
  lang?: Language;
  compilerInfo?: CompilerInfo;
}

export default function CalibrationTable({ result, lang = 'it', compilerInfo }: CalibrationTableProps) {
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

  // Trigger Print Dialog
  const handlePrint = async () => {
    await generateCalibrationPDF(result, lang, compilerInfo, false);
  };

  const handlePrintCondensed = async () => {
    await generateCalibrationPDF(result, lang, compilerInfo, true);
  };

  const _old_handlePrint_disabled = async () => {
    try {
      const labels: Record<Language, any> = {
        it: {
          title: 'CERTIFICATO DI TARATURA & SCHEDA TECNICA',
          tableTitle: 'TABELLA DI TARATURA CENTIMETRICA',
          customer: 'Cliente:',
          reference: 'Riferimento:',
          tank: 'Serbatoio:',
          date: 'Data Rilievo:',
          dwg: 'Numero Disegno:',
          compiler: 'Compilatore:',
          factoryNo: 'N° Fabbrica:',
          tagNo: 'Tag Number:',
          job: 'Commessa:',
          extValidity: 'Validità Estesa:',
          
          // Geometry & Tech Data
          techTitle: 'Dati Geometrici e Strutturali',
          internalDiameter: 'Diametro Interno (D_int):',
          cylinderLength: 'Altezza Cilindrica (L_cil):',
          totalHeight: 'Altezza Totale Interna (H_tot):',
          density: 'Densità del Fluido (rho):',
          
          // Volumes
          volumeTitle: 'Volumi dei Singoli Componenti',
          bottomVolume: 'Volume Fondo Conico:',
          cylinderVolume: 'Volume Mantello Cilindrico:',
          topVolume: 'Volume Coperchio Bombato:',
          totalVolume: 'VOLUME TOTALE NOMINALE:',
          
          // Sheets
          sheetTitle: 'Dati Costruttivi e Lamiere (Acciaio)',
          bottomHead: 'Fondo Calotta:',
          topHead: 'Coperchio Calotta:',
          thickness: 'Spessore Lamiera (Sp):',
          development: 'Sviluppo Srotolamento Lamiera (Diametro):',
          area: 'Area Disco Grezzo Taglio:',
          sheetWeight: 'Peso Lamiera:',
          
          // Weights
          weightTitle: 'Pesi e Carichi',
          fullWeight: 'Peso Contenuto Pieno:',
          weightPerCm: 'Peso per cm di mantello cilindrico:',
          
          // Table Headers
          colCm: 'Altezza (cm)',
          colMm: 'Altezza (mm)',
          colVol: 'Volume Cumulativo (litri)',
          colDelta: 'Delta (l/cm)',
          
          // Footers
          page: 'Pagina',
          signature: 'Firma del Compilatore',
          stamp: 'Timbro della Ditta',
          emitted: 'Emesso il:',
          capacityMax: 'Capacità max:',
        },
        en: {
          title: 'CALIBRATION CERTIFICATE & TECHNICAL DATASHEET',
          tableTitle: 'CENTIMETRIC CALIBRATION TABLE',
          customer: 'Customer:',
          reference: 'Reference:',
          tank: 'Tank:',
          date: 'Survey Date:',
          dwg: 'Drawing Number:',
          compiler: 'Compiler:',
          factoryNo: 'Factory No:',
          tagNo: 'Tag Number:',
          job: 'Job/Order:',
          extValidity: 'Extended Validity:',
          
          techTitle: 'Geometric & Structural Data',
          internalDiameter: 'Internal Diameter (D_int):',
          cylinderLength: 'Cylindrical Length (L_cil):',
          totalHeight: 'Total Internal Height (H_tot):',
          density: 'Fluid Density (rho):',
          
          volumeTitle: 'Volumes of Individual Components',
          bottomVolume: 'Bottom Head Volume:',
          cylinderVolume: 'Cylindrical Shell Volume:',
          topVolume: 'Top Head Volume:',
          totalVolume: 'TOTAL NOMINAL VOLUME:',
          
          sheetTitle: 'Construction & Sheet Metal Details (Steel)',
          bottomHead: 'Bottom Head:',
          topHead: 'Top Head:',
          thickness: 'Sheet Thickness (s):',
          development: 'Cutting Development (Diameter):',
          area: 'Raw Disc Area:',
          sheetWeight: 'Sheet Metal Weight:',
          
          weightTitle: 'Weights & Loads',
          fullWeight: 'Full Load Weight:',
          weightPerCm: 'Weight per cm of cylindrical shell:',
          
          colCm: 'Height (cm)',
          colMm: 'Height (mm)',
          colVol: 'Cumulative Volume (liters)',
          colDelta: 'Delta (l/cm)',
          
          page: 'Page',
          signature: 'Compiler\'s Signature',
          stamp: 'Company Stamp',
          emitted: 'Issued on:',
          capacityMax: 'Max Capacity:',
        },
        es: {
          title: 'CERTIFICADO DE CALIBRACIÓN Y FICHA TÉCNICA',
          tableTitle: 'TABLA DE CALIBRACIÓN CENTIMÉTRICA',
          customer: 'Cliente:',
          reference: 'Referencia:',
          tank: 'Depósito:',
          date: 'Fecha de Levantamiento:',
          dwg: 'Número de Plano:',
          compiler: 'Compilador:',
          factoryNo: 'N° Fábrica:',
          tagNo: 'Número de Tag:',
          job: 'Pedido/Commessa:',
          extValidity: 'Validez Extendida:',
          
          techTitle: 'Datos Geométricos y Estructurales',
          internalDiameter: 'Diámetro Interno (D_int):',
          cylinderLength: 'Altura Cilíndrica (L_cil):',
          totalHeight: 'Altura Interna Total (H_tot):',
          density: 'Densidad del Fluido (rho):',
          
          volumeTitle: 'Volúmenes de los Componentes Individuales',
          bottomVolume: 'Volumen del Extremo Inferior:',
          cylinderVolume: 'Volumen del Cuerpo Cilíndrico:',
          topVolume: 'Volumen del Extremo Superior:',
          totalVolume: 'VOLUMEN NOMINAL TOTAL:',
          
          sheetTitle: 'Detalles de Fabricación y Chapa (Acero)',
          bottomHead: 'Extremo Inferior:',
          topHead: 'Extremo Superior:',
          thickness: 'Espesor de Chapa (s):',
          development: 'Desarrollo de Corte (Diámetro):',
          area: 'Área del Disco Bruto:',
          sheetWeight: 'Peso de la Chapa:',
          
          weightTitle: 'Pesos y Cargas',
          fullWeight: 'Peso con Carga Máxima:',
          weightPerCm: 'Peso por cm de cuerpo cilíndrico:',
          
          colCm: 'Altura (cm)',
          colMm: 'Altura (mm)',
          colVol: 'Volumen Acumulado (litros)',
          colDelta: 'Delta (l/cm)',
          
          page: 'Página',
          signature: 'Firma del Compilador',
          stamp: 'Sello de la Empresa',
          emitted: 'Emitido el:',
          capacityMax: 'Capacidad Máx:',
        },
        de: {
          title: 'KALIBRIERZERTIFIKAT & TECHNISCHES DATENBLATT',
          tableTitle: 'ZENTIMETER-KALIBRIERTABELLE',
          customer: 'Kunde:',
          reference: 'Referenz:',
          tank: 'Behälter:',
          date: 'Messdatum:',
          dwg: 'Zeichnungsnummer:',
          compiler: 'Ersteller:',
          factoryNo: 'Fabriknummer:',
          tagNo: 'Tag-Nummer:',
          job: 'Auftrag:',
          extValidity: 'Erweiterte Gültigkeit:',
          
          techTitle: 'Geometrische & strukturelle Daten',
          internalDiameter: 'Innendurchmesser (D_int):',
          cylinderLength: 'Zylindrische Höhe (L_cil):',
          totalHeight: 'Innere Gesamthöhe (H_tot):',
          density: 'Spezifisches Gewicht des Fluids (rho):',
          
          volumeTitle: 'Füllvolumen der einzelnen Komponenten',
          bottomVolume: 'Volumen des unteren Bodens:',
          cylinderVolume: 'Volumen des zylindrischen Mantels:',
          topVolume: 'Volumen des oberen Deckels:',
          totalVolume: 'GESAMTES NENNFÜLLVOLUMEN:',
          
          sheetTitle: 'Konstruktionsdaten & Zuschnittbleche (Stahl)',
          bottomHead: 'Unterer Boden:',
          topHead: 'Oberer Deckel:',
          thickness: 'Blechdicke (s):',
          development: 'Blech-Zuschnittsentwicklung (Durchmesser):',
          area: 'Fläche des rohen Zuschnittsblechs:',
          sheetWeight: 'Blechgewicht:',
          
          weightTitle: 'Gewichte & Lasten',
          fullWeight: 'Gewicht bei Vollfüllung:',
          weightPerCm: 'Gewicht pro cm des zylindrischen Mantels:',
          
          colCm: 'Höhe (cm)',
          colMm: 'Höhe (mm)',
          colVol: 'Kumuliertes Volumen (Liter)',
          colDelta: 'Delta (l/cm)',
          
          page: 'Seite',
          signature: 'Erstellerunterschrift',
          stamp: 'Firmenstempel',
          emitted: 'Ausgestellt am:',
          capacityMax: 'Max. Kapazität:',
        }
      };

      const formatNumPDF = (num: number, decimals: number = 2) => {
        if (num === undefined || isNaN(num)) return lang === 'en' ? '0.00' : '0,00';
        const locale = lang === 'en' ? 'en-US' : lang === 'es' ? 'es-ES' : lang === 'de' ? 'de-DE' : 'it-IT';
        return num.toLocaleString(locale, {
          minimumFractionDigits: decimals,
          maximumFractionDigits: decimals,
        });
      };

      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      // Page 1: Design letterhead & compiler details
      const hasLogo = compilerInfo && compilerInfo.logoType !== 'none';
      if (hasLogo && compilerInfo) {
        if (compilerInfo.logoType === 'custom' && compilerInfo.customLogoData) {
          try {
            doc.addImage(compilerInfo.customLogoData, 'PNG', 15, 15, 20, 20);
          } catch (e) {
            console.error('Error rendering custom logo in PDF', e);
            doc.setFillColor(6, 78, 59);
            doc.roundedRect(15, 15, 20, 20, 3, 3, 'F');
          }
        } else {
          doc.setFillColor(6, 78, 59);
          doc.roundedRect(15, 15, 20, 20, 3, 3, 'F');
          doc.setTextColor(255, 255, 255);
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(14);
          const initial = compilerInfo.ditta ? compilerInfo.ditta.charAt(0).toUpperCase() : 'B';
          doc.text(initial, 25, 27, { align: 'center' });
        }
      }

      const textX = hasLogo ? 40 : 15;
      if (compilerInfo) {
        doc.setTextColor(31, 41, 55);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12);
        doc.text(compilerInfo.ditta, textX, 19);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8.5);
        doc.setTextColor(75, 85, 99);

        let detailsY = 23;
        const detailsLineHeight = 3.8;

        if (compilerInfo.indirizzo) {
          doc.text(compilerInfo.indirizzo, textX, detailsY);
          detailsY += detailsLineHeight;
        }

        let contactRow = '';
        if (compilerInfo.telefono) contactRow += `Tel: ${compilerInfo.telefono}`;
        if (compilerInfo.email) contactRow += `${contactRow ? '  •  ' : ''}Email: ${compilerInfo.email}`;
        if (contactRow) {
          doc.text(contactRow, textX, detailsY);
          detailsY += detailsLineHeight;
        }

        let legalRow = '';
        if (compilerInfo.partitaIva) legalRow += `${t.vatNumber || 'P.IVA'}: ${compilerInfo.partitaIva}`;
        if (compilerInfo.emailPec) legalRow += `${legalRow ? '  •  ' : ''}PEC: ${compilerInfo.emailPec}`;
        if (legalRow) {
          doc.text(legalRow, textX, detailsY);
          detailsY += detailsLineHeight;
        }
      }

      // Tank Shape Clue/Schematic on the Top Right
      const x_c = 172;
      const y_c = 15.5;
      const w_c = 14;
      const h_c = 18;
      const dome_h = 3.5;

      // Helper to draw a semi-ellipse
      const drawSemiEllipse = (cx: number, cy: number, rx: number, ry: number, startAngle: number, endAngle: number) => {
        const steps = 30;
        let prevX = cx + rx * Math.cos(startAngle);
        let prevY = cy + ry * Math.sin(startAngle);
        for (let i = 1; i <= steps; i++) {
          const angle = startAngle + (endAngle - startAngle) * (i / steps);
          const currX = cx + rx * Math.cos(angle);
          const currY = cy + ry * Math.sin(angle);
          doc.line(prevX, prevY, currX, currY);
          prevX = currX;
          prevY = currY;
        }
      };

      // Helper to draw dashed line
      const drawDashedLine = (x1: number, y1: number, x2: number, y2: number) => {
        const dash = 1.2;
        const gap = 0.8;
        let cy = y1;
        while (cy < y2) {
          const ny = Math.min(cy + dash, y2);
          doc.line(x1, cy, x1, ny);
          cy = ny + gap;
        }
      };

      // 1. Fill background of tank with light green emerald-50
      doc.setFillColor(240, 253, 244);
      doc.rect(x_c, y_c, w_c, h_c, 'F');
      doc.ellipse(x_c + w_c / 2, y_c, w_c / 2, dome_h, 'F');
      doc.ellipse(x_c + w_c / 2, y_c + h_c, w_c / 2, dome_h, 'F');

      // 2. Draw tank outlines
      doc.setDrawColor(6, 78, 59);
      doc.setLineWidth(0.4);
      // Left vertical line
      doc.line(x_c, y_c, x_c, y_c + h_c);
      // Right vertical line
      doc.line(x_c + w_c, y_c, x_c + w_c, y_c + h_c);
      // Top dome outline
      drawSemiEllipse(x_c + w_c / 2, y_c, w_c / 2, dome_h, Math.PI, 2 * Math.PI);
      // Bottom dome outline
      drawSemiEllipse(x_c + w_c / 2, y_c + h_c, w_c / 2, dome_h, 0, Math.PI);

      // 3. Draw horizontal weld junctions (seams)
      doc.setDrawColor(110, 160, 140);
      doc.setLineWidth(0.2);
      doc.line(x_c, y_c, x_c + w_c, y_c);
      doc.line(x_c, y_c + h_c, x_c + w_c, y_c + h_c);

      // 4. Draw axis of symmetry (vertical dashed line)
      doc.setDrawColor(180, 180, 180);
      doc.setLineWidth(0.15);
      drawDashedLine(x_c + w_c / 2, y_c - dome_h - 2, x_c + w_c / 2, y_c + h_c + dome_h + 2);

      // 5. Draw text labels and indicator lines
      const labelTop = lang === 'en' ? 'Top Head' : lang === 'es' ? 'Cúpula Sup.' : lang === 'de' ? 'Obere Kuppe' : 'Coperchio';
      const labelMid = lang === 'en' ? 'Cylinder' : lang === 'es' ? 'Cuerpo Cil.' : lang === 'de' ? 'Zylinder' : 'Mantello';
      const labelBot = lang === 'en' ? 'Bottom Head' : lang === 'es' ? 'Cúpula Inf.' : lang === 'de' ? 'Unterer Boden' : 'Fondo';

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.5);
      doc.setTextColor(107, 114, 128);

      // Top Head pointer & text
      const y_top = y_c - dome_h / 2;
      doc.setDrawColor(209, 213, 219);
      doc.setLineWidth(0.15);
      doc.line(160, y_top, 173, y_top);
      doc.setFillColor(107, 114, 128);
      doc.circle(173, y_top, 0.4, 'F');
      doc.text(labelTop, 158, y_top + 0.8, { align: 'right' });

      // Mid / Cylinder pointer & text
      const y_mid = y_c + h_c / 2;
      doc.setDrawColor(209, 213, 219);
      doc.setLineWidth(0.15);
      doc.line(160, y_mid, 174, y_mid);
      doc.circle(174, y_mid, 0.4, 'F');
      doc.text(labelMid, 158, y_mid + 0.8, { align: 'right' });

      // Bottom Head pointer & text
      const y_bot = y_c + h_c + dome_h / 2;
      doc.setDrawColor(209, 213, 219);
      doc.setLineWidth(0.15);
      doc.line(160, y_bot, 173, y_bot);
      doc.circle(173, y_bot, 0.4, 'F');
      doc.text(labelBot, 158, y_bot + 0.8, { align: 'right' });

      // Horizontal line
      doc.setDrawColor(6, 78, 59);
      doc.setLineWidth(0.6);
      doc.line(15, 38, 195, 38);

      // Title
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.setTextColor(6, 78, 59);
      doc.text(labels[lang].title, 15, 47);

      // Metadata Box
      doc.setDrawColor(229, 231, 235);
      doc.setFillColor(249, 250, 251);
      doc.roundedRect(15, 52, 180, 48, 2, 2, 'FD');

      doc.setTextColor(31, 41, 55);
      doc.setFontSize(9);

      const metaLeft = [
        { label: labels[lang].customer, val: result.input.report.cliente },
        { label: labels[lang].reference, val: result.input.report.riferimento },
        { label: labels[lang].tank, val: result.input.report.nomeSerbatoio },
        { label: labels[lang].dwg, val: result.input.report.numeroDisegno },
      ];

      const metaRight = [
        { label: labels[lang].date, val: result.input.report.data },
        { label: labels[lang].compiler, val: result.input.report.compilatore || '-' },
        { label: labels[lang].tagNo, val: result.input.report.tagNumber || '-' },
        { label: labels[lang].factoryNo, val: result.input.report.numeroFabbrica || '-' },
      ];

      let y = 58;
      metaLeft.forEach((item) => {
        doc.setFont('helvetica', 'bold');
        doc.text(item.label, 18, y);
        doc.setFont('helvetica', 'normal');
        doc.text(item.val || '-', 48, y);
        y += 6.5;
      });

      y = 58;
      metaRight.forEach((item) => {
        doc.setFont('helvetica', 'bold');
        doc.text(item.label, 108, y);
        doc.setFont('helvetica', 'normal');
        doc.text(item.val || '-', 138, y);
        y += 6.5;
      });

      let commValLine = '';
      if (result.input.report.commessa) {
        commValLine += `${labels[lang].job} ${result.input.report.commessa}  `;
      }
      if (result.input.report.validitaEstesa) {
        commValLine += `  •  ${labels[lang].extValidity} ${result.input.report.validitaEstesa}`;
      }
      if (commValLine) {
        doc.setFont('helvetica', 'bold');
        doc.text('Note / Ref:', 18, 84);
        doc.setFont('helvetica', 'normal');
        doc.text(commValLine, 38, 84);
      }

      // Tech specs section
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(6, 78, 59);
      doc.text(labels[lang].techTitle, 15, 108);

      autoTable(doc, {
        startY: 111,
        margin: { left: 15, right: 15 },
        theme: 'plain',
        styles: {
          fontSize: 8.5,
          cellPadding: 2,
          textColor: [31, 41, 55],
          lineColor: [229, 231, 235],
          lineWidth: 0.1,
        },
        columnStyles: {
          0: { fontStyle: 'bold', cellWidth: 60 },
          1: { fontStyle: 'normal', cellWidth: 30 },
          2: { fontStyle: 'bold', cellWidth: 60 },
          3: { fontStyle: 'normal', cellWidth: 30 },
        },
        body: [
          [
            labels[lang].internalDiameter, `${result.input.dInt} mm`,
            labels[lang].bottomVolume, `${formatNumPDF(result.volumeFondo, 2)} l`
          ],
          [
            labels[lang].cylinderLength, `${result.input.lCil} mm`,
            labels[lang].cylinderVolume, `${formatNumPDF(result.volumeCilindro, 2)} l`
          ],
          [
            labels[lang].totalHeight, `${result.H_tot} mm`,
            labels[lang].topVolume, `${formatNumPDF(result.volumeCoperchio, 2)} l`
          ],
          [
            labels[lang].density, `${formatNumPDF(result.input.rho, 3)} kg/dm³`,
            labels[lang].totalVolume, `${formatNumPDF(result.volumeTotale, 2)} l`
          ]
        ]
      });

      let currentY = (doc as any).lastAutoTable.finalY + 6;

      // Sheets details
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(6, 78, 59);
      doc.text(labels[lang].sheetTitle, 15, currentY);
      currentY += 3;

      autoTable(doc, {
        startY: currentY,
        margin: { left: 15, right: 15 },
        theme: 'plain',
        styles: {
          fontSize: 8,
          cellPadding: 1.8,
          textColor: [31, 41, 55],
          lineColor: [229, 231, 235],
          lineWidth: 0.1,
        },
        columnStyles: {
          0: { fontStyle: 'bold', cellWidth: 45 },
          1: { cellWidth: 45 },
          2: { fontStyle: 'bold', cellWidth: 45 },
          3: { cellWidth: 45 },
        },
        body: [
          [
            labels[lang].bottomHead, '',
            labels[lang].topHead, ''
          ],
          [
            `  • ${labels[lang].thickness}`, `${result.input.fondo.sp} mm`,
            `  • ${labels[lang].thickness}`, `${result.input.coperchio.sp} mm`
          ],
          [
            `  • ${labels[lang].development}`, `${formatNumPDF(result.fondo.Sviluppo_mm, 1)} mm`,
            `  • ${labels[lang].development}`, `${formatNumPDF(result.coperchio.Sviluppo_mm, 1)} mm`
          ],
          [
            `  • ${labels[lang].area}`, `${formatNumPDF(result.sviluppoFondoMq, 3)} m²`,
            `  • ${labels[lang].area}`, `${formatNumPDF(result.sviluppoCoperchioMq, 3)} m²`
          ],
          [
            `  • ${labels[lang].sheetWeight}`, `${formatNumPDF(result.pesoLamieraFondo, 1)} kg`,
            `  • ${labels[lang].sheetWeight}`, `${formatNumPDF(result.pesoLamieraCoperchio, 1)} kg`
          ]
        ],
        didParseCell: (data) => {
          if (data.row.index === 0) {
            data.cell.styles.fontStyle = 'bold';
            data.cell.styles.fillColor = [240, 253, 244];
            data.cell.styles.textColor = [6, 78, 59];
          }
        }
      });

      currentY = (doc as any).lastAutoTable.finalY + 6;

      // Weights & loads
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(6, 78, 59);
      doc.text(labels[lang].weightTitle, 15, currentY);
      currentY += 3;

      autoTable(doc, {
        startY: currentY,
        margin: { left: 15, right: 15 },
        theme: 'plain',
        styles: {
          fontSize: 8.5,
          cellPadding: 2,
          textColor: [31, 41, 55],
          lineColor: [229, 231, 235],
          lineWidth: 0.1,
        },
        columnStyles: {
          0: { fontStyle: 'bold', cellWidth: 60 },
          1: { cellWidth: 30 },
          2: { fontStyle: 'bold', cellWidth: 60 },
          3: { cellWidth: 30 },
        },
        body: [
          [
            labels[lang].fullWeight, `${formatNumPDF(result.pesoContenutoTotale, 1)} kg (${formatNumPDF(result.pesoContenutoTotale / 1000, 3)} t)`,
            labels[lang].weightPerCm, `${formatNumPDF(result.pesoContenutoPerCmCilindro, 2)} kg/cm`
          ]
        ]
      });

      // Signature/Stamp blocks
      const footerY = 230;
      doc.setDrawColor(209, 213, 219);
      doc.setLineWidth(0.3);

      doc.roundedRect(25, footerY, 60, 22, 1, 1, 'D');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(107, 114, 128);
      doc.text(labels[lang].stamp, 55, footerY + 5, { align: 'center' });

      doc.roundedRect(125, footerY, 60, 22, 1, 1, 'D');
      doc.text(labels[lang].signature, 155, footerY + 5, { align: 'center' });

      if (result.input.report.compilatore) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.5);
        doc.setTextColor(55, 65, 81);
        doc.text(result.input.report.compilatore, 155, footerY + 16, { align: 'center' });
      }

      if (compilerInfo?.customNote) {
        doc.setFont('helvetica', 'italic');
        doc.setFontSize(7);
        doc.setTextColor(156, 163, 175);
        doc.text(compilerInfo.customNote, 105, footerY + 28, { align: 'center' });
      }

      // Page 2+: Calibration List Table
      doc.addPage();

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.setTextColor(6, 78, 59);
      doc.text(labels[lang].tableTitle, 15, 18);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(75, 85, 99);
      doc.text(`${labels[lang].tank} ${result.input.report.nomeSerbatoio || '-'}   •   ${labels[lang].dwg} ${result.input.report.numeroDisegno || '-'}   •   ${labels[lang].capacityMax} ${formatNumPDF(result.volumeTotale, 1)} l`, 15, 23);

      const tableHeaders = [
        [
          labels[lang].colCm,
          labels[lang].colMm,
          labels[lang].colVol,
          labels[lang].colDelta
        ]
      ];

      const tableBody = listData.map((row) => {
        return [
          `${row.cm} cm`,
          `${row.mm} mm`,
          `${formatNumPDF(row.litri, 2)} l`,
          row.cm > 0 ? `${formatNumPDF(row.delta, 2)} l/cm` : '-'
        ];
      });

      autoTable(doc, {
        startY: 26,
        margin: { left: 15, right: 15, top: 20, bottom: 20 },
        head: tableHeaders,
        body: tableBody,
        theme: 'striped',
        styles: {
          fontSize: 8.5,
          cellPadding: 1.8,
          valign: 'middle',
          halign: 'center',
        },
        headStyles: {
          fillColor: [6, 78, 59],
          textColor: [255, 255, 255],
          fontSize: 9,
          fontStyle: 'bold',
        },
        columnStyles: {
          0: { halign: 'left', fontStyle: 'bold' },
          1: { halign: 'center' },
          2: { halign: 'right', fontStyle: 'bold' },
          3: { halign: 'right' },
        },
        alternateRowStyles: {
          fillColor: [249, 250, 251],
        },
        didDrawPage: (data) => {
          if (data.pageNumber > 1) {
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(10);
            doc.setTextColor(6, 78, 59);
            doc.text(labels[lang].tableTitle, 15, 13);
            
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(7.5);
            doc.setTextColor(107, 114, 128);
            doc.text(`${labels[lang].tank} ${result.input.report.nomeSerbatoio || '-'}   •   ${labels[lang].dwg} ${result.input.report.numeroDisegno || '-'}`, 15, 17);
            
            doc.setDrawColor(229, 231, 235);
            doc.setLineWidth(0.3);
            doc.line(15, 19, 195, 19);
          }
        }
      });

      // Second pass: Page numbering and consistent footer
      const totalPagesCount = doc.getNumberOfPages();
      for (let i = 1; i <= totalPagesCount; i++) {
        doc.setPage(i);
        doc.setDrawColor(229, 231, 235);
        doc.setLineWidth(0.4);
        doc.line(15, 282, 195, 282);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.5);
        doc.setTextColor(107, 114, 128);

        const emitText = `${labels[lang].emitted} ${result.input.report.data || new Date().toISOString().split('T')[0]}`;
        doc.text(emitText, 15, 287);
        doc.text('BOMB-CON TARATURA', 105, 287, { align: 'center' });

        const pageText = `${labels[lang].page} ${i} / ${totalPagesCount}`;
        doc.text(pageText, 195, 287, { align: 'right' });
      }

      // Suggested Filename Construction:
      const rawNome = result.input.report.nomeSerbatoio || 'serbatoio';
      const rawDwg = result.input.report.numeroDisegno || '';
      
      const partDesc = rawNome.slice(0, 10);
      const sanitizeName = (str: string) => {
        return str.replace(/[\/\\:*?"<>|]/g, '-').replace(/-+/g, '-');
      };
      const sanitizedDesc = sanitizeName(partDesc);
      const sanitizedDisegno = sanitizeName(rawDwg);
      let nomeFileProposto = `${sanitizedDesc}${sanitizedDisegno}`.trim();
      if (!nomeFileProposto.toLowerCase().endsWith('.pdf')) {
        nomeFileProposto += '.pdf';
      }

      const pdfBlob = doc.output('blob');

      // Standard Download
      const url = URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = nomeFileProposto;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

    } catch (err: any) {
      console.error('PDF generation error', err);
      alert(
        lang === 'en' ? `Failed to generate or save PDF: ${err.message}` :
        lang === 'es' ? `No se pudo generar o guardar el PDF: ${err.message}` :
        lang === 'de' ? `PDF konnte nicht generiert oder gespeichert werden: ${err.message}` :
        `Impossibile generare o salvare il PDF: ${err.message}`
      );
    }
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
            <button
              onClick={viewType === 'grid' ? handleExportGridCSV : handleExportListCSV}
              className="bg-white border border-neutral-300 hover:bg-neutral-50 text-neutral-700 text-[11px] font-bold py-1.5 px-2.5 rounded-lg shadow-xs flex items-center gap-1 cursor-pointer"
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
            <button
              onClick={handlePrint}
              className="bg-emerald-800 hover:bg-emerald-900 border border-emerald-950 text-white text-[11px] font-bold py-1.5 px-2.5 rounded-lg shadow-xs flex items-center gap-1 cursor-pointer"
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
            <button
              onClick={handlePrintCondensed}
              className="bg-teal-700 hover:bg-teal-800 border border-teal-900 text-white text-[11px] font-bold py-1.5 px-2.5 rounded-lg shadow-xs flex items-center gap-1 cursor-pointer"
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
