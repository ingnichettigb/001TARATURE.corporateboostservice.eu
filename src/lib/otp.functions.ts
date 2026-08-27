import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { APP_CODE } from "@/lib/app-config";

const OTP_TTL_MIN = 10; // validità codice, in minuti
const OTP_MAX_PER_WINDOW = 3; // massimo 3 codici
const OTP_WINDOW_HOURS = 24; // per finestra di 24 ore

const emailSchema = z.string().trim().toLowerCase().email().max(254);

function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

async function sendOtpEmail(to: string, code: string) {
  const apiKey = process.env.RESEND_API_KEY;
  const lovableKey = process.env.LOVABLE_API_KEY;
  if (!apiKey || !lovableKey) {
    throw new Error("Email service not configured");
  }
  // Il mittente verificato su Resend per questo connector è configurabile
  // via secret RESEND_FROM_EMAIL (presente in questo progetto Lovable);
  // fallback all'indirizzo storico se il secret non è impostato.
  const fromEmail = process.env.RESEND_FROM_EMAIL || "team@corporateboostservice.eu";
  const res = await fetch("https://connector-gateway.lovable.dev/resend/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${lovableKey}`,
      "X-Connection-Api-Key": apiKey,
    },
    body: JSON.stringify({
      from: `${APP_CODE} <${fromEmail}>`,
      to: [to],
      subject: `Codice di verifica: ${code}`,
      html: `<div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:24px">
        <h2 style="color:#111">Codice di verifica</h2>
        <p>Usa questo codice per completare la verifica della tua email:</p>
        <div style="font-size:32px;font-weight:700;letter-spacing:8px;text-align:center;padding:16px;background:#f4f4f5;border-radius:8px;margin:16px 0">${code}</div>
        <p style="color:#666;font-size:13px">Il codice scade tra ${OTP_TTL_MIN} minuti.</p>
      </div>`,
    }),
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Email send failed (${res.status}): ${txt}`);
  }
}

// NOTA architetturale: a differenza del pattern originale di 002MnFAT (dove
// lead_emails viveva su un progetto Supabase "Cloud" separato per-app), qui
// usiamo la STESSA riga di lead_emails sul DB ESTERNO condiviso
// (ruopxyprezzxoirfrjrm), distinguendo il prodotto tramite la colonna
// `source = APP_CODE`. Evita di dover collegare un progetto Cloud dedicato
// per ognuno degli altri 10-11 prodotti da replicare.
export const requestOtp = createServerFn({ method: "POST" })
  .inputValidator((input: { email: string }) => z.object({ email: emailSchema }).parse(input))
  .handler(async ({ data }) => {
    try {
      const { supabaseExternal } = await import("@/integrations/supabase/client.external");
      const ext = supabaseExternal as unknown as { from: (t: string) => any };
      const email = data.email;

      const { data: latest, error: latestErr } = await ext
        .from("lead_emails")
        .select("id, is_verified, otp_attempts, otp_window_start")
        .ilike("email", email)
        .eq("source", APP_CODE)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (latestErr) throw new Error(`DB select lead_emails failed: ${latestErr.message}`);

      const now = Date.now();
      let attempts = latest?.otp_attempts ?? 0;
      let windowStart = latest?.otp_window_start
        ? new Date(latest.otp_window_start as string).getTime()
        : 0;
      const windowMs = OTP_WINDOW_HOURS * 3600 * 1000;

      if (latest?.is_verified) {
        attempts = 0;
        windowStart = now;
      } else if (!windowStart || now - windowStart > windowMs) {
        attempts = 0;
        windowStart = now;
      }

      if (attempts >= OTP_MAX_PER_WINDOW) {
        return { ok: false as const, reason: "rate_limited" as const, code: "E-011" };
      }

      const code = generateOtp();
      const nextAttempts = attempts + 1;
      const sentAtIso = new Date(now).toISOString();

      if (latest && !latest.is_verified) {
        const { error: updErr } = await ext
          .from("lead_emails")
          .update({
            verification_code: code,
            otp_attempts: nextAttempts,
            otp_window_start: sentAtIso,
          })
          .eq("id", latest.id);
        if (updErr) throw new Error(`DB update lead_emails failed: ${updErr.message}`);
      } else {
        const { error: insErr } = await ext.from("lead_emails").insert({
          email,
          verification_code: code,
          is_verified: false,
          source: APP_CODE,
          otp_attempts: nextAttempts,
          otp_window_start: sentAtIso,
        });
        if (insErr) throw new Error(`DB insert lead_emails failed: ${insErr.message}`);
      }

      try {
        await sendOtpEmail(email, code);
      } catch (err) {
        console.error("sendOtpEmail failed:", err);
        const detail = err instanceof Error ? err.message : String(err);
        return { ok: false as const, reason: "send_failed" as const, code: "E-010", detail };
      }
      return { ok: true as const, sent: true as const };
    } catch (err) {
      // Qualunque errore PRIMA dell'invio email (query DB, permessi,
      // colonne mancanti, rete) finiva prima silenziosamente mascherato
      // da "E-010" lato client. Ora lo distinguiamo esplicitamente.
      console.error("requestOtp error:", err);
      const detail = err instanceof Error ? err.message : String(err);
      return { ok: false as const, reason: "db_error" as const, code: "E-014", detail };
    }
  });

export const verifyOtp = createServerFn({ method: "POST" })
  .inputValidator((input: { email: string; code: string }) =>
    z
      .object({
        email: emailSchema,
        code: z
          .string()
          .trim()
          .regex(/^\d{6}$/),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    try {
      const { supabaseExternal } = await import("@/integrations/supabase/client.external");
      const ext = supabaseExternal as unknown as { from: (t: string) => any };
      const { email, code } = data;

      const { data: row, error } = await ext
        .from("lead_emails")
        .select("id, verification_code, otp_window_start, created_at, is_verified")
        .ilike("email", email)
        .eq("source", APP_CODE)
        .eq("verification_code", code)
        .eq("is_verified", false)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw new Error(error.message);
      if (!row) {
        return { ok: false as const, reason: "invalid" as const, code: "E-012" };
      }

      const sentAt = row.otp_window_start
        ? new Date(row.otp_window_start as string).getTime()
        : new Date(row.created_at as string).getTime();
      const ageMin = (Date.now() - sentAt) / 60000;
      if (ageMin > OTP_TTL_MIN) {
        return { ok: false as const, reason: "invalid" as const, code: "E-012" };
      }

      const { error: updErr } = await ext
        .from("lead_emails")
        .update({
          is_verified: true,
          verified_at: new Date().toISOString(),
          otp_attempts: 0,
        })
        .eq("id", row.id);
      if (updErr) throw new Error(updErr.message);

      // Rilettura di conferma: se non risulta is_verified===true dopo
      // l'update, meglio segnalarlo che dare un falso "ok".
      const { data: confirm, error: confErr } = await ext
        .from("lead_emails")
        .select("id, is_verified")
        .eq("id", row.id)
        .limit(1)
        .maybeSingle();
      if (confErr) throw new Error(confErr.message);
      if (!confirm || confirm.is_verified !== true) {
        return { ok: false as const, reason: "verify_save_failed" as const, code: "E-013" };
      }

      return { ok: true as const };
    } catch (err) {
      console.error("verifyOtp error:", err);
      return { ok: false as const, reason: "verify_save_failed" as const, code: "E-013" };
    }
  });
