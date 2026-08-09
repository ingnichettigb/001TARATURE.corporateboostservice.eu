import type { FieldDef, ModuleValues } from "@/lib/module-types";

interface FieldGridProps {
  fields: FieldDef[];
  values: ModuleValues;
  onChange: (key: string, value: number | string) => void;
}

/** Griglia di campi di input generata dallo schema del cuore logico. */
export function FieldGrid({ fields, values, onChange }: FieldGridProps) {
  if (fields.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-border px-4 py-6 text-center text-sm text-muted-foreground">
        Nessun campo definito. Aggiungi i campi in <code>core/logic.ts</code> →{" "}
        <code>getInputSchema()</code>.
      </p>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {fields.map((field) =>
        field.type === "select" ? (
          <SelectField
            key={field.key}
            field={field}
            value={String(values[field.key] ?? "")}
            onChange={(v) => onChange(field.key, v)}
          />
        ) : (
          <TextOrNumberField
            key={field.key}
            field={field}
            value={values[field.key] ?? ""}
            onChange={(v) => onChange(field.key, v)}
          />
        ),
      )}
    </div>
  );
}

const labelClass = "block text-sm font-medium text-foreground";
const inputClass =
  "mt-1.5 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground outline-none transition-colors focus:border-ring focus:ring-2 focus:ring-ring/30";

export function TextOrNumberField({
  field,
  value,
  onChange,
}: {
  field: FieldDef;
  value: number | string;
  onChange: (value: number | string) => void;
}) {
  const isNumber = field.type !== "text";
  return (
    <label className="block">
      <span className={labelClass}>
        {field.label}
        {field.unit ? (
          <span className="ml-1 text-xs font-normal text-muted-foreground">({field.unit})</span>
        ) : null}
      </span>
      <input
        className={inputClass}
        type={isNumber ? "number" : "text"}
        value={value === undefined ? "" : String(value)}
        onChange={(e) =>
          onChange(isNumber ? (e.target.value === "" ? "" : Number(e.target.value)) : e.target.value)
        }
      />
      {field.help ? <span className="mt-1 block text-xs text-muted-foreground">{field.help}</span> : null}
    </label>
  );
}

export function SelectField({
  field,
  value,
  onChange,
}: {
  field: FieldDef;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className={labelClass}>{field.label}</span>
      <select className={inputClass} value={value} onChange={(e) => onChange(e.target.value)}>
        {(field.options ?? []).map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {field.help ? <span className="mt-1 block text-xs text-muted-foreground">{field.help}</span> : null}
    </label>
  );
}

export default FieldGrid;
