/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Language, translations } from '../utils/translations';
import { CalculationResult, CompilerInfo } from '../models/types';
import { getSelectedExtendedEntries, formatExtendedEntry, isMultiPrint } from './extended-validity';

export async function generateCalibrationPDF(
  result: CalculationResult,
  lang: Language = 'it',
  compilerInfo?: CompilerInfo,
  condensed: boolean = false,
  reportNumberInput?: string,
  geometryImage?: { dataUrl: string; width: number; height: number } | null
) {

  try {
    const t = translations[lang];
    const maxCm = Math.ceil(result.H_tot / 10);

    const getLocality = (address?: string) => {
      if (!address) return '';
      const parts = address.split(',');
      if (parts.length > 1) {
        return parts[parts.length - 1].trim();
      }
      return address.trim();
    };

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

    const reportNumber = reportNumberInput || (() => {
      const now = new Date();
      let yyyy = String(now.getFullYear());
      let mm = String(now.getMonth() + 1).padStart(2, '0');
      let dd = String(now.getDate()).padStart(2, '0');
      
      if (result.input.report.data) {
        const parts = result.input.report.data.split('-');
        if (parts.length === 3) {
          yyyy = parts[0];
          mm = parts[1].padStart(2, '0');
          dd = parts[2].padStart(2, '0');
        }
      }
      const hh = String(now.getHours()).padStart(2, '0');
      const min = String(now.getMinutes()).padStart(2, '0');
      return `${yyyy}${mm}${dd}${hh}${min}-01`;
    })();

    // Reconstruct listData
    const listData: { cm: number; mm: number; litri: number; delta: number }[] = [];
    for (let cm = 0; cm <= maxCm; cm++) {
      const mm = cm * 10;
      const hClamped = Math.min(mm, result.H_tot);
      const litriVal = result.litriCumulativi[hClamped] || 0;
      listData.push({
        cm,
        mm,
        litri: litriVal,
        delta: cm > 0 ? litriVal - (result.litriCumulativi[Math.min((cm - 1) * 10, result.H_tot)] || 0) : 0
      });
    }

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

    // 1. Fill background: cylindrical body + top dome + bottom cone
    const coneApexY = y_c + h_c + dome_h + 1.5;
    doc.setFillColor(240, 253, 244);
    doc.rect(x_c, y_c, w_c, h_c, 'F');
    // Top dome (bombato)
    doc.ellipse(x_c + w_c / 2, y_c, w_c / 2, dome_h, 'F');
    // Bottom cone (conico)
    doc.triangle(x_c, y_c + h_c, x_c + w_c, y_c + h_c, x_c + w_c / 2, coneApexY, 'F');

    // 2. Draw tank outlines
    doc.setDrawColor(6, 78, 59);
    doc.setLineWidth(0.4);
    // Left vertical line
    doc.line(x_c, y_c, x_c, y_c + h_c);
    // Right vertical line
    doc.line(x_c + w_c, y_c, x_c + w_c, y_c + h_c);
    // Top dome outline
    drawSemiEllipse(x_c + w_c / 2, y_c, w_c / 2, dome_h, Math.PI, 2 * Math.PI);
    // Bottom cone outlines (two slanted sides)
    doc.line(x_c, y_c + h_c, x_c + w_c / 2, coneApexY);
    doc.line(x_c + w_c, y_c + h_c, x_c + w_c / 2, coneApexY);

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
    const labelBot = lang === 'en' ? 'Conical Bottom' : lang === 'es' ? 'Fondo Cónico' : lang === 'de' ? 'Konischer Boden' : 'Fondo Conico';

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
    const y_bot = y_c + h_c + dome_h + 1.5;
    doc.setDrawColor(209, 213, 219);
    doc.setLineWidth(0.15);
    doc.line(160, y_bot, 173, y_bot);
    doc.circle(173, y_bot, 0.4, 'F');
    doc.text(labelBot, 158, y_bot + 0.8, { align: 'right' });

    // Horizontal line
    doc.setDrawColor(6, 78, 59);
    doc.setLineWidth(0.6);
    doc.line(15, 41, 205, 41);

    // Primary Title block
    doc.setTextColor(6, 78, 59);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text(labels[lang].title, 15, 49);

    // Repositioned Relation Number Box (Right of the title, aligned with right-most fields, with thin double green border)
    const reportLabelText = lang === 'en' ? 'Report No' : lang === 'es' ? 'Relación N°' : lang === 'de' ? 'Bericht Nr' : 'Relazione N';
    const boxW = 58;
    const boxX = 205 - boxW; // Aligned perfectly with the right edge at 205
    const boxY = 43;
    const boxH = 8;

    // Draw thin double vibrant green border
    doc.setDrawColor(16, 185, 129); // Vibrant green (Emerald 500)
    doc.setLineWidth(0.15);
    doc.roundedRect(boxX, boxY, boxW, boxH, 1, 1, 'D');
    doc.roundedRect(boxX + 0.4, boxY + 0.4, boxW - 0.8, boxH - 0.8, 0.8, 0.8, 'D');

    // Text inside the relation number box (larger and bold)
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(6, 78, 59);
    doc.text(`${reportLabelText}: ${reportNumber}`, boxX + boxW / 2, boxY + 5.5, { align: 'center' });

    // Meta details table
    autoTable(doc, {
      startY: 56,
      margin: { left: 15, right: 15 },
      theme: 'plain',
      tableWidth: 180,
      styles: {
        fontSize: 8,
        cellPadding: 1.5,
        textColor: [31, 41, 55],
        lineColor: [229, 231, 235],
        lineWidth: 0.1,
      },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 25 },
        1: { cellWidth: 75 },
        2: { fontStyle: 'bold', cellWidth: 30 },
        3: { cellWidth: 50 },
      },
      body: [
        [
          labels[lang].tank.toUpperCase(), result.input.report.nomeSerbatoio || '-',
          labels[lang].job.toUpperCase(), result.input.report.commessa || result.input.report.riferimento || '-'
        ],
        [
          labels[lang].customer.toUpperCase(), result.input.report.cliente || '-',
          labels[lang].factoryNo.toUpperCase(), result.input.report.numeroFabbrica || '-'
        ],
        [
          labels[lang].dwg.toUpperCase(), result.input.report.numeroDisegno || '-',
          labels[lang].tagNo.toUpperCase(), result.input.report.tagNumber || '-'
        ]

      ]
    });


    let currentY = (doc as any).lastAutoTable.finalY + 6;

    // Optional Extended validity note
    {
      const multi = isMultiPrint(result.input.report);
      const numeri = getSelectedExtendedEntries(result.input.report).map(formatExtendedEntry);
      if (multi || numeri.length > 0) {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7.5);
        doc.setTextColor(107, 114, 128);
        const labelTxt = labels[lang].extValidity.toUpperCase();
        doc.text(labelTxt, 15, currentY);
        const labelW = doc.getTextWidth(labelTxt) + 2;
        doc.setFont('helvetica', 'normal');

        if (multi) {
          doc.text('UNICO', 15 + labelW, currentY);
          currentY += 4.5;
        } else {
          let x = 15 + labelW;
          for (const numero of numeri) {
            const w = doc.getTextWidth(numero) + 9;
            if (x + w > 195) {
              x = 15 + labelW;
              currentY += 4.5;
            }
            // quadratino spuntato
            doc.setDrawColor(107, 114, 128);
            doc.setLineWidth(0.2);
            doc.rect(x, currentY - 2.6, 2.6, 2.6, 'S');
            doc.setLineWidth(0.35);
            doc.line(x + 0.5, currentY - 1.4, x + 1.1, currentY - 0.5);
            doc.line(x + 1.1, currentY - 0.5, x + 2.2, currentY - 2.3);
            doc.text(numero, x + 4, currentY);
            x += w;
          }
          currentY += 4.5;
        }
      }
    }


    // ---- Pagina 1: Configurazione geometrica (schema in scala) ----
    if (geometryImage) {
      const geoTitle = lang === 'en' ? 'Geometric Configuration' : lang === 'es' ? 'Configuración Geométrica' : lang === 'de' ? 'Geometrische Konfiguration' : 'Configurazione Geometrica';
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(6, 78, 59);
      doc.text(geoTitle, 15, currentY);

      const areaTop = currentY + 3;
      const areaBottom = 226; // sopra il blocco firme (footerY = 232)
      const maxW = 180;
      const maxH = areaBottom - areaTop;
      const ratio = geometryImage.height / geometryImage.width;
      let imgW = maxW;
      let imgH = imgW * ratio;
      if (imgH > maxH) {
        imgH = maxH;
        imgW = imgH / ratio;
      }
      const imgX = 15 + (maxW - imgW) / 2;
      const imgY = areaTop + (maxH - imgH) / 2;
      try {
        doc.addImage(geometryImage.dataUrl, 'PNG', imgX, imgY, imgW, imgH);
        doc.setDrawColor(6, 78, 59);
        doc.setLineWidth(0.3);
        doc.rect(imgX - 1.5, imgY - 1.5, imgW + 3, imgH + 3, 'S');
      } catch (e) {
        console.error('Impossibile inserire lo schema geometrico nel PDF', e);
      }
    }

    // ---- Pagina 2: Dati Geometrici e Strutturali (misure interne) ----
    doc.addPage();
    let techY = 20;
    const techTitleFull = labels[lang].techTitle + (lang === 'en' ? ' (internal measurements)' : lang === 'es' ? ' (medidas internas)' : lang === 'de' ? ' (Innenmaße)' : ' (misure interne)');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(6, 78, 59);
    doc.text(techTitleFull, 15, techY);
    techY += 3;


    const grpTop = lang === 'en' ? 'top head' : lang === 'es' ? 'cúpula sup.' : lang === 'de' ? 'obere Kuppe' : 'coperchio bombato';
    const grpCyl = lang === 'en' ? 'cylindrical section' : lang === 'es' ? 'sección cilíndrica' : lang === 'de' ? 'Zylinderteil' : 'sezione cilindrica';
    const grpCon = lang === 'en' ? 'conical bottom' : lang === 'es' ? 'fondo cónico' : lang === 'de' ? 'Konischer Boden' : 'fondo conico';
    const grpAll = lang === 'en' ? 'Top + cylindrical part + bottom' : lang === 'es' ? 'Cúpula + parte cilíndrica + fondo' : lang === 'de' ? 'Deckel + Zylinderteil + Boden' : 'Coperchio + parte cilindrica + fondo';

    const lblRoggio = lang === 'en' ? 'Dish Radius (R_custom) (mm)' : lang === 'es' ? 'Radio Bombeo (R_custom) (mm)' : lang === 'de' ? 'Wölbradius (R_custom) (mm)' : 'Raggio Bombatura (R_custom) (mm)';
    const lblToro = lang === 'en' ? 'Knuckle Radius (r_custom) (mm)' : lang === 'es' ? 'Radio Toro Raccordo (r_custom) (mm)' : lang === 'de' ? 'Krempenradius (r_custom) (mm)' : 'Raggio Toro Raccordo (r_custom) (mm)';
    const lblColletto = lang === 'en' ? 'Collar Height (h_colletto)' : lang === 'es' ? 'Altura Collarín (h_colletto)' : lang === 'de' ? 'Kragenhöhe (h_colletto)' : 'Altezza Colletto (h_colletto)';
    const lblSviluppo = lang === 'en' ? 'Sheet Unrolling Development' : lang === 'es' ? 'Desarrollo Desenrollado Chapa' : lang === 'de' ? 'Blechabwicklung' : 'Sviluppo Srotolamento Lamiera';
    const lblVolCyl = lang === 'en' ? 'Cylindrical Section Volume' : lang === 'es' ? 'Volumen Parte Cilíndrica' : lang === 'de' ? 'Volumen Zylinderteil' : 'Volume parte cilindrica';
    const lblHcono = lang === 'en' ? 'Cone Height incl. collar (h_cono) (mm)' : lang === 'es' ? 'Altura Cono con collarín (h_cono) (mm)' : lang === 'de' ? 'Konushöhe inkl. Kragen (h_cono) (mm)' : 'Altezza Cono compresa di colletto (h_cono) (mm)';
    const lblGradi = lang === 'en' ? 'Inclination Degrees (°)' : lang === 'es' ? 'Grados de Inclinación (°)' : lang === 'de' ? 'Neigungswinkel (°)' : 'Gradi di Inclinazione (°)';
    const lblRracc = lang === 'en' ? 'Fillet Radius (r_raccordo)' : lang === 'es' ? 'Radio Empalme (r_raccordo)' : lang === 'de' ? 'Verrundungsradius (r_raccordo)' : 'Raggio Raccordo (r_raccordo)';
    const lblPesoTotLam = lang === 'en' ? 'Total Sheet Metal Weight' : lang === 'es' ? 'Peso Total Chapa' : lang === 'de' ? 'Gesamtes Blechgewicht' : 'Peso totale lamiera';
    const lblPesoPieno = lang === 'en' ? 'Weight with Full Content' : lang === 'es' ? 'Peso con Contenido Lleno' : lang === 'de' ? 'Gewicht bei Vollfüllung' : 'Peso con Contenuto Pieno';

    const cop = result.input.coperchio;
    const fon = result.input.fondo;
    const R_cop = result.coperchio.R;
    const r_cop = result.coperchio.r;
    const pesoTotLamiera = result.pesoLamieraFondo + result.pesoLamieraCoperchio;

    const body: any[] = [
      // coperchio bombato
      [grpTop, labels[lang].internalDiameter.replace(':',''), `${result.input.dInt} mm`],
      [grpTop, labels[lang].thickness.replace(':',''), `${cop.sp} mm`],
      [grpTop, lblRoggio, `${formatNumPDF(R_cop, 1)} mm`],
      [grpTop, lblToro, `${formatNumPDF(r_cop, 1)} mm`],
      [grpTop, lblColletto, `${cop.hColletto} mm`],
      [grpTop, labels[lang].topVolume.replace(':',''), `${formatNumPDF(result.volumeCoperchio, 2)} l`],
      [grpTop, labels[lang].sheetWeight.replace(':',''), `${formatNumPDF(result.pesoLamieraCoperchio, 1)} kg`],
      // sezione cilindrica
      [grpCyl, labels[lang].cylinderLength.replace(':',''), `${result.input.lCil} mm`],
      [grpCyl, labels[lang].thickness.replace(':',''), `${cop.sp} mm`],
      [grpCyl, lblSviluppo, `${formatNumPDF(Math.PI * result.input.dInt, 1)} mm`],
      [grpCyl, lblVolCyl, `${formatNumPDF(result.volumeCilindro, 2)} l`],
      [grpCyl, labels[lang].sheetWeight.replace(':',''), `${formatNumPDF(Math.PI * result.input.dInt * result.input.lCil * cop.sp * 8 / 1e6, 1)} kg`],
      // fondo conico
      [grpCon, lblHcono, `${formatNumPDF(fon.hCono ?? 0, 1)} mm`],
      [grpCon, lblGradi, `${formatNumPDF(result.fondo.alfa, 2)} °`],
      [grpCon, lblRracc, `${formatNumPDF(fon.rRaccordo ?? 0, 1)} mm`],
      [grpCon, lblColletto, `${fon.hColletto} mm`],
      [grpCon, labels[lang].thickness.replace(':',''), `${fon.sp} mm`],
      [grpCon, labels[lang].bottomVolume.replace(':',''), `${formatNumPDF(result.volumeFondo, 2)} l`],
      [grpCon, labels[lang].sheetWeight.replace(':',''), `${formatNumPDF(result.pesoLamieraFondo, 1)} kg`],
      // coperchio + virole + fondo
      [grpAll, labels[lang].totalHeight.replace(':',''), `${result.H_tot} mm`],
      [grpAll, labels[lang].density.replace(':',''), `${formatNumPDF(result.input.rho, 3)} kg/dm³`],
      [grpAll, labels[lang].totalVolume.replace(':',''), `${formatNumPDF(result.volumeTotale, 2)} l`],
      [grpAll, lblPesoTotLam, `${formatNumPDF(pesoTotLamiera, 1)} kg`],
      [grpAll, lblPesoPieno, `${formatNumPDF(result.pesoContenutoTotale, 1)} kg (${formatNumPDF(result.pesoContenutoTotale / 1000, 3)} t)`],
    ];

    const groupBounds: Record<string, { x1: number; y1: number; x2: number; y2: number }> = {};

    autoTable(doc, {
      startY: techY,
      margin: { left: 15, right: 15 },
      theme: 'plain',
      styles: {
        fontSize: 7.2,
        cellPadding: 1.0,
        textColor: [31, 41, 55],
        lineColor: [229, 231, 235],
        lineWidth: 0.1,
      },
      columnStyles: {
        0: { fontStyle: 'italic', cellWidth: 50, textColor: [107, 114, 128] },
        1: { fontStyle: 'bold', cellWidth: 90 },
        2: { fontStyle: 'normal', cellWidth: 40, halign: 'right' },
      },
      body,
      didParseCell: (data) => {
        const raw = data.row.raw as any[];
        const label = raw[1];
        // Show the group label only on the first row of each group
        if (data.section === 'body' && data.column.index === 0) {
          const grp = raw[0] as string;
          const firstIdx = body.findIndex((r) => r[0] === grp);
          if (data.row.index !== firstIdx) {
            data.cell.text = [''];
          }
        }
        // Bold every volume row (label and value)
        if (typeof label === 'string' && /volum/i.test(label)) {
          if (data.column.index > 0) {
            data.cell.styles.fontStyle = 'bold';
          }
          if (label === labels[lang].totalVolume.replace(':', '')) {
            data.cell.styles.textColor = [6, 78, 59];
          }
        }
      },
      didDrawCell: (data) => {
        if (data.section !== 'body') return;
        const grp = (data.row.raw as any[])[0] as string;
        const b = groupBounds[grp];
        const { x, y, width, height } = data.cell;
        if (!b) {
          groupBounds[grp] = { x1: x, y1: y, x2: x + width, y2: y + height };
        } else {
          b.x1 = Math.min(b.x1, x);
          b.y1 = Math.min(b.y1, y);
          b.x2 = Math.max(b.x2, x + width);
          b.y2 = Math.max(b.y2, y + height);
        }
      },
    });

    // Group outlines: double thin electric-green frame, olive-green single for the summary group
    Object.entries(groupBounds).forEach(([grp, b]) => {
      const isSummary = grp === grpAll;
      doc.setLineWidth(0.2);
      if (isSummary) {
        doc.setDrawColor(85, 107, 47); // dark olive green
        doc.rect(b.x1, b.y1, b.x2 - b.x1, b.y2 - b.y1, 'S');
      } else {
        doc.setDrawColor(0, 200, 83); // electric green
        doc.rect(b.x1, b.y1, b.x2 - b.x1, b.y2 - b.y1, 'S');
        doc.rect(b.x1 + 0.6, b.y1 + 0.6, b.x2 - b.x1 - 1.2, b.y2 - b.y1 - 1.2, 'S');
      }
    });


    // Signature/Stamp blocks — sempre in fondo alla PRIMA pagina
    doc.setPage(1);
    const footerY = 232;

    doc.setDrawColor(209, 213, 219);
    doc.setLineWidth(0.3);

    doc.roundedRect(25, footerY, 60, 22, 1, 1, 'D');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(107, 114, 128);
    doc.text(labels[lang].stamp, 55, footerY + 5, { align: 'center' });

    doc.roundedRect(125, footerY, 60, 22, 1, 1, 'D');
    doc.text(labels[lang].signature, 155, footerY + 5, { align: 'center' });

    const labelText = lang === 'en' ? 'Place and date:' : lang === 'es' ? 'Lugar y fecha:' : lang === 'de' ? 'Ort und Datum:' : 'Luogo e data:';
    const locality = getLocality(compilerInfo?.indirizzo) || '-';
    const formattedDate = formatDateToIT(result.input.report.data);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(31, 41, 55);
    doc.text(labelText, 105, footerY + 6, { align: 'center' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text(locality, 105, footerY + 11, { align: 'center' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text(formattedDate, 105, footerY + 16, { align: 'center' });

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

    // Torna sull'ultima pagina prima di aggiungere le tabelle di taratura
    doc.setPage(doc.getNumberOfPages());

    // Pagine successive: tabella di taratura

    if (condensed) {
      const blockHeader = [
        labels[lang].colCm,
        labels[lang].colMm,
        labels[lang].colVol,
        labels[lang].colDelta,
      ];
      const condensedHeaders = [
        [...blockHeader, '', ...blockHeader, '', ...blockHeader]
      ];

      const rowsPerPage = 38;
      const blocks = 3;
      const totalRows = listData.length;
      const pagesNeeded = Math.ceil(totalRows / (rowsPerPage * blocks));

      const spacerCols = [4, 9];
      const blockStartCols = [0, 5, 10];
      const blockEndCols = [3, 8, 13];

      for (let p = 0; p < pagesNeeded; p++) {
        doc.addPage();

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12);
        doc.setTextColor(6, 78, 59);
        doc.text(labels[lang].tableTitle, 15, 18);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8.5);
        doc.setTextColor(75, 85, 99);
        doc.text(`${labels[lang].tank} ${result.input.report.nomeSerbatoio || '-'}   •   ${labels[lang].dwg} ${result.input.report.numeroDisegno || '-'}   •   ${labels[lang].capacityMax} ${formatNumPDF(result.volumeTotale, 1)} l`, 15, 23);

        const pageStart = p * (rowsPerPage * blocks);

        const pageBody: any[] = [];
        const pageCm: (number | null)[][] = [];
        for (let r = 0; r < rowsPerPage; r++) {
          const idxs = [0, 1, 2].map((b) => pageStart + b * rowsPerPage + r);
          if (idxs.every((i) => i >= totalRows)) break;

          const cells: string[] = [];
          const cmRow: (number | null)[] = [];
          idxs.forEach((idx, b) => {
            const row = idx < totalRows ? listData[idx] : null;
            if (b > 0) cells.push(''); // spacer
            cells.push(row ? `${row.cm}` : '');
            cells.push(row ? `${row.mm}` : '');
            cells.push(row ? `${formatNumPDF(row.litri, 2)}` : '');
            cells.push(row ? (row.cm > 0 ? `${formatNumPDF(row.delta, 2)}` : '-') : '');
            cmRow.push(row ? row.cm : null);
          });
          pageBody.push(cells);
          pageCm.push(cmRow);
        }


        const blockColStyles: any = {};
        blockStartCols.forEach((s) => {
          blockColStyles[s] = { halign: 'left', fontStyle: 'bold', cellWidth: 13 };
          blockColStyles[s + 1] = { halign: 'center', cellWidth: 13 };
          blockColStyles[s + 2] = { halign: 'right', fontStyle: 'bold', cellWidth: 18 };
          blockColStyles[s + 3] = { halign: 'right', cellWidth: 14 };
        });
        spacerCols.forEach((c) => {
          blockColStyles[c] = { cellWidth: 3, fillColor: [255, 255, 255] };
        });

        autoTable(doc, {
          startY: 26,
          margin: { left: 15, right: 15 },
          head: condensedHeaders,
          body: pageBody,
          theme: 'striped',
          styles: {
            fontSize: 7,
            cellPadding: 1.4,
            valign: 'middle',
            halign: 'center',
          },
          headStyles: {
            fillColor: [6, 78, 59],
            textColor: [255, 255, 255],
            fontSize: 7,
            fontStyle: 'bold',
          },
          columnStyles: blockColStyles,
          alternateRowStyles: {
            fillColor: [220, 245, 235],
          },
          didParseCell: (data) => {
            if (spacerCols.includes(data.column.index)) {
              data.cell.styles.fillColor = [255, 255, 255];
              if (data.section === 'head') {
                data.cell.styles.lineWidth = 0;
              }
              return;
            }
            if (data.section === 'body') {
              const col = data.column.index;
              const b = col < 4 ? 0 : col < 9 ? 1 : 2;
              const cm = pageCm[data.row.index]?.[b];
              if (cm === null || cm === undefined) return;
              const blockNumber = Math.floor(cm / 100) + 1;
              const isEvenBlock = blockNumber % 2 === 0;
              const odd = data.row.index % 2 === 1;
              if (isEvenBlock) {
                data.cell.styles.fillColor = odd ? [130, 200, 165] : [255, 255, 255];
              } else {
                data.cell.styles.fillColor = odd ? [220, 245, 235] : [255, 255, 255];
              }
            }
          },

          didDrawCell: (data) => {
            const col = data.column.index;
            const x = data.cell.x;
            const y = data.cell.y;
            const w = data.cell.width;
            const h = data.cell.height;

            doc.setDrawColor(16, 185, 129);
            doc.setLineWidth(0.15);

            if (blockStartCols.includes(col)) {
              doc.line(x - 0.2, y, x - 0.2, y + h);
              doc.line(x + 0.2, y, x + 0.2, y + h);
            }
            if (blockEndCols.includes(col)) {
              const rx = x + w;
              doc.line(rx - 0.2, y, rx - 0.2, y + h);
              doc.line(rx + 0.2, y, rx + 0.2, y + h);
            }

            // Top double horizontal line
            if (data.section === 'head' && !spacerCols.includes(col)) {
              doc.line(x, y - 0.2, x + w, y - 0.2);
              doc.line(x, y + 0.2, x + w, y + 0.2);
            }
          }
        });

        // Bottom double horizontal line
        const finalY = (doc as any).lastAutoTable.finalY;
        if (finalY) {
          doc.setDrawColor(16, 185, 129);
          doc.setLineWidth(0.15);
          const blockRanges = [[15, 73], [76, 134], [137, 195]];
          blockRanges.forEach(([x1, x2]) => {
            doc.line(x1, finalY - 0.2, x2, finalY - 0.2);
            doc.line(x1, finalY + 0.2, x2, finalY + 0.2);
          });
        }
      }
    } else {
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
          fillColor: [220, 245, 235],
        },
        didParseCell: (data) => {
          if (data.section !== 'body') return;
          const cm = listData[data.row.index]?.cm;
          if (cm === undefined) return;
          const blockNumber = Math.floor(cm / 100) + 1;
          const isEvenBlock = blockNumber % 2 === 0;
          const odd = data.row.index % 2 === 1;
          if (isEvenBlock) {
            data.cell.styles.fillColor = odd ? [130, 200, 165] : [255, 255, 255];
          } else {
            data.cell.styles.fillColor = odd ? [220, 245, 235] : [255, 255, 255];
          }
        },

        didDrawCell: (data) => {
          const col = data.column.index;
          const x = data.cell.x;
          const y = data.cell.y;
          const w = data.cell.width;
          const h = data.cell.height;

          // Electric green vertical lines
          doc.setDrawColor(16, 185, 129);
          doc.setLineWidth(0.15);

          // Table Left Edge
          if (col === 0) {
            doc.line(x - 0.2, y, x - 0.2, y + h);
            doc.line(x + 0.2, y, x + 0.2, y + h);
          }
          // Table Right Edge
          if (col === 3) {
            const rx = x + w;
            doc.line(rx - 0.2, y, rx - 0.2, y + h);
            doc.line(rx + 0.2, y, rx + 0.2, y + h);
          }

          // Top double horizontal line
          if (data.section === 'head') {
            doc.line(x, y - 0.2, x + w, y - 0.2);
            doc.line(x, y + 0.2, x + w, y + 0.2);
          }
        },
        didDrawPage: (data) => {


          // Double bottom horizontal line for the page
          const finalY = data.cursor?.y || data.table?.finalY;
          if (finalY) {
            doc.setDrawColor(16, 185, 129);
            doc.setLineWidth(0.15);
            doc.line(15, finalY - 0.2, 195, finalY - 0.2);
            doc.line(15, finalY + 0.2, 195, finalY + 0.2);
          }
        }
      });
    }

    // Second pass: header (from page 2 onward), page numbering and consistent footer
    const totalPagesCount = doc.getNumberOfPages();
    for (let i = 1; i <= totalPagesCount; i++) {
      doc.setPage(i);

      if (i > 1) {
        // Intestazione comune a tutte le pagine successive alla prima
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12);
        doc.setTextColor(6, 78, 59);
        doc.text(labels[lang].tableTitle, 15, 14);

        const hBoxW = 52;
        const hBoxX = 195 - hBoxW;
        const hBoxY = 8;
        const hBoxH = 8;
        doc.setDrawColor(16, 185, 129);
        doc.setLineWidth(0.15);
        doc.roundedRect(hBoxX, hBoxY, hBoxW, hBoxH, 1, 1, 'D');
        doc.roundedRect(hBoxX + 0.4, hBoxY + 0.4, hBoxW - 0.8, hBoxH - 0.8, 0.8, 0.8, 'D');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.setTextColor(6, 78, 59);
        doc.text(`${reportLabelText}: ${reportNumber}`, hBoxX + hBoxW / 2, hBoxY + 5.5, { align: 'center' });

        doc.setDrawColor(6, 78, 59);
        doc.setLineWidth(0.4);
        doc.line(15, 19, 195, 19);
      }

      doc.setDrawColor(229, 231, 235);
      doc.setLineWidth(0.4);
      doc.line(15, 282, 195, 282);


      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(107, 114, 128);

      const emitText = `${labels[lang].emitted} ${result.input.report.data || new Date().toISOString().split('T')[0]}`;
      doc.text(emitText, 15, 287);
      doc.text('BOMB-CON Taratura', 105, 287, { align: 'center' });

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
    if (isMultiPrint(result.input.report) && result.input.report.numeroFabbrica) {
      nomeFileProposto += `-${sanitizeName(result.input.report.numeroFabbrica)}`;
    }
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
}
