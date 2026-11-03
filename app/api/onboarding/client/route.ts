import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase-admin";
import { COLLECTIONS } from "@/lib/schema";
import { requireUser, CaptureUser } from "@/lib/capture/server-auth";
import { sendEmail } from "@/lib/email";

export const SET_ASIDE_CERTS = [
  "8a",
  "hubzone",
  "sdvosb",
  "vosb",
  "edwosb",
  "wosb",
  "mbe",
  "dbw",
] as const;

const CLEARANCE_LEVELS = ["none", "public-trust", "secret", "top-secret", "other"] as const;

const contactSchema = z.object({
  name: z.string().trim().min(1).max(200),
  title: z.string().trim().max(100).optional(),
  email: z.string().trim().email().max(200).optional(),
  phone: z.string().trim().max(50).optional(),
});

const onboardingSchema = z.object({
  company: z.object({
    name: z.string().trim().min(1).max(300),
    type: z.string().trim().max(50).optional(),
    website: z.string().trim().max(300).optional(),
    yearEstablished: z.string().trim().max(4).optional(),
    employeeCount: z.string().trim().max(20).optional(),
    streetAddress: z.string().trim().max(300).optional(),
    city: z.string().trim().max(100).optional(),
    state: z.string().trim().max(50).optional(),
    zipCode: z.string().trim().max(20).optional(),
    country: z.string().trim().max(100).optional(),
  }),
  primaryContact: contactSchema,
  secondaryContact: contactSchema.partial().optional(),
  govcon: z
    .object({
      uei: z.string().trim().regex(/^[A-Za-z0-9]{12}$/, "UEI must be 12 alphanumeric characters").optional(),
      cageCode: z.string().trim().regex(/^[A-Za-z0-9]{5}$/, "CAGE code must be 5 characters").optional(),
      samRegistrationExpiry: z.string().optional(),
      clearanceLevel: z.enum(CLEARANCE_LEVELS).optional(),
      naicsCodes: z.array(z.string().trim().regex(/^\d{4,6}$/, "NAICS must be 4-6 digits")).max(50).optional(),
      pscCodes: z.array(z.string().trim().max(10)).max(50).optional(),
      certifications: z
        .array(z.object({ name: z.enum(SET_ASIDE_CERTS), expiresAt: z.string().optional() }))
        .optional(),
      keywords: z.array(z.string().trim().min(1).max(100)).max(100).optional(),
      targetAgencies: z.array(z.string().trim().min(1).max(200)).max(50).optional(),
    })
    .optional(),
  onboarding: z
    .object({
      industrySectors: z.array(z.string().max(100)).max(50).optional(),
      capabilities: z.array(z.string().max(100)).max(50).optional(),
      quality: z
        .object({
          qualityManual: z.boolean().optional(),
          documentedProcesses: z.boolean().optional(),
          internalAudits: z.boolean().optional(),
          correctiveActionProcess: z.boolean().optional(),
          supplierQualification: z.boolean().optional(),
          certifications: z.array(z.string().max(100)).max(50).optional(),
        })
        .optional(),
      servicesInterested: z.array(z.string().max(100)).max(50).optional(),
      primaryGoals: z.string().trim().max(5000).optional(),
      currentChallenges: z.string().trim().max(5000).optional(),
      timeline: z.string().trim().max(50).optional(),
      howDidYouHear: z.string().trim().max(100).optional(),
      additionalNotes: z.string().trim().max(5000).optional(),
    })
    .optional(),
});

function esc(value: string | undefined): string {
  return (value || "").replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] || c
  );
}

function notifyRecipients(): string[] {
  const fromEnv = process.env.LEAD_NOTIFY_EMAILS?.split(",").map((s) => s.trim()).filter(Boolean);
  return fromEnv?.length ? fromEnv : ["info@strategicvalueplus.com"];
}

function notifyAdmin(companyName: string, contactEmail: string, user: CaptureUser): void {
  const subject = `New client onboarding: ${companyName}`;
  const html = `<h2>${esc(subject)}</h2>
    <p><b>Company:</b> ${esc(companyName)}<br/>
    <b>Contact:</b> ${esc(contactEmail)}<br/>
    <b>Account:</b> ${esc(user.email)} (${esc(user.displayName)})</p>
    <p><a href="https://strategicvalueplus.com/portal/capture/clients">Open capture clients</a></p>`;
  sendEmail({ to: notifyRecipients(), subject, html }).catch((e) =>
    console.error("[onboarding] notification email failed:", e)
  );
}

export async function POST(request: NextRequest) {
  const userOrRes = await requireUser(request);
  if (userOrRes instanceof NextResponse) return userOrRes;
  const user = userOrRes;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const parsed = onboardingSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid onboarding data", details: parsed.error.flatten() }, { status: 400 });
  }
  const data = parsed.data;

  if (!adminDb) {
    console.error("[onboarding] Firebase Admin not configured — cannot persist client");
    return NextResponse.json({ error: "Onboarding is temporarily unavailable" }, { status: 503 });
  }

  const { company, primaryContact, secondaryContact, govcon, onboarding } = data;
  const contacts = [
    { name: primaryContact.name, title: primaryContact.title, email: primaryContact.email, phone: primaryContact.phone },
    ...(secondaryContact?.name ? [secondaryContact] : []),
  ];
  const address = [company.streetAddress, company.city, company.state, company.zipCode]
    .filter(Boolean)
    .join(", ");

  const docFields = {
    name: company.name.trim(),
    website: company.website?.trim() || null,
    email: primaryContact.email || user.email || null,
    address: address || null,
    status: "active",
    isCaptureClient: true,
    firebaseUid: user.uid,
    primaryContact: primaryContact.name,
    contacts,
    govcon: govcon || {},
    onboarding: {
      ...(onboarding || {}),
      companyType: company.type,
      yearEstablished: company.yearEstablished,
      employeeCount: company.employeeCount,
      submittedAt: new Date().toISOString(),
    },
    updatedAt: FieldValue.serverTimestamp(),
  };

  try {
    const col = adminDb.collection(COLLECTIONS.CUSTOMERS);
    const existing = await col.where("firebaseUid", "==", user.uid).limit(1).get();

    let customerId: string;
    if (!existing.empty) {
      customerId = existing.docs[0].id;
      await col.doc(customerId).update(docFields);
    } else {
      const ref = await col.add({ ...docFields, createdAt: FieldValue.serverTimestamp() });
      customerId = ref.id;
    }

    notifyAdmin(company.name, primaryContact.email || user.email, user);
    return NextResponse.json({ data: { customerId, updated: !existing.empty } }, { status: existing.empty ? 201 : 200 });
  } catch (error) {
    console.error("[onboarding] failed to persist client:", error);
    return NextResponse.json({ error: "Failed to save your profile. Please try again." }, { status: 500 });
  }
}
