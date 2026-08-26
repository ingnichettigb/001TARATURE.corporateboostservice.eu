export type AppLanguage = "it" | "en" | "es" | "de";

export const LANGUAGE_KEY = "taratura_language";
export const LANGUAGE_EVENT = "taratura:language";

export const LANGUAGE_OPTIONS: { code: AppLanguage; flag: string; label: string }[] = [
  { code: "it", flag: "🇮🇹", label: "Italiano" },
  { code: "en", flag: "🇬🇧", label: "English" },
  { code: "es", flag: "🇪🇸", label: "Español" },
  { code: "de", flag: "🇩🇪", label: "Deutsch" },
];

function isAppLanguage(value: string | null): value is AppLanguage {
  return value === "it" || value === "en" || value === "es" || value === "de";
}

/**
 * Legge la lingua salvata globalmente (menu + tutti i moduli).
 * Fallback a "it" se non è mai stata impostata o siamo in SSR.
 */
export function loadLanguage(): AppLanguage {
  if (typeof window === "undefined") return "it";
  const raw = window.localStorage.getItem(LANGUAGE_KEY);
  return isAppLanguage(raw) ? raw : "it";
}

/**
 * Salva la lingua scelta rendendola persistente per il menu principale
 * e per l'apertura di qualsiasi modulo, e notifica eventuali listener
 * già montati nella stessa scheda del browser.
 */
export function saveLanguage(lang: AppLanguage) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(LANGUAGE_KEY, lang);
  window.dispatchEvent(new CustomEvent<AppLanguage>(LANGUAGE_EVENT, { detail: lang }));
}
