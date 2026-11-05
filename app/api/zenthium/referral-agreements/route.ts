import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { COLLECTIONS } from "@/lib/schema";
import { Timestamp } from "firebase-admin/firestore";
import { z } from "zod";

const contractorSchema = z.object({
  name: z.string().min(1),
  company: z.string().min(1),
  email: z.string().email(),
  phone: z.string().optional().default(""),
});

const signatureSchema = z.object({
  data: z.string(),
  type: z.enum(["draw", "type"]),
  signedAt: z.string(),
  signerName: z.string(),
});

const agreementSchema = z.object({
  propertyAddress: z.string().min(1),
  propertyType: z.string().optional().default(""),
  referralFeePercentage: z.number().min(0).max(100).default(3),
  specialInstructions: z.string().optional().default(""),
  contractor: contractorSchema,
  contractorSignature: signatureSchema.optional(),
  status: z.enum(["draft", "sent", "signed", "completed"]).default("draft"),
  finalDocumentBase64: z.string().optional(),
});

export async function GET() {
  if (!adminDb) {
    return NextResponse.json({ error: "Database not initialized" }, { status: 500 });
  }
  try {
    const snap = await adminDb
      .collection(COLLECTIONS.ZENTHIUM_REFERRAL_AGREEMENTS)
      .orderBy("createdAt", "desc")
      .get();

    const agreements = snap.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate?.()?.toISOString() ?? data.createdAt,
        updatedAt: data.updatedAt?.toDate?.()?.toISOString() ?? data.updatedAt,
        signedAt: data.signedAt?.toDate?.()?.toISOString() ?? data.signedAt ?? null,
      };
    });

    return NextResponse.json({ agreements });
  } catch (error) {
    console.error("[Zenthium] GET referral-agreements error:", error);
    return NextResponse.json({ error: "Failed to fetch agreements" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  if (!adminDb) {
    return NextResponse.json({ error: "Database not initialized" }, { status: 500 });
  }
  try {
    const body: unknown = await request.json();
    const parsed = agreementSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const now = Timestamp.now();
    const d = parsed.data;

    const docData = {
      propertyAddress: d.propertyAddress,
      propertyType: d.propertyType,
      referralFeePercentage: d.referralFeePercentage,
      specialInstructions: d.specialInstructions,
      contractor: d.contractor,
      contractorSignature: d.contractorSignature ?? null,
      nelinaSignature: {
        signerName: "Nelinia Varenas",
        type: "pre-signed",
        signedAt: now.toDate().toISOString(),
      },
      status: d.status,
      finalDocumentBase64: d.finalDocumentBase64 ?? null,
      createdAt: now,
      updatedAt: now,
      signedAt: d.contractorSignature ? now : null,
    };

    const ref = adminDb.collection(COLLECTIONS.ZENTHIUM_REFERRAL_AGREEMENTS).doc();
    await ref.set(docData);

    return NextResponse.json({ success: true, id: ref.id }, { status: 201 });
  } catch (error) {
    console.error("[Zenthium] POST referral-agreement error:", error);
    return NextResponse.json({ error: "Failed to create agreement" }, { status: 500 });
  }
}
