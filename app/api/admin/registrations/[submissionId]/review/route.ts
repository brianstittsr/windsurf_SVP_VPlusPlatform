import { NextRequest, NextResponse } from "next/server";
import { Timestamp } from "firebase-admin/firestore";
import { z } from "zod";
import { adminDb } from "@/lib/firebase-admin";
import { isEmailConfigured, sendEmail } from "@/lib/email";
import { createRegistrationInviteToken } from "@/lib/registration-security";
import { lmsApiError, requireLmsAdmin } from "@/lib/lms-api-auth";
import { COLLECTIONS, type RegistrationSubmissionDoc } from "@/lib/schema";

const reviewSchema = z.object({
  decision: z.enum(["approve", "sponsor", "needs_information", "reject"]),
  notes: z.string().max(4000).optional(),
  veteranStatusVerified: z.boolean().optional(),
});

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char] || char);
}

function applicantClaimsVeteranStatus(submission: RegistrationSubmissionDoc): boolean {
  const field = submission.formSnapshot.find((item) => item.purpose === "veteranStatus");
  const value = field ? submission.answers[field.id] : null;
  return value === true || (typeof value === "string" && ["yes", "veteran", "military", "true"].includes(value.toLowerCase()));
}

export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ submissionId: string }> }
) {
  try {
    const actor = await requireLmsAdmin(req);
    if (!adminDb) return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
    const { submissionId } = await ctx.params;
    const parsed = reviewSchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return NextResponse.json({ error: "Invalid review decision or notes" }, { status: 400 });
    const input = parsed.data;
    const notes = String(input.notes || "").trim();
    const submissionRef = adminDb.collection(COLLECTIONS.REGISTRATION_SUBMISSIONS).doc(submissionId);
    const submissionSnap = await submissionRef.get();
    if (!submissionSnap.exists) return NextResponse.json({ error: "Registration not found" }, { status: 404 });
    const submission = submissionSnap.data() as RegistrationSubmissionDoc;
    if (["paid", "cancelled", "rejected"].includes(submission.status)) {
      return NextResponse.json({ error: `Registration is already ${submission.status}` }, { status: 409 });
    }
    if (input.veteranStatusVerified && !["approve", "sponsor"].includes(input.decision)) {
      return NextResponse.json({ error: "Veteran eligibility can only be verified when approving a registration" }, { status: 400 });
    }
    if (input.veteranStatusVerified && !applicantClaimsVeteranStatus(submission)) {
      return NextResponse.json({ error: "The applicant did not indicate veteran status on the form" }, { status: 400 });
    }

    const now = Timestamp.now();
    let inviteUrl: string | undefined;
    let inviteId: string | undefined;
    let inviteToken: string | undefined;
    if (input.decision === "approve" || input.decision === "sponsor") {
      const invite = createRegistrationInviteToken();
      const inviteRef = adminDb.collection(COLLECTIONS.REGISTRATION_INVITES).doc();
      const expiresAt = Timestamp.fromMillis(Date.now() + 7 * 24 * 60 * 60 * 1000);
      const submissionUpdate = await adminDb.runTransaction(async (transaction) => {
        const latest = await transaction.get(submissionRef);
        if (!latest.exists) throw new Error("Registration not found");
        const current = latest.data() as RegistrationSubmissionDoc;
        if (["paid", "cancelled", "rejected"].includes(current.status)) throw new Error(`Registration is already ${current.status}`);
        const priorInviteRef = current.inviteId ? adminDb!.collection(COLLECTIONS.REGISTRATION_INVITES).doc(current.inviteId) : null;
        const priorInvite = priorInviteRef ? await transaction.get(priorInviteRef) : null;
        if (priorInviteRef && priorInvite?.exists) transaction.update(priorInviteRef, { revokedAt: now });
        transaction.set(inviteRef, {
          tokenHash: invite.tokenHash,
          submissionId,
          email: current.email,
          expiresAt,
          createdBy: actor.uid,
          createdAt: now,
        });
        transaction.update(submissionRef, {
          status: "approved",
          sponsorshipApproved: input.decision === "sponsor",
          veteranStatusVerified: input.veteranStatusVerified === true,
          reviewerId: actor.uid,
          reviewerNotes: notes,
          inviteId: inviteRef.id,
          reviewedAt: now,
          updatedAt: now,
        });
        return current;
      });
      inviteId = inviteRef.id;
      inviteToken = invite.token;
      const origin = process.env.NEXT_PUBLIC_APP_URL || "https://strategicvalueplus.com";
      inviteUrl = `${origin}/registration/claim?token=${encodeURIComponent(invite.token)}`;
      if (isEmailConfigured()) {
        try {
          await sendEmail({
            to: [submissionUpdate.email],
            subject: "V+ Academy registration approved",
            html: `<p>Hello ${escapeHtml(submissionUpdate.fullName)},</p><p>Your V+ Academy registration has been approved. Use the secure link below within 7 days to create or access your student account and continue to ${input.decision === "sponsor" ? "activate your sponsored enrollment" : "secure checkout"}.</p><p><a href="${inviteUrl}">Continue registration</a></p><p>This invitation can only be used once. If you did not request it, contact info@strategicvalueplus.com.</p>`,
          });
          inviteUrl = undefined;
        } catch (emailError) {
          console.error("[registration/review] invitation email failed:", emailError);
        }
      }
    } else {
      const status = input.decision === "reject" ? "rejected" : "needs_information";
      await submissionRef.update({ status, reviewerId: actor.uid, reviewerNotes: notes, reviewedAt: now, updatedAt: now });
      if (isEmailConfigured()) {
        const subject = status === "rejected" ? "V+ Academy registration update" : "Additional information needed for V+ registration";
        const message = status === "rejected"
          ? "V+ is unable to approve your registration at this time. Contact V+ Flight School if you have questions."
          : "V+ needs additional information before completing the review of your registration. Please reply to this email or contact V+ Flight School.";
        try {
          await sendEmail({
            to: [submission.email],
            subject,
            html: `<p>Hello ${escapeHtml(submission.fullName)},</p><p>${message}</p><p>V+ Flight School: info@strategicvalueplus.com</p>`,
          });
        } catch (emailError) {
          console.error("[registration/review] applicant notification failed:", emailError);
        }
      }
    }

    await adminDb.collection(COLLECTIONS.AUDIT_LOGS).add({
      actorId: actor.uid,
      actorEmail: actor.email,
      action: `registration.${input.decision}`,
      entityType: "registration",
      entityId: submissionId,
      metadata: { inviteId: inviteId || null, sponsored: input.decision === "sponsor" },
      createdAt: now,
    });
    return NextResponse.json({
      data: {
        submissionId,
        decision: input.decision,
        invitationEmailConfigured: isEmailConfigured(),
        ...(inviteUrl ? { inviteUrl } : {}),
        ...(inviteToken ? { invitationCreated: true } : {}),
      },
    });
  } catch (error) {
    return lmsApiError(error);
  }
}
