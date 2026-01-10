import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  doc,
  Timestamp,
} from "firebase/firestore";
import { COLLECTIONS, type FirefliesSettingsDoc } from "@/lib/schema";

// GET - Fetch Fireflies settings
export async function GET() {
  try {
    if (!db) {
      return NextResponse.json(
        { error: "Database not initialized" },
        { status: 500 }
      );
    }

    const settingsRef = collection(db, COLLECTIONS.FIREFLIES_SETTINGS);
    const snapshot = await getDocs(settingsRef);

    if (snapshot.empty) {
      // Return default settings
      return NextResponse.json({
        settings: {
          isConnected: false,
          autoExtractTasks: true,
          autoAssignTasks: true,
          defaultTaskDueDays: 7,
          notifyOnNewMeeting: true,
          notifyOnTaskCreated: true,
          notificationEmails: [],
          autoLinkToCustomers: true,
          autoLinkToProjects: true,
        },
      });
    }

    const settings = {
      id: snapshot.docs[0].id,
      ...snapshot.docs[0].data(),
    } as FirefliesSettingsDoc;

    // Don't expose API key
    const safeSettings = {
      ...settings,
      apiKey: settings.apiKey ? "••••••••" : undefined,
    };

    return NextResponse.json({ settings: safeSettings });
  } catch (error) {
    console.error("Error fetching Fireflies settings:", error);
    return NextResponse.json(
      { error: "Failed to fetch settings" },
      { status: 500 }
    );
  }
}

// POST - Create or update Fireflies settings
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!db) {
      return NextResponse.json(
        { error: "Database not initialized" },
        { status: 500 }
      );
    }

    const settingsRef = collection(db, COLLECTIONS.FIREFLIES_SETTINGS);
    const snapshot = await getDocs(settingsRef);

    const settingsData = {
      apiKey: body.apiKey,
      isConnected: !!body.apiKey,
      webhookSecret: body.webhookSecret,
      autoExtractTasks: body.autoExtractTasks ?? true,
      autoAssignTasks: body.autoAssignTasks ?? true,
      defaultTaskDueDays: body.defaultTaskDueDays ?? 7,
      notifyOnNewMeeting: body.notifyOnNewMeeting ?? true,
      notifyOnTaskCreated: body.notifyOnTaskCreated ?? true,
      notificationEmails: body.notificationEmails ?? [],
      autoLinkToCustomers: body.autoLinkToCustomers ?? true,
      autoLinkToProjects: body.autoLinkToProjects ?? true,
      updatedAt: Timestamp.now(),
    };

    if (snapshot.empty) {
      // Create new settings
      const docRef = await addDoc(settingsRef, {
        ...settingsData,
        createdAt: Timestamp.now(),
      });

      return NextResponse.json({
        success: true,
        settingsId: docRef.id,
      });
    } else {
      // Update existing settings
      const existingDoc = snapshot.docs[0];
      
      // Only update API key if a new one is provided (not masked)
      if (body.apiKey === "••••••••") {
        delete settingsData.apiKey;
      }

      await updateDoc(doc(db, COLLECTIONS.FIREFLIES_SETTINGS, existingDoc.id), settingsData);

      return NextResponse.json({
        success: true,
        settingsId: existingDoc.id,
      });
    }
  } catch (error) {
    console.error("Error saving Fireflies settings:", error);
    return NextResponse.json(
      { error: "Failed to save settings" },
      { status: 500 }
    );
  }
}

// DELETE - Disconnect Fireflies integration
export async function DELETE() {
  try {
    if (!db) {
      return NextResponse.json(
        { error: "Database not initialized" },
        { status: 500 }
      );
    }

    const settingsRef = collection(db, COLLECTIONS.FIREFLIES_SETTINGS);
    const snapshot = await getDocs(settingsRef);

    if (!snapshot.empty) {
      const existingDoc = snapshot.docs[0];
      await updateDoc(doc(db, COLLECTIONS.FIREFLIES_SETTINGS, existingDoc.id), {
        apiKey: null,
        isConnected: false,
        updatedAt: Timestamp.now(),
      });
    }

    return NextResponse.json({
      success: true,
      message: "Fireflies integration disconnected",
    });
  } catch (error) {
    console.error("Error disconnecting Fireflies:", error);
    return NextResponse.json(
      { error: "Failed to disconnect" },
      { status: 500 }
    );
  }
}
