import { createFileRoute, notFound } from "@tanstack/react-router";
import { Suspense, lazy, useEffect, useState } from "react";
import modules from "@/config/modules.json";
import type { ModuleDefinition } from "@/lib/module-types";

const definitions = modules as ModuleDefinition[];

const pages: Record<string, ReturnType<typeof lazy>> = {
  "bomb-con": lazy(() => import("@/modules/bomb-con/ModulePage")),
  "bomb-bomb": lazy(() => import("@/modules/bomb-bomb/ModulePage")),
  "coc-con": lazy(() => import("@/modules/coc-con/ModulePage")),
  "con-biom": lazy(() => import("@/modules/con-biom/ModulePage")),
  "piano-bomb": lazy(() => import("@/modules/piano-bomb/ModulePage")),
  "piano-con": lazy(() => import("@/modules/piano-con/ModulePage")),
};

export const Route = createFileRoute("/moduli/$moduleId")({
  loader: ({ params }) => {
    const definition = definitions.find((m) => m.id === params.moduleId);
    if (!definition) throw notFound();
    return { definition };
  },
  head: ({ loaderData }) => {
    if (!loaderData) {
      return {
        meta: [{ title: "Modulo non disponibile — Taratura Serbatoi" }, { name: "robots", content: "noindex" }],
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

  const Page = pages[definition.id];
  const fallback = (
    <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">
      Caricamento {definition.title}…
    </div>
  );

  if (!mounted || !Page) return fallback;

  return (
    <Suspense fallback={fallback}>
      <Page />
    </Suspense>
  );
}
