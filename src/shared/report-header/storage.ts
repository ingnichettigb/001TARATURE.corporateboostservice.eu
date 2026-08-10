import { DEFAULT_REPORT_HEADER, type ReportHeader } from "./types";

export const REPORT_HEADER_KEY = "taratura_report_header";
const LEGACY_KEYS = ["bomb_bomb_compiler_info"];

export const REPORT_HEADER_EVENT = "taratura:report-header";

export function loadReportHeader(): ReportHeader {
  if (typeof window === "undefined") return DEFAULT_REPORT_HEADER;
  const keys = [REPORT_HEADER_KEY, ...LEGACY_KEYS];
  for (const key of keys) {
    const raw = window.localStorage.getItem(key);
    if (!raw) continue;
    try {
      const parsed = JSON.parse(raw) as ReportHeader;
      if (key !== REPORT_HEADER_KEY) {
        // migrazione dai dati salvati dal singolo modulo
        window.localStorage.setItem(REPORT_HEADER_KEY, raw);
      }
      return { ...DEFAULT_REPORT_HEADER, ...parsed };
    } catch {
      /* ignora dati corrotti */
    }
  }
  return DEFAULT_REPORT_HEADER;
}

export function saveReportHeader(info: ReportHeader) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(REPORT_HEADER_KEY, JSON.stringify(info));
  window.dispatchEvent(new CustomEvent<ReportHeader>(REPORT_HEADER_EVENT, { detail: info }));
}
