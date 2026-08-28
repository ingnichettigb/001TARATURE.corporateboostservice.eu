import { useCallback, useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { getPdfExportsStatus, decrementPdfExports } from "@/lib/license.functions";
import { PUK_ID_KEY } from "@/lib/app-config";
import { usePdfExportsExhaustedDialog } from "@/components/pdf-exports-exhausted-dialog";

export type ExportKind = "pdf" | "csv";

/**
 * GESTIONE CENTRALIZZATA DELLE ESPORTAZIONI (PDF + CSV).
 *
 * Regole:
 * - Ogni PDF generato (da uno qualsiasi dei 4 pulsanti) consuma 1 esportazione.
 * - PDF e CSV appartenenti allo STESSO ciclo contano come UNA sola esportazione:
 *   - CSV poi PDF  → 1 sola esportazione;
 *   - PDF poi CSV  → il CSV è gratuito una sola volta.
 * - Quando il ciclo è completo (PDF + CSV usati) si apre un nuovo ciclo:
 *   l'esportazione successiva scala di nuovo il contatore.
 * - Con contatore a 0 ogni esportazione è bloccata e viene mostrato il dialog
 *   esistente di quota esaurita.
 * - Il valore è persistito lato server (puk_codes.pdf_exports_remaining),
 *   per singola PUK: non è condiviso tra le PUK della stessa licenza.
 */
export function useExportQuota() {
  const [remaining, setRemaining] = useState<number | null>(null);
  const [showLastExportWarning, setShowLastExportWarning] = useState(false);
  const fetchStatus = useServerFn(getPdfExportsStatus);
  const decrement = useServerFn(decrementPdfExports);
  const { showExhausted, dialog } = usePdfExportsExhaustedDialog();

  // Ciclo corrente: quali tipi sono già stati esportati senza scalare di nuovo.
  const cycle = useRef<{ pdf: boolean; csv: boolean }>({ pdf: false, csv: false });
  const inFlight = useRef(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const pukId = window.localStorage.getItem(PUK_ID_KEY);
    if (!pukId) return;
    fetchStatus({ data: { pukId } })
      .then(({ remaining: r }) => {
        setRemaining(r);
        setShowLastExportWarning(r === 1);
      })
      .catch((err) => console.error("getPdfExportsStatus call failed:", err));
  }, [fetchStatus]);

  const blocked = remaining !== null && remaining <= 0;

  /**
   * Da chiamare PRIMA di generare il file. Restituisce true se l'export è
   * consentito (e in tal caso aggiorna il contatore se necessario).
   */
  const consume = useCallback(
    async (kind: ExportKind): Promise<boolean> => {
      if (typeof window === "undefined") return true;
      const pukId = window.localStorage.getItem(PUK_ID_KEY);
      // Nessuna PUK / quota illimitata → nessun limite.
      if (!pukId) return true;

      // Export già incluso nel ciclo corrente → gratuito.
      if (cycle.current[kind] === false && (cycle.current.pdf || cycle.current.csv)) {
        cycle.current[kind] = true;
        return true;
      }

      if (remaining !== null && remaining <= 0) {
        showExhausted();
        return false;
      }

      if (inFlight.current) return false;
      inFlight.current = true;
      try {
        const { remaining: r, exhausted } = await decrement({ data: { pukId } });
        setRemaining(r);
        setShowLastExportWarning(false);
        // Nuovo ciclo: questo tipo è consumato, l'altro resta gratuito una volta.
        cycle.current = { pdf: kind === "pdf", csv: kind === "csv" };
        if (exhausted) showExhausted();
        return true;
      } catch (err) {
        console.error("decrementPdfExports call failed:", err);
        // Fail-open: non blocchiamo l'utente per un errore di rete.
        return true;
      } finally {
        inFlight.current = false;
      }
    },
    [decrement, remaining, showExhausted],
  );

  return { remaining, blocked, showLastExportWarning, consume, dialog };
}

export default useExportQuota;
