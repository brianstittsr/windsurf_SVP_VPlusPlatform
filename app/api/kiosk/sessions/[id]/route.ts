import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { doc, getDoc, updateDoc, deleteDoc, Timestamp } from "firebase/firestore";
import { COLLECTIONS, type KioskIntakeSessionDoc } from "@/lib/schema";

// GET /api/kiosk/sessions/[id] - Get a specific session
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!db) {
      return NextResponse.json(
        { error: "Database not initialized" },
        { status: 500 }
      );
    }

    const { id } = await params;
    const sessionRef = doc(db, COLLECTIONS.KIOSK_INTAKE_SESSIONS, id);
    const snapshot = await getDoc(sessionRef);

    if (!snapshot.exists()) {
      return NextResponse.json(
        { error: "Session not found" },
        { status: 404 }
      );
    }

    const session = {
      id: snapshot.id,
      ...snapshot.data()
    };

    return NextResponse.json({ data: session });
  } catch (error) {
    console.error("Error fetching session:", error);
    return NextResponse.json(
      { error: "Failed to fetch session" },
      { status: 500 }
    );
  }
}

// PATCH /api/kiosk/sessions/[id] - Update a session
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!db) {
      return NextResponse.json(
        { error: "Database not initialized" },
        { status: 500 }
      );
    }

    const { id } = await params;
    const body = await request.json();
    const sessionRef = doc(db, COLLECTIONS.KIOSK_INTAKE_SESSIONS, id);

    // Build update data
    const updateData: Partial<KioskIntakeSessionDoc> = {
      updatedAt: Timestamp.now(),
    };

    // Add optional fields if provided
    if (body.currentStep !== undefined) updateData.currentStep = body.currentStep;
    if (body.totalSteps !== undefined) updateData.totalSteps = body.totalSteps;
    if (body.completedSteps !== undefined) updateData.completedSteps = body.completedSteps;
    if (body.formData !== undefined) updateData.formData = body.formData;
    if (body.selectedLanguage) updateData.selectedLanguage = body.selectedLanguage;
    if (body.status) {
      updateData.status = body.status;
      if (body.status === "completed") {
        updateData.completedAt = Timestamp.now();
      } else if (body.status === "abandoned") {
        updateData.abandonedAt = Timestamp.now();
      }
    }

    await updateDoc(sessionRef, updateData);

    return NextResponse.json({ data: { id, ...updateData } });
  } catch (error) {
    console.error("Error updating session:", error);
    return NextResponse.json(
      { error: "Failed to update session" },
      { status: 500 }
    );
  }
}

// DELETE /api/kiosk/sessions/[id] - Delete a session
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!db) {
      return NextResponse.json(
        { error: "Database not initialized" },
        { status: 500 }
      );
    }

    const { id } = await params;
    const sessionRef = doc(db, COLLECTIONS.KIOSK_INTAKE_SESSIONS, id);
    await deleteDoc(sessionRef);

    return NextResponse.json({ data: { id, deleted: true } });
  } catch (error) {
    console.error("Error deleting session:", error);
    return NextResponse.json(
      { error: "Failed to delete session" },
      { status: 500 }
    );
  }
}
