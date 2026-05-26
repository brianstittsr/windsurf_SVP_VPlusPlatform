import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { collection, addDoc, getDocs, query, where, Timestamp } from "firebase/firestore";
import { COLLECTIONS } from "@/lib/schema";
import crypto from "crypto";

// GET /api/kiosk/signature-sessions - List signature sessions, optionally filtered
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

    const sessionsRef = collection(db, COLLECTIONS.KIOSK_SIGNATURE_SESSIONS);
    const constraints: any[] = [];

    if (patientId) constraints.push(where("patientId", "==", patientId));
    if (status && status !== "all") constraints.push(where("status", "==", status));

    const q = constraints.length > 0
      ? query(sessionsRef, ...constraints)
      : query(sessionsRef);

    const snapshot = await getDocs(q);
    const sessions = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    return NextResponse.json({ data: sessions });
  } catch (error) {
    console.error("Error fetching signature sessions:", error);
    return NextResponse.json(
      { error: "Failed to fetch signature sessions" },
      { status: 500 }
    );
  }
}

// POST /api/kiosk/signature-sessions - Generate a new signature session
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

    // Default expiry: 10 minutes
    const expiresAt = body.expiresInMinutes
      ? Timestamp.fromDate(new Date(Date.now() + body.expiresInMinutes * 60 * 1000))
      : Timestamp.fromDate(new Date(Date.now() + 10 * 60 * 1000));

    const sessionData = {
      token,
      patientId: body.patientId,
      sessionId: body.sessionId || null,
      applicationId: body.applicationId || null,
      patientName: body.patientName,
      signatureDataUrl: null,
      status: "pending",
      language: body.language || "english",
      expiresAt,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      createdBy: body.createdBy || "staff",
    };

    const sessionsRef = collection(db, COLLECTIONS.KIOSK_SIGNATURE_SESSIONS);
    const docRef = await addDoc(sessionsRef, sessionData);

    // Build the full signature URL
    const baseUrl = request.headers.get("origin") || request.headers.get("host") || "";
    const signatureUrl = `${baseUrl.startsWith("http") ? baseUrl : `https://${baseUrl}`}/kiosk-sign/${token}`;

    return NextResponse.json({
      data: {
        id: docRef.id,
        ...sessionData,
        signatureUrl,
      }
    }, { status: 201 });
  } catch (error) {
    console.error("Error creating signature session:", error);
    return NextResponse.json(
      { error: "Failed to create signature session" },
      { status: 500 }
    );
  }
}
