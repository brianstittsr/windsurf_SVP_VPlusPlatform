import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { adminDb } from "@/lib/firebase-admin";
import { tryIssueCertificate } from "@/lib/lms-certificates";
import { lmsApiError, requireLmsActor } from "@/lib/lms-api-auth";
import { COLLECTIONS, type EnrollmentDoc } from "@/lib/schema";

const requestSchema = z.object({ enrollmentId: z.string().min(1).max(160) });

export async function POST(req: NextRequest) {
  try {
    const actor = await requireLmsActor(req);
    if (!adminDb) return NextResponse.json({ error: "Certificate service unavailable" }, { status: 503 });
    const parsed = requestSchema.safeParse(await req.json());
    if (!parsed.success) return NextResponse.json({ error: "enrollmentId is required" }, { status: 400 });
    const enrollmentSnap = await adminDb.collection(COLLECTIONS.ENROLLMENTS).doc(parsed.data.enrollmentId).get();
    if (!enrollmentSnap.exists) return NextResponse.json({ error: "Enrollment not found" }, { status: 404 });
    const enrollment = { id: enrollmentSnap.id, ...enrollmentSnap.data() } as EnrollmentDoc;
    if (enrollment.firebaseUid !== actor.uid && actor.role === "student") return NextResponse.json({ error: "Access denied" }, { status: 403 });

    const result = await tryIssueCertificate(enrollment.id, actor.uid, actor.email);
    switch (result.status) {
      case "issued":
      case "existing":
        return NextResponse.json({ data: { certificateId: result.certificateId, certificateNumber: result.certificateNumber, publicCredentialId: result.publicCredentialId } }, { status: result.status === "issued" ? 201 : 200 });
      case "incomplete":
        return NextResponse.json({ error: "Course modules and required assessments are not complete" }, { status: 409 });
      case "unavailable":
        return NextResponse.json({ error: "Certificate service unavailable" }, { status: 503 });
      default:
        return NextResponse.json({ error: "Enrollment is not eligible for completion certification" }, { status: 409 });
    }
  } catch (error) {
    return lmsApiError(error);
  }
}
