import { NextRequest, NextResponse } from "next/server";
import { Timestamp } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase-admin";
import { lmsApiError, requireLmsAdmin } from "@/lib/lms-api-auth";
import { saveRegistrationFormSchema } from "@/lib/registration-form-schema";
import { COLLECTIONS, type RegistrationFormDoc } from "@/lib/schema";

export async function GET(req: NextRequest) {
  try {
    await requireLmsAdmin(req);
    if (!adminDb) return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
    const snap = await adminDb.collection(COLLECTIONS.REGISTRATION_FORMS).get();
    const forms = snap.docs
      .map((doc) => ({ id: doc.id, ...doc.data() }) as RegistrationFormDoc)
      .sort((a, b) => a.name.localeCompare(b.name));
    return NextResponse.json({ data: forms });
  } catch (error) {
    return lmsApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const actor = await requireLmsAdmin(req);
    if (!adminDb) return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
    const parsed = saveRegistrationFormSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message || "Invalid form definition" }, { status: 400 });
    }
    const input = parsed.data;
    const slugMatch = await adminDb
      .collection(COLLECTIONS.REGISTRATION_FORMS)
      .where("slug", "==", input.slug)
      .limit(2)
      .get();
    const conflicting = slugMatch.docs.find((doc) => doc.id !== input.id);
    if (conflicting) return NextResponse.json({ error: "That form URL is already in use" }, { status: 409 });

    const now = Timestamp.now();
    if (input.id) {
      const ref = adminDb.collection(COLLECTIONS.REGISTRATION_FORMS).doc(input.id);
      const snap = await ref.get();
      if (!snap.exists) return NextResponse.json({ error: "Form not found" }, { status: 404 });
      const previous = snap.data() as RegistrationFormDoc;
      const nextVersion = previous.version + 1;
      const updated = {
        name: input.name,
        slug: input.slug,
        description: input.description || "",
        fields: input.fields,
        version: nextVersion,
        updatedBy: actor.uid,
        updatedAt: now,
      };
      await ref.update(updated);
      return NextResponse.json({ data: { id: input.id, version: nextVersion } });
    }

    const ref = await adminDb.collection(COLLECTIONS.REGISTRATION_FORMS).add({
      name: input.name,
      slug: input.slug,
      description: input.description || "",
      status: "draft",
      version: 1,
      fields: input.fields,
      createdBy: actor.uid,
      updatedBy: actor.uid,
      createdAt: now,
      updatedAt: now,
    });
    return NextResponse.json({ data: { id: ref.id, version: 1 } }, { status: 201 });
  } catch (error) {
    return lmsApiError(error);
  }
}
