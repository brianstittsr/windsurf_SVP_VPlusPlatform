import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { lmsApiError, requireLmsActor } from "@/lib/lms-api-auth";
import { COLLECTIONS, type CourseModuleDoc } from "@/lib/schema";

export async function GET(req: NextRequest) {
  try {
    const actor = await requireLmsActor(req);
    if (!adminDb) return NextResponse.json({ error: "Course content unavailable" }, { status: 503 });
    const courseId = req.nextUrl.searchParams.get("courseId") || "";
    if (!courseId) return NextResponse.json({ error: "courseId is required" }, { status: 400 });
    if (actor.role === "student") {
      const enrollment = await adminDb.collection(COLLECTIONS.ENROLLMENTS)
        .where("firebaseUid", "==", actor.uid)
        .where("courseId", "==", courseId)
        .where("status", "in", ["active", "completed"])
        .limit(1)
        .get();
      if (enrollment.empty) return NextResponse.json({ error: "Course enrollment required" }, { status: 403 });
    }
    const snapshot = await adminDb.collection(COLLECTIONS.COURSE_MODULES)
      .where("courseId", "==", courseId)
      .orderBy("order", "asc")
      .get();
    const modules = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as CourseModuleDoc);
    return NextResponse.json({ data: modules });
  } catch (error) {
    return lmsApiError(error);
  }
}
