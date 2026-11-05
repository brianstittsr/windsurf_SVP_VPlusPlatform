import { NextRequest, NextResponse } from "next/server";
import { Timestamp } from "firebase-admin/firestore";
import { z } from "zod";
import { adminDb } from "@/lib/firebase-admin";
import { lmsApiError, requireLmsAdmin } from "@/lib/lms-api-auth";
import { COLLECTIONS, type LmsProductDoc } from "@/lib/schema";

const updateSchema = z.object({
  title: z.string().min(3).max(160),
  description: z.string().min(1).max(2000),
  priceCents: z.number().int().min(0).max(100_000_000),
  published: z.boolean(),
  benefits: z.array(z.string().min(1).max(200)).max(30),
});

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ productId: string }> }) {
  try {
    const actor = await requireLmsAdmin(req);
    if (!adminDb) return NextResponse.json({ error: "Product catalog unavailable" }, { status: 503 });
    const { productId } = await ctx.params;
    const parsed = updateSchema.safeParse(await req.json());
    if (!parsed.success) return NextResponse.json({ error: "Invalid product details" }, { status: 400 });
    const ref = adminDb.collection(COLLECTIONS.PRODUCTS).doc(productId);
    const snap = await ref.get();
    if (!snap.exists) return NextResponse.json({ error: "Product not found" }, { status: 404 });
    const product = snap.data() as LmsProductDoc;
    if (parsed.data.published && parsed.data.priceCents <= 0) return NextResponse.json({ error: "A published product must have a positive retail price" }, { status: 400 });
    await ref.update({ ...parsed.data, updatedBy: actor.uid, updatedAt: Timestamp.now() });
    return NextResponse.json({ data: { id: productId, code: product.code, published: parsed.data.published } });
  } catch (error) {
    return lmsApiError(error);
  }
}
