import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase-admin";
import { COLLECTIONS } from "@/lib/schema";
import { requireUser, canWriteOpportunity } from "@/lib/capture/server-auth";
import { fileCreateSchema } from "@/lib/capture/validation";
import { getCaptureSettings } from "@/lib/capture/settings";
import { captureAudit } from "@/lib/capture/audit";

type Params = { params: Promise<{ id: string }> };

/**
 * POST — register file metadata after a client-side Firebase Storage upload
 * to `capture/{opportunityId}/{fileName}`. Tag enforced against settings list.
 */
export async function POST(req: NextRequest, { params }: Params) {
  const user = await requireUser(req);
  if (user instanceof NextResponse) return user;
  if (!adminDb) return NextResponse.json({ error: "Database unavailable" }, { status: 500 });

  const { id } = await params;
  const ref = adminDb.collection(COLLECTIONS.CAPTURE_OPPORTUNITIES).doc(id);
  const snap = await ref.get();
  if (!snap.exists) return NextResponse.json({ error: "Opportunity not found" }, { status: 404 });
  if (!canWriteOpportunity(user, snap.data()?.ownerId)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const parsed = fileCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || "Invalid request" }, { status: 400 });
  }

  const settings = await getCaptureSettings();
  if (!settings.fileTags.includes(parsed.data.tag)) {
    return NextResponse.json(
      { error: `Invalid file tag "${parsed.data.tag}". Allowed: ${settings.fileTags.join(", ")}` },
      { status: 400 }
    );
  }

  const file = {
    id: crypto.randomUUID(),
    ...parsed.data,
    uploadedBy: user.uid,
    uploadedAt: new Date().toISOString(),
  };
  await ref.update({
    files: FieldValue.arrayUnion(file),
    updatedAt: FieldValue.serverTimestamp(),
  });

  await captureAudit({
    type: "create",
    entityType: "capture-opportunity",
    entityId: id,
    entityName: (snap.data()?.title as string) || "",
    description: `Uploaded file ${parsed.data.name} (${parsed.data.tag})`,
    userId: user.uid,
  });

  return NextResponse.json({ file }, { status: 201 });
}
