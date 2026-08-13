/** Helper condivisi da core e moduli (nessuna logica di carta). */

export function formatNumber(value: number, decimals = 2): string {
  return value.toLocaleString("it-IT", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

export function formatInteger(value: number): string {
  return Math.round(value).toLocaleString("it-IT");
}

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}
