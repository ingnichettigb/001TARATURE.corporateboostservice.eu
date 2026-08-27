import * as React from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";

import { TermsConsent } from "@/components/terms-consent";
import {
  APP_NAME,
  VERIFIED_EMAIL_KEY,
  ACTIVATED_KEY,
  LICENSE_ID_KEY,
  CONSENT_KEY,
} from "@/lib/app-config";
import { checkTermsConsent } from "@/lib/consent.functions";
import { loadLanguage } from "@/common/language/storage";

export const Route = createFileRoute("/condizioni")({
  head: () => ({
    meta: [
      { title: `Condizioni d'Uso — ${APP_NAME}` },
      { name: "description", content: "Accettazione delle condizioni d'uso." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: CondizioniPage,
});

function CondizioniPage() {
  const navigate = useNavigate();
  const consentFn = useServerFn(checkTermsConsent);

  const [email, setEmail] = React.useState<string | null>(null);
  const [licenseId, setLicenseId] = React.useState<string | null>(null);
  const [ready, setReady] = React.useState(false);

  React.useEffect(() => {
    if (typeof window === "undefined") return;
    let cancelled = false;
    const verified = window.localStorage.getItem(VERIFIED_EMAIL_KEY);
    const lid = window.localStorage.getItem(LICENSE_ID_KEY);
    if (!verified) {
      navigate({ to: "/auth", replace: true });
      return;
    }
    if (!lid) {
      window.localStorage.removeItem(ACTIVATED_KEY);
      navigate({ to: "/attivazione", replace: true });
      return;
    }

    void (async () => {
      try {
        const res = await consentFn({ data: { licenseId: lid } });
        if (cancelled) return;
        if (res.accepted) {
          // Consenso già registrato sul DB (es. altro browser): salta la pagina
          window.localStorage.setItem(CONSENT_KEY, "1");
          window.localStorage.setItem(ACTIVATED_KEY, "1");
          navigate({ to: "/", replace: true });
          return;
        }
      } catch (err) {
        console.error("checkTermsConsent call error:", err);
      }
      if (cancelled) return;
      setEmail(verified);
      setLicenseId(lid);
      setReady(true);
    })();

    return () => {
      cancelled = true;
    };
  }, [navigate, consentFn]);

  const handleAccepted = () => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(CONSENT_KEY, "1");
      window.localStorage.setItem(ACTIVATED_KEY, "1");
    }
    navigate({ to: "/", replace: true });
  };

  if (!ready || !email || !licenseId) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-sm text-muted-foreground">
        …
      </div>
    );
  }

  return (
    <TermsConsent
      licenseId={licenseId}
      email={email}
      initialLang={loadLanguage()}
      onAccepted={handleAccepted}
    />
  );
}
