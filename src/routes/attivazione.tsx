import * as React from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { verifyAndActivateLicense } from "@/lib/license.functions";
import { APP_CODE, APP_NAME, ACTIVATED_KEY, LICENSE_ID_KEY } from "@/lib/app-config";

export const Route = createFileRoute("/attivazione")({
  head: () => ({
    meta: [
      { title: `Attivazione — ${APP_NAME}` },
      { name: "description", content: "Attiva la tua licenza." },
    ],
  }),
  component: AttivazionePage,
});

type ReasonInfo = { message: string; code: string };

const REASON_MESSAGES: Record<string, ReasonInfo> = {
  license_not_found: {
    message:
      "Il codice licenza inserito non è valido. Controlla di averlo copiato correttamente dall'email di acquisto (senza spazi iniziali o finali).",
    code: "E-101",
  },
  license_expired: {
    message:
      "Questa licenza risulta scaduta. Contatta il supporto per verificare il rinnovo o l'acquisto di una nuova licenza.",
    code: "E-103",
  },
  puk_not_found: {
    message:
      "Il codice PUK inserito non è valido. Verifica di averlo copiato correttamente dall'email di acquisto.",
    code: "E-201",
  },
  puk_wrong_product: {
    message:
      "Questo codice PUK non è valido per questa applicazione. Verifica di aver inserito il codice corretto per il prodotto che stai attivando.",
    code: "E-203",
  },
  puk_not_in_license: {
    message:
      "Questo codice PUK non risulta associato alla licenza inserita. Verifica che entrambi i codici provengano dalla stessa email di acquisto.",
    code: "E-204",
  },
  puk_claimed_by_other: {
    message:
      "Questo codice PUK è già stato attivato da un altro utente. Ogni codice PUK è personale e può essere usato una sola volta. Se la licenza prevede più utenti, contatta chi ha effettuato l'acquisto per ricevere un codice PUK non ancora utilizzato.",
    code: "E-202",
  },
  server_error: {
    message:
      "Si è verificato un errore tecnico imprevisto. Riprova tra qualche minuto o contattaci indicando il codice errore (E-500).",
    code: "E-500",
  },
};

function AttivazionePage() {
  const navigate = useNavigate();
  const activate = useServerFn(verifyAndActivateLicense);

  const [email, setEmail] = React.useState("");
  const [licenseKey, setLicenseKey] = React.useState("");
  const [puk, setPuk] = React.useState("");
  const [error, setError] = React.useState<ReasonInfo | null>(null);
  const [loading, setLoading] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!email.trim() || !licenseKey.trim() || !puk.trim()) {
      setError({ message: "Compila tutti i campi.", code: "" });
      return;
    }
    setLoading(true);
    try {
      const res = await activate({
        data: { email: email.trim(), licenseKey: licenseKey.trim(), puk: puk.trim() },
      });
      if (res.ok) {
        if (typeof window !== "undefined") {
          window.localStorage.setItem(LICENSE_ID_KEY, res.licenseId);
          window.localStorage.setItem(ACTIVATED_KEY, "1");
        }
        navigate({ to: "/", replace: true });
        return;
      }
      setError(REASON_MESSAGES[res.reason] ?? REASON_MESSAGES.server_error);
    } catch (err) {
      console.error(err);
      setError(REASON_MESSAGES.server_error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto flex min-h-[80vh] max-w-md items-center px-4 py-8">
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Attivazione licenza — {APP_NAME}</CardTitle>
          <CardDescription>
            Inserisci l'email di acquisto, il codice licenza e il codice PUK ricevuti via email al
            momento dell'acquisto.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nome@azienda.it"
                autoComplete="email"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="license">Codice licenza</Label>
              <Input
                id="license"
                value={licenseKey}
                onChange={(e) => setLicenseKey(e.target.value)}
                placeholder="XXXX-XXXX-XXXX"
                autoComplete="off"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="puk">Codice PUK</Label>
              <Input
                id="puk"
                value={puk}
                onChange={(e) => setPuk(e.target.value)}
                placeholder="Codice PUK"
                autoComplete="off"
              />
            </div>
            {error && (
              <div className="space-y-1">
                <p className="text-sm text-destructive">{error.message}</p>
                {error.code && (
                  <p className="text-xs text-muted-foreground">Codice errore: {error.code}</p>
                )}
              </div>
            )}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Attivazione…" : "Attiva"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
