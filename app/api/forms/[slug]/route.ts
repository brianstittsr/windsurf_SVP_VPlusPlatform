import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { COLLECTIONS, type RegistrationFormDoc } from "@/lib/schema";

export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ slug: string }> }
) {
  if (!adminDb) return NextResponse.json({ error: "Registration is unavailable" }, { status: 503 });
  try {
    const { slug } = await ctx.params;
    const snap = await adminDb
      .collection(COLLECTIONS.REGISTRATION_FORMS)
      .where("slug", "==", slug)
      .where("status", "==", "published")
      .limit(1)
      .get();
    if (snap.empty) return NextResponse.json({ error: "Form not found" }, { status: 404 });
    const doc = snap.docs[0];
    const form = doc.data() as RegistrationFormDoc;
    return NextResponse.json({
      data: {
        id: doc.id,
        name: form.name,
        slug: form.slug,
        description: form.description || "",
        version: form.publishedVersion || form.version,
        fields: form.publishedFields || form.fields,
      },
    });
  } catch (error) {
    console.error("[forms/public] form load failed:", error);
    return NextResponse.json({ error: "Registration is unavailable" }, { status: 500 });
  }
}
