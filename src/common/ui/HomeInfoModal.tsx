import { Info } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from "@/components/ui/dialog";
import type { AppLanguage } from "@/common/language/storage";

interface HomeInfoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lang: AppLanguage;
}

const CONTENT: Record<
  AppLanguage,
  {
    title: string;
    subtitle: string;
    intro: string;
    sections: { title: string; desc: string }[];      {
        title: "4. Gestione e disinstallazione dell'app",
        desc: "L'icona installata può chiamarsi Taratura Serbatoi, 001tarature, 001-tarature o Smart Launcher.\n\n• Google Chrome (computer): scrivi chrome://apps e premi Invio, poi clic destro sull'icona > \"Rimuovi da Chrome\" / \"Disinstalla\". In alternativa: apri l'app, menu a 3 puntini > \"Disinstalla\".\n• Microsoft Edge (computer): scrivi edge://apps, clic sui 3 puntini accanto all'app > \"Disinstalla\". In alternativa: menu ... > App > Gestisci app.\n• Brave: scrivi brave://apps, clic destro sull'icona > \"Rimuovi da Brave\".\n• Opera / Vivaldi: scrivi opera://apps oppure vivaldi://apps e rimuovi l'icona con clic destro.\n• Safari (Mac, macOS Sonoma o successivi): Finder > Applicazioni, trascina l'icona nel Cestino.\n• Mozilla Firefox: non installa app; elimina eventuali segnalibri o collegamenti con clic destro > \"Elimina\".\n• Windows (qualsiasi browser): Impostazioni > App > App installate, cerca il nome dell'app > \"Disinstalla\".\n• Android (Chrome / Samsung Internet): tieni premuta l'icona > \"Disinstalla\" (oppure Impostazioni > App).\n• iPhone / iPad (Safari): tieni premuta l'icona > \"Rimuovi app\" > \"Elimina dalla schermata Home\".\n\nNota: la disinstallazione rimuove solo l'icona. La licenza resta valida e puoi riattivarla con email e PUK; i dati salvati nel browser (intestazione e serbatoi) potrebbero essere cancellati: esportali prima in JSON.",
      },

    closeBtn: string;
  }
> = {
  it: {
    title: "Come funziona questa pagina",
    subtitle: "Menu principale — Taratura Serbatoi",
    intro:
      "Questa è la pagina iniziale della suite: da qui si accede a tutti i moduli di calcolo per la taratura dei serbatoi.",
    sections: [
      {
        title: "1. Dati Comuni → Intestazione Report",
        desc: "Si compila una sola volta: ragione sociale, P.IVA, contatti, logo e note. Questi dati vengono poi usati automaticamente su tutti i certificati PDF generati da qualsiasi modulo, senza doverli reinserire ogni volta.",
      },
      {
        title: "2. Moduli di calcolo",
        desc: "Ogni card rappresenta una configurazione di testate (es. Coperchio Bombato / Fondo Conico). Solo i moduli contrassegnati 'Attivo' sono già utilizzabili; quelli 'In preparazione' verranno abilitati in seguito. Cliccando su un modulo attivo si apre l'applicativo completo: geometria, calcolo, tabella di calibrazione e certificato PDF.",
      },
      {
        title: "3. Selettore lingua",
        desc: "Il pulsante lingua in alto a destra è persistente: la lingua scelta qui viene ricordata anche quando apri un modulo, e viceversa se la cambi dentro un modulo resterà impostata anche qui al ritorno al menu.",
      },
      {
        title: "4. Gestione e disinstallazione dell'app",
        desc: `L'icona installata può chiamarsi Taratura Serbatoi, 001tarature, 001-tarature o Smart Launcher.

• Google Chrome (computer): scrivi chrome://apps nella barra degli indirizzi e premi Invio, poi clic destro sull'icona > "Rimuovi da Chrome" / "Disinstalla". In alternativa: apri l'app, menu a 3 puntini in alto > "Disinstalla Taratura Serbatoi".
• Microsoft Edge (computer): scrivi edge://apps e premi Invio, poi clic sui 3 puntini accanto all'app > "Disinstalla". In alternativa: menu ... > App > Gestisci app.
• Brave: scrivi brave://apps e premi Invio, poi clic destro sull'icona > "Rimuovi da Brave".
• Opera / Vivaldi: scrivi opera://apps oppure vivaldi://apps e rimuovi l'icona con clic destro.
• Safari (Mac, macOS Sonoma o successivi): apri il Finder > cartella Applicazioni (o Applicazioni utente), trascina l'icona nel Cestino.
• Mozilla Firefox: non installa app su computer; se hai creato un segnalibro o un collegamento, eliminalo con clic destro > "Elimina".
• Windows (qualsiasi browser): Impostazioni > App > App installate, cerca "Taratura Serbatoi" o "001tarature" > "Disinstalla".
• Android (Chrome / Samsung Internet): tieni premuta l'icona nella schermata Home > "Disinstalla" (oppure Impostazioni > App).
• iPhone / iPad (Safari): tieni premuta l'icona nella schermata Home > "Rimuovi app" > "Elimina dalla schermata Home".

Nota: la disinstallazione rimuove solo l'icona e l'avvio rapido dal dispositivo; l'intestazione comune, i serbatoi salvati e la validità della licenza rimangono al sicuro nella memoria del browser e nel database.`,
      },
      {
        title: "4. App management and uninstallation",
        desc: "The installed icon may be named Tank Calibration, 001tarature, 001-tarature or Smart Launcher.\n\n• Google Chrome (computer): type chrome://apps and press Enter, right-click the icon > \"Remove from Chrome\" / \"Uninstall\". Or: open the app, 3-dots menu > \"Uninstall\".\n• Microsoft Edge (computer): type edge://apps, click the 3 dots next to the app > \"Uninstall\". Or: menu ... > Apps > Manage apps.\n• Brave: type brave://apps, right-click the icon > \"Remove from Brave\".\n• Opera / Vivaldi: type opera://apps or vivaldi://apps and remove the icon with right-click.\n• Safari (Mac, macOS Sonoma or later): Finder > Applications, drag the icon to the Trash.\n• Mozilla Firefox: does not install apps; delete any bookmark or shortcut with right-click > \"Delete\".\n• Windows (any browser): Settings > Apps > Installed apps, find the app > \"Uninstall\".\n• Android (Chrome / Samsung Internet): press and hold the icon > \"Uninstall\" (or Settings > Apps).\n• iPhone / iPad (Safari): press and hold the icon > \"Remove App\" > \"Delete from Home Screen\".\n\nNote: uninstalling only removes the icon. Your license stays valid and can be reactivated with email and PUK; data stored in the browser (header and tanks) may be erased: export it to JSON first.",
      },
    ],
    closeBtn: "Ho capito, chiudi",
  },
  en: {
    title: "How this page works",
    subtitle: "Main menu — Tank Calibration",
    intro:
      "This is the suite's landing page: from here you can access all the tank calibration calculation modules.",
    sections: [
      {
        title: "1. Common Data → Report Header",
        desc: "Fill it in once: company name, VAT number, contacts, logo and notes. This data is then automatically used on every PDF certificate generated by any module, without re-entering it each time.",
      },
      {
        title: "2. Calculation modules",
        desc: "Each card represents a head configuration (e.g. Dished Head / Conical Bottom). Only modules marked 'Active' are already usable; those 'In preparation' will be enabled later. Clicking an active module opens the full application: geometry, calculation, calibration table and PDF certificate.",
      },
      {
        title: "3. Language switcher",
        desc: "The language button in the top-right is persistent: the language chosen here is remembered when you open a module, and if you change it inside a module it stays set here too when you return to the menu.",
      },
      {
        title: "4. App management and uninstallation",
        desc: `The installed icon may be named Tank Calibration, 001tarature, 001-tarature, or Smart Launcher.

• Google Chrome (computer): type chrome://apps in the address bar and press Enter, then right-click the icon > "Remove from Chrome" / "Uninstall". Alternatively: open the app, 3-dots menu at the top > "Uninstall Tank Calibration".
• Microsoft Edge (computer): type edge://apps and press Enter, then click the 3 dots next to the app > "Uninstall". Alternatively: menu ... > Apps > Manage apps.
• Brave: type brave://apps and press Enter, then right-click the icon > "Remove from Brave".
• Opera / Vivaldi: type opera://apps or vivaldi://apps and remove the icon with right-click.
• Safari (Mac, macOS Sonoma or later): open Finder > Applications folder (or User Applications), drag the icon to the Trash.
• Mozilla Firefox: does not install desktop apps; if you created a bookmark or desktop shortcut, right-click > "Delete".
• Windows (any browser): Settings > Apps > Installed apps, search for "Tank Calibration" or "001tarature" > "Uninstall".
• Android (Chrome / Samsung Internet): press and hold the home screen icon > "Uninstall" (or Settings > Apps).
• iPhone / iPad (Safari): press and hold the home screen icon > "Remove App" > "Delete from Home Screen".

Note: uninstallation only removes the icon and quick launcher from your device; report headers, saved tank configurations, and your license stay safely stored.`,
      },
      {
        title: "4. Gestión y desinstalación de la app",
        desc: "El icono instalado puede llamarse Calibración de Tanques, 001tarature, 001-tarature o Smart Launcher.\n\n• Google Chrome (ordenador): escribe chrome://apps y pulsa Intro, clic derecho en el icono > \"Quitar de Chrome\" / \"Desinstalar\". O bien: abre la app, menú de 3 puntos > \"Desinstalar\".\n• Microsoft Edge (ordenador): escribe edge://apps, clic en los 3 puntos junto a la app > \"Desinstalar\". O bien: menú ... > Aplicaciones > Administrar aplicaciones.\n• Brave: escribe brave://apps, clic derecho en el icono > \"Quitar de Brave\".\n• Opera / Vivaldi: escribe opera://apps o vivaldi://apps y elimina el icono con clic derecho.\n• Safari (Mac, macOS Sonoma o posterior): Finder > Aplicaciones, arrastra el icono a la Papelera.\n• Mozilla Firefox: no instala apps; elimina marcadores o accesos directos con clic derecho > \"Eliminar\".\n• Windows (cualquier navegador): Configuración > Aplicaciones > Aplicaciones instaladas, busca la app > \"Desinstalar\".\n• Android (Chrome / Samsung Internet): mantén pulsado el icono > \"Desinstalar\" (o Ajustes > Aplicaciones).\n• iPhone / iPad (Safari): mantén pulsado el icono > \"Eliminar app\" > \"Eliminar de la pantalla de inicio\".\n\nNota: la desinstalación solo elimina el icono. La licencia sigue válida y puede reactivarse con email y PUK; los datos guardados en el navegador (encabezado y tanques) podrían borrarse: expórtalos antes en JSON.",
      },
    ],
    closeBtn: "Got it, close",
  },
  es: {
    title: "Cómo funciona esta página",
    subtitle: "Menú principal — Calibración de Tanques",
    intro:
      "Esta es la página inicial de la suite: desde aquí se accede a todos los módulos de cálculo para la calibración de tanques.",
    sections: [
      {
        title: "1. Datos Comunes → Encabezado del Informe",
        desc: "Se rellena una sola vez: razón social, NIF, contactos, logo y notas. Estos datos se usan automáticamente en todos los certificados PDF generados por cualquier módulo, sin necesidad de volver a introducirlos.",
      },
      {
        title: "2. Módulos de cálculo",
        desc: "Cada tarjeta representa una configuración de cabezales (ej. Fondo Abombado / Fondo Cónico). Solo los módulos marcados como 'Activo' ya son utilizables; los 'En preparación' se habilitarán más adelante. Al hacer clic en un módulo activo se abre la aplicación completa: geometría, cálculo, tabla de calibración y certificado PDF.",
      },
      {
        title: "3. Selector de idioma",
        desc: "El botón de idioma arriba a la derecha es persistente: el idioma elegido aquí se recuerda al abrir un módulo, y si lo cambias dentro de un módulo, seguirá configurado aquí al volver al menú.",
      },
      {
        title: "4. Gestión y desinstalación de la aplicación",
        desc: `El icono instalado puede llamarse Calibración de Tanques, 001tarature, 001-tarature o Smart Launcher.

• Google Chrome (ordenador): escribe chrome://apps en la barra de direcciones y pulsa Intro, clic derecho en el icono > "Eliminar de Chrome" / "Desinstalar". Alternativa: abre la app, menú de 3 puntos arriba > "Desinstalar Calibración de Tanques".
• Microsoft Edge (ordenador): escribe edge://apps y pulsa Intro, clic en los 3 puntos junto a la app > "Desinstalar". Alternativa: menú ... > Aplicaciones > Administrar aplicaciones.
• Brave: escribe brave://apps y pulsa Intro, clic derecho en el icono > "Eliminar de Brave".
• Opera / Vivaldi: escribe opera://apps o vivaldi://apps y elimina el icono con clic derecho.
• Safari (Mac, macOS Sonoma o posterior): abre Finder > carpeta Aplicaciones, arrastra el icono a la Papelera.
• Mozilla Firefox: no instala aplicaciones de escritorio; si creaste un marcador o acceso directo, haz clic derecho > "Eliminar".
• Windows (cualquier navegador): Configuración > Aplicaciones > Aplicaciones instaladas, busca "001tarature" > "Desinstalar".
• Android (Chrome / Samsung Internet): mantén pulsado el icono en la pantalla de inicio > "Desinstalar" (o Ajustes > Aplicaciones).
• iPhone / iPad (Safari): mantén pulsado el icono en la pantalla de inicio > "Eliminar app" > "Eliminar de la pantalla de inicio".

Nota: la desinstalación solo elimina el acceso directo; los datos comunes del informe, los tanques guardados y la licencia activa permanecen protegidos.`,
      },
      {
        title: "4. App-Verwaltung und Deinstallation",
        desc: "Das installierte Symbol kann Behälterkalibrierung, 001tarature, 001-tarature oder Smart Launcher heißen.\n\n• Google Chrome (Computer): chrome://apps eingeben und Enter drücken, Rechtsklick auf das Symbol > \"Aus Chrome entfernen\" / \"Deinstallieren\". Oder: App öffnen, 3-Punkte-Menü > \"Deinstallieren\".\n• Microsoft Edge (Computer): edge://apps eingeben, auf die 3 Punkte neben der App klicken > \"Deinstallieren\". Oder: Menü ... > Apps > Apps verwalten.\n• Brave: brave://apps eingeben, Rechtsklick auf das Symbol > \"Aus Brave entfernen\".\n• Opera / Vivaldi: opera://apps oder vivaldi://apps eingeben und das Symbol per Rechtsklick entfernen.\n• Safari (Mac, macOS Sonoma oder neuer): Finder > Programme, Symbol in den Papierkorb ziehen.\n• Mozilla Firefox: installiert keine Apps; Lesezeichen oder Verknüpfungen per Rechtsklick > \"Löschen\" entfernen.\n• Windows (jeder Browser): Einstellungen > Apps > Installierte Apps, App suchen > \"Deinstallieren\".\n• Android (Chrome / Samsung Internet): Symbol gedrückt halten > \"Deinstallieren\" (oder Einstellungen > Apps).\n• iPhone / iPad (Safari): Symbol gedrückt halten > \"App entfernen\" > \"Vom Home-Bildschirm entfernen\".\n\nHinweis: Die Deinstallation entfernt nur das Symbol. Die Lizenz bleibt gültig und kann mit E-Mail und PUK reaktiviert werden; im Browser gespeicherte Daten (Berichtskopf und Behälter) können gelöscht werden: vorher als JSON exportieren.",
      },
    ],
    closeBtn: "Entendido, cerrar",
  },
  de: {
    title: "So funktioniert diese Seite",
    subtitle: "Hauptmenü — Behälterkalibrierung",
    intro:
      "Dies ist die Startseite der Suite: von hier aus erreichen Sie alle Berechnungsmodule für die Behälterkalibrierung.",
    sections: [
      {
        title: "1. Gemeinsame Daten → Berichtskopf",
        desc: "Einmal ausfüllen: Firmenname, USt-IdNr., Kontakte, Logo und Notizen. Diese Daten werden dann automatisch auf jedem PDF-Zertifikat verwendet, das von einem beliebigen Modul erzeugt wird, ohne erneute Eingabe.",
      },
      {
        title: "2. Berechnungsmodule",
        desc: "Jede Karte steht für eine Bodenkonfiguration (z. B. Gewölbter Deckel / Konischer Boden). Nur mit 'Aktiv' gekennzeichnete Module sind bereits nutzbar; 'In Vorbereitung' werden später freigeschaltet. Ein Klick auf ein aktives Modul öffnet die vollständige Anwendung: Geometrie, Berechnung, Kalibriertabelle und PDF-Zertifikat.",
      },
      {
        title: "3. Sprachauswahl",
        desc: "Die Sprachschaltfläche oben rechts ist dauerhaft: Die hier gewählte Sprache wird beim Öffnen eines Moduls übernommen, und wenn Sie sie in einem Modul ändern, bleibt sie auch hier im Menü erhalten.",
      },
      {
        title: "4. App-Verwaltung und Deinstallation",
        desc: `Das installierte Symbol kann Behälterkalibrierung, 001tarature, 001-tarature oder Smart Launcher heißen.

• Google Chrome (Computer): Geben Sie chrome://apps in die Adressleiste ein und drücken Sie die Eingabetaste, Rechtsklick auf das Symbol > "Aus Chrome entfernen" / "Deinstallieren". Alternativ: App öffnen, 3-Punkte-Menü oben > "Behälterkalibrierung deinstallieren".
• Microsoft Edge (Computer): edge://apps eingeben, auf die 3 Punkte neben der App klicken > "Deinstallieren". Alternativ: Menü ... > Apps > Apps verwalten.
• Brave: brave://apps eingeben, Rechtsklick auf das Symbol > "Aus Brave entfernen".
• Opera / Vivaldi: opera://apps oder vivaldi://apps eingeben und das Symbol per Rechtsklick entfernen.
• Safari (Mac, macOS Sonoma oder neuer): Finder > Ordner Programme (oder Benutzerprogramme) öffnen, Symbol in den Papierkorb ziehen.
• Mozilla Firefox: Installiert keine Desktop-Apps; Lesezeichen oder Verknüpfung per Rechtsklick > "Löschen" entfernen.
• Windows (jeder Browser): Einstellungen > Apps > Installierte Apps, nach "001tarature" suchen > "Deinstallieren".
• Android (Chrome / Samsung Internet): Symbol auf dem Startbildschirm gedrückt halten > "Deinstallieren" (oder Einstellungen > Apps).
• iPhone / iPad (Safari): Symbol auf dem Startbildschirm gedrückt halten > "App entfernen" > "Vom Home-Bildschirm löschen".

Hinweis: Die Deinstallation entfernt lediglich das App-Symbol vom Gerät; Berichtskopfdaten, gespeicherte Tanks und Ihre aktive Lizenz bleiben erhalten.`,
      },
    ],
