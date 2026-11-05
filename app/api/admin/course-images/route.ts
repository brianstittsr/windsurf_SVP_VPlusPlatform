import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminStorage } from "@/lib/firebase-admin";
import { lmsApiError, requireLmsAdmin } from "@/lib/lms-api-auth";

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

export async function POST(req: NextRequest) {
  try {
    const actor = await requireLmsAdmin(req);
    if (!adminStorage || !adminAuth) {
      return NextResponse.json({ error: "Storage is unavailable" }, { status: 503 });
    }
    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "An image file is required" }, { status: 400 });
    }
    if (!ALLOWED_TYPES.has(file.type) || file.size > MAX_IMAGE_BYTES || file.size === 0) {
      return NextResponse.json(
        { error: "Use a non-empty JPEG, PNG, or WebP image under 5 MB" },
        { status: 400 }
      );
    }
    const extension = file.type === "image/jpeg" ? "jpg" : file.type.split("/")[1];
    const objectPath = `course-images/${randomUUID()}.${extension}`;
    const token = randomUUID();
    const bucket = adminStorage.bucket();
    await bucket.file(objectPath).save(Buffer.from(await file.arrayBuffer()), {
      resumable: false,
      metadata: {
        contentType: file.type,
        cacheControl: "public, max-age=31536000, immutable",
        metadata: { firebaseStorageDownloadTokens: token, uploadedBy: actor.uid },
      },
    });
    const imageUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(objectPath)}?alt=media&token=${token}`;
    return NextResponse.json({ data: { imageUrl, storagePath: objectPath } }, { status: 201 });
  } catch (error) {
    return lmsApiError(error);
  }
}
