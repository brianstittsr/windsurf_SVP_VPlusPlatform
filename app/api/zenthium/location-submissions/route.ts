import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { COLLECTIONS } from "@/lib/schema";
import { Timestamp } from "firebase-admin/firestore";
import { z } from "zod";

const contactSchema = z.object({
  name: z.string().optional().default(""),
  email: z.string().optional().default(""),
  phone: z.string().optional().default(""),
  company: z.string().optional().default(""),
});

const submissionSchema = z.object({
  title: z.string().optional(),
  propertyName: z.string().min(1, "Property name is required"),

  // Accept both flat and nested address structure
  address: z.string().optional().default(""),
  city: z.string().optional().default(""),
  state: z.string().optional().default(""),
  zip: z.string().optional().default(""),
  country: z.string().optional().default("US"),

  coordinates: z.string().optional().default(""),
  parcelNumber: z.string().optional().default(""),
  acreage: z.string().optional(),
  squareFootage: z.string().optional(),
  powerCapacityMW: z.string().optional(),
  powerAvailableMW: z.string().optional(),

  utilities: z.string().optional().default(""),
  fiberAvailability: z.string().optional().default(""),
  fiberAvailable: z.boolean().optional(),
  fiberProviders: z.string().optional().default(""),
  waterAvailability: z.string().optional().default(""),
  waterAvailable: z.boolean().optional(),
  waterSource: z.string().optional().default(""),
  zoning: z.string().optional().default(""),
  zoningClassification: z.string().optional().default(""),

  ownership: z.string().optional().default(""),
  ownershipType: z.string().optional().default(""),
  pricing: z.string().optional().default(""),
  askingPrice: z.string().optional().default(""),
  leaseRate: z.string().optional().default(""),
  timeline: z.string().optional().default(""),

  description: z.string().optional(),
  additionalNotes: z.string().optional().default(""),
  environmentalNotes: z.string().optional().default(""),
  environmentalClearance: z.string().optional().default(""),

  // Property features
  isSingleStory: z.boolean().optional(),
  isFloor: z.boolean().optional(),
  floodZone: z.boolean().optional(),
  ceilingHeightFt: z.string().optional(),
  powerType: z.string().optional(),
  hasBackupPower: z.boolean().optional(),
  hvacInstalled: z.boolean().optional(),
  coolingCapacity: z.string().optional(),

  // Contact info (flat fields from form)
  submitterName: z.string().optional(),
  submitterEmail: z.string().optional(),
  submitterPhone: z.string().optional(),
  submitterCompany: z.string().optional(),

  // Property type
  propertyType: z.string().optional(),

  // Nested contact objects (for API compatibility)
  poc: contactSchema.optional().default({ name: "", email: "", phone: "", company: "" }),
  directContact: contactSchema.optional().default({ name: "", email: "", phone: "", company: "" }),
});

// Transform nested submission data to flat format for list view
function flattenSubmission(doc: any, id: string) {
  const raw = doc;
  // Handle both nested and flat address structures
  let address: any = {};
  if (typeof raw.address === 'string') {
    // Flat address - store as is
    address = { street: raw.address, city: raw.city || '', state: raw.state || '', zip: raw.zip || '', country: raw.country || 'US' };
  } else if (typeof raw.address === 'object' && raw.address !== null) {
    // Nested address object
    address = raw.address;
  } else {
    // No address data
    address = { street: '', city: raw.city || '', state: raw.state || '', zip: raw.zip || '', country: raw.country || 'US' };
  }
  const poc = raw.poc ?? {};

  return {
    id,
    title: raw.title ?? `${raw.propertyName ?? "Property"} — ${address.city ?? "Unknown Location"}`,
    // Submitter info (from POC)
    submitterName: poc.name ?? raw.submitterName ?? "",
    submitterEmail: poc.email ?? raw.submitterEmail ?? "",
    submitterPhone: poc.phone ?? raw.submitterPhone ?? "",
    submitterCompany: poc.company ?? raw.submitterCompany ?? "",
    // Property
    propertyName: raw.propertyName ?? "",
    propertyType: typeof raw.propertyType === 'object' ? (raw.propertyType as any).label || (raw.propertyType as any).value || '' : raw.propertyType ?? "",
    // Address (flat)
    address: typeof raw.address === 'string' ? raw.address : address.street ?? "",
    city: typeof raw.city === 'string' ? raw.city : address.city ?? "",
    state: typeof raw.state === 'string' ? raw.state : address.state ?? "",
    zip: typeof raw.zip === 'string' ? raw.zip : address.zip ?? "",
    country: typeof raw.country === 'string' ? raw.country : address.country ?? "US",
    coordinates: raw.coordinates ?? "",
    // Size
    squareFootage: raw.squareFootage ?? undefined,
    acreage: raw.acreage ?? undefined,
    // Power
    powerAvailableMW: raw.powerCapacityMW ?? raw.powerAvailableMW ?? undefined,
    powerType: raw.powerType ?? "",
    hasBackupPower: raw.hasBackupPower ?? false,
    // Features
    fiberAvailable: !!raw.fiberAvailability || !!raw.fiberProviders || raw.fiberAvailable || false,
    fiberProviders: raw.fiberProviders ?? raw.fiberAvailability ?? "",
    waterAvailable: !!raw.waterAvailability || !!raw.waterSource || raw.waterAvailable || false,
    waterSource: raw.waterSource ?? raw.waterAvailability ?? "",
    zoningClassification: raw.zoning ?? raw.zoningClassification ?? "",
    // Pricing
    ownershipType: raw.ownershipType ?? "",
    askingPrice: raw.askingPrice ?? raw.pricing ?? "",
    leaseRate: raw.leaseRate ?? "",
    timeline: raw.timeline ?? "",
    // Notes
    additionalNotes: raw.description ?? raw.additionalNotes ?? "",
    environmentalNotes: raw.environmentalNotes ?? "",
    // Direct Contact
    directContactId: raw.directContactId ?? "",
    directContactName: raw.directContact?.name ?? raw.directContactName ?? "",
    directContactEmail: raw.directContact?.email ?? raw.directContactEmail ?? "",
    directContactPhone: raw.directContact?.phone ?? raw.directContactPhone ?? "",
    directContactCompany: raw.directContact?.company ?? raw.directContactCompany ?? "",
    // Meta
    status: raw.status ?? "Submitted",
    adminNotes: raw.adminNotes ?? "",
    createdAt: raw.createdAt?.toDate?.() ? raw.createdAt.toDate().toISOString() : raw.createdAt,
    updatedAt: raw.updatedAt?.toDate?.() ? raw.updatedAt.toDate().toISOString() : raw.updatedAt,
  };
}

export async function GET() {
  if (!adminDb) {
    return NextResponse.json({ error: "Database not initialized" }, { status: 500 });
  }
  try {
    const snap = await adminDb
      .collection(COLLECTIONS.ZENTHIUM_LOCATION_SUBMISSIONS)
      .orderBy("createdAt", "desc")
      .get();
    
    const submissions = snap.docs.map((doc) => flattenSubmission(doc.data(), doc.id));
    
    return NextResponse.json({ submissions });
  } catch (error) {
    console.error("[Zenthium] GET location-submissions error:", error);
    return NextResponse.json({ error: "Failed to fetch submissions" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  if (!adminDb) {
    return NextResponse.json({ error: "Database not initialized" }, { status: 500 });
  }

  try {
    const body: unknown = await request.json();
    const parsed = submissionSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Validation failed", details: parsed.error.flatten() }, { status: 400 });
    }

    const d = parsed.data;
    const now = Timestamp.now();

    // Transform flat form data to nested structure for database storage
    const docData = {
      title: d.title || d.propertyName,
      propertyName: d.propertyName,
      // Nested address structure for database
      address: {
        street: d.address || "",
        city: d.city || "",
        state: d.state || "",
        zip: d.zip || "",
        country: d.country || "US",
      },
      coordinates: d.coordinates || "",
      parcelNumber: d.parcelNumber || "",
      acreage: d.acreage ? Number(d.acreage) : undefined,
      squareFootage: d.squareFootage ? Number(d.squareFootage) : undefined,
      powerCapacityMW: d.powerCapacityMW ? Number(d.powerCapacityMW) : (d.powerAvailableMW ? Number(d.powerAvailableMW) : undefined),
      utilities: d.utilities || "",
      fiberAvailability: d.fiberAvailability || d.fiberProviders || "",
      fiberAvailable: d.fiberAvailable || !!d.fiberProviders,
      fiberProviders: d.fiberProviders || d.fiberAvailability || "",
      waterAvailability: d.waterAvailability || d.waterSource || "",
      waterAvailable: d.waterAvailable || !!d.waterSource,
      waterSource: d.waterSource || d.waterAvailability || "",
      zoning: d.zoning || d.zoningClassification || "",
      ownership: d.ownership || d.ownershipType || "",
      ownershipType: d.ownershipType || d.ownership || "",
      pricing: d.pricing || d.askingPrice || "",
      askingPrice: d.askingPrice || d.pricing || "",
      leaseRate: d.leaseRate || "",
      timeline: d.timeline || "",
      description: d.description || d.additionalNotes || "",
      additionalNotes: d.additionalNotes || d.description || "",
      environmentalNotes: d.environmentalNotes || "",
      environmentalClearance: d.environmentalClearance || "",
      // Property features
      isSingleStory: d.isSingleStory || false,
      isFloor: d.isFloor || false,
      floodZone: d.floodZone || false,
      ceilingHeightFt: d.ceilingHeightFt ? Number(d.ceilingHeightFt) : undefined,
      powerType: d.powerType || "",
      hasBackupPower: d.hasBackupPower || false,
      hvacInstalled: d.hvacInstalled || false,
      coolingCapacity: d.coolingCapacity || "",
      // Contact info - use flat fields from form, fall back to nested
      poc: {
        name: d.submitterName || d.poc?.name || "",
        email: d.submitterEmail || d.poc?.email || "",
        phone: d.submitterPhone || d.poc?.phone || "",
        company: d.submitterCompany || d.poc?.company || "",
      },
      directContact: d.directContact || { name: "", email: "", phone: "", company: "" },
      // Also store flat fields for backward compatibility
      submitterName: d.submitterName || d.poc?.name || "",
      submitterEmail: d.submitterEmail || d.poc?.email || "",
      submitterPhone: d.submitterPhone || d.poc?.phone || "",
      submitterCompany: d.submitterCompany || d.poc?.company || "",
      // Additional fields from form
      propertyType: d.propertyType || "",
      status: "Submitted",
      adminNotes: "",
      source: "public_location_form",
      createdAt: now,
      updatedAt: now,
    };

    const ref = adminDb.collection(COLLECTIONS.ZENTHIUM_LOCATION_SUBMISSIONS).doc();
    await ref.set(docData);

    return NextResponse.json({ success: true, id: ref.id }, { status: 201 });
  } catch (error) {
    console.error("[Zenthium] POST location submission error:", error);
    return NextResponse.json({ error: "Failed to submit location" }, { status: 500 });
  }
}
