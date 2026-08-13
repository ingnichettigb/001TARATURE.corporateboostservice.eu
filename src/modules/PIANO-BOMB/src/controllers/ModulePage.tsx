import ModuleTemplatePage from "@/common/ui/ModuleTemplatePage";
import type {{ ModuleDefinition }} from "@/common/module-types";
import definition from "../../assets/data/module.json";
import logic from "../services/logic";

/** Controller principale del modulo (struttura identica in tutti i moduli). */
export default function ModulePage() {{
  return <ModuleTemplatePage definition={{definition as ModuleDefinition}} logic={{logic}} />;
}}
