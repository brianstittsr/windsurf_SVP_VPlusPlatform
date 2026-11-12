import { jsPDF } from "jspdf";
import type { CertificateDoc } from "./schema";

export function createCertificatePdfBytes(cert: CertificateDoc): Uint8Array {
  const pdf = new jsPDF({ orientation: "landscape", unit: "pt", format: "letter" });
  const width = pdf.internal.pageSize.getWidth();
  const height = pdf.internal.pageSize.getHeight();

  pdf.setFillColor(7, 22, 40);
  pdf.rect(0, 0, width, height, "F");
  pdf.setFillColor(253, 253, 251);
  pdf.rect(24, 24, width - 48, height - 48, "F");
  pdf.setDrawColor(211, 172, 99);
  pdf.setLineWidth(3);
  pdf.line(24, 84, width - 24, 84);
  pdf.line(24, height - 84, width - 24, height - 84);

  pdf.setTextColor(7, 22, 40);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(26);
  pdf.text("EAGLE FLIGHT VERTICAL SOLUTIONS", width / 2, 60, { align: "center" });
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(11);
  pdf.setTextColor(20, 120, 172);
  pdf.text("STRATEGIC VALUE PLUS", width / 2, 78, { align: "center" });

  pdf.setTextColor(7, 22, 40);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(34);
  pdf.text("CERTIFICATE OF COMPLETION", width / 2, 170, { align: "center" });
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(13);
  pdf.text("This certifies that", width / 2, 220, { align: "center" });
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(28);
  pdf.text(cert.studentName, width / 2, 265, { align: "center" });
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(13);
  pdf.text("has successfully completed", width / 2, 300, { align: "center" });
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(20);
  pdf.setTextColor(20, 120, 172);
  pdf.text(`${cert.courseCode} — ${cert.courseTitle}`, width / 2, 340, { align: "center", maxWidth: width - 160 });

  pdf.setTextColor(7, 22, 40);
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(12);
  const issued = cert.issuedAt?.toDate?.().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }) || "";
  pdf.text(`Issued: ${issued}`, 80, height - 120);
  pdf.text(`Certificate ID: ${cert.certificateNumber}`, width - 80, height - 120, { align: "right" });
  pdf.setFontSize(9);
  pdf.setTextColor(89, 101, 109);
  pdf.text(
    "This certificate documents completion of V+ training. It does not constitute an FAA Remote Pilot Certificate, guarantee an FAA examination result, or replace the applicable FAA certification process.",
    width / 2,
    height - 56,
    { align: "center", maxWidth: width - 160 }
  );
  return new Uint8Array(pdf.output("arraybuffer"));
}

export function downloadCertificatePdf(cert: CertificateDoc): void {
  const bytes = createCertificatePdfBytes(cert);
  const buffer = new ArrayBuffer(bytes.byteLength);
  new Uint8Array(buffer).set(bytes);
  const url = URL.createObjectURL(new Blob([buffer], { type: "application/pdf" }));
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `${cert.certificateNumber}.pdf`;
  anchor.click();
  URL.revokeObjectURL(url);
}
