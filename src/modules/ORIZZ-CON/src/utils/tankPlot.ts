/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import type { CalculationResult } from '../models/types';

/**
 * Geometria di disegno del serbatoio ORIZZONTALE (profilo r(x) ruotato dell'eventuale
 * inclinazione). Usata dalla vista di stampa; il livello 0 = punto interno più basso.
 */
export function buildHorizontalTankPlot(
  result: CalculationResult,
  drawW: number,
  drawH: number,
  maxW: number,
  maxH: number
) {
  const Lax = result.L_tot;
  const th = (result.angolo * Math.PI) / 180;
  const sinT = Math.sin(th);
  const cosT = Math.cos(th);
  let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
  for (let x = 0; x <= Lax; x++) {
    const r = result.raggioProfile[x] || 0;
    for (const yy of [r, -r]) {
      const X = x * cosT - yy * sinT;
      const Z = x * sinT + yy * cosT;
      if (X < minX) minX = X;
      if (X > maxX) maxX = X;
      if (Z < minZ) minZ = Z;
      if (Z > maxZ) maxZ = Z;
    }
  }
  const spanX = Math.max(1, maxX - minX);
  const spanZ = Math.max(1, maxZ - minZ);
  const sc = Math.min(maxW / spanX, maxH / spanZ);
  const xOff = (drawW - spanX * sc) / 2 - minX * sc;
  const yBase = drawH / 2 + (spanZ * sc) / 2;
  const mapX = (X: number) => xOff + X * sc;
  const mapZ = (Z: number) => yBase - (Z - minZ) * sc;
  const mapLevelToY = (h: number) => yBase - h * sc;

  const nPts = Math.min(Lax, 220);
  const up: string[] = [];
  const lo: string[] = [];
  for (let i = 0; i <= nPts; i++) {
    const x = Math.round((i / nPts) * Lax);
    const r = result.raggioProfile[x] || 0;
    up.push(`${mapX(x * cosT - r * sinT).toFixed(2)},${mapZ(x * sinT + r * cosT).toFixed(2)}`);
    lo.unshift(`${mapX(x * cosT + r * sinT).toFixed(2)},${mapZ(x * sinT - r * cosT).toFixed(2)}`);
  }
  return {
    pathData: `M ${up.join(' L ')} L ${lo.join(' L ')} Z`,
    mapLevelToY,
    mapX,
    xLeft: mapX(minX),
    xRight: mapX(maxX),
  };
}
