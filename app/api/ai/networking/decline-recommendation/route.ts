import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { COLLECTIONS } from "@/lib/schema";
import { doc, updateDoc, Timestamp } from "firebase/firestore";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { suggestionId, reason } = body;

    if (!suggestionId) {
      return NextResponse.json({ error: "suggestionId is required" }, { status: 400 });
    }

    if (!db) {
      return NextResponse.json({ error: "Database not initialized" }, { status: 500 });
    }

    // Update suggestion status to declined
    const suggestionRef = doc(db, COLLECTIONS.AI_MATCH_SUGGESTIONS, suggestionId);
    await updateDoc(suggestionRef, {
      status: "declined",
      declinedAt: Timestamp.now(),
      declineReason: reason || null,
    });

    return NextResponse.json({
      success: true,
      message: "Recommendation declined.",
    });
  } catch (error) {
    console.error("Decline recommendation error:", error);
    return NextResponse.json({ error: "Failed to decline recommendation" }, { status: 500 });
  }
}
