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
      subtitle: "Modello Matematico a Segmenti Circolari",
      intro: "Questo applicativo professionale esegue la taratura geometrica millimetrica di serbatoi cilindrici orizzontali dotati di due teste coniche, anche inclinati. Il livello è misurato dal punto più basso interno e il calcolo volumetrico si basa su una discretizzazione a fette di 1 millimetro lungo l'asse.",
      
      sections: [
        {
          icon: Layers,
          title: "1. Il Modello Matematico a Segmenti Circolari",
          desc: "Il serbatoio è scomposto in fette perpendicolari all'asse (1 mm). Ogni fetta è un cerchio di raggio r(x) e, a un dato livello h, il liquido occupa il segmento circolare sotto il pelo libero:",
          items: [
            "**Cilindro**: sezione circolare costante di raggio R = D/2; area del segmento A = R²·acos((R−y)/R) − (R−y)·√(2Ry−y²), con y altezza del liquido nella sezione.",
            "**Testa conica (tronco di cono + raccordo)**: il raggio r(x) varia linearmente nel cono e con arco tangente nel raccordo cono/colletto; l'area del segmento è calcolata fetta per fetta.",
            "**Colletti cilindrici**: brevi tratti diritti tra raccordo e cilindro.",
            "**Inclinazione**: se l'asse è inclinato dell'angolo θ, il pelo libero taglia ogni sezione a una quota diversa y0 = (h − x·sinθ)/cosθ; il livello h è misurato dal punto più basso del serbatoio."
          ]
        },
        {
          icon: Cylinder,
          title: "2. Geometria delle Teste Coniche",
          desc: "Entrambe le teste sono coniche con raccordo cono/colletto:",
          items: [
            "**Altezza testa (cono + raccordo + colletto)**: quota assiale totale della testa, colletto incluso.",
            "**Inclinazione del cono (α)**: angolo tra la generatrice del cono e il piano di base; è legato all'altezza della testa e viene aggiornato automaticamente.",
            "**Raggio di raccordo**: raggio dell'arco tangente tra cono e colletto cilindrico."
          ]
        },
        {
          icon: Settings,
          title: "3. Come Utilizzare il Programma",
          desc: "Seguire questi passaggi per generare una taratura conforme:",
          items: [
            "**Passo A (Anagrafica Collaudatore)**: Cliccando su 'Configura Collaudatore' è possibile personalizzare intestazione, P.IVA, PEC, contatti, logo aziendale o firma grafica da apporre automaticamente sui verbali PDF.",
            "**Passo B (Parametri Principali)**: Inserire il Diametro Interno (mm), la Lunghezza del Cilindro (mm), l'eventuale Inclinazione dell'asse (° — 0 = perfettamente orizzontale) e la densità del fluido (kg/dm³).",
            "**Passo C (Configurazione Teste)**: Definire lo spessore delle lamiere, l'altezza del colletto e l'altezza della testa. Selezionare se le teste sono identiche o se la testa sinistra differisce dalla destra.",
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
      subtitle: "Circular-Segment Mathematical Model",
      intro: "This professional application performs high-precision millimeter-step calibration for horizontal cylindrical tanks with two conical heads, including tilted tanks. Level is measured from the lowest internal point and volume is integrated in 1 mm slices along the axis.",
      
      sections: [
        {
          icon: Layers,
          title: "1. The Circular-Segment Mathematical Model",
          desc: "The tank is split into slices perpendicular to the axis (1 mm). Each slice is a circle of radius r(x); at a given level h the liquid fills the circular segment below the free surface:",
          items: [
            "**Cylinder**: constant circular section of radius R = D/2; segment area A = R²·acos((R−y)/R) − (R−y)·√(2Ry−y²), where y is the liquid depth in the section.",
            "**Conical head (cone + knuckle)**: radius r(x) varies linearly along the cone and follows a tangent arc in the cone/flange knuckle; the segment area is evaluated slice by slice.",
            "**Straight flanges**: short straight sections between knuckle and cylinder.",
            "**Tilt**: with axis tilt θ, the free surface cuts each section at a different height y0 = (h − x·sinθ)/cosθ; level h is measured from the lowest point of the tank."
          ]
        },
        {
          icon: Cylinder,
          title: "2. Conical Head Geometry",
          desc: "Both heads are conical with a cone/flange knuckle:",
          items: [
            "**Head height (cone + knuckle + flange)**: total axial length of the head, flange included.",
            "**Cone angle (α)**: angle between the cone generatrix and the base plane; tied to head height and updated automatically.",
            "**Knuckle radius**: radius of the tangent arc between cone and straight flange."
          ]
        },
        {
          icon: Settings,
          title: "3. Step-by-Step Instructions",
          desc: "To generate a valid strapping report, follow this workflow:",
          items: [
            "**Step A (Inspector Profile)**: Click 'Configure Certifier' to define your company name, tax ID, email, physical address, custom corporate logo, or digital signature overlay.",
            "**Step B (Dimensions)**: Enter Inner Diameter (mm), Cylinder Length (mm), the optional axis Tilt (° — 0 = perfectly horizontal) and fluid density (kg/dm³).",
            "**Step C (Heads)**: Set plate thickness, flange height and head height. Enable unequal heads to model different left/right heads.",
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
      subtitle: "Modelo Matemático de Segmentos Circulares",
      intro: "Esta herramienta profesional realiza el aforo milimétrico de tanques cilíndricos horizontales con dos cabezales cónicos, también inclinados. El nivel se mide desde el punto interior más bajo y el volumen se integra en rebanadas de 1 mm a lo largo del eje.",
      
      sections: [
        {
          icon: Layers,
          title: "1. El Modelo Matemático de Segmentos Circulares",
          desc: "El tanque se divide en rebanadas perpendiculares al eje (1 mm). Cada rebanada es un círculo de radio r(x); a un nivel h el líquido ocupa el segmento circular bajo la superficie libre:",
          items: [
            "**Cilindro**: sección circular constante de radio R = D/2; área del segmento A = R²·acos((R−y)/R) − (R−y)·√(2Ry−y²), con y la altura del líquido en la sección.",
            "**Cabezal cónico (cono + acuerdo)**: el radio r(x) varía linealmente en el cono y con un arco tangente en el acuerdo cono/cuello; el área del segmento se evalúa rebanada a rebanada.",
            "**Cuellos cilíndricos**: tramos rectos cortos entre el acuerdo y el cilindro.",
            "**Inclinación**: con el eje inclinado un ángulo θ, la superficie libre corta cada sección a una altura y0 = (h − x·sinθ)/cosθ; el nivel h se mide desde el punto más bajo del tanque."
          ]
        },
        {
          icon: Cylinder,
          title: "2. Geometría de los Cabezales Cónicos",
          desc: "Ambos cabezales son cónicos con acuerdo cono/cuello:",
          items: [
            "**Altura del cabezal (cono + acuerdo + cuello)**: longitud axial total del cabezal, cuello incluido.",
            "**Ángulo del cono (α)**: ángulo entre la generatriz del cono y el plano de base; depende de la altura del cabezal y se actualiza automáticamente.",
            "**Radio de acuerdo**: radio del arco tangente entre cono y cuello cilíndrico."
          ]
        },
        {
          icon: Settings,
          title: "3. Guía de Uso del Software",
          desc: "Siga esta secuencia lógica de trabajo:",
          items: [
            "**Paso A (Datos de Inspector)**: Haga clic en 'Configurar Certificador' para definir los datos de su empresa, firma digital o logotipo personalizado.",
            "**Paso B (Cotas de Tanque)**: Inserte el diámetro interior (mm), la longitud cilíndrica (mm), la inclinación opcional del eje (° — 0 = perfectamente horizontal) y la densidad del fluido (kg/dm³).",
            "**Paso C (Configuración de Cabezales)**: Defina el espesor, la altura del cuello y la altura del cabezal. Active cabezales desiguales si es necesario.",
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
      subtitle: "Kreissegment-Mathematikmodell",
      intro: "Diese Software dient zur millimetergenauen Peilung liegender zylindrischer Behälter mit zwei konischen Böden, auch geneigt. Der Füllstand wird ab dem tiefsten Innenpunkt gemessen; das Volumen wird in 1-mm-Scheiben entlang der Achse integriert.",
      
      sections: [
        {
          icon: Layers,
          title: "1. Das Kreissegment-Mathematikmodell",
          desc: "Der Behälter wird in Scheiben senkrecht zur Achse (1 mm) zerlegt. Jede Scheibe ist ein Kreis mit Radius r(x); bei Füllstand h füllt die Flüssigkeit das Kreissegment unter dem Flüssigkeitsspiegel:",
          items: [
            "**Zylinder**: konstanter Kreisquerschnitt mit Radius R = D/2; Segmentfläche A = R²·acos((R−y)/R) − (R−y)·√(2Ry−y²), mit y = Flüssigkeitshöhe im Querschnitt.",
            "**Konischer Boden (Kegel + Übergang)**: r(x) verläuft im Kegel linear und im Übergang Kegel/Bord als tangentialer Bogen; die Segmentfläche wird scheibenweise berechnet.",
            "**Zylindrische Borde**: kurze gerade Abschnitte zwischen Übergang und Zylinder.",
            "**Neigung**: bei Achsneigung θ schneidet der Spiegel jede Scheibe auf anderer Höhe y0 = (h − x·sinθ)/cosθ; der Füllstand h wird ab dem tiefsten Punkt gemessen."
          ]
        },
        {
          icon: Cylinder,
          title: "2. Geometrie der konischen Böden",
          desc: "Beide Böden sind konisch mit Übergang Kegel/Bord:",
          items: [
            "**Bodenlänge (Kegel + Übergang + Bord)**: gesamte axiale Länge des Bodens inkl. Bord.",
            "**Kegelwinkel (α)**: Winkel zwischen Kegelmantellinie und Grundebene; abhängig von der Bodenlänge, wird automatisch aktualisiert.",
            "**Übergangsradius**: Radius des tangentialen Bogens zwischen Kegel und Bord."
          ]
        },
        {
          icon: Settings,
          title: "3. Bedienungsanleitung",
          desc: "Gehen Sie wie folgt vor, um eine Peiltabelle zu erstellen:",
          items: [
            "**Schritt A (Prüferprofil)**: Klicken Sie auf 'Prüfer konfigurieren', um Ihren Firmennamen, Ihre Steuer-ID, Ihr Logo oder Ihre digitale Unterschrift zu hinterlegen.",
            "**Schritt B (Abmessungen)**: Eingabe von Innendurchmesser (mm), Mantellänge (mm), optionaler Achsneigung (° — 0 = exakt waagerecht) und Mediendichte (kg/dm³).",
            "**Schritt C (Behälterböden)**: Eingabe von Wandstärke, Bordhöhe und Bodenlänge. Ungleiche Böden für links/rechts möglich.",
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
