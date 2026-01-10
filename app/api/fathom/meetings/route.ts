import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import {
  collection,
  getDocs,
  query,
  orderBy,
  where,
  Timestamp,
} from "firebase/firestore";
import { COLLECTIONS, type FathomMeetingDoc } from "@/lib/schema";

// GET - Fetch all Fathom meetings
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const search = searchParams.get("search");
    const limit = parseInt(searchParams.get("limit") || "50");

    if (!db) {
      return NextResponse.json(
        { error: "Database not initialized" },
        { status: 500 }
      );
    }

    const meetingsRef = collection(db, COLLECTIONS.FATHOM_MEETINGS);
    let q = query(meetingsRef, orderBy("meetingDate", "desc"));

    if (status) {
      q = query(
        meetingsRef,
        where("processingStatus", "==", status),
        orderBy("meetingDate", "desc")
      );
    }

    const snapshot = await getDocs(q);
    let meetings: FathomMeetingDoc[] = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as FathomMeetingDoc[];

    // Client-side search filtering
    if (search) {
      const searchLower = search.toLowerCase();
      meetings = meetings.filter(
        (m) =>
          m.title.toLowerCase().includes(searchLower) ||
          m.participants.some((p) => p.toLowerCase().includes(searchLower)) ||
          m.transcriptText?.toLowerCase().includes(searchLower)
      );
    }

    // Apply limit
    meetings = meetings.slice(0, limit);

    // Calculate stats
    const totalMeetings = meetings.length;
    const pendingTasks = meetings.reduce(
      (sum, m) => sum + m.actionItems.filter((a) => a.status === "pending").length,
      0
    );
    const completedTasks = meetings.reduce(
      (sum, m) => sum + m.actionItems.filter((a) => a.status === "completed").length,
      0
    );

    return NextResponse.json({
      meetings,
      stats: {
        totalMeetings,
        pendingTasks,
        completedTasks,
      },
    });
  } catch (error) {
    console.error("Error fetching Fathom meetings:", error);
    return NextResponse.json(
      { error: "Failed to fetch meetings" },
      { status: 500 }
    );
  }
}
