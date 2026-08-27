// ---------------------------------------------------------------------------
// Config del sistema di licensing (flusso a 3 passaggi collaudato su
// 002MnFAT, vedi FLUSSO-INGRESSO-README.md in quel repo). Pensato per essere
// copiato 1:1 in ogni nuovo prodotto del portfolio: cambia solo APP_CODE /
// APP_NAME / TERMS_VERSION e il prefisso delle chiavi qui sotto.
// ---------------------------------------------------------------------------
export const APP_CODE = "001TARATURE";
export const APP_NAME = "Taratura Serbatoi";
export const TERMS_VERSION = "v1";

// Chiavi localStorage, namespaced con APP_CODE: OBBLIGATORIO cambiarle in un
// nuovo progetto, altrimenti due SaaS del portfolio sullo stesso
// browser/dominio si sovrascrivono la sessione a vicenda.
export const VERIFIED_EMAIL_KEY = `${APP_CODE}:verifiedEmail`;
export const ACTIVATED_KEY = `${APP_CODE}:activated`;
export const LICENSE_ID_KEY = `${APP_CODE}:licenseId`;
export const CONSENT_KEY = `${APP_CODE}:consent`;
export const LAST_LICENSE_CHECK_KEY = `${APP_CODE}:lastLicenseCheck`;
export const LICENSE_INVALID_REASON_KEY = `${APP_CODE}:licenseInvalidReason`;

export const GATE_KEYS = [
  VERIFIED_EMAIL_KEY,
  ACTIVATED_KEY,
  LICENSE_ID_KEY,
  CONSENT_KEY,
  LAST_LICENSE_CHECK_KEY,
] as const;

export const LICENSE_KEYS = [
  ACTIVATED_KEY,
  LICENSE_ID_KEY,
  CONSENT_KEY,
  LAST_LICENSE_CHECK_KEY,
] as const;

export function clearGateKeys() {
  if (typeof window === "undefined") return;
  for (const k of GATE_KEYS) window.localStorage.removeItem(k);
}

// Rimuove solo le chiavi di licenza: l'email verificata resta, così un
// utente con licenza scaduta non deve rifare l'OTP da capo.
export function clearLicenseKeys() {
  if (typeof window === "undefined") return;
  for (const k of LICENSE_KEYS) window.localStorage.removeItem(k);
}

export function isUuid(v: string | null): v is string {
  return (
    !!v && /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(v)
  );
}
