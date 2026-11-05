import { createHash, randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { Timestamp } from "firebase-admin/firestore";
import { adminDb, adminStorage } from "@/lib/firebase-admin";
import { lmsApiError, requireLmsActor } from "@/lib/lms-api-auth";
import { COLLECTIONS, type StudentDocumentDoc, type StudentDocumentKind } from "@/lib/schema";

const MAX_BYTES = 12 * 1024 * 1024;
const UPLOAD_KINDS = new Set<StudentDocumentKind>(["faa_certificate_proof", "training_credential", "other"]);

function detectContentType(bytes: Buffer): string | null {
  if (bytes.subarray(0, 5).toString("ascii") === "%PDF-") return "application/pdf";
  if (bytes.subarray(0, 3).toString("hex") === "ffd8ff") return "image/jpeg";
  if (bytes.subarray(0, 8).toString("hex") === "89504e470d0a1a0a") return "image/png";
  if (bytes.subarray(0, 4).toString("ascii") === "RIFF" && bytes.subarray(8, 12).toString("ascii") === "WEBP") return "image/webp";
  return null;
}

export async function GET(req: NextRequest) {
  try {
    const actor = await requireLmsActor(req);
    if (!adminDb) return NextResponse.json({ error: "Documents unavailable" }, { status: 503 });
    const snapshot = await adminDb.collection(COLLECTIONS.STUDENT_DOCUMENTS)
      .where("firebaseUid", "==", actor.uid)
      .limit(100)
      .get();
    const documents = snapshot.docs
      .map((doc) => {
        const record = doc.data() as StudentDocumentDoc;
        return { ...record, id: doc.id, createdAt: record.createdAt.toDate().toISOString() };
      })
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    const [ordersSnap, invoicesSnap, enrollmentsSnap] = await Promise.all([
      adminDb.collection(COLLECTIONS.ORDERS).where("firebaseUid", "==", actor.uid).limit(100).get(),
      adminDb.collection(COLLECTIONS.INVOICES).where("firebaseUid", "==", actor.uid).limit(100).get(),
      adminDb.collection(COLLECTIONS.ENROLLMENTS).where("firebaseUid", "==", actor.uid).limit(100).get(),
    ]);
    const courseIds = [...new Set(enrollmentsSnap.docs.map((doc) => doc.get("courseId") as string))];
    const courseDocs = await Promise.all(courseIds.map((courseId) => adminDb!.collection(COLLECTIONS.COURSES).doc(courseId).get()));
    const courseNames = new Map(courseDocs.filter((doc) => doc.exists).map((doc) => [doc.id, `${doc.get("code")} — ${doc.get("title")}`]));
    const enrollments = enrollmentsSnap.docs.map((doc) => ({
      id: doc.id,
      courseId: doc.get("courseId") as string,
      courseName: courseNames.get(doc.get("courseId") as string) || "Course",
      status: doc.get("status") as string,
      progressPercent: doc.get("progressPercent") as number,
      enrolledAt: doc.get("enrolledAt")?.toDate?.().toISOString?.() || null,
      completedAt: doc.get("completedAt")?.toDate?.().toISOString?.() || null,
    }));
    const orders = ordersSnap.docs.map((doc) => {
      const value = doc.data();
      return { id: doc.id, ...value, createdAt: value.createdAt?.toDate?.().toISOString?.() || null };
    });
    const invoices = invoicesSnap.docs.map((doc) => {
      const value = doc.data();
      return { id: doc.id, productId: value.productId || null, courseId: value.courseId || null, courseIds: value.courseIds || [], amountCents: value.netCents, currency: value.currency || "usd", status: value.status, method: value.method, createdAt: value.createdAt?.toDate?.().toISOString?.() || null };
    });
    return NextResponse.json({ data: { documents, orders, invoices, enrollments } });
  } catch (error) {
    return lmsApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const actor = await requireLmsActor(req);
    if (!adminDb || !adminStorage) return NextResponse.json({ error: "Document storage unavailable" }, { status: 503 });
    const form = await req.formData();
    const file = form.get("file");
    const kindValue = String(form.get("kind") || "other") as StudentDocumentKind;
    const displayName = String(form.get("displayName") || "Student document").trim().slice(0, 120);
    if (!(file instanceof File)) return NextResponse.json({ error: "Select a file to upload" }, { status: 400 });
    if (!UPLOAD_KINDS.has(kindValue)) return NextResponse.json({ error: "Invalid document type" }, { status: 400 });
    if (!file.size || file.size > MAX_BYTES) return NextResponse.json({ error: "Files must be under 12 MB" }, { status: 400 });
    const bytes = Buffer.from(await file.arrayBuffer());
    const contentType = detectContentType(bytes);
    if (!contentType || contentType !== file.type) return NextResponse.json({ error: "Upload a valid PDF, JPEG, PNG, or WebP document" }, { status: 400 });
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(-100) || "document";
    const id = randomUUID();
    const storagePath = `student-documents/${actor.uid}/${id}/${safeName}`;
    const checksumSha256 = createHash("sha256").update(bytes).digest("hex");
    await adminStorage.bucket().file(storagePath).save(bytes, {
      resumable: false,
      metadata: { contentType, cacheControl: "private, no-store", metadata: { firebaseUid: actor.uid, documentId: id } },
    });
    const document: Omit<StudentDocumentDoc, "id"> = {
      firebaseUid: actor.uid,
      studentId: actor.studentId,
      kind: kindValue,
      displayName: displayName || safeName,
      fileName: safeName,
      contentType,
      sizeBytes: file.size,
      storagePath,
      checksumSha256,
      uploadedBy: actor.uid,
      createdAt: Timestamp.now() as unknown as StudentDocumentDoc["createdAt"],
    };
    await adminDb.collection(COLLECTIONS.STUDENT_DOCUMENTS).doc(id).set(document);
    await adminDb.collection(COLLECTIONS.AUDIT_LOGS).add({
      actorId: actor.uid,
      actorEmail: actor.email,
      action: "student_document.uploaded",
      entityType: "student_document",
      entityId: id,
      metadata: { kind: kindValue, contentType, sizeBytes: file.size },
      createdAt: Timestamp.now(),
    });
    return NextResponse.json({ data: { id, displayName: document.displayName, kind: kindValue } }, { status: 201 });
  } catch (error) {
    return lmsApiError(error);
  }
}
