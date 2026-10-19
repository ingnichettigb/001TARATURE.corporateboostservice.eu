import type { AppLanguage } from "./storage";

type Dict = Record<AppLanguage, string>;
const d = (it: string, en: string, es: string, de: string): Dict => ({ it, en, es, de });

/** Testi dell'interfaccia comune (menu, carte, dati comuni, licenza). */
export const UI = {
  appTitle: d("TARATURA SERBATOI", "TANK CALIBRATION", "CALIBRACIÓN DE TANQUES", "BEHÄLTERKALIBRIERUNG"),
  appSubtitle: d(
    "Seleziona un modulo di calcolo. Ogni modulo è autonomo, con il proprio cuore logico.",
    "Select a calculation module. Each module is self-contained, with its own logic core.",
    "Selecciona un módulo de cálculo. Cada módulo es autónomo, con su propio núcleo lógico.",
    "Wählen Sie ein Berechnungsmodul. Jedes Modul ist eigenständig, mit eigener Rechenlogik.",
  ),
  infoTitle: d("Informazioni su questa pagina", "About this page", "Información sobre esta página", "Informationen zu dieser Seite"),
  commonData: d("Dati Comuni", "Common Data", "Datos Comunes", "Gemeinsame Daten"),
  reportHeader: d("Intestazione Report", "Report Header", "Encabezado del Informe", "Berichtskopf"),
  reportHeaderDesc: d(
    "Ragione sociale, P.IVA, contatti, logo e note: si compilano una sola volta e valgono per tutti i moduli.",
    "Company name, VAT number, contacts, logo and notes: filled in once, valid for all modules.",
    "Razón social, NIF, contactos, logo y notas: se rellenan una sola vez y valen para todos los módulos.",
    "Firmenname, USt-IdNr., Kontakte, Logo und Notizen: einmal ausfüllen, gültig für alle Module.",
  ),
  modules: d("Moduli di calcolo", "Calculation modules", "Módulos de cálculo", "Berechnungsmodule"),
  registryNote: d(
    "I moduli sono definiti nel registro centrale: aggiungendo una riga e la relativa cartella compare automaticamente una nuova carta.",
    "Modules are defined in the central registry: adding a line and its folder automatically shows a new card.",
    "Los módulos se definen en el registro central: al añadir una línea y su carpeta aparece automáticamente una nueva tarjeta.",
    "Module sind im zentralen Register definiert: Eine Zeile und ein Ordner fügen automatisch eine neue Karte hinzu.",
  ),
  active: d("Attivo", "Active", "Activo", "Aktiv"),
  draft: d("In preparazione", "In preparation", "En preparación", "In Vorbereitung"),
  openModule: d("Apri modulo", "Open module", "Abrir módulo", "Modul öffnen"),
  iconOf: d("Icona", "Icon", "Icono", "Symbol"),
  changeLicense: d("Cambia licenza", "Change license", "Cambiar licencia", "Lizenz wechseln"),
  changeLicenseConfirm: d(
    "Uscendo dovrai reinserire email, licenza e PUK per accedere di nuovo. Continuare?",
    "After leaving you will need to re-enter email, license and PUK to sign in again. Continue?",
    "Al salir tendrás que volver a introducir email, licencia y PUK para acceder. ¿Continuar?",
    "Danach müssen Sie E-Mail, Lizenz und PUK erneut eingeben. Fortfahren?",
  ),
  // Dati comuni
  menu: d("Menu", "Menu", "Menú", "Menü"),
  commonPageTitle: d("Dati Comuni — Intestazione report", "Common Data — Report header", "Datos Comunes — Encabezado del informe", "Gemeinsame Daten — Berichtskopf"),
  commonPageSub: d(
    "Si compila una sola volta: vale per tutti i sottoprogrammi.",
    "Filled in once: valid for all sub-programs.",
    "Se rellena una sola vez: vale para todos los subprogramas.",
    "Einmal ausfüllen: gilt für alle Unterprogramme.",
  ),
  commonBadge: d("Comune", "Shared", "Común", "Gemeinsam"),
  saveCommon: d("Salva dati comuni", "Save common data", "Guardar datos comunes", "Gemeinsame Daten speichern"),
  // Form intestazione
  save: d("Salva", "Save", "Guardar", "Speichern"),
  cancel: d("Annulla", "Cancel", "Cancelar", "Abbrechen"),
  saved: d("Dati comuni salvati", "Common data saved", "Datos comunes guardados", "Gemeinsame Daten gespeichert"),
  reportLogo: d("Logo del report", "Report logo", "Logo del informe", "Berichtslogo"),
  logoCustom: d("Logo personalizzato", "Custom logo", "Logo personalizado", "Eigenes Logo"),
  logoStandard: d("Standard", "Standard", "Estándar", "Standard"),
  logoBuilding: d("Azienda", "Company", "Empresa", "Firma"),
  logoGauge: d("Strumento", "Instrument", "Instrumento", "Instrument"),
  logoShield: d("Certificazione", "Certification", "Certificación", "Zertifizierung"),
  logoNone: d("Nessuno", "None", "Ninguno", "Keines"),
  uploadLogo: d(
    "Carica e importa il tuo logo (.png, .jpg, .svg)",
    "Upload your logo (.png, .jpg, .svg)",
    "Sube tu logo (.png, .jpg, .svg)",
    "Logo hochladen (.png, .jpg, .svg)",
  ),
  logoPreview: d("Anteprima logo", "Logo preview", "Vista previa del logo", "Logo-Vorschau"),
  remove: d("Rimuovi", "Remove", "Eliminar", "Entfernen"),
  browse: d("Sfoglia file...", "Browse file...", "Examinar archivo...", "Datei auswählen..."),
  logoNote: d(
    "L'immagine viene salvata localmente nel browser e stampata in alta risoluzione sul certificato.",
    "The image is stored locally in the browser and printed in high resolution on the certificate.",
    "La imagen se guarda localmente en el navegador y se imprime en alta resolución en el certificado.",
    "Das Bild wird lokal im Browser gespeichert und in hoher Auflösung auf dem Zertifikat gedruckt.",
  ),
  company: d("Ragione sociale", "Company name", "Razón social", "Firmenname"),
  vat: d("Partita IVA", "VAT number", "NIF / CIF", "USt-IdNr."),
  phone: d("Telefono", "Phone", "Teléfono", "Telefon"),
  email: d("Email", "Email", "Email", "E-Mail"),
  pec: d("PEC", "Certified email (PEC)", "Email certificado (PEC)", "Zertifizierte E-Mail (PEC)"),
  registry: d("Iscrizione Registro / Albo", "Register / Professional order", "Inscripción en registro / colegio", "Register- / Kammereintrag"),
  address: d("Indirizzo", "Address", "Dirección", "Adresse"),
  extraInfo: d("Informazioni aggiuntive", "Additional information", "Información adicional", "Zusätzliche Informationen"),
  example: d("es.", "e.g.", "ej.", "z. B."),
} satisfies Record<string, Dict>;

export function tr(key: keyof typeof UI, lang: AppLanguage): string {
  return UI[key][lang] ?? UI[key].it;
}

// --- Traduzione testi delle carte (sottotitoli/descrizioni definiti in italiano) ---

const PHRASES: [string, Omit<Dict, "it">][] = [
  ["Serbatoio Orizzontale", { en: "Horizontal tank", es: "Tanque horizontal", de: "Liegender Behälter" }],
  ["Serbatoio orizzontale", { en: "Horizontal tank", es: "Tanque horizontal", de: "Liegender Behälter" }],
  ["Fondo e Coperchio Bombati", { en: "Dished Bottom and Head", es: "Fondo y Tapa Abombados", de: "Gewölbter Boden und Deckel" }],
  ["Fondo e Coperchio Conico", { en: "Conical Bottom and Head", es: "Fondo y Tapa Cónicos", de: "Konischer Boden und Deckel" }],
  ["Teste Coniche", { en: "Conical Heads", es: "Cabezales Cónicos", de: "Konische Böden" }],
  ["con Bocchello", { en: "with Nozzle", es: "con Boquilla", de: "mit Stutzen" }],
  ["Coperchio Bombato", { en: "Dished Head", es: "Tapa Abombada", de: "Gewölbter Deckel" }],
  ["Coperchio Conico", { en: "Conical Head", es: "Tapa Cónica", de: "Konischer Deckel" }],
  ["Coperchio Piano", { en: "Flat Head", es: "Tapa Plana", de: "Flacher Deckel" }],
  ["Fondo Bombato", { en: "Dished Bottom", es: "Fondo Abombado", de: "Gewölbter Boden" }],
  ["Fondo Conico", { en: "Conical Bottom", es: "Fondo Cónico", de: "Konischer Boden" }],
  ["Fondo Inclinato", { en: "Sloped Bottom", es: "Fondo Inclinado", de: "Schräger Boden" }],
  ["Fondo Piano", { en: "Flat Bottom", es: "Fondo Plano", de: "Flacher Boden" }],
  ["Fondo Troncoconico", { en: "Truncated-Cone Bottom", es: "Fondo Troncocónico", de: "Kegelstumpfboden" }],
];

const DESCRIPTIONS: Record<string, Omit<Dict, "it">> = {
  "Taratura completa: geometria, tabella di calibrazione e certificato PDF.": {
    en: "Full calibration: geometry, calibration table and PDF certificate.",
    es: "Calibración completa: geometría, tabla de calibración y certificado PDF.",
    de: "Vollständige Kalibrierung: Geometrie, Kalibriertabelle und PDF-Zertifikat.",
  },
};

function genericDescription(it: string, lang: Exclude<AppLanguage, "it">): string {
  const draft = /segnaposto|da importare/i.test(it);
  const horizontal = /orizzontale/i.test(it);
  const nozzle = /bocchello/i.test(it);
  const base = {
    en: horizontal ? "Horizontal tank: level calibration over the diameter, calibration table and PDF certificate." : "Full calibration: geometry, calibration table and PDF certificate.",
    es: horizontal ? "Tanque horizontal: calibración por nivel sobre el diámetro, tabla de calibración y certificado PDF." : "Calibración completa: geometría, tabla de calibración y certificado PDF.",
    de: horizontal ? "Liegender Behälter: Füllstandskalibrierung über den Durchmesser, Kalibriertabelle und PDF-Zertifikat." : "Vollständige Kalibrierung: Geometrie, Kalibriertabelle und PDF-Zertifikat.",
  }[lang];
  const nozzleTxt = { en: " Includes bottom nozzle (cylindrical stub).", es: " Incluye boquilla de fondo (tramo cilíndrico).", de: " Mit Bodenstutzen (zylindrischer Ansatz)." }[lang];
  const draftTxt = { en: " Module in preparation.", es: " Módulo en preparación.", de: " Modul in Vorbereitung." }[lang];
  return base + (nozzle ? nozzleTxt : "") + (draft ? draftTxt : "");
}

export function translateModuleText(text: string | undefined, lang: AppLanguage, kind: "subtitle" | "description"): string {
  if (!text || lang === "it") return text ?? "";
  if (kind === "description") return DESCRIPTIONS[text]?.[lang] ?? genericDescription(text, lang);
  let out = text;
  for (const [it, t] of PHRASES) out = out.split(it).join(t[lang]);
  return out;
}
