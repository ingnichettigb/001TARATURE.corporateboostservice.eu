import type { ReactNode } from "react";

interface ExportCountBadgeProps {
  /** Numero di esportazioni rimanenti; se null il badge non viene mostrato. */
  count: number | null | undefined;
  lang?: string;
  children: ReactNode;
}

/**
 * Wrapper che mostra il cerchietto verde con il numero di esportazioni
 * rimanenti sopra un pulsante di export (PDF/CSV). Il valore arriva dal
 * contatore centralizzato, quindi tutti i pulsanti restano allineati.
 */
export function ExportCountBadge({ count, lang = "it", children }: ExportCountBadgeProps) {
  const title =
    lang === "en"
      ? "PDF exports remaining"
      : lang === "es"
        ? "Exportaciones PDF restantes"
        : lang === "de"
          ? "Verbleibende PDF-Exporte"
          : "Export PDF rimanenti";

  return (
    <div className="relative inline-flex">
      {count !== null && count !== undefined && (
        <span
          className="absolute -right-1.5 -top-1.5 z-10 flex h-4 w-4 items-center justify-center rounded-full bg-green-600 text-[9px] font-bold text-white shadow"
          title={title}
        >
          {count}
        </span>
      )}
      {children}
    </div>
  );
}

export default ExportCountBadge;
