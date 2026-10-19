import { useEffect, useState } from "react";
import { LANGUAGE_EVENT, LANGUAGE_KEY, loadLanguage, type AppLanguage } from "./storage";

/**
 * Lingua globale reattiva: "it" in SSR, poi allineata allo storage dopo il mount
 * e aggiornata ad ogni cambio (stessa scheda via evento, altre schede via storage).
 */
export function useAppLanguage(): AppLanguage {
  const [lang, setLang] = useState<AppLanguage>("it");
  useEffect(() => {
    setLang(loadLanguage());
    const onCustom = (e: Event) => setLang((e as CustomEvent<AppLanguage>).detail ?? loadLanguage());
    const onStorage = (e: StorageEvent) => {
      if (e.key === LANGUAGE_KEY) setLang(loadLanguage());
    };
    window.addEventListener(LANGUAGE_EVENT, onCustom);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener(LANGUAGE_EVENT, onCustom);
      window.removeEventListener("storage", onStorage);
    };
  }, []);
  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);
  return lang;
}
