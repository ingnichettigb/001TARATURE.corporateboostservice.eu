import React, { useEffect, useState } from "react";
import {
  Building2,
  Check,
  Compass,
  FileText,
  Gauge,
  Image as ImageIcon,
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
  Upload,
  X,
} from "lucide-react";
import type { ReportHeader } from "./types";

interface ReportHeaderFormProps {
  info: ReportHeader;
  onSave: (info: ReportHeader) => void;
  onCancel?: () => void;
  saveLabel?: string;
}

const inputClass =
  "w-full text-xs font-semibold bg-[#e1efe4] border-2 border-emerald-300/80 rounded-lg px-3 py-2 text-emerald-950 focus:ring-2 focus:ring-emerald-900 focus:outline-hidden";
const labelClass =
  "flex items-center gap-1 text-xs font-bold text-emerald-950 mb-1 uppercase tracking-wide";

/**
 * Form riusabile dei dati comuni di intestazione report.
 */
export function ReportHeaderForm({ info, onSave, onCancel, saveLabel = "Salva" }: ReportHeaderFormProps) {
  const [form, setForm] = useState<ReportHeader>(info);
  const [saved, setSaved] = useState(false);

  useEffect(() => setForm(info), [info]);

  const set = <K extends keyof ReportHeader>(key: K, value: ReportHeader[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setSaved(false);
  };

  const logoOptions = [
    { id: "custom" as const, label: "Logo personalizzato", icon: ImageIcon },
    { id: "standard" as const, label: "Standard", icon: Compass },
    { id: "building" as const, label: "Azienda", icon: Building2 },
    { id: "gauge" as const, label: "Strumento", icon: Gauge },
    { id: "shield" as const, label: "Certificazione", icon: ShieldCheck },
    { id: "none" as const, label: "Nessuno", icon: X },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(form);
    setSaved(true);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <span className="block text-xs font-bold text-emerald-950 mb-1.5 uppercase tracking-wide">
          Logo del report
        </span>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {logoOptions.map((opt) => {
            const Icon = opt.icon;
            const isSelected = form.logoType === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => set("logoType", opt.id)}
                className={`flex items-center gap-2 p-2 border rounded-xl text-left transition-all cursor-pointer ${
                  isSelected
                    ? "bg-emerald-900 text-white border-emerald-950 shadow-md"
                    : "bg-white text-emerald-900 border-emerald-200 hover:border-emerald-300 hover:bg-emerald-50/50"
                }`}
              >
                {opt.id === "custom" && form.customLogoData ? (
                  <img
                    src={form.customLogoData}
                    className="w-4 h-4 object-contain rounded-xs"
                    alt="Anteprima logo"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <Icon className={`w-4 h-4 ${isSelected ? "text-emerald-400" : "text-emerald-700"}`} />
                )}
                <span className="text-[11px] font-bold">{opt.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {form.logoType === "custom" && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 space-y-2">
          <span className="block text-[11px] font-bold text-emerald-950 uppercase tracking-wide">
            Carica e importa il tuo logo (.png, .jpg, .svg)
          </span>
          <div className="flex items-center gap-4">
            {form.customLogoData ? (
              <div className="relative w-16 h-16 border border-emerald-300 rounded-lg overflow-hidden bg-white flex items-center justify-center shrink-0">
                <img
                  src={form.customLogoData}
                  className="w-full h-full object-contain p-1"
                  alt="Anteprima logo"
                  referrerPolicy="no-referrer"
                />
                <button
                  type="button"
                  onClick={() => set("customLogoData", "")}
                  className="absolute top-0.5 right-0.5 bg-red-600 text-white p-0.5 rounded-full hover:bg-red-700 transition-colors cursor-pointer"
                  title="Rimuovi"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ) : (
              <div className="w-16 h-16 border-2 border-dashed border-emerald-300 rounded-lg flex items-center justify-center bg-white shrink-0">
                <ImageIcon className="w-5 h-5 text-emerald-600/60" />
              </div>
            )}
            <div className="flex-1">
              <label className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-emerald-600 text-emerald-900 bg-white hover:bg-emerald-50 rounded-lg text-xs font-bold cursor-pointer transition-colors shadow-xs">
                <Upload className="w-3.5 h-3.5" />
                Sfoglia file...
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const reader = new FileReader();
                    reader.onload = (event) => {
                      if (event.target?.result) set("customLogoData", event.target.result as string);
                    };
                    reader.readAsDataURL(file);
                  }}
                />
              </label>
              <p className="text-[10px] text-emerald-700/80 mt-1.5 leading-tight">
                L'immagine viene salvata localmente nel browser e stampata in alta risoluzione sul
                certificato.
              </p>
            </div>
          </div>
        </div>
      )}

      <div>
        <label className={labelClass}>
          <Building2 className="w-3 h-3" /> Ragione sociale
        </label>
        <input
          type="text"
          required
          placeholder="es. TecnoCalibrazioni S.r.l."
          value={form.ditta}
          onChange={(e) => set("ditta", e.target.value)}
          className={inputClass}
        />
      </div>

      <div>
        <label className={labelClass}>
          <FileText className="w-3 h-3" /> Partita IVA
        </label>
        <input
          type="text"
          required
          placeholder="es. IT01234567890"
          value={form.partitaIva}
          onChange={(e) => set("partitaIva", e.target.value)}
          className={`${inputClass} font-mono`}
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className={labelClass}>
            <Phone className="w-3 h-3" /> Telefono
          </label>
          <input
            type="text"
            placeholder="es. +39 02 9876543"
            value={form.telefono}
            onChange={(e) => set("telefono", e.target.value)}
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>
            <Mail className="w-3 h-3" /> Email
          </label>
          <input
            type="email"
            placeholder="es. info@tecnocalibrazioni.it"
            value={form.email}
            onChange={(e) => set("email", e.target.value)}
            className={inputClass}
          />
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className={labelClass}>
            <Mail className="w-3 h-3" /> PEC
          </label>
          <input
            type="email"
            placeholder="es. pec@tecnocalibrazioni.it"
            value={form.emailPec ?? ""}
            onChange={(e) => set("emailPec", e.target.value)}
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>
            <FileText className="w-3 h-3" /> Iscrizione Registro / Albo
          </label>
          <input
            type="text"
            placeholder="es. Ordine Ingegneri n. 123"
            value={form.iscrizioneRegistro ?? ""}
            onChange={(e) => set("iscrizioneRegistro", e.target.value)}
            className={inputClass}
          />
        </div>
      </div>

      <div>
        <label className={labelClass}>
          <MapPin className="w-3 h-3" /> Indirizzo
        </label>
        <input
          type="text"
          placeholder="es. Via dell'Artigianato 15, Milano (MI)"
          value={form.indirizzo}
          onChange={(e) => set("indirizzo", e.target.value)}
          className={inputClass}
        />
      </div>

      <div>
        <label className={labelClass}>
          <FileText className="w-3 h-3" /> Informazioni aggiuntive
        </label>
        <textarea
          placeholder="es. Iscr. Albo Ingegneri Milano n. 12345 • Cap. Soc. €10.000 i.v."
          value={form.customNote}
          onChange={(e) => set("customNote", e.target.value)}
          className={`${inputClass} h-16 resize-none`}
        />
      </div>

      <div className="flex items-center justify-end gap-2 pt-2">
        {saved ? (
          <span className="text-xs font-bold text-emerald-700">Dati comuni salvati</span>
        ) : null}
        {onCancel ? (
          <button
            type="button"
            onClick={onCancel}
            className="bg-white border-2 border-emerald-200 hover:bg-emerald-50 text-emerald-900 font-bold text-xs px-4 py-2 rounded-lg transition-all cursor-pointer"
          >
            Annulla
          </button>
        ) : null}
        <button
          type="submit"
          className="bg-emerald-900 hover:bg-emerald-950 text-white font-bold text-xs px-5 py-2 rounded-lg transition-all cursor-pointer shadow-md flex items-center gap-1"
        >
          <Check className="w-4 h-4" />
          {saveLabel}
        </button>
      </div>
    </form>
  );
}

export default ReportHeaderForm;
