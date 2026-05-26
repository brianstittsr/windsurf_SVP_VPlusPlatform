import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { doc, getDoc, getDocs, query, where } from "firebase/firestore";
import { COLLECTIONS, kioskSpaApplicationsCollection, kioskFormTemplatesCollection } from "@/lib/schema";
import { generateAllPDFs } from "@/lib/kiosk-pdf-generator";

// POST /api/kiosk/generate-forms - Generate populated PDFs for an application
export async function POST(request: NextRequest) {
  try {
    if (!db) {
      return NextResponse.json(
        { error: "Database not initialized" },
        { status: 500 }
      );
    }

    const body = await request.json();

    if (!body.applicationId) {
      return NextResponse.json(
        { error: "Missing required field: applicationId" },
        { status: 400 }
      );
    }

    // Fetch the application
    const applicationsRef = kioskSpaApplicationsCollection();
    if (!applicationsRef) {
      return NextResponse.json(
        { error: "Collection not available" },
        { status: 500 }
      );
    }

    const appDocRef = doc(applicationsRef, body.applicationId);
    const appDocSnap = await getDoc(appDocRef);

    if (!appDocSnap.exists()) {
      return NextResponse.json(
        { error: "Application not found" },
        { status: 404 }
      );
    }

    const application = {
      ...appDocSnap.data(),
      id: appDocSnap.id,
    } as any;

    // Fetch all active templates
    const templatesRef = kioskFormTemplatesCollection();
    if (!templatesRef) {
      return NextResponse.json(
        { error: "Templates collection not available" },
        { status: 500 }
      );
    }

    const q = query(templatesRef, where("status", "==", "active"));
    const templatesSnap = await getDocs(q);
    const templates = templatesSnap.docs.map(doc => ({
      ...doc.data(),
      id: doc.id,
    })) as any[];

    // Filter templates based on category selection
    let applicableTemplates = templates;
    if (body.category && body.category !== "all") {
      if (body.category === "required") {
        applicableTemplates = templates.filter((t: any) => t.category === "required");
      } else if (body.category === "optional") {
        applicableTemplates = templates.filter((t: any) => t.category === "optional");
      }
    }

    // Generate PDFs
    const results = await generateAllPDFs(application, applicableTemplates);

    // Count successes and failures
    const successful = results.filter(r => r.pdfData !== null);
    const failed = results.filter(r => r.pdfData === null);

    return NextResponse.json({
      data: {
        total: results.length,
        successful: successful.length,
        failed: failed.length,
        forms: results.map(r => ({
          templateName: r.template.name,
          templateId: r.template.id,
          success: r.pdfData !== null,
          // In production, include base64 PDF data or download URL
          pdfData: r.pdfData ? "PDF generated successfully" : null,
        })),
      }
    });
  } catch (error) {
    console.error("Error generating forms:", error);
    return NextResponse.json(
      { error: "Failed to generate forms" },
      { status: 500 }
    );
  }
}
