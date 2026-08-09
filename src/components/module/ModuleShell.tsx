import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";

interface ModuleShellProps {
  title: string;
  subtitle?: string;
  badge?: string;
  children: ReactNode;
  actions?: ReactNode;
}

/**
 * Guscio comune a TUTTI i moduli (livello 2).
 * Garantisce header, spaziature e larghezza identici in ogni sottoprogramma.
 */
export function ModuleShell({ title, subtitle, badge, children, actions }: ModuleShellProps) {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 border-b border-border bg-card/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-3 px-4 py-3">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Menu
          </Link>
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-lg font-semibold tracking-tight text-foreground">
              {title}
            </h1>
            {subtitle ? (
              <p className="truncate text-sm text-muted-foreground">{subtitle}</p>
            ) : null}
          </div>
          {badge ? (
            <span className="rounded-full bg-secondary px-2.5 py-1 text-xs font-semibold uppercase tracking-wide text-secondary-foreground">
              {badge}
            </span>
          ) : null}
          {actions}
        </div>
      </header>
      <main className="mx-auto max-w-6xl space-y-6 px-4 py-6">{children}</main>
    </div>
  );
}

export default ModuleShell;
