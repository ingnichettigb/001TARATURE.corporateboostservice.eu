import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  APP_NAME,
  VERIFIED_EMAIL_KEY,
  LICENSE_INVALID_REASON_KEY,
  clearLicenseKeys,
} from "@/lib/app-config";
import { LANGUAGE_KEY, saveLanguage, type AppLanguage } from "@/common/language/storage";
import * as React from "react";

export const Route = createFileRoute("/licenza-scaduta")({
  head: () => ({
    meta: [
      { title: `Licenza non valida — ${APP_NAME}` },
      { name: "description", content: `Licenza ${APP_NAME} non valida: rinnova o attiva una nuova licenza.` },
      { property: "og:title", content: `Licenza non valida — ${APP_NAME}` },
      { property: "og:description", content: "Rinnova o attiva una nuova licenza." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: LicenzaScadutaPage,
});

type PageLang = "it" | "en" | "de" | "es" | "fr";

const RENEW_URL = "https://corporateboostservice.eu/taratura-serbatoi";

const LANGS: { code: PageLang; flag: string }[] = [
  { code: "it", flag: "🇮🇹" },
  { code: "en", flag: "🇬🇧" },
  { code: "de", flag: "🇩🇪" },
  { code: "es", flag: "🇪🇸" },
  { code: "fr", flag: "🇫🇷" },
];

const T: Record<PageLang, {
  title: string;
  reasons: Record<string, string>;
  fallback: string;
  body: (app: string) => string;
  renew: string;
  goActivation: string;
  activateOther: string;
}> = {
  it: {
    title: "Licenza non valida",
    reasons: {
      expired: "La licenza risulta scaduta.",
      deactivated: "La licenza è stata disattivata (probabilmente perché ha esaurito le generazioni PDF disponibili).",
      not_found: "La licenza non risulta più valida.",
    },
    fallback: "La licenza non è più attiva.",
    body: (a) => `Per continuare a usare ${a}, attiva una nuova licenza oppure contatta il supporto se ritieni si tratti di un errore.`,
    renew: "Rinnova la tua licenza",
    goActivation: "Ho già una nuova licenza / Vai all'attivazione",
    activateOther: "Attiva un'altra licenza",
  },
  en: {
    title: "Invalid license",
    reasons: {
      expired: "The license has expired.",
      deactivated: "The license has been deactivated (probably because all available PDF generations were used).",
      not_found: "The license is no longer valid.",
    },
    fallback: "The license is no longer active.",
    body: (a) => `To keep using ${a}, activate a new license or contact support if you think this is an error.`,
    renew: "Renew your license",
    goActivation: "I already have a new license / Go to activation",
    activateOther: "Activate another license",
  },
  de: {
    title: "Ungültige Lizenz",
    reasons: {
      expired: "Die Lizenz ist abgelaufen.",
      deactivated: "Die Lizenz wurde deaktiviert (vermutlich, weil alle verfügbaren PDF-Erstellungen aufgebraucht sind).",
      not_found: "Die Lizenz ist nicht mehr gültig.",
    },
    fallback: "Die Lizenz ist nicht mehr aktiv.",
    body: (a) => `Um ${a} weiter zu nutzen, aktivieren Sie eine neue Lizenz oder kontaktieren Sie den Support, falls Sie einen Fehler vermuten.`,
    renew: "Lizenz jetzt erneuern",
    goActivation: "Ich habe bereits eine neue Lizenz / Zur Aktivierung",
    activateOther: "Andere Lizenz aktivieren",
  },
  es: {
    title: "Licencia no válida",
    reasons: {
      expired: "La licencia ha caducado.",
      deactivated: "La licencia ha sido desactivada (probablemente porque se agotaron las generaciones de PDF disponibles).",
      not_found: "La licencia ya no es válida.",
    },
    fallback: "La licencia ya no está activa.",
    body: (a) => `Para seguir usando ${a}, activa una nueva licencia o contacta con soporte si crees que se trata de un error.`,
    renew: "Renueva tu licencia",
    goActivation: "Ya tengo una nueva licencia / Ir a la activación",
    activateOther: "Activar otra licencia",
  },
  fr: {
    title: "Licence non valide",
    reasons: {
      expired: "La licence a expiré.",
      deactivated: "La licence a été désactivée (probablement parce que toutes les générations PDF disponibles ont été utilisées).",
      not_found: "La licence n'est plus valide.",
    },
    fallback: "La licence n'est plus active.",
    body: (a) => `Pour continuer à utiliser ${a}, activez une nouvelle licence ou contactez le support si vous pensez qu'il s'agit d'une erreur.`,
    renew: "Renouveler votre licence",
    goActivation: "J'ai déjà une nouvelle licence / Aller à l'activation",
    activateOther: "Activer une autre licence",
  },
};

function isPageLang(v: string | null): v is PageLang {
  return v === "it" || v === "en" || v === "de" || v === "es" || v === "fr";
}

function LicenzaScadutaPage() {
  const navigate = useNavigate();
  const [reason, setReason] = React.useState<string | null>(null);
  const [lang, setLang] = React.useState<PageLang>("it");

  React.useEffect(() => {
    if (typeof window === "undefined") return;
    setReason(window.localStorage.getItem(LICENSE_INVALID_REASON_KEY));
    const raw = window.localStorage.getItem(LANGUAGE_KEY);
    if (isPageLang(raw)) setLang(raw);
  }, []);

  const changeLang = (code: PageLang) => {
    setLang(code);
    if (code === "fr") window.localStorage.setItem(LANGUAGE_KEY, code);
    else saveLanguage(code as AppLanguage);
  };

  const t = T[lang];
  const isExpired = reason === "expired";

  const goActivation = () => {
    clearLicenseKeys();
    const verified =
      typeof window !== "undefined" ? window.localStorage.getItem(VERIFIED_EMAIL_KEY) : null;
    navigate({ to: verified ? "/attivazione" : "/auth", replace: true });
  };

  return (
    <div className="mx-auto flex min-h-[80vh] max-w-md items-center px-4 py-8">
      <Card className="w-full">
        <CardHeader>
          <div className="mb-2 flex justify-end gap-1">
            {LANGS.map((l) => (
              <button
                key={l.code}
                type="button"
                onClick={() => changeLang(l.code)}
                aria-label={l.code.toUpperCase()}
                className={`rounded px-1.5 py-0.5 text-lg transition-opacity ${
                  lang === l.code ? "opacity-100 ring-1 ring-primary" : "opacity-50 hover:opacity-100"
                }`}
              >
                {l.flag}
              </button>
            ))}
          </div>
          <CardTitle>{t.title}</CardTitle>
          <CardDescription>
            {reason && t.reasons[reason] ? t.reasons[reason] : t.fallback}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="mb-4 text-sm text-muted-foreground">{t.body(APP_NAME)}</p>
          {isExpired ? (
            <div className="flex flex-col gap-3">
              <Button asChild size="lg" className="w-full">
                <a href={RENEW_URL} target="_blank" rel="noopener noreferrer">
                  {t.renew}
                  <ExternalLink className="ml-2 h-4 w-4" />
                </a>
              </Button>
              <Button variant="outline" className="h-auto w-full whitespace-normal py-2" onClick={goActivation}>
                {t.goActivation}
              </Button>
            </div>
          ) : (
            <Button className="w-full" onClick={goActivation}>
              {t.activateOther}
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
