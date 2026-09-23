/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import type { ReportMeta } from '../models/types';

export interface ExtendedFactoryNumber {
  numero: string;
  /** Tag number del cliente, abbinato al numero di fabbrica. */
  tag?: string;
  incluso: boolean;
}

/**
 * Elenco dei numeri di fabbrica (con tag number abbinato) per la "validità estesa".
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
    .map((numero) => ({ numero, tag: '', incluso: true }));
}

/** Solo le coppie spuntate (numero di fabbrica + tag number). */
export function getSelectedExtendedEntries(report: ReportMeta): ExtendedFactoryNumber[] {
  return getExtendedNumbers(report)
    .filter((n) => n.incluso && n.numero.trim())
    .map((n) => ({ numero: n.numero.trim(), tag: (n.tag || '').trim(), incluso: true }));
}

/** Etichetta "numero (tag)" oppure solo il numero se il tag manca. */
export function formatExtendedEntry(entry: ExtendedFactoryNumber): string {
  const tag = (entry.tag || '').trim();
  return tag ? `${entry.numero.trim()} (${tag})` : entry.numero.trim();
}


export function isMultiPrint(report: ReportMeta): boolean {
  return report.modalitaStampa === 'multiplo';
}

/** Testo da mostrare nella zona "Validità estesa" (anteprima/stampa HTML). */
export function getExtendedValidityText(report: ReportMeta): string {
  if (isMultiPrint(report)) return 'UNICO';
  return getSelectedExtendedEntries(report).map(formatExtendedEntry).join(', ');
}
