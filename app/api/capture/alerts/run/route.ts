import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase-admin";
import { COLLECTIONS } from "@/lib/schema";
import { getCaptureSettings } from "@/lib/capture/settings";
import { sendEmail } from "@/lib/email";
import { captureAudit } from "@/lib/capture/audit";
import { requireUser } from "@/lib/capture/server-auth";

const CRON_SECRET = process.env.CRON_SECRET;
const DAY_MS = 86_400_000;

/** Cron Bearer OR an authenticated admin user (manual run). */
async function checkCronAuth(req: NextRequest): Promise<NextResponse | null> {
  const authHeader = req.headers.get("authorization");
  if (CRON_SECRET && authHeader === `Bearer ${CRON_SECRET}`) return null;
  const user = await requireUser(req);
  if (user instanceof NextResponse) return user;
  if (user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden: admin only" }, { status: 403 });
  }
  return null;
}

interface AlertCandidate {
  type: string;
  entityType: "capture-opportunity" | "capture-task" | "capture-client";
  entityId: string;
  entityName: string;
  message: string;
  recipientEmail?: string;
}

/**
 * Daily alerts cron — deadline warnings (7/3/1d + overdue), task due dates,
 * and client SAM/cert expirations (90/60/30d). Dedupes against captureAlertLog,
 * writes alert docs + activity entries, emails a per-recipient digest.
 */
async function run(): Promise<NextResponse> {
  if (!adminDb) return NextResponse.json({ error: "Database unavailable" }, { status: 500 });
  const settings = await getCaptureSettings();
  const now = Date.now();
  const alerts: AlertCandidate[] = [];

  // Resolve admin emails for client-level alerts
  const teamSnap = await adminDb.collection(COLLECTIONS.TEAM_MEMBERS).get();
  const memberById = new Map<string, { email?: string; name?: string }>();
  const adminEmails: string[] = [];
  for (const d of teamSnap.docs) {
    const m = d.data();
    memberById.set(d.id, { email: m.emailPrimary, name: `${m.firstName || ""} ${m.lastName || ""}`.trim() });
    if (m.role === "admin" && m.emailPrimary) adminEmails.push(m.emailPrimary);
  }

  // --- Opportunity deadline alerts ---
  const oppSnap = await adminDb
    .collection(COLLECTIONS.CAPTURE_OPPORTUNITIES)
    .where("deletedAt", "==", null)
    .get();
  for (const d of oppSnap.docs) {
    const o = d.data();
    if (["won", "lost", "closed"].includes(o.stage)) continue;
    const owner = o.ownerId ? memberById.get(o.ownerId) : undefined;
    for (const kind of ["responseDue", "questionsDue"] as const) {
      const dl = o[kind];
      if (!dl?.at) continue;
      const days = Math.ceil((new Date(dl.at).getTime() - now) / DAY_MS);
      const label = kind === "responseDue" ? "Response" : "Questions";
      let type: string | null = null;
      if (days < 0) type = "overdue";
      else if (settings.alertDays.includes(days)) type = `deadline-${days}d`;
      if (!type) continue;
      alerts.push({
        type,
        entityType: "capture-opportunity",
        entityId: d.id,
        entityName: o.title || "",
        message: days < 0
          ? `OVERDUE: ${label} for "${o.title}" was ${-days} day(s) ago`
          : `${label} for "${o.title}" due in ${days} day(s)`,
        recipientEmail: owner?.email,
      });
    }
  }

  // --- Task due alerts ---
  const taskSnap = await adminDb.collection(COLLECTIONS.CAPTURE_TASKS).where("status", "==", "open").get();
  for (const d of taskSnap.docs) {
    const t = d.data();
    if (!t.dueDate) continue;
    const days = Math.ceil((new Date(t.dueDate).getTime() - now) / DAY_MS);
    if (days > Math.max(...settings.alertDays)) continue;
    alerts.push({
      type: "task-due",
      entityType: "capture-task",
      entityId: d.id,
      entityName: t.title || "",
      message: days < 0 ? `Task "${t.title}" is ${-days} day(s) overdue` : `Task "${t.title}" due in ${days} day(s)`,
      recipientEmail: t.assigneeId ? memberById.get(t.assigneeId)?.email : undefined,
    });
  }

  // --- Client SAM/cert expiry alerts ---
  const clientSnap = await adminDb.collection(COLLECTIONS.CUSTOMERS).get();
  for (const d of clientSnap.docs) {
    const c = d.data();
    if (!c.isCaptureClient || c.deletedAt) continue;
    const g = c.govcon || {};
    const checks: { type: string; label: string; expiry?: string }[] = [
      { type: "sam-expiry", label: "SAM registration", expiry: g.samRegistrationExpiry },
      ...(g.certifications || []).map((cert: { name: string; expiresAt?: string }) => ({
        type: "cert-expiry" as const,
        label: `certification "${cert.name}"`,
        expiry: cert.expiresAt,
      })),
    ];
    for (const chk of checks) {
      if (!chk.expiry) continue;
      const days = Math.ceil((new Date(chk.expiry).getTime() - now) / DAY_MS);
      if (days < 0 || !settings.expiryAlertDays.some((w) => days <= w)) continue;
      alerts.push({
        type: chk.type,
        entityType: "capture-client",
        entityId: d.id,
        entityName: c.name || "",
        message: `${c.name}: ${chk.label} expires in ${days} day(s) (${chk.expiry.slice(0, 10)})`,
      });
    }
  }

  // --- Dedupe: skip alerts already logged for the same entity + type + day ---
  const today = new Date().toISOString().slice(0, 10);
  const logSnap = await adminDb.collection(COLLECTIONS.CAPTURE_ALERT_LOG).get();
  const logged = new Set(
    logSnap.docs
      .filter((d) => (d.data().sentAt?.toDate?.()?.toISOString() || "").startsWith(today))
      .map((d) => `${d.data().entityId}:${d.data().type}`)
  );
  const fresh = alerts.filter((a) => !logged.has(`${a.entityId}:${a.type}`));

  // --- Write log + activity entries, group digest emails ---
  const byEmail = new Map<string, string[]>();
  const batch: Promise<unknown>[] = [];
  for (const a of fresh) {
    batch.push(
      adminDb.collection(COLLECTIONS.CAPTURE_ALERT_LOG).add({
        type: a.type,
        entityType: a.entityType,
        entityId: a.entityId,
        entityName: a.entityName,
        recipientEmail: a.recipientEmail || null,
        message: a.message,
        sentAt: FieldValue.serverTimestamp(),
      }),
      captureAudit({
        type: "update",
        entityType: a.entityType,
        entityId: a.entityId,
        entityName: a.entityName,
        description: `Alert: ${a.message}`,
        userId: "system",
      })
    );
    const recipients = a.recipientEmail ? [a.recipientEmail] : adminEmails;
    for (const email of recipients) {
      byEmail.set(email, [...(byEmail.get(email) || []), a.message]);
    }
  }
  await Promise.all(batch);

  for (const [email, lines] of byEmail) {
    await sendEmail({
      to: [email],
      subject: `Capture alerts — ${lines.length} item(s)`,
      html: `<h2>Capture Management Alerts</h2><ul>${lines.map((l) => `<li>${l}</li>`).join("")}</ul>`,
      text: lines.join("\n"),
    }).catch((e) => console.error("[capture/alerts] email failed:", e));
  }

  return NextResponse.json({ evaluated: alerts.length, sent: fresh.length, emails: byEmail.size });
}

export async function GET(req: NextRequest) {
  const authErr = await checkCronAuth(req);
  if (authErr) return authErr;
  return run();
}

export async function POST(req: NextRequest) {
  const authErr = await checkCronAuth(req);
  if (authErr) return authErr;
  return run();
}
