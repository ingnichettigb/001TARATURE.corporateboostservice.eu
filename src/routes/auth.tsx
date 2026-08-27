import * as React from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requestOtp, verifyOtp } from "@/lib/otp.functions";
import { VERIFIED_EMAIL_KEY, APP_NAME } from "@/lib/app-config";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: `Accesso — ${APP_NAME}` },
      { name: "description", content: "Verifica email per accedere." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AuthPage,
});

type Stage = "email" | "otp" | "done";

const RATE_LIMIT_MSG = "Hai già ricevuto 3 codici di verifica. Riprova tra 24 ore. (E-011)";
const SEND_FAIL_MSG = "Impossibile inviare il codice. Verifica l'indirizzo email. (E-010)";
const OTP_INVALID_MSG = "Codice non corretto. Riprova o richiedi un nuovo invio. (E-012)";
const OTP_SAVE_FAIL_MSG = "Errore tecnico durante la verifica. Riprova. (E-013)";

function AuthPage() {
  const navigate = useNavigate();
  const reqOtp = useServerFn(requestOtp);
  const vOtp = useServerFn(verifyOtp);

  const [stage, setStage] = React.useState<Stage>("email");
  const [email, setEmail] = React.useState("");
  const [code, setCode] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [info, setInfo] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);

  const goActivation = (verifiedEmail: string) => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(VERIFIED_EMAIL_KEY, verifiedEmail);
    }
    navigate({ to: "/attivazione" });
  };

  const handleRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfo(null);
    const normalized = email.trim().toLowerCase();
    if (!normalized) {
      setError("Inserisci una email valida.");
      return;
    }
    setLoading(true);
    try {
      const res = await reqOtp({ data: { email: normalized } });
      if (!res.ok) {
        if (res.reason === "rate_limited") {
          setError(RATE_LIMIT_MSG);
        } else {
          const detail = "detail" in res && res.detail ? ` — ${res.detail}` : "";
          setError(`${SEND_FAIL_MSG}${detail}`);
        }
        return;
      }
      setStage("otp");
      setInfo(`Abbiamo inviato il codice a ${normalized}`);
    } catch (err) {
      console.error(err);
      const detail = err instanceof Error ? ` — ${err.message}` : "";
      setError(`${SEND_FAIL_MSG}${detail}`);
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const normalized = email.trim().toLowerCase();
    if (!/^\d{6}$/.test(code.trim())) {
      setError("Il codice deve essere di 6 cifre.");
      return;
    }
    setLoading(true);
    try {
      const res = await vOtp({ data: { email: normalized, code: code.trim() } });
      if (res.ok) {
        setStage("done");
        setTimeout(() => goActivation(normalized), 600);
      } else if (res.reason === "verify_save_failed") {
        setError(OTP_SAVE_FAIL_MSG);
      } else {
        setError(OTP_INVALID_MSG);
      }
    } catch (err) {
      console.error(err);
      setError(OTP_SAVE_FAIL_MSG);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setError(null);
    setInfo(null);
    setLoading(true);
    try {
      const normalized = email.trim().toLowerCase();
      const res = await reqOtp({ data: { email: normalized } });
      if (!res.ok) {
        if (res.reason === "rate_limited") {
          setError(RATE_LIMIT_MSG);
        } else {
          const detail = "detail" in res && res.detail ? ` — ${res.detail}` : "";
          setError(`${SEND_FAIL_MSG}${detail}`);
        }
        return;
      }
      setInfo(`Nuovo codice inviato a ${normalized}`);
      setCode("");
    } catch (err) {
      console.error(err);
      const detail = err instanceof Error ? ` — ${err.message}` : "";
      setError(`${SEND_FAIL_MSG}${detail}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto flex min-h-[80vh] max-w-md items-center px-4 py-8">
      <Card className="w-full">
        <CardHeader>
          <CardTitle>{APP_NAME} — Accesso</CardTitle>
          <CardDescription>
            {stage === "email" && "Passaggio 1 di 3 — Verifica email."}
            {stage === "otp" && "Inserisci il codice ricevuto per email."}
            {stage === "done" && "Email verificata con successo."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {stage === "email" && (
            <form onSubmit={handleRequest} className="space-y-4" noValidate>
              <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="mario@example.com"
                />
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Attendere…" : "Invia codice"}
              </Button>
            </form>
          )}

          {stage === "otp" && (
            <form onSubmit={handleVerify} className="space-y-4">
              {info && <p className="text-sm text-muted-foreground">{info}</p>}
              <div className="space-y-1.5">
                <Label htmlFor="code">Codice (6 cifre)</Label>
                <Input
                  id="code"
                  inputMode="numeric"
                  pattern="\d{6}"
                  maxLength={6}
                  required
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  placeholder="123456"
                />
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <div className="flex gap-2">
                <Button type="submit" className="flex-1" disabled={loading}>
                  {loading ? "Verifica…" : "Verifica"}
                </Button>
                <Button type="button" variant="outline" onClick={handleResend} disabled={loading}>
                  Reinvia
                </Button>
              </div>
              <button
                type="button"
                onClick={() => {
                  setStage("email");
                  setCode("");
                  setError(null);
                  setInfo(null);
                }}
                className="text-xs text-muted-foreground underline"
              >
                Cambia email
              </button>
            </form>
          )}

          {stage === "done" && (
            <p className="text-sm text-green-600">
              Email verificata con successo. Reindirizzamento…
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
