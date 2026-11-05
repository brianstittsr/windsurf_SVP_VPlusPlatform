import { NextRequest, NextResponse } from "next/server";
import { adminDb, adminStorage } from "@/lib/firebase-admin";
import { lmsApiError, requireLmsAdmin } from "@/lib/lms-api-auth";
import { COLLECTIONS, type RegistrationSubmissionDoc } from "@/lib/schema";

export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ submissionId: string; fieldId: string }> }
) {
  try {
    await requireLmsAdmin(req);
    if (!adminDb || !adminStorage) return NextResponse.json({ error: "Document service unavailable" }, { status: 503 });
    const { submissionId, fieldId } = await ctx.params;
    const snap = await adminDb.collection(COLLECTIONS.REGISTRATION_SUBMISSIONS).doc(submissionId).get();
    if (!snap.exists) return NextResponse.json({ error: "Registration not found" }, { status: 404 });
    const submission = snap.data() as RegistrationSubmissionDoc;
    const attachment = submission.attachments?.find((item) => item.fieldId === fieldId);
    const signature = submission.signatures.find((item) => item.fieldId === fieldId);
    const storagePath = attachment?.storagePath || signature?.imageStoragePath;
    const name = attachment?.fileName || `${fieldId}-signature.png`;
    const contentType = attachment?.contentType || "image/png";
    if (!storagePath) return NextResponse.json({ error: "Document not found" }, { status: 404 });
    const [buffer] = await adminStorage.bucket().file(storagePath).download();
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `inline; filename="${name.replace(/[\r\n"\\]/g, "_")}"`,
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    return lmsApiError(error);
  }
}
