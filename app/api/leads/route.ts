import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase-admin";
import { COLLECTIONS } from "@/lib/schema";
import { sendEmail } from "@/lib/email";

const baseLead = {
  firstName: z.string().trim().min(1).max(100),
  lastName: z.string().trim().min(1).max(100),
  email: z.string().trim().email().max(200),
  phone: z.string().trim().max(50).optional(),
  company: z.string().trim().max(200).optional(),
  jobTitle: z.string().trim().max(100).optional(),
  message: z.string().trim().max(5000).optional(),
  website: z.string().optional(),
};

const bookCallSchema = z.object({
  ...baseLead,
  formType: z.literal("book-call"),
  preferredDate: z.string().trim().max(20).optional(),
  preferredTime: z.string().trim().max(20).optional(),
  source: z.enum(["contact-page", "cta", "popup", "other"]).default("contact-page"),
});

const assessmentSchema = z.object({
  ...baseLead,
  formType: z.literal("assessment"),
  companySize: z.string().trim().max(50).optional(),
  industry: z.string().trim().max(100).optional(),
  serviceInterest: z.string().trim().max(200).optional(),
  newsletterOptIn: z.boolean().optional(),
});

const leadSchema = z.discriminatedUnion("formType", [bookCallSchema, assessmentSchema]);

// Best-effort per-IP throttle. In-memory only — serverless instances each keep
// their own bucket, so this stops basic floods, not distributed spam.
const hits = new Map<string, number[]>();
const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 5;

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const recent = (hits.get(ip) || []).filter((t) => now - t < WINDOW_MS);
  recent.push(now);
  hits.set(ip, recent);
  return recent.length > MAX_PER_WINDOW;
}

function esc(value: string | undefined): string {
  return (value || "").replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] || c
  );
}

function notifyRecipients(): string[] {
  const fromEnv = process.env.LEAD_NOTIFY_EMAILS?.split(",").map((s) => s.trim()).filter(Boolean);
  return fromEnv?.length ? fromEnv : ["info@strategicvalueplus.com"];
}

export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (isRateLimited(ip)) {
    return NextResponse.json({ error: "Too many requests. Please try again later." }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const parsed = leadSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid lead data", details: parsed.error.flatten() }, { status: 400 });
  }

  const lead = parsed.data;

  // Honeypot: bots fill the hidden "website" field. Pretend success, write nothing.
  if (lead.website) {
    return NextResponse.json({ data: { ok: true } }, { status: 200 });
  }

  if (!adminDb) {
    console.error("[leads] Firebase Admin not configured — cannot persist lead");
    return NextResponse.json({ error: "Lead capture is temporarily unavailable" }, { status: 503 });
  }

  try {
    const fields = { ...lead };
    delete fields.website;
    const doc = {
      ...fields,
      source: lead.formType === "book-call" ? lead.source : "other",
      status: "new",
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    };
    const ref = await adminDb.collection(COLLECTIONS.BOOK_CALL_LEADS).add(doc);

    const isBookCall = lead.formType === "book-call";
    const subject = isBookCall
      ? `New call request: ${lead.firstName} ${lead.lastName}`
      : `New assessment request: ${lead.firstName} ${lead.lastName}`;
    const rows: Array<[string, string | undefined]> = [
      ["Name", `${lead.firstName} ${lead.lastName}`],
      ["Email", lead.email],
      ["Phone", lead.phone],
      ["Company", lead.company],
      ["Job Title", lead.jobTitle],
      ...(isBookCall
        ? ([["Preferred Date", lead.preferredDate], ["Preferred Time", lead.preferredTime]] as Array<[string, string | undefined]>)
        : ([["Company Size", lead.companySize], ["Industry", lead.industry], ["Service Interest", lead.serviceInterest]] as Array<[string, string | undefined]>)),
      ["Message", lead.message],
    ];
    const html = `<h2>${esc(subject)}</h2><table cellpadding="6" style="border-collapse:collapse">${rows
      .filter(([, v]) => v)
      .map(([k, v]) => `<tr><td style="border:1px solid #ddd"><b>${esc(k)}</b></td><td style="border:1px solid #ddd">${esc(v)}</td></tr>`)
      .join("")}</table><p><a href="https://strategicvalueplus.com/portal/admin/book-call-leads">Open lead queue</a></p>`;

    sendEmail({ to: notifyRecipients(), subject, html }).catch((e) =>
      console.error("[leads] notification email failed:", e)
    );

    return NextResponse.json({ data: { id: ref.id } }, { status: 201 });
  } catch (error) {
    console.error("[leads] failed to persist lead:", error);
    return NextResponse.json({ error: "Failed to submit. Please try again." }, { status: 500 });
  }
}
