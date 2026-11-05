import { createHmac, randomBytes } from "crypto";
import { Timestamp } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase-admin";
import { LmsApiError } from "@/lib/lms-api-auth";

function secret(): string {
  const value = process.env.REGISTRATION_INVITE_SECRET;
  if (!value || value.length < 32) {
    throw new LmsApiError(503, "Registration security is not configured");
  }
  return value;
}

export function createRegistrationInviteToken(): { token: string; tokenHash: string } {
  const token = randomBytes(32).toString("base64url");
  return { token, tokenHash: hashRegistrationToken(token) };
}

export function hashRegistrationToken(token: string): string {
  return createHmac("sha256", secret()).update(token).digest("hex");
}

export function hashRegistrationIp(ip: string): string {
  return createHmac("sha256", secret()).update(`registration-ip:${ip}`).digest("hex");
}

/** Distributed per-IP/hour limit. Only a keyed digest of the client IP is stored. */
export async function enforceRegistrationRateLimit(ip: string): Promise<void> {
  if (!adminDb) throw new LmsApiError(503, "Registration is unavailable");
  const now = Date.now();
  const windowMs = 60 * 60 * 1000;
  const key = hashRegistrationIp(ip || "unknown");
  const ref = adminDb.collection("registrationRateLimits").doc(key);
  await adminDb.runTransaction(async (transaction) => {
    const snap = await transaction.get(ref);
    const data = snap.data();
    const startedAt = data?.windowStartedAt?.toMillis?.() as number | undefined;
    const count = startedAt && now - startedAt < windowMs ? Number(data?.count || 0) : 0;
    if (count >= 5) throw new LmsApiError(429, "Too many registration attempts. Try again later.");
    transaction.set(ref, {
      count: count + 1,
      windowStartedAt: startedAt && now - startedAt < windowMs ? data?.windowStartedAt : Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
  });
}
