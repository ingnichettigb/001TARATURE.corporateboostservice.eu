import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { APP_NAME, LICENSE_INVALID_REASON_KEY, clearGateKeys } from "@/lib/app-config";
import * as React from "react";

export const Route = createFileRoute("/licenza-scaduta")({
  head: () => ({
    meta: [{ title: `Licenza non valida — ${APP_NAME}` }],
  }),
  component: LicenzaScadutaPage,
});

const REASON_TEXT: Record<string, string> = {
  expired: "La licenza risulta scaduta.",
  deactivated:
    "La licenza è stata disattivata (probabilmente perché ha esaurito le generazioni PDF disponibili).",
  not_found: "La licenza non risulta più valida.",
};

function LicenzaScadutaPage() {
  const navigate = useNavigate();
  const [reason, setReason] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (typeof window === "undefined") return;
    setReason(window.localStorage.getItem(LICENSE_INVALID_REASON_KEY));
  }, []);

  return (
    <div className="mx-auto flex min-h-[80vh] max-w-md items-center px-4 py-8">
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Licenza non valida</CardTitle>
          <CardDescription>
            {reason && REASON_TEXT[reason] ? REASON_TEXT[reason] : "La licenza non è più attiva."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="mb-4 text-sm text-muted-foreground">
            Per continuare a usare {APP_NAME}, attiva una nuova licenza oppure contatta il
            supporto se ritieni si tratti di un errore.
          </p>
          <Button
            className="w-full"
            onClick={() => {
              clearGateKeys();
              navigate({ to: "/attivazione", replace: true });
            }}
          >
            Attiva un'altra licenza
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
