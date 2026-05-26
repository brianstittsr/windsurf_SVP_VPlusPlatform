import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { collection, getDocs, query, where, doc, updateDoc, addDoc, Timestamp } from "firebase/firestore";
import { COLLECTIONS } from "@/lib/schema";

// GET /api/kiosk/upload-links/[token] - Get link info by token (public)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    if (!db) {
      return NextResponse.json(
        { error: "Database not initialized" },
        { status: 500 }
      );
    }

    const { token } = await params;
    const linksRef = collection(db, COLLECTIONS.KIOSK_DOCUMENT_UPLOAD_LINKS);
    const q = query(linksRef, where("token", "==", token));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      return NextResponse.json(
        { error: "Upload link not found or expired" },
        { status: 404 }
      );
    }

    const linkDoc = snapshot.docs[0];
    const linkData = linkDoc.data() as any;

    // Check expiry
    const expiresAt = linkData.expiresAt?.toDate?.() || new Date(linkData.expiresAt?.seconds * 1000);
    if (expiresAt < new Date()) {
      // Mark as expired
      await updateDoc(doc(db, COLLECTIONS.KIOSK_DOCUMENT_UPLOAD_LINKS, linkDoc.id), {
        status: "expired",
        updatedAt: Timestamp.now(),
      });
      return NextResponse.json(
        { error: "This upload link has expired" },
        { status: 410 }
      );
    }

    if (linkData.status !== "active") {
      return NextResponse.json(
        { error: `This upload link is ${linkData.status}` },
        { status: 410 }
      );
    }

    return NextResponse.json({
      data: {
        id: linkDoc.id,
        patientName: linkData.patientName,
        language: linkData.language || "english",
        requestedDocuments: linkData.requestedDocuments || [],
        documents: linkData.documents || [], // Updated field name
        uploadedDocuments: linkData.uploadedDocuments || [], // Keep for backward compatibility
        maxUploads: linkData.maxUploads,
        status: linkData.status,
        eligibilityDetermination: linkData.eligibilityDetermination || null,
      }
    });
  } catch (error) {
    console.error("Error fetching upload link:", error);
    return NextResponse.json(
      { error: "Failed to fetch upload link" },
      { status: 500 }
    );
  }
}

// PATCH /api/kiosk/upload-links/[token] - Add uploaded document to link
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    if (!db) {
      return NextResponse.json(
        { error: "Database not initialized" },
        { status: 500 }
      );
    }

    const { token } = await params;
    const body = await request.json();

    const linksRef = collection(db, COLLECTIONS.KIOSK_DOCUMENT_UPLOAD_LINKS);
    const q = query(linksRef, where("token", "==", token));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      return NextResponse.json(
        { error: "Upload link not found" },
        { status: 404 }
      );
    }

    const linkDoc = snapshot.docs[0];
    const linkData = linkDoc.data() as any;

    if (linkData.status !== "active") {
      return NextResponse.json(
        { error: "This upload link is no longer active" },
        { status: 410 }
      );
    }

    // Add the new uploaded document
    const uploadedDocuments = linkData.uploadedDocuments || [];

    if (uploadedDocuments.length >= linkData.maxUploads) {
      return NextResponse.json(
        { error: "Maximum upload limit reached" },
        { status: 400 }
      );
    }

    const newDoc = {
      fileName: body.fileName || `document_${Date.now()}.jpg`,
      fileUrl: body.fileUrl || "",
      fileSize: body.fileSize || 0,
      mimeType: body.mimeType || "image/jpeg",
      documentType: body.documentType || "other",
      uploadedAt: Timestamp.now(),
      qualityCheck: body.qualityCheck || {
        passed: true,
        inFocus: true,
        noFingerBlocking: true,
        documentVisible: true,
        score: 100,
        issues: [],
      },
    };

    uploadedDocuments.push(newDoc);

    // Check if all requested documents are uploaded
    const allUploaded = uploadedDocuments.length >= linkData.requestedDocuments.length;

    await updateDoc(doc(db, COLLECTIONS.KIOSK_DOCUMENT_UPLOAD_LINKS, linkDoc.id), {
      uploadedDocuments,
      status: allUploaded ? "completed" : "active",
      updatedAt: Timestamp.now(),
    });

    return NextResponse.json({
      data: {
        success: true,
        uploadedCount: uploadedDocuments.length,
        totalRequested: linkData.requestedDocuments.length,
        status: allUploaded ? "completed" : "active",
      }
    });
  } catch (error) {
    console.error("Error updating upload link:", error);
    return NextResponse.json(
      { error: "Failed to save document" },
      { status: 500 }
    );
  }
}

// POST /api/kiosk/upload-links/[token] - Add document via QR code flow
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    if (!db) {
      return NextResponse.json(
        { error: "Database not initialized" },
        { status: 500 }
      );
    }

    const { token } = await params;
    const body = await request.json();

    const linksRef = collection(db, COLLECTIONS.KIOSK_DOCUMENT_UPLOAD_LINKS);
    const q = query(linksRef, where("token", "==", token));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      return NextResponse.json(
        { error: "Upload link not found" },
        { status: 404 }
      );
    }

    const linkDoc = snapshot.docs[0];
    const linkData = linkDoc.data() as any;

    if (linkData.status !== "active") {
      return NextResponse.json(
        { error: "This upload link is no longer active" },
        { status: 410 }
      );
    }

    // Check expiry
    const expiresAt = linkData.expiresAt?.toDate?.() || new Date(linkData.expiresAt?.seconds * 1000);
    if (expiresAt < new Date()) {
      await updateDoc(doc(db, COLLECTIONS.KIOSK_DOCUMENT_UPLOAD_LINKS, linkDoc.id), {
        status: "expired",
        updatedAt: Timestamp.now(),
      });
      return NextResponse.json(
        { error: "This upload link has expired" },
        { status: 410 }
      );
    }

    // Store the uploaded document in a separate collection
    const documentsRef = collection(db, "kioskUploadedDocuments");
    const newDocRef = await addDoc(documentsRef, {
      token,
      patientId: linkData.patientId,
      documentType: body.documentType,
      fileName: body.fileName,
      storageUrl: body.storageUrl,
      thumbnailUrl: body.thumbnailUrl,
      fileSize: body.fileSize || 0,
      mimeType: body.mimeType || "image/jpeg",
      uploadedAt: Timestamp.now(),
      aiStatus: "pending",
    });

    // Update the upload link with the new document reference
    const documents = linkData.documents || [];
    documents.push({
      id: newDocRef.id,
      documentType: body.documentType,
      fileName: body.fileName,
      storageUrl: body.storageUrl,
      thumbnailUrl: body.thumbnailUrl,
      uploadedAt: Timestamp.now(),
      aiStatus: "pending",
    });

    await updateDoc(doc(db, COLLECTIONS.KIOSK_DOCUMENT_UPLOAD_LINKS, linkDoc.id), {
      documents,
      updatedAt: Timestamp.now(),
    });

    return NextResponse.json({
      data: {
        id: newDocRef.id,
        documentType: body.documentType,
        fileName: body.fileName,
        storageUrl: body.storageUrl,
        thumbnailUrl: body.thumbnailUrl,
        uploadedAt: new Date().toISOString(),
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
