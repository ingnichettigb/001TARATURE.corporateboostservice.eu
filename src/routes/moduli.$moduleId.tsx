import { createFileRoute, notFound } from "@tanstack/react-router";
import { Suspense, useEffect, useState } from "react";
import { getModuleEntry, moduleDefinitions } from "@/modules/registry";

/**
 * Router delle carte: non contiene logica specifica di modulo.
 * Risolve l'id nel registro e monta il controller principale del modulo.
 */
export const Route = createFileRoute("/moduli/$moduleId")({
  loader: ({ params }) => {
    const definition = moduleDefinitions.find((m) => m.id === params.moduleId);
    if (!definition) throw notFound();
    return { definition };
  },
  head: ({ loaderData }) => {
    if (!loaderData) {
      return {
        meta: [
          { title: "Modulo non disponibile — Taratura Serbatoi" },
          { name: "robots", content: "noindex" },
        ],
      };
    }
    const { definition } = loaderData;
    const title = `${definition.title} — Taratura Serbatoi`;
    return {
      meta: [
        { title },
        { name: "description", content: definition.description },
        { property: "og:title", content: title },
        { property: "og:description", content: definition.description },
      ],
    };
  },
  component: ModuleRoute,
});

function ModuleRoute() {
  const { definition } = Route.useLoaderData();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const entry = getModuleEntry(definition.id);
  const fallback = (
    <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">
      Caricamento {definition.title}…
    </div>
  );

  if (!mounted || !entry) return fallback;

  const Page = entry.Page;
  return (
    <Suspense fallback={fallback}>
      <Page />
    </Suspense>
  );
}
