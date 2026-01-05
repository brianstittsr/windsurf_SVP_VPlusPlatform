import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { COLLECTIONS } from "@/lib/schema";
import { doc, updateDoc, addDoc, collection, Timestamp, getDoc } from "firebase/firestore";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { suggestionId, affiliateId, partnerId } = body;

    if (!suggestionId || !affiliateId || !partnerId) {
      return NextResponse.json(
        { error: "suggestionId, affiliateId, and partnerId are required" },
        { status: 400 }
      );
    }

    if (!db) {
      return NextResponse.json({ error: "Database not initialized" }, { status: 500 });
    }

    // Update suggestion status to accepted
    const suggestionRef = doc(db, COLLECTIONS.AI_MATCH_SUGGESTIONS, suggestionId);
    const suggestionDoc = await getDoc(suggestionRef);

    if (!suggestionDoc.exists()) {
      return NextResponse.json({ error: "Suggestion not found" }, { status: 404 });
    }

    const suggestionData = suggestionDoc.data();

    await updateDoc(suggestionRef, {
      status: "accepted",
      acceptedAt: Timestamp.now(),
    });

    // Create a one-to-one meeting record (pending scheduling)
    const meetingData = {
      initiatorId: affiliateId,
      partnerId: partnerId,
      scheduledDate: null, // To be scheduled
      scheduledTime: null,
      duration: 60, // Default 60 minutes
      meetingType: "virtual",
      status: "pending", // Pending until scheduled
      worksheetsShared: false,
      svpReferralDiscussed: false,
      followUpCompleted: false,
      nextMeetingScheduled: false,
      matchScore: suggestionData.matchScore,
      matchReasons: suggestionData.reasons?.map((r: { description: string }) => r.description) || [],
      suggestedTalkingPoints: suggestionData.talkingPoints || [],
      aiSuggestionId: suggestionId,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };

    const meetingRef = await addDoc(collection(db, COLLECTIONS.ONE_TO_ONE_MEETINGS), meetingData);

    return NextResponse.json({
      success: true,
      meetingId: meetingRef.id,
      message: "Recommendation accepted. Meeting record created.",
    });
  } catch (error) {
    console.error("Accept recommendation error:", error);
    return NextResponse.json({ error: "Failed to accept recommendation" }, { status: 500 });
  }
}
