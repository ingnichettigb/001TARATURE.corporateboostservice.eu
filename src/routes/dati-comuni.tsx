import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, FileSignature } from "lucide-react";
import ReportHeaderForm from "@/common/report-header/ReportHeaderForm";
import { useReportHeader } from "@/common/report-header/useReportHeader";
import { useAppLanguage } from "@/common/language/useAppLanguage";
import { tr } from "@/common/language/ui-i18n";

export const Route = createFileRoute("/dati-comuni")({
  head: () => ({
    meta: [
      { title: "Dati Comuni — Intestazione report | TARATURA SERBATOI" },
      {
        name: "description",
        content:
          "Compila una sola volta i dati dell'intestazione report: ragione sociale, P.IVA, contatti, logo e note. Validi per tutti i moduli di taratura.",
      },
      { property: "og:title", content: "Dati Comuni — Intestazione report" },
      {
        property: "og:description",
        content:
          "Dati aziendali condivisi da tutti i sottoprogrammi di taratura serbatoi: si compilano una volta sola.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: DatiComuniPage,
});

function DatiComuniPage() {
  const { header, update } = useReportHeader();
  const lang = useAppLanguage();

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 border-b border-border bg-card/95 backdrop-blur">
        <div className="mx-auto flex max-w-3xl flex-wrap items-center gap-3 px-4 py-3">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 rounded-md border border-emerald-700 bg-emerald-100 px-2.5 py-1.5 text-sm font-bold text-black transition-colors hover:bg-emerald-200"
          >
            <ArrowLeft className="h-4 w-4" />
            {tr("menu", lang)}
          </Link>
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-lg font-semibold tracking-tight text-foreground">
              {tr("commonPageTitle", lang)}
            </h1>
            <p className="truncate text-sm text-muted-foreground">
              {tr("commonPageSub", lang)}
            </p>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-2.5 py-1 text-xs font-semibold uppercase tracking-wide text-secondary-foreground">
            <FileSignature className="h-3.5 w-3.5" />
            {tr("commonBadge", lang)}
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-6">
        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <ReportHeaderForm info={header} onSave={update} saveLabel={tr("saveCommon", lang)} />
        </div>
        <p className="mt-6 text-xs text-muted-foreground">
          I dati sono memorizzati localmente nel browser e vengono richiamati automaticamente dai
          moduli in <code>src/modules/</code>. Il codice comune vive in{" "}
          <code>src/shared/report-header/</code>.
        </p>
      </main>
    </div>
  );
}
