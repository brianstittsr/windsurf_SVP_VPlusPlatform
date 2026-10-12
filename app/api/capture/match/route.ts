import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { COLLECTIONS } from "@/lib/schema";
import { requireUser } from "@/lib/capture/server-auth";
import { serializeDoc } from "@/lib/capture/serialize";

/** GET /api/capture/match — list the match queue (default: pending, score-desc). */
export async function GET(req: NextRequest) {
  const user = await requireUser(req);
  if (user instanceof NextResponse) return user;
  if (!adminDb) return NextResponse.json({ error: "Database unavailable" }, { status: 500 });

  const status = req.nextUrl.searchParams.get("status");
  let snap;
  if (status) {
    snap = await adminDb
      .collection(COLLECTIONS.CAPTURE_MATCHES)
      .where("status", "==", status)
      .orderBy("score", "desc")
      .get();
  } else {
    snap = await adminDb.collection(COLLECTIONS.CAPTURE_MATCHES).orderBy("score", "desc").get();
  }
  return NextResponse.json({
    matches: snap.docs.map((d) => serializeDoc({ id: d.id, ...d.data() })),
  });
}
