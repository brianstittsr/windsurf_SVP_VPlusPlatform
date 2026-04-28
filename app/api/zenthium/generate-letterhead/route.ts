import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { COLLECTIONS } from "@/lib/schema";
import jsPDF from "jspdf";
import { z } from "zod";

const generateSchema = z.object({
  submissionId: z.string(),
  recipientEmail: z.string().email(),
  recipientName: z.string().optional(),
  recipientCompany: z.string().optional(),
  message: z.string().optional(),
});

// SVP Team emails for notifications
const SVP_TEAM = [
  "bstitt@strategicvalueplus.com",
  "nhallums@strategicvalueplus.com",
  "nelinia@strategicvalueplus.com",
  "rdickan@strategicvalueplus.com",
];

export async function POST(request: NextRequest) {
  if (!adminDb) {
    return NextResponse.json(
      { error: "Database not initialized" },
      { status: 500 }
    );
  }

  try {
    const body = await request.json();
    const parsed = generateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request data", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { submissionId, recipientEmail, recipientName, recipientCompany, message } = parsed.data;

    // Fetch submission data
    const docRef = adminDb.collection(COLLECTIONS.ZENTHIUM_LOCATION_SUBMISSIONS).doc(submissionId);
    const doc = await docRef.get();

    if (!doc.exists) {
      return NextResponse.json(
        { error: "Submission not found" },
        { status: 404 }
      );
    }

    const submission = doc.data();
    if (!submission) {
      return NextResponse.json(
        { error: "Submission data is empty" },
        { status: 404 }
      );
    }

    // Generate PDF letterhead
    const pdf = generateLetterheadPDF(submission, recipientName, recipientCompany, message);
    
    // Convert to base64
    const pdfBase64 = pdf.output('datauristring').split(',')[1];

    // Generate response URLs
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://strategicvalueplus.com";
    const interestedUrl = `${baseUrl}/api/zenthium/respond?submissionId=${submissionId}&response=interested&token=${generateToken(submissionId)}`;
    const notInterestedUrl = `${baseUrl}/api/zenthium/respond?submissionId=${submissionId}&response=not-interested&token=${generateToken(submissionId)}`;

    return NextResponse.json({
      success: true,
      pdfBase64,
      filename: `SVP-DataCenter-Property-${submissionId}.pdf`,
      interestedUrl,
      notInterestedUrl,
    });

  } catch (error) {
    console.error("[Zenthium] Generate letterhead error:", error);
    return NextResponse.json(
      { error: "Failed to generate letterhead" },
      { status: 500 }
    );
  }
}

function generateLetterheadPDF(
  submission: any,
  recipientName?: string,
  recipientCompany?: string,
  customMessage?: string
) {
  const doc = new jsPDF('p', 'pt', 'letter');
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 72; // 1 inch margins
  let y = margin;

  // Colors
  const primaryColor = [234, 69, 96]; // #e94560 - SVP red/pink
  const darkColor = [26, 26, 46]; // #1a1a2e - Dark navy
  const grayColor = [100, 100, 100];

  // === HEADER / LETTERHEAD ===
  
  // Logo placeholder (would be actual logo image)
  doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.roundedRect(margin, y, 60, 60, 8, 8, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('SVP', margin + 30, y + 38, { align: 'center' });

  // Company Name
  doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text('Strategic Value Plus, Inc.', margin + 80, y + 35);

  // Tagline
  doc.setFontSize(10);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(grayColor[0], grayColor[1], grayColor[2]);
  doc.text('Transforming Manufacturing & Infrastructure', margin + 80, y + 52);

  y += 80;

  // Separator line
  doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.setLineWidth(2);
  doc.line(margin, y, pageWidth - margin, y);

  y += 30;

  // Date
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(grayColor[0], grayColor[1], grayColor[2]);
  doc.text(new Date().toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  }), pageWidth - margin, y, { align: 'right' });

  y += 40;

  // Recipient
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
  doc.text('TO:', margin, y);
  
  doc.setFont('helvetica', 'normal');
  if (recipientName) {
    doc.text(recipientName, margin + 40, y);
    y += 16;
  }
  if (recipientCompany) {
    doc.text(recipientCompany, margin + 40, y);
    y += 16;
  }
  
  y += 20;

  // Subject Line
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text('RE: Data Center Development Opportunity', margin, y);
  
  y += 30;

  // Salutation
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
  const salutation = recipientName ? `Dear ${recipientName.split(' ')[0]},` : 'Dear Data Center Development Team,';
  doc.text(salutation, margin, y);

  y += 30;

  // Body - Introduction
  doc.setFontSize(10);
  const introText = customMessage || 
    `Strategic Value Plus, through our Zenthium division, is pleased to present an exceptional property opportunity for data center development. We believe this location aligns with your infrastructure expansion requirements and offers significant strategic advantages.`;
  
  const introLines = doc.splitTextToSize(introText, pageWidth - (margin * 2));
  doc.text(introLines, margin, y);
  y += (introLines.length * 14) + 20;

  // Property Details Box
  doc.setFillColor(248, 249, 250);
  doc.roundedRect(margin, y, pageWidth - (margin * 2), 180, 8, 8, 'F');
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text('PROPERTY DETAILS', margin + 15, y + 25);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);

  let detailY = y + 45;
  
  // Property Name/Address
  doc.setFont('helvetica', 'bold');
  doc.text('Property:', margin + 15, detailY);
  doc.setFont('helvetica', 'normal');
  const propertyName = submission.propertyName || 'Unnamed Property';
  const address = submission.address ? 
    `${submission.address}, ${submission.city || ''}, ${submission.state || ''} ${submission.zip || ''}` : 
    'Address on file';
  doc.text(`${propertyName} - ${address}`, margin + 80, detailY);
  detailY += 18;

  // Size
  doc.setFont('helvetica', 'bold');
  doc.text('Size:', margin + 15, detailY);
  doc.setFont('helvetica', 'normal');
  const size = submission.acreage ? 
    `${submission.acreage} acres` : 
    (submission.squareFootage ? `${submission.squareFootage.toLocaleString()} sq ft` : 'See details');
  doc.text(size, margin + 80, detailY);
  detailY += 18;

  // Power
  if (submission.powerCapacityMW || submission.powerAvailableMW) {
    doc.setFont('helvetica', 'bold');
    doc.text('Power:', margin + 15, detailY);
    doc.setFont('helvetica', 'normal');
    const power = submission.powerCapacityMW || submission.powerAvailableMW;
    doc.text(`${power} MW available`, margin + 80, detailY);
    detailY += 18;
  }

  // Zoning
  if (submission.zoning || submission.zoningClassification) {
    doc.setFont('helvetica', 'bold');
    doc.text('Zoning:', margin + 15, detailY);
    doc.setFont('helvetica', 'normal');
    doc.text(submission.zoning || submission.zoningClassification, margin + 80, detailY);
    detailY += 18;
  }

  // Description
  if (submission.description || submission.additionalNotes) {
    doc.setFont('helvetica', 'bold');
    doc.text('Description:', margin + 15, detailY);
    doc.setFont('helvetica', 'normal');
    const desc = submission.description || submission.additionalNotes;
    const descLines = doc.splitTextToSize(desc.substring(0, 200) + (desc.length > 200 ? '...' : ''), pageWidth - (margin * 2) - 95);
    doc.text(descLines, margin + 80, detailY);
  }

  y += 200;

  // Response Section
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text('YOUR RESPONSE', margin, y);

  y += 25;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
  const responseText = 'Please indicate your interest in this property by clicking one of the options below. Your response will be automatically recorded and our team will be notified immediately.';
  const responseLines = doc.splitTextToSize(responseText, pageWidth - (margin * 2));
  doc.text(responseLines, margin, y);
  y += (responseLines.length * 14) + 20;

  // Response buttons (visual representation)
  // Interested Button
  doc.setFillColor(0, 200, 83); // Green
  doc.roundedRect(margin, y, 180, 40, 5, 5, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text("✓ I'M INTERESTED", margin + 90, y + 25, { align: 'center' });

  // Not Interested Button
  doc.setFillColor(158, 158, 158); // Gray
  doc.roundedRect(margin + 200, y, 180, 40, 5, 5, 'F');
  doc.setTextColor(255, 255, 255);
  doc.text("✗ NOT INTERESTED", margin + 290, y + 25, { align: 'center' });

  y += 70;

  // Closing
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
  doc.text('We appreciate your consideration of this opportunity. Please do not hesitate to contact me directly with any questions or to schedule a site visit.', margin, y);

  y += 40;

  // Signature
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('Nelinia Varenas', margin, y);
  y += 16;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text('Chief Executive Officer', margin, y);
  y += 14;
  doc.text('Strategic Value Plus, Inc.', margin, y);

  // === FOOTER ===
  const footerY = pageHeight - 80;
  
  // Separator
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.5);
  doc.line(margin, footerY, pageWidth - margin, footerY);

  // Contact Info
  doc.setFontSize(9);
  doc.setTextColor(grayColor[0], grayColor[1], grayColor[2]);
  doc.setFont('helvetica', 'normal');
  
  const contactInfo = [
    'Strategic Value Plus, Inc.',
    'Zenthium Data Center Division',
    'zenthium@strategicvalueplus.com',
    '1-800-555-0199',
    'www.strategicvalueplus.com/zenthium'
  ];

  let contactY = footerY + 20;
  contactInfo.forEach((line, index) => {
    if (index === 0) {
      doc.setFont('helvetica', 'bold');
    } else {
      doc.setFont('helvetica', 'normal');
    }
    doc.text(line, pageWidth / 2, contactY, { align: 'center' });
    contactY += 12;
  });

  return doc;
}

function generateToken(submissionId: string): string {
  // Simple token generation - in production use crypto
  const timestamp = Date.now();
  return Buffer.from(`${submissionId}:${timestamp}`).toString('base64');
}
