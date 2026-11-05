/**
 * Server-side auth for capture API routes.
 *
 * Verifies the caller's Firebase ID token via the Admin SDK and resolves their
 * role from the linked teamMembers doc (teamMembers.firebaseUid / email).
 */
import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase-admin";
import { COLLECTIONS } from "@/lib/schema";

export type CaptureRole = "admin" | "team" | "affiliate" | "consultant" | "none";

export interface CaptureUser {
  uid: string;
  email: string;
  teamMemberId: string | null;
  role: CaptureRole;
  displayName: string;
}

/** Synthetic user used when the Admin SDK isn't configured (local dev only). */
const DEV_USER: CaptureUser = {
  uid: "dev-local",
  email: "dev@localhost",
  teamMemberId: null,
  role: "admin",
  displayName: "Dev User",
};

async function resolveTeamMember(uid: string, email: string) {
  if (!adminDb) return null;
  const ref = adminDb.collection(COLLECTIONS.TEAM_MEMBERS);

  const byUid = await ref.where("firebaseUid", "==", uid).limit(1).get();
  if (!byUid.empty) return { id: byUid.docs[0].id, ...byUid.docs[0].data() } as { id: string; role?: CaptureRole; firstName?: string; lastName?: string };

  if (email) {
    const normalized = email.toLowerCase().trim();
    const byEmail = await ref.where("emailPrimary", "==", normalized).limit(1).get();
    if (!byEmail.empty) return { id: byEmail.docs[0].id, ...byEmail.docs[0].data() } as { id: string; role?: CaptureRole; firstName?: string; lastName?: string };
  }
  return null;
}

/** Require any authenticated caller. Returns the user or a NextResponse error. */
export async function requireUser(req: NextRequest): Promise<CaptureUser | NextResponse> {
  if (!adminAuth || !adminDb) {
    console.warn("[capture] Admin SDK not configured — dev-mode allow. Set FIREBASE_* env vars for real auth.");
    return DEV_USER;
  }

  const header = req.headers.get("authorization") || "";
  const token = header.startsWith("Bearer ") ? header.slice(7).trim() : null;
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const decoded = await adminAuth.verifyIdToken(token);
    const tm = await resolveTeamMember(decoded.uid, decoded.email || "");
    const displayName = tm
      ? (`${tm.firstName || ""} ${tm.lastName || ""}`.trim() || decoded.email || "User")
      : decoded.email || "User";
    return {
      uid: decoded.uid,
      email: decoded.email || "",
      teamMemberId: tm?.id || null,
      role: tm?.role || "none",
      displayName,
    };
  } catch (error) {
    console.error("[capture] token verification failed:", error);
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }
}

/** Require an admin caller. */
export async function requireAdmin(req: NextRequest): Promise<CaptureUser | NextResponse> {
  const user = await requireUser(req);
  if (user instanceof NextResponse) return user;
  if (user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden: admin role required" }, { status: 403 });
  }
  return user;
}

/** Whether this user may write a given opportunity (admin, or the owning team member). */
export function canWriteOpportunity(user: CaptureUser, ownerId?: string | null): boolean {
  if (user.role === "admin") return true;
  if (user.role === "team" && user.teamMemberId && ownerId && user.teamMemberId === ownerId) return true;
  return false;
}
