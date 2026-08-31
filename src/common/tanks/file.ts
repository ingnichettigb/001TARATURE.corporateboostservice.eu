import { TANK_FILE_VERSION } from "./types";
import type { ParsedTankFile, TankFileV1 } from "./types";
import { moduleEntries } from "@/modules/registry";

/** Costruisce l'oggetto JSON esportato con i metadati di tipologia. */
export function buildTankFile<T, C>(
  tankType: string,
  name: string,
  input: T,
  compilerInfo?: C,
): TankFileV1<T, C> {
  return {
    version: TANK_FILE_VERSION,
    tankType,
    name,
    savedAt: new Date().toISOString(),
    input: JSON.parse(JSON.stringify(input)),
    compilerInfo: compilerInfo
      ? JSON.parse(JSON.stringify(compilerInfo))
      : undefined,
  };
}

export function safeFileName(name: string): string {
  return name.replace(/[/\\?%*:|"<>. ]/g, "_");
}

/** Nome file JSON con prefisso della tipologia serbatoio (idempotente). */
export function buildTankFileName(tankType: string, name: string): string {
  const safe = safeFileName(name);
  const prefix = `${tankType}_`;
  return safe.startsWith(prefix) ? safe : `${prefix}${safe}`;
}

/** Scarica il file JSON con il nome indicato. */
export function downloadTankFile(fileName: string, data: unknown) {
  const dataStr =
    "data:text/json;charset=utf-8," +
    encodeURIComponent(JSON.stringify(data, null, 2));
  const a = document.createElement("a");
  a.setAttribute("href", dataStr);
  a.setAttribute("download", `${fileName}.json`);
  document.body.appendChild(a);
  a.click();
  a.remove();
}

/** Rotta del modulo corrispondente a un tankType, se registrata. */
export function moduleIdForTankType(tankType: string): string | undefined {
  const id = tankType.trim().toLowerCase();
  return moduleEntries.find((e) => e.id === id)?.id;
}

export function moduleTitleForTankType(tankType: string): string | undefined {
  const id = tankType.trim().toLowerCase();
  return moduleEntries.find((e) => e.id === id)?.definition.title;
}

/**
 * Analizza un file importato.
 * Riconosce il formato v1, il formato legacy `{ name, input }` e l'input grezzo.
 */
export function parseTankFile<T = unknown, C = unknown>(
  raw: string,
  currentTankType: string,
): ParsedTankFile<T, C> {
  let parsed: any;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return { status: "invalid", name: "", message: "JSON non valido" };
  }

  if (!parsed || typeof parsed !== "object") {
    return { status: "invalid", name: "", message: "JSON non valido" };
  }

  // Formato v1 (con tankType)
  if (typeof parsed.tankType === "string" && parsed.input) {
    const name = typeof parsed.name === "string" ? parsed.name : "Serbatoio Importato";
    if (parsed.tankType.trim().toUpperCase() !== currentTankType.toUpperCase()) {
      return {
        status: "mismatch",
        tankType: parsed.tankType,
        name,
        input: parsed.input,
        compilerInfo: parsed.compilerInfo,
      };
    }
    return {
      status: "ok",
      tankType: parsed.tankType,
      name,
      input: parsed.input,
      compilerInfo: parsed.compilerInfo,
    };
  }

  // Legacy: { name, input, compilerInfo? }
  if (parsed.input && parsed.name) {
    return {
      status: "legacy",
      name: parsed.name,
      input: parsed.input,
      compilerInfo: parsed.compilerInfo,
      message: "File senza tipologia serbatoio: caricato nel modulo corrente.",
    };
  }

  // Legacy: input grezzo
  if (parsed.dInt && parsed.lCil && parsed.fondo) {
    return {
      status: "legacy",
      name: parsed.report?.nomeSerbatoio || "Serbatoio Importato",
      input: parsed,
      message: "File senza tipologia serbatoio: caricato nel modulo corrente.",
    };
  }

  return {
    status: "invalid",
    name: "",
    message:
      "Formato file non valido. Deve contenere una configurazione serbatoio valida.",
  };
}
