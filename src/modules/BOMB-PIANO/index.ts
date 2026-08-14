import { lazy } from "react";
import type { ModuleDefinition, ModuleEntry } from "@/common/module-types";
import definition from "./assets/data/module.json";

/**
 * Punto di ingresso autonomo del modulo BOMB-PIANO.
 * Il router centrale conosce solo questa funzione: nessuna logica di carta
 * vive fuori da questa cartella.
 */
export function runBombPiano(): ModuleEntry {
  return {
    id: (definition as ModuleDefinition).id,
    definition: definition as ModuleDefinition,
    Page: lazy(() => import("./src/controllers/ModulePage")),
  };
}

export default runBombPiano;
