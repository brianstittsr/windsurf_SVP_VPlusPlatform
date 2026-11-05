import { NextRequest, NextResponse } from "next/server";
import { Timestamp } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase-admin";
import { lmsApiError, requireLmsAdmin } from "@/lib/lms-api-auth";
import { COLLECTIONS, type CourseDoc, type InvoiceDoc, type OrderDoc, type PaymentDoc, type TeamMemberDoc } from "@/lib/schema";

export async function POST(req: NextRequest, ctx: { params: Promise<{ invoiceId: string }> }) {
  try {
    const actor = await requireLmsAdmin(req);
    if (!adminDb) return NextResponse.json({ error: "Payment records unavailable" }, { status: 503 });
    const { invoiceId } = await ctx.params;
    const invoiceRef = adminDb.collection(COLLECTIONS.INVOICES).doc(invoiceId);
    const invoiceSnap = await invoiceRef.get();
    if (!invoiceSnap.exists) return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    const invoice = { id: invoiceSnap.id, ...invoiceSnap.data() } as InvoiceDoc;
    if (!invoice.courseId) return NextResponse.json({ error: "Manual course invoices require a course" }, { status: 409 });
    if (invoice.status === "void" || invoice.status === "refunded") return NextResponse.json({ error: "This invoice cannot be settled" }, { status: 409 });
    const [courseSnap, memberSnap] = await Promise.all([
      adminDb.collection(COLLECTIONS.COURSES).doc(invoice.courseId).get(),
      adminDb.collection(COLLECTIONS.TEAM_MEMBERS).doc(invoice.studentId).get(),
    ]);
    if (!courseSnap.exists || !memberSnap.exists) return NextResponse.json({ error: "Course or student profile not found" }, { status: 404 });
    const course = courseSnap.data() as CourseDoc;
    const member = memberSnap.data() as TeamMemberDoc;
    if (!member.firebaseUid) return NextResponse.json({ error: "Student profile is not linked to an Academy account" }, { status: 409 });
    const now = Timestamp.now();
    const orderId = `manual_${invoice.id}`;
    const orderRef = adminDb.collection(COLLECTIONS.ORDERS).doc(orderId);
    const includedCourseIds = course.includedCourseIds || [];
    const order: Omit<OrderDoc, "id"> = {
      firebaseUid: member.firebaseUid,
      studentId: invoice.studentId,
      courseId: courseSnap.id,
      purchaseKind: "manual",
      items: [{ courseId: courseSnap.id, code: course.code, title: course.title, unitAmountCents: invoice.amountCents, quantity: 1, includedCourseIds }],
      subtotalCents: invoice.amountCents,
      discountCents: invoice.discountCents,
      taxCents: 0,
      totalCents: invoice.netCents,
      currency: invoice.currency,
      status: "paid",
      fulfillmentStatus: "fulfilled",
      paymentMethod: "ach-manual",
      createdAt: invoice.createdAt as unknown as OrderDoc["createdAt"],
      paidAt: now as unknown as OrderDoc["paidAt"],
    };
    const courseIds = [...new Set([courseSnap.id, ...includedCourseIds])];
    const enrollments = await Promise.all(courseIds.map(async (courseId) => {
      const existing = await adminDb!.collection(COLLECTIONS.ENROLLMENTS)
        .where("studentId", "==", invoice.studentId)
        .where("courseId", "==", courseId)
        .where("status", "in", ["active", "completed"])
        .limit(1)
        .get();
      return existing.empty ? adminDb!.collection(COLLECTIONS.ENROLLMENTS).doc(`ach_${invoice.id}_${courseId}`) : null;
    }));
    const batch = adminDb.batch();
    batch.set(orderRef, order, { merge: true });
    batch.set(invoiceRef, { status: "paid", method: "ach-manual", firebaseUid: member.firebaseUid, orderId, paidAt: now, updatedAt: now }, { merge: true });
    batch.set(adminDb.collection(COLLECTIONS.PAYMENTS).doc(`ach_${invoice.id}`), {
      invoiceId: invoice.id,
      orderId,
      studentId: invoice.studentId,
      firebaseUid: member.firebaseUid,
      amountCents: invoice.netCents,
      method: "ach-manual",
      status: "succeeded",
      createdAt: now as unknown as PaymentDoc["createdAt"],
    } satisfies Omit<PaymentDoc, "id">, { merge: true });
    for (let index = 0; index < enrollments.length; index++) {
      const ref = enrollments[index];
      if (!ref) continue;
      batch.set(ref, {
        studentId: invoice.studentId,
        firebaseUid: member.firebaseUid,
        courseId: courseIds[index],
        status: "active",
        progressPercent: 0,
        enrolledAt: now,
        paymentId: orderId,
        orderId,
      });
    }
    batch.set(adminDb.collection(COLLECTIONS.AUDIT_LOGS).doc(`manual_invoice_${invoice.id}`), {
      actorId: actor.uid,
      actorEmail: actor.email,
      action: "invoice.settled",
      entityType: "invoice",
      entityId: invoice.id,
      metadata: { orderId, studentId: invoice.studentId, courseIds },
      createdAt: now,
    });
    await batch.commit();
    return NextResponse.json({ data: { invoiceId, orderId, enrolledCourseIds: courseIds } });
  } catch (error) {
    return lmsApiError(error);
  }
}
