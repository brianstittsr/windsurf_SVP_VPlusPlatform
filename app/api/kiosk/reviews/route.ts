import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { collection, addDoc, getDocs, query, where, orderBy, Timestamp } from "firebase/firestore";
import { COLLECTIONS, type KioskInterviewReviewDoc } from "@/lib/schema";

// GET /api/kiosk/reviews - List all interview reviews
export async function GET(request: NextRequest) {
  try {
    if (!db) {
      return NextResponse.json(
        { error: "Database not initialized" },
        { status: 500 }
      );
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");

    const reviewsRef = collection(db, COLLECTIONS.KIOSK_INTERVIEW_REVIEWS);
    let q;
    if (status && status !== "all") {
      q = query(reviewsRef, where("reviewStatus", "==", status));
    } else {
      q = query(reviewsRef);
    }

    const snapshot = await getDocs(q);
    const reviews = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    return NextResponse.json({ data: reviews });
  } catch (error) {
    console.error("Error fetching reviews:", error);
    return NextResponse.json(
      { error: "Failed to fetch reviews" },
      { status: 500 }
    );
  }
}

// POST /api/kiosk/reviews - Create a new interview review
export async function POST(request: NextRequest) {
  try {
    if (!db) {
      return NextResponse.json(
        { error: "Database not initialized" },
        { status: 500 }
      );
    }

    const body = await request.json();

    if (!body.patientId || !body.sessionId || !body.patientName) {
      return NextResponse.json(
        { error: "Missing required fields: patientId, sessionId, patientName" },
        { status: 400 }
      );
    }

    const completedSections: string[] = body.completedSections || [];
    const allSections = [
      "demographics",
      "additionalQuestions",
      "incomeInfo",
      "housingInfo",
      "householdInfo",
      "attestation",
      "signature",
    ];
    const missingSections = allSections.filter(s => !completedSections.includes(s));
    const missingDocuments: string[] = body.missingDocuments || [];
    const missingFields: string[] = body.missingFields || [];

    // Calculate completeness score
    const sectionWeight = 100 / allSections.length;
    const completenessScore = Math.round(completedSections.length * sectionWeight);

    // Determine review status
    let reviewStatus: KioskInterviewReviewDoc["reviewStatus"] = "pending_review";
    if (completenessScore === 100 && missingDocuments.length === 0 && missingFields.length === 0) {
      reviewStatus = "ready_to_approve";
    } else if (missingSections.length > 0 || missingDocuments.length > 0 || missingFields.length > 0) {
      reviewStatus = "needs_work";
    }

    const reviewData: Omit<KioskInterviewReviewDoc, "id"> = {
      patientId: body.patientId,
      sessionId: body.sessionId,
      patientName: body.patientName,
      reviewStatus,
      completedSections,
      missingSections,
      missingDocuments,
      missingFields,
      completenessScore,
      eligibilityScore: body.eligibilityScore || 0,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };

    const reviewsRef = collection(db, COLLECTIONS.KIOSK_INTERVIEW_REVIEWS);
    const docRef = await addDoc(reviewsRef, reviewData);

    return NextResponse.json({
      data: { id: docRef.id, ...reviewData }
    }, { status: 201 });
  } catch (error) {
    console.error("Error creating review:", error);
    return NextResponse.json(
      { error: "Failed to create review" },
      { status: 500 }
    );
  }
}
