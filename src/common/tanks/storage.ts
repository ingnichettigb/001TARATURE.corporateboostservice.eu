import type { SavedTankRecord } from "./types";

/** Chiave localStorage dedicata a una tipologia di serbatoio. */
export function savedTanksKey(tankType: string): string {
  return `tanks_saved_${tankType}`;
}

/** Chiavi storiche (pre-separazione per tipologia) da migrare una-tantum. */
const LEGACY_KEYS: Record<string, string> = {
  "BOMB-CON": "bomb_bomb_saved_tanks",
};

const UPDATED_EVENT = "saved-tanks-updated";

function isBrowser() {
  return typeof window !== "undefined" && typeof localStorage !== "undefined";
}

function migrateLegacy(tankType: string) {
  if (!isBrowser()) return;
  const legacyKey = LEGACY_KEYS[tankType];
  if (!legacyKey) return;
  const key = savedTanksKey(tankType);
  if (localStorage.getItem(key) !== null) return;
  const legacy = localStorage.getItem(legacyKey);
  if (legacy) localStorage.setItem(key, legacy);
}

export function loadSavedTanks<T = unknown, C = unknown>(
  tankType: string,
): SavedTankRecord<T, C>[] {
  if (!isBrowser()) return [];
  migrateLegacy(tankType);
  const raw = localStorage.getItem(savedTanksKey(tankType));
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    console.error("Errore lettura serbatoi salvati", e);
    return [];
  }
}

export function saveTanks<T = unknown, C = unknown>(
  tankType: string,
  tanks: SavedTankRecord<T, C>[],
) {
  if (!isBrowser()) return;
  localStorage.setItem(savedTanksKey(tankType), JSON.stringify(tanks));
  window.dispatchEvent(new CustomEvent(UPDATED_EVENT));
}

export function addTank<T = unknown, C = unknown>(
  tankType: string,
  tank: SavedTankRecord<T, C>,
  options: { replaceSameName?: boolean } = {},
): SavedTankRecord<T, C>[] {
  const current = loadSavedTanks<T, C>(tankType);
  const rest = options.replaceSameName
    ? current.filter((t) => t.name !== tank.name)
    : current;
  const updated = [tank, ...rest];
  saveTanks(tankType, updated);
  return updated;
}

export function newTankId(): string {
  return typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : Math.random().toString(36).substring(2);
}

export function formatTankDate(d: Date = new Date()): string {
  return d.toLocaleDateString("it-IT", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
