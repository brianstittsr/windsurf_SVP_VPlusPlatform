import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { collection, addDoc, getDocs, Timestamp } from "firebase/firestore";
import { COLLECTIONS, type KioskEligibilityCheckDoc } from "@/lib/schema";

// GET /api/kiosk/eligibility - List all eligibility checks
export async function GET(request: NextRequest) {
  try {
    if (!db) {
      return NextResponse.json(
        { error: "Database not initialized" },
        { status: 500 }
      );
    }

    const { searchParams } = new URL(request.url);
    const patientId = searchParams.get("patientId");

    const eligibilityRef = collection(db, COLLECTIONS.KIOSK_ELIGIBILITY_CHECKS);
    const snapshot = await getDocs(eligibilityRef);
    
    let checks: any[] = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // Filter by patientId if provided
    if (patientId) {
      checks = checks.filter((check) => check.patientId === patientId);
    }

    return NextResponse.json({ data: checks });
  } catch (error) {
    console.error("Error fetching eligibility checks:", error);
    return NextResponse.json(
      { error: "Failed to fetch eligibility checks" },
      { status: 500 }
    );
  }
}

// POST /api/kiosk/eligibility - Run an eligibility check
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
    if (!body.patientId || body.incomeEligible === undefined || body.residencyEligible === undefined) {
      return NextResponse.json(
        { error: "Missing required fields: patientId, incomeEligible, residencyEligible" },
        { status: 400 }
      );
    }

    // Calculate eligibility
    const incomeThreshold = body.incomeThreshold || 30000; // Default threshold
    const reportedIncome = body.reportedIncome || 0;
    
    // Determine eligibility category
    let eligible = true;
    let eligibilityCategory: "full" | "partial" | "none" = "full";
    let eligibilityScore = 100;

    if (!body.incomeEligible || !body.residencyEligible) {
      eligible = false;
      eligibilityCategory = "none";
      eligibilityScore = 0;
    } else if (reportedIncome > incomeThreshold * 1.5) {
      eligibilityCategory = "partial";
      eligibilityScore = 50;
    }

    // Create eligibility check document
    const eligibilityData: Omit<KioskEligibilityCheckDoc, "id"> = {
      patientId: body.patientId,
      sessionId: body.sessionId || undefined,
      incomeEligible: body.incomeEligible,
      incomeThreshold,
      reportedIncome,
      residencyEligible: body.residencyEligible,
      residencyVerified: body.residencyVerified || false,
      insuranceStatus: body.insuranceStatus || "uninsured",
      eligible,
      eligibilityScore,
      eligibilityCategory,
      notes: body.notes || undefined,
      checkedAt: Timestamp.now(),
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };

    const eligibilityRef = collection(db, COLLECTIONS.KIOSK_ELIGIBILITY_CHECKS);
    const docRef = await addDoc(eligibilityRef, eligibilityData);

    return NextResponse.json({ 
      data: { 
        id: docRef.id, 
        ...eligibilityData 
      } 
    }, { status: 201 });
  } catch (error) {
    console.error("Error running eligibility check:", error);
    return NextResponse.json(
      { error: "Failed to run eligibility check" },
      { status: 500 }
    );
  }
}
