import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { lmsApiError, requireLmsActor } from "@/lib/lms-api-auth";
import { COLLECTIONS, type CertificateDoc } from "@/lib/schema";

export async function GET(req: NextRequest) {
  try {
    const actor = await requireLmsActor(req);
    if (!adminDb) return NextResponse.json({ error: "Certificate service unavailable" }, { status: 503 });
    const [snapshot, documentsSnapshot] = await Promise.all([
      adminDb.collection(COLLECTIONS.CERTIFICATES).where("firebaseUid", "==", actor.uid).get(),
      adminDb.collection(COLLECTIONS.STUDENT_DOCUMENTS).where("firebaseUid", "==", actor.uid).where("kind", "==", "course_certificate").get(),
    ]);
    const documentByCertificate = new Map(documentsSnapshot.docs.map((doc) => [doc.get("certificateId") as string, doc.id]));
    const certificates = snapshot.docs.map((doc) => {
      const cert = doc.data() as CertificateDoc;
      return { ...cert, id: doc.id, issuedAt: cert.issuedAt?.toDate?.().toISOString() || null, studentDocumentId: documentByCertificate.get(doc.id) || null };
    }).sort((a, b) => String(b.issuedAt || "").localeCompare(String(a.issuedAt || "")));
    return NextResponse.json({ data: certificates });
  } catch (error) {
    return lmsApiError(error);
  }
}
