import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase-admin";
import { COLLECTIONS } from "@/lib/schema";
import { getCaptureSettings } from "@/lib/capture/settings";
import { scoreMatch, meetsCutoff } from "@/lib/capture/match-score";
import { searchSamOpportunities } from "@/lib/capture/sam-search";
import { requireUser } from "@/lib/capture/server-auth";
import type { CustomerDoc } from "@/lib/schema";

const CRON_SECRET = process.env.CRON_SECRET;

/** Cron Bearer OR an authenticated admin user (manual "run now"). */
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

/**
 * 6-hourly matching cron: runs each active saved search against the SAM
 * opportunities API, scores hits against every capture client, and upserts
 * captureMatches for scores at/above the cutoff.
 */
async function run(): Promise<NextResponse> {
  if (!adminDb) return NextResponse.json({ error: "Database unavailable" }, { status: 500 });
  const settings = await getCaptureSettings();

  const [searchSnap, clientSnap] = await Promise.all([
    adminDb.collection(COLLECTIONS.CAPTURE_SAVED_SEARCHES).where("isActive", "==", true).get(),
    adminDb.collection(COLLECTIONS.CUSTOMERS).get(),
  ]);
  const clients = clientSnap.docs
    .map((d) => ({ id: d.id, ...(d.data() as Omit<CustomerDoc, "id">) }))
    .filter((c) => c.isCaptureClient && !c.deletedAt);
  if (searchSnap.empty || clients.length === 0) {
    return NextResponse.json({ searches: searchSnap.size, notices: 0, matches: 0 });
  }

  // Dedupe notices across searches by noticeId
  const seen = new Map<string, ReturnType<typeof Object>>();
  const errors: string[] = [];
  for (const s of searchSnap.docs) {
    const q = s.data();
    const { notices, error } = await searchSamOpportunities({
      keyword: q.query || undefined,
      naicsCode: q.naicsCode || undefined,
      setAside: q.setAside || undefined,
      limit: 50,
    });
    if (error) {
      errors.push(`${q.name || s.id}: ${error}`);
      continue;
    }
    for (const n of notices) if (!seen.has(n.noticeId)) seen.set(n.noticeId, n as never);
    await adminDb
      .collection(COLLECTIONS.CAPTURE_SAVED_SEARCHES)
      .doc(s.id)
      .update({ lastRunAt: FieldValue.serverTimestamp(), lastResultCount: notices.length });
  }

  let created = 0;
  for (const noticeRaw of seen.values()) {
    const notice = noticeRaw as {
      noticeId: string; title?: string; solicitationNumber?: string;
      department?: string; subTier?: string; office?: string;
      setAside?: string; naicsCode?: string; classificationCode?: string;
      description?: string; responseDeadLine?: string;
    };
    // Skip notices already in queue for every client pairing check happens per-client below
    for (const client of clients) {
      const { score, breakdown } = scoreMatch(
        {
          naicsCode: notice.naicsCode,
          setAside: notice.setAside,
          agency: notice.department || notice.subTier,
          office: notice.office,
          title: notice.title,
          description: notice.description,
          pscCode: notice.classificationCode,
        },
        client as CustomerDoc,
        settings
      );
      if (!meetsCutoff(score, settings)) continue;

      // Dedupe: one pending match per notice+client
      const existing = await adminDb
        .collection(COLLECTIONS.CAPTURE_MATCHES)
        .where("samNoticeId", "==", notice.noticeId)
        .where("clientId", "==", client.id)
        .limit(1)
        .get();
      if (!existing.empty) continue;

      await adminDb.collection(COLLECTIONS.CAPTURE_MATCHES).add({
        clientId: client.id,
        clientName: client.name || "",
        samNoticeId: notice.noticeId,
        title: notice.title || "",
        solicitationNumber: notice.solicitationNumber || "",
        agency: notice.department || notice.subTier || "",
        office: notice.office || null,
        naicsCode: notice.naicsCode || null,
        setAside: notice.setAside || null,
        pscCode: notice.classificationCode || null,
        description: notice.description || null,
        responseDeadline: notice.responseDeadLine || null,
        samUrl: `https://sam.gov/opp/${notice.noticeId}/view`,
        score,
        scoreBreakdown: breakdown,
        status: "pending",
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });
      created++;
    }
  }

  return NextResponse.json({
    searches: searchSnap.size,
    notices: seen.size,
    matches: created,
    errors: errors.length ? errors : undefined,
  });
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
