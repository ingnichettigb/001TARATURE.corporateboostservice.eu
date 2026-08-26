import { Globe } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LANGUAGE_OPTIONS, type AppLanguage } from "@/common/language/storage";

interface LanguageSwitcherProps {
  value: AppLanguage;
  onChange: (lang: AppLanguage) => void;
  className?: string;
}

/**
 * Selettore lingua persistente. Il valore viene letto/scritto tramite
 * src/common/language/storage.ts, quindi la scelta fatta qui (es. nel menu
 * principale) resta valida quando si apre un modulo, e viceversa.
 */
export default function LanguageSwitcher({ value, onChange, className }: LanguageSwitcherProps) {
  const current = LANGUAGE_OPTIONS.find((o) => o.code === value) ?? LANGUAGE_OPTIONS[0];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          title="Seleziona Lingua / Select Language"
          className={
            className ??
            "flex items-center gap-1.5 rounded-xl border border-border bg-card px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          }
        >
          <Globe className="h-4 w-4" />
          <span>{current.flag}</span>
          <span className="uppercase">{current.code}</span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {LANGUAGE_OPTIONS.map((opt) => (
          <DropdownMenuItem key={opt.code} onClick={() => onChange(opt.code)}>
            <span className="mr-1">{opt.flag}</span>
            <span>{opt.label}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
