import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { COLLECTIONS, type CertificateDoc } from "@/lib/schema";

export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ credentialId: string }> }
) {
  if (!adminDb) return NextResponse.json({ error: "Verification unavailable" }, { status: 503 });
  try {
    const { credentialId } = await ctx.params;
    const snapshot = await adminDb.collection(COLLECTIONS.CERTIFICATES)
      .where("publicCredentialId", "==", credentialId)
      .where("publicSharingEnabled", "==", true)
      .where("publicNameConsent", "==", true)
      .limit(1)
      .get();
    if (snapshot.empty) return NextResponse.json({ error: "Credential is private or unavailable" }, { status: 404 });
    const doc = snapshot.docs[0];
    const cert = doc.data() as CertificateDoc;
    if (cert.revokedAt) return NextResponse.json({ error: "Credential has been revoked" }, { status: 410 });
    return NextResponse.json({ data: {
      credentialId: cert.publicCredentialId,
      certificateNumber: cert.certificateNumber,
      learnerName: cert.studentName,
      courseCode: cert.courseCode,
      courseTitle: cert.courseTitle,
      badgeTitle: cert.badgeTitle || `${cert.courseCode} — Completion`,
      issuer: "Eagle Flight Vertical Solutions · EFVS UAS Training Academy",
      issuedAt: cert.issuedAt?.toDate?.().toISOString() || null,
      verificationStatus: "verified",
      credentialUrl: `${new URL(process.env.NEXT_PUBLIC_APP_URL || "https://academy.efvertical.com").origin}/credentials/${cert.publicCredentialId}`,
    } });
  } catch (error) {
    console.error("[credentials/verify] failed:", error);
    return NextResponse.json({ error: "Verification unavailable" }, { status: 500 });
  }
}
