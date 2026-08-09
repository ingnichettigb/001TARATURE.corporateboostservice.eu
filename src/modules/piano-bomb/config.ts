import modules from "@/config/modules.json";
import type { ModuleDefinition } from "@/lib/module-types";

const MODULE_ID = "piano-bomb";

export const definition: ModuleDefinition = (modules as ModuleDefinition[]).find(
  (m) => m.id === MODULE_ID,
)!;

export default definition;
