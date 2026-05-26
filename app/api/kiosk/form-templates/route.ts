import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { collection, addDoc, getDocs, query, where, Timestamp } from "firebase/firestore";
import { COLLECTIONS, kioskFormTemplatesCollection } from "@/lib/schema";
import { seedTemplateToDoc, seedTemplates } from "@/lib/kiosk-seed-templates";

// GET /api/kiosk/form-templates - List form templates, optionally filtered
export async function GET(request: NextRequest) {
  try {
    if (!db) {
      return NextResponse.json(
        { error: "Database not initialized" },
        { status: 500 }
      );
    }

    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const status = searchParams.get("status");

    const templatesRef = kioskFormTemplatesCollection();
    if (!templatesRef) {
      return NextResponse.json(
        { error: "Collection not available" },
        { status: 500 }
      );
    }

    const constraints: any[] = [];

    if (category && category !== "all") constraints.push(where("category", "==", category));
    if (status && status !== "all") constraints.push(where("status", "==", status));

    const q = constraints.length > 0
      ? query(templatesRef, ...constraints)
      : query(templatesRef);

    const snapshot = await getDocs(q);
    const templates = snapshot.docs.map(doc => ({
      ...doc.data(),
      id: doc.id,
    }));

    return NextResponse.json({ data: templates });
  } catch (error) {
    console.error("Error fetching form templates:", error);
    return NextResponse.json(
      { error: "Failed to fetch form templates" },
      { status: 500 }
    );
  }
}

// POST /api/kiosk/form-templates - Create a new form template
export async function POST(request: NextRequest) {
  try {
    if (!db) {
      return NextResponse.json(
        { error: "Database not initialized" },
        { status: 500 }
      );
    }

    const body = await request.json();

    // Special case: seed templates from predefined definitions
    if (body.action === "seed") {
      const createdBy = body.createdBy || "system";
      const templatesRef = kioskFormTemplatesCollection();
      if (!templatesRef) {
        return NextResponse.json(
          { error: "Collection not available" },
          { status: 500 }
        );
      }

      const createdTemplates = [];

      for (const seed of seedTemplates) {
        const docData = seedTemplateToDoc(seed, createdBy);
        const docRef = await addDoc(templatesRef, docData as any);
        createdTemplates.push({
          id: docRef.id,
          ...docData,
        });
      }

      return NextResponse.json({
        data: createdTemplates,
        message: `Seeded ${createdTemplates.length} templates`
      }, { status: 201 });
    }

    // Regular template creation
    if (!body.name || !body.pdfStorageUrl) {
      return NextResponse.json(
        { error: "Missing required fields: name, pdfStorageUrl" },
        { status: 400 }
      );
    }

    const templateData = {
      id: "temp", // Firestore will overwrite
      name: body.name,
      description: body.description || "",
      category: body.category || "optional",
      triggerCondition: body.triggerCondition,
      pageCount: body.pageCount || 1,
      pdfStorageUrl: body.pdfStorageUrl,
      pdfFileName: body.pdfFileName || body.name,
      fieldMappings: body.fieldMappings || [],
      status: body.status || "active",
      version: body.version || 1,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      createdBy: body.createdBy || "system",
    };

    const templatesRef = kioskFormTemplatesCollection();
    if (!templatesRef) {
      return NextResponse.json(
        { error: "Collection not available" },
        { status: 500 }
      );
    }

    const docRef = await addDoc(templatesRef, templateData as any);

    return NextResponse.json({
      data: {
        ...templateData,
        id: docRef.id,
      }
    }, { status: 201 });
  } catch (error) {
    console.error("Error creating form template:", error);
    return NextResponse.json(
      { error: "Failed to create form template" },
      { status: 500 }
    );
  }
}
