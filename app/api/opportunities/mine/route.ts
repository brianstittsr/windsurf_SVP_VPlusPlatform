import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { COLLECTIONS, type CustomerDoc } from "@/lib/schema";
import { requireUser } from "@/lib/capture/server-auth";
import { serializeDoc } from "@/lib/capture/serialize";

const CLOSED_STAGES = ["won", "lost", "closed"];

/**
 * Returns the signed-in user's company-linked SAM pipeline: pending match-queue
 * items and accepted capture opportunities for the customers doc tied to their
 * firebaseUid. hasCompany=false when no company profile is linked (prompt
 * them to complete onboarding).
 */
export async function GET(request: NextRequest) {
  const userOrRes = await requireUser(request);
  if (userOrRes instanceof NextResponse) return userOrRes;
  const user = userOrRes;

  if (!adminDb) {
    return NextResponse.json({ error: "Database unavailable" }, { status: 500 });
  }

  try {
    const customers = await adminDb
      .collection(COLLECTIONS.CUSTOMERS)
      .where("firebaseUid", "==", user.uid)
      .get();

    if (customers.empty) {
      return NextResponse.json({ data: { hasCompany: false, matches: [], pursuits: [] } });
    }

    const ids = customers.docs.map((d) => d.id);
    const companyName = (customers.docs[0].data() as CustomerDoc).name || "";

    const [matchSnap, oppSnap] = await Promise.all([
      adminDb
        .collection(COLLECTIONS.CAPTURE_MATCHES)
        .where("clientId", "in", ids.slice(0, 10))
        .where("status", "==", "pending")
        .limit(50)
        .get(),
      adminDb
        .collection(COLLECTIONS.CAPTURE_OPPORTUNITIES)
        .where("clientId", "in", ids.slice(0, 10))
        .limit(50)
        .get(),
    ]);

    const matches = matchSnap.docs.map((d) => serializeDoc({ id: d.id, ...d.data() }));
    const pursuits = oppSnap.docs
      .map((d) => serializeDoc({ id: d.id, ...d.data() }))
      .filter((o) => !CLOSED_STAGES.includes(String((o as Record<string, unknown>).stage || "")));

    return NextResponse.json({ data: { hasCompany: true, companyName, matches, pursuits } });
  } catch (error) {
    console.error("[opportunities/mine] failed:", error);
    return NextResponse.json({ error: "Failed to load your opportunities" }, { status: 500 });
  }
}
