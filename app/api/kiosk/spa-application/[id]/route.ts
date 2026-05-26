import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { doc, getDoc, updateDoc, deleteDoc, Timestamp } from "firebase/firestore";
import { COLLECTIONS, kioskSpaApplicationsCollection } from "@/lib/schema";

// GET /api/kiosk/spa-application/[id] - Get a specific SPA application
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
    const applicationsRef = kioskSpaApplicationsCollection();
    if (!applicationsRef) {
      return NextResponse.json(
        { error: "Collection not available" },
        { status: 500 }
      );
    }

    const docRef = doc(applicationsRef, id);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return NextResponse.json(
        { error: "SPA application not found" },
        { status: 404 }
      );
    }

    const application = {
      ...docSnap.data(),
      id: docSnap.id,
    };

    return NextResponse.json({ data: application });
  } catch (error) {
    console.error("Error fetching SPA application:", error);
    return NextResponse.json(
      { error: "Failed to fetch SPA application" },
      { status: 500 }
    );
  }
}

// PATCH /api/kiosk/spa-application/[id] - Update a SPA application
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

    const applicationsRef = kioskSpaApplicationsCollection();
    if (!applicationsRef) {
      return NextResponse.json(
        { error: "Collection not available" },
        { status: 500 }
      );
    }

    const docRef = doc(applicationsRef, id);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return NextResponse.json(
        { error: "SPA application not found" },
        { status: 404 }
      );
    }

    const updateData: any = {
      updatedAt: Timestamp.now(),
    };

    // Allow updating specific fields
    if (body.status) updateData.status = body.status;
    if (body.demographics) updateData.demographics = body.demographics;
    if (body.additionalQuestions) updateData.additionalQuestions = body.additionalQuestions;
    if (body.incomeInfo) updateData.incomeInfo = body.incomeInfo;
    if (body.spouseInfo) updateData.spouseInfo = body.spouseInfo;
    if (body.housingInfo) updateData.housingInfo = body.housingInfo;
    if (body.householdInfo) updateData.householdInfo = body.householdInfo;
    if (body.attestations) updateData.attestations = body.attestations;
    if (body.signatureDataUrl) updateData.signatureDataUrl = body.signatureDataUrl;
    if (body.completedSections) updateData.completedSections = body.completedSections;
    if (body.interviewData) updateData.interviewData = body.interviewData;
    if (body.lastUpdated) updateData.lastUpdated = body.lastUpdated;

    await updateDoc(docRef, updateData);

    // Fetch updated document
    const updatedSnap = await getDoc(docRef);
    const updatedApplication = {
      ...updatedSnap.data(),
      id: updatedSnap.id,
    };

    return NextResponse.json({ data: updatedApplication });
  } catch (error) {
    console.error("Error updating SPA application:", error);
    return NextResponse.json(
      { error: "Failed to update SPA application" },
      { status: 500 }
    );
  }
}

// DELETE /api/kiosk/spa-application/[id] - Delete a SPA application
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
    const applicationsRef = kioskSpaApplicationsCollection();
    if (!applicationsRef) {
      return NextResponse.json(
        { error: "Collection not available" },
        { status: 500 }
      );
    }

    const docRef = doc(applicationsRef, id);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return NextResponse.json(
        { error: "SPA application not found" },
        { status: 404 }
      );
    }

    await deleteDoc(docRef);

    return NextResponse.json({ data: { success: true, id } });
  } catch (error) {
    console.error("Error deleting SPA application:", error);
    return NextResponse.json(
      { error: "Failed to delete SPA application" },
      { status: 500 }
    );
  }
}
