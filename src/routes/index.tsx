import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Boxes, FileSignature } from "lucide-react";
import { moduleDefinitions } from "@/modules/registry";
import ModuleCard from "@/common/ui/ModuleCard";
import LanguageSwitcher from "@/common/ui/LanguageSwitcher";
import PageInfoDialog from "@/common/ui/PageInfoDialog";
import { loadLanguage, saveLanguage, type AppLanguage } from "@/common/language/storage";

const definitions = moduleDefinitions;

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "TARATURA SERBATOI — Menu moduli di calcolo" },
      {
        name: "description",
        content:
          "Menu principale dei moduli di taratura serbatoi: geometria, calcolo volumi, tabella di calibrazione e certificato PDF.",
      },
      { property: "og:title", content: "TARATURA SERBATOI — Menu moduli" },
      {
        property: "og:description",
        content:
          "Suite modulare per la taratura di serbatoi: un sottoprogramma per ogni configurazione di testate.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Home,
});

function Home() {
  // Lingua persistente: valore iniziale neutro per l'SSR, allineato allo
  // storage condiviso subito dopo il mount per evitare mismatch di idratazione.
  const [lang, setLang] = useState<AppLanguage>("it");

  useEffect(() => {
    setLang(loadLanguage());
  }, []);

  const handleLanguageChange = (next: AppLanguage) => {
    setLang(next);
    saveLanguage(next);
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-8">
          <div className="flex items-center gap-4">
            <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <Boxes className="h-7 w-7" />
            </span>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground">
                TARATURA SERBATOI
              </h1>
              <p className="text-sm text-muted-foreground">
                Seleziona un modulo di calcolo. Ogni modulo è autonomo, con il proprio cuore logico.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <LanguageSwitcher value={lang} onChange={handleLanguageChange} />
            <PageInfoDialog lang={lang} />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8">
        <section className="mb-8">
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Dati Comuni
          </h2>
          <Link
            to="/dati-comuni"
            className="flex items-start gap-4 rounded-2xl border border-dashed border-primary/40 bg-primary/5 p-5 transition-colors hover:bg-primary/10"
          >
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <FileSignature className="h-5 w-5" />
            </span>
            <span>
              <span className="block text-base font-semibold text-foreground">
                Intestazione Report
              </span>
              <span className="block text-sm text-muted-foreground">
                Ragione sociale, P.IVA, contatti, logo e note: si compilano una sola volta e valgono
                per tutti i moduli.
              </span>
            </span>
          </Link>
        </section>

        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Moduli di calcolo
        </h2>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {definitions.map((m) => (
            <ModuleCard key={m.id} module={m} />
          ))}
        </div>
        <p className="mt-8 text-xs text-muted-foreground">
          I moduli sono definiti in <code>src/modules/registry.ts</code>: aggiungendo una riga e la
          cartella <code>src/modules/&lt;NOME&gt;/</code> compare automaticamente una nuova card.
        </p>
      </main>
    </div>
  );
}
