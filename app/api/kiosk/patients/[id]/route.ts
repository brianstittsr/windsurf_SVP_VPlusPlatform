import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { doc, getDoc, updateDoc, deleteDoc, Timestamp } from "firebase/firestore";
import { COLLECTIONS, type KioskPatientDoc } from "@/lib/schema";

// GET /api/kiosk/patients/[id] - Get a specific patient
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
    const patientRef = doc(db, COLLECTIONS.KIOSK_PATIENTS, id);
    const snapshot = await getDoc(patientRef);

    if (!snapshot.exists()) {
      return NextResponse.json(
        { error: "Patient not found" },
        { status: 404 }
      );
    }

    const patient = {
      id: snapshot.id,
      ...snapshot.data()
    };

    return NextResponse.json({ data: patient });
  } catch (error) {
    console.error("Error fetching patient:", error);
    return NextResponse.json(
      { error: "Failed to fetch patient" },
      { status: 500 }
    );
  }
}

// PATCH /api/kiosk/patients/[id] - Update a patient
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
    const patientRef = doc(db, COLLECTIONS.KIOSK_PATIENTS, id);

    // Build update data
    const updateData: Partial<KioskPatientDoc> = {
      updatedAt: Timestamp.now(),
    };

    // Add optional fields if provided
    if (body.firstName) updateData.firstName = body.firstName;
    if (body.lastName) updateData.lastName = body.lastName;
    if (body.dateOfBirth) updateData.dateOfBirth = Timestamp.fromDate(new Date(body.dateOfBirth));
    if (body.phone) updateData.phone = body.phone;
    if (body.email !== undefined) updateData.email = body.email;
    if (body.preferredLanguage) updateData.preferredLanguage = body.preferredLanguage;
    if (body.address !== undefined) updateData.address = body.address;
    if (body.gender !== undefined) updateData.gender = body.gender;
    if (body.ethnicity !== undefined) updateData.ethnicity = body.ethnicity;
    if (body.householdSize !== undefined) updateData.householdSize = body.householdSize;
    if (body.householdIncome !== undefined) updateData.householdIncome = body.householdIncome;
    if (body.dependents !== undefined) updateData.dependents = body.dependents;
    if (body.insuranceStatus !== undefined) updateData.insuranceStatus = body.insuranceStatus;
    if (body.insuranceProvider !== undefined) updateData.insuranceProvider = body.insuranceProvider;
    if (body.insurancePolicyNumber !== undefined) updateData.insurancePolicyNumber = body.insurancePolicyNumber;
    if (body.employmentStatus !== undefined) updateData.employmentStatus = body.employmentStatus;
    if (body.primaryPhysician !== undefined) updateData.primaryPhysician = body.primaryPhysician;
    if (body.allergies !== undefined) updateData.allergies = body.allergies;
    if (body.medications !== undefined) updateData.medications = body.medications;
    if (body.status) updateData.status = body.status;
    if (body.lastVisit !== undefined) updateData.lastVisit = Timestamp.fromDate(new Date(body.lastVisit));

    await updateDoc(patientRef, updateData);

    return NextResponse.json({ data: { id, ...updateData } });
  } catch (error) {
    console.error("Error updating patient:", error);
    return NextResponse.json(
      { error: "Failed to update patient" },
      { status: 500 }
    );
  }
}

// DELETE /api/kiosk/patients/[id] - Delete a patient
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
    const patientRef = doc(db, COLLECTIONS.KIOSK_PATIENTS, id);
    await deleteDoc(patientRef);

    return NextResponse.json({ data: { id, deleted: true } });
  } catch (error) {
    console.error("Error deleting patient:", error);
    return NextResponse.json(
      { error: "Failed to delete patient" },
      { status: 500 }
    );
  }
}
