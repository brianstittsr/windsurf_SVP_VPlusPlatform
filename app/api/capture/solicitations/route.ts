import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { z } from "zod";
import { adminDb } from "@/lib/firebase-admin";
import { requireUser } from "@/lib/capture/server-auth";
import { serializeDoc } from "@/lib/capture/serialize";

const COLLECTION = "samSavedOpportunities";

const saveSchema = z.object({
  noticeId: z.string().min(1),
  title: z.string().optional(),
  solicitationNumber: z.string().optional(),
  agency: z.string().optional(),
  office: z.string().optional(),
  type: z.string().optional(),
  setAside: z.string().optional(),
  naicsCode: z.string().optional(),
  responseDeadline: z.string().optional(),
  description: z.string().optional(),
  samUrl: z.string().optional(),
});

/** GET /api/capture/solicitations — the saved SAM notices inbox. */
export async function GET(req: NextRequest) {
  const user = await requireUser(req);
  if (user instanceof NextResponse) return user;
  if (!adminDb) return NextResponse.json({ error: "Database unavailable" }, { status: 500 });

  const snap = await adminDb.collection(COLLECTION).orderBy("savedAt", "desc").get();
  return NextResponse.json({
    solicitations: snap.docs.map((d) => serializeDoc({ id: d.id, ...d.data() })),
  });
}

/** POST — save a SAM notice to the inbox (dedupes on noticeId). */
export async function POST(req: NextRequest) {
  const user = await requireUser(req);
  if (user instanceof NextResponse) return user;
  if (!adminDb) return NextResponse.json({ error: "Database unavailable" }, { status: 500 });

  const body = await req.json().catch(() => null);
  const parsed = saveSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || "Invalid request" }, { status: 400 });
  }

  const dupe = await adminDb
    .collection(COLLECTION)
    .where("noticeId", "==", parsed.data.noticeId)
    .limit(1)
    .get();
  if (!dupe.empty) {
    return NextResponse.json({ error: "Already saved", id: dupe.docs[0].id }, { status: 409 });
  }

  const docRef = await adminDb.collection(COLLECTION).add({
    ...parsed.data,
    status: "saved",
    savedById: user.uid,
    savedAt: FieldValue.serverTimestamp(),
  });
  const created = await docRef.get();
  return NextResponse.json(
    { solicitation: serializeDoc({ id: created.id, ...created.data() }) },
    { status: 201 }
  );
}
