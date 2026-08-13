import { Link } from "@tanstack/react-router";
import { ArrowLeft, FileSignature } from "lucide-react";
import BombConApp from "./BombConApp";

/**
 * Pagina principale del modulo BOMB-CON.
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
          className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 px-2.5 py-1.5 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Menu moduli
        </Link>
        <Link
          to="/dati-comuni"
          className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 px-2.5 py-1.5 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900"
        >
          <FileSignature className="h-4 w-4" />
          Intestazione report
        </Link>
      </div>
      <BombConApp />
    </div>
  );
}
