import { useMemo, useState } from "react";
import { Calculator, ClipboardList, FileText, Table2 } from "lucide-react";
import ModuleShell from "./ModuleShell";
import SectionCard from "./SectionCard";
import FieldGrid from "./FieldGrid";
import ResultView from "./ResultView";
import PdfExportButton from "./PdfExportButton";
import type { ModuleCalcOutput, ModuleDefinition, ModuleLogic, ModuleValues } from "@/lib/module-types";

interface ModuleTemplatePageProps {
  definition: ModuleDefinition;
  logic: ModuleLogic;
}

/**
 * Pagina standard di un modulo: Input → Calcolo → Output → PDF.
 * Identica per tutti i sottoprogrammi; cambia solo il `logic` passato.
 */
export function ModuleTemplatePage({ definition, logic }: ModuleTemplatePageProps) {
  const fields = useMemo(() => logic.getInputSchema(), [logic]);
  const [values, setValues] = useState<ModuleValues>(() =>
    Object.fromEntries(fields.map((f) => [f.key, f.defaultValue ?? ""])),
  );
  const [output, setOutput] = useState<ModuleCalcOutput | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (key: string, value: number | string) => {
    setValues((prev) => ({ ...prev, [key]: value }));
  };

  const handleCalculate = () => {
    try {
      setError(null);
      setOutput(logic.calculate(values));
    } catch (e) {
      setOutput(null);
      setError(e instanceof Error ? e.message : "Errore di calcolo");
    }
  };

  return (
    <ModuleShell
      title={definition.title}
      subtitle={definition.subtitle}
      badge={definition.status === "active" ? "Attivo" : "In preparazione"}
    >
      <SectionCard
        step={1}
        title="Input"
        description="Dati geometrici e di progetto"
        icon={<ClipboardList className="h-4 w-4" />}
      >
        <FieldGrid fields={fields} values={values} onChange={handleChange} />
      </SectionCard>

      <SectionCard
        step={2}
        title="Calcolo"
        description="Esegue il cuore logico del modulo (core/logic.ts)"
        icon={<Calculator className="h-4 w-4" />}
      >
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={handleCalculate}
            className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
          >
            <Calculator className="h-4 w-4" />
            Calcola
          </button>
          <button
            type="button"
            onClick={() => {
              setOutput(null);
              setError(null);
              setValues(Object.fromEntries(fields.map((f) => [f.key, f.defaultValue ?? ""])));
            }}
            className="rounded-md border border-border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Azzera
          </button>
          {error ? <span className="text-sm font-medium text-destructive">{error}</span> : null}
        </div>
      </SectionCard>

      <SectionCard
        step={3}
        title="Output"
        description="Risultati e tabella di taratura"
        icon={<Table2 className="h-4 w-4" />}
      >
        <ResultView output={output} />
      </SectionCard>

      <SectionCard
        step={4}
        title="PDF"
        description="Documento riepilogativo del calcolo"
        icon={<FileText className="h-4 w-4" />}
      >
        <PdfExportButton
          title={definition.title}
          subtitle={definition.subtitle}
          fields={fields}
          values={values}
          output={output}
          footerNote={logic.getPdfFooterNote?.()}
        />
      </SectionCard>
    </ModuleShell>
  );
}

export default ModuleTemplatePage;
