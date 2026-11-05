import { randomInt, randomUUID, createHash } from "crypto";
import { Timestamp } from "firebase-admin/firestore";
import { adminDb, adminStorage } from "@/lib/firebase-admin";
import { createCertificatePdfBytes } from "@/lib/certificate-pdf";
import { COLLECTIONS, type CertificateDoc, type EnrollmentDoc, type StudentDocumentDoc } from "@/lib/schema";

export interface CertificateIssueResult {
  status: "issued" | "existing" | "incomplete" | "not_eligible" | "unavailable";
  certificateId?: string;
  certificateNumber?: string;
  publicCredentialId?: string;
}

/** True when every course module and required exam is complete for the enrollment. */
export async function enrollmentIsComplete(enrollment: EnrollmentDoc, courseId: string): Promise<boolean> {
  if (!adminDb) return false;
  const modules = await adminDb.collection(COLLECTIONS.COURSE_MODULES).where("courseId", "==", courseId).get();
  if (modules.empty) {
    const [runtime, banks] = await Promise.all([
      adminDb.collection(COLLECTIONS.SCORM_RUNTIME).where("enrollmentId", "==", enrollment.id).limit(1).get(),
      adminDb.collection(COLLECTIONS.QUESTION_BANKS).where("courseId", "==", courseId).where("type", "==", "exam").get(),
    ]);
    const scormDone = !runtime.empty && ["completed", "passed"].includes(String(runtime.docs[0].get("lessonStatus") || "").toLowerCase());
    if (scormDone) return true;
    if (banks.empty) return false;
    const attempts = await adminDb.collection(COLLECTIONS.EXAM_ATTEMPTS).where("enrollmentId", "==", enrollment.id).where("passed", "==", true).get();
    return attempts.docs.some((attempt) => banks.docs.some((bank) => bank.id === attempt.get("quizId")));
  }
  const progress = await adminDb.collection(COLLECTIONS.LESSON_PROGRESS).where("enrollmentId", "==", enrollment.id).get();
  const completedModuleIds = new Set(progress.docs.filter((doc) => doc.get("status") === "completed").map((doc) => doc.get("moduleId")));
  if (!modules.docs.every((module) => completedModuleIds.has(module.id))) return false;
  const exams = await adminDb.collection(COLLECTIONS.QUESTION_BANKS).where("courseId", "==", courseId).where("type", "==", "exam").get();
  if (exams.empty) return true;
  const attempts = await adminDb.collection(COLLECTIONS.EXAM_ATTEMPTS).where("enrollmentId", "==", enrollment.id).where("passed", "==", true).get();
  return attempts.docs.some((attempt) => exams.docs.some((exam) => exam.id === attempt.get("quizId")));
}

async function certificateNumber(): Promise<string> {
  if (!adminDb) throw new Error("Certificate service unavailable");
  for (let attempt = 0; attempt < 5; attempt++) {
    const value = `EFVS-${new Date().getFullYear()}-${randomInt(100000, 1000000)}`;
    const duplicate = await adminDb.collection(COLLECTIONS.CERTIFICATES).where("certificateNumber", "==", value).limit(1).get();
    if (duplicate.empty) return value;
  }
  throw new Error("Unable to allocate a unique certificate number");
}

/**
 * Idempotent certificate issuance. Verifies real completion before issuing,
 * returns the existing certificate on repeated calls, and never throws for
 * ordinary ineligible states so completion paths can call it safely.
 */
export async function tryIssueCertificate(enrollmentId: string, actorId: string, actorEmail = ""): Promise<CertificateIssueResult> {
  if (!adminDb || !adminStorage) return { status: "unavailable" };
  const enrollmentSnap = await adminDb.collection(COLLECTIONS.ENROLLMENTS).doc(enrollmentId).get();
  if (!enrollmentSnap.exists) return { status: "not_eligible" };
  const enrollment = { id: enrollmentSnap.id, ...enrollmentSnap.data() } as EnrollmentDoc;
  if (!["active", "completed"].includes(enrollment.status)) return { status: "not_eligible" };

  const existing = await adminDb.collection(COLLECTIONS.CERTIFICATES).where("enrollmentId", "==", enrollment.id).limit(1).get();
  if (!existing.empty) {
    const doc = existing.docs[0];
    return { status: "existing", certificateId: doc.id, certificateNumber: doc.get("certificateNumber"), publicCredentialId: doc.get("publicCredentialId") };
  }

  const courseSnap = await adminDb.collection(COLLECTIONS.COURSES).doc(enrollment.courseId).get();
  if (!courseSnap.exists) return { status: "not_eligible" };
  const course = courseSnap.data() as { code: string; title: string; badge?: { title?: string; issueOnCompletion?: boolean } };
  if (course.badge?.issueOnCompletion === false) return { status: "not_eligible" };
  if (!(await enrollmentIsComplete(enrollment, enrollment.courseId))) return { status: "incomplete" };

  const studentSnap = await adminDb.collection(COLLECTIONS.TEAM_MEMBERS).doc(enrollment.studentId).get();
  if (!studentSnap.exists) return { status: "not_eligible" };
  const student = studentSnap.data() as { firstName?: string; lastName?: string };
  const now = Timestamp.now();
  const certRef = adminDb.collection(COLLECTIONS.CERTIFICATES).doc();
  const certData = {
    certificateNumber: await certificateNumber(),
    studentId: enrollment.studentId,
    firebaseUid: enrollment.firebaseUid,
    studentName: `${student.firstName || ""} ${student.lastName || ""}`.trim(),
    courseId: enrollment.courseId,
    courseCode: course.code,
    courseTitle: course.title,
    enrollmentId: enrollment.id,
    issuedAt: now,
    issuedBy: "EFVS Academy",
    publicCredentialId: randomUUID().replaceAll("-", ""),
    publicSharingEnabled: false,
    publicNameConsent: false,
    badgeTitle: course.badge?.title || `${course.code} — Completion`,
  };
  const cert = { id: certRef.id, ...certData } as unknown as CertificateDoc;
  const pdfBytes = createCertificatePdfBytes(cert);
  const storagePath = `student-documents/${enrollment.firebaseUid}/certificates/${certRef.id}.pdf`;
  await adminStorage.bucket().file(storagePath).save(Buffer.from(pdfBytes), {
    resumable: false,
    metadata: { contentType: "application/pdf", cacheControl: "private, no-store", metadata: { firebaseUid: enrollment.firebaseUid, certificateId: certRef.id } },
  });
  const checksumSha256 = createHash("sha256").update(Buffer.from(pdfBytes)).digest("hex");
  const studentDocument: Omit<StudentDocumentDoc, "id"> = {
    firebaseUid: enrollment.firebaseUid,
    studentId: enrollment.studentId,
    kind: "course_certificate",
    displayName: `${course.code} completion certificate`,
    fileName: `${certData.certificateNumber}.pdf`,
    contentType: "application/pdf",
    sizeBytes: pdfBytes.length,
    storagePath,
    checksumSha256,
    courseId: enrollment.courseId,
    enrollmentId: enrollment.id,
    certificateId: certRef.id,
    uploadedBy: "EFVS Academy",
    createdAt: now as unknown as StudentDocumentDoc["createdAt"],
  };
  await certRef.set(certData);
  await adminDb.collection(COLLECTIONS.STUDENT_DOCUMENTS).doc(`certificate_${certRef.id}`).set(studentDocument);
  await adminDb.collection(COLLECTIONS.AUDIT_LOGS).add({
    actorId,
    actorEmail,
    action: "certificate.issued",
    entityType: "certificate",
    entityId: certRef.id,
    metadata: { enrollmentId: enrollment.id, courseId: enrollment.courseId, automatic: true },
    createdAt: now,
  });
  return { status: "issued", certificateId: certRef.id, certificateNumber: certData.certificateNumber, publicCredentialId: certData.publicCredentialId };
}
