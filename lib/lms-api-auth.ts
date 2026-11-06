import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase-admin";

export interface LmsApiActor {
  uid: string;
  email: string;
  studentId: string;
  role: "admin" | "instructor" | "student";
}

export class LmsApiError extends Error {
  constructor(
    public readonly status: number,
    message: string
  ) {
    super(message);
    this.name = "LmsApiError";
  }
}

export async function requireLmsActor(req: NextRequest): Promise<LmsApiActor> {
  if (!adminAuth || !adminDb) {
    throw new LmsApiError(503, "Authentication service is unavailable");
  }
  const authHeader = req.headers.get("authorization") || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
  if (!token) throw new LmsApiError(401, "Authentication required");

  let decoded: Awaited<ReturnType<NonNullable<typeof adminAuth>["verifyIdToken"]>>;
  try {
    decoded = await adminAuth.verifyIdToken(token);
  } catch {
    throw new LmsApiError(401, "Authentication required");
  }

  const memberSnap = await adminDb
    .collection("teamMembers")
    .where("firebaseUid", "==", decoded.uid)
    .limit(1)
    .get();
  if (memberSnap.empty) throw new LmsApiError(403, "Student profile is required");
  const member = memberSnap.docs[0];
  const rawRole = member.get("role");
  if (rawRole !== "admin" && rawRole !== "instructor" && rawRole !== "student" && rawRole !== "team") {
    throw new LmsApiError(403, "Access denied");
  }
  // Capture "team" members are staff-tier — map to instructor in the LMS actor.
  const role: LmsApiActor["role"] = rawRole === "team" ? "instructor" : rawRole;
  return {
    uid: decoded.uid,
    email: decoded.email || "",
    studentId: member.id,
    role,
  };
}

export async function requireLmsAdmin(req: NextRequest): Promise<LmsApiActor> {
  const actor = await requireLmsActor(req);
  if (actor.role !== "admin") throw new LmsApiError(403, "Administrator access required");
  return actor;
}

export async function requireLmsStaff(req: NextRequest): Promise<LmsApiActor> {
  const actor = await requireLmsActor(req);
  if (actor.role !== "admin" && actor.role !== "instructor") {
    throw new LmsApiError(403, "Staff access required");
  }
  return actor;
}

export function lmsApiError(error: unknown): NextResponse {
  if (error instanceof LmsApiError) {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }
  console.error("[LMS API] request failed:", error);
  return NextResponse.json({ error: "The request could not be completed" }, { status: 500 });
}
