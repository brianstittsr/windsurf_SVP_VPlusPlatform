import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import {
  doc,
  getDoc,
  updateDoc,
  deleteDoc,
  Timestamp,
} from "firebase/firestore";
import { COLLECTIONS, type FirefliesMeetingDoc, type FirefliesActionItem } from "@/lib/schema";

// GET - Fetch a single meeting by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!db) {
      return NextResponse.json(
        { error: "Database not initialized" },
        { status: 500 }
      );
    }

    const meetingRef = doc(db, COLLECTIONS.FIREFLIES_MEETINGS, id);
    const meetingDoc = await getDoc(meetingRef);

    if (!meetingDoc.exists()) {
      return NextResponse.json(
        { error: "Meeting not found" },
        { status: 404 }
      );
    }

    const meeting = {
      id: meetingDoc.id,
      ...meetingDoc.data(),
    } as FirefliesMeetingDoc;

    return NextResponse.json({ meeting });
  } catch (error) {
    console.error("Error fetching meeting:", error);
    return NextResponse.json(
      { error: "Failed to fetch meeting" },
      { status: 500 }
    );
  }
}

// PATCH - Update meeting (action items, linking, etc.)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    if (!db) {
      return NextResponse.json(
        { error: "Database not initialized" },
        { status: 500 }
      );
    }

    const meetingRef = doc(db, COLLECTIONS.FIREFLIES_MEETINGS, id);
    const meetingDoc = await getDoc(meetingRef);

    if (!meetingDoc.exists()) {
      return NextResponse.json(
        { error: "Meeting not found" },
        { status: 404 }
      );
    }

    const updateData: Record<string, unknown> = {
      updatedAt: Timestamp.now(),
    };

    // Handle action item updates
    if (body.actionItems) {
      updateData.actionItems = body.actionItems;
    }

    // Handle single action item status update
    if (body.actionItemId && body.actionItemStatus) {
      const currentData = meetingDoc.data() as FirefliesMeetingDoc;
      const updatedItems = currentData.actionItems.map((item) => {
        if (item.id === body.actionItemId) {
          return {
            ...item,
            status: body.actionItemStatus,
            completedAt: body.actionItemStatus === "completed" ? Timestamp.now() : undefined,
          };
        }
        return item;
      });
      updateData.actionItems = updatedItems;
    }

    // Handle adding new action item
    if (body.newActionItem) {
      const currentData = meetingDoc.data() as FirefliesMeetingDoc;
      const newItem: FirefliesActionItem = {
        id: crypto.randomUUID(),
        text: body.newActionItem.text,
        assigneeId: body.newActionItem.assigneeId,
        assigneeName: body.newActionItem.assigneeName,
        status: "pending",
        dueDate: body.newActionItem.dueDate ? Timestamp.fromDate(new Date(body.newActionItem.dueDate)) : undefined,
        createdFromTranscript: body.newActionItem.createdFromTranscript || false,
      };
      updateData.actionItems = [...currentData.actionItems, newItem];
    }

    // Handle linking to entities
    if (body.linkedCustomerId !== undefined) {
      updateData.linkedCustomerId = body.linkedCustomerId;
    }
    if (body.linkedProjectId !== undefined) {
      updateData.linkedProjectId = body.linkedProjectId;
    }
    if (body.linkedOpportunityId !== undefined) {
      updateData.linkedOpportunityId = body.linkedOpportunityId;
    }
    if (body.linkedTeamMemberIds !== undefined) {
      updateData.linkedTeamMemberIds = body.linkedTeamMemberIds;
    }

    // Handle processing status
    if (body.processingStatus) {
      updateData.processingStatus = body.processingStatus;
    }
    if (body.aiTasksExtracted !== undefined) {
      updateData.aiTasksExtracted = body.aiTasksExtracted;
    }

    await updateDoc(meetingRef, updateData);

    // Fetch updated document
    const updatedDoc = await getDoc(meetingRef);
    const meeting = {
      id: updatedDoc.id,
      ...updatedDoc.data(),
    } as FirefliesMeetingDoc;

    return NextResponse.json({ success: true, meeting });
  } catch (error) {
    console.error("Error updating meeting:", error);
    return NextResponse.json(
      { error: "Failed to update meeting" },
      { status: 500 }
    );
  }
}

// DELETE - Delete a meeting
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!db) {
      return NextResponse.json(
        { error: "Database not initialized" },
        { status: 500 }
      );
    }

    const meetingRef = doc(db, COLLECTIONS.FIREFLIES_MEETINGS, id);
    const meetingDoc = await getDoc(meetingRef);

    if (!meetingDoc.exists()) {
      return NextResponse.json(
        { error: "Meeting not found" },
        { status: 404 }
      );
    }

    await deleteDoc(meetingRef);

    return NextResponse.json({ success: true, message: "Meeting deleted" });
  } catch (error) {
    console.error("Error deleting meeting:", error);
    return NextResponse.json(
      { error: "Failed to delete meeting" },
      { status: 500 }
    );
  }
}
