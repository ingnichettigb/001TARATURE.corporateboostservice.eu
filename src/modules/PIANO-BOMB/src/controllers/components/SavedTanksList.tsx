/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { SavedTank, TankInput, CompilerInfo } from '../../models/types';
import { Save, Trash2, FolderOpen, AlertCircle, Pencil, Copy, Printer, Check, X, Download, Upload } from 'lucide-react';
import { Language, translations } from '../../utils/translations';
import {
  loadSavedTanks,
  saveTanks as persistTanks,
  newTankId,
  formatTankDate,
} from '@/common/tanks/storage';
import { buildTankFile, buildTankFileName, downloadTankFile, parseTankFile } from '@/common/tanks/file';
import ImportMismatchDialog from '@/common/tanks/ImportMismatchDialog';
import ImportFromFolderDialog from '@/common/tanks/ImportFromFolderDialog';
import { supportsFolderAccess } from '@/common/tanks/folder';

interface SavedTanksListProps {
  currentInput: TankInput;
  onLoadTank: (input: TankInput, compilerInfo?: CompilerInfo, tankId?: string) => void;
  lang?: Language;
  activeTankId: string | null;
  setActiveTankId: (id: string | null) => void;
  suggestedName?: string;
  onSaveAndDownload?: () => void;
  /** Tipologia serbatoio del modulo (nome cartella, es. "BOMB-CON"). */
  tankType: string;
}

export default function SavedTanksList({ 
  currentInput, 
  onLoadTank, 
  lang = 'it',
  activeTankId,
  setActiveTankId,
  suggestedName = '',
  onSaveAndDownload,
  tankType
}: SavedTanksListProps) {
  const t = translations[lang];
  const [savedTanks, setSavedTanks] = useState<SavedTank[]>([]);
  const [tankName, setTankName] = useState(suggestedName);
  const [nameTouched, setNameTouched] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [mismatch, setMismatch] = useState<
    { fileTankType: string; input: TankInput; compilerInfo?: CompilerInfo; name: string } | null
  >(null);
  const [folderDialogOpen, setFolderDialogOpen] = useState(false);
  const folderAccess = supportsFolderAccess();

  // Keep proposing the auto-generated name until the user edits it manually
  useEffect(() => {
    if (!nameTouched) setTankName(suggestedName);
  }, [suggestedName, nameTouched]);


  // States for editing/renaming
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState<string>('');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  useEffect(() => {
    const loadTanks = () => {
      const loaded = loadSavedTanks<TankInput, CompilerInfo>(tankType) as SavedTank[];
      const normalized = loaded.map((t) => ({ ...t, name: buildTankFileName(tankType, t.name) }));
      const changed = normalized.some((t, i) => t.name !== loaded[i]?.name);
      if (changed) {
        persistTanks(tankType, normalized as any);
      }
      setSavedTanks(normalized);
    };

    loadTanks();

    window.addEventListener('saved-tanks-updated', loadTanks);
    return () => {
      window.removeEventListener('saved-tanks-updated', loadTanks);
    };
  }, [tankType]);

  const saveTanksToStorage = (tanks: SavedTank[]) => {
    persistTanks(tankType, tanks as any);
    setSavedTanks(tanks);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = tankName.trim();
    if (!trimmedName) {
      setMessage({ text: 'Inserisci un nome per il serbatoio', type: 'error' });
      return;
    }

    let storedCompilerInfo: CompilerInfo | undefined = undefined;
    const compilerRaw = localStorage.getItem('bomb_bomb_compiler_info');
    if (compilerRaw) {
      try {
        storedCompilerInfo = JSON.parse(compilerRaw);
      } catch (err) {
        console.error('Error reading compiler info', err);
      }
    }

    const prefixedName = buildTankFileName(tankType, trimmedName);

    const newSaved: SavedTank = {
      id: newTankId(),
      name: prefixedName,
      date: formatTankDate(),
      input: JSON.parse(JSON.stringify(currentInput)), // Deep copy
      compilerInfo: storedCompilerInfo,
    };

    const updated = [newSaved, ...savedTanks.filter(t => t.name !== prefixedName)];
    saveTanksToStorage(updated);
    setActiveTankId(newSaved.id);

    // Prompt the user to save the JSON file directly to their computer
    try {
      downloadTankFile(
        prefixedName,
        buildTankFile(tankType, prefixedName, currentInput, storedCompilerInfo)
      );

      setMessage({ 
        text: `Configurazione "${prefixedName}" salvata in locale e scaricata come "${prefixedName}.json"!`, 
        type: 'success' 
      });
    } catch (err) {
      console.error(err);
      setMessage({ 
        text: `Configurazione "${prefixedName}" salvata in locale (errore download automatico)`, 
        type: 'success' 
      });
    }

    setNameTouched(false);
    setTankName(suggestedName);

    setTimeout(() => setMessage(null), 5000);
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = savedTanks.filter(t => t.id !== id);
    saveTanksToStorage(updated);
    setDeleteConfirmId(null);
    setMessage({ text: 'Configurazione eliminata con successo!', type: 'success' });
    setTimeout(() => setMessage(null), 3000);
  };

  const handleExportSingle = (tank: SavedTank, e: React.MouseEvent) => {
    e.stopPropagation();
    const fileName = buildTankFileName(tankType, tank.name);
    downloadTankFile(fileName, buildTankFile(tankType, tank.name, tank.input, tank.compilerInfo));
  };

  const importParsedTank = (
    importedInput: TankInput,
    importedName: string,
    importedCompilerInfo?: CompilerInfo,
    warning?: string
  ) => {
    const newSaved: SavedTank = {
      id: newTankId(),
      name: `${importedName} (Importato)`,
      date: formatTankDate(),
      input: importedInput,
      compilerInfo: importedCompilerInfo,
    };

    const updated = [newSaved, ...savedTanks];
    saveTanksToStorage(updated);
    onLoadTank(importedInput, importedCompilerInfo, newSaved.id);

    setMessage({
      text: warning
        ? `${warning} Configurazione "${newSaved.name}" caricata.`
        : `Configurazione "${newSaved.name}" importata e caricata!`,
      type: 'success',
    });
    setTimeout(() => setMessage(null), 5000);
  };

  /** Elabora il contenuto JSON importato (da input file o dalla cartella collegata). */
  const processImportedJson = (content: string, realFileName: string) => {
    const result = parseTankFile<TankInput, CompilerInfo>(content, tankType);

    if (result.status === 'invalid') {
      setMessage({ text: `Errore nell'importazione: ${result.message}`, type: 'error' });
      setTimeout(() => setMessage(null), 5000);
      return;
    }

    if (result.status === 'mismatch') {
      setMismatch({
        fileTankType: result.tankType!,
        input: result.input as TankInput,
        compilerInfo: result.compilerInfo,
        name: realFileName,
      });
      return;
    }

    importParsedTank(
      result.input as TankInput,
      realFileName,
      result.compilerInfo,
      result.status === 'legacy' ? result.message : undefined
    );
  };

  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const realFileName = file.name.replace(/\.json$/i, '');

    const reader = new FileReader();
    reader.onload = (event) => {
      processImportedJson((event.target?.result as string) ?? '', realFileName);
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleStartEdit = (tank: SavedTank, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(tank.id);
    const prefix = `${tankType}_`;
    setEditingName(tank.name.startsWith(prefix) ? tank.name.slice(prefix.length) : tank.name);
  };

  const handleSaveEdit = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const trimmed = editingName.trim();
    if (!trimmed) {
      setMessage({ text: 'Il nome non può essere vuoto', type: 'error' });
      return;
    }

    const prefixedName = buildTankFileName(tankType, trimmed);
    const updated = savedTanks.map(t => {
      if (t.id === id) {
        return { ...t, name: prefixedName };
      }
      return t;
    });
    saveTanksToStorage(updated);
    setEditingId(null);
    setMessage({ text: `Nome configurazione modificato in "${prefixedName}" con successo!`, type: 'success' });
    setTimeout(() => setMessage(null), 3000);
  };

  const handleCancelEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(null);
  };

  const handleDuplicate = (tank: SavedTank, e: React.MouseEvent) => {
    e.stopPropagation();
    const newName = `${tank.name} - Copia`;
    const newSaved: SavedTank = {
      id: newTankId(),
      name: newName,
      date: formatTankDate(),
      input: JSON.parse(JSON.stringify(tank.input)),
      compilerInfo: tank.compilerInfo ? JSON.parse(JSON.stringify(tank.compilerInfo)) : undefined,
    };

    const updated = [newSaved, ...savedTanks];
    saveTanksToStorage(updated);
    setMessage({ text: `Configurazione duplicata in "${newName}" con successo!`, type: 'success' });
    setTimeout(() => setMessage(null), 3000);
  };

  const handlePrint = (tank: SavedTank, e: React.MouseEvent) => {
    e.stopPropagation();
    onLoadTank(tank.input, tank.compilerInfo, tank.id);
    setTimeout(() => {
      const originalTitle = document.title;
      const safeName = tank.name || tank.input.report.nomeSerbatoio || 'serbatoio';
      document.title = safeName;

      const restoreTitle = () => {
        document.title = originalTitle;
        window.removeEventListener('afterprint', restoreTitle);
      };
      window.addEventListener('afterprint', restoreTitle);

      window.print();

      setTimeout(() => {
        document.title = originalTitle;
      }, 1000);
    }, 250);
  };

  const handleLoadTankLocal = (tank: SavedTank, e: React.MouseEvent) => {
    e.stopPropagation();
    onLoadTank(tank.input, tank.compilerInfo, tank.id);
    const msg = lang === 'en' 
      ? `Configuration "${tank.name}" loaded successfully!` 
      : lang === 'es' 
      ? `¡Configuración "${tank.name}" cargada correctamente!` 
      : lang === 'de' 
      ? `Konfiguration "${tank.name}" erfolgreich geladen!` 
      : `Configurazione "${tank.name}" caricata con successo!`;
    setMessage({ text: msg, type: 'success' });
    setTimeout(() => setMessage(null), 3000);
  };

  return (
    <div className="bg-white border-4 border-double border-emerald-800 rounded-xl p-5 shadow-xs">
      <ImportMismatchDialog
        open={!!mismatch}
        fileTankType={mismatch?.fileTankType ?? ''}
        currentTankType={tankType}
        onClose={() => setMismatch(null)}
        onLoadAnyway={() => {
          if (mismatch) {
            importParsedTank(
              mismatch.input,
              mismatch.name,
              mismatch.compilerInfo,
              `Attenzione: file di tipo ${mismatch.fileTankType} caricato in ${tankType}.`
            );
          }
          setMismatch(null);
        }}
      />
      <ImportFromFolderDialog
        open={folderDialogOpen}
        tankType={tankType}
        onClose={() => setFolderDialogOpen(false)}
        onFilePicked={(content, fileName) => processImportedJson(content, fileName)}
      />
      <div className="flex items-center justify-between gap-3 mb-3 flex-wrap">
        <h3 className="text-base font-semibold text-neutral-900 flex items-center gap-2 min-w-0">
          <Save className="w-4 h-4 text-neutral-600" />
          Gestione Configurazioni (SaaS Local)
        </h3>
        {onSaveAndDownload && (
          <button
            type="button"
            onClick={onSaveAndDownload}
            className="shrink-0 bg-blue-800 hover:bg-blue-900 text-white font-black py-2 px-3.5 rounded-lg shadow-md transition-all flex items-center justify-center gap-2 text-[11px] uppercase tracking-wide cursor-pointer"
          >
            <Save className="w-4 h-4 text-blue-200 shrink-0" />
            <span>
              {lang === 'en' ? 'Save & Export' :
               lang === 'es' ? 'Guardar y Exportar' :
               lang === 'de' ? 'Speichern & Export' :
               'Salvataggio ed esportazione'}
            </span>
            <Download className="w-4 h-4 text-blue-200 shrink-0" />
          </button>
        )}
      </div>

      <form onSubmit={handleSave} className="space-y-3 mb-5">
        <div>
          <label htmlFor="save-name" className="block text-xs font-medium text-neutral-500 mb-1">
            Salva Configurazione Corrente Come:
          </label>
          <div className="flex flex-col gap-2">
            <input
              id="save-name"
              type="text"
              placeholder="es. Serbatoio Eni V-102"
              value={tankName}
              onChange={(e) => { setNameTouched(true); setTankName(e.target.value); }}

              className="w-full text-sm bg-neutral-50 border border-neutral-300 rounded-lg px-3 py-2 text-neutral-900 placeholder-neutral-400 focus:outline-hidden focus:ring-2 focus:ring-neutral-900 focus:border-neutral-900"
            />
            <div className="flex gap-2">
              <button
                type="submit"
                className="flex-1 bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-semibold py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" />
                Salva
              </button>
              {folderAccess ? (
                <button
                  type="button"
                  onClick={() => setFolderDialogOpen(true)}
                  className="flex-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-lg py-2 px-3 text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition-colors shadow-2xs"
                >
                  <Upload className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Importa JSON</span>
                </button>
              ) : (
                <label className="flex-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-lg py-2 px-3 text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition-colors shadow-2xs">
                  <Upload className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Importa JSON</span>
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleImportJSON}
                    className="hidden"
                  />
                </label>
              )}
            </div>
          </div>
        </div>

        {message && (
          <div
            className={`text-xs p-2.5 rounded-lg flex items-center gap-1.5 ${
              message.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-100' : 'bg-rose-50 text-rose-800 border border-rose-100'
            }`}
          >
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span>{message.text}</span>
          </div>
        )}
      </form>

      {savedTanks.length > 0 ? (
        <div className="space-y-2">
          <label className="block text-xs font-medium text-neutral-500 mb-1">
            Carica Configurazione Salvata ({savedTanks.length}):
          </label>
          <div className="max-h-[180px] overflow-y-auto divide-y divide-neutral-100 border border-neutral-200 rounded-lg">
            {savedTanks.map((tank) => {
              const isActive = activeTankId === tank.id;
              return (
                <div
                  key={tank.id}
                  onClick={(e) => handleLoadTankLocal(tank, e)}
                  className={`group flex items-center justify-between p-3 text-left cursor-pointer transition-all ${
                    isActive 
                      ? 'bg-emerald-50/80 hover:bg-emerald-100/70 border-l-4 border-l-emerald-600 pl-2' 
                      : 'hover:bg-neutral-50 border-l-4 border-l-transparent pl-2'
                  }`}
                >
                  <div className="min-w-0 pr-2 flex-1">
                    {editingId === tank.id ? (
                      <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="text"
                          value={editingName}
                          onChange={(e) => setEditingName(e.target.value)}
                          className="text-xs bg-white border border-neutral-300 rounded px-2 py-1 text-neutral-900 font-medium focus:outline-hidden focus:ring-1 focus:ring-emerald-700 w-full"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSaveEdit(tank.id, e as any);
                            if (e.key === 'Escape') handleCancelEdit(e as any);
                          }}
                        />
                        <button
                          type="button"
                          onClick={(e) => handleSaveEdit(tank.id, e)}
                          className="p-1 text-emerald-600 hover:bg-emerald-50 rounded shrink-0"
                          title="Salva"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={handleCancelEdit}
                          className="p-1 text-neutral-400 hover:bg-neutral-100 rounded shrink-0"
                          title="Annulla"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <>
                        <div className={`text-sm truncate font-medium ${isActive ? 'text-emerald-950 font-extrabold' : 'text-neutral-900 group-hover:text-neutral-950'}`}>
                          {tank.name}
                        </div>
                        <div className={`text-[10px] flex items-center gap-1.5 mt-0.5 ${isActive ? 'text-emerald-700/80' : 'text-neutral-400'}`}>
                          <span>{tank.date}</span>
                          <span>•</span>
                          <span>Ø {tank.input.dInt} mm</span>
                          <span>•</span>
                          <span>L {tank.input.lCil} mm</span>
                        </div>
                      </>
                    )}
                  </div>
                  <div className={`flex items-center gap-1 transition-opacity shrink-0 ${isActive ? 'opacity-100' : 'opacity-60 group-hover:opacity-100'}`}>
                    {deleteConfirmId === tank.id ? (
                      <div className="flex items-center gap-1 bg-rose-50 border border-rose-200 rounded px-1.5 py-0.5" onClick={(e) => e.stopPropagation()}>
                        <span className="text-[9px] font-black text-rose-700 uppercase tracking-tight mr-1">Elimina?</span>
                        <button
                          type="button"
                          onClick={(e) => handleDelete(tank.id, e)}
                          className="p-1 bg-rose-600 hover:bg-rose-700 text-white rounded-md shrink-0 cursor-pointer"
                          title="Sì, elimina"
                        >
                          <Check className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteConfirmId(null);
                          }}
                          className="p-1 bg-neutral-200 hover:bg-neutral-300 text-neutral-700 rounded-md shrink-0 cursor-pointer"
                          title="Annulla"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ) : (
                      <>
                        {editingId !== tank.id && (
                          <>
                            <button
                              type="button"
                              title="Rinomina"
                              onClick={(e) => handleStartEdit(tank, e)}
                              className={`p-1 rounded ${isActive ? 'text-emerald-700 hover:text-emerald-900 hover:bg-emerald-150/50' : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100'}`}
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              title="Duplica"
                              onClick={(e) => handleDuplicate(tank, e)}
                              className={`p-1 rounded ${isActive ? 'text-emerald-700 hover:text-emerald-900 hover:bg-emerald-150/50' : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100'}`}
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              title="Esporta JSON"
                              onClick={(e) => handleExportSingle(tank, e)}
                              className={`p-1 rounded ${isActive ? 'text-emerald-700 hover:text-emerald-900 hover:bg-emerald-150/50' : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100'}`}
                            >
                              <Download className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              title="Stampa"
                              onClick={(e) => handlePrint(tank, e)}
                              className={`p-1 rounded ${isActive ? 'text-emerald-700 hover:text-emerald-900 hover:bg-emerald-150/50' : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100'}`}
                            >
                              <Printer className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}
                        <button
                          type="button"
                          title="Carica / Apri"
                          onClick={(e) => handleLoadTankLocal(tank, e)}
                          className={`p-1 rounded transition-colors ${
                            isActive 
                              ? 'text-emerald-800 bg-emerald-200/60 hover:text-emerald-950 hover:bg-emerald-200' 
                              : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100'
                          }`}
                        >
                          <FolderOpen className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          title="Elimina"
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteConfirmId(tank.id);
                          }}
                          className={`p-1 rounded ${isActive ? 'text-rose-600 hover:text-rose-800 hover:bg-rose-100/55' : 'text-rose-500 hover:text-rose-700 hover:bg-rose-50'}`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <p className="text-xs text-neutral-400 italic text-center py-4 bg-neutral-50 border border-dashed border-neutral-200 rounded-lg">
          Nessun serbatoio salvato. Configura un serbatoio a sinistra e salvalo qui.
        </p>
      )}
    </div>
  );
}
