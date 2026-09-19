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
      intro: "Questo applicativo professionale esegue la taratura geometrica millimetrica di serbatoi cilindrici ad asse orizzontale dotati di fondo conico e coperchio bombato standard (Klöpper, Korbbogen), piano o completamente personalizzato. Il calcolo volumetrico si basa su una discretizzazione continua a passo di 1 millimetro.",
      
      sections: [
        {
          icon: Layers,
          title: "1. Il Modello Matematico a 7 Zone",
          desc: "Il serbatoio viene scomposto geometricamente in 7 zone d'integrazione continue per gestire con assoluto rigore matematico la variazione di raggio dovuta alla raccordatura e alla bombatura dei fondi:",
          items: [
            "**Zone 1 & 7 (Calotte sferiche esterne)**: Corrispondono alla porzione bombata centrale di raggio R delle due testate.",
            "**Zone 2 & 6 (Raccordi torisferici)**: Gestiscono la curvatura di raccordo r (knuckle radius) che unisce la calotta centrale al colletto cilindrico.",
            "**Zone 3 & 5 (Colletti cilindrici diritti)**: Porzione cilindrica piana (h colletto) che facilita la saldatura delle testate al fasciame.",
            "**Zona 4 (Cilindro centrale / Mantello)**: Il corpo cilindrico principale del serbatoio con lunghezza L_cil."
          ]
        },
        {
          icon: Cylinder,
          title: "2. Geometria delle Testate",
          desc: "È possibile selezionare diverse tipologie di testate:",
          items: [
            "**Decinormale**: Raggio calotta R = 1 × D, raggio di raccordo r = D / 10.",
            "**Pseudoellittico**: Raggio calotta R = 0.833 × D, raggio di raccordo r = 0.156 × D.",
            "**Custom**: Consente di definire a piacimento R (Raggio calotta) e r (Raggio raccordo) per coprire misure non standard."
          ]
        },
        {
          icon: Settings,
          title: "3. Come Utilizzare il Programma",
          desc: "Seguire questi passaggi per generare una taratura conforme:",
          items: [
            "**Passo A (Anagrafica Collaudatore)**: Cliccando su 'Configura Collaudatore' è possibile personalizzare intestazione, P.IVA, PEC, contatti, logo aziendale o firma grafica da apporre automaticamente sui verbali PDF.",
            "**Passo B (Parametri Principali)**: Inserire il Diametro Interno (mm), la Lunghezza del Cilindro (mm) e la densità del fluido (kg/dm³) per calcolare anche il peso della massa liquida contenuta.",
            "**Passo C (Configurazione Fondi)**: Definire lo spessore delle lamiere e l'altezza del colletto. Selezionare se le testate sono identiche o se il fondo inferiore differisce da quello superiore.",
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
      intro: "This professional application performs high-precision millimeter-step strapping and calibration for horizontal cylindrical tanks equipped with standard (Klöpper, Korbbogen), flat, or fully custom torispherical heads. Calculations are computed continuously with 1 mm step resolution.",
      
      sections: [
        {
          icon: Layers,
          title: "1. The 7-Zone Mathematical Model",
          desc: "The tank volume is dynamically divided into 7 distinct geometric integration zones to strictly solve for the varying radii of the dished heads:",
          items: [
            "**Zones 1 & 7 (Outer spherical crown)**: Central dished part with radius R of the two heads.",
            "**Zones 2 & 6 (Torispherical knuckle joints)**: Curved transitions with radius r (knuckle radius) joining the central crown to the straight flange.",
            "**Zones 3 & 5 (Straight flanges / Colletti)**: Brief cylindrical sections (hColletto) facilitating welding joints.",
            "**Zone 4 (Central Cylinder)**: Main cylindrical body of the tank with length L_cil."
          ]
        },
        {
          icon: Cylinder,
          title: "2. Dished Head Geometries",
          desc: "Choose from the following tank heads:",
          items: [
            "**Decinormale**: Crown radius R = 1 × D, knuckle radius r = D / 10.",
            "**Pseudoellittico**: Crown radius R = 0.833 × D, knuckle radius r = 0.156 × D.",
            "**Custom**: Input custom R (crown radius) and r (knuckle radius) to match non-standard dimensions."
          ]
        },
        {
          icon: Settings,
          title: "3. Step-by-Step Instructions",
          desc: "To generate a valid strapping report, follow this workflow:",
          items: [
            "**Step A (Inspector Profile)**: Click 'Configure Certifier' to define your company name, tax ID, email, physical address, custom corporate logo, or digital signature overlay.",
            "**Step B (Dimensions)**: Enter Inner Diameter (mm), Cylinder Length (mm), and fluid density (kg/dm³) to calculate fluid mass weight.",
            "**Step C (Dished Heads)**: Set plate thickness and straight flange height. Enable unequal heads to model distinct upper/lower profiles.",
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
      intro: "Esta herramienta profesional realiza el cálculo geométrico milimétrico de tanques cilíndricos horizontales equipados con fondos abombados estándar (Klöpper, Korbbogen), planos o personalizados. La resolución de cálculo es continua de 1 mm.",
      
      sections: [
        {
          icon: Layers,
          title: "1. El Modelo Matemático de 7 Zonas",
          desc: "La capacidad se integra subdividiendo el volumen en 7 secciones geométricas continuas para asegurar la exactitud:",
          items: [
            "**Zonas 1 y 7 (Corona central de fondos)**: Parte abombada de radio de abombamiento R.",
            "**Zonas 2 y 6 (Racor torisférico de fondos)**: Transición curva con radio de acuerdo r.",
            "**Zonas 3 y 5 (Collarines rectos)**: Sección cilíndrica de cuello (hColletto) de las cabezas.",
            "**Zona 4 (Cilindro Central)**: Cuerpo de virola del tanque con longitud L_cil."
          ]
        },
        {
          icon: Cylinder,
          title: "2. Geometrías Disponibles",
          desc: "Admite las normativas de fondos abombados:",
          items: [
            "**Decinormale**: Radio de abombamiento R = 1 × D, radio de acuerdo r = D / 10.",
            "**Pseudoellittico**: Radio de abombamiento R = 0.833 × D, radio de acuerdo r = 0.156 × D.",
            "**Custom**: Permite especificar medidas no estándar de R y r a conveniencia para copiar cualquier diseño industrial."
          ]
        },
        {
          icon: Settings,
          title: "3. Guía de Uso del Software",
          desc: "Siga esta secuencia lógica de trabajo:",
          items: [
            "**Paso A (Datos de Inspector)**: Haga clic en 'Configurar Certificador' para definir los datos de su empresa, firma digital o logotipo personalizado.",
            "**Paso B (Cotas de Tanque)**: Inserte el diámetro interior (mm), longitud cilíndrica (mm) y densidad del fluido (kg/dm³).",
            "**Paso C (Configuración de Tapas)**: Defina el espesor y la altura del cuello soldado. Active tapas desiguales si es necesario.",
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
      intro: "Diese Software dient zur millimetergenauen Inhaltsberechnung (Peiltabellen) für liegende zylindrische Behälter mit Standardböden (Klöpper, Korbbogen), flachen oder kundenspezifischen Klöpperböden. Der Berechnungsschritt beträgt kontinuierlich 1 Millimeter.",
      
      sections: [
        {
          icon: Layers,
          title: "1. Das mathematische 7-Zonen-Modell",
          desc: "Das Gesamtvolumen wird zur Integration präzise in 7 Abschnitte unterteilt, um Knickradien und Wölbungen exakt abzubilden:",
          items: [
            "**Zonen 1 & 7 (Zentraler Kugelbereich)**: Gewölbter Hauptteil mit Radius R der Behälterböden.",
            "**Zonen 2 & 6 (Krempenbereich)**: Übergangsradius r (Krempenradius) zur Verbindung mit der zylindrischen Zarge.",
            "**Zonen 3 & 5 (Zylindrischer Bord)**: Kurzer gerader Flanschabschnitt (hColletto).",
            "**Zone 4 (Hauptzylinder)**: Der zylindrische Mantelbereich des Behälters mit Länge L_cil."
          ]
        },
        {
          icon: Cylinder,
          title: "2. Geometrien der Behälterböden",
          desc: "Folgende Geometrien stehen zur Auswahl:",
          items: [
            "**Decinormale**: Wölbungsradius R = 1 × D, Krempenradius r = D / 10.",
            "**Pseudoellittico**: Wölbungsradius R = 0,833 × D, Krempenradius r = 0,156 × D.",
            "**Custom**: Freie Angabe von R und r zur Nachbildung beliebiger nicht standardisierter Maße."
          ]
        },
        {
          icon: Settings,
          title: "3. Bedienungsanleitung",
          desc: "Gehen Sie wie folgt vor, um eine Peiltabelle zu erstellen:",
          items: [
            "**Schritt A (Prüferprofil)**: Klicken Sie auf 'Prüfer konfigurieren', um Ihren Firmennamen, Ihre Steuer-ID, Ihr Logo oder Ihre digitale Unterschrift zu hinterlegen.",
            "**Schritt B (Abmessungen)**: Eingabe von Innendurchmesser (mm), Mantellänge (mm) und Mediendichte (kg/dm³).",
            "**Schritt C (Behälterböden)**: Eingabe der Wandstärke und Bordhöhe für oberen/unteren Boden.",
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
