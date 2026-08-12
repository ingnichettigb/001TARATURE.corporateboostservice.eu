/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import type { ReportMeta } from './types';

export interface ExtendedFactoryNumber {
  numero: string;
  incluso: boolean;
}

/**
 * Elenco dei numeri di fabbrica per la "validità estesa".
 * Retrocompatibile: se esiste solo il vecchio campo testuale `validitaEstesa`,
 * viene convertito in elenco separando su virgola / punto e virgola / a capo.
 */
export function getExtendedNumbers(report: ReportMeta): ExtendedFactoryNumber[] {
  if (report.numeriFabbricaEstesi && report.numeriFabbricaEstesi.length > 0) {
    return report.numeriFabbricaEstesi;
  }
  const raw = (report.validitaEstesa || '').trim();
  if (!raw || raw.toUpperCase() === 'UNICO') return [];
  return raw
    .split(/[,;\n]+/)
    .map((s) => s.trim())
    .filter(Boolean)
    .map((numero) => ({ numero, incluso: true }));
}

/** Solo i numeri spuntati. */
export function getSelectedExtendedNumbers(report: ReportMeta): string[] {
  return getExtendedNumbers(report)
    .filter((n) => n.incluso && n.numero.trim())
    .map((n) => n.numero.trim());
}

export function isMultiPrint(report: ReportMeta): boolean {
  return report.modalitaStampa === 'multiplo';
}

/** Testo da mostrare nella zona "Validità estesa" (anteprima/stampa HTML). */
export function getExtendedValidityText(report: ReportMeta): string {
  if (isMultiPrint(report)) return 'UNICO';
  return getSelectedExtendedNumbers(report).join(', ');
}
