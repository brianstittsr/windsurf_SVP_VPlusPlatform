import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { doc, getDoc, updateDoc, Timestamp } from "firebase/firestore";
import { COLLECTIONS, type KioskInterviewReviewDoc } from "@/lib/schema";

// GET /api/kiosk/reviews/[id]
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
    const reviewRef = doc(db, COLLECTIONS.KIOSK_INTERVIEW_REVIEWS, id);
    const snapshot = await getDoc(reviewRef);

    if (!snapshot.exists()) {
      return NextResponse.json(
        { error: "Review not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      data: { id: snapshot.id, ...snapshot.data() }
    });
  } catch (error) {
    console.error("Error fetching review:", error);
    return NextResponse.json(
      { error: "Failed to fetch review" },
      { status: 500 }
    );
  }
}

// PATCH /api/kiosk/reviews/[id] - Update review (approve, deny, add notes)
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
    const reviewRef = doc(db, COLLECTIONS.KIOSK_INTERVIEW_REVIEWS, id);

    const updateData: Partial<KioskInterviewReviewDoc> = {
      updatedAt: Timestamp.now(),
    };

    if (body.reviewStatus) updateData.reviewStatus = body.reviewStatus;
    if (body.reviewNotes !== undefined) updateData.reviewNotes = body.reviewNotes;
    if (body.reviewedBy) updateData.reviewedBy = body.reviewedBy;
    if (body.completedSections) updateData.completedSections = body.completedSections;
    if (body.missingSections) updateData.missingSections = body.missingSections;
    if (body.missingDocuments) updateData.missingDocuments = body.missingDocuments;
    if (body.missingFields) updateData.missingFields = body.missingFields;
    if (body.completenessScore !== undefined) updateData.completenessScore = body.completenessScore;
    if (body.eligibilityScore !== undefined) updateData.eligibilityScore = body.eligibilityScore;

    // Handle approval
    if (body.reviewStatus === "approved") {
      updateData.approvedBy = body.approvedBy || "staff";
      updateData.approvedAt = Timestamp.now();
    }

    // Handle denial
    if (body.reviewStatus === "denied") {
      updateData.deniedBy = body.deniedBy || "staff";
      updateData.deniedAt = Timestamp.now();
      if (body.denialReason) updateData.denialReason = body.denialReason;
    }

    await updateDoc(reviewRef, updateData);

    return NextResponse.json({
      data: { id, ...updateData }
    });
  } catch (error) {
    console.error("Error updating review:", error);
    return NextResponse.json(
      { error: "Failed to update review" },
      { status: 500 }
    );
  }
}
