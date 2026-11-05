import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase-admin";
import {
  signScormSession,
  SCORM_SESSION_COOKIE,
  SCORM_SESSION_TTL_SECONDS,
} from "@/lib/scorm-session";

/**
 * POST /api/scorm/token  { packageId }
 * Authenticated (Firebase ID token in Authorization: Bearer).
 * Verifies the caller is enrolled in the course that owns the SCORM package
 * (or is staff), then issues a signed httpOnly session cookie scoped to
 * /api/scorm so the iframe can stream content and commit runtime state.
 */
export async function POST(req: NextRequest) {
  try {
    if (!adminDb || !adminAuth) {
      return NextResponse.json({ error: "Not configured" }, { status: 503 });
    }

    const authHeader = req.headers.get("authorization") || "";
    const idToken = authHeader.startsWith("Bearer ")
      ? authHeader.slice(7)
      : null;
    if (!idToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const decoded = await adminAuth.verifyIdToken(idToken);

    const body = (await req.json()) as { packageId?: string };
    const packageId = body.packageId;
    if (!packageId) {
      return NextResponse.json(
        { error: "packageId is required" },
        { status: 400 }
      );
    }

    const pkgSnap = await adminDb
      .collection("scormPackages")
      .doc(packageId)
      .get();
    if (!pkgSnap.exists) {
      return NextResponse.json({ error: "Package not found" }, { status: 404 });
    }
    const pkg = pkgSnap.data() as { courseId: string; launchPath: string };

    // Resolve the caller's user record + role
    const memberSnap = await adminDb
      .collection("teamMembers")
      .where("firebaseUid", "==", decoded.uid)
      .limit(1)
      .get();
    if (memberSnap.empty) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    const member = memberSnap.docs[0].data() as { role?: string };
    const isStaff = member.role === "admin" || member.role === "instructor";

    if (!isStaff) {
      const enrollmentSnap = await adminDb
        .collection("enrollments")
        .where("firebaseUid", "==", decoded.uid)
        .where("courseId", "==", pkg.courseId)
        .where("status", "in", ["active", "completed"])
        .limit(1)
        .get();
      if (enrollmentSnap.empty) {
        return NextResponse.json(
          { error: "Not enrolled in this course" },
          { status: 403 }
        );
      }
    }

    const token = signScormSession(decoded.uid, packageId);
    const res = NextResponse.json({
      launchUrl: `/api/scorm/content/${pkg.launchPath}`,
      expiresIn: SCORM_SESSION_TTL_SECONDS,
    });
    res.cookies.set(SCORM_SESSION_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/api/scorm",
      maxAge: SCORM_SESSION_TTL_SECONDS,
    });
    return res;
  } catch (error) {
    console.error("[scorm/token] error:", error);
    return NextResponse.json(
      { error: "Failed to create session" },
      { status: 500 }
    );
  }
}
