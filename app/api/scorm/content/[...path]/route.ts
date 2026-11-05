import { NextRequest, NextResponse } from "next/server";
import { adminStorage } from "@/lib/firebase-admin";
import {
  verifyScormSession,
  SCORM_SESSION_COOKIE,
} from "@/lib/scorm-session";

/**
 * GET /api/scorm/content/[...path]
 * Streams an extracted SCORM file from Firebase Storage at the same origin,
 * so SCORM content in an iframe can locate the runtime API on its parent.
 * Requires a valid scorm_session cookie (minted by /api/scorm/token) whose
 * package id matches the requested path.
 * Path format: scorm/{packageId}/{file...}
 */
export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ path: string[] }> }
) {
  try {
    if (!adminStorage) {
      return NextResponse.json(
        { error: "Storage is not configured" },
        { status: 503 }
      );
    }

    const { path } = await ctx.params;
    const filePath = path.join("/");

    // Restrict to the scorm/ prefix
    if (!filePath.startsWith("scorm/") || filePath.includes("..")) {
      return NextResponse.json({ error: "Invalid path" }, { status: 400 });
    }

    // Session cookie must authorize this package id
    const session = verifyScormSession(
      req.cookies.get(SCORM_SESSION_COOKIE)?.value
    );
    if (!session || path[1] !== session.pkgId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const file = adminStorage.bucket().file(filePath);
    const [exists] = await file.exists();
    if (!exists) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const [buffer] = await file.download();
    const [metadata] = await file.getMetadata();

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type":
          (metadata.contentType as string) || guessContentType(filePath),
        "Cache-Control": "private, max-age=300",
      },
    });
  } catch (error) {
    console.error("[scorm/content] error:", error);
    return NextResponse.json({ error: "Failed to load file" }, { status: 500 });
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
  };
  return types[ext] || "application/octet-stream";
}
