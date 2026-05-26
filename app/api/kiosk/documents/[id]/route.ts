import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { doc, getDoc, updateDoc, deleteDoc, Timestamp } from "firebase/firestore";
import { COLLECTIONS, type KioskDocumentDoc } from "@/lib/schema";

// GET /api/kiosk/documents/[id] - Get a specific document
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
    const documentRef = doc(db, COLLECTIONS.KIOSK_DOCUMENTS, id);
    const snapshot = await getDoc(documentRef);

    if (!snapshot.exists()) {
      return NextResponse.json(
        { error: "Document not found" },
        { status: 404 }
      );
    }

    const document = {
      id: snapshot.id,
      ...snapshot.data()
    };

    return NextResponse.json({ data: document });
  } catch (error) {
    console.error("Error fetching document:", error);
    return NextResponse.json(
      { error: "Failed to fetch document" },
      { status: 500 }
    );
  }
}

// PATCH /api/kiosk/documents/[id] - Update a document (e.g., verify)
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
    const documentRef = doc(db, COLLECTIONS.KIOSK_DOCUMENTS, id);

    // Build update data
    const updateData: Partial<KioskDocumentDoc> = {
      updatedAt: Timestamp.now(),
    };

    if (body.verified !== undefined) {
      updateData.verified = body.verified;
      if (body.verified) {
        updateData.verifiedAt = Timestamp.now();
        updateData.verifiedBy = body.verifiedBy;
      }
    }

    await updateDoc(documentRef, updateData);

    return NextResponse.json({ data: { id, ...updateData } });
  } catch (error) {
    console.error("Error updating document:", error);
    return NextResponse.json(
      { error: "Failed to update document" },
      { status: 500 }
    );
  }
}

// DELETE /api/kiosk/documents/[id] - Delete a document
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
    const documentRef = doc(db, COLLECTIONS.KIOSK_DOCUMENTS, id);
    await deleteDoc(documentRef);

    return NextResponse.json({ data: { id, deleted: true } });
  } catch (error) {
    console.error("Error deleting document:", error);
    return NextResponse.json(
      { error: "Failed to delete document" },
      { status: 500 }
    );
  }
}
