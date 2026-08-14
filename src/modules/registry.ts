import runBombCon from "./BOMB-CON";
import runBombBomb from "./BOMB-BOMB";
import runConBomb from "./CON-BOMB";
import runConCon from "./CON-CON";
import runPianoBomb from "./PIANO-BOMB";
import runPianoCon from "./PIANO-CON";
import runBombIncl from "./BOMB-INCL";
import runBombTroncocon from "./BOMB-TRONCOCON";
import runConIncl from "./CON-INCL";
import runPianoIncl from "./PIANO-INCL";
import runConTroncocon from "./CON-TRONCOCON";
import runPianoTroncocon from "./PIANO-TRONCOCON";
import runOrizzCon from "./ORIZZ-CON";
import runOrizzBomb from "./ORIZZ-BOMB";
import runBombPiano from "./BOMB-PIANO";
import runConPiano from "./CON-PIANO";
import runBombConBocc from "./BOMB-CON-BOCC";
import runConConBocc from "./CON-CON-BOCC";
import runPianoConBocc from "./PIANO-CON-BOCC";
import type { ModuleEntry } from "@/common/module-types";

/**
 * Registro delle carte: unica riga di collegamento tra il core e i moduli.
 * Aggiungere/togliere una carta = aggiungere/togliere una riga qui
 * (più la sua cartella). Nessuna logica di modulo in questo file.
 */
const runners = [
  runBombCon,
  runBombBomb,
  runConBomb,
  runConCon,
  runPianoBomb,
  runPianoCon,
  runBombIncl,
  runBombTroncocon,
  runConIncl,
  runPianoIncl,
  runConTroncocon,
  runPianoTroncocon,
  runOrizzCon,
  runOrizzBomb,
  runBombPiano,
  runConPiano,
  runBombConBocc,
  runConConBocc,
  runPianoConBocc,
];

export const moduleEntries: ModuleEntry[] = runners.map((run) => run());

export const moduleDefinitions = moduleEntries.map((entry) => entry.definition);

export function getModuleEntry(id: string): ModuleEntry | undefined {
  return moduleEntries.find((entry) => entry.id === id);
}

export default moduleEntries;
