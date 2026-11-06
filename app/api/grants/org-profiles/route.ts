import { NextRequest, NextResponse } from "next/server";
import { Timestamp } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase-admin";
import { COLLECTIONS, type GrantOrgProfileDoc } from "@/lib/schema";
import { requireGrantStaff } from "@/lib/grants/access";
import { serializeDoc } from "@/lib/capture/serialize";
import { captureAudit } from "@/lib/capture/audit";
import { orgProfileCreateSchema } from "@/lib/grants/validation";
import { analyzeOrgUrl } from "@/lib/grants/orgprofile";

/** GET /api/grants/org-profiles — list org profiles. */
export async function GET(req: NextRequest) {
  const user = await requireGrantStaff(req);
  if (user instanceof NextResponse) return user;
  if (!adminDb) return NextResponse.json({ error: "Database unavailable" }, { status: 500 });

  const snap = await adminDb.collection(COLLECTIONS.GRANT_ORG_PROFILES).get();
  const profiles = snap.docs
    .map((d) => serializeDoc({ id: d.id, ...d.data() } as GrantOrgProfileDoc))
    .sort((a, b) => (b.updatedAt as unknown as string || "").localeCompare((a.updatedAt as unknown as string) || ""));
  return NextResponse.json({ profiles });
}

/** POST /api/grants/org-profiles — create a profile (AI-analyze websiteUrl, or manual fields). */
export async function POST(req: NextRequest) {
  const user = await requireGrantStaff(req);
  if (user instanceof NextResponse) return user;
  if (!adminDb) return NextResponse.json({ error: "Database unavailable" }, { status: 500 });

  const body = await req.json().catch(() => null);
  const parsed = orgProfileCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || "Invalid request" }, { status: 400 });
  }
  const data = parsed.data;
  const now = Timestamp.now();

  let fields: Omit<GrantOrgProfileDoc, "id" | "createdBy" | "createdAt" | "updatedAt">;
  if (data.websiteUrl) {
    try {
      const { profile } = await analyzeOrgUrl(data.websiteUrl);
      fields = {
        name: data.name || profile.name,
        websiteUrl: data.websiteUrl,
        mission: profile.mission,
        productsServices: profile.productsServices,
        populationServed: profile.populationServed,
        keyPrograms: profile.keyPrograms,
        extractedMarkdown: profile.extractedMarkdown,
        customerId: data.customerId,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Analysis failed";
      return NextResponse.json({ error: message }, { status: 422 });
    }
  } else {
    if (!data.name) return NextResponse.json({ error: "Provide a website URL or an organization name" }, { status: 400 });
    fields = {
      name: data.name,
      mission: data.mission,
      productsServices: data.productsServices || [],
      populationServed: data.populationServed,
      keyPrograms: data.keyPrograms || [],
      customerId: data.customerId,
    };
  }

  const doc = {
    ...fields,
    createdBy: user.teamMemberId || user.uid,
    createdAt: now,
    updatedAt: now,
  } as unknown as Omit<GrantOrgProfileDoc, "id">;
  const ref = await adminDb.collection(COLLECTIONS.GRANT_ORG_PROFILES).add(doc);
  await captureAudit({
    type: "create",
    entityType: "grant-org-profile",
    entityId: ref.id,
    entityName: doc.name,
    description: `${user.displayName} created org profile "${doc.name}"`,
    userId: user.uid,
  });
  return NextResponse.json({ profile: serializeDoc({ id: ref.id, ...doc }) }, { status: 201 });
}
