import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { Timestamp } from "firebase-admin/firestore";
import { z } from "zod";
import { adminDb } from "@/lib/firebase-admin";
import { lmsApiError, requireLmsActor } from "@/lib/lms-api-auth";
import { COLLECTIONS } from "@/lib/schema";

const bodySchema = z.object({
  certificateId: z.string().min(1).max(160),
  enabled: z.boolean(),
  publicNameConsent: z.boolean(),
});
const PUBLIC_CONSENT_VERSION = "efvs-credential-share-v1";

export async function POST(req: NextRequest) {
  try {
    const actor = await requireLmsActor(req);
    if (!adminDb) return NextResponse.json({ error: "Credential service unavailable" }, { status: 503 });
    const parsed = bodySchema.safeParse(await req.json());
    if (!parsed.success) return NextResponse.json({ error: "Invalid credential sharing request" }, { status: 400 });
    const { certificateId, enabled, publicNameConsent } = parsed.data;
    if (enabled && !publicNameConsent) return NextResponse.json({ error: "Public credential sharing requires your consent to display your name" }, { status: 400 });
    const ref = adminDb.collection(COLLECTIONS.CERTIFICATES).doc(certificateId);
    const snap = await ref.get();
    if (!snap.exists) return NextResponse.json({ error: "Credential not found" }, { status: 404 });
    const cert = snap.data() as { firebaseUid?: string; publicCredentialId?: string; revokedAt?: unknown };
    if (cert.firebaseUid !== actor.uid && actor.role !== "admin") return NextResponse.json({ error: "Access denied" }, { status: 403 });
    if (cert.revokedAt && enabled) return NextResponse.json({ error: "A revoked credential cannot be shared" }, { status: 409 });
    if (enabled && cert.firebaseUid !== actor.uid) return NextResponse.json({ error: "Only the learner can consent to public credential sharing" }, { status: 403 });
    const publicCredentialId = cert.publicCredentialId || randomUUID().replaceAll("-", "");
    const now = Timestamp.now();
    await ref.update({
      publicCredentialId,
      publicSharingEnabled: enabled,
      publicNameConsent: enabled && publicNameConsent,
      publicConsentAt: enabled ? now : snap.get("publicConsentAt") || null,
      publicConsentVersion: enabled ? PUBLIC_CONSENT_VERSION : snap.get("publicConsentVersion") || null,
      publicSharingDisabledAt: enabled ? null : now,
    });
    await adminDb.collection(COLLECTIONS.AUDIT_LOGS).add({
      actorId: actor.uid,
      actorEmail: actor.email,
      action: enabled ? "credential.sharing_enabled" : "credential.sharing_disabled",
      entityType: "certificate",
      entityId: certificateId,
      metadata: { publicNameConsent: enabled && publicNameConsent, consentVersion: enabled ? PUBLIC_CONSENT_VERSION : null },
      createdAt: now,
    });
    return NextResponse.json({ data: { enabled, publicCredentialId } });
  } catch (error) {
    return lmsApiError(error);
  }
}
