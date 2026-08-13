/** Utility locali del modulo BOMB-BOMB. */
export function formatNumber(value: number, decimals = 2): string {
  return value.toLocaleString("it-IT", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}
