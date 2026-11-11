import { jsPDF } from "jspdf";
import type { RegistrationFormFieldDoc } from "@/lib/schema";

export interface RegistrationPdfSignature {
  fieldId: string;
  typedName: string;
  imageDataUrl: string;
}

export interface RegistrationPdfInput {
  formName: string;
  formVersion: number;
  submittedAt: Date;
  fields: RegistrationFormFieldDoc[];
  answers: Record<string, unknown>;
  courseLines: { code: string; title: string; priceCents: number }[];
  signatures: RegistrationPdfSignature[];
}

function printable(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (Array.isArray(value)) return value.map(printable).filter(Boolean).join(", ");
  if (typeof value === "object") return Object.entries(value as Record<string, unknown>)
    .map(([key, part]) => `${key}: ${printable(part)}`)
    .filter((part) => !part.endsWith(": "))
    .join(" · ");
  return String(value);
}

export function generateSignedRegistrationPdf(input: RegistrationPdfInput): Uint8Array {
  const pdf = new jsPDF({ unit: "pt", format: "letter" });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const left = 54;
  const maxWidth = pageWidth - left * 2;
  let y = 58;

  const ensureSpace = (height: number) => {
    if (y + height > pageHeight - 54) {
      pdf.addPage();
      y = 54;
    }
  };
  const write = (text: string, options?: { bold?: boolean; size?: number; color?: [number, number, number] }) => {
    const size = options?.size || 10;
    const lines = pdf.splitTextToSize(text, maxWidth);
    ensureSpace(lines.length * (size + 4) + 8);
    pdf.setFont("helvetica", options?.bold ? "bold" : "normal");
    pdf.setFontSize(size);
    const color = options?.color || [7, 22, 40];
    pdf.setTextColor(...color);
    pdf.text(lines, left, y);
    y += lines.length * (size + 4) + 8;
  };

  pdf.setFillColor(7, 22, 40);
  pdf.rect(0, 0, pageWidth, 14, "F");
  pdf.setTextColor(7, 22, 40);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(19);
  pdf.text("V+ UAS TRAINING ACADEMY", left, y);
  y += 28;
  write(input.formName, { bold: true, size: 15, color: [20, 120, 172] });
  write(`Form version ${input.formVersion} · Submitted ${input.submittedAt.toLocaleString("en-US", { timeZone: "UTC" })} UTC`, { size: 9, color: [89, 101, 109] });
  y += 4;

  for (const field of input.fields) {
    if (field.type === "section") {
      ensureSpace(28);
      write(field.label, { bold: true, size: 12, color: [20, 120, 172] });
      continue;
    }
    if (field.type === "paragraph") {
      write(field.label, { size: 9, color: [89, 101, 109] });
      continue;
    }
    const value = input.answers[field.id];
    if (value === undefined || value === null || value === "") continue;
    write(`${field.label}: ${printable(value)}`, { size: 10 });
    const signature = input.signatures.find((item) => item.fieldId === field.id);
    if (signature) {
      ensureSpace(112);
      pdf.setDrawColor(217, 216, 206);
      pdf.roundedRect(left, y, 270, 74, 4, 4, "S");
      pdf.addImage(signature.imageDataUrl, "PNG", left + 6, y + 5, 258, 48);
      y += 83;
      write(`Signed electronically by ${signature.typedName}`, { bold: true, size: 9 });
    }
  }

  ensureSpace(input.courseLines.length * 22 + 36);
  write("Selected courses", { bold: true, size: 12, color: [20, 120, 172] });
  for (const course of input.courseLines) {
    write(`${course.code} — ${course.title} | $${(course.priceCents / 100).toFixed(2)}`, { size: 10 });
  }
  write("Payment details are not collected on this document. Approved applicants receive a secure Stripe Checkout link.", { size: 9, color: [89, 101, 109] });
  write("This registration record is stored in V+ Academy for enrollment processing and student history.", { size: 9, color: [89, 101, 109] });

  pdf.setDrawColor(211, 172, 99);
  pdf.setLineWidth(2);
  pdf.line(left, pageHeight - 32, pageWidth - left, pageHeight - 32);
  return new Uint8Array(pdf.output("arraybuffer"));
}
