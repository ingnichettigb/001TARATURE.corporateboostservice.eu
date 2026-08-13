import { Link } from "@tanstack/react-router";
import * as Icons from "lucide-react";
import type { ModuleDefinition } from "@/common/module-types";

type IconComponent = (props: { className?: string }) => React.ReactNode;

function resolveIcon(name: string): IconComponent {
  const registry = Icons as unknown as Record<string, IconComponent>;
  return registry[name] ?? (Icons.Box as unknown as IconComponent);
}

function ModuleIcon({ module }: { module: ModuleDefinition }) {
  if (module.image) {
    return (
      <span className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-lg">
        <img
          src={module.image}
          alt={`Icona ${module.title}`}
          className="h-full w-full object-contain"
        />
      </span>
    );
  }

  const Icon = resolveIcon(module.icon ?? "Box");
  return (
    <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-primary">
      <Icon className="h-6 w-6" />
    </span>
  );
}

export function ModuleCard({ module }: { module: ModuleDefinition }) {
  const isActive = module.status === "active";

  return (
    <Link
      to="/moduli/$moduleId"
      params={{ moduleId: module.id }}
      className="group flex flex-col gap-3 rounded-xl border border-border bg-card p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-3">
        <ModuleIcon module={module} />
        <span
          className={`rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide ${
            isActive
              ? "bg-primary/10 text-primary"
              : "bg-muted text-muted-foreground"
          }`}
        >
          {isActive ? "Attivo" : "In preparazione"}
        </span>
      </div>
      <div>
        <h2 className="text-lg font-semibold tracking-tight text-card-foreground">
          {module.title}
        </h2>
        <p className="text-sm font-medium text-muted-foreground">{module.subtitle}</p>
      </div>
      <p className="text-sm text-muted-foreground">{module.description}</p>
      <span className="mt-auto inline-flex items-center gap-1 text-sm font-semibold text-primary">
        Apri modulo
        <Icons.ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
      </span>
    </Link>
  );
}

export default ModuleCard;
