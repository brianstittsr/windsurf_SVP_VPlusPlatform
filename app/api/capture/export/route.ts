import { NextRequest, NextResponse } from "next/server";
import ExcelJS from "exceljs";
import { adminDb } from "@/lib/firebase-admin";
import { COLLECTIONS, type CaptureOpportunityDoc } from "@/lib/schema";
import { requireUser } from "@/lib/capture/server-auth";
import { exportRequestSchema } from "@/lib/capture/validation";
import { stageLabel } from "@/lib/capture/stages";

/** POST /api/capture/export — xlsx workbook of filtered opportunities. */
export async function POST(req: NextRequest) {
  const user = await requireUser(req);
  if (user instanceof NextResponse) return user;
  if (!adminDb) return NextResponse.json({ error: "Database unavailable" }, { status: 500 });

  const body = await req.json().catch(() => ({}));
  const parsed = exportRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  const { clientId, stage, ownerId, type } = parsed.data;

  let query = adminDb.collection(COLLECTIONS.CAPTURE_OPPORTUNITIES).where("deletedAt", "==", null) as FirebaseFirestore.Query;
  if (clientId) query = query.where("clientId", "==", clientId);
  if (stage) query = query.where("stage", "==", stage);
  if (ownerId) query = query.where("ownerId", "==", ownerId);
  if (type) query = query.where("type", "==", type);

  const snap = await query.get();
  const opps = snap.docs.map((d) => ({ id: d.id, ...d.data() }) as CaptureOpportunityDoc);

  const workbook = new ExcelJS.Workbook();
  workbook.creator = "SVP Capture Management";
  const sheet = workbook.addWorksheet("Opportunities");
  sheet.columns = [
    { header: "Title", key: "title", width: 36 },
    { header: "Client", key: "clientName", width: 24 },
    { header: "Solicitation #", key: "solicitationNumber", width: 20 },
    { header: "Type", key: "type", width: 14 },
    { header: "Agency", key: "agency", width: 28 },
    { header: "Stage", key: "stage", width: 14 },
    { header: "Set-Aside", key: "setAside", width: 14 },
    { header: "NAICS", key: "naicsCode", width: 12 },
    { header: "Questions Due", key: "questionsDue", width: 22 },
    { header: "Response Due", key: "responseDue", width: 22 },
    { header: "Owner", key: "ownerName", width: 20 },
    { header: "Bid/No-Bid", key: "decision", width: 12 },
    { header: "Est. Value", key: "estValue", width: 18 },
  ];
  sheet.getRow(1).font = { bold: true };

  for (const o of opps) {
    const fmtDeadline = (d?: { at?: string; timezone?: string } | null) =>
      d?.at ? `${new Date(d.at).toISOString().replace("T", " ").slice(0, 16)} ${d.timezone || ""}`.trim() : "";
    const est = o.estimatedValue as { min?: number; max?: number; text?: string } | undefined;
    sheet.addRow({
      title: o.title,
      clientName: o.clientName,
      solicitationNumber: o.solicitationNumber,
      type: o.type,
      agency: o.agency,
      stage: stageLabel(o.boardType, o.stage),
      setAside: o.setAside || "",
      naicsCode: o.naicsCode || "",
      questionsDue: fmtDeadline(o.questionsDue),
      responseDue: fmtDeadline(o.responseDue),
      ownerName: o.ownerName || "",
      decision: o.bidNoBid?.decision || "",
      estValue: est?.text || (est?.min || est?.max ? `${est.min ?? ""}–${est.max ?? ""}` : ""),
    });
  }

  const buffer = await workbook.xlsx.writeBuffer();
  return new NextResponse(buffer as ArrayBuffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="capture-opportunities-${new Date().toISOString().slice(0, 10)}.xlsx"`,
    },
  });
}
