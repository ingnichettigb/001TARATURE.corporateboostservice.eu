// ---------------------------------------------------------------------------
// Config del sistema di licensing. Questo file è pensato per essere
// copiato 1:1 in ogni nuovo prodotto del portfolio: l'unica riga da
// cambiare è APP_CODE (deve corrispondere a product_catalog.app_code
// sul progetto Supabase condiviso "ruopxyprezzxoirfrjrm").
// ---------------------------------------------------------------------------
export const APP_CODE = "001TARATURE";
export const APP_NAME = "Taratura Serbatoi";

// Chiavi localStorage, namespaced con APP_CODE per evitare collisioni fra
// le varie SaaS del portfolio se mai condividessero dominio/browser.
export const LICENSE_ID_KEY = `${APP_CODE}:licenseId`;
export const ACTIVATED_KEY = `${APP_CODE}:activated`;
export const LAST_LICENSE_CHECK_KEY = `${APP_CODE}:lastLicenseCheck`;
export const LICENSE_INVALID_REASON_KEY = `${APP_CODE}:licenseInvalidReason`;

export const GATE_KEYS = [
  LICENSE_ID_KEY,
  ACTIVATED_KEY,
  LAST_LICENSE_CHECK_KEY,
] as const;

export function clearGateKeys() {
  if (typeof window === "undefined") return;
  for (const k of GATE_KEYS) window.localStorage.removeItem(k);
}

export function isUuid(v: string | null): v is string {
  return (
    !!v &&
    /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(
      v,
    )
  );
}
