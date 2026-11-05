import { NextRequest, NextResponse } from "next/server";
import { Timestamp } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase-admin";
import { lmsApiError, requireLmsAdmin } from "@/lib/lms-api-auth";
import { EFVS_PRO_PRODUCTS } from "@/lib/pro-products";
import { COLLECTIONS } from "@/lib/schema";

export async function POST(req: NextRequest) {
  try {
    const actor = await requireLmsAdmin(req);
    if (!adminDb) return NextResponse.json({ error: "Product catalog unavailable" }, { status: 503 });
    const created: string[] = [];
    const existing: string[] = [];
    for (const product of EFVS_PRO_PRODUCTS) {
      const matches = await adminDb.collection(COLLECTIONS.PRODUCTS).where("code", "==", product.code).limit(1).get();
      if (!matches.empty) { existing.push(product.code); continue; }
      const now = Timestamp.now();
      const ref = await adminDb.collection(COLLECTIONS.PRODUCTS).add({ ...product, createdAt: now, updatedAt: now, createdBy: actor.uid });
      created.push(ref.id);
    }
    return NextResponse.json({ data: { created, existing, createdCount: created.length } });
  } catch (error) {
    return lmsApiError(error);
  }
}
