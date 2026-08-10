import { createFileRoute, Link } from "@tanstack/react-router";
import { Boxes, FileSignature } from "lucide-react";
import modules from "@/config/modules.json";
import type { ModuleDefinition } from "@/lib/module-types";
import ModuleCard from "@/components/module/ModuleCard";

const definitions = modules as ModuleDefinition[];

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
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-8">
          <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Boxes className="h-7 w-7" />
          </span>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">TARATURA SERBATOI</h1>
            <p className="text-sm text-muted-foreground">
              Seleziona un modulo di calcolo. Ogni modulo è autonomo, con il proprio cuore logico.
            </p>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {definitions.map((m) => (
            <ModuleCard key={m.id} module={m} />
          ))}
        </div>
        <p className="mt-8 text-xs text-muted-foreground">
          I moduli sono definiti in <code>src/config/modules.json</code>: aggiungendo una voce e la
          cartella <code>src/modules/&lt;id&gt;/</code> compare automaticamente una nuova card.
        </p>
      </main>
    </div>
  );
}
