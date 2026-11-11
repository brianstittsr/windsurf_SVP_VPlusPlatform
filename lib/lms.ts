/**
 * V+ Academy LMS client-side data layer.
 * All functions degrade gracefully when Firebase is not configured.
 */

import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  limit,
  Timestamp,
  increment,
} from "firebase/firestore";
import { auth, db } from "./firebase";
import {
  COLLECTIONS,
  type CourseDoc,
  type CourseModuleDoc,
  type ScormPackageDoc,
  type EnrollmentDoc,
  type LessonProgressDoc,
  type ScormRuntimeDoc,
  type QuestionBankDoc,
  type LearnerQuestionBankDoc,
  type ExamAttemptDoc,
  type CertificateDoc,
  type InvoiceDoc,
  type PaymentDoc,
  type DiscountCodeDoc,
  type TeamMemberDoc,
} from "./schema";

const notConfigured = () => {
  console.warn("Firebase not initialized");
};

// ============================================================================
// Courses
// ============================================================================

export async function listCourses(publishedOnly = true): Promise<CourseDoc[]> {
  if (!db) return [];
  const ref = collection(db, COLLECTIONS.COURSES);
  const q = publishedOnly
    ? query(ref, where("published", "==", true))
    : query(ref);
  const snap = await getDocs(q);
  return snap.docs
    .map((d) => ({ id: d.id, ...d.data() }) as CourseDoc)
    .filter((course) => course.archived !== true);
}

export async function getCourse(courseId: string): Promise<CourseDoc | null> {
  if (!db) return null;
  const snap = await getDoc(doc(db, COLLECTIONS.COURSES, courseId));
  return snap.exists() ? ({ id: snap.id, ...snap.data() } as CourseDoc) : null;
}

export async function saveCourse(
  course: Partial<CourseDoc> & { title: string; code: string },
  courseId?: string
): Promise<string | null> {
  if (!db) {
    notConfigured();
    return null;
  }
  const data = { ...course, updatedAt: Timestamp.now() };
  if (courseId) {
    await updateDoc(doc(db, COLLECTIONS.COURSES, courseId), data);
    return courseId;
  }
  const ref = await addDoc(collection(db, COLLECTIONS.COURSES), {
    ...data,
    createdAt: Timestamp.now(),
  });
  return ref.id;
}

export async function deleteCourse(courseId: string): Promise<void> {
  if (!db) return;
  await updateDoc(doc(db, COLLECTIONS.COURSES, courseId), {
    archived: true,
    published: false,
    archivedAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  });
}

// ============================================================================
// Course Modules
// ============================================================================

export async function listCourseModules(
  courseId: string
): Promise<CourseModuleDoc[]> {
  if (!auth?.currentUser) return [];
  try {
    const token = await auth.currentUser.getIdToken();
    const response = await fetch(`/api/lms/course-modules?courseId=${encodeURIComponent(courseId)}`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "Unable to load course content");
    return (result.data || []) as CourseModuleDoc[];
  } catch (error) {
    console.error("Unable to load course modules:", error);
    return [];
  }
}

export async function saveCourseModule(
  module: Partial<CourseModuleDoc> & { courseId: string; title: string },
  moduleId?: string
): Promise<string | null> {
  if (!db) return null;
  if (moduleId) {
    await updateDoc(doc(db, COLLECTIONS.COURSE_MODULES, moduleId), {
      ...module,
    });
    return moduleId;
  }
  const ref = await addDoc(collection(db, COLLECTIONS.COURSE_MODULES), {
    ...module,
    createdAt: Timestamp.now(),
  });
  return ref.id;
}

export async function deleteCourseModule(moduleId: string): Promise<void> {
  if (!db) return;
  await deleteDoc(doc(db, COLLECTIONS.COURSE_MODULES, moduleId));
}

// ============================================================================
// SCORM Packages
// ============================================================================

export async function getScormPackage(
  packageId: string
): Promise<ScormPackageDoc | null> {
  if (!db) return null;
  const snap = await getDoc(doc(db, COLLECTIONS.SCORM_PACKAGES, packageId));
  return snap.exists()
    ? ({ id: snap.id, ...snap.data() } as ScormPackageDoc)
    : null;
}

export async function listScormPackages(): Promise<ScormPackageDoc[]> {
  if (!db) return [];
  const snap = await getDocs(collection(db, COLLECTIONS.SCORM_PACKAGES));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as ScormPackageDoc);
}

// ============================================================================
// Enrollments
// ============================================================================

export async function getStudentEnrollments(
  studentId: string,
  firebaseUid: string
): Promise<EnrollmentDoc[]> {
  if (!db || !firebaseUid) return [];
  const q = query(
    collection(db, COLLECTIONS.ENROLLMENTS),
    where("firebaseUid", "==", firebaseUid),
    where("studentId", "==", studentId)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as EnrollmentDoc);
}

export async function listEnrollments(): Promise<EnrollmentDoc[]> {
  if (!db) return [];
  const snap = await getDocs(collection(db, COLLECTIONS.ENROLLMENTS));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as EnrollmentDoc);
}

export async function getEnrollment(
  enrollmentId: string
): Promise<EnrollmentDoc | null> {
  if (!db) return null;
  const snap = await getDoc(doc(db, COLLECTIONS.ENROLLMENTS, enrollmentId));
  return snap.exists()
    ? ({ id: snap.id, ...snap.data() } as EnrollmentDoc)
    : null;
}

export async function getEnrollmentForCourse(
  studentId: string,
  courseId: string,
  firebaseUid: string
): Promise<EnrollmentDoc | null> {
  if (!db || !firebaseUid) return null;
  const q = query(
    collection(db, COLLECTIONS.ENROLLMENTS),
    where("firebaseUid", "==", firebaseUid),
    where("studentId", "==", studentId),
    where("courseId", "==", courseId),
    where("status", "in", ["active", "completed"]),
    limit(1)
  );
  const snap = await getDocs(q);
  if (snap.empty) return null;
  const d = snap.docs[0];
  return { id: d.id, ...d.data() } as EnrollmentDoc;
}

export async function markEnrollmentAccessed(
  enrollmentId: string
): Promise<void> {
  if (!db) return;
  await updateDoc(doc(db, COLLECTIONS.ENROLLMENTS, enrollmentId), {
    lastAccessedAt: Timestamp.now(),
  });
}

// ============================================================================
// Lesson Progress
// ============================================================================

export async function getLessonProgress(
  enrollmentId: string
): Promise<LessonProgressDoc[]> {
  if (!db) return [];
  const q = query(
    collection(db, COLLECTIONS.LESSON_PROGRESS),
    where("enrollmentId", "==", enrollmentId)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as LessonProgressDoc);
}

// ============================================================================
// SCORM Runtime Persistence (client-side mirror of CMI data)
// ============================================================================

export async function getScormRuntime(
  enrollmentId: string,
  firebaseUid: string
): Promise<ScormRuntimeDoc | null> {
  if (!db || !firebaseUid) return null;
  const q = query(
    collection(db, COLLECTIONS.SCORM_RUNTIME),
    where("firebaseUid", "==", firebaseUid),
    where("enrollmentId", "==", enrollmentId),
    limit(1)
  );
  const snap = await getDocs(q);
  if (snap.empty) return null;
  const d = snap.docs[0];
  return { id: d.id, ...d.data() } as ScormRuntimeDoc;
}

// ============================================================================
// Question Banks & Exam Attempts
// ============================================================================

export async function listQuestionBanks(
  courseId: string
): Promise<LearnerQuestionBankDoc[]> {
  if (!auth?.currentUser) return [];
  try {
    const token = await auth.currentUser.getIdToken();
    const response = await fetch(`/api/lms/question-banks?courseId=${encodeURIComponent(courseId)}`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "Unable to load course assessments");
    return (result.data || []) as LearnerQuestionBankDoc[];
  } catch (error) {
    console.error("Unable to load question banks:", error);
    return [];
  }
}

export async function saveQuestionBank(
  bank: Partial<QuestionBankDoc> & { courseId: string; title: string },
  bankId?: string
): Promise<string | null> {
  if (!db) return null;
  if (bankId) {
    await updateDoc(doc(db, COLLECTIONS.QUESTION_BANKS, bankId), { ...bank });
    return bankId;
  }
  const ref = await addDoc(collection(db, COLLECTIONS.QUESTION_BANKS), {
    ...bank,
    createdAt: Timestamp.now(),
  });
  return ref.id;
}

/** Staff-only: full banks including answer keys (firestore rules allow staff reads). */
export async function listQuestionBanksFull(
  courseId: string
): Promise<QuestionBankDoc[]> {
  if (!db) return [];
  const q = query(
    collection(db, COLLECTIONS.QUESTION_BANKS),
    where("courseId", "==", courseId)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as QuestionBankDoc);
}

export async function deleteQuestionBank(bankId: string): Promise<void> {
  if (!db) return;
  await deleteDoc(doc(db, COLLECTIONS.QUESTION_BANKS, bankId));
}

export async function getAttemptsFor(
  enrollmentId: string,
  quizId: string,
  firebaseUid: string
): Promise<ExamAttemptDoc[]> {
  if (!db || !firebaseUid) return [];
  const q = query(
    collection(db, COLLECTIONS.EXAM_ATTEMPTS),
    where("firebaseUid", "==", firebaseUid),
    where("enrollmentId", "==", enrollmentId),
    where("quizId", "==", quizId)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as ExamAttemptDoc);
}

export async function listExamAttempts(
  courseId?: string
): Promise<ExamAttemptDoc[]> {
  if (!db) return [];
  const ref = collection(db, COLLECTIONS.EXAM_ATTEMPTS);
  const q = courseId
    ? query(ref, where("courseId", "==", courseId))
    : query(ref);
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as ExamAttemptDoc);
}

// ============================================================================
// Certificates
// ============================================================================

export async function getStudentCertificates(
  studentId: string,
  firebaseUid: string
): Promise<CertificateDoc[]> {
  if (!db || !firebaseUid) return [];
  const q = query(
    collection(db, COLLECTIONS.CERTIFICATES),
    where("firebaseUid", "==", firebaseUid),
    where("studentId", "==", studentId)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as CertificateDoc);
}

export async function getCertificateForEnrollment(
  enrollmentId: string
): Promise<CertificateDoc | null> {
  if (!db) return null;
  const q = query(
    collection(db, COLLECTIONS.CERTIFICATES),
    where("enrollmentId", "==", enrollmentId),
    limit(1)
  );
  const snap = await getDocs(q);
  if (snap.empty) return null;
  const d = snap.docs[0];
  return { id: d.id, ...d.data() } as CertificateDoc;
}

/** Generate a unique certificate number: VP-YYYY-XXXXXX */
export function generateCertificateNumber(): string {
  const year = new Date().getFullYear();
  const rand = Math.floor(100000 + Math.random() * 900000);
  return `VP-${year}-${rand}`;
}


// ============================================================================
// Invoices / Payments
// ============================================================================

export async function createInvoice(
  data: Omit<InvoiceDoc, "id" | "createdAt">
): Promise<string | null> {
  if (!db) return null;
  const ref = await addDoc(collection(db, COLLECTIONS.INVOICES), {
    ...data,
    createdAt: Timestamp.now(),
  });
  return ref.id;
}

export async function listInvoices(
  studentId?: string
): Promise<InvoiceDoc[]> {
  if (!db) return [];
  const ref = collection(db, COLLECTIONS.INVOICES);
  const q = studentId ? query(ref, where("studentId", "==", studentId)) : query(ref);
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as InvoiceDoc);
}

export async function markInvoicePaid(
  invoiceId: string,
  method: PaymentDoc["method"]
): Promise<void> {
  if (!db) return;
  await updateDoc(doc(db, COLLECTIONS.INVOICES, invoiceId), {
    status: "paid",
    paidAt: Timestamp.now(),
  });
  const invSnap = await getDoc(doc(db, COLLECTIONS.INVOICES, invoiceId));
  if (invSnap.exists()) {
    const inv = invSnap.data() as InvoiceDoc;
    await addDoc(collection(db, COLLECTIONS.PAYMENTS), {
      invoiceId,
      studentId: inv.studentId,
      amountCents: inv.netCents,
      method,
      status: "succeeded",
      createdAt: Timestamp.now(),
    });
  }
}

export async function listPayments(): Promise<PaymentDoc[]> {
  if (!db) return [];
  const snap = await getDocs(collection(db, COLLECTIONS.PAYMENTS));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as PaymentDoc);
}

// ============================================================================
// Discount Codes
// ============================================================================

export async function validateDiscountCode(
  code: string,
  isVeteran: boolean
): Promise<{ valid: boolean; percentOff: number; reason?: string }> {
  if (!db) return { valid: false, percentOff: 0, reason: "unavailable" };
  const q = query(
    collection(db, COLLECTIONS.DISCOUNT_CODES),
    where("code", "==", code.trim().toUpperCase()),
    where("active", "==", true),
    limit(1)
  );
  const snap = await getDocs(q);
  if (snap.empty) return { valid: false, percentOff: 0, reason: "not-found" };
  const discount = snap.docs[0].data() as DiscountCodeDoc;
  if (discount.expiresAt && discount.expiresAt.toMillis() < Date.now()) {
    return { valid: false, percentOff: 0, reason: "expired" };
  }
  if (
    discount.maxRedemptions &&
    discount.timesRedeemed >= discount.maxRedemptions
  ) {
    return { valid: false, percentOff: 0, reason: "exhausted" };
  }
  if (discount.militaryOnly && !isVeteran) {
    return { valid: false, percentOff: 0, reason: "military-only" };
  }
  return { valid: true, percentOff: discount.percentOff };
}

export async function listDiscountCodes(): Promise<DiscountCodeDoc[]> {
  if (!db) return [];
  const snap = await getDocs(collection(db, COLLECTIONS.DISCOUNT_CODES));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as DiscountCodeDoc);
}

export async function saveDiscountCode(
  data: Partial<DiscountCodeDoc> & { code: string; percentOff: number },
  discountId?: string
): Promise<string | null> {
  if (!db) return null;
  const payload = {
    ...data,
    code: data.code.trim().toUpperCase(),
    timesRedeemed: data.timesRedeemed ?? 0,
  };
  if (discountId) {
    await updateDoc(
      doc(db, COLLECTIONS.DISCOUNT_CODES, discountId),
      payload
    );
    return discountId;
  }
  const ref = await addDoc(collection(db, COLLECTIONS.DISCOUNT_CODES), {
    ...payload,
    createdAt: Timestamp.now(),
  });
  return ref.id;
}

export async function redeemDiscountCode(code: string): Promise<void> {
  if (!db) return;
  const q = query(
    collection(db, COLLECTIONS.DISCOUNT_CODES),
    where("code", "==", code.trim().toUpperCase()),
    limit(1)
  );
  const snap = await getDocs(q);
  if (!snap.empty) {
    await updateDoc(snap.docs[0].ref, { timesRedeemed: increment(1) });
  }
}

// ============================================================================
// Users (admin)
// ============================================================================

export async function listUsers(): Promise<TeamMemberDoc[]> {
  if (!db) return [];
  const snap = await getDocs(collection(db, COLLECTIONS.TEAM_MEMBERS));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as TeamMemberDoc);
}

export async function updateUserRole(
  userId: string,
  role: "admin" | "instructor" | "student"
): Promise<void> {
  if (!db) return;
  const memberRef = doc(db, COLLECTIONS.TEAM_MEMBERS, userId);
  const memberSnap = await getDoc(memberRef);
  await updateDoc(memberRef, {
    role,
    updatedAt: Timestamp.now(),
  });
  // Keep the roles/{uid} rules lookup doc in sync
  const member = memberSnap.data() as TeamMemberDoc | undefined;
  if (member?.firebaseUid) {
    await setDoc(doc(db, "roles", member.firebaseUid), {
      role,
      firebaseUid: member.firebaseUid,
      updatedAt: Timestamp.now(),
    });
  }
}
