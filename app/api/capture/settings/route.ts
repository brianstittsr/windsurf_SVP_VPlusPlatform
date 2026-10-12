import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase-admin";
import { COLLECTIONS } from "@/lib/schema";
import { requireUser, requireAdmin } from "@/lib/capture/server-auth";
import { settingsPatchSchema } from "@/lib/capture/validation";
import { getCaptureSettings, CAPTURE_SETTINGS_DOC_ID } from "@/lib/capture/settings";
import { serializeDoc } from "@/lib/capture/serialize";
import { captureAudit } from "@/lib/capture/audit";

export async function GET(req: NextRequest) {
  const user = await requireUser(req);
  if (user instanceof NextResponse) return user;
  const settings = await getCaptureSettings();
  return NextResponse.json({ settings: serializeDoc(settings) });
}

export async function PATCH(req: NextRequest) {
  const user = await requireAdmin(req);
  if (user instanceof NextResponse) return user;
  if (!adminDb) return NextResponse.json({ error: "Database unavailable" }, { status: 500 });

  const body = await req.json().catch(() => null);
  const parsed = settingsPatchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || "Invalid request" }, { status: 400 });
  }

  const ref = adminDb.collection(COLLECTIONS.CAPTURE_SETTINGS).doc(CAPTURE_SETTINGS_DOC_ID);
  await ref.set({ ...parsed.data, updatedAt: FieldValue.serverTimestamp() }, { merge: true });

  await captureAudit({
    type: "update",
    entityType: "settings",
    entityId: CAPTURE_SETTINGS_DOC_ID,
    entityName: "Capture Settings",
    description: "Updated capture management settings",
    userId: user.uid,
    metadata: { fields: Object.keys(parsed.data) },
  });

  const settings = await getCaptureSettings();
  return NextResponse.json({ settings: serializeDoc(settings) });
}
