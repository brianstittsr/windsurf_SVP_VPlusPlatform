import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { doc, getDoc, updateDoc, deleteDoc, Timestamp } from "firebase/firestore";
import { COLLECTIONS, type KioskPatientReminderDoc } from "@/lib/schema";

// GET /api/kiosk/reminders/[id]
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
    const reminderRef = doc(db, COLLECTIONS.KIOSK_PATIENT_REMINDERS, id);
    const snapshot = await getDoc(reminderRef);

    if (!snapshot.exists()) {
      return NextResponse.json(
        { error: "Reminder not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      data: { id: snapshot.id, ...snapshot.data() }
    });
  } catch (error) {
    console.error("Error fetching reminder:", error);
    return NextResponse.json(
      { error: "Failed to fetch reminder" },
      { status: 500 }
    );
  }
}

// PATCH /api/kiosk/reminders/[id] - Update reminder status
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
    const reminderRef = doc(db, COLLECTIONS.KIOSK_PATIENT_REMINDERS, id);

    const updateData: Partial<KioskPatientReminderDoc> = {
      updatedAt: Timestamp.now(),
    };

    if (body.status) {
      updateData.status = body.status;
      if (body.status === "sent") updateData.sentAt = Timestamp.now();
      if (body.status === "acknowledged") updateData.acknowledgedAt = Timestamp.now();
      if (body.status === "resolved") {
        updateData.resolvedAt = Timestamp.now();
        if (body.resolvedBy) updateData.resolvedBy = body.resolvedBy;
        if (body.resolutionNotes) updateData.resolutionNotes = body.resolutionNotes;
      }
    }

    if (body.title) updateData.title = body.title;
    if (body.message) updateData.message = body.message;
    if (body.missingItems) updateData.missingItems = body.missingItems;
    if (body.deliveryMethod) updateData.deliveryMethod = body.deliveryMethod;
    if (body.reminderType) updateData.reminderType = body.reminderType;

    await updateDoc(reminderRef, updateData);

    return NextResponse.json({
      data: { id, ...updateData }
    });
  } catch (error) {
    console.error("Error updating reminder:", error);
    return NextResponse.json(
      { error: "Failed to update reminder" },
      { status: 500 }
    );
  }
}

// DELETE /api/kiosk/reminders/[id]
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
    const reminderRef = doc(db, COLLECTIONS.KIOSK_PATIENT_REMINDERS, id);
    await deleteDoc(reminderRef);

    return NextResponse.json({ data: { id, deleted: true } });
  } catch (error) {
    console.error("Error deleting reminder:", error);
    return NextResponse.json(
      { error: "Failed to delete reminder" },
      { status: 500 }
    );
  }
}
