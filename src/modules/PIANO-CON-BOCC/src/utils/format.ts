/** Utility locali del modulo PIANO-CON-BOCC. */
export function formatNumber(value: number, decimals = 2): string {
  return value.toLocaleString('it-IT', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

/** Intero, senza decimali (quote in mm, litri arrotondati nei riepiloghi). */
export function fmt0(value: number): string {
  if (!isFinite(value)) return '—';
  return Math.round(value).toLocaleString('it-IT', { maximumFractionDigits: 0 });
}

/** Un decimale (pesi, angoli). */
export function fmt1(value: number): string {
  if (!isFinite(value)) return '—';
  return formatNumber(value, 1);
}

/** Due decimali (litri di precisione, tabella di taratura). */
export function fmt2(value: number): string {
  if (!isFinite(value)) return '—';
  return formatNumber(value, 2);
}
