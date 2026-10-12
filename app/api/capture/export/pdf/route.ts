import { NextRequest, NextResponse } from "next/server";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { adminDb } from "@/lib/firebase-admin";
import { COLLECTIONS } from "@/lib/schema";
import { requireUser } from "@/lib/capture/server-auth";
import { stageLabel } from "@/lib/capture/stages";

/** GET /api/capture/export/pdf — pipeline report PDF for the current filter set. */
export async function GET(req: NextRequest) {
  const user = await requireUser(req);
  if (user instanceof NextResponse) return user;
  if (!adminDb) return NextResponse.json({ error: "Database unavailable" }, { status: 500 });

  const params = req.nextUrl.searchParams;
  let snap;
  if (params.get("boardType")) {
    snap = await adminDb
      .collection(COLLECTIONS.CAPTURE_OPPORTUNITIES)
      .where("boardType", "==", params.get("boardType"))
      .where("deletedAt", "==", null)
      .get();
  } else {
    snap = await adminDb
      .collection(COLLECTIONS.CAPTURE_OPPORTUNITIES)
      .where("deletedAt", "==", null)
      .get();
  }

  let opps = snap.docs.map((d) => ({ id: d.id, ...d.data() })) as {
    title?: string; clientName?: string; solicitationNumber?: string;
    agency?: string; stage?: string; type?: string;
    estimatedValue?: number; ownerName?: string;
    responseDue?: { at?: string } | null; deletedAt?: unknown;
    [k: string]: unknown;
  }[];
  if (params.get("stage")) opps = opps.filter((o) => o.stage === params.get("stage"));
  if (params.get("clientId")) opps = opps.filter((o) => o.clientId === params.get("clientId"));
  opps.sort((a, b) => (a.stage || "").localeCompare(b.stage || "") || (a.title || "").localeCompare(b.title || ""));

  const doc = new jsPDF({ orientation: "landscape" });
  doc.setFontSize(16);
  doc.text("Capture Pipeline Report", 14, 15);
  doc.setFontSize(9);
  doc.setTextColor(120);
  doc.text(`Generated ${new Date().toLocaleString("en-US")} — ${opps.length} opportunities`, 14, 21);

  autoTable(doc, {
    startY: 26,
    head: [["Title", "Client", "Solicitation #", "Agency", "Stage", "Type", "Est. Value", "Response Due", "Owner"]],
    body: opps.map((o) => [
      o.title || "",
      o.clientName || "",
      o.solicitationNumber || "",
      o.agency || "",
      stageLabel((o.boardType as string) || "standard", o.stage || ""),
      o.type || "",
      o.estimatedValue ? `$${Number(o.estimatedValue).toLocaleString()}` : "—",
      o.responseDue?.at ? new Date(o.responseDue.at).toLocaleDateString("en-US") : "—",
      o.ownerName || "",
    ]),
    styles: { fontSize: 7, cellPadding: 1.5 },
    headStyles: { fillColor: [30, 41, 59] },
    alternateRowStyles: { fillColor: [245, 247, 250] },
  });

  const pdf = doc.output("arraybuffer");
  return new NextResponse(pdf, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="capture-pipeline-${new Date().toISOString().slice(0, 10)}.pdf"`,
    },
  });
}
