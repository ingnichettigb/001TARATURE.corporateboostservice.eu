/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import type { FieldDef, ModuleCalcOutput, ModuleLogic, ModuleValues, ResultRow } from '@/common/module-types';
import type { TankInput } from '../models/types';
import { calculateTank } from './engine';
import { fmt0, fmt1, fmt2 } from '../utils/format';

/**
 * CUORE LOGICO DEL MODULO PIANO-CON-BOCC (livello 3).
 *
 * Fondo conico ripreso da BOMB-CON (cono + raccordo toroidale + colletto),
 * con il cono troncato al diametro del bocchello e prolungato dal
 * bocchello stesso (tratto cilindrico). Coperchio piano, senza bombatura.
 *
 * Tabella di taratura: volume utile, zero = fondo del bocchello (il
 * bocchello è parte del volume interrogabile del serbatoio).
 */

export function getInputSchema(): FieldDef[] {
  return [
    { key: 'dInt', label: 'Diametro interno', unit: 'mm', type: 'number', defaultValue: 2000,
      help: 'Diametro interno del mantello cilindrico (virola).' },
    { key: 'lCil', label: 'Altezza sezione cilindrica', unit: 'mm', type: 'number', defaultValue: 3000 },
    { key: 'spVirola', label: 'Spessore lamiera virola', unit: 'mm', type: 'number', defaultValue: 6 },
    { key: 'rho', label: 'Peso specifico contenuto', unit: 'kg/dm³', type: 'number', defaultValue: 1 },

    { key: 'spFondo', label: 'Spessore lamiera fondo', unit: 'mm', type: 'number', defaultValue: 6 },
    { key: 'rRaccordoFondo', label: 'Raggio raccordo cono/colletto', unit: 'mm', type: 'number', defaultValue: 30 },
    { key: 'hCollettoFondo', label: 'Altezza colletto fondo', unit: 'mm', type: 'number', defaultValue: 50 },
    { key: 'hConoFondo', label: 'Altezza fondo conico (colletto incluso, fino alla punta ideale)', unit: 'mm', type: 'number', defaultValue: 1050,
      help: 'Altezza del cono IDEALE a punta (colletto incluso): fissa solo l\'inclinazione del cono. Il fondo reale viene poi troncato dal bocchello.' },

    { key: 'diametroBocchello', label: 'Diametro bocchello di scarico', unit: 'mm', type: 'number', defaultValue: 100,
      help: 'Deve essere inferiore al diametro del cono alla base del raccordo.' },
    { key: 'altezzaBocchello', label: 'Altezza bocchello di scarico', unit: 'mm', type: 'number', defaultValue: 150,
      help: 'Tratto cilindrico sotto il tronco di cono. È lo zero della tabella di taratura.' },

    { key: 'spCoperchio', label: 'Spessore lamiera coperchio piano', unit: 'mm', type: 'number', defaultValue: 6 },
    { key: 'hCollettoCoperchio', label: 'Altezza colletto coperchio piano', unit: 'mm', type: 'number', defaultValue: 0 },

    { key: 'passoTabella', label: 'Passo tabella di taratura', unit: 'mm', type: 'number', defaultValue: 50,
      help: 'Passo di campionamento della tabella in output (il calcolo interno resta a 1 mm).' },
  ];
}

function toNumber(v: number | string | undefined, fallback = 0): number {
  if (typeof v === 'number') return v;
  if (typeof v === 'string' && v.trim() !== '') {
    const n = Number(v);
    if (!Number.isNaN(n)) return n;
  }
  return fallback;
}

function buildInput(values: ModuleValues): TankInput {
  const input: TankInput = {
    dInt: toNumber(values.dInt),
    lCil: toNumber(values.lCil),
    spVirola: toNumber(values.spVirola),
    rho: toNumber(values.rho, 1),
    spFondo: toNumber(values.spFondo),
    rRaccordoFondo: toNumber(values.rRaccordoFondo),
    hCollettoFondo: toNumber(values.hCollettoFondo),
    hConoFondo: toNumber(values.hConoFondo),
    diametroBocchello: toNumber(values.diametroBocchello),
    altezzaBocchello: toNumber(values.altezzaBocchello),
    spCoperchio: toNumber(values.spCoperchio),
    hCollettoCoperchio: toNumber(values.hCollettoCoperchio),
    passoTabella: toNumber(values.passoTabella, 50),
  };

  if (!(input.dInt > 0)) throw new Error('Il diametro interno deve essere maggiore di 0.');
  if (!(input.lCil >= 0)) throw new Error("L'altezza della sezione cilindrica non può essere negativa.");
  if (!(input.spVirola > 0)) throw new Error('Lo spessore lamiera virola deve essere maggiore di 0.');
  if (!(input.spFondo > 0)) throw new Error('Lo spessore lamiera fondo deve essere maggiore di 0.');
  if (!(input.spCoperchio > 0)) throw new Error('Lo spessore lamiera coperchio deve essere maggiore di 0.');
  if (input.rRaccordoFondo < 0 || input.rRaccordoFondo >= input.dInt / 2) {
    throw new Error('Il raggio di raccordo del fondo non è compatibile con il diametro interno.');
  }
  if (!(input.hConoFondo - input.hCollettoFondo > 0)) {
    throw new Error("L'altezza del fondo conico (colletto incluso) deve essere maggiore dell'altezza del colletto.");
  }
  if (!(input.diametroBocchello > 0)) throw new Error('Il diametro del bocchello deve essere maggiore di 0.');
  if (!(input.altezzaBocchello >= 0)) throw new Error("L'altezza del bocchello non può essere negativa.");
  if (!(input.passoTabella >= 1)) throw new Error('Il passo della tabella deve essere almeno 1 mm.');

  return input;
}

export function calculate(values: ModuleValues): ModuleCalcOutput {
  const input = buildInput(values);
  const result = calculateTank(input);
  const { fondo, coperchio } = result;

  const summary: ResultRow[] = [
    { label: 'Capacità totale', value: fmt0(result.volumeTotale), unit: 'L', highlight: true },
    { label: 'Altezza totale interna (H_tot)', value: fmt0(result.H_tot), unit: 'mm', highlight: true },
    { label: 'Volume fondo (bocchello + tronco + raccordo + colletto)', value: fmt2(result.volumeFondo), unit: 'L' },
    { label: 'Volume sezione cilindrica', value: fmt2(result.volumeCilindro), unit: 'L' },
    { label: 'Volume colletto coperchio piano', value: fmt2(result.volumeCoperchio), unit: 'L' },
    { label: 'Peso contenuto totale (a pieno)', value: fmt0(result.pesoContenutoTotale), unit: 'kg' },
    { label: 'Peso contenuto per cm di virola', value: fmt2(result.pesoContenutoPerCmCilindro), unit: 'kg/cm' },
    { label: 'Peso lamiera fondo', value: fmt1(result.pesoLamieraFondo), unit: 'kg' },
    { label: 'Peso lamiera virola', value: fmt1(result.pesoLamieraVirola), unit: 'kg' },
    { label: 'Peso lamiera coperchio piano', value: fmt1(result.pesoLamieraCoperchio), unit: 'kg' },
    { label: 'Inclinazione cono (semiangolo al vertice)', value: fmt1(fondo.alfa), unit: '°' },
    { label: 'Diametro cono alla base del raccordo (2·Y)', value: fmt0(2 * fondo.Y), unit: 'mm' },
    { label: 'Diametro bocchello', value: fmt0(2 * fondo.r_bocc), unit: 'mm' },
    { label: 'Altezza tronco di cono (bocchello → raccordo)', value: fmt0(fondo.H_tronco), unit: 'mm' },
    { label: 'Volume bocchello', value: fmt2(fondo.V_bocchello_L), unit: 'L' },
    { label: 'Volume tronco di cono', value: fmt2(fondo.V_tronco_L), unit: 'L' },
    { label: 'Volume raccordo cono/colletto', value: fmt2(fondo.V_raccordo_L + fondo.V_spicchio_L), unit: 'L' },
  ];

  // Campiona la tabella al passo richiesto, senza superare ~600 righe (leggibilità PDF/UI).
  let passo = Math.max(1, Math.round(input.passoTabella));
  const notes: string[] = [];
  if (result.H_tot / passo > 600) {
    const passoOriginale = passo;
    passo = Math.ceil(result.H_tot / 600 / 5) * 5 || passo;
    notes.push(
      `Passo tabella aumentato automaticamente da ${passoOriginale} mm a ${passo} mm per mantenere la tabella leggibile (il calcolo interno resta a passo 1 mm).`,
    );
  }

  const rows: (string | number)[][] = [];
  for (let h = 0; h <= result.H_tot; h += passo) {
    rows.push([fmt0(h), fmt2(result.litriCumulativi[h])]);
  }
  if (rows.length === 0 || Number(rows[rows.length - 1][0]) !== result.H_tot) {
    rows.push([fmt0(result.H_tot), fmt2(result.litriCumulativi[result.H_tot])]);
  }

  notes.unshift(
    'Zero della tabella di taratura = base del bocchello di scarico. Il volume del bocchello è conteggiato come volume utile.',
    'Il fondo conico è calcolato come tronco di cono: l\'inclinazione del cono ideale (a punta) è fissata dall\'altezza dichiarata (colletto incluso), poi il cono viene troncato al diametro del bocchello e prolungato dal bocchello stesso.',
    'Tutte le misure di input sono misure interne. Calcolo per discretizzazione continua a passo di 1 mm (metodo identico al modulo BOMB-CON, esteso al tronco di cono con bocchello).',
  );

  return {
    summary,
    table: {
      title: 'Tabella di taratura — altezza / capacità cumulativa',
      columns: ['Altezza h (mm)', 'Capacità cumulativa (L)'],
      rows,
    },
    notes,
  };
}

export function getPdfFooterNote(): string {
  return 'Documento generato dal modulo PIANO-CON-BOCC — Taratura Serbatoi. Fondo conico (tronco di cono) con bocchello di scarico; coperchio piano senza bombatura.';
}

export const logic: ModuleLogic = { getInputSchema, calculate, getPdfFooterNote };

export default logic;
