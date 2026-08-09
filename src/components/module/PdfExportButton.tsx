import { FileDown } from "lucide-react";
import type { ModuleCalcOutput, ModuleValues, FieldDef } from "@/lib/module-types";
import { exportModulePdf } from "@/lib/module-pdf";

interface PdfExportButtonProps {
  title: string;
  subtitle?: string;
  fields: FieldDef[];
  values: ModuleValues;
  output: ModuleCalcOutput | null;
  footerNote?: string;
  disabled?: boolean;
}

/** Esportazione PDF standard, uguale per tutti i moduli. */
export function PdfExportButton({
  title,
  subtitle,
  fields,
  values,
  output,
  footerNote,
  disabled,
}: PdfExportButtonProps) {
  const isDisabled = disabled || !output;
  return (
    <button
      type="button"
      disabled={isDisabled}
      onClick={() => {
        if (!output) return;
        exportModulePdf({ title, subtitle, fields, values, output, footerNote });
      }}
      className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
    >
      <FileDown className="h-4 w-4" />
      Genera PDF
    </button>
  );
}

export default PdfExportButton;
