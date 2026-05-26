import { NextRequest, NextResponse } from "next/server";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db } from "@/lib/firebase";
import { doc, updateDoc, Timestamp } from "firebase/firestore";
import { COLLECTIONS } from "@/lib/schema";

export async function POST(request: NextRequest) {
  try {
    if (!db) {
      return NextResponse.json(
        { error: "Database not initialized" },
        { status: 500 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;
    const fileName = formData.get("fileName") as string;
    const documentType = formData.get("documentType") as string;
    const token = formData.get("token") as string;

    if (!file || !fileName || !documentType || !token) {
      return NextResponse.json(
        { error: "Missing required fields: file, fileName, documentType, token" },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Only image files (JPEG, PNG, WebP) are allowed" },
        { status: 400 }
      );
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: "File size must be less than 10MB" },
        { status: 400 }
      );
    }

    // Upload to Firebase Storage
    const storage = getStorage();
    const storagePath = `kiosk-uploads/${token}/${Date.now()}-${fileName}`;
    const storageRef = ref(storage, storagePath);

    await uploadBytes(storageRef, await file.arrayBuffer());
    const downloadUrl = await getDownloadURL(storageRef);

    // Generate thumbnail URL (in production, this would create an actual thumbnail)
    const thumbnailUrl = downloadUrl; // For now, use the same URL

    // Store document metadata in the upload link
    const uploadLinksRef = doc(db, COLLECTIONS.KIOSK_DOCUMENT_UPLOAD_LINKS, token);
    await updateDoc(uploadLinksRef, {
      documents: [
        {
          id: `${Date.now()}`,
          documentType,
          fileName,
          storageUrl: downloadUrl,
          thumbnailUrl,
          fileSize: file.size,
          mimeType: file.type,
          uploadedAt: Timestamp.now(),
          aiStatus: "pending"
        }
      ],
      updatedAt: Timestamp.now()
    });

    return NextResponse.json({
      data: {
        id: `${Date.now()}`,
        documentType,
        fileName,
        storageUrl: downloadUrl,
        thumbnailUrl,
        fileSize: file.size,
        mimeType: file.type,
        uploadedAt: new Date().toISOString()
      }
    }, { status: 201 });

  } catch (error) {
    console.error("Error uploading file:", error);
    return NextResponse.json(
      { error: "Failed to upload file" },
      { status: 500 }
    );
  }
}
