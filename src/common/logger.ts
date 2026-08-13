/** Logger condiviso: unico punto di stampa diagnostica dell'app. */
type Level = "info" | "warn" | "error";

function emit(level: Level, scope: string, message: string, data?: unknown) {
  const prefix = `[${scope}]`;
  if (level === "error") console.error(prefix, message, data ?? "");
  else if (level === "warn") console.warn(prefix, message, data ?? "");
  else console.info(prefix, message, data ?? "");
}

export const logger = {
  info: (scope: string, message: string, data?: unknown) => emit("info", scope, message, data),
  warn: (scope: string, message: string, data?: unknown) => emit("warn", scope, message, data),
  error: (scope: string, message: string, data?: unknown) => emit("error", scope, message, data),
};

export default logger;
