import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import {
  verifyScormSession,
  SCORM_SESSION_COOKIE,
} from "@/lib/scorm-session";
import { tryIssueCertificate } from "@/lib/lms-certificates";

/**
 * POST /api/scorm/commit?enrollmentId=..&studentId=..&courseId=..&version=..
 * Persists SCORM runtime (CMI) commit data posted by the scorm-again runtime
 * so learner sessions can resume where they left off.
 * Requires a valid scorm_session cookie; the enrollment must belong to the
 * session user unless they are staff.
 */
export async function POST(req: NextRequest) {
  try {
    if (!adminDb) {
      return NextResponse.json({ error: "Not configured" }, { status: 503 });
    }

    const session = verifyScormSession(
      req.cookies.get(SCORM_SESSION_COOKIE)?.value
    );
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const enrollmentId = searchParams.get("enrollmentId");
    const studentId = searchParams.get("studentId");
    const courseId = searchParams.get("courseId");
    const version =
      searchParams.get("version") === "2004" ? "2004" : "1.2";
    if (!enrollmentId || !studentId || !courseId) {
      return NextResponse.json(
        { error: "enrollmentId, studentId and courseId are required" },
        { status: 400 }
      );
    }

    // Verify the enrollment belongs to the session user (or caller is staff)
    const enrSnap = await adminDb
      .collection("enrollments")
      .doc(enrollmentId)
      .get();
    if (!enrSnap.exists) {
      return NextResponse.json(
        { error: "Enrollment not found" },
        { status: 404 }
      );
    }
    const enr = enrSnap.data() as { firebaseUid?: string; studentId?: string; courseId?: string };
    if (enr.studentId !== studentId || enr.courseId !== courseId) {
      return NextResponse.json({ error: "Enrollment does not match the requested course" }, { status: 403 });
    }
    const packageSnap = await adminDb.collection("scormPackages").doc(session.pkgId).get();
    if (!packageSnap.exists || packageSnap.get("courseId") !== courseId) {
      return NextResponse.json({ error: "SCORM package is not linked to this course" }, { status: 403 });
    }
    if (enr.firebaseUid !== session.uid) {
      const memberSnap = await adminDb
        .collection("teamMembers")
        .where("firebaseUid", "==", session.uid)
        .limit(1)
        .get();
      const role = memberSnap.empty
        ? "student"
        : (memberSnap.docs[0].data().role as string);
      if (role !== "admin" && role !== "instructor") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    // scorm-again posts the rendered CMI commit object (JSON)
    let cmiData: Record<string, unknown> = {};
    try {
      cmiData = (await req.json()) as Record<string, unknown>;
    } catch {
      cmiData = {};
    }

    const flatten = (obj: unknown, prefix = ""): Record<string, string> => {
      const out: Record<string, string> = {};
      if (obj === null || obj === undefined) return out;
      if (typeof obj !== "object" || obj instanceof Date) {
        out[prefix] = String(obj);
        return out;
      }
      for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
        const child = flatten(value, prefix ? `${prefix}.${key}` : key);
        Object.assign(out, child);
      }
      return out;
    };

    const flat = flatten(cmiData);
    const pick = (...keys: string[]) => {
      for (const k of keys) {
        const hit = Object.keys(flat).find((fk) => fk.endsWith(k));
        if (hit) return flat[hit];
      }
      return undefined;
    };

    const runtimeDoc = {
      enrollmentId,
      studentId,
      courseId,
      firebaseUid: session.uid,
      scormVersion: version,
      cmiData: flat,
      lessonStatus:
        pick("cmi.core.lesson_status", "cmi.completion_status") || "",
      scoreRaw:
        pick("cmi.core.score.raw", "cmi.score.raw", "cmi.score.scaled") || "",
      suspendData: pick("cmi.suspend_data") || "",
      updatedAt: new Date(),
    };

    const existing = await adminDb
      .collection("scormRuntime")
      .where("enrollmentId", "==", enrollmentId)
      .limit(1)
      .get();

    if (existing.empty) {
      await adminDb.collection("scormRuntime").add(runtimeDoc);
    } else {
      await existing.docs[0].ref.update(runtimeDoc);
    }

    if (["completed", "passed"].includes(String(runtimeDoc.lessonStatus).toLowerCase())) {
      const completedAt = enrSnap.get("completedAt") || new Date();
      await enrSnap.ref.update({
        progressPercent: 100,
        status: "completed",
        completedAt,
        lastAccessedAt: new Date(),
      });
      try {
        await tryIssueCertificate(enrollmentId, session.uid);
      } catch (error) {
        console.error("[scorm/commit] automatic certificate issuance failed:", error);
      }
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[scorm/commit] error:", error);
    return NextResponse.json({ error: "Commit failed" }, { status: 500 });
  }
}
