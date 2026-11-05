import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { lmsApiError, requireLmsAdmin } from "@/lib/lms-api-auth";
import { COLLECTIONS, type RegistrationSubmissionDoc } from "@/lib/schema";

export async function GET(req: NextRequest) {
  try {
    await requireLmsAdmin(req);
    if (!adminDb) return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
    const snapshot = await adminDb
      .collection(COLLECTIONS.REGISTRATION_SUBMISSIONS)
      .orderBy("submittedAt", "desc")
      .limit(200)
      .get();
    const registrations = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as RegistrationSubmissionDoc);
    return NextResponse.json({ data: registrations });
  } catch (error) {
    return lmsApiError(error);
  }
}
