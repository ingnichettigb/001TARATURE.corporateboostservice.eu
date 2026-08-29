import { Link } from "@tanstack/react-router";
import { ArrowLeft, FileSignature } from "lucide-react";
import ConBombApp from "./ConBombApp";

/**
 * Pagina principale del modulo CON-BOMB.
 * L'applicazione importata contiene già le sezioni standard:
 * Input (TankInputForm) → Calcolo (core/logic.ts) → Output (ResultsDashboard,
 * CalibrationTable) → PDF (core/pdf.ts).
 */
export default function ModulePage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-40 flex flex-wrap items-center gap-2 border-b border-slate-200 bg-white/95 px-4 py-2 backdrop-blur print:hidden">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 rounded-md border border-emerald-700/60 bg-emerald-50 px-2.5 py-1.5 text-sm font-medium text-emerald-900 transition-colors hover:bg-emerald-100 hover:border-emerald-800"
        >
          <ArrowLeft className="h-4 w-4" />
          Menu moduli
        </Link>
        <Link
          to="/dati-comuni"
          className="inline-flex items-center gap-1.5 rounded-md border border-emerald-700/60 bg-emerald-50 px-2.5 py-1.5 text-sm font-medium text-emerald-900 transition-colors hover:bg-emerald-100 hover:border-emerald-800"
        >
          <FileSignature className="h-4 w-4" />
          Intestazione report
        </Link>
      </div>
      <ConBombApp />
    </div>
  );
}
