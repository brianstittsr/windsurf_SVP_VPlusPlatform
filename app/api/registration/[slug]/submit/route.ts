import { createHash, randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { Timestamp } from "firebase-admin/firestore";
import type { Timestamp as ClientTimestamp } from "firebase/firestore";
import { adminDb, adminStorage } from "@/lib/firebase-admin";
import { sendEmail } from "@/lib/email";
import { SIGNATURE_CONSENT_TEXT } from "@/lib/registration-forms";
import { enforceRegistrationRateLimit, hashRegistrationIp } from "@/lib/registration-security";
import { generateSignedRegistrationPdf } from "@/lib/registration-pdf";
import { COLLECTIONS, type CourseDoc, type RegistrationFormDoc, type RegistrationFormFieldDoc, type RegistrationSignatureDoc, type RegistrationSubmissionDoc } from "@/lib/schema";
import { lmsApiError, LmsApiError } from "@/lib/lms-api-auth";

interface SignatureInput {
  typedName: string;
  signatureDataUrl: string;
  consent: boolean;
}

interface SubmissionPayload {
  formVersion: number;
  answers: Record<string, unknown>;
  signatures: Record<string, SignatureInput>;
  selectedCourseIds: string[];
  website?: string;
}

function stableJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableJson).join(",")}]`;
  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    return `{${Object.keys(record).sort().map((key) => `${JSON.stringify(key)}:${stableJson(record[key])}`).join(",")}}`;
  }
  return JSON.stringify(value) ?? "null";
}

function fieldVisible(field: RegistrationFormFieldDoc, answers: Record<string, unknown>): boolean {
  if (!field.condition) return true;
  const current = answers[field.condition.fieldId];
  const target = field.condition.value;
  const matches = Array.isArray(current) ? current.includes(target) : String(current ?? "") === target;
  if (field.condition.operator === "equals") return matches;
  if (field.condition.operator === "notEquals") return !matches;
  return Array.isArray(current) ? current.includes(target) : String(current ?? "").includes(target);
}

function answerIsEmpty(value: unknown): boolean {
  if (value === undefined || value === null) return true;
  if (typeof value === "string") return value.trim().length === 0;
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === "object") return Object.values(value as Record<string, unknown>).every((item) => !String(item ?? "").trim());
  return false;
}

function validateField(field: RegistrationFormFieldDoc, value: unknown): string | null {
  if (field.type === "section" || field.type === "paragraph" || field.type === "file" || field.type === "signature") return null;
  if (field.type === "consent") return value === true || !field.required ? null : `${field.label} must be accepted.`;
  if (answerIsEmpty(value)) return field.required ? `${field.label} is required.` : null;

  if (["text", "textarea", "name", "email", "phone", "date", "monthYear"].includes(field.type)) {
    if (typeof value !== "string") return `${field.label} is invalid.`;
    if (field.validation?.minLength && value.length < field.validation.minLength) return `${field.label} is too short.`;
    if (field.validation?.maxLength && value.length > field.validation.maxLength) return `${field.label} is too long.`;
    if (field.type === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return "Enter a valid email address.";
    if (field.type === "phone" && value.replace(/\D/g, "").length < 7) return "Enter a valid phone number.";
    if (field.type === "monthYear" && !/^\d{4}-(0[1-9]|1[0-2])$/.test(value)) return `${field.label} must use YYYY-MM format.`;
    if (field.type === "date" && Number.isNaN(Date.parse(`${value}T00:00:00Z`))) return `${field.label} is invalid.`;
    return null;
  }
  if (field.type === "number") {
    const number = typeof value === "number" ? value : Number(value);
    if (!Number.isFinite(number)) return `${field.label} must be a number.`;
    if (field.validation?.min !== undefined && number < field.validation.min) return `${field.label} is below the minimum.`;
    if (field.validation?.max !== undefined && number > field.validation.max) return `${field.label} exceeds the maximum.`;
    return null;
  }
  if (["select", "radio", "yesNoPreferNot"].includes(field.type)) {
    if (typeof value !== "string") return `${field.label} is invalid.`;
    const allowed = field.type === "yesNoPreferNot" ? ["yes", "no", "prefer_not"] : (field.options || []).map((option) => option.value);
    return allowed.includes(value) ? null : `${field.label} has an invalid selection.`;
  }
  if (field.type === "checkboxes") {
    if (!Array.isArray(value) || value.some((item) => typeof item !== "string")) return `${field.label} has invalid selections.`;
    const allowed = new Set((field.options || []).map((option) => option.value));
    return (value as string[]).every((item) => allowed.has(item)) ? null : `${field.label} has an invalid selection.`;
  }
  if (field.type === "address") {
    if (!value || typeof value !== "object" || Array.isArray(value)) return `${field.label} is invalid.`;
    const address = value as Record<string, unknown>;
    if (field.required && ["street", "city", "state", "zip"].some((key) => typeof address[key] !== "string" || !(address[key] as string).trim())) return `${field.label} requires street, city, state, and ZIP.`;
    return null;
  }
  return null;
}

function getIp(req: NextRequest): string {
  return req.headers.get("x-real-ip") || req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
}

export async function POST(req: NextRequest, ctx: { params: Promise<{ slug: string }> }) {
  const uploadedPaths: string[] = [];
  try {
    if (!adminDb || !adminStorage) throw new LmsApiError(503, "Registration is unavailable");
    const ip = getIp(req);
    await enforceRegistrationRateLimit(ip);
    const { slug } = await ctx.params;
    const formSnap = await adminDb
      .collection(COLLECTIONS.REGISTRATION_FORMS)
      .where("slug", "==", slug)
      .where("status", "==", "published")
      .limit(1)
      .get();
    if (formSnap.empty) throw new LmsApiError(404, "Registration form not found");
    const formRef = formSnap.docs[0];
    const form = formRef.data() as RegistrationFormDoc;
    const activeVersion = form.publishedVersion || form.version;

    const multipart = await req.formData();
    const payloadText = multipart.get("payload");
    if (typeof payloadText !== "string" || payloadText.length > 100_000) throw new LmsApiError(400, "Invalid registration submission");
    let payload: SubmissionPayload;
    try {
      payload = JSON.parse(payloadText) as SubmissionPayload;
    } catch {
      throw new LmsApiError(400, "Invalid registration submission");
    }
    if (payload.website?.trim()) return NextResponse.json({ data: { submissionId: "received" } }, { status: 201 });
    if (payload.formVersion !== activeVersion || !payload.answers || !Array.isArray(payload.selectedCourseIds) || !payload.signatures) {
      throw new LmsApiError(409, "This form changed. Refresh and review the current form before submitting.");
    }

    const fields = form.publishedFields || form.fields;
    const answers: Record<string, unknown> = {};
    const signatureFields = fields.filter((field) => field.type === "signature" && fieldVisible(field, payload.answers));
    const signatureInputs = payload.signatures;
    if (signatureFields.length === 0) throw new LmsApiError(400, "The published form has no signature field.");

    const emailField = fields.find((field) => field.purpose === "email");
    const nameField = fields.find((field) => field.purpose === "fullName");
    const phoneField = fields.find((field) => field.purpose === "phone");
    const companyField = fields.find((field) => field.purpose === "company");
    const courseField = fields.find((field) => field.purpose === "courseSelection" || field.type === "courseSelector");
    if (!emailField || !nameField || !courseField) throw new LmsApiError(500, "Published form is missing required registration mappings.");

    const attachments: NonNullable<RegistrationSubmissionDoc["attachments"]> = [];
    const submissionRef = adminDb.collection(COLLECTIONS.REGISTRATION_SUBMISSIONS).doc();
    const bucket = adminStorage.bucket();
    const signatureBytesByField = new Map<string, { sign: SignatureInput; bytes: Buffer }>();
    const maxUploads = 8;
    const maxTotalUploadBytes = 25 * 1024 * 1024;
    let uploadCount = 0;
    let totalUploadBytes = 0;

    for (const field of fields) {
      if (!fieldVisible(field, payload.answers)) continue;
      if (field.type === "section" || field.type === "paragraph") continue;
      if (field.type === "file") {
        const uploaded = multipart.get(`file:${field.id}`);
        if (!(uploaded instanceof File)) {
          if (field.required) throw new LmsApiError(400, `${field.label} is required.`);
          continue;
        }
        uploadCount++;
        if (uploadCount > maxUploads) throw new LmsApiError(400, "Too many uploaded files.");
        const maxBytes = field.validation?.maxFileSizeBytes || 10 * 1024 * 1024;
        const allowed = new Set(field.validation?.allowedMimeTypes || ["application/pdf", "image/jpeg", "image/png"]);
        if (!uploaded.size || uploaded.size > maxBytes || !allowed.has(uploaded.type)) throw new LmsApiError(400, `${field.label} must be an allowed file type and within the size limit.`);
        totalUploadBytes += uploaded.size;
        if (totalUploadBytes > maxTotalUploadBytes) throw new LmsApiError(413, "Combined uploaded files exceed the 25 MB submission limit.");
        const safeName = uploaded.name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(-100) || "upload";
        const storagePath = `registration-submissions/${submissionRef.id}/${field.id}/${randomUUID()}-${safeName}`;
        const bytes = Buffer.from(await uploaded.arrayBuffer());
        const checksumSha256 = createHash("sha256").update(bytes).digest("hex");
        await bucket.file(storagePath).save(bytes, {
          resumable: false,
          metadata: { contentType: uploaded.type, cacheControl: "private, no-store", metadata: { registrationSubmissionId: submissionRef.id, fieldId: field.id } },
        });
        uploadedPaths.push(storagePath);
        const attachment = { fieldId: field.id, displayName: field.label, fileName: safeName, contentType: uploaded.type, sizeBytes: uploaded.size, storagePath, checksumSha256 };
        attachments.push(attachment);
        answers[field.id] = { fileName: safeName, contentType: uploaded.type, sizeBytes: uploaded.size };
        continue;
      }
      if (field.type === "signature") {
        const sign = signatureInputs[field.id];
        if (!sign && !field.required) continue;
        if (!sign || typeof sign.typedName !== "string" || sign.typedName.trim().length < 2 || typeof sign.signatureDataUrl !== "string" || !sign.signatureDataUrl.startsWith("data:image/png;base64,") || sign.consent !== true) {
          throw new LmsApiError(400, "Every required signature must include a typed name, drawn signature, and electronic-signature consent.");
        }
        const imageBytes = Buffer.from(sign.signatureDataUrl.slice("data:image/png;base64,".length), "base64");
        if (imageBytes.length < 100 || imageBytes.length > 1_500_000 || imageBytes.subarray(0, 8).toString("hex") !== "89504e470d0a1a0a") {
          throw new LmsApiError(400, "Signature image is invalid.");
        }
        signatureBytesByField.set(field.id, { sign, bytes: imageBytes });
        answers[field.id] = sign.typedName.trim();
        continue;
      }
      const value = payload.answers[field.id];
      const validationMessage = validateField(field, value);
      if (validationMessage) throw new LmsApiError(400, validationMessage);
      if (value !== undefined) answers[field.id] = value;
    }

    const fullName = String(answers[nameField.id] || "").trim();
    const email = String(answers[emailField.id] || "").trim().toLowerCase();
    const phone = phoneField ? String(answers[phoneField.id] || "") : "";
    const company = companyField ? String(answers[companyField.id] || "") : "";
    if (fullName.length < 2 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new LmsApiError(400, "Enter a valid full name and email address.");

    const ids = [...new Set(payload.selectedCourseIds)];
    const selectorValue = answers[courseField.id];
    const selectedFromAnswers = Array.isArray(selectorValue) ? [...new Set(selectorValue.filter((id): id is string => typeof id === "string"))] : [];
    if (ids.length === 0 || ids.length !== selectedFromAnswers.length || ids.some((id) => !selectedFromAnswers.includes(id))) throw new LmsApiError(400, "Select at least one course using the course catalog field.");
    const courseDocs = await Promise.all(ids.map((id) => adminDb!.collection(COLLECTIONS.COURSES).doc(id).get()));
    if (courseDocs.some((doc) => !doc.exists || doc.get("published") !== true || doc.get("archived") === true)) throw new LmsApiError(400, "A selected course is no longer available. Refresh the form and select again.");
    const selectedCoursesSnapshot = courseDocs.map((doc) => {
      const course = doc.data() as CourseDoc;
      return {
        courseId: doc.id,
        code: course.code,
        title: course.title,
        description: course.description,
        priceCents: course.priceCents,
        includedCourseIds: course.includedCourseIds || [],
      };
    });
    const expandedCourseIds = selectedCoursesSnapshot.flatMap((course) => [course.courseId, ...course.includedCourseIds]);
    if (new Set(expandedCourseIds).size !== expandedCourseIds.length) {
      throw new LmsApiError(400, "A course is already included in a selected bundle. Remove duplicate selections.");
    }
    const totalCents = selectedCoursesSnapshot.reduce((sum, course) => sum + course.priceCents, 0);
    const signAt = Timestamp.now();
    const clientTimestamp = signAt as unknown as ClientTimestamp;
    const signatureImages: Record<string, string> = {};
    const signatures: RegistrationSignatureDoc[] = [];
    for (const field of signatureFields) {
      const signatureData = signatureBytesByField.get(field.id);
      if (!signatureData) continue;
      const { sign, bytes } = signatureData;
      const signaturePath = `registration-submissions/${submissionRef.id}/signatures/${field.id}-${randomUUID()}.png`;
      const imageSha256 = createHash("sha256").update(bytes).digest("hex");
      await bucket.file(signaturePath).save(bytes, {
        resumable: false,
        metadata: { contentType: "image/png", cacheControl: "private, no-store", metadata: { registrationSubmissionId: submissionRef.id, fieldId: field.id, imageSha256 } },
      });
      uploadedPaths.push(signaturePath);
      signatureImages[field.id] = sign.signatureDataUrl;
      signatures.push({
        fieldId: field.id,
        typedName: sign.typedName.trim(),
        imageStoragePath: signaturePath,
        imageSha256,
        consentText: SIGNATURE_CONSENT_TEXT,
        formVersion: activeVersion,
        signedAt: clientTimestamp,
        formSnapshotHash: "",
      });
    }

    const newsletterField = fields.find((field) => field.purpose === "newsletterConsent");
    const canonicalSignedPayload = {
      formId: formRef.id,
      formVersion: activeVersion,
      fields,
      answers,
      selectedCoursesSnapshot,
      signatures: signatures.map(({ fieldId, typedName, consentText, imageSha256 }) => ({ fieldId, typedName, consentText, imageSha256 })),
      signedAt: signAt.toMillis(),
    };
    const formSnapshotHash = createHash("sha256").update(stableJson(canonicalSignedPayload)).digest("hex");
    const finalSignatures = signatures.map((signature) => ({ ...signature, formSnapshotHash }));
    const signedPdf = generateSignedRegistrationPdf({
      formName: form.name,
      formVersion: activeVersion,
      submittedAt: signAt.toDate(),
      fields,
      answers,
      courseLines: selectedCoursesSnapshot,
      signatures: finalSignatures.map((signature) => ({ fieldId: signature.fieldId, typedName: signature.typedName, imageDataUrl: signatureImages[signature.fieldId] })),
    });
    const pdfPath = `registration-submissions/${submissionRef.id}/signed-registration.pdf`;
    await bucket.file(pdfPath).save(Buffer.from(signedPdf), {
      resumable: false,
      metadata: { contentType: "application/pdf", cacheControl: "private, no-store", metadata: { registrationSubmissionId: submissionRef.id, formSnapshotHash } },
    });
    uploadedPaths.push(pdfPath);
    const pdfChecksum = createHash("sha256").update(Buffer.from(signedPdf)).digest("hex");
    attachments.push({ fieldId: "signed-registration", displayName: "Signed registration form", fileName: "signed-registration.pdf", contentType: "application/pdf", sizeBytes: signedPdf.length, storagePath: pdfPath, checksumSha256: pdfChecksum });

    const submission = {
      id: submissionRef.id,
      formId: formRef.id,
      formSlug: form.slug,
      formVersion: activeVersion,
      formSnapshot: fields,
      fullName,
      email,
      phone,
      company,
      status: "submitted",
      answers,
      selectedCourseIds: ids,
      selectedCoursesSnapshot,
      totalCents,
      currency: "usd",
      newsletterConsent: newsletterField ? answers[newsletterField.id] === true : false,
      attachments,
      signatures: finalSignatures,
      sourceIpHash: hashRegistrationIp(ip),
      submittedAt: clientTimestamp,
      updatedAt: clientTimestamp,
    };
    await submissionRef.set(submission);

    const noticeHtml = `<p>A new signed EFVS Academy registration is ready for review.</p><p>Submission ID: ${submissionRef.id}</p><p>Applicant: ${fullName.replace(/[<>]/g, "")}</p><p>Selected courses: ${selectedCoursesSnapshot.map((course) => `${course.code} — ${course.title}`).join(", ")}</p>`;
    const confirmationHtml = `<p>Thank you, ${fullName.replace(/[<>]/g, "")}. EFVS received your signed course registration and will review it. If approved, you will receive a secure invitation and checkout instructions. Course access is granted after payment or approved sponsorship is confirmed.</p>`;
    await Promise.allSettled([
      sendEmail({ to: [process.env.EFVS_REGISTRATION_EMAIL || "efvsflight@efvertical.com"], subject: "EFVS student registration received", html: noticeHtml }),
      sendEmail({ to: [email], subject: "EFVS Academy registration received", html: confirmationHtml }),
    ]);

    return NextResponse.json({ data: { submissionId: submissionRef.id, status: "submitted" } }, { status: 201 });
  } catch (error) {
    if (adminStorage && uploadedPaths.length > 0) {
      await Promise.allSettled(uploadedPaths.map((path) => adminStorage!.bucket().file(path).delete({ ignoreNotFound: true })));
    }
    return lmsApiError(error);
  }
}
