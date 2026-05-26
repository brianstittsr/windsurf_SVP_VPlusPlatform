import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { collection, addDoc, getDocs, query, where, Timestamp } from "firebase/firestore";
import { COLLECTIONS, type KioskPatientReminderDoc } from "@/lib/schema";

// GET /api/kiosk/reminders - List reminders, optionally filtered
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
    const reviewId = searchParams.get("reviewId");
    const status = searchParams.get("status");

    const remindersRef = collection(db, COLLECTIONS.KIOSK_PATIENT_REMINDERS);
    let constraints: any[] = [];

    if (patientId) constraints.push(where("patientId", "==", patientId));
    if (reviewId) constraints.push(where("reviewId", "==", reviewId));
    if (status && status !== "all") constraints.push(where("status", "==", status));

    const q = constraints.length > 0
      ? query(remindersRef, ...constraints)
      : query(remindersRef);

    const snapshot = await getDocs(q);
    const reminders = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    return NextResponse.json({ data: reminders });
  } catch (error) {
    console.error("Error fetching reminders:", error);
    return NextResponse.json(
      { error: "Failed to fetch reminders" },
      { status: 500 }
    );
  }
}

// POST /api/kiosk/reminders - Create a new reminder
export async function POST(request: NextRequest) {
  try {
    if (!db) {
      return NextResponse.json(
        { error: "Database not initialized" },
        { status: 500 }
      );
    }

    const body = await request.json();

    if (!body.patientId || !body.reviewId || !body.title || !body.message) {
      return NextResponse.json(
        { error: "Missing required fields: patientId, reviewId, title, message" },
        { status: 400 }
      );
    }

    const reminderData: Omit<KioskPatientReminderDoc, "id"> = {
      patientId: body.patientId,
      reviewId: body.reviewId,
      patientName: body.patientName || "",
      patientPhone: body.patientPhone,
      patientEmail: body.patientEmail,
      reminderType: body.reminderType || "follow_up",
      title: body.title,
      message: body.message,
      missingItems: body.missingItems || [],
      deliveryMethod: body.deliveryMethod || "portal",
      status: "pending",
      scheduledFor: body.scheduledFor ? Timestamp.fromDate(new Date(body.scheduledFor)) : undefined,
      expiresAt: body.expiresAt ? Timestamp.fromDate(new Date(body.expiresAt)) : undefined,
      createdBy: body.createdBy || "staff",
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };

    const remindersRef = collection(db, COLLECTIONS.KIOSK_PATIENT_REMINDERS);
    const docRef = await addDoc(remindersRef, reminderData);

    return NextResponse.json({
      data: { id: docRef.id, ...reminderData }
    }, { status: 201 });
  } catch (error) {
    console.error("Error creating reminder:", error);
    return NextResponse.json(
      { error: "Failed to create reminder" },
      { status: 500 }
    );
  }
}
