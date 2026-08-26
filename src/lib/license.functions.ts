import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { APP_CODE } from "@/lib/app-config";
import type { LicenseStatus } from "@/lib/license-status.server";

const emailSchema = z.string().trim().toLowerCase().email().max(254);
const keySchema = z.string().trim().min(1).max(128);

export const checkLicenseStatus = createServerFn({ method: "POST" })
  .inputValidator((input: { licenseId: string }) =>
    z.object({ licenseId: z.string().uuid() }).parse(input),
  )
  .handler(async ({ data }): Promise<LicenseStatus> => {
    try {
      const { runLicenseStatus } = await import("@/lib/license-status.server");
      return await runLicenseStatus(data.licenseId);
    } catch (err) {
      console.error("checkLicenseStatus error:", err);
      return { valid: true, reason: null };
    }
  });

type FailReason =
  | "license_not_found"
  | "license_expired"
  | "puk_not_found"
  | "puk_wrong_product"
  | "puk_not_in_license"
  | "puk_claimed_by_other"
  | "server_error";

type ActivateResult =
  | { ok: true; reactivated: boolean; licenseId: string; pukId: string; userId: string }
  | { ok: false; reason: FailReason; code: string };

// NOTA: a differenza del pattern MiniFAT, qui NON c'è uno step preliminare
// di "email verificata su Cloud" (questo prodotto non ha ancora un proprio
// progetto Supabase Cloud/Lovable con lead_emails). L'email serve solo per
// identificare/creare l'utente sul DB esterno condiviso e gestire il claim
// del PUK — stessa logica, un passaggio in meno.
export const verifyAndActivateLicense = createServerFn({ method: "POST" })
  .inputValidator((input: { email: string; licenseKey: string; puk: string }) =>
    z
      .object({
        email: emailSchema,
        licenseKey: keySchema,
        puk: keySchema,
      })
      .parse(input),
  )
  .handler(async ({ data }): Promise<ActivateResult> => {
    try {
      const { supabaseExternal } = await import("@/integrations/supabase/client.external");
      // Il DB esterno ha colonne non presenti in eventuali tipi generati
      // (users, license_puk_map, puk_codes.user_id/type_product_code).
      const ext = supabaseExternal as unknown as { from: (t: string) => any };
      const { email, licenseKey, puk } = data;

      // 1) trova la licenza per chiave + app_code
      const { data: license, error: lErr } = await ext
        .from("licenses")
        .select("id, is_active, expires_at, activated_at, subscription_type")
        .eq("license_key", licenseKey)
        .eq("app_code", APP_CODE)
        .eq("is_active", true)
        .limit(1)
        .maybeSingle();
      if (lErr) throw new Error(lErr.message);
      if (!license) {
        return { ok: false, reason: "license_not_found", code: "E-101" };
      }
      if (license.expires_at && new Date(license.expires_at as string).getTime() <= Date.now()) {
        return { ok: false, reason: "license_expired", code: "E-103" };
      }

      // 2) trova il PUK per codice
      const { data: pukRow, error: pErr } = await ext
        .from("puk_codes")
        .select("id, used, user_id, type_product_code, license_id")
        .eq("code", puk)
        .limit(1)
        .maybeSingle();
      if (pErr) throw new Error(pErr.message);
      if (!pukRow) {
        return { ok: false, reason: "puk_not_found", code: "E-201" };
      }
      if (pukRow.type_product_code && pukRow.type_product_code !== APP_CODE) {
        return { ok: false, reason: "puk_wrong_product", code: "E-203" };
      }

      // 3) verifica che il PUK appartenga a questa licenza (via license_puk_map,
      //    con fallback sul link diretto legacy puk_codes.license_id)
      const { data: mapRow, error: mErr } = await ext
        .from("license_puk_map")
        .select("id")
        .eq("license_id", license.id)
        .eq("puk_id", pukRow.id)
        .limit(1)
        .maybeSingle();
      if (mErr) throw new Error(mErr.message);
      const linkedByMap = !!mapRow;
      const linkedByFk = pukRow.license_id === license.id;
      if (!linkedByMap && !linkedByFk) {
        return { ok: false, reason: "puk_not_in_license", code: "E-204" };
      }

      // 4) risolvi/crea l'utente sul DB esterno (per email)
      const { data: existingUser, error: uErr } = await ext
        .from("users")
        .select("id, email")
        .ilike("email", email)
        .limit(1)
        .maybeSingle();
      if (uErr) throw new Error(uErr.message);

      let userId: string;
      if (existingUser) {
        userId = existingUser.id as string;
      } else {
        const { data: insUser, error: insErr } = await ext
          .from("users")
          .insert({ email })
          .select("id")
          .single();
        if (insErr) throw new Error(insErr.message);
        userId = insUser.id as string;
      }

      // 5) logica di claim del PUK
      if (pukRow.user_id && pukRow.user_id !== userId) {
        return { ok: false, reason: "puk_claimed_by_other", code: "E-202" };
      }

      let reactivated = false;
      if (pukRow.user_id === userId) {
        reactivated = true;
      } else {
        const { data: claimed, error: claimErr } = await ext
          .from("puk_codes")
          .update({ user_id: userId, used: true, used_at: new Date().toISOString() })
          .eq("id", pukRow.id)
          .is("user_id", null)
          .select("id")
          .maybeSingle();
        if (claimErr) throw new Error(claimErr.message);
        if (!claimed) {
          // race: qualcun altro lo ha reclamato nel frattempo
          return { ok: false, reason: "puk_claimed_by_other", code: "E-202" };
        }
      }

      // 6) segna activated_at se ancora nullo (primo claim su questa licenza).
      //    Per licenze single_use, le 48h di validità partono da QUESTO istante.
      if (!license.activated_at) {
        const nowIso = new Date().toISOString();
        const updatePayload: Record<string, string> = { activated_at: nowIso };
        if (license.subscription_type === "single_use") {
          const singleUseExpiry = new Date(Date.now() + 48 * 60 * 60 * 1000);
          updatePayload.expires_at = singleUseExpiry.toISOString();
        }
        const { error: actErr } = await ext
          .from("licenses")
          .update(updatePayload)
          .eq("id", license.id)
          .is("activated_at", null);
        if (actErr) throw new Error(actErr.message);
      }

      return {
        ok: true,
        reactivated,
        licenseId: license.id as string,
        pukId: pukRow.id as string,
        userId,
      };
    } catch (err) {
      console.error("verifyAndActivateLicense error:", err);
      return { ok: false, reason: "server_error", code: "E-500" };
    }
  });

// Da chiamare al mount della pagina modulo: dice quanti export PDF restano
// (per mostrare il badge / il banner "ultima generazione disponibile").
// remaining === null significa illimitato.
export const getPdfExportsStatus = createServerFn({ method: "POST" })
  .inputValidator((input: { licenseId: string }) =>
    z.object({ licenseId: z.string().uuid() }).parse(input),
  )
  .handler(async ({ data }): Promise<{ remaining: number | null }> => {
    try {
      const { supabaseExternal } = await import("@/integrations/supabase/client.external");
      const ext = supabaseExternal as unknown as { from: (t: string) => any };

      const { data: license, error: lErr } = await ext
        .from("licenses")
        .select("pdf_exports_remaining")
        .eq("id", data.licenseId)
        .limit(1)
        .maybeSingle();
      if (lErr) throw new Error(lErr.message);

      return { remaining: license?.pdf_exports_remaining ?? null };
    } catch (err) {
      console.error("getPdfExportsStatus error:", err);
      // fail-open: in caso di errore tecnico non mostriamo il banner
      return { remaining: null };
    }
  });

// Da chiamare subito dopo la generazione del PDF finale. Scala atomicamente
// pdf_exports_remaining di 1 (solo se > 0). Se il contatore arriva a 0,
// disattiva la licenza nello stesso UPDATE: al prossimo controllo di
// runLicenseStatus (già eseguito ad ogni navigazione tramite AuthGate)
// l'accesso viene bloccato senza toccare altro codice.
export const decrementPdfExports = createServerFn({ method: "POST" })
  .inputValidator((input: { licenseId: string }) =>
    z.object({ licenseId: z.string().uuid() }).parse(input),
  )
  .handler(async ({ data }): Promise<{ remaining: number | null; exhausted: boolean }> => {
    try {
      const { supabaseExternal } = await import("@/integrations/supabase/client.external");
      const ext = supabaseExternal as unknown as { from: (t: string) => any };

      const { data: license, error: lErr } = await ext
        .from("licenses")
        .select("id, pdf_exports_remaining, is_active")
        .eq("id", data.licenseId)
        .limit(1)
        .maybeSingle();
      if (lErr) throw new Error(lErr.message);
      if (!license) {
        return { remaining: null, exhausted: false };
      }

      // illimitato: nessuna azione
      if (license.pdf_exports_remaining === null) {
        return { remaining: null, exhausted: false };
      }

      // già esaurito in precedenza (es. doppio click, retry di rete): no-op idempotente
      if (license.pdf_exports_remaining <= 0) {
        return { remaining: 0, exhausted: true };
      }

      const newRemaining = license.pdf_exports_remaining - 1;
      const updatePayload: Record<string, unknown> = { pdf_exports_remaining: newRemaining };
      if (newRemaining <= 0) {
        updatePayload.is_active = false;
      }

      const { error: updErr } = await ext
        .from("licenses")
        .update(updatePayload)
        .eq("id", data.licenseId)
        .eq("pdf_exports_remaining", license.pdf_exports_remaining); // guardia ottimistica anti-race
      if (updErr) throw new Error(updErr.message);

      return { remaining: newRemaining, exhausted: newRemaining <= 0 };
    } catch (err) {
      console.error("decrementPdfExports error:", err);
      // fail-open: non blocchiamo la consegna del PDF già avvenuta per un
      // problema tecnico sul decremento.
      return { remaining: null, exhausted: false };
    }
  });
