import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { collection, addDoc, getDocs, query, where, Timestamp } from "firebase/firestore";
import { COLLECTIONS, kioskSpaApplicationsCollection } from "@/lib/schema";

/**
 * Converts flat field paths (e.g., "demographics.residentialAddress.street") 
 * to nested objects for Firestore storage
 */
function convertFieldPathsToNestedObject(flatAnswers: Record<string, any>): Record<string, any> {
  const nested: Record<string, any> = {};
  
  for (const [fieldPath, value] of Object.entries(flatAnswers)) {
    const keys = fieldPath.split('.');
    let current = nested;
    
    // Navigate to the parent of the final key
    for (let i = 0; i < keys.length - 1; i++) {
      const key = keys[i];
      if (!current[key]) {
        current[key] = {};
      }
      current = current[key];
    }
    
    // Set the final value
    const finalKey = keys[keys.length - 1];
    current[finalKey] = value;
  }
  
  return nested;
}

// GET /api/kiosk/spa-application - List SPA applications, optionally filtered
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
    const sessionId = searchParams.get("sessionId");
    const status = searchParams.get("status");

    const applicationsRef = kioskSpaApplicationsCollection();
    if (!applicationsRef) {
      return NextResponse.json(
        { error: "Collection not available" },
        { status: 500 }
      );
    }

    const constraints: any[] = [];

    if (patientId) constraints.push(where("patientId", "==", patientId));
    if (sessionId) constraints.push(where("sessionId", "==", sessionId));
    if (status && status !== "all") constraints.push(where("status", "==", status));

    const q = constraints.length > 0
      ? query(applicationsRef, ...constraints)
      : query(applicationsRef);

    const snapshot = await getDocs(q);
    const applications = snapshot.docs.map(doc => ({
      ...doc.data(),
      id: doc.id,
    }));

    return NextResponse.json({ data: applications });
  } catch (error) {
    console.error("Error fetching SPA applications:", error);
    return NextResponse.json(
      { error: "Failed to fetch SPA applications" },
      { status: 500 }
    );
  }
}

// POST /api/kiosk/spa-application - Create a new SPA application
export async function POST(request: NextRequest) {
  try {
    if (!db) {
      return NextResponse.json(
        { error: "Database not initialized" },
        { status: 500 }
      );
    }

    const body = await request.json();

    const status = body.status || (body.signatureDataUrl ? "completed" : "in_progress");

    // For a completed submission, require both answers and signature.
    // For an in-progress draft (autosave during interview), neither is required.
    if (status === "completed" && (!body.answers || !body.signatureDataUrl)) {
      return NextResponse.json(
        { error: "Missing required fields for completion: answers, signatureDataUrl" },
        { status: 400 }
      );
    }

    // Generate patient ID if not provided (for demo purposes)
    const patientId = body.patientId || `temp_${Date.now()}`;
    const sessionId = body.sessionId || `session_${Date.now()}`;

    const answers = body.answers || {};
    
    // Convert flat field paths to nested objects for proper Firestore storage
    const nestedAnswers = convertFieldPathsToNestedObject(answers);
    
    const applicationData: Record<string, any> = {
      patientId,
      sessionId,
      completedSections: body.completedSections || [],
      demographics: nestedAnswers.demographics || {},
      additionalQuestions: nestedAnswers.additionalQuestions || {},
      incomeInfo: nestedAnswers.incomeInfo || {},
      housingInfo: nestedAnswers.housingInfo || {},
      householdInfo: nestedAnswers.householdInfo || {},
      attestations: body.attestations || [],
      status,
      language: body.language || "english",
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };

    // Only include optional fields when defined (Firestore rejects undefined).
    if (answers.spouseInfo !== undefined) applicationData.spouseInfo = answers.spouseInfo;
    if (body.interviewData) applicationData.interviewData = body.interviewData;
    if (body.signatureDataUrl) {
      applicationData.signatureDataUrl = body.signatureDataUrl;
      applicationData.signedAt = Timestamp.now();
    }

    const applicationsRef = kioskSpaApplicationsCollection();
    if (!applicationsRef) {
      return NextResponse.json(
        { error: "Collection not available" },
        { status: 500 }
      );
    }

    const docRef = await addDoc(applicationsRef, applicationData as any);

    return NextResponse.json({
      data: {
        ...applicationData,
        id: docRef.id,
      }
    }, { status: 201 });
  } catch (error) {
    console.error("Error creating SPA application:", error);
    return NextResponse.json(
      {
        error: "Failed to create SPA application",
        detail: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
