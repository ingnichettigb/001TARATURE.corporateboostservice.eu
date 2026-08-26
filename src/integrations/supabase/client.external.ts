// Client Supabase verso il progetto ESTERNO condiviso (ruopxyprezzxoirfrjrm),
// dove vivono licenses / puk_codes / license_puk_map / users. NON è il
// progetto Cloud di questa singola app Lovable (che qui non esiste).
// Legge EXTERNAL_SUPABASE_URL / EXTERNAL_SUPABASE_SERVICE_ROLE_KEY: queste
// variabili vanno impostate nell'ambiente di deploy (Lovable Cloud env vars
// o secrets del Worker Cloudflare), con lo stesso prefisso EXTERNAL_ usato
// dagli altri prodotti del portfolio.
// SECURITY: service-role key, server-only. Non importare da codice client.
// Caricare dentro gli handler: const { supabaseExternal } = await import("@/integrations/supabase/client.external");
import { createClient } from "@supabase/supabase-js";

function createSupabaseExternalClient() {
  const URL = process.env.EXTERNAL_SUPABASE_URL;
  const KEY = process.env.EXTERNAL_SUPABASE_SERVICE_ROLE_KEY;

  if (!URL || !KEY) {
    const missing = [
      ...(!URL ? ["EXTERNAL_SUPABASE_URL"] : []),
      ...(!KEY ? ["EXTERNAL_SUPABASE_SERVICE_ROLE_KEY"] : []),
    ];
    const message = `Missing external Supabase environment variable(s): ${missing.join(", ")}.`;
    console.error(`[SupabaseExternal] ${message}`);
    throw new Error(message);
  }

  return createClient(URL, KEY, {
    auth: {
      storage: undefined,
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

let _supabaseExternal: ReturnType<typeof createSupabaseExternalClient> | undefined;

export const supabaseExternal = new Proxy(
  {} as ReturnType<typeof createSupabaseExternalClient>,
  {
    get(_, prop, receiver) {
      if (!_supabaseExternal) _supabaseExternal = createSupabaseExternalClient();
      return Reflect.get(_supabaseExternal, prop, receiver);
    },
  },
);
