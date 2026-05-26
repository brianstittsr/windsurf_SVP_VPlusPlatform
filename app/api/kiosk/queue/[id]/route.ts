import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { doc, getDoc, updateDoc, deleteDoc, Timestamp } from "firebase/firestore";
import { COLLECTIONS, type KioskQueueDoc } from "@/lib/schema";

// GET /api/kiosk/queue/[id] - Get a specific queue item
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
    const queueRef = doc(db, COLLECTIONS.KIOSK_QUEUE, id);
    const snapshot = await getDoc(queueRef);

    if (!snapshot.exists()) {
      return NextResponse.json(
        { error: "Queue item not found" },
        { status: 404 }
      );
    }

    const queueItem = {
      id: snapshot.id,
      ...snapshot.data()
    };

    return NextResponse.json({ data: queueItem });
  } catch (error) {
    console.error("Error fetching queue item:", error);
    return NextResponse.json(
      { error: "Failed to fetch queue item" },
      { status: 500 }
    );
  }
}

// PATCH /api/kiosk/queue/[id] - Update queue status
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
    const queueRef = doc(db, COLLECTIONS.KIOSK_QUEUE, id);

    // Build update data
    const updateData: Partial<KioskQueueDoc> = {
      updatedAt: Timestamp.now(),
    };

    if (body.status) {
      updateData.status = body.status;
      if (body.status === "in_service") {
        updateData.serviceStartedAt = Timestamp.now();
        updateData.assignedStaffId = body.assignedStaffId;
      } else if (body.status === "completed") {
        updateData.serviceCompletedAt = Timestamp.now();
      }
    }

    if (body.assignedStaffId !== undefined) {
      updateData.assignedStaffId = body.assignedStaffId;
    }

    await updateDoc(queueRef, updateData);

    return NextResponse.json({ data: { id, ...updateData } });
  } catch (error) {
    console.error("Error updating queue item:", error);
    return NextResponse.json(
      { error: "Failed to update queue item" },
      { status: 500 }
    );
  }
}

// DELETE /api/kiosk/queue/[id] - Remove from queue
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
    const queueRef = doc(db, COLLECTIONS.KIOSK_QUEUE, id);
    await deleteDoc(queueRef);

    return NextResponse.json({ data: { id, deleted: true } });
  } catch (error) {
    console.error("Error removing from queue:", error);
    return NextResponse.json(
      { error: "Failed to remove from queue" },
      { status: 500 }
    );
  }
}
