import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { lmsApiError, requireLmsAdmin } from "@/lib/lms-api-auth";
import { COLLECTIONS, type LmsProductDoc } from "@/lib/schema";

export async function GET(req: NextRequest) {
  try {
    await requireLmsAdmin(req);
    if (!adminDb) return NextResponse.json({ error: "Product catalog unavailable" }, { status: 503 });
    const snap = await adminDb.collection(COLLECTIONS.PRODUCTS).get();
    const products = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as LmsProductDoc).sort((a, b) => a.displayOrder - b.displayOrder);
    return NextResponse.json({ data: products });
  } catch (error) {
    return lmsApiError(error);
  }
}
