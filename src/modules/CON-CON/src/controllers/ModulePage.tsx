import ModuleTemplatePage from "@/components/module/ModuleTemplatePage";
import definition from "./config";
import logic from "./core/logic";

/** Pagina principale del modulo (struttura identica in tutti i moduli). */
export default function ModulePage() {
  return <ModuleTemplatePage definition={definition} logic={logic} />;
}
