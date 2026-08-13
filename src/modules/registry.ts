import runBombCon from "./BOMB-CON";
import runBombBomb from "./BOMB-BOMB";
import runConBomb from "./CON-BOMB";
import runConCon from "./CON-CON";
import runPianoBomb from "./PIANO-BOMB";
import runPianoCon from "./PIANO-CON";
import type { ModuleEntry } from "@/common/module-types";

/**
 * Registro delle carte: unica riga di collegamento tra il core e i moduli.
 * Aggiungere/togliere una carta = aggiungere/togliere una riga qui
 * (più la sua cartella). Nessuna logica di modulo in questo file.
 */
const runners = [runBombCon, runBombBomb, runConBomb, runConCon, runPianoBomb, runPianoCon];

export const moduleEntries: ModuleEntry[] = runners.map((run) => run());

export const moduleDefinitions = moduleEntries.map((entry) => entry.definition);

export function getModuleEntry(id: string): ModuleEntry | undefined {
  return moduleEntries.find((entry) => entry.id === id);
}

export default moduleEntries;
