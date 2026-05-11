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
  const marginL = 60;
  const marginR = pageWidth - 60;
  const contentWidth = marginR - marginL;
  let y = 0;

  // ── Helper: safe string ──
  const safe = (val: any, fallback = '—'): string => {
    if (val === undefined || val === null || val === '') return fallback;
    return String(val);
  };

  // ── Helper: draw a table row ──
  const drawRow = (label: string, value: string, yPos: number, options?: { bold?: boolean }) => {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(90, 90, 90);
    doc.text(label, marginL + 16, yPos);
    doc.setFont('helvetica', options?.bold ? 'bold' : 'normal');
    doc.setTextColor(30, 30, 30);
    doc.text(value, marginL + 130, yPos);
  };

  // ── Helper: footer on a page ──
  const drawFooter = () => {
    // Thin rule
    doc.setDrawColor(210, 210, 210);
    doc.setLineWidth(0.5);
    doc.line(marginL, pageHeight - 60, marginR, pageHeight - 60);

    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(140, 140, 140);
    doc.text('Strategic Value Plus, Inc.  |  Zenthium Data Center Division  |  zenthium@strategicvalueplus.com', pageWidth / 2, pageHeight - 44, { align: 'center' });
    doc.text('www.strategicvalueplus.com/zenthium', pageWidth / 2, pageHeight - 34, { align: 'center' });
  };

  // ── Shared data ──
  const locationParts = [submission.city, submission.state].filter(Boolean);
  const locationStr = locationParts.length > 0 ? locationParts.join(', ') : 'Available upon request';
  const addrParts = [submission.address, submission.city, submission.state, submission.zip].filter(Boolean);
  const fullAddress = addrParts.length > 0 ? addrParts.join(', ') : 'Address available upon request';
  const sizeVal = submission.squareFootage
    ? `${Number(submission.squareFootage).toLocaleString()} sq ft`
    : submission.acreage
      ? `${submission.acreage} acres`
      : 'Contact for details';
  const powerMW = Number(submission.powerCapacityMW || submission.powerAvailableMW || 0);
  const powerStr = powerMW > 0 ? `${powerMW} MW` : 'Not specified';
  const sqft = Number(submission.squareFootage || 0);
  const ceilingFt = Number(submission.ceilingHeightFt || 0);
  const waterAvail = submission.waterAvailable || false;
  const isSingleStory = submission.isSingleStory || false;
  const isFloor = submission.isFloor || false;
  const zoningVal = safe(submission.zoning || submission.zoningClassification, 'Industrial');
  const typeVal = safe(submission.propertyType, 'Data Center Site');

  // ── 6 Critical Requirements ──
  const checks = [
    { label: 'Power Capacity', value: powerMW > 0 ? `${powerMW} MW` : 'Not specified', requirement: '20+ MW', pass: powerMW >= 20 },
    { label: 'Property Size', value: sqft > 0 ? `${sqft.toLocaleString()} sq ft` : 'Not specified', requirement: '10,000+ sq ft', pass: sqft >= 10000 },
    { label: 'Ceiling Height', value: ceilingFt > 0 ? `${ceilingFt} ft` : 'Not specified', requirement: '18+ ft', pass: ceilingFt >= 18 },
    { label: 'Water Access', value: waterAvail ? 'Available' : 'Not confirmed', requirement: 'Required', pass: waterAvail },
    { label: 'Single Story', value: isSingleStory ? 'Yes' : 'No', requirement: 'Required', pass: isSingleStory },
    { label: 'Flat Floor', value: isFloor ? 'Yes' : 'No', requirement: 'Required', pass: isFloor },
  ];
  const passedChecks = checks.filter(c => c.pass).length;
  const score = Math.round((passedChecks / checks.length) * 100);
  const meetsRequirements = passedChecks >= 4;

  // ── Helper: draw page header ──
  const drawHeader = () => {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(22);
    doc.setTextColor(30, 30, 30);
    doc.text('V+', marginL, 48);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(50, 50, 50);
    doc.text('Strategic Value Plus', marginL + 40, 44);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(130, 130, 130);
    doc.text('Zenthium Data Center Division', marginL + 40, 58);
    doc.setDrawColor(210, 210, 210);
    doc.setLineWidth(0.5);
    doc.line(marginL, 70, marginR, 70);
  };

  // ══════════════════════════════════════
  // PAGE 1 — PROPERTY DASHBOARD
  // ══════════════════════════════════════

  drawHeader();
  y = 88;

  // ── Highlighted Property Address ──
  doc.setFillColor(245, 247, 250);
  doc.setDrawColor(200, 205, 215);
  doc.setLineWidth(0.75);
  doc.roundedRect(marginL, y, contentWidth, 52, 4, 4, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(25, 25, 25);
  doc.text(safe(submission.propertyName, 'Property Opportunity'), marginL + 16, y + 22);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(80, 80, 80);
  doc.text(fullAddress, marginL + 16, y + 40);

  y += 66;

  // ── Score + Status row ──
  // Score circle
  const scoreCircleX = marginL + 30;
  const scoreCircleY = y + 24;
  doc.setDrawColor(meetsRequirements ? 34 : 220, meetsRequirements ? 197 : 38, meetsRequirements ? 94 : 38);
  doc.setLineWidth(2.5);
  doc.circle(scoreCircleX, scoreCircleY, 22, 'S');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.setTextColor(30, 30, 30);
  doc.text(`${score}`, scoreCircleX, scoreCircleY + 4, { align: 'center' });
  doc.setFontSize(7);
  doc.setTextColor(120, 120, 120);
  doc.text('/ 100', scoreCircleX, scoreCircleY + 14, { align: 'center' });

  // Status text next to score
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(meetsRequirements ? 22 : 180, meetsRequirements ? 130 : 30, meetsRequirements ? 60 : 30);
  doc.text(meetsRequirements ? 'QUALIFIED SITE' : 'REVIEW REQUIRED', marginL + 65, y + 18);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(100, 100, 100);
  doc.text(`${passedChecks} of ${checks.length} critical requirements met`, marginL + 65, y + 34);

  y += 58;

  // ── 6 Critical Metrics Dashboard ──
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(30, 30, 30);
  doc.text('6 Critical Requirements', marginL, y);
  y += 18;

  // Table header
  doc.setFillColor(240, 241, 243);
  doc.rect(marginL, y - 10, contentWidth, 18, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(80, 80, 80);
  doc.text('STATUS', marginL + 12, y + 1);
  doc.text('REQUIREMENT', marginL + 60, y + 1);
  doc.text('CURRENT VALUE', marginL + 210, y + 1);
  doc.text('MINIMUM', marginL + 340, y + 1);
  y += 18;

  // Table rows
  checks.forEach((check, index) => {
    if (index % 2 === 0) {
      doc.setFillColor(250, 250, 251);
      doc.rect(marginL, y - 11, contentWidth, 24, 'F');
    }

    // Badge
    doc.setFillColor(check.pass ? 34 : 220, check.pass ? 197 : 38, check.pass ? 94 : 38);
    doc.roundedRect(marginL + 6, y - 8, 34, 14, 2, 2, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(255, 255, 255);
    doc.text(check.pass ? 'PASS' : 'FAIL', marginL + 6 + 17, y + 2, { align: 'center' });

    // Label
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(35, 35, 35);
    doc.text(check.label, marginL + 60, y + 2);

    // Value
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(check.pass ? 35 : 180, check.pass ? 35 : 30, check.pass ? 35 : 30);
    doc.text(check.value, marginL + 210, y + 2);

    // Minimum
    doc.setTextColor(110, 110, 110);
    doc.text(check.requirement, marginL + 340, y + 2);

    y += 24;
  });

  // Bottom border of table
  doc.setDrawColor(210, 210, 210);
  doc.setLineWidth(0.5);
  doc.line(marginL, y - 11, marginR, y - 11);

  y += 16;

  // ── Property Summary (compact) ──
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(30, 30, 30);
  doc.text('Property Summary', marginL, y);
  y += 16;

  // 2×3 grid of key facts
  const colW = contentWidth / 2;
  const facts = [
    { label: 'Property Type', value: typeVal },
    { label: 'Zoning', value: zoningVal },
    { label: 'Size', value: sizeVal },
    { label: 'Power', value: powerStr },
    { label: 'Location', value: locationStr },
    { label: 'Coordinates', value: safe(submission.coordinates, 'Not provided') },
  ];

  facts.forEach((fact, i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const xPos = marginL + col * colW;
    const yPos = y + row * 22;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(110, 110, 110);
    doc.text(fact.label, xPos, yPos);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);
    doc.setTextColor(30, 30, 30);
    doc.text(fact.value, xPos, yPos + 12);
  });

  y += 3 * 22 + 20;

  // ── Infrastructure quick view ──
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(30, 30, 30);
  doc.text('Infrastructure', marginL, y);
  y += 16;

  const infraItems = [
    { label: 'Fiber', value: submission.fiberAvailable ? safe(submission.fiberProviders, 'Available') : 'Not available' },
    { label: 'Backup Power', value: submission.hasBackupPower ? 'Yes' : 'No' },
    { label: 'HVAC', value: submission.hvacInstalled ? 'Yes' : 'No' },
    { label: 'Flood Zone', value: submission.floodZone ? 'Yes — Risk' : 'No' },
    { label: 'Env. Clearance', value: safe(submission.environmentalClearance, 'Pending') },
    { label: 'Water Source', value: safe(submission.waterSource, 'Not specified') },
  ];

  infraItems.forEach((item, i) => {
    const col = i % 3;
    const row = Math.floor(i / 3);
    const xPos = marginL + col * (contentWidth / 3);
    const yPos = y + row * 22;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(110, 110, 110);
    doc.text(item.label, xPos, yPos);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(30, 30, 30);
    doc.text(item.value, xPos, yPos + 11);
  });

  drawFooter();

  // ══════════════════════════════════════
  // PAGE 2 — COVER LETTER
  // ══════════════════════════════════════
  doc.addPage();
  drawHeader();
  y = 88;

  // Date
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 100, 100);
  doc.text(new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }), marginR, y, { align: 'right' });

  // Recipient
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(30, 30, 30);
  const displayName = recipientName || 'Prospective Partner';
  doc.text(displayName, marginL, y);
  if (recipientCompany) {
    y += 14;
    doc.text(recipientCompany, marginL, y);
  }

  y += 32;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(30, 30, 30);
  doc.text('RE: Data Center Development Opportunity', marginL, y);

  y += 28;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  const firstName = recipientName ? recipientName.split(' ')[0] : 'Partner';
  doc.text(`Dear ${firstName},`, marginL, y);

  y += 24;
  doc.setFontSize(10);
  doc.setTextColor(50, 50, 50);
  const introText = customMessage ||
    'We are pleased to present an exceptional property opportunity for data center development. This location offers significant strategic advantages for infrastructure expansion.';
  const introLines = doc.splitTextToSize(introText, contentWidth);
  doc.text(introLines, marginL, y);
  y += introLines.length * 14 + 24;

  // Compact property details
  doc.setFillColor(248, 249, 250);
  doc.setDrawColor(215, 215, 215);
  doc.setLineWidth(0.75);
  const boxY = y;
  const boxH = 150;
  doc.roundedRect(marginL, boxY, contentWidth, boxH, 4, 4, 'FD');

  doc.setFillColor(240, 240, 240);
  doc.roundedRect(marginL, boxY, contentWidth, 26, 4, 4, 'F');
  doc.setFillColor(240, 240, 240);
  doc.rect(marginL, boxY + 18, contentWidth, 8, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(60, 60, 60);
  doc.text('PROPERTY DETAILS', marginL + 16, boxY + 17);

  let rowY = boxY + 40;
  const rowSpacing = 18;
  drawRow('Property', safe(submission.propertyName, 'Property Opportunity'), rowY, { bold: true });
  rowY += rowSpacing;
  drawRow('Location', locationStr, rowY);
  rowY += rowSpacing;
  drawRow('Size', sizeVal, rowY);
  rowY += rowSpacing;
  drawRow('Power', powerStr, rowY);
  rowY += rowSpacing;
  drawRow('Zoning', zoningVal, rowY);
  rowY += rowSpacing;
  drawRow('Type', typeVal, rowY);

  y = boxY + boxH + 24;

  // Next Steps
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(30, 30, 30);
  doc.text('Next Steps', marginL, y);
  y += 18;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(50, 50, 50);
  const nextStepsText = 'If you are interested in this opportunity, please contact us using the information below. Our team is ready to provide additional details, arrange site visits, and discuss next steps.';
  const nextLines = doc.splitTextToSize(nextStepsText, contentWidth);
  doc.text(nextLines, marginL, y);
  y += nextLines.length * 14 + 18;

  doc.text('We appreciate your consideration of this opportunity.', marginL, y);

  y += 34;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(30, 30, 30);
  doc.text('Nelinia Varenas', marginL, y);
  y += 14;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(80, 80, 80);
  doc.text('Chief Executive Officer', marginL, y);
  y += 13;
  doc.text('Strategic Value Plus, Inc.', marginL, y);

  drawFooter();

  return doc;
}

function generateToken(submissionId: string): string {
  // Simple token generation - in production use crypto
  const timestamp = Date.now();
  return Buffer.from(`${submissionId}:${timestamp}`).toString('base64');
}
