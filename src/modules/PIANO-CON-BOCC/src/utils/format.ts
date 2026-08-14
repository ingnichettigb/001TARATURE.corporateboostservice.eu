/** Utility locali del modulo PIANO-CON-BOCC. */
export function formatNumber(value: number, decimals = 2): string {
  return value.toLocaleString("it-IT", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}
