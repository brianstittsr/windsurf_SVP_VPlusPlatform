import { NextRequest, NextResponse } from "next/server";
import { Timestamp } from "firebase-admin/firestore";
import { randomUUID } from "crypto";
import { adminDb, adminStorage } from "@/lib/firebase-admin";
import { COLLECTIONS, type GrantDocumentDoc } from "@/lib/schema";
import { requireGrantStaff } from "@/lib/grants/access";
import { serializeDoc } from "@/lib/capture/serialize";
import { captureAudit } from "@/lib/capture/audit";
import { detectDocKind, toMarkdown } from "@/lib/grants/markdown";

type Params = { params: Promise<{ id: string }> };

const MAX_BYTES = 10 * 1024 * 1024;

/** GET /api/grants/[id]/documents — list uploaded input documents. */
export async function GET(req: NextRequest, { params }: Params) {
  const user = await requireGrantStaff(req);
  if (user instanceof NextResponse) return user;
  if (!adminDb) return NextResponse.json({ error: "Database unavailable" }, { status: 500 });
  const { id } = await params;

  const snap = await adminDb.collection(COLLECTIONS.GRANT_DOCUMENTS).where("grantId", "==", id).get();
  const documents = snap.docs.map((d) => serializeDoc({ id: d.id, ...d.data() }));
  return NextResponse.json({ documents });
}

/** POST /api/grants/[id]/documents — multipart upload → Storage → convert to markdown. */
export async function POST(req: NextRequest, { params }: Params) {
  const user = await requireGrantStaff(req);
  if (user instanceof NextResponse) return user;
  if (!adminDb || !adminStorage) return NextResponse.json({ error: "Document storage unavailable" }, { status: 503 });
  const { id: grantId } = await params;

  const grantSnap = await adminDb.collection(COLLECTIONS.GRANT_OPPORTUNITIES).doc(grantId).get();
  if (!grantSnap.exists) return NextResponse.json({ error: "Grant not found" }, { status: 404 });

  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "Select a file to upload" }, { status: 400 });
  if (!file.size || file.size > MAX_BYTES) return NextResponse.json({ error: "Files must be under 10 MB" }, { status: 400 });

  const kind = detectDocKind(file.name, file.type);
  if (!kind) {
    return NextResponse.json({ error: "Unsupported file type — upload PDF, DOCX, image, or text files" }, { status: 400 });
  }

  const bytes = Buffer.from(await file.arrayBuffer());
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(-100) || "document";
  const docId = randomUUID();
  const storagePath = `grant-documents/${grantId}/${docId}/${safeName}`;
  await adminStorage.bucket().file(storagePath).save(bytes, {
    resumable: false,
    metadata: { contentType: file.type || "application/octet-stream", cacheControl: "private, no-store" },
  });

  const doc: Omit<GrantDocumentDoc, "id"> = {
    grantId,
    fileName: file.name,
    contentType: file.type || "application/octet-stream",
    sizeBytes: file.size,
    storagePath,
    status: "processing",
    uploadedBy: user.teamMemberId || user.uid,
    createdAt: Timestamp.now(),
  } as unknown as Omit<GrantDocumentDoc, "id">;
  const ref = adminDb.collection(COLLECTIONS.GRANT_DOCUMENTS).doc(docId);
  await ref.set(doc);

  try {
    const markdown = await toMarkdown(bytes, file.name, file.type || "");
    await ref.update({ markdown, status: "converted" });
    await captureAudit({
      type: "create",
      entityType: "grant-document",
      entityId: docId,
      entityName: file.name,
      description: `${user.displayName} uploaded "${file.name}" (${kind}) → markdown`,
      userId: user.uid,
    });
    return NextResponse.json(
      { document: serializeDoc({ id: docId, ...doc, markdown, status: "converted" }) },
      { status: 201 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Conversion failed";
    await ref.update({ status: "failed", errorMessage: message });
    return NextResponse.json({ error: `Uploaded but conversion failed: ${message}` }, { status: 422 });
  }
}
