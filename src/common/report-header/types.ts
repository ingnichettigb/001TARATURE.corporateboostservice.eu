/**
 * Dati comuni (livello 0): intestazione del report.
 * Condivisa da TUTTI i sottoprogrammi.
 */
export interface ReportHeader {
  ditta: string;
  partitaIva: string;
  telefono: string;
  email: string;
  emailPec?: string;
  iscrizioneRegistro?: string;
  indirizzo: string;
  logoType: 'standard' | 'building' | 'wrench' | 'gauge' | 'shield' | 'custom' | 'none';
  customLogoData?: string; // base64
  customNote: string;
}

export const DEFAULT_REPORT_HEADER: ReportHeader = {
  ditta: 'BOMB-CON Engineering S.r.l.',
  partitaIva: 'IT09876543210',
  telefono: '+39 0373 123456',
  email: 'collaudi@bombbomb-engineering.it',
  indirizzo: 'Via delle Industrie 42, Crema (CR)',
  logoType: 'standard',
  customNote: 'Socio Unico - Capitale Sociale €50.000 i.v.',
};
