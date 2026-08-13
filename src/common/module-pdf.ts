import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import type { FieldDef, ModuleCalcOutput, ModuleValues } from "./module-types";

interface ExportArgs {
  title: string;
  subtitle?: string;
  fields: FieldDef[];
  values: ModuleValues;
  output: ModuleCalcOutput;
  footerNote?: string;
}

/** Generatore PDF condiviso dai moduli che non hanno un PDF dedicato. */
export function exportModulePdf({
  title,
  subtitle,
  fields,
  values,
  output,
  footerNote,
}: ExportArgs) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const date = new Date().toLocaleDateString("it-IT");

  doc.setFontSize(16);
  doc.text(`TARATURA SERBATOI — ${title}`, 14, 18);
  doc.setFontSize(10);
  doc.setTextColor(110);
  if (subtitle) doc.text(subtitle, 14, 25);
  doc.text(`Data: ${date}`, 14, subtitle ? 31 : 25);
  doc.setTextColor(0);

  autoTable(doc, {
    startY: subtitle ? 38 : 32,
    head: [["Dato di input", "Valore", "Unità"]],
    body: fields.map((f) => [f.label, String(values[f.key] ?? "—"), f.unit ?? ""]),
    styles: { fontSize: 9 },
    headStyles: { fillColor: [30, 58, 92] },
  });

  autoTable(doc, {
    head: [["Risultato", "Valore", "Unità"]],
    body: output.summary.map((r) => [r.label, String(r.value), r.unit ?? ""]),
    styles: { fontSize: 9 },
    headStyles: { fillColor: [30, 58, 92] },
  });

  if (output.table) {
    autoTable(doc, {
      head: [output.table.columns],
      body: output.table.rows.map((r) => r.map((c) => String(c))),
      styles: { fontSize: 8 },
      headStyles: { fillColor: [64, 88, 120] },
    });
  }

  if (footerNote) {
    const y = (doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? 60;
    doc.setFontSize(8);
    doc.setTextColor(110);
    doc.text(footerNote, 14, y + 8, { maxWidth: 180 });
  }

  doc.save(`${title.toLowerCase().replace(/\s+/g, "-")}-${date.replace(/\//g, "-")}.pdf`);
}
