import { Info } from "lucide-react";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { AppLanguage } from "@/common/language/storage";

interface PageInfoDialogProps {
  lang: AppLanguage;
}

const CONTENT: Record<AppLanguage, { title: string; paragraphs: string[] }> = {
  it: {
    title: "Come funziona questa pagina",
    paragraphs: [
      "Questa è la pagina principale della suite di taratura serbatoi. Da qui scegli il modulo di calcolo adatto alla configurazione del tuo serbatoio (es. coperchio bombato / fondo conico).",
      "Prima di aprire un modulo, compila la sezione Dati Comuni: ragione sociale, P.IVA, contatti, logo e note. Queste informazioni valgono per tutti i moduli e vengono riportate nei certificati generati.",
      "Ogni modulo attivo ti guida attraverso: geometria del serbatoio, calcolo automatico dei volumi, tabella di calibrazione e certificato PDF scaricabile.",
      "I moduli contrassegnati \"In preparazione\" non sono ancora disponibili.",
    ],
  },
  en: {
    title: "How this page works",
    paragraphs: [
      "This is the main page of the tank calibration suite. From here you choose the calculation module that matches your tank's configuration (e.g. domed lid / conical bottom).",
      "Before opening a module, fill in the Common Data section: company name, VAT number, contacts, logo and notes. This information applies to all modules and is shown on the generated certificates.",
      "Each active module guides you through: tank geometry, automatic volume calculation, calibration table and downloadable PDF certificate.",
      "Modules marked \"In preparation\" are not yet available.",
    ],
  },
  es: {
    title: "Cómo funciona esta página",
    paragraphs: [
      "Esta es la página principal de la suite de calibración de tanques. Aquí eliges el módulo de cálculo adecuado para la configuración de tu tanque (p. ej. tapa abombada / fondo cónico).",
      "Antes de abrir un módulo, completa la sección Datos Comunes: razón social, NIF/IVA, contactos, logo y notas. Esta información se aplica a todos los módulos y aparece en los certificados generados.",
      "Cada módulo activo te guía a través de: geometría del tanque, cálculo automático de volúmenes, tabla de calibración y certificado PDF descargable.",
      "Los módulos marcados como \"En preparación\" aún no están disponibles.",
    ],
  },
  de: {
    title: "So funktioniert diese Seite",
    paragraphs: [
      "Dies ist die Hauptseite der Tankkalibrierungs-Suite. Hier wählst du das Berechnungsmodul passend zur Konfiguration deines Tanks (z. B. gewölbter Deckel / kegelförmiger Boden).",
      "Bevor du ein Modul öffnest, fülle den Bereich Gemeinsame Daten aus: Firmenname, USt-IdNr., Kontakte, Logo und Notizen. Diese Angaben gelten für alle Module und erscheinen auf den erzeugten Zertifikaten.",
      "Jedes aktive Modul führt dich durch: Tankgeometrie, automatische Volumenberechnung, Kalibriertabelle und herunterladbares PDF-Zertifikat.",
      "Mit \"In Vorbereitung\" markierte Module sind noch nicht verfügbar.",
    ],
  },
};

export default function PageInfoDialog({ lang }: PageInfoDialogProps) {
  const t = CONTENT[lang] ?? CONTENT.it;

  return (
    <Dialog>
      <DialogTrigger asChild>
        <button
          type="button"
          title={t.title}
          className="flex items-center gap-1.5 rounded-xl border border-border bg-card px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
        >
          <Info className="h-4 w-4" />
        </button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t.title}</DialogTitle>
        </DialogHeader>

        <div className="space-y-3 text-sm text-muted-foreground">
          {t.paragraphs.map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
