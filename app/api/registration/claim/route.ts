import { NextRequest, NextResponse } from "next/server";
import { Timestamp } from "firebase-admin/firestore";
import type { Timestamp as ClientTimestamp } from "firebase/firestore";
import { adminDb } from "@/lib/firebase-admin";
import { COLLECTIONS, type OrderDoc, type RegistrationInviteDoc, type RegistrationSubmissionDoc, type StudentDocumentDoc } from "@/lib/schema";
import { hashRegistrationToken } from "@/lib/registration-security";
import { lmsApiError, LmsApiError, requireLmsActor } from "@/lib/lms-api-auth";

function tokenFromRequest(req: NextRequest, body?: { token?: unknown }): string {
  const token = typeof body?.token === "string" ? body.token : req.nextUrl.searchParams.get("token") || "";
  if (token.length < 32 || token.length > 200) throw new LmsApiError(400, "Invalid registration invitation");
  return token;
}

async function findInvite(token: string) {
  if (!adminDb) throw new LmsApiError(503, "Registration service is unavailable");
  const snap = await adminDb.collection(COLLECTIONS.REGISTRATION_INVITES)
    .where("tokenHash", "==", hashRegistrationToken(token))
    .limit(1)
    .get();
  if (snap.empty) throw new LmsApiError(404, "Invitation is invalid or has expired");
  const doc = snap.docs[0];
  return { ref: doc.ref, id: doc.id, data: doc.data() as RegistrationInviteDoc };
}

export async function GET(req: NextRequest) {
  try {
    if (!adminDb) return NextResponse.json({ error: "Registration service is unavailable" }, { status: 503 });
    const invite = await findInvite(tokenFromRequest(req));
    if (invite.data.claimedAt || invite.data.revokedAt || invite.data.expiresAt.toMillis() <= Date.now()) {
      return NextResponse.json({ error: "Invitation is invalid or has expired" }, { status: 410 });
    }
    const submissionSnap = await adminDb.collection(COLLECTIONS.REGISTRATION_SUBMISSIONS).doc(invite.data.submissionId).get();
    if (!submissionSnap.exists) return NextResponse.json({ error: "Registration not found" }, { status: 404 });
    const submission = submissionSnap.data() as RegistrationSubmissionDoc;
    if (submission.status !== "approved") return NextResponse.json({ error: "Registration is not approved" }, { status: 409 });
    return NextResponse.json({ data: {
      email: invite.data.email,
      fullName: submission.fullName,
      courses: submission.selectedCoursesSnapshot.map((course) => ({ code: course.code, title: course.title, priceCents: course.priceCents })),
      sponsorshipApproved: submission.sponsorshipApproved === true,
      expiresAt: invite.data.expiresAt.toDate().toISOString(),
    } });
  } catch (error) {
    return lmsApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const actor = await requireLmsActor(req);
    if (!adminDb) return NextResponse.json({ error: "Registration service is unavailable" }, { status: 503 });
    const body = (await req.json()) as { token?: unknown };
    const invite = await findInvite(tokenFromRequest(req, body));
    if (actor.email.toLowerCase() !== invite.data.email.toLowerCase()) {
      throw new LmsApiError(403, "Sign in with the email address that received this invitation");
    }
    const submissionRef = adminDb.collection(COLLECTIONS.REGISTRATION_SUBMISSIONS).doc(invite.data.submissionId);
    const now = Timestamp.now();
    const typedNow = now as unknown as ClientTimestamp;
    const submission = await adminDb.runTransaction(async (transaction) => {
      const [inviteSnap, submissionSnap] = await Promise.all([transaction.get(invite.ref), transaction.get(submissionRef)]);
      if (!inviteSnap.exists || !submissionSnap.exists) throw new LmsApiError(404, "Invitation or registration not found");
      const currentInvite = inviteSnap.data() as RegistrationInviteDoc;
      const currentSubmission = submissionSnap.data() as RegistrationSubmissionDoc;
      const alreadyClaimedByThisUser = currentInvite.claimedAt && currentInvite.claimedByUid === actor.uid;
      if (currentInvite.revokedAt || currentInvite.expiresAt.toMillis() <= Date.now() || (currentInvite.claimedAt && !alreadyClaimedByThisUser)) throw new LmsApiError(410, "Invitation has expired, was revoked, or was already used");
      if (currentSubmission.email.toLowerCase() !== actor.email.toLowerCase()) throw new LmsApiError(403, "Invitation does not match this account");
      if (!alreadyClaimedByThisUser && currentSubmission.status !== "approved") throw new LmsApiError(409, "Registration is no longer awaiting account claim");
      const nextStatus = currentSubmission.status === "paid" ? "paid" : "checkout_pending";
      if (!alreadyClaimedByThisUser) transaction.update(invite.ref, { claimedAt: now, claimedByUid: actor.uid });
      transaction.update(submissionRef, { userId: actor.studentId, status: nextStatus, updatedAt: now });
      return { ...currentSubmission, userId: actor.studentId, status: nextStatus, inviteId: invite.id };
    });

    if (submission.veteranStatusVerified) {
      await adminDb.collection(COLLECTIONS.TEAM_MEMBERS).doc(actor.studentId).update({ isVeteran: true, updatedAt: now });
    }
    const documents = submission.attachments || [];
    for (const item of documents) {
      const kind = item.fieldId === "signed-registration"
        ? "signed_registration"
        : /faa|part-107|certificate-proof/i.test(`${item.fieldId} ${item.displayName}`)
          ? "faa_certificate_proof"
          : "other";
      const docData: Omit<StudentDocumentDoc, "id"> = {
        firebaseUid: actor.uid,
        studentId: actor.studentId,
        kind,
        displayName: item.displayName,
        fileName: item.fileName,
        contentType: item.contentType,
        sizeBytes: item.sizeBytes,
        storagePath: item.storagePath,
        checksumSha256: item.checksumSha256,
        registrationSubmissionId: submission.id,
        uploadedBy: "registration-form",
        createdAt: typedNow,
      };
      await adminDb.collection(COLLECTIONS.STUDENT_DOCUMENTS).doc(`${submission.id}_${item.fieldId}`).set(docData, { merge: true });
    }

    let orderId: string | null = null;
    if (submission.sponsorshipApproved) {
      const order: Omit<OrderDoc, "id"> = {
        firebaseUid: actor.uid,
        studentId: actor.studentId,
        registrationSubmissionId: submission.id,
        items: submission.selectedCoursesSnapshot.map((course) => ({
          courseId: course.courseId,
          code: course.code,
          title: course.title,
          unitAmountCents: course.priceCents,
          quantity: 1,
          includedCourseIds: course.includedCourseIds,
        })),
        subtotalCents: submission.totalCents,
        discountCents: submission.totalCents,
        taxCents: 0,
        totalCents: 0,
        currency: submission.currency,
        status: "paid",
        paymentMethod: "sponsored",
        createdAt: typedNow,
        paidAt: typedNow,
      };
      const orderRef = adminDb.collection(COLLECTIONS.ORDERS).doc(`sponsored_${submission.id}`);
      await orderRef.set(order, { merge: true });
      orderId = orderRef.id;
      const courseIds = [...new Set(submission.selectedCoursesSnapshot.flatMap((course) => [course.courseId, ...course.includedCourseIds]))];
      for (const courseId of courseIds) {
        const existing = await adminDb.collection(COLLECTIONS.ENROLLMENTS)
          .where("studentId", "==", actor.studentId)
          .where("courseId", "==", courseId)
          .where("status", "in", ["active", "completed"])
          .limit(1)
          .get();
        if (existing.empty) await adminDb.collection(COLLECTIONS.ENROLLMENTS).doc(`sponsor_${submission.id}_${courseId}`).set({
          studentId: actor.studentId,
          firebaseUid: actor.uid,
          courseId,
          status: "active",
          progressPercent: 0,
          enrolledAt: now,
          paymentId: orderRef.id,
        }, { merge: true });
      }
      await submissionRef.update({ orderId, status: "paid", updatedAt: now });
    }

    await adminDb.collection(COLLECTIONS.AUDIT_LOGS).add({
      actorId: actor.uid,
      actorEmail: actor.email,
      action: "registration.invitation_claimed",
      entityType: "registration",
      entityId: submission.id,
      metadata: { sponsored: submission.sponsorshipApproved === true, orderId },
      createdAt: now,
    });
    return NextResponse.json({ data: { submissionId: submission.id, sponsored: submission.sponsorshipApproved === true, orderId } });
  } catch (error) {
    return lmsApiError(error);
  }
}
