import { NextRequest, NextResponse } from "next/server";
import { Timestamp } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase-admin";
import { lmsApiError, requireLmsAdmin } from "@/lib/lms-api-auth";
import { COLLECTIONS, type RegistrationFormDoc } from "@/lib/schema";

export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ formId: string }> }
) {
  try {
    const actor = await requireLmsAdmin(req);
    if (!adminDb) return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
    const { formId } = await ctx.params;
    const ref = adminDb.collection(COLLECTIONS.REGISTRATION_FORMS).doc(formId);
    const snap = await ref.get();
    if (!snap.exists) return NextResponse.json({ error: "Form not found" }, { status: 404 });
    const form = snap.data() as RegistrationFormDoc;
    const requiredPurposes = ["fullName", "email", "courseSelection", "studentAcknowledgment", "programPolicies", "signature"];
    const missing = requiredPurposes.filter((purpose) =>
      !form.fields.some((field) => field.purpose === purpose && field.required)
    );
    if (missing.length > 0) {
      return NextResponse.json({ error: `Published registration form is missing required fields: ${missing.join(", ")}` }, { status: 400 });
    }
    await ref.update({
      status: "published",
      publishedFields: form.fields,
      publishedVersion: form.version,
      publishedAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      updatedBy: actor.uid,
    });
    return NextResponse.json({ data: { formId, publishedVersion: form.version } });
  } catch (error) {
    return lmsApiError(error);
  }
}
