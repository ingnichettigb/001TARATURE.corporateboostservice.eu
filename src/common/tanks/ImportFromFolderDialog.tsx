import { useCallback, useEffect, useState } from "react";
import { FolderOpen, FileJson, RefreshCw, X, FolderSync, AlertCircle } from "lucide-react";
import {
  clearLinkedFolder,
  ensureReadPermission,
  getLinkedFolder,
  listTankFiles,
  pickAndLinkFolder,
  readTankFile,
  type LinkedTankFile,
} from "./folder";

interface Props {
  open: boolean;
  tankType: string;
  onClose: () => void;
  /** Chiamato col contenuto testuale e il nome reale del file scelto. */
  onFilePicked: (content: string, fileName: string) => void;
}

type State =
  | { kind: "loading" }
  | { kind: "not-linked" }
  | { kind: "permission"; dir: FileSystemDirectoryHandle }
  | { kind: "ready"; dir: FileSystemDirectoryHandle; files: LinkedTankFile[] }
  | { kind: "error"; message: string };

export default function ImportFromFolderDialog({ open, tankType, onClose, onFilePicked }: Props) {
  const [state, setState] = useState<State>({ kind: "loading" });
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(async (dir: FileSystemDirectoryHandle) => {
    const files = await listTankFiles(dir, tankType);
    setState({ kind: "ready", dir, files });
  }, [tankType]);

  const init = useCallback(async () => {
    setState({ kind: "loading" });
    const dir = await getLinkedFolder();
    if (!dir) {
      setState({ kind: "not-linked" });
      return;
    }
    const anyDir = dir as any;
    const perm =
      typeof anyDir.queryPermission === "function"
        ? await anyDir.queryPermission({ mode: "read" })
        : "granted";
    if (perm === "granted") {
      await refresh(dir);
    } else {
      setState({ kind: "permission", dir });
    }
  }, [refresh]);

  useEffect(() => {
    if (open) void init();
  }, [open, init]);

  if (!open) return null;

  const handleLink = async () => {
    setBusy(true);
    try {
      const dir = await pickAndLinkFolder();
      if (dir) await refresh(dir);
    } catch (e: any) {
      if (e?.name !== "AbortError") {
        setState({ kind: "error", message: "Impossibile accedere alla cartella selezionata." });
      } else {
        void init();
      }
    } finally {
      setBusy(false);
    }
  };

  const handleGrant = async (dir: FileSystemDirectoryHandle) => {
    setBusy(true);
    try {
      if (await ensureReadPermission(dir)) {
        await refresh(dir);
      } else {
        setState({ kind: "error", message: "Permesso di lettura negato per la cartella collegata." });
      }
    } finally {
      setBusy(false);
    }
  };

  const handleUnlink = async () => {
    await clearLinkedFolder();
    setState({ kind: "not-linked" });
  };

  const handlePick = async (file: LinkedTankFile) => {
    setBusy(true);
    try {
      const content = await readTankFile(file.handle);
      onFilePicked(content, file.name.replace(/\.json$/i, ""));
      onClose();
    } catch {
      setState({ kind: "error", message: `Impossibile leggere il file "${file.name}".` });
    } finally {
      setBusy(false);
    }
  };

  const dirName = (state.kind === "ready" || state.kind === "permission") ? state.dir.name : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg rounded-xl border border-emerald-300 bg-white p-5 shadow-xl">
        <div className="mb-3 flex items-start gap-2">
          <FolderOpen className="mt-0.5 h-5 w-5 shrink-0 text-emerald-700" />
          <div className="min-w-0">
            <h3 className="text-sm font-bold text-neutral-900">
              Importa configurazione {tankType}
            </h3>
            <p className="mt-1 text-xs text-neutral-600">
              Vengono mostrati solo i file <strong>{tankType}_*.json</strong>
              {dirName ? <> della cartella <strong>{dirName}</strong></> : null}.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="ml-auto rounded p-1 text-neutral-400 hover:bg-neutral-100"
            title="Chiudi"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="min-h-[120px]">
          {state.kind === "loading" && (
            <p className="py-8 text-center text-xs text-neutral-500">Caricamento…</p>
          )}

          {state.kind === "not-linked" && (
            <div className="py-6 text-center">
              <p className="mb-3 text-xs text-neutral-600">
                Collega la cartella in cui salvi i file JSON delle tarature.
                Il collegamento viene ricordato per le prossime volte.
              </p>
              <button
                type="button"
                disabled={busy}
                onClick={handleLink}
                className="rounded-lg bg-emerald-700 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-800 disabled:opacity-50"
              >
                <FolderOpen className="mr-1.5 inline h-3.5 w-3.5" />
                Collega cartella
              </button>
            </div>
          )}

          {state.kind === "permission" && (
            <div className="py-6 text-center">
              <p className="mb-3 text-xs text-neutral-600">
                L'autorizzazione alla cartella <strong>{state.dir.name}</strong> è scaduta.
              </p>
              <button
                type="button"
                disabled={busy}
                onClick={() => handleGrant(state.dir)}
                className="rounded-lg bg-emerald-700 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-800 disabled:opacity-50"
              >
                Ri-autorizza lettura
              </button>
            </div>
          )}

          {state.kind === "error" && (
            <div className="flex items-center gap-1.5 rounded-lg border border-rose-100 bg-rose-50 p-2.5 text-xs text-rose-800">
              <AlertCircle className="h-3.5 w-3.5 shrink-0" />
              <span>{state.message}</span>
            </div>
          )}

          {state.kind === "ready" && (
            <>
              {state.files.length === 0 ? (
                <p className="py-8 text-center text-xs text-neutral-500">
                  Nessun file <strong>{tankType}_*.json</strong> trovato nella cartella.
                </p>
              ) : (
                <div className="max-h-[280px] divide-y divide-neutral-100 overflow-y-auto rounded-lg border border-neutral-200">
                  {state.files.map((f) => (
                    <button
                      key={f.name}
                      type="button"
                      disabled={busy}
                      onClick={() => handlePick(f)}
                      className="flex w-full items-center gap-2 p-2.5 text-left transition-colors hover:bg-emerald-50"
                    >
                      <FileJson className="h-4 w-4 shrink-0 text-emerald-700" />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium text-neutral-900">
                          {f.name.replace(/\.json$/i, "")}
                        </span>
                        <span className="block text-[10px] text-neutral-400">
                          {new Date(f.lastModified).toLocaleDateString("it-IT", {
                            day: "2-digit",
                            month: "2-digit",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </span>
                    </button>
                  ))}
                </div>
              )}
              <div className="mt-2 flex items-center justify-between">
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => refresh(state.dir)}
                  className="flex items-center gap-1 text-[11px] font-medium text-neutral-500 hover:text-neutral-800"
                >
                  <RefreshCw className="h-3 w-3" /> Aggiorna elenco
                </button>
                <button
                  type="button"
                  onClick={handleUnlink}
                  className="text-[11px] font-medium text-neutral-400 hover:text-rose-600"
                >
                  Scollega cartella
                </button>
              </div>
            </>
          )}
        </div>

        <div className="mt-4 flex flex-wrap justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-neutral-300 px-3 py-2 text-xs font-semibold text-neutral-700 hover:bg-neutral-50"
          >
            Annulla
          </button>
          {state.kind === "ready" && (
            <button
              type="button"
              disabled={busy}
              onClick={handleLink}
              className="flex items-center gap-1.5 rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-800 hover:bg-emerald-100 disabled:opacity-50"
            >
              <FolderSync className="h-3.5 w-3.5" />
              Cambia cartella
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
