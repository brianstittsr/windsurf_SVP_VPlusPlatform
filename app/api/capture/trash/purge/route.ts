import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { COLLECTIONS } from "@/lib/schema";
import { captureAudit } from "@/lib/capture/audit";

const CRON_SECRET = process.env.CRON_SECRET;
const PURGE_AFTER_DAYS = 30;
const DAY_MS = 86_400_000;

function checkCronAuth(req: NextRequest): NextResponse | null {
  const authHeader = req.headers.get("authorization");
  if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return null;
}

/** Rule 10: hard-delete trashed items older than 30 days (+ orphaned tasks). */
async function run(): Promise<NextResponse> {
  if (!adminDb) return NextResponse.json({ error: "Database unavailable" }, { status: 500 });
  const cutoff = new Date(Date.now() - PURGE_AFTER_DAYS * DAY_MS);

  const [oppSnap, clientSnap, taskSnap] = await Promise.all([
    adminDb.collection(COLLECTIONS.CAPTURE_OPPORTUNITIES).get(),
    adminDb.collection(COLLECTIONS.CUSTOMERS).get(),
    adminDb.collection(COLLECTIONS.CAPTURE_TASKS).get(),
  ]);

  const purgedOppIds = new Set<string>();
  let purgedOpps = 0;
  let purgedClients = 0;
  let purgedTasks = 0;
  const batch = adminDb.batch();
  let ops = 0;

  const flush = async () => {
    if (ops > 0) {
      await batch.commit();
      ops = 0;
    }
  };

  for (const d of oppSnap.docs) {
    const del = d.data().deletedAt?.toDate?.();
    if (del && del < cutoff) {
      batch.delete(d.ref);
      purgedOppIds.add(d.id);
      purgedOpps++;
      if (++ops >= 400) await flush();
      await captureAudit({
        type: "delete",
        entityType: "capture-opportunity",
        entityId: d.id,
        entityName: d.data().title || "",
        description: `Permanently purged "${d.data().title || d.id}" after 30 days in trash`,
        userId: "system",
      });
    }
  }
  for (const d of clientSnap.docs) {
    const del = d.data().deletedAt?.toDate?.();
    if (del && del < cutoff) {
      batch.delete(d.ref);
      purgedClients++;
      if (++ops >= 400) await flush();
    }
  }
  for (const d of taskSnap.docs) {
    if (purgedOppIds.has(d.data().opportunityId)) {
      batch.delete(d.ref);
      purgedTasks++;
      if (++ops >= 400) await flush();
    }
  }
  await flush();

  return NextResponse.json({ purgedOpportunities: purgedOpps, purgedClients, purgedTasks });
}

export async function GET(req: NextRequest) {
  const authErr = checkCronAuth(req);
  if (authErr) return authErr;
  return run();
}

export async function POST(req: NextRequest) {
  const authErr = checkCronAuth(req);
  if (authErr) return authErr;
  return run();
}
