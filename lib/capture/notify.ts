import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase-admin";
import { COLLECTIONS } from "@/lib/schema";
import { sendEmail } from "@/lib/email";

/** Resolve a team member's email by their member doc ID or firebase UID. */
export async function memberEmail(id?: string | null): Promise<string | null> {
  if (!id || !adminDb) return null;
  const direct = await adminDb.collection(COLLECTIONS.TEAM_MEMBERS).doc(id).get();
  if (direct.exists) return (direct.data()?.emailPrimary as string) || null;
  const snap = await adminDb
    .collection(COLLECTIONS.TEAM_MEMBERS)
    .where("firebaseUid", "==", id)
    .limit(1)
    .get();
  if (!snap.empty) return (snap.docs[0].data().emailPrimary as string) || null;
  return null;
}

/**
 * Write an alert-log entry + activity is handled by callers; sends an email
 * when a recipient is resolved. Fire-and-forget safe — callers should .catch.
 */
export async function captureAlert(opts: {
  type: string;
  entityType: "capture-opportunity" | "capture-task" | "capture-client";
  entityId: string;
  entityName: string;
  recipientId?: string | null;
  message: string;
  subject?: string;
}): Promise<void> {
  if (!adminDb) return;
  const email = await memberEmail(opts.recipientId);
  await adminDb.collection(COLLECTIONS.CAPTURE_ALERT_LOG).add({
    type: opts.type,
    entityType: opts.entityType,
    entityId: opts.entityId,
    entityName: opts.entityName,
    recipientId: opts.recipientId || null,
    recipientEmail: email,
    message: opts.message,
    sentAt: FieldValue.serverTimestamp(),
  });
  if (!email) return;
  await sendEmail({
    to: [email],
    subject: opts.subject || `Capture: ${opts.entityName}`,
    html: `<p>${opts.message}</p><p><a href="${process.env.NEXT_PUBLIC_APP_URL || ""}/portal/capture">Open Capture Management</a></p>`,
    text: opts.message,
  });
}
