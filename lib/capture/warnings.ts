import type { CaptureOpportunityDoc, CustomerDoc } from "@/lib/schema";

/** Set-aside → certification hint used for rule 7 mismatch warnings. */
const SET_ASIDE_CERT_MAP: Record<string, string> = {
  "8(a)": "8(a)",
  hubzone: "HUBZone",
  sdvosb: "SDVOSB",
  vosb: "VOSB",
  wosb: "WOSB",
  edwosb: "EDWOSB",
};

const DAY_MS = 86_400_000;

/**
 * Computed (not stored) warnings for an opportunity, per rules 7–8:
 * set-aside/certification mismatches and upcoming SAM/cert expirations.
 */
export function computeWarnings(
  opp: Pick<CaptureOpportunityDoc, "setAside">,
  client: CustomerDoc | null | undefined,
  expiryWarningDays = 90
): string[] {
  const warnings: string[] = [];

  // Rule 7: set-aside may require a matching certification on the client
  if (opp.setAside) {
    const required = SET_ASIDE_CERT_MAP[opp.setAside.toLowerCase()];
    if (required) {
      const certs = client?.govcon?.certifications || [];
      const has = certs.some((c) => c.name.toLowerCase().includes(required.toLowerCase()));
      if (!has) {
        warnings.push(
          `Set-aside "${opp.setAside}" may require ${required} certification — not found on client profile`
        );
      }
    }
  }

  // Rule 8: SAM registration / certifications expiring within the warning window
  const cutoff = Date.now() + expiryWarningDays * DAY_MS;
  const samExpiry = client?.govcon?.samRegistrationExpiry;
  if (samExpiry && new Date(samExpiry).getTime() < cutoff) {
    warnings.push(`SAM registration expires ${samExpiry} (within ${expiryWarningDays} days)`);
  }
  for (const cert of client?.govcon?.certifications || []) {
    if (cert.expiresAt && new Date(cert.expiresAt).getTime() < cutoff) {
      warnings.push(`Certification "${cert.name}" expires ${cert.expiresAt}`);
    }
  }

  return warnings;
}
