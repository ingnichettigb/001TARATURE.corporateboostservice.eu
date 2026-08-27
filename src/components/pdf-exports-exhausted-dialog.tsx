import { useState, useCallback } from "react";
import { Lock } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export function usePdfExportsExhaustedDialog() {
  const [open, setOpen] = useState(false);

  const showExhausted = useCallback(() => {
    setOpen(true);
  }, []);

  // Dialog bloccante: nessuna chiusura cliccando fuori o con Escape, solo
  // il pulsante "Ho capito" chiude. L'utente deve prendere atto che non può
  // generare altri PDF con questa licenza.
  const dialog = (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent
        className="sm:max-w-md [&>button.absolute]:hidden"
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100">
              <Lock className="h-6 w-6 text-red-600" />
            </div>
            <DialogTitle className="text-xl">Generazioni esaurite</DialogTitle>
          </div>
          <DialogDescription className="pt-3 text-base">
            Hai esaurito le generazioni PDF disponibili per questa licenza. Per continuare, rinnova
            la licenza oppure acquista una nuova licenza a uso singolo.
          </DialogDescription>
        </DialogHeader>

        <DialogFooter>
          <Button className="w-full" size="lg" onClick={() => setOpen(false)}>
            Ho capito
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  return { showExhausted, dialog };
}
