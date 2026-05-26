import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { doc, getDoc, updateDoc, deleteDoc, Timestamp } from "firebase/firestore";
import { COLLECTIONS, kioskFormTemplatesCollection } from "@/lib/schema";

// GET /api/kiosk/form-templates/[id] - Get a specific form template
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
    const templatesRef = kioskFormTemplatesCollection();
    if (!templatesRef) {
      return NextResponse.json(
        { error: "Collection not available" },
        { status: 500 }
      );
    }

    const docRef = doc(templatesRef, id);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return NextResponse.json(
        { error: "Form template not found" },
        { status: 404 }
      );
    }

    const template = {
      ...docSnap.data(),
      id: docSnap.id,
    };

    return NextResponse.json({ data: template });
  } catch (error) {
    console.error("Error fetching form template:", error);
    return NextResponse.json(
      { error: "Failed to fetch form template" },
      { status: 500 }
    );
  }
}

// PATCH /api/kiosk/form-templates/[id] - Update a form template
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

    const templatesRef = kioskFormTemplatesCollection();
    if (!templatesRef) {
      return NextResponse.json(
        { error: "Collection not available" },
        { status: 500 }
      );
    }

    const docRef = doc(templatesRef, id);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return NextResponse.json(
        { error: "Form template not found" },
        { status: 404 }
      );
    }

    const updateData: any = {
      updatedAt: Timestamp.now(),
    };

    // Allow updating specific fields
    if (body.name) updateData.name = body.name;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.category) updateData.category = body.category;
    if (body.triggerCondition !== undefined) updateData.triggerCondition = body.triggerCondition;
    if (body.pageCount) updateData.pageCount = body.pageCount;
    if (body.pdfStorageUrl) updateData.pdfStorageUrl = body.pdfStorageUrl;
    if (body.pdfFileName) updateData.pdfFileName = body.pdfFileName;
    if (body.fieldMappings) updateData.fieldMappings = body.fieldMappings;
    if (body.status) updateData.status = body.status;
    if (body.version) updateData.version = body.version;

    await updateDoc(docRef, updateData);

    // Fetch updated document
    const updatedSnap = await getDoc(docRef);
    const updatedTemplate = {
      ...updatedSnap.data(),
      id: updatedSnap.id,
    };

    return NextResponse.json({ data: updatedTemplate });
  } catch (error) {
    console.error("Error updating form template:", error);
    return NextResponse.json(
      { error: "Failed to update form template" },
      { status: 500 }
    );
  }
}

// DELETE /api/kiosk/form-templates/[id] - Delete a form template
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
    const templatesRef = kioskFormTemplatesCollection();
    if (!templatesRef) {
      return NextResponse.json(
        { error: "Collection not available" },
        { status: 500 }
      );
    }

    const docRef = doc(templatesRef, id);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return NextResponse.json(
        { error: "Form template not found" },
        { status: 404 }
      );
    }

    await deleteDoc(docRef);

    return NextResponse.json({ data: { success: true, id } });
  } catch (error) {
    console.error("Error deleting form template:", error);
    return NextResponse.json(
      { error: "Failed to delete form template" },
      { status: 500 }
    );
  }
}
