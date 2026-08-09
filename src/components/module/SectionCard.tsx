import type { ReactNode } from "react";

interface SectionCardProps {
  step?: number | string;
  title: string;
  description?: string;
  icon?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
}

/** Contenitore standard di una sezione (Input / Calcolo / Output / PDF). */
export function SectionCard({
  step,
  title,
  description,
  icon,
  actions,
  children,
}: SectionCardProps) {
  return (
    <section className="rounded-xl border border-border bg-card shadow-sm">
      <div className="flex flex-wrap items-center gap-3 border-b border-border px-4 py-3">
        {step !== undefined ? (
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
            {step}
          </span>
        ) : null}
        {icon ? <span className="text-muted-foreground">{icon}</span> : null}
        <div className="min-w-0 flex-1">
          <h2 className="text-base font-semibold text-card-foreground">{title}</h2>
          {description ? (
            <p className="text-sm text-muted-foreground">{description}</p>
          ) : null}
        </div>
        {actions}
      </div>
      <div className="px-4 py-4">{children}</div>
    </section>
  );
}

export default SectionCard;
