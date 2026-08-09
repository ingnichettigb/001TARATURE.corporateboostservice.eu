/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { CompilerInfo } from '../types';
import { Language, translations } from '../utils/translations';
import { 
  X, 
  Building2, 
  Phone, 
  Mail, 
  MapPin, 
  FileText, 
  Wrench, 
  ShieldCheck, 
  Gauge, 
  Compass, 
  Check,
  Building,
  Image,
  Upload
} from 'lucide-react';

interface CompilerConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  info: CompilerInfo;
  onSave: (info: CompilerInfo) => void;
  lang?: Language;
}

export default function CompilerConfigModal({ isOpen, onClose, info, onSave, lang = 'it' }: CompilerConfigModalProps) {
  const t = translations[lang];

  const [ditta, setDitta] = useState(info.ditta);
  const [partitaIva, setPartitaIva] = useState(info.partitaIva);
  const [telefono, setTelefono] = useState(info.telefono);
  const [email, setEmail] = useState(info.email);
  const [emailPec, setEmailPec] = useState(info.emailPec || '');
  const [iscrizioneRegistro, setIscrizioneRegistro] = useState(info.iscrizioneRegistro || '');
  const [indirizzo, setIndirizzo] = useState(info.indirizzo);
  const [logoType, setLogoType] = useState<CompilerInfo['logoType']>(info.logoType);
  const [customLogoData, setCustomLogoData] = useState(info.customLogoData || '');
  const [customNote, setCustomNote] = useState(info.customNote);

  useEffect(() => {
    setDitta(info.ditta);
    setPartitaIva(info.partitaIva);
    setTelefono(info.telefono);
    setEmail(info.email);
    setEmailPec(info.emailPec || '');
    setIscrizioneRegistro(info.iscrizioneRegistro || '');
    setIndirizzo(info.indirizzo);
    setLogoType(info.logoType);
    setCustomLogoData(info.customLogoData || '');
    setCustomNote(info.customNote);
  }, [info, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ditta,
      partitaIva,
      telefono,
      email,
      emailPec,
      iscrizioneRegistro,
      indirizzo,
      logoType,
      customLogoData,
      customNote
    });
    onClose();
  };

  const logoOptions = [
    { id: 'custom' as const, label: t.compilerLogoCustom, icon: Image },
    { id: 'standard' as const, label: t.logoStandard, icon: Compass },
    { id: 'building' as const, label: t.logoBuilding, icon: Building2 },
    { id: 'gauge' as const, label: t.logoGauge, icon: Gauge },
    { id: 'shield' as const, label: t.logoCert, icon: ShieldCheck },
    { id: 'none' as const, label: t.logoNone, icon: X },
  ];

  return (
    <div className="fixed inset-0 bg-neutral-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in print:hidden">
      <div className="bg-[#f4fbf7] border-2 border-emerald-900/30 rounded-2xl max-w-lg w-full max-h-[calc(100vh-3rem)] shadow-2xl overflow-hidden animate-scale-up flex flex-col">
        {/* Header */}
        <div className="bg-emerald-950 text-white px-6 py-4 flex items-center justify-between border-b border-emerald-900 shrink-0">
          <div className="flex items-center gap-2.5">
            <Building className="w-5 h-5 text-emerald-400" />
            <div>
              <h3 className="font-extrabold text-sm uppercase tracking-wider">{t.compilerTitle}</h3>
              <p className="text-[10px] text-emerald-300">{t.compilerSubtitle}</p>
            </div>
          </div>
          <button 
            type="button"
            onClick={onClose}
            className="text-emerald-300 hover:text-white hover:bg-emerald-900/50 p-1.5 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="p-6 overflow-y-auto space-y-4 flex-1 scrollbar-thin scrollbar-thumb-emerald-200">
            <div className="space-y-3.5">
              {/* Logo Selector */}
              <div>
                <label className="block text-xs font-bold text-emerald-950 mb-1.5 uppercase tracking-wide">
                  {t.selectLogo}
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {logoOptions.map((opt) => {
                    const IconComponent = opt.icon;
                    const isSelected = logoType === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setLogoType(opt.id)}
                        className={`flex items-center gap-2 p-2 border rounded-xl text-left transition-all cursor-pointer ${
                          isSelected 
                            ? 'bg-emerald-900 text-white border-emerald-950 shadow-md scale-102' 
                            : 'bg-white text-emerald-900 border-emerald-200 hover:border-emerald-300 hover:bg-emerald-50/50'
                        }`}
                      >
                        {opt.id === 'custom' && customLogoData ? (
                          <img src={customLogoData} className="w-4 h-4 object-contain rounded-xs" alt="Logo preview" referrerPolicy="no-referrer" />
                        ) : (
                          <IconComponent className={`w-4 h-4 ${isSelected ? 'text-emerald-400' : 'text-emerald-700'}`} />
                        )}
                        <span className="text-[11px] font-bold">{opt.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Custom Logo File Uploader - Only visible if 'custom' is selected */}
              {logoType === 'custom' && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 space-y-2 animate-fade-in">
                  <span className="block text-[11px] font-bold text-emerald-950 uppercase tracking-wide">
                    {lang === 'en' ? 'Upload and Import your Logo (.png, .jpg, .svg)' :
                     lang === 'es' ? 'Subir e importar su logotipo (.png, .jpg, .svg)' :
                     lang === 'de' ? 'Logo hochladen und importieren (.png, .jpg, .svg)' :
                     'Carica e Importa il tuo Logo (.png, .jpg, .svg)'}
                  </span>
                  <div className="flex items-center gap-4">
                    {customLogoData ? (
                      <div className="relative w-16 h-16 border border-emerald-300 rounded-lg overflow-hidden bg-white flex items-center justify-center shrink-0">
                        <img src={customLogoData} className="w-full h-full object-contain p-1" alt="Preview Logo" referrerPolicy="no-referrer" />
                        <button
                          type="button"
                          onClick={() => setCustomLogoData('')}
                          className="absolute top-0.5 right-0.5 bg-red-600 text-white p-0.5 rounded-full hover:bg-red-700 transition-colors cursor-pointer"
                          title={t.delete}
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ) : (
                      <div className="w-16 h-16 border-2 border-dashed border-emerald-300 rounded-lg flex items-center justify-center bg-white shrink-0">
                        <Image className="w-5 h-5 text-emerald-600/60" />
                      </div>
                    )}
                    <div className="flex-1">
                      <label className="flex items-center gap-1.5 justify-center px-3 py-1.5 border border-emerald-600 text-emerald-900 bg-white hover:bg-emerald-50 rounded-lg text-xs font-bold cursor-pointer transition-colors shadow-xs">
                        <Upload className="w-3.5 h-3.5" />
                        {lang === 'en' ? 'Browse file...' : lang === 'es' ? 'Buscar archivo...' : lang === 'de' ? 'Datei auswählen...' : 'Sfoglia file...'}
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onload = (event) => {
                                if (event.target?.result) {
                                  setCustomLogoData(event.target.result as string);
                                }
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                        />
                      </label>
                      <p className="text-[10px] text-emerald-700/80 mt-1.5 leading-tight">
                        {lang === 'en' ? 'The image will be stored locally in the browser and printed in high resolution.' :
                         lang === 'es' ? 'La imagen se guardará localmente en el navegador y se imprimirá en alta resolución.' :
                         lang === 'de' ? 'Das Bild wird lokal im Browser gespeichert und hochauflösend gedruckt.' :
                         "L'immagine verrà salvata localmente nel browser e stampata in alta risoluzione sul certificato."}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Ditta */}
              <div>
                <label className="block text-xs font-bold text-emerald-950 mb-1 uppercase tracking-wide">
                  {t.companyName}
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    placeholder="es. TecnoCalibrazioni S.r.l."
                    value={ditta}
                    onChange={(e) => setDitta(e.target.value)}
                    className="w-full text-xs font-semibold bg-[#e1efe4] border-2 border-emerald-300/80 rounded-lg px-3 py-2 text-emerald-950 focus:ring-2 focus:ring-emerald-900 focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Partita IVA */}
              <div>
                <label className="block text-xs font-bold text-emerald-950 mb-1 uppercase tracking-wide">
                  {t.vatNumber}
                </label>
                <input
                  type="text"
                  required
                  placeholder="es. IT01234567890"
                  value={partitaIva}
                  onChange={(e) => setPartitaIva(e.target.value)}
                  className="w-full text-xs font-semibold bg-[#e1efe4] border-2 border-emerald-300/80 rounded-lg px-3 py-2 text-emerald-950 focus:ring-2 focus:ring-emerald-900 focus:outline-hidden font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                {/* Telefono */}
                <div>
                  <label className="block text-xs font-bold text-emerald-950 mb-1 flex items-center gap-1 uppercase tracking-wide">
                    <Phone className="w-3 h-3" /> {t.phone}
                  </label>
                  <input
                    type="text"
                    placeholder="es. +39 02 9876543"
                    value={telefono}
                    onChange={(e) => setTelefono(e.target.value)}
                    className="w-full text-xs font-semibold bg-[#e1efe4] border-2 border-emerald-300/80 rounded-lg px-3 py-2 text-emerald-950 focus:ring-2 focus:ring-emerald-900 focus:outline-hidden"
                  />
                </div>
                {/* Email */}
                <div>
                  <label className="block text-xs font-bold text-emerald-950 mb-1 flex items-center gap-1 uppercase tracking-wide">
                    <Mail className="w-3 h-3" /> {t.email}
                  </label>
                  <input
                    type="email"
                    placeholder="es. info@tecnocalibrazioni.it"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full text-xs font-semibold bg-[#e1efe4] border-2 border-emerald-300/80 rounded-lg px-3 py-2 text-emerald-950 focus:ring-2 focus:ring-emerald-900 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {/* Email PEC */}
                <div>
                  <label className="block text-xs font-bold text-emerald-950 mb-1 flex items-center gap-1 uppercase tracking-wide">
                    <Mail className="w-3 h-3 text-emerald-700" /> PEC / Secure Email
                  </label>
                  <input
                    type="email"
                    placeholder="es. pec@tecnocalibrazioni.it"
                    value={emailPec}
                    onChange={(e) => setEmailPec(e.target.value)}
                    className="w-full text-xs font-semibold bg-[#e1efe4] border-2 border-emerald-300/80 rounded-lg px-3 py-2 text-emerald-950 focus:ring-2 focus:ring-emerald-900 focus:outline-hidden"
                  />
                </div>
                {/* Iscrizione Registro / Albo */}
                <div>
                  <label className="block text-xs font-bold text-emerald-950 mb-1 flex items-center gap-1 uppercase tracking-wide">
                    <FileText className="w-3 h-3 text-emerald-700" /> {lang === 'en' ? 'Professional Board / Reg.' : lang === 'es' ? 'Registro Profesional' : lang === 'de' ? 'Registernummer / Kammer' : 'Iscrizione Registro / Albo'}
                  </label>
                  <input
                    type="text"
                    placeholder="es. Ordine Ingegneri n. 123"
                    value={iscrizioneRegistro}
                    onChange={(e) => setIscrizioneRegistro(e.target.value)}
                    className="w-full text-xs font-semibold bg-[#e1efe4] border-2 border-emerald-300/80 rounded-lg px-3 py-2 text-emerald-950 focus:ring-2 focus:ring-emerald-900 focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Indirizzo */}
              <div>
                <label className="block text-xs font-bold text-emerald-950 mb-1 flex items-center gap-1 uppercase tracking-wide">
                  <MapPin className="w-3 h-3" /> {t.address}
                </label>
                <input
                  type="text"
                  placeholder="es. Via dell'Artigianato 15, Milano (MI)"
                  value={indirizzo}
                  onChange={(e) => setIndirizzo(e.target.value)}
                  className="w-full text-xs font-semibold bg-[#e1efe4] border-2 border-emerald-300/80 rounded-lg px-3 py-2 text-emerald-950 focus:ring-2 focus:ring-emerald-900 focus:outline-hidden"
                  />
              </div>

              {/* Note Custom */}
              <div>
                <label className="block text-xs font-bold text-emerald-950 mb-1 flex items-center gap-1 uppercase tracking-wide">
                  <FileText className="w-3 h-3" /> {t.additionalInfo}
                </label>
                <textarea
                  placeholder="es. Iscr. Albo Ingegneri Milano n. 12345 • Cap. Soc. €10.000 i.v."
                  value={customNote}
                  onChange={(e) => setCustomNote(e.target.value)}
                  className="w-full text-xs font-semibold bg-[#e1efe4] border-2 border-emerald-300/80 rounded-lg px-3 py-2 text-emerald-950 focus:ring-2 focus:ring-emerald-900 focus:outline-hidden h-16 resize-none"
                />
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="p-4 bg-emerald-50 border-t border-emerald-200/60 flex gap-2 justify-end shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="bg-white border-2 border-emerald-200 hover:bg-emerald-50 text-emerald-900 font-bold text-xs px-4 py-2 rounded-lg transition-all cursor-pointer"
            >
              {t.cancel}
            </button>
            <button
              type="submit"
              className="bg-emerald-900 hover:bg-emerald-950 text-white font-bold text-xs px-5 py-2 rounded-lg transition-all cursor-pointer shadow-md flex items-center gap-1"
            >
              <Check className="w-4 h-4" />
              {t.save}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
