import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { collection, addDoc, getDocs, query, where, Timestamp } from "firebase/firestore";
import { COLLECTIONS, type KioskPatientDoc } from "@/lib/schema";

// GET /api/kiosk/patients - List all patients
export async function GET(request: NextRequest) {
  try {
    if (!db) {
      return NextResponse.json(
        { error: "Database not initialized" },
        { status: 500 }
      );
    }

    const patientsRef = collection(db, COLLECTIONS.KIOSK_PATIENTS);
    const snapshot = await getDocs(patientsRef);
    
    const patients = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    return NextResponse.json({ data: patients });
  } catch (error) {
    console.error("Error fetching patients:", error);
    return NextResponse.json(
      { error: "Failed to fetch patients" },
      { status: 500 }
    );
  }
}

// POST /api/kiosk/patients - Create a new patient
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
    if (!body.firstName || !body.lastName || !body.dateOfBirth || !body.phone) {
      return NextResponse.json(
        { error: "Missing required fields: firstName, lastName, dateOfBirth, phone" },
        { status: 400 }
      );
    }

    // Create patient document
    const patientData: Omit<KioskPatientDoc, "id"> = {
      firstName: body.firstName,
      lastName: body.lastName,
      dateOfBirth: Timestamp.fromDate(new Date(body.dateOfBirth)),
      phone: body.phone,
      email: body.email || undefined,
      preferredLanguage: body.preferredLanguage || "english",
      address: body.address || undefined,
      gender: body.gender || undefined,
      ethnicity: body.ethnicity || undefined,
      householdSize: body.householdSize || undefined,
      householdIncome: body.householdIncome || undefined,
      dependents: body.dependents || undefined,
      insuranceStatus: body.insuranceStatus || undefined,
      insuranceProvider: body.insuranceProvider || undefined,
      insurancePolicyNumber: body.insurancePolicyNumber || undefined,
      employmentStatus: body.employmentStatus || undefined,
      primaryPhysician: body.primaryPhysician || undefined,
      allergies: body.allergies || [],
      medications: body.medications || [],
      status: "active",
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };

    const patientsRef = collection(db, COLLECTIONS.KIOSK_PATIENTS);
    const docRef = await addDoc(patientsRef, patientData);

    return NextResponse.json({ 
      data: { 
        id: docRef.id, 
        ...patientData 
      } 
    }, { status: 201 });
  } catch (error) {
    console.error("Error creating patient:", error);
    return NextResponse.json(
      { error: "Failed to create patient" },
      { status: 500 }
    );
  }
}
