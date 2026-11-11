import { NextRequest, NextResponse } from "next/server";
import { Timestamp } from "firebase-admin/firestore";
import { stripe } from "@/lib/stripe";
import { adminDb } from "@/lib/firebase-admin";
import { COLLECTIONS, type InvoiceDoc, type LmsProductDoc, type OrderDoc, type PaymentDoc, type TeamMemberDoc } from "@/lib/schema";
import type Stripe from "stripe";

function stripeId(value: string | Stripe.PaymentIntent | null | undefined): string {
  return typeof value === "string" ? value : value?.id || "";
}

async function recordDiscountRedemption(metadata: Stripe.Metadata): Promise<void> {
  if (!adminDb || !metadata.discountCodeId || !metadata.orderId) return;
  const codeRef = adminDb.collection(COLLECTIONS.DISCOUNT_CODES).doc(metadata.discountCodeId);
  const redemptionRef = adminDb.collection(COLLECTIONS.DISCOUNT_REDEMPTIONS).doc(metadata.orderId);
  const now = Timestamp.now();
  await adminDb.runTransaction(async (transaction) => {
    const [redemptionSnap, codeSnap] = await Promise.all([transaction.get(redemptionRef), transaction.get(codeRef)]);
    if (redemptionSnap.exists) return;
    if (!codeSnap.exists) throw new Error("Discount code disappeared before fulfillment");
    transaction.update(codeRef, { timesRedeemed: Number(codeSnap.get("timesRedeemed") || 0) + 1, updatedAt: now });
    transaction.create(redemptionRef, {
      orderId: metadata.orderId,
      discountCodeId: metadata.discountCodeId,
      code: metadata.discountCode || "",
      firebaseUid: metadata.firebaseUid || "",
      createdAt: now,
    });
  });
}

async function fulfillRegistrationOrder(session: Stripe.Checkout.Session): Promise<void> {
  if (!adminDb || !session.metadata?.orderId) throw new Error("Registration order metadata is missing");
  if (session.payment_status !== "paid") return;
  const orderId = session.metadata.orderId;
  const orderRef = adminDb.collection(COLLECTIONS.ORDERS).doc(orderId);
  const orderSnap = await orderRef.get();
  if (!orderSnap.exists) throw new Error("Order is not available for webhook fulfillment");
  const order = { id: orderSnap.id, ...orderSnap.data() } as OrderDoc;
  if (order.firebaseUid !== session.metadata.firebaseUid || order.registrationSubmissionId !== session.metadata.registrationSubmissionId) {
    throw new Error("Checkout metadata does not match the order");
  }
  if (order.fulfillmentStatus === "fulfilled") return;
  await recordDiscountRedemption(session.metadata || {});

  const paymentIntentId = stripeId(session.payment_intent);
  const method = session.payment_method_types?.includes("us_bank_account") ? "us_bank_account" : "card";
  const timestamp = Timestamp.now();
  const courseIds = [...new Set(order.items.flatMap((item) => [item.courseId, ...(item.includedCourseIds || [])]).filter((courseId): courseId is string => Boolean(courseId)))];
  const enrollmentRefs = await Promise.all(courseIds.map(async (courseId) => {
    const existing = await adminDb!.collection(COLLECTIONS.ENROLLMENTS)
      .where("studentId", "==", order.studentId)
      .where("courseId", "==", courseId)
      .where("status", "in", ["active", "completed"])
      .limit(1)
      .get();
    if (!existing.empty) return null;
    return adminDb!.collection(COLLECTIONS.ENROLLMENTS).doc(`order_${orderId}_${courseId}`);
  }));

  const invoiceRef = adminDb.collection(COLLECTIONS.INVOICES).doc(`order_${orderId}`);
  const paymentRef = adminDb.collection(COLLECTIONS.PAYMENTS).doc(paymentIntentId || session.id);
  const registrationRef = order.registrationSubmissionId
    ? adminDb.collection(COLLECTIONS.REGISTRATION_SUBMISSIONS).doc(order.registrationSubmissionId)
    : null;
  const batch = adminDb.batch();
  const totalCents = session.amount_total ?? order.totalCents;
  const subtotalCents = order.subtotalCents;
  const discountCents = Math.max(Number(session.metadata?.discountCents || 0), session.total_details?.amount_discount ?? 0);
  const invoice: Omit<InvoiceDoc, "id"> = {
    studentId: order.studentId,
    firebaseUid: order.firebaseUid,
    courseId: order.items[0]?.courseId || "multi-course-order",
    courseIds,
    orderId,
    amountCents: subtotalCents,
    discountCents,
    discountCode: session.metadata?.discountCode,
    netCents: totalCents,
    currency: session.currency || order.currency || "usd",
    status: "paid",
    method: "stripe",
    stripeSessionId: session.id,
    stripePaymentIntentId: paymentIntentId,
    createdAt: timestamp as unknown as InvoiceDoc["createdAt"],
    paidAt: timestamp as unknown as InvoiceDoc["paidAt"],
  };
  const payment: Omit<PaymentDoc, "id"> = {
    invoiceId: invoiceRef.id,
    orderId,
    studentId: order.studentId,
    firebaseUid: order.firebaseUid,
    amountCents: totalCents,
    method,
    stripePaymentIntentId: paymentIntentId,
    status: "succeeded",
    createdAt: timestamp as unknown as PaymentDoc["createdAt"],
  };
  batch.set(invoiceRef, invoice, { merge: true });
  batch.set(paymentRef, payment, { merge: true });
  batch.update(orderRef, {
    status: "paid",
    fulfillmentStatus: "fulfilled",
    paymentMethod: "stripe",
    stripeCheckoutSessionId: session.id,
    stripePaymentIntentId: paymentIntentId,
    subtotalCents,
    discountCents,
    totalCents,
    paidAt: timestamp,
    updatedAt: timestamp,
  });
  for (const ref of enrollmentRefs) {
    if (!ref) continue;
    batch.set(ref, {
      studentId: order.studentId,
      firebaseUid: order.firebaseUid,
      courseId: ref.id.slice(`order_${orderId}_`.length),
      status: "active",
      progressPercent: 0,
      enrolledAt: timestamp,
      paymentId: orderId,
      orderId,
    });
  }
  if (registrationRef) batch.update(registrationRef, { status: "paid", orderId, updatedAt: timestamp });
  batch.set(adminDb.collection(COLLECTIONS.AUDIT_LOGS).doc(`stripe_order_${orderId}`), {
    actorId: "stripe",
    actorEmail: session.customer_details?.email || session.customer_email || "",
    action: "registration.order_fulfilled",
    entityType: "order",
    entityId: orderId,
    metadata: { sessionId: session.id, courseIds, amountCents: totalCents, discountCents },
    createdAt: timestamp,
  });
  await batch.commit();
}

async function fulfillProAccessSession(session: Stripe.Checkout.Session): Promise<void> {
  if (!adminDb || !stripe || !session.metadata?.orderId || !session.metadata.productId) throw new Error("Pro order metadata is missing");
  if (session.payment_status !== "paid") return;
  const orderRef = adminDb.collection(COLLECTIONS.ORDERS).doc(session.metadata.orderId);
  const orderSnap = await orderRef.get();
  if (!orderSnap.exists) throw new Error("Pro order is not available for fulfillment");
  const order = { id: orderSnap.id, ...orderSnap.data() } as OrderDoc;
  if (order.firebaseUid !== session.metadata.firebaseUid || order.studentId !== session.metadata.studentId) throw new Error("Checkout metadata does not match Pro order");
  if (order.fulfillmentStatus === "fulfilled") return;
  await recordDiscountRedemption(session.metadata || {});
  const productSnap = await adminDb.collection(COLLECTIONS.PRODUCTS).doc(session.metadata.productId).get();
  if (!productSnap.exists) throw new Error("Pro product is not available");
  const product = { id: productSnap.id, ...productSnap.data() } as LmsProductDoc;
  const memberRef = adminDb.collection(COLLECTIONS.TEAM_MEMBERS).doc(order.studentId);
  const memberSnap = await memberRef.get();
  if (!memberSnap.exists) throw new Error("Student profile not found for Pro order");
  const member = memberSnap.data() as TeamMemberDoc;
  const now = Timestamp.now();
  let subscriptionId = "";
  let proExpiresAt: FirebaseFirestore.Timestamp;
  let cancelAtPeriodEnd = false;
  if (product.billingMode === "subscription") {
    subscriptionId = typeof session.subscription === "string" ? session.subscription : session.subscription?.id || "";
    if (!subscriptionId) throw new Error("Stripe subscription is missing from completed checkout");
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    const periodEnd = subscription.items.data[0]?.current_period_end;
    if (!periodEnd) throw new Error("Stripe subscription billing period is unavailable");
    proExpiresAt = Timestamp.fromMillis(periodEnd * 1000);
    cancelAtPeriodEnd = subscription.cancel_at_period_end;
  } else {
    const expiryDate = member.proStatus === "active" && member.proExpiresAt?.toMillis() && member.proExpiresAt.toMillis() > Date.now()
      ? member.proExpiresAt.toDate()
      : now.toDate();
    expiryDate.setMonth(expiryDate.getMonth() + product.durationMonths);
    proExpiresAt = Timestamp.fromDate(expiryDate);
  }

  const paymentIntentId = stripeId(session.payment_intent);
  const invoiceRef = adminDb.collection(COLLECTIONS.INVOICES).doc(`pro_${order.id}`);
  const paymentRef = adminDb.collection(COLLECTIONS.PAYMENTS).doc(paymentIntentId || session.id);
  const batch = adminDb.batch();
  batch.update(memberRef, {
    proStatus: "active",
    proPlanId: product.code,
    proExpiresAt,
    stripeCustomerId: typeof session.customer === "string" ? session.customer : session.customer?.id || null,
    ...(product.billingMode === "subscription" ? { stripeSubscriptionId: subscriptionId, cancelAtPeriodEnd } : {}),
    proOrderId: product.billingMode === "subscription" ? null : order.id,
    updatedAt: now,
  });
  const totalCents = session.amount_total ?? order.totalCents;
  const discountCents = Math.max(Number(session.metadata?.discountCents || 0), session.total_details?.amount_discount ?? 0);
  if (paymentIntentId) {
    const invoice: Omit<InvoiceDoc, "id"> = {
      studentId: order.studentId,
      firebaseUid: order.firebaseUid,
      productId: product.id,
      orderId: order.id,
      ...(subscriptionId ? { stripeSubscriptionId: subscriptionId } : {}),
      amountCents: order.subtotalCents,
      discountCents,
      discountCode: session.metadata?.discountCode,
      netCents: totalCents,
      currency: session.currency || product.currency || "usd",
      status: "paid",
      method: "stripe",
      stripeSessionId: session.id,
      stripePaymentIntentId: paymentIntentId,
      createdAt: now as unknown as InvoiceDoc["createdAt"],
      paidAt: now as unknown as InvoiceDoc["paidAt"],
    };
    const payment: Omit<PaymentDoc, "id"> = {
      invoiceId: invoiceRef.id,
      orderId: order.id,
      studentId: order.studentId,
      firebaseUid: order.firebaseUid,
      amountCents: totalCents,
      method: session.payment_method_types?.includes("us_bank_account") ? "us_bank_account" : "card",
      stripePaymentIntentId: paymentIntentId,
      status: "succeeded",
      createdAt: now as unknown as PaymentDoc["createdAt"],
    };
    batch.set(invoiceRef, invoice, { merge: true });
    batch.set(paymentRef, payment, { merge: true });
  }
  batch.update(orderRef, {
    status: "paid",
    fulfillmentStatus: "fulfilled",
    paymentMethod: "stripe",
    stripeCheckoutSessionId: session.id,
    stripePaymentIntentId: paymentIntentId || null,
    ...(subscriptionId ? { stripeSubscriptionId: subscriptionId } : {}),
    subtotalCents: order.subtotalCents,
    discountCents,
    totalCents,
    paidAt: now,
    updatedAt: now,
  });
  batch.set(adminDb.collection(COLLECTIONS.AUDIT_LOGS).doc(`pro_order_${order.id}`), {
    actorId: "stripe",
    actorEmail: session.customer_details?.email || session.customer_email || "",
    action: "pro_access.activated",
    entityType: "order",
    entityId: order.id,
    metadata: { productId: product.id, productCode: product.code, subscriptionId, expiresAt: proExpiresAt.toDate().toISOString() },
    createdAt: now,
  });
  await batch.commit();
}

async function handleLegacyCourseCheckout(session: Stripe.Checkout.Session): Promise<void> {
  if (!adminDb) return;
  const { courseId, firebaseUid } = session.metadata || {};
  if (!courseId || !firebaseUid || session.payment_status !== "paid") return;
  const student = await adminDb.collection(COLLECTIONS.TEAM_MEMBERS).where("firebaseUid", "==", firebaseUid).limit(1).get();
  if (student.empty) throw new Error("Student record not found for legacy checkout");
  const studentId = student.docs[0].id;
  const duplicate = await adminDb.collection(COLLECTIONS.INVOICES).where("stripeSessionId", "==", session.id).limit(1).get();
  if (!duplicate.empty) return;
  const paymentIntentId = stripeId(session.payment_intent);
  const now = Timestamp.now();
  const invoiceRef = adminDb.collection(COLLECTIONS.INVOICES).doc(`legacy_${session.id}`);
  const paymentRef = adminDb.collection(COLLECTIONS.PAYMENTS).doc(paymentIntentId || session.id);
  const enrollmentQuery = await adminDb.collection(COLLECTIONS.ENROLLMENTS)
    .where("studentId", "==", studentId)
    .where("courseId", "==", courseId)
    .where("status", "in", ["active", "completed"])
    .limit(1)
    .get();
  const batch = adminDb.batch();
  batch.set(invoiceRef, {
    studentId,
    firebaseUid,
    courseId,
    amountCents: session.amount_subtotal ?? session.amount_total ?? 0,
    discountCents: session.total_details?.amount_discount ?? 0,
    netCents: session.amount_total ?? 0,
    currency: session.currency || "usd",
    status: "paid",
    method: "stripe",
    stripeSessionId: session.id,
    stripePaymentIntentId: paymentIntentId,
    createdAt: now,
    paidAt: now,
  });
  batch.set(paymentRef, {
    invoiceId: invoiceRef.id,
    studentId,
    firebaseUid,
    amountCents: session.amount_total ?? 0,
    method: session.payment_method_types?.includes("us_bank_account") ? "us_bank_account" : "card",
    stripePaymentIntentId: paymentIntentId,
    status: "succeeded",
    createdAt: now,
  });
  if (enrollmentQuery.empty) {
    batch.set(adminDb.collection(COLLECTIONS.ENROLLMENTS).doc(`legacy_${session.id}_${courseId}`), {
      studentId,
      firebaseUid,
      courseId,
      status: "active",
      progressPercent: 0,
      enrolledAt: now,
      paymentId: session.id,
    });
  }
  await batch.commit();
}

async function syncProSubscription(subscription: Stripe.Subscription, fallbackUid = ""): Promise<void> {
  if (!adminDb) throw new Error("Database unavailable for subscription sync");
  const uid = subscription.metadata.firebaseUid || fallbackUid;
  if (!uid) throw new Error("Stripe subscription has no V+ user metadata");
  const members = await adminDb.collection(COLLECTIONS.TEAM_MEMBERS).where("firebaseUid", "==", uid).limit(1).get();
  if (members.empty) throw new Error("V+ profile not found for Stripe subscription");
  const memberRef = members.docs[0].ref;
  const status = subscription.status === "active" || subscription.status === "trialing"
    ? "active"
    : subscription.status === "canceled"
      ? "canceled"
      : "past_due";
  const periodEnd = subscription.items.data[0]?.current_period_end;
  await memberRef.update({
    proStatus: status,
    proPlanId: subscription.metadata.productCode || members.docs[0].get("proPlanId") || null,
    ...(periodEnd ? { proExpiresAt: Timestamp.fromMillis(periodEnd * 1000) } : {}),
    stripeCustomerId: typeof subscription.customer === "string" ? subscription.customer : subscription.customer.id,
    stripeSubscriptionId: subscription.id,
    cancelAtPeriodEnd: subscription.cancel_at_period_end,
    updatedAt: Timestamp.now(),
  });
}

async function handleSubscriptionInvoice(invoice: Stripe.Invoice, failed: boolean): Promise<void> {
  if (!stripe || !adminDb) return;
  const parent = invoice.parent as unknown as { subscription_details?: { subscription?: string | { id: string } } } | null;
  const subscriptionValue = parent?.subscription_details?.subscription;
  const subscriptionId = typeof subscriptionValue === "string" ? subscriptionValue : subscriptionValue?.id;
  if (!subscriptionId) return;
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  await syncProSubscription(subscription);
  const uid = subscription.metadata.firebaseUid;
  if (!uid) return;
  const memberSnap = await adminDb.collection(COLLECTIONS.TEAM_MEMBERS).where("firebaseUid", "==", uid).limit(1).get();
  if (memberSnap.empty) return;
  const member = memberSnap.docs[0];
  const invoiceRef = adminDb.collection(COLLECTIONS.INVOICES).doc(`stripe_${invoice.id}`);
  const now = Timestamp.now();
  const invoiceData: Omit<InvoiceDoc, "id"> = {
    studentId: member.id,
    firebaseUid: uid,
    productId: subscription.metadata.productId || undefined,
    stripeSubscriptionId: subscription.id,
    amountCents: invoice.subtotal,
    discountCents: Math.max(0, invoice.subtotal - invoice.amount_paid),
    netCents: invoice.amount_paid,
    currency: invoice.currency || "usd",
    status: failed ? "pending" : "paid",
    method: "stripe",
    createdAt: now as unknown as InvoiceDoc["createdAt"],
    ...(!failed ? { paidAt: now as unknown as InvoiceDoc["paidAt"] } : {}),
  };
  const batch = adminDb.batch();
  if (failed) batch.update(member.ref, { proStatus: "past_due", updatedAt: now });
  batch.set(invoiceRef, invoiceData, { merge: true });
  batch.set(adminDb.collection(COLLECTIONS.PAYMENTS).doc(`invoice_${invoice.id}`), {
    invoiceId: invoiceRef.id,
    studentId: member.id,
    firebaseUid: uid,
    amountCents: invoice.amount_paid,
    method: "card",
    status: failed ? "failed" : "succeeded",
    createdAt: now,
  }, { merge: true });
  await batch.commit();
}

async function markOrderPaymentFailed(session: Stripe.Checkout.Session): Promise<void> {
  if (!adminDb || !session.metadata?.orderId) return;
  const now = Timestamp.now();
  const batch = adminDb.batch();
  batch.update(adminDb.collection(COLLECTIONS.ORDERS).doc(session.metadata.orderId), {
    status: "failed",
    fulfillmentStatus: "failed",
    updatedAt: now,
  });
  if (session.metadata.registrationSubmissionId) {
    batch.update(adminDb.collection(COLLECTIONS.REGISTRATION_SUBMISSIONS).doc(session.metadata.registrationSubmissionId), {
      status: "checkout_pending",
      updatedAt: now,
    });
  }
  await batch.commit();
}

export async function POST(req: NextRequest) {
  if (!stripe || !adminDb) return NextResponse.json({ error: "Not configured" }, { status: 503 });
  const signature = req.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!signature || !webhookSecret) return NextResponse.json({ error: "Missing signature" }, { status: 400 });

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(await req.text(), signature, webhookSecret);
  } catch (error) {
    console.error("[stripe/webhook] signature verification failed:", error);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed":
      case "checkout.session.async_payment_succeeded": {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.metadata?.purchaseKind === "pro-access") await fulfillProAccessSession(session);
        else if (session.metadata?.orderId) await fulfillRegistrationOrder(session);
        else await handleLegacyCourseCheckout(session);
        break;
      }
      case "checkout.session.async_payment_failed":
      case "checkout.session.expired":
        await markOrderPaymentFailed(event.data.object as Stripe.Checkout.Session);
        break;
      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted":
        await syncProSubscription(event.data.object as Stripe.Subscription);
        break;
      case "invoice.paid":
        await handleSubscriptionInvoice(event.data.object as Stripe.Invoice, false);
        break;
      case "invoice.payment_failed":
        await handleSubscriptionInvoice(event.data.object as Stripe.Invoice, true);
        break;
      case "charge.refunded": {
        const charge = event.data.object as Stripe.Charge;
        const paymentIntentId = stripeId(charge.payment_intent);
        const isFullRefund = charge.amount_refunded >= charge.amount;
        if (paymentIntentId) {
          const payment = await adminDb.collection(COLLECTIONS.PAYMENTS).doc(paymentIntentId).get();
          await adminDb.collection(COLLECTIONS.PAYMENTS).doc(paymentIntentId).set({
            status: isFullRefund ? "refunded" : "partially_refunded",
            refundedCents: charge.amount_refunded,
            refundedAt: Timestamp.now(),
          }, { merge: true });
          const orderId = payment.data()?.orderId as string | undefined;
          if (orderId) {
            const now = Timestamp.now();
            const refundStatus = isFullRefund ? "refunded" : "partially_refunded";
            const orderRef = adminDb.collection(COLLECTIONS.ORDERS).doc(orderId);
            await orderRef.update({ status: refundStatus, refundedCents: charge.amount_refunded, ...(isFullRefund ? { refundedAt: now } : {}), updatedAt: now });
            await adminDb.collection(COLLECTIONS.INVOICES).doc(`order_${orderId}`).set({ status: refundStatus, refundedCents: charge.amount_refunded, ...(isFullRefund ? { refundedAt: now } : {}) }, { merge: true });
            const order = await orderRef.get();
            if (isFullRefund) {
              const registrationId = order.get("registrationSubmissionId") as string | undefined;
              if (registrationId) await adminDb.collection(COLLECTIONS.REGISTRATION_SUBMISSIONS).doc(registrationId).update({ status: "cancelled", updatedAt: now });
              const enrollments = await adminDb.collection(COLLECTIONS.ENROLLMENTS).where("orderId", "==", orderId).get();
              await Promise.all(enrollments.docs.map((doc) => doc.ref.update({ status: "cancelled", updatedAt: now })));
            }
            const productId = order.get("productId") as string | undefined;
            const studentId = order.get("studentId") as string | undefined;
            if (productId && studentId && isFullRefund) {
              const [product, member] = await Promise.all([
                adminDb.collection(COLLECTIONS.PRODUCTS).doc(productId).get(),
                adminDb.collection(COLLECTIONS.TEAM_MEMBERS).doc(studentId).get(),
              ]);
              const billingMode = product.get("billingMode");
              const subscriptionId = member.get("stripeSubscriptionId") as string | undefined;
              const orderSubscriptionId = order.get("stripeSubscriptionId") as string | undefined;
              const shouldRevoke = billingMode === "subscription"
                ? Boolean(subscriptionId && subscriptionId === orderSubscriptionId)
                : member.get("proOrderId") === orderId;
              if (shouldRevoke) {
                if (billingMode === "subscription" && subscriptionId && stripe) {
                  await stripe.subscriptions.cancel(subscriptionId).catch((cancelError) => console.error("[stripe/webhook] failed to cancel refunded Pro subscription:", cancelError));
                }
                await member.ref.update({ proStatus: "canceled", proOrderId: null, proExpiresAt: now, cancelAtPeriodEnd: false, updatedAt: now });
              }
            }
          } else {
            const invoiceIdValue = (charge as unknown as { invoice?: string | { id: string } | null }).invoice;
            const stripeInvoiceId = typeof invoiceIdValue === "string" ? invoiceIdValue : invoiceIdValue?.id;
            if (stripeInvoiceId) {
              const now = Timestamp.now();
              const invoiceRef = adminDb.collection(COLLECTIONS.INVOICES).doc(`stripe_${stripeInvoiceId}`);
              const invoice = await invoiceRef.get();
              const productId = invoice.get("productId") as string | undefined;
              const studentId = invoice.get("studentId") as string | undefined;
              if (productId && studentId && invoice.exists) {
                const refundStatus = isFullRefund ? "refunded" : "partially_refunded";
                await invoiceRef.set({ status: refundStatus, refundedCents: charge.amount_refunded, ...(isFullRefund ? { refundedAt: now } : {}) }, { merge: true });
                await adminDb.collection(COLLECTIONS.PAYMENTS).doc(`invoice_${stripeInvoiceId}`).set({ status: refundStatus, refundedCents: charge.amount_refunded, refundedAt: now }, { merge: true });
                const [product, member] = await Promise.all([
                  adminDb.collection(COLLECTIONS.PRODUCTS).doc(productId).get(),
                  adminDb.collection(COLLECTIONS.TEAM_MEMBERS).doc(studentId).get(),
                ]);
                const subscriptionId = member.get("stripeSubscriptionId") as string | undefined;
                const invoiceSubscriptionId = invoice.get("stripeSubscriptionId") as string | undefined;
                if (isFullRefund && product.get("kind") === "pro_access" && subscriptionId && subscriptionId === invoiceSubscriptionId) {
                  if (stripe) await stripe.subscriptions.cancel(subscriptionId).catch((cancelError) => console.error("[stripe/webhook] failed to cancel refunded subscription:", cancelError));
                  await member.ref.update({ proStatus: "canceled", proOrderId: null, proExpiresAt: now, cancelAtPeriodEnd: false, updatedAt: now });
                }
              }
            }
          }
        }
        break;
      }
    }
    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error) {
    console.error("[stripe/webhook] handler failed:", error);
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}
