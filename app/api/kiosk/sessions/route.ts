import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { collection, addDoc, getDocs, Timestamp } from "firebase/firestore";
import { COLLECTIONS, type KioskIntakeSessionDoc } from "@/lib/schema";

// GET /api/kiosk/sessions - List all intake sessions
export async function GET(request: NextRequest) {
  try {
    if (!db) {
      return NextResponse.json(
        { error: "Database not initialized" },
        { status: 500 }
      );
    }

    const sessionsRef = collection(db, COLLECTIONS.KIOSK_INTAKE_SESSIONS);
    const snapshot = await getDocs(sessionsRef);
    
    const sessions = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    return NextResponse.json({ data: sessions });
  } catch (error) {
    console.error("Error fetching sessions:", error);
    return NextResponse.json(
      { error: "Failed to fetch sessions" },
      { status: 500 }
    );
  }
}

// POST /api/kiosk/sessions - Create a new intake session
export async function POST(request: NextRequest) {
  try {
    if (!db) {
      return NextResponse.json(
        { error: "Database not initialized" },
        { status: 500 }
      );
    }

    const body = await request.json();
    
    // Validate required fields
    if (!body.patientId) {
      return NextResponse.json(
        { error: "Missing required field: patientId" },
        { status: 400 }
      );
    }

    // Generate unique session ID
    const sessionId = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Create intake session document
    const sessionData: Omit<KioskIntakeSessionDoc, "id"> = {
      sessionId,
      patientId: body.patientId,
      kioskId: body.kioskId || undefined,
      currentStep: body.currentStep || 1,
      totalSteps: body.totalSteps || 5,
      completedSteps: body.completedSteps || [],
      formData: body.formData || {},
      selectedLanguage: body.selectedLanguage || "english",
      status: "in_progress",
      startedAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };

    const sessionsRef = collection(db, COLLECTIONS.KIOSK_INTAKE_SESSIONS);
    const docRef = await addDoc(sessionsRef, sessionData);

    return NextResponse.json({ 
      data: { 
        id: docRef.id, 
        ...sessionData 
      } 
    }, { status: 201 });
  } catch (error) {
    console.error("Error creating intake session:", error);
    return NextResponse.json(
      { error: "Failed to create intake session" },
      { status: 500 }
    );
  }
}
