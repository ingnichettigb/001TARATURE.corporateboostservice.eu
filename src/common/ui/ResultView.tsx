import type { ModuleCalcOutput } from "@/lib/module-types";

/** Riepilogo + tabella risultati, identici in ogni modulo. */
export function ResultView({ output }: { output: ModuleCalcOutput | null }) {
  if (!output) {
    return (
      <p className="rounded-lg border border-dashed border-border px-4 py-6 text-center text-sm text-muted-foreground">
        Nessun risultato: compila l'input ed esegui il calcolo.
      </p>
    );
  }

  return (
    <div className="space-y-5">
      {output.summary.length > 0 ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {output.summary.map((row) => (
            <div
              key={row.label}
              className={`rounded-lg border px-3 py-2.5 ${
                row.highlight
                  ? "border-primary/40 bg-primary/5"
                  : "border-border bg-muted/40"
              }`}
            >
              <div className="text-xs uppercase tracking-wide text-muted-foreground">
                {row.label}
              </div>
              <div className="mt-0.5 text-lg font-semibold tabular-nums text-foreground">
                {row.value}
                {row.unit ? (
                  <span className="ml-1 text-sm font-normal text-muted-foreground">{row.unit}</span>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      ) : null}

      {output.table ? (
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead className="bg-muted">
              <tr>
                {output.table.columns.map((c) => (
                  <th key={c} className="px-3 py-2 text-left font-semibold text-foreground">
                    {c}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {output.table.rows.map((r, i) => (
                <tr key={i} className="border-t border-border">
                  {r.map((cell, j) => (
                    <td key={j} className="px-3 py-1.5 tabular-nums text-foreground">
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      {output.notes && output.notes.length > 0 ? (
        <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
          {output.notes.map((n, i) => (
            <li key={i}>{n}</li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

export default ResultView;
