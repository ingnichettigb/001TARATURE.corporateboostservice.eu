import * as React from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useServerFn } from "@tanstack/react-start";
import { recordTermsConsent } from "@/lib/consent.functions";
import { TERMS } from "@/lib/terms-i18n";
import { APP_NAME } from "@/lib/app-config";
import type { AppLanguage } from "@/common/language/storage";

type Props = {
  licenseId: string;
  email: string;
  initialLang?: AppLanguage;
  onAccepted: () => void;
};

const LANGS: { code: AppLanguage; flag: string }[] = [
  { code: "it", flag: "🇮🇹" },
  { code: "en", flag: "🇬🇧" },
  { code: "de", flag: "🇩🇪" },
  { code: "es", flag: "🇪🇸" },
];

function interpolate(s: string) {
  return s.replaceAll("{{APP_NAME}}", APP_NAME);
}

export function TermsConsent({ licenseId, email, initialLang = "it", onAccepted }: Props) {
  const record = useServerFn(recordTermsConsent);
  const [lang, setLang] = React.useState<AppLanguage>(initialLang);
  const [checked, setChecked] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const t = TERMS[lang];

  const handleAccept = async () => {
    setError(null);
    setLoading(true);
    try {
      const res = await record({ data: { licenseId, language: lang } });
      if (res.ok) {
        onAccepted();
        return;
      }
      setError(`${t.errorGeneric} (${res.code})`);
    } catch (err) {
      console.error(err);
      setError(t.errorGeneric);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto flex min-h-[80vh] max-w-2xl items-center px-4 py-8">
      <Card className="w-full border-emerald-800 bg-emerald-950 text-emerald-50">
        <CardHeader>
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0">
              <CardTitle className="text-lime-300">
                {t.pageTitle} — {APP_NAME}
              </CardTitle>
              <CardDescription className="text-emerald-200">
                {t.stepLabel} · {email}
              </CardDescription>
            </div>
            <div className="flex items-center gap-1">
              {LANGS.map((o) => {
                const active = lang === o.code;
                return (
                  <button
                    key={o.code}
                    type="button"
                    onClick={() => setLang(o.code)}
                    aria-label={TERMS[o.code].langLabel}
                    title={TERMS[o.code].langLabel}
                    className={`h-8 w-9 rounded-md border text-base leading-none transition-all hover:scale-110 ${
                      active
                        ? "border-lime-300 bg-lime-300/10 opacity-100"
                        : "border-emerald-800 opacity-70"
                    }`}
                  >
                    {o.flag}
                  </button>
                );
              })}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-emerald-200">{t.intro}</p>

          <div className="max-h-[50vh] overflow-y-auto rounded-md border border-emerald-800 bg-emerald-900/30 p-4 text-sm leading-relaxed text-emerald-100">
            <h2 className="text-base font-bold text-lime-300">{t.content.heading}</h2>
            <p className="mt-1 text-emerald-200">{interpolate(t.content.subheading)}</p>
            <div className="mt-4 space-y-3">
              {t.content.sections.map((s) => (
                <section key={s.title}>
                  <h3 className="font-semibold text-emerald-50">{s.title}</h3>
                  <p className="mt-1 whitespace-pre-line text-emerald-200">{interpolate(s.body)}</p>
                </section>
              ))}
            </div>
            <p className="mt-4 text-xs italic text-emerald-300">{t.content.footer}</p>
          </div>

          <div className="flex items-start gap-2">
            <Checkbox
              id="terms-accept"
              checked={checked}
              onCheckedChange={(v) => setChecked(v === true)}
              className="mt-0.5 border-lime-300"
            />
            <Label htmlFor="terms-accept" className="cursor-pointer text-sm text-emerald-100">
              {t.checkboxLabel}
            </Label>
          </div>

          {error && <p className="text-sm text-red-400">{error}</p>}

          <Button
            type="button"
            onClick={handleAccept}
            disabled={!checked || loading}
            className="w-full bg-lime-300 font-semibold text-emerald-950 hover:bg-lime-200"
          >
            {loading ? t.acceptingButton : t.acceptButton}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
