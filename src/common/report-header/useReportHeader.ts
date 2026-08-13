import { useCallback, useEffect, useState } from "react";
import { DEFAULT_REPORT_HEADER, type ReportHeader } from "./types";
import { REPORT_HEADER_EVENT, REPORT_HEADER_KEY, loadReportHeader, saveReportHeader } from "./storage";

/**
 * Hook comune: legge/scrive l'intestazione report condivisa fra i moduli
 * e si mantiene sincronizzato fra componenti e tab del browser.
 */
export function useReportHeader() {
  const [header, setHeader] = useState<ReportHeader>(DEFAULT_REPORT_HEADER);

  useEffect(() => {
    setHeader(loadReportHeader());
    const onCustom = (e: Event) => setHeader((e as CustomEvent<ReportHeader>).detail);
    const onStorage = (e: StorageEvent) => {
      if (e.key === REPORT_HEADER_KEY) setHeader(loadReportHeader());
    };
    window.addEventListener(REPORT_HEADER_EVENT, onCustom);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener(REPORT_HEADER_EVENT, onCustom);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  const update = useCallback((info: ReportHeader) => {
    saveReportHeader(info);
    setHeader(info);
  }, []);

  return { header, update };
}

export default useReportHeader;
