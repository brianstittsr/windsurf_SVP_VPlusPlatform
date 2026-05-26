import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { collection, addDoc, getDocs, Timestamp } from "firebase/firestore";
import { COLLECTIONS, type KioskDocumentDoc } from "@/lib/schema";

// GET /api/kiosk/documents - List all documents
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

    const documentsRef = collection(db, COLLECTIONS.KIOSK_DOCUMENTS);
    const snapshot = await getDocs(documentsRef);
    
    let documents: any[] = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // Filter by patientId if provided
    if (patientId) {
      documents = documents.filter((d) => d.patientId === patientId);
    }

    return NextResponse.json({ data: documents });
  } catch (error) {
    console.error("Error fetching documents:", error);
    return NextResponse.json(
      { error: "Failed to fetch documents" },
      { status: 500 }
    );
  }
}

// POST /api/kiosk/documents - Upload a new document
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
    if (!body.patientId || !body.documentType || !body.fileName || !body.fileUrl) {
      return NextResponse.json(
        { error: "Missing required fields: patientId, documentType, fileName, fileUrl" },
        { status: 400 }
      );
    }

    // Create document record
    const documentData: Omit<KioskDocumentDoc, "id"> = {
      patientId: body.patientId,
      sessionId: body.sessionId || undefined,
      documentType: body.documentType,
      fileName: body.fileName,
      fileUrl: body.fileUrl,
      fileSize: body.fileSize || 0,
      mimeType: body.mimeType || "application/octet-stream",
      verified: false,
      uploadedAt: Timestamp.now(),
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };

    const documentsRef = collection(db, COLLECTIONS.KIOSK_DOCUMENTS);
    const docRef = await addDoc(documentsRef, documentData);

    return NextResponse.json({ 
      data: { 
        id: docRef.id, 
        ...documentData 
      } 
    }, { status: 201 });
  } catch (error) {
    console.error("Error uploading document:", error);
    return NextResponse.json(
      { error: "Failed to upload document" },
      { status: 500 }
    );
  }
}
