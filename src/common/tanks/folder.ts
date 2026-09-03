/**
 * Gestione della "cartella collegata" per l'importazione filtrata dei file JSON.
 * Usa la File System Access API (Chrome/Edge); l'handle della directory viene
 * persistito in IndexedDB perché non è serializzabile in localStorage.
 */

const DB_NAME = "tanks-folder-link";
const STORE = "kv";
const KEY = "linkedFolder";

export interface LinkedTankFile {
  name: string;
  lastModified: number;
  handle: FileSystemFileHandle;
}

export function supportsFolderAccess(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof (window as any).showDirectoryPicker === "function" &&
    typeof indexedDB !== "undefined"
  );
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      if (!req.result.objectStoreNames.contains(STORE)) {
        req.result.createObjectStore(STORE);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function getLinkedFolder(): Promise<FileSystemDirectoryHandle | null> {
  try {
    const db = await openDb();
    return await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, "readonly");
      const req = tx.objectStore(STORE).get(KEY);
      req.onsuccess = () => resolve((req.result as FileSystemDirectoryHandle) ?? null);
      req.onerror = () => reject(req.error);
    });
  } catch {
    return null;
  }
}

export async function setLinkedFolder(handle: FileSystemDirectoryHandle): Promise<void> {
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).put(handle, KEY);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function clearLinkedFolder(): Promise<void> {
  try {
    const db = await openDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, "readwrite");
      tx.objectStore(STORE).delete(KEY);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch {
    /* ignore */
  }
}

/** Verifica il permesso di lettura; ritorna true se leggibile (eventualmente dopo richiesta). */
export async function ensureReadPermission(
  handle: FileSystemDirectoryHandle,
): Promise<boolean> {
  const anyHandle = handle as any;
  if (typeof anyHandle.queryPermission !== "function") return true;
  if ((await anyHandle.queryPermission({ mode: "read" })) === "granted") return true;
  return (await anyHandle.requestPermission({ mode: "read" })) === "granted";
}

/** Apre il selettore cartella, salva l'handle e verifica il permesso. */
export async function pickAndLinkFolder(): Promise<FileSystemDirectoryHandle | null> {
  const handle: FileSystemDirectoryHandle = await (window as any).showDirectoryPicker({
    mode: "read",
  });
  await setLinkedFolder(handle);
  const ok = await ensureReadPermission(handle);
  return ok ? handle : null;
}

/**
 * Elenca solo i file `.json` il cui nome inizia col prefisso della tipologia
 * (es. "BOMB-CON_"), ordinati per data modifica decrescente.
 */
export async function listTankFiles(
  dir: FileSystemDirectoryHandle,
  tankType: string,
): Promise<LinkedTankFile[]> {
  const prefix = `${tankType}_`.toLowerCase();
  const out: LinkedTankFile[] = [];
  for await (const entry of (dir as any).values()) {
    if (entry.kind !== "file") continue;
    const name: string = entry.name;
    if (!name.toLowerCase().endsWith(".json")) continue;
    if (!name.toLowerCase().startsWith(prefix)) continue;
    const file = await (entry as FileSystemFileHandle).getFile();
    out.push({ name, lastModified: file.lastModified, handle: entry });
  }
  out.sort((a, b) => b.lastModified - a.lastModified);
  return out;
}

/** Legge il contenuto testuale di un file. */
export async function readTankFile(handle: FileSystemFileHandle): Promise<string> {
  const file = await handle.getFile();
  return file.text();
}
