import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { collection, getDocs, query, where, doc, updateDoc, Timestamp } from "firebase/firestore";
import { COLLECTIONS } from "@/lib/schema";

// GET /api/kiosk/signature-sessions/[token] - Get session info by token (public)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    if (!db) {
      return NextResponse.json(
        { error: "Database not initialized" },
        { status: 500 }
      );
    }

    const { token } = await params;
    const sessionsRef = collection(db, COLLECTIONS.KIOSK_SIGNATURE_SESSIONS);
    const q = query(sessionsRef, where("token", "==", token));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      return NextResponse.json(
        { error: "Signature session not found or expired" },
        { status: 404 }
      );
    }

    const sessionDoc = snapshot.docs[0];
    const sessionData = sessionDoc.data() as any;

    // Check expiry
    const expiresAt = sessionData.expiresAt?.toDate?.() || new Date(sessionData.expiresAt?.seconds * 1000);
    if (expiresAt < new Date()) {
      // Mark as expired
      await updateDoc(doc(db, COLLECTIONS.KIOSK_SIGNATURE_SESSIONS, sessionDoc.id), {
        status: "expired",
        updatedAt: Timestamp.now(),
      });
      return NextResponse.json(
        { error: "This signature session has expired" },
        { status: 410 }
      );
    }

    if (sessionData.status === "signed") {
      return NextResponse.json(
        { error: "This signature has already been submitted" },
        { status: 410 }
      );
    }

    if (sessionData.status !== "pending") {
      return NextResponse.json(
        { error: `This signature session is ${sessionData.status}` },
        { status: 410 }
      );
    }

    return NextResponse.json({
      data: {
        id: sessionDoc.id,
        patientName: sessionData.patientName,
        language: sessionData.language,
        status: sessionData.status,
      }
    });
  } catch (error) {
    console.error("Error fetching signature session:", error);
    return NextResponse.json(
      { error: "Failed to fetch signature session" },
      { status: 500 }
    );
  }
}

// POST /api/kiosk/signature-sessions/[token] - Upload signature to session
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    if (!db) {
      return NextResponse.json(
        { error: "Database not initialized" },
        { status: 500 }
      );
    }

    const { token } = await params;
    const body = await request.json();

    if (!body.signatureDataUrl) {
      return NextResponse.json(
        { error: "Missing required field: signatureDataUrl" },
        { status: 400 }
      );
    }

    const sessionsRef = collection(db, COLLECTIONS.KIOSK_SIGNATURE_SESSIONS);
    const q = query(sessionsRef, where("token", "==", token));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      return NextResponse.json(
        { error: "Signature session not found" },
        { status: 404 }
      );
    }

    const sessionDoc = snapshot.docs[0];
    const sessionData = sessionDoc.data() as any;

    if (sessionData.status !== "pending") {
      return NextResponse.json(
        { error: "This signature session is no longer pending" },
        { status: 410 }
      );
    }

    // Update with signature
    await updateDoc(doc(db, COLLECTIONS.KIOSK_SIGNATURE_SESSIONS, sessionDoc.id), {
      signatureDataUrl: body.signatureDataUrl,
      signedAt: Timestamp.now(),
      status: "signed",
      updatedAt: Timestamp.now(),
    });

    return NextResponse.json({
      data: {
        success: true,
        status: "signed",
      }
    });
  } catch (error) {
    console.error("Error updating signature session:", error);
    return NextResponse.json(
      { error: "Failed to save signature" },
      { status: 500 }
    );
  }
}
