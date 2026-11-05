import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { adminDb } from "@/lib/firebase-admin";
import { lmsApiError, requireLmsActor, LmsApiError } from "@/lib/lms-api-auth";

export async function POST(req: NextRequest) {
  try {
    if (!stripe || !adminDb) return NextResponse.json({ error: "Billing portal is not configured" }, { status: 503 });
    const actor = await requireLmsActor(req);
    const member = await adminDb.collection("teamMembers").doc(actor.studentId).get();
    const customerId = member.get("stripeCustomerId") as string | undefined;
    if (!customerId) throw new LmsApiError(404, "No Stripe billing account is linked to this profile");
    const origin = new URL(process.env.NEXT_PUBLIC_APP_URL || "https://academy.efvertical.com").origin;
    const session = await stripe.billingPortal.sessions.create({ customer: customerId, return_url: `${origin}/portal/pro` });
    return NextResponse.json({ data: { url: session.url } });
  } catch (error) {
    return lmsApiError(error);
  }
}
