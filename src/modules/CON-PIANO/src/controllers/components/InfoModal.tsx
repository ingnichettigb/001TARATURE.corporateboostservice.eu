/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Language } from '../../utils/translations';
import { X, Info, Cylinder, BookOpen, Layers, Settings, FileText } from 'lucide-react';

interface InfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: Language;
}

export default function InfoModal({ isOpen, onClose, lang }: InfoModalProps) {
  if (!isOpen) return null;

  const content = {
    it: {
      title: "Manuale d'Uso & Informazioni Tecniche",
      subtitle: "Modello Matematico Integrato a 7 Zone",
      intro: "Questo applicativo professionale esegue la taratura geometrica millimetrica di serbatoi cilindrici dotati di coperchio conico (cono retto con raccordo di raggio r verso il colletto) e di fondo piano (disco di lamiera con raccordo toroidale opzionale). Il calcolo volumetrico si basa su una discretizzazione continua a passo di 1 millimetro.",
      
      sections: [
        {
          icon: Layers,
          title: "1. Il Modello Matematico a 7 Zone",
          desc: "Il serbatoio viene scomposto geometricamente in 7 zone d'integrazione continue per gestire con assoluto rigore matematico la variazione di raggio dovuta al raccordo del fondo piano e alla conicità del coperchio:",
          items: [
            "**Zona 1 (Fondo piano)**: Il fondo piano non ha calotta: la zona ha altezza nulla.",
            "**Zona 2 (Raccordo del fondo piano)**: Quarto di toro di raggio r che unisce il disco piano alla parete (altezza = r). Con r = 0 non c'è raccordo e la zona ha altezza nulla.",
            "**Zona 7 (Cono del coperchio)**: Cono retto puro dal raccordo fino all'apice: il raggio decresce linearmente fino a zero.",
            "**Zona 6 (Raccordo cono/colletto del coperchio)**: Arco di raggio r tangente che collega il colletto cilindrico al cono.",
            "**Zone 3 & 5 (Colletti cilindrici diritti)**: Porzione cilindrica piana (h colletto) del fondo (zona 3) e del coperchio (zona 5) che facilita la saldatura delle testate al fasciame.",
            "**Zona 4 (Cilindro centrale / Mantello)**: Il corpo cilindrico principale del serbatoio con lunghezza L_cil."
          ]
        },
        {
          icon: Cylinder,
          title: "2. Geometria delle Testate",
          desc: "Il coperchio è sempre conico e il fondo è sempre piano:",
          items: [
            "**Coperchio conico**: Cono retto con raccordo di raggio r verso il colletto. Si imposta l'altezza totale del coperchio (colletto incluso) oppure l'inclinazione del cono: l'altro valore viene ricavato automaticamente.",
            "**Fondo piano**: Disco di lamiera piano senza calotta, con raccordo toroidale di raggio r (0 = nessun raccordo) e colletto (h colletto). La capacità del fondo è data da raccordo + colletto; il diametro di taglio comprende disco, arco di raccordo e colletto."
          ]
        },
        {
          icon: Settings,
          title: "3. Come Utilizzare il Programma",
          desc: "Seguire questi passaggi per generare una taratura conforme:",
          items: [
            "**Passo A (Anagrafica Collaudatore)**: Cliccando su 'Configura Collaudatore' è possibile personalizzare intestazione, P.IVA, PEC, contatti, logo aziendale o firma grafica da apporre automaticamente sui verbali PDF.",
            "**Passo B (Parametri Principali)**: Inserire il Diametro Interno (mm), la Lunghezza del Cilindro (mm) e la densità del fluido (kg/dm³) per calcolare anche il peso della massa liquida contenuta.",
            "**Passo C (Configurazione Testate)**: Per il coperchio conico indicare altezza totale (colletto incluso) o inclinazione del cono, raggio di raccordo r, altezza del colletto e spessore lamiera. Per il fondo piano indicare raggio di raccordo r (0 = nessuno, massimo D/2), altezza del colletto (anche 0) e spessore lamiera.",
            "**Passo D (Dati Identificativi)**: Nel pannello 'Dati Identificativi' compilare i dettagli del cliente, numero di fabbrica, numero disegno e commessa che compariranno nel verbale.",
            "**Passo E (Rapporto di Stampa)**: Utilizzare i pulsanti per scaricare la tabella centimetrica in formato CSV o stampare il PDF. È possibile scegliere la **Stampa PDF Standard** o la **Stampa PDF Condensata** (layout compatto a doppia colonna con bordi verdi elettrici)."
          ]
        },
        {
          icon: FileText,
          title: "4. Gestione Configurazioni (Salvataggio Locale & Esportazione JSON)",
          desc: "Il programma integra un doppio sistema di salvataggio sicuro progettato per darti il pieno controllo sui tuoi dati senza necessità di database online:",
          items: [
            "**Salvataggio Locale**: Digitando un nome nel campo di testo e cliccando su **Salva**, la configurazione viene memorizzata permanentemente nel browser (`localStorage`) per essere riaperta istantaneamente in futuro.",
            "**Esportazione Fisica (.json)**: Al momento del salvataggio locale, il browser avvia automaticamente il download di un file fisico con estensione `.json` sul tuo computer, nominato esattamente con il nome da te inserito. Questo apre la finestra del browser in cui puoi decidere in quale cartella salvare il file, garantendo la certezza del salvataggio.",
            "**Tasto 'Importa JSON'**: Consente di ricaricare nel programma un file di configurazione `.json` precedentemente scaricato o archiviato in qualsiasi cartella del tuo computer.",
            "**Significato delle Icone nella Lista dei Serbatoi Salvati**:",
            "✏️ **Matita (Rinomina)**: Consente di modificare velocemente il nome della configurazione direttamente all'interno della lista locale.",
            "📑 **Fogli Sovrapposti (Duplica)**: Crea una copia speculare esatta della configurazione per consentirti di creare varianti senza perdere l'originale.",
            "📥 **Freccia in giù (Esporta JSON)**: Scarica nuovamente il file `.json` specifico di quella configurazione sul tuo hard disk.",
            "🖨️ **Stampante (Stampa Rapida)**: Genera e scarica direttamente il certificato PDF completo per quella configurazione, senza doverla prima caricare nei campi attivi.",
            "📂 **Cartella Aperta (Carica / Apri)**: Carica istantaneamente tutti i dati del serbatoio nei moduli attivi del programma per calcoli o modifiche immediate.",
            "🗑️ **Cestino (Elimina)**: Rimuove permanentemente la configurazione dalla memoria locale. Include un sistema di sicurezza con doppio clic di conferma per evitare rimozioni involontarie."
          ]
        }
      ],
      closeBtn: "Ho capito, chiudi"
    },
    en: {
      title: "User Manual & Technical Info",
      subtitle: "Integrated 7-Zone Mathematical Model",
      intro: "This professional application performs high-precision millimeter-step calibration for cylindrical tanks equipped with a conical top head (straight cone with a knuckle radius joining the flange) and a flat bottom plate (with an optional toroidal knuckle). Calculations are computed continuously with 1 mm step resolution.",
      
      sections: [
        {
          icon: Layers,
          title: "1. The 7-Zone Mathematical Model",
          desc: "The tank volume is dynamically divided into 7 distinct geometric integration zones to strictly solve for the varying radius of the flat-bottom knuckle and of the conical top head:",
          items: [
            "**Zone 1 (Flat bottom)**: A flat bottom has no crown: this zone has zero height.",
            "**Zone 2 (Flat bottom knuckle)**: Quarter torus of radius r joining the flat plate to the wall (height = r). With r = 0 there is no knuckle and the zone has zero height.",
            "**Zone 7 (Top cone)**: Pure straight cone from the knuckle up to the apex: the radius decreases linearly to zero.",
            "**Zone 6 (Top cone/flange knuckle)**: Tangent arc of radius r joining the straight flange to the cone.",
            "**Zones 3 & 5 (Straight flanges / Colletti)**: Brief cylindrical sections (hColletto) of the bottom (zone 3) and top (zone 5) facilitating welding joints.",
            "**Zone 4 (Central Cylinder)**: Main cylindrical body of the tank with length L_cil."
          ]
        },
        {
          icon: Cylinder,
          title: "2. Head Geometries",
          desc: "The top head is always conical and the bottom is always flat:",
          items: [
            "**Conical top**: Straight cone with a knuckle of radius r towards the flange. Set either the total top height (flange included) or the cone inclination: the other value is derived automatically.",
            "**Flat bottom**: Flat sheet-metal plate with no crown, with a toroidal knuckle of radius r (0 = no knuckle) and a straight flange (hColletto). Bottom capacity comes from knuckle + flange; the cutting diameter covers plate, knuckle arc and flange."
          ]
        },
        {
          icon: Settings,
          title: "3. Step-by-Step Instructions",
          desc: "To generate a valid strapping report, follow this workflow:",
          items: [
            "**Step A (Inspector Profile)**: Click 'Configure Certifier' to define your company name, tax ID, email, physical address, custom corporate logo, or digital signature overlay.",
            "**Step B (Dimensions)**: Enter Inner Diameter (mm), Cylinder Length (mm), and fluid density (kg/dm³) to calculate fluid mass weight.",
            "**Step C (Heads)**: For the conical top enter total height (flange included) or cone inclination, knuckle radius r, flange height and plate thickness. For the flat bottom set knuckle radius r (0 = none, max D/2), flange height (can be 0) and plate thickness.",
            "**Step D (Metadata)**: Fill out customer name, job number, factory ID, tag number, and extended validity fields in the 'Identification' panel.",
            "**Step E (Exporting)**: Download the 1-cm grid as CSV or generate PDF reports. Choose between **Standard PDF** or **Condensed PDF** (ecological layout with bright electric green borders)."
          ]
        },
        {
          icon: FileText,
          title: "4. Configuration Management (Local Storage & JSON Export)",
          desc: "The program implements a hybrid secure saving system designed to give you total ownership of your files without requiring any online database:",
          items: [
            "**Local Saving**: Entering a name in the text field and clicking **Save** stores the configuration in the browser's local memory (`localStorage`) so you can instantly reopen it in the future.",
            "**Physical Export (.json)**: Simultaneously, the browser automatically prompts a physical `.json` file download to your computer, using the exact custom name you entered. This launches your system's download prompt where you can select the destination folder on your device.",
            "**'Import JSON' Button**: Allows you to pick a previously exported or archived `.json` file from your computer and reload it directly back into the application.",
            "**Meaning of Action Icons in the Saved List**:",
            "✏️ **Pencil (Rename)**: Quick name editing directly in the local list.",
            "📑 **Double Pages (Duplicate)**: Clones the configuration to let you create variants without overwriting the original.",
            "📥 **Down Arrow (Export JSON)**: Re-downloads that specific tank's `.json` configuration file to your computer.",
            "🖨️ **Printer (Quick Print)**: Directly compiles and downloads the PDF report for that tank without loading it in the workspace first.",
            "📂 **Open Folder (Load / Open)**: Loads all geometrical and project parameters of the tank back into the main active form.",
            "🗑️ **Trash Bin (Delete)**: Removes the tank from local memory. Includes a double-click safety verification system to prevent accidental loss."
          ]
        }
      ],
      closeBtn: "Got it, close"
    },
    es: {
      title: "Manual de Uso e Información Técnica",
      subtitle: "Modelo Matemático Integrado de 7 Zonas",
      intro: "Esta herramienta profesional realiza el cálculo geométrico milimétrico de tanques cilíndricos equipados con tapa cónica (cono recto con racor de radio r hacia el collarín) y fondo plano (con racor toroidal opcional). La resolución de cálculo es continua de 1 mm.",
      
      sections: [
        {
          icon: Layers,
          title: "1. El Modelo Matemático de 7 Zonas",
          desc: "La capacidad se integra subdividiendo el volumen en 7 secciones geométricas continuas para asegurar la exactitud:",
          items: [
            "**Zona 1 (Fondo plano)**: Un fondo plano no tiene corona: la zona tiene altura nula.",
            "**Zona 2 (Racor del fondo plano)**: Cuarto de toro de radio r que une el disco plano con la pared (altura = r). Con r = 0 no hay racor y la zona tiene altura nula.",
            "**Zona 7 (Cono de la tapa)**: Cono recto puro desde el racor hasta el vértice: el radio disminuye linealmente hasta cero.",
            "**Zona 6 (Racor cono/collarín de la tapa)**: Arco tangente de radio r que une el collarín cilíndrico con el cono.",
            "**Zonas 3 y 5 (Collarines rectos)**: Sección cilíndrica de cuello (hColletto) del fondo (zona 3) y de la tapa (zona 5).",
            "**Zona 4 (Cilindro Central)**: Cuerpo de virola del tanque con longitud L_cil."
          ]
        },
        {
          icon: Cylinder,
          title: "2. Geometrías Disponibles",
          desc: "La tapa es siempre cónica y el fondo es siempre plano:",
          items: [
            "**Tapa cónica**: Cono recto con racor de radio r hacia el collarín. Se indica la altura total de la tapa (collarín incluido) o la inclinación del cono: el otro valor se calcula automáticamente.",
            "**Fondo plano**: Disco de chapa plano sin corona, con racor toroidal de radio r (0 = sin racor) y collarín (hColletto). La capacidad del fondo proviene de racor + collarín; el diámetro de corte incluye disco, arco de racor y collarín."
          ]
        },
        {
          icon: Settings,
          title: "3. Guía de Uso del Software",
          desc: "Siga esta secuencia lógica de trabajo:",
          items: [
            "**Paso A (Datos de Inspector)**: Haga clic en 'Configurar Certificador' para definir los datos de su empresa, firma digital o logotipo personalizado.",
            "**Paso B (Cotas de Tanque)**: Inserte el diámetro interior (mm), longitud cilíndrica (mm) y densidad del fluido (kg/dm³).",
            "**Paso C (Configuración de Cabezales)**: Para la tapa cónica indique altura total (collarín incluido) o inclinación del cono, radio de racor r, altura del collarín y espesor. Para el fondo plano indique radio de racor r (0 = ninguno, máx. D/2), altura del collarín (puede ser 0) y espesor.",
            "**Paso D (Datos Identificativos)**: Registre cliente, dibujo, número de serie y tag del equipo.",
            "**Paso E (Exportación)**: Descargue la tabla en CSV o imprima informes en **PDF estándar** o **PDF Condensado** (doble columna con ribetes verde eléctrico)."
          ]
        },
        {
          icon: FileText,
          title: "4. Gestión de Configuraciones (Guardado Local y Exportación JSON)",
          desc: "El programa integra un sistema híbrido de almacenamiento seguro diseñado para darte el control total sin bases de datos en línea:",
          items: [
            "**Guardado Local**: Al escribir un nombre en el campo de texto y hacer clic en **Guardar**, la calibración se guarda en la memoria del navegador (`localStorage`) para recuperarla en cualquier momento.",
            "**Exportación Física (.json)**: Al mismo tiempo, el navegador descarga automáticamente un archivo físico `.json` con el nombre exacto especificado. Esto abre la ventana del explorador para que elijas en qué carpeta de tu computadora guardarlo.",
            "**Botón 'Importar JSON'**: Permite subir un archivo `.json` previamente exportado desde tu disco duro de vuelta al programa.",
            "**Significato delle Icone nella Lista dei Serbatoi Salvati**:",
            "✏️ **Lápiz (Renombrar)**: Permite cambiar rápidamente el nombre de la calibración directamente en la lista.",
            "📑 **Hojas Superpuestas (Duplicar)**: Crea una copia exacta de la configuración para probar variaciones sin perder la original.",
            "📥 **Flecha hacia abajo (Exportar JSON)**: Descarga nuevamente el archivo `.json` de esa calibración específica en tu dispositivo.",
            "🖨️ **Impresora (Impresión Rápida)**: Compila y descarga el reporte PDF de ese tanque directamente, sin tener que cargarlo en el formulario.",
            "📂 **Carpeta Abierta (Cargar / Abrir)**: Restaura todas las medidas y metadatos del tanque en el formulario principal para edición activa.",
            "🗑️ **Papelera (Eliminar)**: Elimina la calibración del almacenamiento local. Cuenta con confirmación de doble clic para evitar pérdidas involuntarias."
          ]
        }
      ],
      closeBtn: "Entendido, cerrar"
    },
    de: {
      title: "Benutzerhandbuch & Technische Informationen",
      subtitle: "Integriertes 7-Zonen-Mathematikmodell",
      intro: "Diese Software dient zur millimetergenauen Inhaltsberechnung (Peiltabellen) für zylindrische Behälter mit konischem Deckel (gerader Kegel mit Übergangsradius zum Bord) und flachem Boden (mit optionaler Krempe). Der Berechnungsschritt beträgt kontinuierlich 1 Millimeter.",
      
      sections: [
        {
          icon: Layers,
          title: "1. Das mathematische 7-Zonen-Modell",
          desc: "Das Gesamtvolumen wird zur Integration präzise in 7 Abschnitte unterteilt, um Knickradien und Wölbungen exakt abzubilden:",
          items: [
            "**Zone 1 (Flacher Boden)**: Ein flacher Boden hat keine Kalotte: die Zone hat die Höhe 0.",
            "**Zone 2 (Krempe des Flachbodens)**: Viertel-Torus mit Radius r zwischen ebener Scheibe und Wand (Höhe = r). Bei r = 0 gibt es keine Krempe und die Zone hat die Höhe 0.",
            "**Zone 7 (Kegel des Deckels)**: Reiner gerader Kegel von der Verrundung bis zur Spitze: der Radius nimmt linear auf null ab.",
            "**Zone 6 (Verrundung Kegel/Bord des Deckels)**: Tangentialer Bogen mit Radius r zwischen zylindrischem Bord und Kegel.",
            "**Zonen 3 & 5 (Zylindrischer Bord)**: Kurzer gerader Flanschabschnitt (hColletto) von Boden (Zone 3) und Deckel (Zone 5).",
            "**Zone 4 (Hauptzylinder)**: Der zylindrische Mantelbereich des Behälters mit Länge L_cil."
          ]
        },
        {
          icon: Cylinder,
          title: "2. Geometrien der Böden",
          desc: "Der Deckel ist immer konisch und der Boden ist immer flach:",
          items: [
            "**Konischer Deckel**: Gerader Kegel mit Verrundung (Radius r) zum Bord. Einzugeben ist die Gesamthöhe des Deckels (inkl. Bord) oder die Kegelneigung: der jeweils andere Wert wird automatisch berechnet.",
            "**Flachboden**: Ebene Blechscheibe ohne Kalotte, mit Krempe (Torus, Radius r; 0 = keine Krempe) und Bord (hColletto). Das Bodenvolumen ergibt sich aus Krempe + Bord; der Zuschnittdurchmesser umfasst Scheibe, Krempenbogen und Bord."
          ]
        },
        {
          icon: Settings,
          title: "3. Bedienungsanleitung",
          desc: "Gehen Sie wie folgt vor, um eine Peiltabelle zu erstellen:",
          items: [
            "**Schritt A (Prüferprofil)**: Klicken Sie auf 'Prüfer konfigurieren', um Ihren Firmennamen, Ihre Steuer-ID, Ihr Logo oder Ihre digitale Unterschrift zu hinterlegen.",
            "**Schritt B (Abmessungen)**: Eingabe von Innendurchmesser (mm), Mantellänge (mm) und Mediendichte (kg/dm³).",
            "**Schritt C (Böden)**: Für den konischen Deckel Gesamthöhe (inkl. Bord) oder Kegelneigung, Verrundungsradius r, Bordhöhe und Wandstärke eingeben. Für den Flachboden Krempenradius r (0 = keine, max. D/2), Bordhöhe (auch 0) und Blechdicke eingeben.",
            "**Schritt D (Projektmetadaten)**: Eingabe von Projektmetadaten (Kunde, Fabrik-Nr., Zeichnungs-Nr.).",
            "**Schritt E (Datenexport)**: Datenexport per CSV oder PDF. Wählen Sie zwischen **Standard-PDF** oder **Kompakt-PDF** (Doppelspalten-Format mit neongrünen Rändern)."
          ]
        },
        {
          icon: FileText,
          title: "4. Konfigurationsverwaltung (Lokale Speicherung & JSON-Export)",
          desc: "Das Programm verfügt über ein hybrides Speichersystem, das absolute Datensouveränität ohne Online-Datenbanken garantiert:",
          items: [
            "**Lokale Speicherung**: Nach Eingabe eines Namens und Klick auf **Speichern** wird die Konfiguration dauerhaft im Browserspeicher (`localStorage`) hinterlegt, damit Sie sie später jederzeit aufrufen können.",
            "**Physischer Export (.json)**: Gleichzeitig startet der Browser automatisch den Download einer physischen `.json`-Datei mit dem exakten von Ihnen gewählten Namen. Dadurch öffnet sich das Download-Fenster Ihres Browsers, in dem Sie den genauen Speicherort auf Ihrem Computer wählen können.",
            "**Schaltfläche 'JSON importieren'**: Ermöglicht das Laden einer zuvor exportierten `.json`-Konfigurationsdatei von Ihrem Computer zurück in das Programm.",
            "**Bedeutung der Aktionssymbole in der Liste**:",
            "✏️ **Stift (Umbenennen)**: Schnelles Ändern des Konfigurationsnamens direkt in der lokalen Liste.",
            "📑 **Doppelseiten (Duplizieren)**: Erstellt eine exakte Kopie der Konfiguration, um Varianten zu testen, ohne das Original zu überschreiben.",
            "📥 **Pfeil nach unten (JSON exportieren)**: Lädt die spezifische `.json`-Datei dieser Konfiguration erneut auf Ihren PC herunter.",
            "🖨️ **Drucker (Schnelldruck)**: Generiert und lädt das PDF-Zertifikat dieser Konfiguration direkt herunter, ohne sie vorher im Arbeitsbereich zu öffnen.",
            "📂 **Ordner öffnen (Laden / Öffnen)**: Lädt alle geometrischen Maße und Projektdaten des Behälters zurück in das aktive Hauptformular.",
            "🗑️ **Mülleimer (Löschen)**: Entfernt die Konfiguration dauerhaft aus dem Browser. Ein Sicherheits-Doppelklick verhindert versehentliches Löschen."
          ]
        }
      ],
      closeBtn: "Schließen"
    }
  };

  const tLoc = content[lang] || content.it;

  return (
    <div className="fixed inset-0 bg-neutral-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in print:hidden">
      <div className="bg-[#f4fbf7] border-2 border-emerald-900/30 rounded-2xl max-w-2xl w-full max-h-[calc(100vh-4rem)] shadow-2xl overflow-hidden animate-scale-up flex flex-col">
        {/* Header */}
        <div className="bg-emerald-950 text-white px-6 py-4 flex items-center justify-between border-b border-emerald-900 shrink-0">
          <div className="flex items-center gap-2.5">
            <Info className="w-5 h-5 text-emerald-400" />
            <div>
              <h3 className="font-extrabold text-sm uppercase tracking-wider">{tLoc.title}</h3>
              <p className="text-[10px] text-emerald-300">{tLoc.subtitle}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-emerald-300 hover:text-white p-1 hover:bg-emerald-900/50 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs text-neutral-800 leading-relaxed flex-1">
          <p className="bg-emerald-50 border border-emerald-200 text-emerald-950 p-4 rounded-xl font-medium shadow-2xs">
            {tLoc.intro}
          </p>

          <div className="space-y-4">
            {tLoc.sections.map((sect, sIdx) => {
              const Icon = sect.icon;
              return (
                <div key={sIdx} className="bg-white border border-neutral-200/80 rounded-xl p-4 shadow-3xs space-y-2">
                  <h4 className="text-xs font-black uppercase text-emerald-900 flex items-center gap-2 border-b border-neutral-100 pb-1.5">
                    <Icon className="w-4 h-4 text-emerald-700" />
                    {sect.title}
                  </h4>
                  <p className="text-neutral-700 font-medium mb-2">{sect.desc}</p>
                  <ul className="space-y-1.5 pl-1">
                    {sect.items.map((item, iIdx) => {
                      // Basic markdown bullet bold styling parser
                      const parts = item.split('**');
                      return (
                        <li key={iIdx} className="flex items-start gap-1.5">
                          <span className="text-emerald-600 font-bold mt-0.5">•</span>
                          <span className="text-neutral-700 text-[11px]">
                            {parts.map((p, pIdx) => 
                              pIdx % 2 === 1 ? <strong key={pIdx} className="font-bold text-neutral-900">{p}</strong> : p
                            )}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer actions */}
        <div className="bg-neutral-50 px-6 py-3 border-t border-neutral-200 flex justify-end shrink-0">
          <button
            id="informazione"
            onClick={onClose}
            className="bg-emerald-800 hover:bg-emerald-900 text-white font-bold py-2 px-4 rounded-xl text-xs shadow-xs transition-colors cursor-pointer"
          >
            {tLoc.closeBtn}
          </button>
        </div>
      </div>
    </div>
  );
}
