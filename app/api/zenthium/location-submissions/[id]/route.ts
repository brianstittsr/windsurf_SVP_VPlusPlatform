import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { COLLECTIONS } from "@/lib/schema";
import { Timestamp } from "firebase-admin/firestore";
import { z } from "zod";

const patchSchema = z.object({
  title: z.string().optional(),
  submitterName: z.string().optional(),
  submitterEmail: z.string().email().optional(),
  submitterPhone: z.string().optional(),
  submitterCompany: z.string().optional(),
  propertyName: z.string().optional(),
  parcelNumber: z.string().optional(),
  propertyType: z.enum(["vacant_land", "warehouse", "industrial", "office", "data_center", "power_plant", "other"]).optional(),
  propertyTypeOther: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zip: z.string().optional(),
  country: z.string().optional(),
  squareFootage: z.number().optional(),
  acreage: z.number().optional(),
  powerAvailableMW: z.number().optional(),
  powerType: z.enum(["grid", "behind_meter", "renewable", "combined", "unknown"]).optional(),
  hasBackupPower: z.boolean().optional(),
  ceilingHeightFt: z.number().optional(),
  isSingleStory: z.boolean().optional(),
  isFloor: z.boolean().optional(),
  fiberAvailable: z.boolean().optional(),
  fiberProviders: z.string().optional(),
  waterAvailable: z.boolean().optional(),
  waterSource: z.string().optional(),
  coolingCapacity: z.string().optional(),
  hvacInstalled: z.boolean().optional(),
  zoningClassification: z.string().optional(),
  ownershipType: z.enum(["own", "lease", "option", "other"]).optional(),
  askingPrice: z.string().optional(),
  leaseRate: z.string().optional(),
  timeline: z.string().optional(),
  environmentalClearance: z.enum(["clean", "phase1_done", "phase2_done", "unknown", "issues"]).optional(),
  floodZone: z.boolean().optional(),
  coordinates: z.string().optional(),
  additionalNotes: z.string().optional(),
  directContactId: z.string().optional(),
  directContactName: z.string().optional(),
  directContactEmail: z.string().optional(),
  directContactPhone: z.string().optional(),
  directContactCompany: z.string().optional(),
  status: z.string().optional(),
  adminNotes: z.string().optional(),
});

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!adminDb) return NextResponse.json({ error: "Database not initialized" }, { status: 500 });
  const { id } = await params;
  try {
    const doc = await adminDb.collection(COLLECTIONS.ZENTHIUM_LOCATION_SUBMISSIONS).doc(id).get();
    if (!doc.exists) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const raw = doc.data() ?? {};

    // Transform nested format (from ZenthiumLocationModal) to flat format (for submissions detail page)
    // This ensures compatibility between the new form structure and the legacy detail view
    const address = raw.address ?? {};
    const poc = raw.poc ?? {};
    const directContact = raw.directContact ?? {};

    // Handle both nested and flat address structures
    let addr: any = {};
    if (typeof raw.address === 'string') {
      // Flat address - store as is
      addr = { street: raw.address, city: raw.city || '', state: raw.state || '', zip: raw.zip || '', country: raw.country || 'US' };
    } else if (typeof raw.address === 'object' && raw.address !== null) {
      // Nested address object
      addr = raw.address;
    } else {
      // No address data
      addr = { street: '', city: raw.city || '', state: raw.state || '', zip: raw.zip || '', country: raw.country || 'US' };
    }

    const flattened = {
      id: doc.id,
      title: raw.title ?? `${raw.propertyName ?? "Property"} — ${addr.city ?? "Unknown Location"}`,
      // Submitter info (from POC in new format)
      submitterName: poc.name ?? raw.submitterName ?? "",
      submitterEmail: poc.email ?? raw.submitterEmail ?? "",
      submitterPhone: poc.phone ?? raw.submitterPhone ?? "",
      submitterCompany: poc.company ?? raw.submitterCompany ?? "",
      // Property info
      propertyName: raw.propertyName ?? "",
      propertyType: typeof raw.propertyType === 'object' ? (raw.propertyType as any).label || (raw.propertyType as any).value || '' : raw.propertyType ?? "",
      propertyTypeOther: raw.propertyTypeOther ?? "",
      // Address (flattened)
      address: typeof raw.address === 'string' ? raw.address : addr.street ?? "",
      city: typeof raw.city === 'string' ? raw.city : addr.city ?? "",
      state: typeof raw.state === 'string' ? raw.state : addr.state ?? "",
      zip: typeof raw.zip === 'string' ? raw.zip : addr.zip ?? "",
      country: typeof raw.country === 'string' ? raw.country : addr.country ?? "US",
      coordinates: raw.coordinates ?? "",
      parcelNumber: raw.parcelNumber ?? "",
      // Size
      squareFootage: raw.squareFootage ?? undefined,
      acreage: raw.acreage ?? undefined,
      // Power (note: new form uses powerCapacityMW, old format expects powerAvailableMW)
      powerAvailableMW: raw.powerCapacityMW ?? raw.powerAvailableMW ?? undefined,
      powerType: raw.powerType ?? "",
      hasBackupPower: raw.hasBackupPower ?? false,
      // Building features
      ceilingHeightFt: raw.ceilingHeightFt ?? undefined,
      isSingleStory: raw.isSingleStory ?? false,
      isFloor: raw.isFloor ?? false,
      // Connectivity (new form uses fiberAvailability/waterAvailability strings, map to boolean + providers)
      fiberAvailable: !!raw.fiberAvailability || !!raw.fiberProviders || raw.fiberAvailable || false,
      fiberProviders: raw.fiberProviders ?? raw.fiberAvailability ?? "",
      waterAvailable: !!raw.waterAvailability || !!raw.waterSource || raw.waterAvailable || false,
      waterSource: raw.waterSource ?? raw.waterAvailability ?? "",
      coolingCapacity: raw.coolingCapacity ?? "",
      hvacInstalled: raw.hvacInstalled ?? false,
      // Zoning
      zoningClassification: raw.zoning ?? raw.zoningClassification ?? "",
      // Ownership & Pricing
      ownershipType: raw.ownershipType ?? "",
      askingPrice: raw.askingPrice ?? raw.pricing ?? "",
      leaseRate: raw.leaseRate ?? "",
      timeline: raw.timeline ?? "",
      // Environmental
      environmentalClearance: raw.environmentalClearance ?? "",
      floodZone: raw.floodZone ?? false,
      // Notes
      additionalNotes: raw.description ?? raw.additionalNotes ?? "",
      environmentalNotes: raw.environmentalNotes ?? "",
      // Direct Contact (mapped from directContact object or directContactId fields)
      directContactId: raw.directContactId ?? "",
      directContactName: directContact.name ?? raw.directContactName ?? "",
      directContactEmail: directContact.email ?? raw.directContactEmail ?? "",
      directContactPhone: directContact.phone ?? raw.directContactPhone ?? "",
      directContactCompany: directContact.company ?? raw.directContactCompany ?? "",
      // Meta
      status: raw.status ?? "Submitted",
      adminNotes: raw.adminNotes ?? "",
      createdAt: raw.createdAt?.toDate().toISOString(),
      updatedAt: raw.updatedAt?.toDate().toISOString(),
    };

    return NextResponse.json({ submission: flattened });
  } catch (error) {
    console.error("[Zenthium] GET location-submission by id error:", error);
    return NextResponse.json({ error: "Failed to fetch submission" }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!adminDb) return NextResponse.json({ error: "Database not initialized" }, { status: 500 });
  const { id } = await params;
  try {
    const body: unknown = await request.json();
    const parsed = patchSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Validation failed", details: parsed.error.flatten() }, { status: 400 });
    }
    await adminDb
      .collection(COLLECTIONS.ZENTHIUM_LOCATION_SUBMISSIONS)
      .doc(id)
      .update({ ...parsed.data, updatedAt: Timestamp.now() });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Zenthium] PATCH location-submission error:", error);
    return NextResponse.json({ error: "Failed to update submission" }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!adminDb) return NextResponse.json({ error: "Database not initialized" }, { status: 500 });
  const { id } = await params;
  try {
    await adminDb.collection(COLLECTIONS.ZENTHIUM_LOCATION_SUBMISSIONS).doc(id).delete();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Zenthium] DELETE location-submission error:", error);
    return NextResponse.json({ error: "Failed to delete submission" }, { status: 500 });
  }
}
