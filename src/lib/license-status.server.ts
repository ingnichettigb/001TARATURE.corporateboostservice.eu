// Server-only helper: verifica lo stato di una licenza sul DB esterno.
export type LicenseStatusReason = "expired" | "deactivated" | "not_found";

export type LicenseStatus = {
  valid: boolean;
  reason: LicenseStatusReason | null;
};

export async function runLicenseStatus(licenseId: string): Promise<LicenseStatus> {
  try {
    const { supabaseExternal } = await import("@/integrations/supabase/client.external");

    const { data: license, error } = await supabaseExternal
      .from("licenses")
      .select("id, is_active, expires_at")
      .eq("id", licenseId)
      .limit(1)
      .maybeSingle();

    // Fail-open su errore di query/rete
    if (error) {
      console.error("runLicenseStatus query error:", error.message);
      return { valid: true, reason: null };
    }

    if (!license) return { valid: false, reason: "not_found" };
    if (license.is_active === false) {
      return { valid: false, reason: "deactivated" };
    }
    if (license.expires_at && new Date(license.expires_at as string).getTime() <= Date.now()) {
      return { valid: false, reason: "expired" };
    }

    return { valid: true, reason: null };
  } catch (err) {
    // Fail-open: nessun blocco per problemi tecnici transitori
    console.error("runLicenseStatus error:", err);
    return { valid: true, reason: null };
  }
}
