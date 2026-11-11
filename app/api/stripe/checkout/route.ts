import { NextRequest, NextResponse } from "next/server";
import { Timestamp } from "firebase-admin/firestore";
import { z } from "zod";
import type Stripe from "stripe";
import { stripe } from "@/lib/stripe";
import { adminAuth, adminDb } from "@/lib/firebase-admin";
import { COLLECTIONS, type CourseDoc, type LmsProductDoc, type OrderDoc, type RegistrationSubmissionDoc, type TeamMemberDoc } from "@/lib/schema";
import { hasActiveProAccess } from "@/lib/pro-access";

const checkoutSchema = z.object({
  registrationSubmissionId: z.string().min(1).max(160).optional(),
  productId: z.string().min(1).max(160).optional(),
  courseId: z.string().min(1).max(160).optional(),
  promoCode: z.string().trim().min(1).max(80).optional(),
}).refine((body) => [body.registrationSubmissionId, body.productId, body.courseId].filter(Boolean).length === 1, {
  message: "Choose an approved registration, a course, or a Pro access product.",
});

interface PromoValidation {
  data?: { id: string; code: string; percentOff: number; stripePromotionCodeId?: string };
  error?: string;
  status?: number;
}

async function validatePromoCode(codeInput: string | undefined, member: TeamMemberDoc): Promise<PromoValidation> {
  if (!codeInput || !adminDb) return {};
  const code = codeInput.trim().toUpperCase();
  const matches = await adminDb.collection(COLLECTIONS.DISCOUNT_CODES)
    .where("code", "==", code)
    .where("active", "==", true)
    .limit(1)
    .get();
  if (matches.empty) return { error: "That discount code is not valid", status: 400 };
  const discount = matches.docs[0].data() as { percentOff: number; militaryOnly?: boolean; maxRedemptions?: number; timesRedeemed?: number; expiresAt?: { toMillis: () => number }; stripePromotionCodeId?: string };
  if (!Number.isFinite(discount.percentOff) || discount.percentOff <= 0 || discount.percentOff >= 100) return { error: "That discount code is not valid", status: 400 };
  if (discount.expiresAt && discount.expiresAt.toMillis() < Date.now()) return { error: "That discount code has expired", status: 400 };
  if (discount.maxRedemptions && (discount.timesRedeemed || 0) >= discount.maxRedemptions) return { error: "That discount code is fully redeemed", status: 400 };
  if (discount.militaryOnly && !member.isVeteran) return { error: "That code is reserved for military veterans", status: 403 };
  return { data: { id: matches.docs[0].id, code, percentOff: discount.percentOff, stripePromotionCodeId: discount.stripePromotionCodeId } };
}

export async function POST(req: NextRequest) {
  let pendingOrderId = "";
  try {
    if (!stripe || !adminDb || !adminAuth) return NextResponse.json({ error: "Payments are not configured" }, { status: 503 });
    const authorization = req.headers.get("authorization") || "";
    const idToken = authorization.startsWith("Bearer ") ? authorization.slice(7) : "";
    if (!idToken) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const decoded = await adminAuth.verifyIdToken(idToken);
    const parsed = checkoutSchema.safeParse(await req.json());
    if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message || "Invalid checkout request" }, { status: 400 });
    const memberSnapshot = await adminDb.collection(COLLECTIONS.TEAM_MEMBERS).where("firebaseUid", "==", decoded.uid).limit(1).get();
    if (memberSnapshot.empty) return NextResponse.json({ error: "Student profile is not ready" }, { status: 403 });
    const member = { id: memberSnapshot.docs[0].id, ...memberSnapshot.docs[0].data() } as TeamMemberDoc;

    let mode: "payment" | "subscription" = "payment";
    let lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [];
    let metadata: Record<string, string> = { firebaseUid: decoded.uid, studentId: member.id };
    let successUrl = "";
    let cancelUrl = "";
    let allowPromotionCodes = true;
    let stripeDiscounts: Stripe.Checkout.SessionCreateParams.Discount[] | undefined;
    let appliedDiscount: PromoValidation["data"];

    if (parsed.data.productId) {
      const productSnap = await adminDb.collection(COLLECTIONS.PRODUCTS).doc(parsed.data.productId).get();
      if (!productSnap.exists) return NextResponse.json({ error: "Pro plan not found" }, { status: 404 });
      const product = { id: productSnap.id, ...productSnap.data() } as LmsProductDoc;
      if (product.kind !== "pro_access" || !product.published || product.priceCents <= 0) {
        return NextResponse.json({ error: "This Pro plan is not available for purchase" }, { status: 409 });
      }
      if (hasActiveProAccess(member)) {
        return NextResponse.json({ error: "Pro access is already active. Use your current access or wait until it expires before purchasing another plan." }, { status: 409 });
      }
      const promoResult = await validatePromoCode(parsed.data.promoCode, member);
      if (promoResult.error) return NextResponse.json({ error: promoResult.error }, { status: promoResult.status || 400 });
      appliedDiscount = promoResult.data;
      if (appliedDiscount?.stripePromotionCodeId) {
        stripeDiscounts = [{ promotion_code: appliedDiscount.stripePromotionCodeId }];
      } else if (appliedDiscount && product.billingMode === "subscription") {
        return NextResponse.json({ error: "This code is not configured as a Stripe promotion code for recurring plans" }, { status: 400 });
      }
      const manualDiscountCents = appliedDiscount && !appliedDiscount.stripePromotionCodeId ? Math.round(product.priceCents * appliedDiscount.percentOff / 100) : 0;
      allowPromotionCodes = !appliedDiscount;
      const previousOrders = await adminDb.collection(COLLECTIONS.ORDERS)
        .where("firebaseUid", "==", decoded.uid)
        .where("productId", "==", product.id)
        .where("status", "==", "pending")
        .limit(1)
        .get();
      if (!previousOrders.empty) {
        const previousOrder = previousOrders.docs[0];
        const previousSessionId = previousOrder.get("stripeCheckoutSessionId") as string | undefined;
        if (previousSessionId) {
          const previousSession = await stripe.checkout.sessions.retrieve(previousSessionId);
          if (previousSession.status === "open" && previousSession.url) return NextResponse.json({ data: { url: previousSession.url, orderId: previousOrder.id } });
          await previousOrder.ref.update({ status: "failed", fulfillmentStatus: "failed", updatedAt: Timestamp.now() });
        }
      }
      const orderRef = adminDb.collection(COLLECTIONS.ORDERS).doc();
      pendingOrderId = orderRef.id;
      const now = Timestamp.now();
      const order: Omit<OrderDoc, "id"> = {
        firebaseUid: decoded.uid,
        studentId: member.id,
        productId: product.id,
        items: [{ productId: product.id, code: product.code, title: product.title, unitAmountCents: product.priceCents - manualDiscountCents, quantity: 1 }],
        subtotalCents: product.priceCents,
        discountCents: manualDiscountCents,
        discountCode: appliedDiscount?.code,
        taxCents: 0,
        totalCents: product.priceCents - manualDiscountCents,
        currency: product.currency || "usd",
        status: "pending",
        fulfillmentStatus: "pending",
        paymentMethod: "stripe",
        createdAt: now as unknown as OrderDoc["createdAt"],
      };
      await orderRef.set(order);
      mode = product.billingMode;
      metadata = {
        ...metadata,
        orderId: orderRef.id,
        productId: product.id,
        productCode: product.code,
        purchaseKind: "pro-access",
        ...(appliedDiscount ? { discountCode: appliedDiscount.code, discountCodeId: appliedDiscount.id, discountCents: String(manualDiscountCents) } : {}),
      };
      lineItems = [{
        quantity: 1,
        price_data: {
          currency: product.currency || "usd",
          unit_amount: product.priceCents - manualDiscountCents,
          product_data: { name: product.title, description: product.description.slice(0, 500) },
          ...(product.billingMode === "subscription" ? { recurring: { interval: product.interval || "month" } } : {}),
        },
      }];
      successUrl = "/portal/checkout/success?session_id={CHECKOUT_SESSION_ID}";
      cancelUrl = "/portal/pro?checkout=cancel";
    } else if (parsed.data.courseId) {
      const courseId = parsed.data.courseId;
      const courseSnap = await adminDb.collection(COLLECTIONS.COURSES).doc(courseId).get();
      if (!courseSnap.exists) return NextResponse.json({ error: "Course not found" }, { status: 404 });
      const course = courseSnap.data() as CourseDoc;
      if (course.published !== true || course.archived === true) {
        return NextResponse.json({ error: "This course is not available for enrollment" }, { status: 409 });
      }
      if (course.purchaseMode === "registration") {
        return NextResponse.json({ error: "This program requires a staff-reviewed registration. Submit the registration form for approval." }, { status: 409 });
      }
      if (!Number.isInteger(course.priceCents) || course.priceCents <= 0) {
        return NextResponse.json({ error: "This course has free enrollment — use the enroll option instead of checkout" }, { status: 409 });
      }
      const alreadyEnrolled = await adminDb.collection(COLLECTIONS.ENROLLMENTS)
        .where("firebaseUid", "==", decoded.uid)
        .where("courseId", "==", course.id)
        .where("status", "in", ["active", "completed"])
        .limit(1)
        .get();
      if (!alreadyEnrolled.empty) {
        return NextResponse.json({ error: "You are already enrolled in this course" }, { status: 409 });
      }
      const promoResult = await validatePromoCode(parsed.data.promoCode, member);
      if (promoResult.error) return NextResponse.json({ error: promoResult.error }, { status: promoResult.status || 400 });
      appliedDiscount = promoResult.data;
      if (appliedDiscount?.stripePromotionCodeId) stripeDiscounts = [{ promotion_code: appliedDiscount.stripePromotionCodeId }];
      const manualDiscountCents = appliedDiscount && !appliedDiscount.stripePromotionCodeId ? Math.round(course.priceCents * appliedDiscount.percentOff / 100) : 0;
      allowPromotionCodes = !appliedDiscount;
      const previousOrders = await adminDb.collection(COLLECTIONS.ORDERS)
        .where("firebaseUid", "==", decoded.uid)
        .where("courseId", "==", course.id)
        .where("status", "==", "pending")
        .limit(1)
        .get();
      if (!previousOrders.empty) {
        const previousOrder = previousOrders.docs[0];
        const previousSessionId = previousOrder.get("stripeCheckoutSessionId") as string | undefined;
        if (previousSessionId) {
          const previousSession = await stripe.checkout.sessions.retrieve(previousSessionId);
          if (previousSession.status === "open" && previousSession.url) return NextResponse.json({ data: { url: previousSession.url, orderId: previousOrder.id } });
          await previousOrder.ref.update({ status: "failed", fulfillmentStatus: "failed", updatedAt: Timestamp.now() });
        }
      }
      const orderRef = adminDb.collection(COLLECTIONS.ORDERS).doc();
      pendingOrderId = orderRef.id;
      const now = Timestamp.now();
      const order: Omit<OrderDoc, "id"> = {
        firebaseUid: decoded.uid,
        studentId: member.id,
        courseId: course.id,
        purchaseKind: "course",
        items: [{
          courseId: course.id,
          code: course.code,
          title: course.title,
          unitAmountCents: course.priceCents - manualDiscountCents,
          quantity: 1,
          includedCourseIds: course.includedCourseIds,
        }],
        subtotalCents: course.priceCents,
        discountCents: manualDiscountCents,
        discountCode: appliedDiscount?.code,
        taxCents: 0,
        totalCents: course.priceCents - manualDiscountCents,
        currency: course.currency || "usd",
        status: "pending",
        fulfillmentStatus: "pending",
        paymentMethod: "stripe",
        createdAt: now as unknown as OrderDoc["createdAt"],
      };
      await orderRef.set(order);
      metadata = {
        ...metadata,
        orderId: orderRef.id,
        courseId: course.id,
        purchaseKind: "course",
        ...(appliedDiscount ? { discountCode: appliedDiscount.code, discountCodeId: appliedDiscount.id, discountCents: String(manualDiscountCents) } : {}),
      };
      lineItems = [{
        quantity: 1,
        price_data: {
          currency: course.currency || "usd",
          unit_amount: course.priceCents - manualDiscountCents,
          product_data: { name: `${course.code} — ${course.title}`, description: (course.shortDescription || course.description || "").slice(0, 500) },
        },
      }];
      successUrl = "/portal/checkout/success?session_id={CHECKOUT_SESSION_ID}";
      cancelUrl = `/portal/courses/${encodeURIComponent(course.id)}`;
    } else {
      const registrationId = parsed.data.registrationSubmissionId!;
      const registrationRef = adminDb.collection(COLLECTIONS.REGISTRATION_SUBMISSIONS).doc(registrationId);
      const registrationSnapshot = await registrationRef.get();
      if (!registrationSnapshot.exists) return NextResponse.json({ error: "Approved registration not found" }, { status: 404 });
      const registration = { id: registrationSnapshot.id, ...registrationSnapshot.data() } as RegistrationSubmissionDoc;
      if (registration.userId !== member.id || registration.status !== "checkout_pending" || registration.email.toLowerCase() !== (decoded.email || "").toLowerCase()) {
        return NextResponse.json({ error: "This registration is not approved for checkout by this account" }, { status: 403 });
      }
      if (!registration.selectedCoursesSnapshot.length || registration.selectedCoursesSnapshot.length > 20 || registration.selectedCoursesSnapshot.some((course) => !Number.isInteger(course.priceCents) || course.priceCents <= 0)) {
        return NextResponse.json({ error: "One or more approved course prices need administrator review" }, { status: 409 });
      }
      const selectedIds = new Set(registration.selectedCoursesSnapshot.map((course) => course.courseId));
      const owned = await adminDb.collection(COLLECTIONS.ENROLLMENTS)
        .where("firebaseUid", "==", decoded.uid)
        .get();
      const ownedIds = new Set(owned.docs
        .filter((doc) => ["active", "completed"].includes(doc.get("status") as string) && selectedIds.has(doc.get("courseId") as string))
        .map((doc) => doc.get("courseId") as string));
      if (ownedIds.size) {
        const ownedNames = registration.selectedCoursesSnapshot.filter((course) => ownedIds.has(course.courseId)).map((course) => course.title);
        return NextResponse.json({ error: `You are already enrolled in: ${ownedNames.join(", ")}. Remove it from the registration or contact support.` }, { status: 409 });
      }
      if (registration.orderId) {
        const previousOrder = await adminDb.collection(COLLECTIONS.ORDERS).doc(registration.orderId).get();
        const previousSessionId = previousOrder.get("stripeCheckoutSessionId") as string | undefined;
        if (previousOrder.exists && previousOrder.get("status") === "pending" && previousSessionId) {
          const previousSession = await stripe.checkout.sessions.retrieve(previousSessionId);
          if (previousSession.status === "open" && previousSession.url) {
            return NextResponse.json({ data: { url: previousSession.url, orderId: previousOrder.id } }, { status: 200 });
          }
        }
      }
      const promoResult = await validatePromoCode(parsed.data.promoCode, member);
      if (promoResult.error) return NextResponse.json({ error: promoResult.error }, { status: promoResult.status || 400 });
      appliedDiscount = promoResult.data;
      allowPromotionCodes = !appliedDiscount;
      if (appliedDiscount?.stripePromotionCodeId) stripeDiscounts = [{ promotion_code: appliedDiscount.stripePromotionCodeId }];
      const subtotalCents = registration.selectedCoursesSnapshot.reduce((sum, course) => sum + course.priceCents, 0);
      const manualDiscountCents = appliedDiscount && !appliedDiscount.stripePromotionCodeId
        ? registration.selectedCoursesSnapshot.reduce((sum, course) => sum + Math.round(course.priceCents * (appliedDiscount?.percentOff ?? 0) / 100), 0)
        : 0;
      const totalCents = subtotalCents - manualDiscountCents;
      const now = Timestamp.now();
      const orderRef = adminDb.collection(COLLECTIONS.ORDERS).doc();
      pendingOrderId = orderRef.id;
      const order: Omit<OrderDoc, "id"> = {
        firebaseUid: decoded.uid,
        studentId: member.id,
        registrationSubmissionId: registration.id,
        items: registration.selectedCoursesSnapshot.map((course) => ({
          courseId: course.courseId,
          code: course.code,
          title: course.title,
          unitAmountCents: course.priceCents - (appliedDiscount && !appliedDiscount.stripePromotionCodeId ? Math.round(course.priceCents * (appliedDiscount?.percentOff ?? 0) / 100) : 0),
          quantity: 1,
          includedCourseIds: course.includedCourseIds,
        })),
        subtotalCents,
        discountCents: manualDiscountCents,
        discountCode: appliedDiscount?.code,
        taxCents: 0,
        totalCents,
        currency: registration.currency || "usd",
        status: "pending",
        fulfillmentStatus: "pending",
        paymentMethod: "stripe",
        createdAt: now as unknown as OrderDoc["createdAt"],
      };
      await orderRef.set(order);
      lineItems = registration.selectedCoursesSnapshot.map((course) => ({
        quantity: 1,
        price_data: {
          currency: registration.currency || "usd",
          unit_amount: course.priceCents - (appliedDiscount && !appliedDiscount.stripePromotionCodeId ? Math.round(course.priceCents * (appliedDiscount?.percentOff ?? 0) / 100) : 0),
          product_data: { name: `${course.code} — ${course.title}`, description: course.description.slice(0, 500) },
        },
      }));
      metadata = {
        ...metadata,
        orderId: orderRef.id,
        registrationSubmissionId: registration.id,
        purchaseKind: "registration",
        ...(appliedDiscount ? { discountCode: appliedDiscount.code, discountCodeId: appliedDiscount.id, discountCents: String(manualDiscountCents) } : {}),
      };
      successUrl = `/portal/checkout/success?session_id={CHECKOUT_SESSION_ID}&registration=${encodeURIComponent(registration.id)}`;
      cancelUrl = `/portal/checkout/cancel?registration=${encodeURIComponent(registration.id)}`;
      await registrationRef.update({ status: "checkout_pending", orderId: orderRef.id, updatedAt: now });
    }

    const origin = new URL(process.env.NEXT_PUBLIC_APP_URL || "https://strategicvalueplus.com").origin;
    const session = await stripe.checkout.sessions.create({
      mode,
      line_items: lineItems,
      customer_email: decoded.email || undefined,
      client_reference_id: decoded.uid,
      metadata,
      ...(mode === "subscription" ? { subscription_data: { metadata } } : { payment_intent_data: { metadata } }),
      ...(stripeDiscounts ? { discounts: stripeDiscounts } : {}),
      allow_promotion_codes: allowPromotionCodes,
      billing_address_collection: "auto",
      success_url: `${origin}${successUrl}`,
      cancel_url: `${origin}${cancelUrl}`,
    });
    if (pendingOrderId) await adminDb.collection(COLLECTIONS.ORDERS).doc(pendingOrderId).update({ stripeCheckoutSessionId: session.id });
    return NextResponse.json({ data: { url: session.url, orderId: pendingOrderId || null } }, { status: 200 });
  } catch (error) {
    if (pendingOrderId && adminDb) {
      await adminDb.collection(COLLECTIONS.ORDERS).doc(pendingOrderId).update({ status: "failed", fulfillmentStatus: "failed" }).catch(() => undefined);
    }
    console.error("[stripe/checkout] failed:", error);
    return NextResponse.json({ error: "Unable to start secure checkout" }, { status: 500 });
  }
}
