import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase-admin";
import { COLLECTIONS } from "@/lib/schema";
import { sendEmail } from "@/lib/email";

const leadSchema = z.object({
  formType: z.enum(["contact", "cogniverai", "careers"]),
  name: z.string().trim().min(1).max(200),
  email: z.string().trim().email().max(200),
  phone: z.string().trim().max(50).optional(),
  company: z.string().trim().max(200).optional(),
  role: z.string().trim().max(100).optional(),
  topic: z.string().trim().max(200).optional(),
  interest: z.string().trim().max(200).optional(),
  location: z.string().trim().max(200).optional(),
  linkedin: z.string().trim().max(300).optional(),
  expertise: z.string().trim().max(200).optional(),
  years: z.string().trim().max(50).optional(),
  certifications: z.string().trim().max(300).optional(),
  message: z.string().trim().max(5000).optional(),
  website: z.string().optional(),
});

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

const FORM_LABELS: Record<string, string> = {
  contact: "V+ contact",
  cogniverai: "Cogniverai",
  careers: "V+ resource application",
};

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
    const ref = await adminDb.collection(COLLECTIONS.BOOK_CALL_LEADS).add({
      ...fields,
      source: "website",
      status: "new",
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });

    const subject = `New ${FORM_LABELS[lead.formType] ?? lead.formType} lead: ${lead.name}`;
    const rows: Array<[string, string | undefined]> = [
      ["Form", FORM_LABELS[lead.formType] ?? lead.formType],
      ["Name", lead.name],
      ["Email", lead.email],
      ["Phone", lead.phone],
      ["Company", lead.company],
      ["Role", lead.role],
      ["Topic", lead.topic],
      ["Interest", lead.interest],
      ["Location", lead.location],
      ["LinkedIn", lead.linkedin],
      ["Expertise", lead.expertise],
      ["Experience", lead.years],
      ["Certifications", lead.certifications],
      ["Message", lead.message],
    ];
    const html = `<h2>${esc(subject)}</h2><table cellpadding="6" style="border-collapse:collapse">${rows
      .filter(([, v]) => v)
      .map(([k, v]) => `<tr><td style="border:1px solid #ddd"><b>${esc(k)}</b></td><td style="border:1px solid #ddd">${esc(v)}</td></tr>`)
      .join("")}</table><p><a href="https://strategicvalueplus.com/portal/admin/leads">Open lead queue</a></p>`;

    sendEmail({ to: notifyRecipients(), subject, html }).catch((e) =>
      console.error("[leads] notification email failed:", e)
    );

    return NextResponse.json({ data: { id: ref.id } }, { status: 201 });
  } catch (error) {
    console.error("[leads] failed to persist lead:", error);
    return NextResponse.json({ error: "Failed to submit. Please try again." }, { status: 500 });
  }
}
