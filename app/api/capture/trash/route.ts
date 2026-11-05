import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { COLLECTIONS, type CaptureOpportunityDoc, type CustomerDoc } from "@/lib/schema";
import { requireAdmin } from "@/lib/capture/server-auth";
import { serializeDoc } from "@/lib/capture/serialize";

/** GET /api/capture/trash — items soft-deleted within the 30-day window (admin). */
export async function GET(req: NextRequest) {
  const user = await requireAdmin(req);
  if (user instanceof NextResponse) return user;
  if (!adminDb) return NextResponse.json({ error: "Database unavailable" }, { status: 500 });

  const [oppSnap, clientSnap] = await Promise.all([
    adminDb.collection(COLLECTIONS.CAPTURE_OPPORTUNITIES).get(),
    adminDb.collection(COLLECTIONS.CUSTOMERS).get(),
  ]);

  const opportunities = oppSnap.docs
    .map((d) => serializeDoc({ id: d.id, ...d.data() }) as CaptureOpportunityDoc)
    .filter((o) => o.deletedAt);
  const clients = clientSnap.docs
    .map((d) => serializeDoc({ id: d.id, ...d.data() }) as CustomerDoc)
    .filter((c) => c.deletedAt && c.isCaptureClient);

  return NextResponse.json({ opportunities, clients });
}
