import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { collection, addDoc, getDocs, query, where, Timestamp } from "firebase/firestore";
import { COLLECTIONS } from "@/lib/schema";
import crypto from "crypto";

// GET /api/kiosk/upload-links - List upload links, optionally filtered
export async function GET(request: NextRequest) {
  try {
    if (!db) {
      return NextResponse.json(
        { error: "Database not initialized" },
        { status: 500 }
      );
    }

    const { searchParams } = new URL(request.url);
    const patientId = searchParams.get("patientId");
    const status = searchParams.get("status");

    const linksRef = collection(db, COLLECTIONS.KIOSK_DOCUMENT_UPLOAD_LINKS);
    const constraints: any[] = [];

    if (patientId) constraints.push(where("patientId", "==", patientId));
    if (status && status !== "all") constraints.push(where("status", "==", status));

    const q = constraints.length > 0
      ? query(linksRef, ...constraints)
      : query(linksRef);

    const snapshot = await getDocs(q);
    const links = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    return NextResponse.json({ data: links });
  } catch (error) {
    console.error("Error fetching upload links:", error);
    return NextResponse.json(
      { error: "Failed to fetch upload links" },
      { status: 500 }
    );
  }
}

// POST /api/kiosk/upload-links - Generate a new upload link
export async function POST(request: NextRequest) {
  try {
    if (!db) {
      return NextResponse.json(
        { error: "Database not initialized" },
        { status: 500 }
      );
    }

    const body = await request.json();

    if (!body.patientId || !body.patientName) {
      return NextResponse.json(
        { error: "Missing required fields: patientId, patientName" },
        { status: 400 }
      );
    }

    // Generate a unique token
    const token = crypto.randomBytes(24).toString("hex");

    // Default expiry: 10 minutes for QR code flow, 7 days for email links
    const expiryMinutes = body.expiresMinutes || (body.expiresInDays ? body.expiresInDays * 24 * 60 : 10);
    const expiresAt = Timestamp.fromDate(new Date(Date.now() + expiryMinutes * 60 * 1000));

    const linkData = {
      token,
      patientId: body.patientId,
      reviewId: body.reviewId || null,
      reminderId: body.reminderId || null,
      patientName: body.patientName,
      language: body.language || "english",
      requestedDocuments: body.requestedDocuments || [],
      documents: [], // Changed from uploadedDocuments to documents for consistency
      status: "active",
      maxUploads: body.maxUploads || 10,
      expiresAt,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      createdBy: body.createdBy || "staff",
    };

    const linksRef = collection(db, COLLECTIONS.KIOSK_DOCUMENT_UPLOAD_LINKS);
    const docRef = await addDoc(linksRef, linkData);

    // Build the full upload URL
    const baseUrl = request.headers.get("origin") || request.headers.get("host") || "";
    const uploadUrl = `${baseUrl.startsWith("http") ? baseUrl : `https://${baseUrl}`}/kiosk/upload/${token}`;

    return NextResponse.json({
      data: {
        id: docRef.id,
        ...linkData,
        uploadUrl,
      }
    }, { status: 201 });
  } catch (error) {
    console.error("Error creating upload link:", error);
    return NextResponse.json(
      { error: "Failed to create upload link" },
      { status: 500 }
    );
  }
}
