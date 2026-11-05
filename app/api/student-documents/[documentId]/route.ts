import { NextRequest, NextResponse } from "next/server";
import { adminDb, adminStorage } from "@/lib/firebase-admin";
import { lmsApiError, requireLmsActor } from "@/lib/lms-api-auth";
import { COLLECTIONS, type StudentDocumentDoc } from "@/lib/schema";

export async function GET(req: NextRequest, ctx: { params: Promise<{ documentId: string }> }) {
  try {
    const actor = await requireLmsActor(req);
    if (!adminDb || !adminStorage) return NextResponse.json({ error: "Document storage unavailable" }, { status: 503 });
    const { documentId } = await ctx.params;
    const ref = adminDb.collection(COLLECTIONS.STUDENT_DOCUMENTS).doc(documentId);
    const snap = await ref.get();
    if (!snap.exists) return NextResponse.json({ error: "Document not found" }, { status: 404 });
    const record = { id: snap.id, ...snap.data() } as StudentDocumentDoc;
    if (record.firebaseUid !== actor.uid && actor.role !== "admin" && actor.role !== "instructor") {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }
    const [bytes] = await adminStorage.bucket().file(record.storagePath).download();
    await adminDb.collection(COLLECTIONS.AUDIT_LOGS).add({
      actorId: actor.uid,
      actorEmail: actor.email,
      action: "student_document.downloaded",
      entityType: "student_document",
      entityId: documentId,
      metadata: { ownerUid: record.firebaseUid, kind: record.kind },
      createdAt: new Date(),
    });
    return new NextResponse(new Uint8Array(bytes), {
      headers: {
        "Content-Type": record.contentType,
        "Content-Disposition": `attachment; filename="${record.fileName.replace(/[\r\n"\\]/g, "_")}"`,
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    return lmsApiError(error);
  }
}
