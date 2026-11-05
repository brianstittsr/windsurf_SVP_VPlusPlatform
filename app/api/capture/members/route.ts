import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { COLLECTIONS } from "@/lib/schema";
import { requireUser } from "@/lib/capture/server-auth";

/** GET /api/capture/members — admin/team members for owner & assignee pickers. */
export async function GET(req: NextRequest) {
  const user = await requireUser(req);
  if (user instanceof NextResponse) return user;
  if (!adminDb) return NextResponse.json({ error: "Database unavailable" }, { status: 500 });

  interface MemberRow {
    id: string;
    role?: string;
    deletedAt?: unknown;
    firstName?: string;
    lastName?: string;
    emailPrimary?: string;
    firebaseUid?: string;
  }
  const snap = await adminDb.collection(COLLECTIONS.TEAM_MEMBERS).get();
  const members = snap.docs
    .map((d) => ({ id: d.id, ...d.data() }) as MemberRow)
    .filter((m) => ["admin", "team"].includes(m.role || "") && !m.deletedAt)
    .map((m) => ({
      id: m.id,
      name: `${m.firstName || ""} ${m.lastName || ""}`.trim() || m.emailPrimary || "Unknown",
      email: m.emailPrimary || "",
      role: m.role,
      firebaseUid: m.firebaseUid,
    }))
    .sort((a, b) => a.name.localeCompare(b.name));

  return NextResponse.json({ members });
}
