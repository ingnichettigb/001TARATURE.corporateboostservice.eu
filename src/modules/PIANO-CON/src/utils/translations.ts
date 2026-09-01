/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type Language = 'it' | 'en' | 'es' | 'de';

export interface TranslationDict {
  // General & App Titles
  appName: string;
  appSub: string;
  appTeaser: string;
  active: string;
  recalculate: string;
  calculate: string;
  savedConfigs: string;
  noSavedConfigs: string;
  load: string;
  delete: string;
  close: string;
  save: string;
  cancel: string;
  confirm: string;
  warning: string;

  // Tabs
  tabDimensions: string;
  tabFondo: string;
  tabCoperchio: string;
  tabReport: string;

  // Saved Tanks
  saveSuccess: string;
  deleteSuccess: string;
  savePlaceholder: string;
  saveConfigButton: string;
  
  // General Dimensions
  dimsTitle: string;
  dInt: string;
  lCil: string;
  rho: string;
  rhoSub: string;
  rhoLabel: string;

  // Head types / Fondo and Coperchio
  headType: string;
  headTypeStandardKlopper: string;
  headTypeStandardKorbbogen: string;
  headTypeCustom: string;
  headTypeFlat: string;
  plateThickness: string;
  collettoHeight: string;
  customRadiusR: string;
  customKnuckleRadiusr: string;
  collettoWarning: string;
  collettoConfirm: string;
  equalHeads: string;
  superiorHead: string;
  inferiorHead: string;

  // Compiler metadata & Logo
  compilerBtn: string;
  compilerTitle: string;
  compilerSubtitle: string;
  selectLogo: string;
  companyName: string;
  vatNumber: string;
  address: string;
  phone: string;
  email: string;
  website: string;
  additionalInfo: string;
  compilerLogoCustom: string;
  logoStandard: string;
  logoBuilding: string;
  logoGauge: string;
  logoCert: string;
  logoNone: string;

  // Tank Metadata Zone (Identificativi)
  metaTitle: string;
  metaDesc: string;
  metaDescPlaceholder: string;
  metaDwg: string;
  metaDwgPlaceholder: string;
  metaDate: string;
  metaCompiler: string;
  metaCompilerPlaceholder: string;
  metaCommessa: string;
  metaCommessaPlaceholder: string;
  metaFabbrica: string;
  metaFabbricaPlaceholder: string;
  metaTag: string;
  metaTagPlaceholder: string;
  metaCliente: string;
  metaClientePlaceholder: string;
  metaExtended: string;
  metaExtendedPlaceholder: string;

  // Dashboard & Results
  dashTitle: string;
  totalCapacity: string;
  cylinderCapacity: string;
  headsCapacity: string;
  fondoCapacity: string;
  coperchioCapacity: string;
  totalHeight: string;
  stepH: string;
  stepLabel: string;
  showStrappingTable: string;
  interactivePlot: string;
  realtimeLevel: string;
  currentHeight: string;
  currentVolume: string;
  currentPercent: string;
  zonesTitle: string;
  zonesSub: string;
  zone7Name: string;
  zone6Name: string;
  zone5Name: string;
  zone4Name: string;
  zone3Name: string;
  zone2Name: string;
  zone1Name: string;
  zoneLevelRange: string;
  zonePartialVolume: string;

  // Strapping Table / Calibration table
  tabsLinear: string;
  tabsGrid: string;
  exportLinearCsv: string;
  exportGridCsv: string;
  printPdf: string;
  stepSelector: string;
  tableHeightBase: string;
  tableGridTitle: string;
  tableLinearTitle: string;
  tableTotalVolume: string;
  tableCapacityLimit: string;
  printDate: string;
  printPage: string;
  printSignature: string;
  printStamp: string;
}

export const translations: Record<Language, TranslationDict> = {
  it: {
    appName: "PIANO-CON TARATURA",
    appSub: "v1.2 (EXCEL 01 COMPATIBLE)",
    appTeaser: "Taratura millimetrica professionale per serbatoi cilindrici con fondo conico e coperchio bombato standard o custom. Modello matematico integrato a 7 zone continue (passo 1 mm)",
    active: "ATTIVO",
    recalculate: "Ricalcola Taratura",
    calculate: "Calcola Taratura",
    savedConfigs: "Configurazioni Salvate",
    noSavedConfigs: "Nessuna configurazione salvata",
    load: "Carica",
    delete: "Elimina",
    close: "Chiudi",
    save: "Salva",
    cancel: "Annulla",
    confirm: "Conferma",
    warning: "Attenzione",

    tabDimensions: "Dimensioni",
    tabFondo: "Fondo",
    tabCoperchio: "Coperchio",
    tabReport: "Report",

    saveSuccess: "Configurazione salvata con successo!",
    deleteSuccess: "Configurazione eliminata con successo!",
    savePlaceholder: "Nome per questa configurazione...",
    saveConfigButton: "Salva Configurazione",

    dimsTitle: "Dimensioni Generali Serbatoio",
    dInt: "Diametro Interno (D_int)",
    lCil: "Altezza Parte Cilindrica (L_cil)",
    rho: "Densità del Prodotto (ρ)",
    rhoSub: "(kg/dm³ o kg/L)",
    rhoLabel: "Densità liquido (default acqua: 1.0)",

    headType: "Tipo di Testata",
    headTypeStandardKlopper: "Bombato Standard Klopper (r=D, R=0.1D)",
    headTypeStandardKorbbogen: "Bombato Standard Korbbogen (r=0.8D, R=0.154D)",
    headTypeCustom: "Bombato Customizzato",
    headTypeFlat: "Piano / Senza Bombatura",
    plateThickness: "Spessore Lamiera (s)",
    collettoHeight: "Altezza Colletto Cilindrico (h_colletto)",
    customRadiusR: "Raggio di curvatura maggiore (R)",
    customKnuckleRadiusr: "Raggio di raccordo minore (r)",
    collettoWarning: "L'altezza ottimale proposta per il colletto cilindrico (5x spessore) è",
    collettoConfirm: "Usa altezza proposta",
    equalHeads: "Testate uguali (Coperchio uguale a Fondo)",
    superiorHead: "Testata Superiore (Coperchio)",
    inferiorHead: "Testata Inferiore (Fondo)",

    compilerBtn: "Imposta Dati Compilatore & Logo",
    compilerTitle: "Configura Intestazione Report",
    compilerSubtitle: "Personalizza il layout con i tuoi dati aziendali e il tuo logo",
    selectLogo: "SELEZIONA LOGO / ICONA DELLA DITTA",
    companyName: "Nome o Ragione Sociale Ditta",
    vatNumber: "Partita IVA / Codice Fiscale",
    address: "Indirizzo Aziendale",
    phone: "Telefono",
    email: "Email di contatto",
    website: "Sito Web",
    additionalInfo: "Note aggiuntive nel piè di pagina",
    compilerLogoCustom: "Importa Logo",
    logoStandard: "Tecnico",
    logoBuilding: "Costruzioni",
    logoGauge: "Misuratore",
    logoCert: "Certificato",
    logoNone: "Nessuno",

    metaTitle: "Dati Identificativi Serbatoio",
    metaDesc: "Descrizione Serbatoio / Titolo Disegno",
    metaDescPlaceholder: "es. Serbatoio Diesel TK-104",
    metaDwg: "Numero Disegno",
    metaDwgPlaceholder: "es. DWG-BOMB-01",
    metaDate: "Data Rilievo",
    metaCompiler: "Nome Compilatore",
    metaCompilerPlaceholder: "es. Ing. Rossi",
    metaCommessa: "Commessa",
    metaCommessaPlaceholder: "es. JOB-2026",
    metaFabbrica: "N° Fabbrica",
    metaFabbricaPlaceholder: "es. 12345",
    metaTag: "Tag Number",
    metaTagPlaceholder: "es. TK-104",
    metaCliente: "Cliente",
    metaClientePlaceholder: "es. Padana S.p.A.",
    metaExtended: "Validità estesa ai seguenti numeri di fabbrica",
    metaExtendedPlaceholder: "es. 12346/26, 12347/26...",

    dashTitle: "Capacità & Proprietà Geometriche",
    totalCapacity: "Capacità Totale Teorica",
    cylinderCapacity: "Capacità Parte Cilindrica",
    headsCapacity: "Capacità Totale Fondi",
    fondoCapacity: "Capacità Fondo Inferiore",
    coperchioCapacity: "Capacità Coperchio Superiore",
    totalHeight: "Altezza Totale Interna (H_tot)",
    stepH: "Passo Rilievo (Frazione Altezza)",
    stepLabel: "Passo 1 mm",
    showStrappingTable: "Mostra Tabella di Taratura Millimetrica",
    interactivePlot: "1. Sagoma & Zonizzazione Serbatoio",
    realtimeLevel: "Lettura Volume Real-Time",
    currentHeight: "Altezza Livello",
    currentVolume: "Volume Contenuto",
    currentPercent: "Percentuale Riempimento",
    zonesTitle: "Zonizzazione Serbatoio per lo Strapping",
    zonesSub: "Modello matematico integrato a 7 zone continue (passo 1 mm)",
    zone7Name: "Calotta superiore (Coperchio)",
    zone6Name: "Raccordo calotta (Coperchio)",
    zone5Name: "Colletto cilindrico (Coperchio)",
    zone4Name: "Mantello cilindrico (L_cil)",
    zone3Name: "Colletto cilindrico (Fondo)",
    zone2Name: "Raccordo calotta (Fondo)",
    zone1Name: "Calotta inferiore (Fondo)",
    zoneLevelRange: "Intervallo quote h",
    zonePartialVolume: "Volume parziale",

    tabsLinear: "Tabella Lineare",
    tabsGrid: "Griglia Tradizionale (Passo 10 mm)",
    exportLinearCsv: "Esporta CSV Tabella Lineare (millimetro per millimetro)",
    exportGridCsv: "Esporta CSV Tabella a Griglia (10 mm)",
    printPdf: "Stampa Report PDF",
    stepSelector: "Seleziona passo tabella:",
    tableHeightBase: "Altezza Base",
    tableGridTitle: "TABELLA DI TARATURA (PASSO 10 mm)",
    tableLinearTitle: "TABELLA DI TARATURA LINEARE (PASSO 1 mm)",
    tableTotalVolume: "Volume Cumulativo",
    tableCapacityLimit: "Capacità Massima Serbatoio raggiunta",
    printDate: "Data di emissione report",
    printPage: "Pagina",
    printSignature: "Firma del Compilatore",
    printStamp: "Timbro della Ditta"
  },
  en: {
    appName: "PIANO-CON TARATURA",
    appSub: "v1.2 (EXCEL 01 COMPATIBLE)",
    appTeaser: "Professional millimeter-by-millimeter calibration for cylindrical tanks with standard or custom conic bottom and dished top. Integrated mathematical model with 7 continuous zones (1 mm steps)",
    active: "ACTIVE",
    recalculate: "Recalculate Calibration",
    calculate: "Calculate Calibration",
    savedConfigs: "Saved Configurations",
    noSavedConfigs: "No saved configurations",
    load: "Load",
    delete: "Delete",
    close: "Close",
    save: "Save",
    cancel: "Cancel",
    confirm: "Confirm",
    warning: "Warning",

    tabDimensions: "Dimensions",
    tabFondo: "Bottom Head",
    tabCoperchio: "Top Head",
    tabReport: "Report Info",

    saveSuccess: "Configuration saved successfully!",
    deleteSuccess: "Configuration deleted successfully!",
    savePlaceholder: "Name for this configuration...",
    saveConfigButton: "Save Configuration",

    dimsTitle: "General Tank Dimensions",
    dInt: "Internal Diameter (D_int)",
    lCil: "Cylindrical Part Height (L_cil)",
    rho: "Product Density (ρ)",
    rhoSub: "(kg/dm³ or kg/L)",
    rhoLabel: "Liquid density (default water: 1.0)",

    headType: "Head Type",
    headTypeStandardKlopper: "Klopper Standard Head (r=D, R=0.1D)",
    headTypeStandardKorbbogen: "Korbbogen Standard Head (r=0.8D, R=0.154D)",
    headTypeCustom: "Customized Curved Head",
    headTypeFlat: "Flat / No Curvature",
    plateThickness: "Plate Thickness (s)",
    collettoHeight: "Straight Flange Height (h_colletto)",
    customRadiusR: "Major crown radius (R)",
    customKnuckleRadiusr: "Minor knuckle radius (r)",
    collettoWarning: "The recommended straight flange height (5x thickness) is",
    collettoConfirm: "Use proposed height",
    equalHeads: "Identical heads (Top head equals Bottom head)",
    superiorHead: "Top Head (Cover)",
    inferiorHead: "Bottom Head (Base)",

    compilerBtn: "Configure Compiler Info & Logo",
    compilerTitle: "Configure Report Header",
    compilerSubtitle: "Personalize the report with your company data and logo",
    selectLogo: "SELECT COMPANY LOGO / ICON",
    companyName: "Company Name",
    vatNumber: "VAT Number / Tax Code",
    address: "Company Address",
    phone: "Phone",
    email: "Contact Email",
    website: "Website",
    additionalInfo: "Additional footer notes",
    compilerLogoCustom: "Import Logo",
    logoStandard: "Technical",
    logoBuilding: "Construction",
    logoGauge: "Gauge",
    logoCert: "Certificate",
    logoNone: "None",

    metaTitle: "Tank Identification Data",
    metaDesc: "Tank Description / Drawing Title",
    metaDescPlaceholder: "e.g. Diesel Tank TK-104",
    metaDwg: "Drawing Number",
    metaDwgPlaceholder: "e.g. DWG-BOMB-01",
    metaDate: "Survey Date",
    metaCompiler: "Compiler Name",
    metaCompilerPlaceholder: "e.g. Eng. Smith",
    metaCommessa: "Project / Job ID",
    metaCommessaPlaceholder: "e.g. JOB-2026",
    metaFabbrica: "Serial Number",
    metaFabbricaPlaceholder: "e.g. 12345",
    metaTag: "Tag Number",
    metaTagPlaceholder: "e.g. TK-104",
    metaCliente: "Client",
    metaClientePlaceholder: "e.g. Padana S.p.A.",
    metaExtended: "Validity extended to following Serial Numbers",
    metaExtendedPlaceholder: "e.g. 12346/26, 12347/26...",

    dashTitle: "Capacity & Geometric Properties",
    totalCapacity: "Theoretical Total Capacity",
    cylinderCapacity: "Cylindrical Shell Capacity",
    headsCapacity: "Total Heads Capacity",
    fondoCapacity: "Bottom Head Capacity",
    coperchioCapacity: "Top Head Capacity",
    totalHeight: "Total Internal Height (H_tot)",
    stepH: "Survey step (fraction of height)",
    stepLabel: "1 mm steps",
    showStrappingTable: "Show Millimeter Strapping Table",
    interactivePlot: "1. Tank Profile & Zoning",
    realtimeLevel: "Real-Time Volume Calculator",
    currentHeight: "Level Height",
    currentVolume: "Contained Volume",
    currentPercent: "Filling Percentage",
    zonesTitle: "Tank Zoning for Strapping",
    zonesSub: "Integrated mathematical model with 7 continuous zones (1 mm steps)",
    zone7Name: "Top head dome (Cover)",
    zone6Name: "Top head knuckle transition",
    zone5Name: "Top head straight flange",
    zone4Name: "Cylindrical shell (L_cil)",
    zone3Name: "Bottom head straight flange",
    zone2Name: "Bottom head knuckle transition",
    zone1Name: "Bottom head dome (Base)",
    zoneLevelRange: "Height ranges h",
    zonePartialVolume: "Partial volume",

    tabsLinear: "Linear Table",
    tabsGrid: "Traditional Grid (10 mm steps)",
    exportLinearCsv: "Export CSV Linear Table (millimeter by millimeter)",
    exportGridCsv: "Export CSV Grid Table (10 mm)",
    printPdf: "Print PDF Report",
    stepSelector: "Select table step:",
    tableHeightBase: "Base Height",
    tableGridTitle: "STRAPPING TABLE (10 mm STEPS)",
    tableLinearTitle: "LINEAR STRAPPING TABLE (1 mm STEPS)",
    tableTotalVolume: "Cumulative Volume",
    tableCapacityLimit: "Maximum Tank Capacity reached",
    printDate: "Report emission date",
    printPage: "Page",
    printSignature: "Compiler Signature",
    printStamp: "Company Stamp"
  },
  es: {
    appName: "PIANO-CON TARATURA",
    appSub: "v1.2 (COMPATIBLE CON EXCEL 01)",
    appTeaser: "Calibración milimétrica profesional para tanques cilíndricos con fondo cónico estándar o personalizado y tapa bombada. Modelo matemático integrado de 7 zonas continuas (pasos de 1 mm)",
    active: "ACTIVO",
    recalculate: "Recalcular Calibración",
    calculate: "Calcular Calibración",
    savedConfigs: "Configuraciones Guardadas",
    noSavedConfigs: "No hay configuraciones guardadas",
    load: "Cargar",
    delete: "Eliminar",
    close: "Cerrar",
    save: "Guardar",
    cancel: "Cancelar",
    confirm: "Confirmar",
    warning: "Advertencia",

    tabDimensions: "Dimensiones",
    tabFondo: "Extremo Inferior",
    tabCoperchio: "Extremo Superior",
    tabReport: "Datos de Reporte",

    saveSuccess: "¡Configuración guardada correctamente!",
    deleteSuccess: "¡Configuración eliminada correctamente!",
    savePlaceholder: "Nombre de esta configuración...",
    saveConfigButton: "Guardar Configuración",

    dimsTitle: "Dimensiones Generales del Tanque",
    dInt: "Diámetro Interno (D_int)",
    lCil: "Altura de la Parte Cilíndrica (L_cil)",
    rho: "Densidad del Producto (ρ)",
    rhoSub: "(kg/dm³ o kg/L)",
    rhoLabel: "Densidad del líquido (agua por defecto: 1.0)",

    headType: "Tipo de Cabezal",
    headTypeStandardKlopper: "Cabezal Estándar Klopper (r=D, R=0.1D)",
    headTypeStandardKorbbogen: "Cabezal Estándar Korbbogen (r=0.8D, R=0.154D)",
    headTypeCustom: "Cabezal Curvo Personalizado",
    headTypeFlat: "Plano / Sin Curvatura",
    plateThickness: "Espesor de Chapa (s)",
    collettoHeight: "Altura del Cuello Cilíndrico (h_colletto)",
    customRadiusR: "Radio de corona mayor (R)",
    customKnuckleRadiusr: "Radio de nudillo menor (r)",
    collettoWarning: "La altura propuesta recomendada para el cuello cilíndrico (5x espesor) es",
    collettoConfirm: "Usar altura propuesta",
    equalHeads: "Cabezales idénticos (Cabezal superior igual al inferior)",
    superiorHead: "Cabezal Superior (Tapa)",
    inferiorHead: "Cabezal Inferior (Base)",

    compilerBtn: "Configurar Datos de Emisor y Logo",
    compilerTitle: "Configurar Encabezado del Reporte",
    compilerSubtitle: "Personalice el reporte con los datos de su empresa y logo",
    selectLogo: "SELECCIONE LOGO / ICONO DE LA EMPRESA",
    companyName: "Nombre o Razón Social",
    vatNumber: "Número de IVA / CIF",
    address: "Dirección de la Empresa",
    phone: "Teléfono",
    email: "Correo Electrónico",
    website: "Sitio Web",
    additionalInfo: "Notas adicionales en el pie de página",
    compilerLogoCustom: "Importar Logo",
    logoStandard: "Técnico",
    logoBuilding: "Construcción",
    logoGauge: "Medidor",
    logoCert: "Certificado",
    logoNone: "Ninguno",

    metaTitle: "Datos de Identificación del Tanque",
    metaDesc: "Descripción del Tanque / Título del Plano",
    metaDescPlaceholder: "ej. Tanque de Diesel TK-104",
    metaDwg: "Número de Plano",
    metaDwgPlaceholder: "ej. DWG-BOMB-01",
    metaDate: "Fecha de Medición",
    metaCompiler: "Nombre del Compilador",
    metaCompilerPlaceholder: "ej. Ing. Gómez",
    metaCommessa: "ID Proyecto / Orden",
    metaCommessaPlaceholder: "ej. JOB-2026",
    metaFabbrica: "N° de Fábrica",
    metaFabbricaPlaceholder: "ej. 12345",
    metaTag: "Número de Tag",
    metaTagPlaceholder: "ej. TK-104",
    metaCliente: "Cliente",
    metaClientePlaceholder: "ej. Padana S.p.A.",
    metaExtended: "Validez extendida a los siguientes números de fábrica",
    metaExtendedPlaceholder: "ej. 12346/26, 12347/26...",

    dashTitle: "Capacidad y Propiedades Geométricas",
    totalCapacity: "Capacidad Total Teórica",
    cylinderCapacity: "Capacidad Parte Cilíndrica",
    headsCapacity: "Capacidad Total de Cabezales",
    fondoCapacity: "Capacidad Cabezal Inferior",
    coperchioCapacity: "Capacidad Cabezal Superior",
    totalHeight: "Altura Total Interna (H_tot)",
    stepH: "Paso de medición (fracción de altura)",
    stepLabel: "Pasos de 1 mm",
    showStrappingTable: "Mostrar Tabla de Calibración Milimétrica",
    interactivePlot: "1. Perfil del Tanque y Zonificación",
    realtimeLevel: "Calculador de Volumen en Tiempo Real",
    currentHeight: "Altura de Nivel",
    currentVolume: "Volumen Contenido",
    currentPercent: "Porcentaje de Llenado",
    zonesTitle: "Zonificación del Tanque para Strapping",
    zonesSub: "Modelo matemático integrado de 7 zonas continuas (pasos de 1 mm)",
    zone7Name: "Cúpula superior (Tapa)",
    zone6Name: "Transición de nudillo superior",
    zone5Name: "Cuello cilíndrico superior",
    zone4Name: "Cuerpo cilíndrico (L_cil)",
    zone3Name: "Cuello cilíndrico inferior",
    zone2Name: "Transición de nudillo inferior",
    zone1Name: "Cúpula inferior (Base)",
    zoneLevelRange: "Rangos de altura h",
    zonePartialVolume: "Volumen parcial",

    tabsLinear: "Tabla Lineal",
    tabsGrid: "Rejilla Tradicional (Pasos de 10 mm)",
    exportLinearCsv: "Exportar CSV Tabla Lineal (milímetro a milímetro)",
    exportGridCsv: "Exportar CSV Tabla de Rejilla (10 mm)",
    printPdf: "Imprimir Reporte PDF",
    stepSelector: "Seleccionar paso de tabla:",
    tableHeightBase: "Altura Base",
    tableGridTitle: "TABLA DE CALIBRACIÓN (PASOS DE 10 mm)",
    tableLinearTitle: "TABLA DE CALIBRACIÓN LINEAL (PASOS DE 1 mm)",
    tableTotalVolume: "Volumen Acumulado",
    tableCapacityLimit: "Capacidad Máxima del Tanque alcanzada",
    printDate: "Fecha de emisión del reporte",
    printPage: "Página",
    printSignature: "Firma del Compilador",
    printStamp: "Sello de la Empresa"
  },
  de: {
    appName: "PIANO-CON TARATURA",
    appSub: "v1.2 (EXCEL 01 KOMPATIBEL)",
    appTeaser: "Professionelle millimetergenaue Kalibrierung für zylindrische Tanks mit Standard- oder kundenspezifischem konischem Boden und gewölbtem Deckel. Integriertes mathematisches 7-Zonen-Modell (1 mm Schritte)",
    active: "AKTIV",
    recalculate: "Kalibrierung Neu Berechnen",
    calculate: "Kalibrierung Berechnen",
    savedConfigs: "Gespeicherte Konfigurationen",
    noSavedConfigs: "Keine Konfigurationen gespeichert",
    load: "Laden",
    delete: "Löschen",
    close: "Schließen",
    save: "Speichern",
    cancel: "Abbrechen",
    confirm: "Bestätigen",
    warning: "Achtung",

    tabDimensions: "Abmessungen",
    tabFondo: "Unterer Boden",
    tabCoperchio: "Oberer Deckel",
    tabReport: "Berichtsdaten",

    saveSuccess: "Konfiguration erfolgreich gespeichert!",
    deleteSuccess: "Konfiguration erfolgreich gelöscht!",
    savePlaceholder: "Name für diese Konfiguration...",
    saveConfigButton: "Konfiguration Speichern",

    dimsTitle: "Allgemeine Tankabmessungen",
    dInt: "Innendurchmesser (D_int)",
    lCil: "Höhe des zylindrischen Teils (L_cil)",
    rho: "Dichte des Produkts (ρ)",
    rhoSub: "(kg/dm³ oder kg/L)",
    rhoLabel: "Dichte der Flüssigkeit (Standardwasser: 1.0)",

    headType: "Bodenform",
    headTypeStandardKlopper: "Standard-Klöpperboden (r=D, R=0.1D)",
    headTypeStandardKorbbogen: "Standard-Korbbogenboden (r=0.8D, R=0.154D)",
    headTypeCustom: "Kundenspezifischer gewölbter Boden",
    headTypeFlat: "Flach / Keine Wölbung",
    plateThickness: "Blechdicke (s)",
    collettoHeight: "Zylindrische Bordhöhe (h_colletto)",
    customRadiusR: "Großer Wölbungsradius (R)",
    customKnuckleRadiusr: "Kleiner Krempenradius (r)",
    collettoWarning: "Die empfohlene zylindrische Bordhöhe (5x Dicke) beträgt",
    collettoConfirm: "Empfohlene Höhe verwenden",
    equalHeads: "Gleiche Böden (Oberer Deckel entspricht unterem Boden)",
    superiorHead: "Oberer Boden (Deckel)",
    inferiorHead: "Unterer Boden (Basis)",

    compilerBtn: "Herausgeberdaten & Logo Einrichten",
    compilerTitle: "Berichtskopf Konfigurieren",
    compilerSubtitle: "Personalisieren Sie den Bericht mit Ihren Firmendaten und Logo",
    selectLogo: "FIRMENLOGO ODER SYMBOL AUSWÄHLEN",
    companyName: "Firmenname / Name",
    vatNumber: "Umsatzsteuer-ID / Steuernummer",
    address: "Firmenadresse",
    phone: "Telefon",
    email: "E-Mail-Adresse",
    website: "Webseite",
    additionalInfo: "Zusätzliche Fußzeilen-Notizen",
    compilerLogoCustom: "Logo Importieren",
    logoStandard: "Technik",
    logoBuilding: "Bauwesen",
    logoGauge: "Messgerät",
    logoCert: "Zertifikat",
    logoNone: "Keins",

    metaTitle: "Tank-Identifikationsdaten",
    metaDesc: "Tankbeschreibung / Zeichnungstitel",
    metaDescPlaceholder: "z.B. Dieseltank TK-104",
    metaDwg: "Zeichnungsnummer",
    metaDwgPlaceholder: "z.B. DWG-BOMB-01",
    metaDate: "Aufnahmedatum",
    metaCompiler: "Name des Bearbeiters",
    metaCompilerPlaceholder: "z.B. Ing. Müller",
    metaCommessa: "Auftrag / Projekt-ID",
    metaCommessaPlaceholder: "z.B. JOB-2026",
    metaFabbrica: "Fabriknummer",
    metaFabbricaPlaceholder: "z.B. 12345",
    metaTag: "Tag-Nummer",
    metaTagPlaceholder: "z.B. TK-104",
    metaCliente: "Kunde",
    metaClientePlaceholder: "z.B. Padana S.p.A.",
    metaExtended: "Gültigkeit erweitert auf folgende Fabriknummern",
    metaExtendedPlaceholder: "z.B. 12346/26, 12347/26...",

    dashTitle: "Kapazität & Geometrische Eigenschaften",
    totalCapacity: "Theoretische Gesamtkapazität",
    cylinderCapacity: "Kapazität des zylindrischen Mantels",
    headsCapacity: "Kapazität aller Böden zusammen",
    fondoCapacity: "Kapazität des unteren Bodens",
    coperchioCapacity: "Kapazität des oberen Bodens",
    totalHeight: "Innere Gesamthöhe (H_tot)",
    stepH: "Schrittweite der Aufnahme (Anteil der Höhe)",
    stepLabel: "1 mm Schritte",
    showStrappingTable: "Millimetergenaue Peiltabelle anzeigen",
    interactivePlot: "1. Tankprofil & Zonierung",
    realtimeLevel: "Echtzeit-Volumenrechner",
    currentHeight: "Füllstandshöhe",
    currentVolume: "Inhaltsvolumen",
    currentPercent: "Füllprozentsatz",
    zonesTitle: "Tankzonierung für Peiltabelle",
    zonesSub: "Integriertes mathematisches 7-Zonen-Modell (1 mm Schritte)",
    zone7Name: "Obere Kuppel (Deckel)",
    zone6Name: "Oberer Krempenübergang",
    zone5Name: "Oberer zylindrischer Bord",
    zone4Name: "Zylindrischer Mantel (L_cil)",
    zone3Name: "Unterer zylindrischer Bord",
    zone2Name: "Unterer Krempenübergang",
    zone1Name: "Untere Kuppel (Basis)",
    zoneLevelRange: "Höhenbereiche h",
    zonePartialVolume: "Teilvolumen",

    tabsLinear: "Lineare Tabelle",
    tabsGrid: "Traditionelles Raster (10 mm Schritte)",
    exportLinearCsv: "CSV-Export Lineare Tabelle (Millimeter für Millimeter)",
    exportGridCsv: "CSV-Export Rastertabelle (10 mm)",
    printPdf: "PDF-Bericht Drucken",
    stepSelector: "Schrittweite der Tabelle auswählen:",
    tableHeightBase: "Basis-Höhe",
    tableGridTitle: "PEILTABELLE (10 mm SCHRITTE)",
    tableLinearTitle: "LINEARE PEILTABELLE (1 mm SCHRITTE)",
    tableTotalVolume: "Kumuliertes Volumen",
    tableCapacityLimit: "Maximale Tankkapazität erreicht",
    printDate: "Ausstellungsdatum des Berichts",
    printPage: "Seite",
    printSignature: "Unterschrift des Bearbeiters",
    printStamp: "Firmenstempel"
  }
};
