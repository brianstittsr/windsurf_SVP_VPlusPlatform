import { NextRequest, NextResponse } from "next/server";
import { Timestamp } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase-admin";
import { lmsApiError, requireLmsAdmin } from "@/lib/lms-api-auth";
import { DEFAULT_STUDENT_REGISTRATION_FIELDS, REGISTRATION_FORM_SLUG } from "@/lib/registration-forms";
import { COLLECTIONS } from "@/lib/schema";

export async function POST(req: NextRequest) {
  try {
    const actor = await requireLmsAdmin(req);
    if (!adminDb) return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
    const existing = await adminDb
      .collection(COLLECTIONS.REGISTRATION_FORMS)
      .where("slug", "==", REGISTRATION_FORM_SLUG)
      .limit(1)
      .get();
    if (!existing.empty) {
      return NextResponse.json({ data: { id: existing.docs[0].id, created: false } });
    }
    const now = Timestamp.now();
    const ref = await adminDb.collection(COLLECTIONS.REGISTRATION_FORMS).add({
      name: "V+ Student Registration",
      slug: REGISTRATION_FORM_SLUG,
      description: "Student and course registration based on the V+ registration form.",
      status: "draft",
      version: 1,
      fields: DEFAULT_STUDENT_REGISTRATION_FIELDS,
      createdBy: actor.uid,
      updatedBy: actor.uid,
      createdAt: now,
      updatedAt: now,
    });
    return NextResponse.json({ data: { id: ref.id, created: true } }, { status: 201 });
  } catch (error) {
    return lmsApiError(error);
  }
}
