import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { adminAuth, adminDb } from "@/lib/firebase-admin";
import { COLLECTIONS } from "@/lib/schema";

export async function GET(req: NextRequest) {
  if (!stripe || !adminAuth || !adminDb) return NextResponse.json({ error: "Payments are unavailable" }, { status: 503 });
  const authorization = req.headers.get("authorization") || "";
  const idToken = authorization.startsWith("Bearer ") ? authorization.slice(7) : "";
  if (!idToken) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  let uid: string;
  try {
    uid = (await adminAuth.verifyIdToken(idToken)).uid;
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const sessionId = req.nextUrl.searchParams.get("session_id") || "";
  if (!sessionId.startsWith("cs_")) return NextResponse.json({ error: "Invalid checkout session" }, { status: 400 });
  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    if (session.metadata?.firebaseUid !== uid) return NextResponse.json({ error: "Checkout session not found" }, { status: 404 });
    const orderId = session.metadata?.orderId || "";
    let orderStatus = "pending";
    let registrationId = session.metadata?.registrationSubmissionId || "";
    if (orderId) {
      const order = await adminDb.collection(COLLECTIONS.ORDERS).doc(orderId).get();
      if (!order.exists || order.get("firebaseUid") !== uid) return NextResponse.json({ error: "Order not found" }, { status: 404 });
      orderStatus = String(order.get("status") || "pending");
      registrationId = String(order.get("registrationSubmissionId") || registrationId);
    }
    return NextResponse.json({ data: {
      paymentStatus: session.payment_status,
      sessionStatus: session.status,
      orderStatus,
      orderId: orderId || null,
      registrationId: registrationId || null,
      purchaseKind: session.metadata?.purchaseKind || "legacy-course",
      productId: session.metadata?.productId || null,
    } });
  } catch (error) {
    console.error("[stripe/session] lookup failed:", error);
    return NextResponse.json({ error: "Unable to check payment status" }, { status: 500 });
  }
}
