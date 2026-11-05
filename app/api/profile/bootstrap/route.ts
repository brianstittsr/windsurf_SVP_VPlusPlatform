import { NextRequest, NextResponse } from "next/server";
import { Timestamp } from "firebase-admin/firestore";
import { z } from "zod";
import { adminAuth, adminDb } from "@/lib/firebase-admin";
import { lmsApiError, LmsApiError } from "@/lib/lms-api-auth";
import { COLLECTIONS, type TeamMemberDoc } from "@/lib/schema";

const bodySchema = z.object({
  firstName: z.string().max(100).optional(),
  lastName: z.string().max(100).optional(),
  phone: z.string().max(40).optional(),
  company: z.string().max(160).optional(),
});

export async function POST(req: NextRequest) {
  try {
    if (!adminAuth || !adminDb) throw new LmsApiError(503, "Profile service is unavailable");
    const authorization = req.headers.get("authorization") || "";
    const token = authorization.startsWith("Bearer ") ? authorization.slice(7) : "";
    if (!token) throw new LmsApiError(401, "Authentication required");
    let decoded: Awaited<ReturnType<typeof adminAuth.verifyIdToken>>;
    try { decoded = await adminAuth.verifyIdToken(token); } catch { throw new LmsApiError(401, "Authentication required"); }
    const parsed = bodySchema.safeParse(await req.json().catch(() => ({})));
    if (!parsed.success) return NextResponse.json({ error: "Invalid profile details" }, { status: 400 });
    const email = (decoded.email || "").trim().toLowerCase();
    if (!email) throw new LmsApiError(400, "A verified email account is required");
    const { firstName = "", lastName = "", phone = "", company = "" } = parsed.data;
    const memberRef = adminDb.collection(COLLECTIONS.TEAM_MEMBERS).doc(decoded.uid);
    const roleRef = adminDb.collection("roles").doc(decoded.uid);
    const now = Timestamp.now();
    let result: { id: string; role: "admin" | "instructor" | "student" } | null = null;

    await adminDb.runTransaction(async (transaction) => {
      const [memberSnap, linkedMembers, emailMatches, roleSnap] = await Promise.all([
        transaction.get(memberRef),
        transaction.get(adminDb!.collection(COLLECTIONS.TEAM_MEMBERS).where("firebaseUid", "==", decoded.uid).limit(1)),
        transaction.get(adminDb!.collection(COLLECTIONS.TEAM_MEMBERS).where("emailPrimary", "==", email).limit(2)),
        transaction.get(roleRef),
      ]);
      if (memberSnap.exists) {
        const member = memberSnap.data() as TeamMemberDoc;
        if (member.firebaseUid !== decoded.uid) throw new LmsApiError(409, "A profile conflict requires EFVS administrator review");
        const role = member.role === "admin" || member.role === "instructor" ? member.role : "student";
        result = { id: memberSnap.id, role };
        if (!roleSnap.exists) transaction.create(roleRef, { role, firebaseUid: decoded.uid, createdAt: now, updatedAt: now });
        return;
      }
      if (!linkedMembers.empty) {
        const linked = linkedMembers.docs[0];
        const member = linked.data() as TeamMemberDoc;
        const role = member.role === "admin" || member.role === "instructor" ? member.role : "student";
        result = { id: linked.id, role };
        if (!roleSnap.exists) transaction.create(roleRef, { role, firebaseUid: decoded.uid, createdAt: now, updatedAt: now });
        return;
      }
      if (!emailMatches.empty) {
        const linked = emailMatches.docs.find((doc) => doc.get("firebaseUid") === decoded.uid);
        if (linked) {
          result = { id: linked.id, role: linked.get("role") === "admin" || linked.get("role") === "instructor" ? linked.get("role") : "student" };
          return;
        }
        throw new LmsApiError(409, "This email is already associated with an EFVS profile. Contact EFVS support to link your account.");
      }
      const role = roleSnap.exists && ["admin", "instructor", "student"].includes(String(roleSnap.get("role")))
        ? roleSnap.get("role") as "admin" | "instructor" | "student"
        : "student";
      transaction.create(memberRef, {
        firebaseUid: decoded.uid,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        expertise: "",
        emailPrimary: email,
        mobile: phone.trim(),
        company: company.trim(),
        isVeteran: false,
        role,
        status: "active",
        createdAt: now,
        updatedAt: now,
      });
      if (!roleSnap.exists) transaction.create(roleRef, { role: "student", firebaseUid: decoded.uid, createdAt: now, updatedAt: now });
      result = { id: memberRef.id, role };
    });

    if (!result) throw new LmsApiError(500, "Could not create student profile");
    return NextResponse.json({ data: result }, { status: 200 });
  } catch (error) {
    return lmsApiError(error);
  }
}
