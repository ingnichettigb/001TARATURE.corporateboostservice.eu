import { useNavigate } from "@tanstack/react-router";
import { AlertTriangle, X } from "lucide-react";
import { moduleIdForTankType, moduleTitleForTankType } from "./file";

interface Props {
  open: boolean;
  fileTankType: string;
  currentTankType: string;
  onClose: () => void;
  /** Carica comunque i dati nel modulo corrente. */
  onLoadAnyway?: () => void;
}

export default function ImportMismatchDialog({
  open,
  fileTankType,
  currentTankType,
  onClose,
  onLoadAnyway,
}: Props) {
  const navigate = useNavigate();
  if (!open) return null;

  const targetId = moduleIdForTankType(fileTankType);
  const targetTitle = moduleTitleForTankType(fileTankType) ?? fileTankType;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-xl border border-amber-300 bg-white p-5 shadow-xl">
        <div className="mb-3 flex items-start gap-2">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
          <div className="min-w-0">
            <h3 className="text-sm font-bold text-neutral-900">
              Tipologia serbatoio non corrispondente
            </h3>
            <p className="mt-1 text-xs text-neutral-600">
              Attenzione: questo file appartiene al serbatoio tipo{" "}
              <strong>{fileTankType}</strong>, ma ti trovi nel modulo{" "}
              <strong>{currentTankType}</strong>.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="ml-auto rounded p-1 text-neutral-400 hover:bg-neutral-100"
            title="Chiudi"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-4 flex flex-wrap justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-neutral-300 px-3 py-2 text-xs font-semibold text-neutral-700 hover:bg-neutral-50"
          >
            Annulla
          </button>
          {onLoadAnyway && (
            <button
              type="button"
              onClick={onLoadAnyway}
              className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-800 hover:bg-amber-100"
            >
              Carica comunque
            </button>
          )}
          {targetId && (
            <button
              type="button"
              onClick={() =>
                navigate({
                  to: "/moduli/$moduleId",
                  params: { moduleId: targetId },
                })
              }
              className="rounded-lg bg-emerald-700 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-800"
            >
              Apri modulo {targetTitle}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
