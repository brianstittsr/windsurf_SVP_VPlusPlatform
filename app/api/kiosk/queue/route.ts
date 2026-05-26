import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { collection, addDoc, getDocs, query, orderBy, Timestamp } from "firebase/firestore";
import { COLLECTIONS, type KioskQueueDoc } from "@/lib/schema";

// GET /api/kiosk/queue - Get queue status
export async function GET(request: NextRequest) {
  try {
    if (!db) {
      return NextResponse.json(
        { error: "Database not initialized" },
        { status: 500 }
      );
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status"); // waiting, in_service, completed

    let queueRef = collection(db, COLLECTIONS.KIOSK_QUEUE);
    
    // Filter by status if provided
    if (status) {
      // Note: where() with orderBy() requires composite index in Firestore
      // For now, we'll filter in memory after fetching
    }

    const snapshot = await getDocs(queueRef);
    
    let queueItems: any[] = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // Filter by status if provided
    if (status) {
      queueItems = queueItems.filter(item => item.status === status);
    }

    // Sort by queue number
    queueItems.sort((a, b) => a.queueNumber - b.queueNumber);

    return NextResponse.json({ data: queueItems });
  } catch (error) {
    console.error("Error fetching queue:", error);
    return NextResponse.json(
      { error: "Failed to fetch queue" },
      { status: 500 }
    );
  }
}

// POST /api/kiosk/queue - Add patient to queue
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
    if (!body.patientId || !body.sessionId || !body.serviceType) {
      return NextResponse.json(
        { error: "Missing required fields: patientId, sessionId, serviceType" },
        { status: 400 }
      );
    }

    // Get current queue position
    const queueRef = collection(db, COLLECTIONS.KIOSK_QUEUE);
    const snapshot = await getDocs(queueRef);
    const queueItems: any[] = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    const maxQueueNumber = queueItems.length > 0 
      ? Math.max(...queueItems.map(item => item.queueNumber))
      : 0;
    
    const queueNumber = maxQueueNumber + 1;

    // Calculate estimated wait time (5 minutes per person ahead)
    const waitingAhead = queueItems.filter(item => item.status === "waiting").length;
    const estimatedWaitTime = waitingAhead * 5;

    // Create queue document
    const queueData: Omit<KioskQueueDoc, "id"> = {
      patientId: body.patientId,
      sessionId: body.sessionId,
      queueNumber,
      estimatedWaitTime,
      serviceType: body.serviceType,
      status: "waiting",
      queuedAt: Timestamp.now(),
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };

    const docRef = await addDoc(queueRef, queueData);

    return NextResponse.json({ 
      data: { 
        id: docRef.id, 
        ...queueData 
      } 
    }, { status: 201 });
  } catch (error) {
    console.error("Error adding to queue:", error);
    return NextResponse.json(
      { error: "Failed to add to queue" },
      { status: 500 }
    );
  }
}
