import { NextRequest, NextResponse } from "next/server";
import JSZip from "jszip";
import { adminAuth, adminDb, adminStorage } from "@/lib/firebase-admin";

/**
 * POST /api/scorm/upload
 * Admin-only. Accepts multipart form: `file` (SCORM zip), `courseId`.
 * Extracts the package to Firebase Storage under scorm/{packageId}/,
 * parses imsmanifest.xml for launch metadata, and records a scormPackages doc.
 */
export async function POST(req: NextRequest) {
  try {
    if (!adminDb || !adminAuth || !adminStorage) {
      return NextResponse.json(
        { error: "Server storage is not configured" },
        { status: 503 }
      );
    }

    const authHeader = req.headers.get("authorization") || "";
    const idToken = authHeader.startsWith("Bearer ")
      ? authHeader.slice(7)
      : null;
    if (!idToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const decoded = await adminAuth.verifyIdToken(idToken);

    // Verify the caller is an admin
    const callerSnap = await adminDb
      .collection("teamMembers")
      .where("firebaseUid", "==", decoded.uid)
      .where("role", "==", "admin")
      .limit(1)
      .get();
    if (callerSnap.empty) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const courseId = formData.get("courseId") as string | null;
    if (!file || !courseId) {
      return NextResponse.json(
        { error: "file and courseId are required" },
        { status: 400 }
      );
    }

    const zip = await JSZip.loadAsync(await file.arrayBuffer());
    const manifestFile = zip.file("imsmanifest.xml");
    if (!manifestFile) {
      return NextResponse.json(
        { error: "Not a SCORM package — imsmanifest.xml missing" },
        { status: 400 }
      );
    }
    const manifest = await manifestFile.async("string");

    // Parse manifest: version, title, launch resource href
    const schemaVersion = /2004/i.test(manifest)
      ? ("2004" as const)
      : ("1.2" as const);
    const titleMatch =
      manifest.match(/<title>([^<]+)<\/title>/i) ||
      manifest.match(/<title><!\[CDATA\[([^\]]+)\]\]><\/title>/i);
    const scoResource =
      manifest.match(
        /<resource[^>]*(?:scormType|scormtype|adlcp:scormtype)=["']sco["'][^>]*href=["']([^"']+)["']/i
      ) ||
      manifest.match(
        /<resource[^>]*href=["']([^"']+)["'][^>]*(?:scormType|scormtype|adlcp:scormtype)=["']sco["']/i
      );
    const anyResource = manifest.match(/<resource[^>]*href=["']([^"']+)["']/i);
    const launchHref = (scoResource?.[1] || anyResource?.[1] || "").replace(
      /^\.?\//,
      ""
    );
    if (!launchHref) {
      return NextResponse.json(
        { error: "Could not determine launch resource from manifest" },
        { status: 400 }
      );
    }

    // Create the package doc first to obtain its id for the storage path
    const pkgRef = adminDb.collection("scormPackages").doc();
    const storagePath = `scorm/${pkgRef.id}/`;
    const bucket = adminStorage.bucket();

    // Extract all files to storage
    const entries = Object.values(zip.files).filter((e) => !e.dir);
    let itemCount = 0;
    await Promise.all(
      entries.map(async (entry) => {
        const buffer = await entry.async("nodebuffer");
        await bucket.file(`${storagePath}${entry.name}`).save(buffer, {
          resumable: false,
          metadata: { contentType: guessContentType(entry.name) },
        });
        itemCount++;
      })
    );

    await pkgRef.set({
      courseId,
      fileName: file.name,
      version: schemaVersion,
      title: titleMatch?.[1]?.trim() || file.name,
      storagePath,
      launchPath: `${storagePath}${launchHref}`,
      itemCount,
      uploadedBy: decoded.email || decoded.uid,
      createdAt: new Date(),
    });

    // Link the package to the course
    await adminDb.collection("courses").doc(courseId).update({
      scormPackageId: pkgRef.id,
      updatedAt: new Date(),
    });

    return NextResponse.json({
      packageId: pkgRef.id,
      version: schemaVersion,
      launchPath: `${storagePath}${launchHref}`,
      files: itemCount,
    });
  } catch (error) {
    console.error("[scorm/upload] error:", error);
    return NextResponse.json(
      { error: "Failed to process SCORM package" },
      { status: 500 }
    );
  }
}

function guessContentType(path: string): string {
  const ext = path.split(".").pop()?.toLowerCase() || "";
  const types: Record<string, string> = {
    html: "text/html",
    htm: "text/html",
    js: "text/javascript",
    css: "text/css",
    xml: "application/xml",
    json: "application/json",
    png: "image/png",
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    gif: "image/gif",
    svg: "image/svg+xml",
    mp4: "video/mp4",
    mp3: "audio/mpeg",
    pdf: "application/pdf",
    woff: "font/woff",
    woff2: "font/woff2",
    ttf: "font/ttf",
    swf: "application/x-shockwave-flash",
  };
  return types[ext] || "application/octet-stream";
}
