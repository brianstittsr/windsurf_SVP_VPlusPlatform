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

  // ══════════════════════════════════════
  // PAGE 1 — LETTERHEAD
  // ══════════════════════════════════════

  // ── Header ──
  y = 48;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.setTextColor(30, 30, 30);
  doc.text('V+', marginL, y);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(50, 50, 50);
  doc.text('Strategic Value Plus', marginL + 40, y - 4);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(130, 130, 130);
  doc.text('Zenthium Data Center Division', marginL + 40, y + 10);

  // Separator under header
  y += 22;
  doc.setDrawColor(210, 210, 210);
  doc.setLineWidth(0.5);
  doc.line(marginL, y, marginR, y);

  // ── Date ──
  y += 28;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 100, 100);
  doc.text(new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }), marginR, y, { align: 'right' });

  // ── Recipient ──
  y += 8;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(30, 30, 30);
  const displayName = recipientName || 'Prospective Partner';
  doc.text(displayName, marginL, y);
  if (recipientCompany) {
    y += 14;
    doc.text(recipientCompany, marginL, y);
  }

  // ── Subject ──
  y += 32;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(30, 30, 30);
  doc.text('RE: Data Center Development Opportunity', marginL, y);

  // ── Salutation ──
  y += 30;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  const firstName = recipientName ? recipientName.split(' ')[0] : 'Partner';
  doc.text(`Dear ${firstName},`, marginL, y);

  // ── Body ──
  y += 24;
  doc.setFontSize(10);
  doc.setTextColor(50, 50, 50);
  const introText = customMessage ||
    'We are pleased to present an exceptional property opportunity for data center development. This location offers significant strategic advantages for infrastructure expansion.';
  const introLines = doc.splitTextToSize(introText, contentWidth);
  doc.text(introLines, marginL, y);
  y += introLines.length * 14 + 24;

  // ── Property Details Table ──
  // Build clean values
  const locationParts = [submission.city, submission.state].filter(Boolean);
  const locationStr = locationParts.length > 0 ? locationParts.join(', ') : 'Available upon request';
  const sizeVal = submission.squareFootage
    ? `${Number(submission.squareFootage).toLocaleString()} sq ft`
    : submission.acreage
      ? `${submission.acreage} acres`
      : 'Contact for details';
  const powerVal = Number(submission.powerCapacityMW || submission.powerAvailableMW || 0);
  const powerStr = powerVal > 0 ? `${powerVal} MW` : 'Contact for details';
  const zoningVal = safe(submission.zoning || submission.zoningClassification, 'Industrial');
  const typeVal = safe(submission.propertyType, 'Data Center Site');

  // Box
  const boxY = y;
  const boxH = 170;
  doc.setFillColor(248, 249, 250);
  doc.setDrawColor(215, 215, 215);
  doc.setLineWidth(0.75);
  doc.roundedRect(marginL, boxY, contentWidth, boxH, 4, 4, 'FD');

  // Title bar inside box
  doc.setFillColor(240, 240, 240);
  doc.roundedRect(marginL, boxY, contentWidth, 28, 4, 4, 'F');
  // Patch bottom corners of title bar so they're straight
  doc.setFillColor(240, 240, 240);
  doc.rect(marginL, boxY + 20, contentWidth, 8, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(60, 60, 60);
  doc.text('PROPERTY DETAILS', marginL + 16, boxY + 18);

  // Rows
  let rowY = boxY + 46;
  const rowSpacing = 20;

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

  y = boxY + boxH + 28;

  // ── Next Steps ──
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
  y += nextLines.length * 14 + 20;

  doc.setFontSize(10);
  doc.text('We appreciate your consideration of this opportunity.', marginL, y);

  // ── Signature ──
  y += 36;
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

  // ══════════════════════════════════════
  // PAGE 2 — REQUIREMENTS ANALYSIS
  // ══════════════════════════════════════
  doc.addPage();

  // ── Page 2 header ──
  y = 48;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.setTextColor(30, 30, 30);
  doc.text('V+', marginL, y);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(50, 50, 50);
  doc.text('Strategic Value Plus', marginL + 40, y - 4);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(130, 130, 130);
  doc.text('Zenthium Data Center Division', marginL + 40, y + 10);
  y += 22;
  doc.setDrawColor(210, 210, 210);
  doc.setLineWidth(0.5);
  doc.line(marginL, y, marginR, y);

  y += 30;

  // ── Title ──
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(30, 30, 30);
  doc.text('Zenthium Requirements Analysis', marginL, y);
  y += 12;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(120, 120, 120);
  doc.text(`Property: ${safe(submission.propertyName, 'Unnamed Property')}`, marginL, y);
  y += 28;

  // ── Compliance data ──
  const powerMW = Number(submission.powerCapacityMW || submission.powerAvailableMW || 0);
  const sqft = Number(submission.squareFootage || 0);
  const ceilingFt = Number(submission.ceilingHeightFt || 0);
  const waterAvail = submission.waterAvailable || false;
  const isSingleStory = submission.isSingleStory || false;
  const isFloor = submission.isFloor || false;

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

  // ── Summary banner ──
  const bannerH = 44;
  doc.setFillColor(meetsRequirements ? 243 : 254, meetsRequirements ? 250 : 242, meetsRequirements ? 244 : 242);
  doc.setDrawColor(meetsRequirements ? 34 : 220, meetsRequirements ? 197 : 38, meetsRequirements ? 94 : 38);
  doc.setLineWidth(1);
  doc.roundedRect(marginL, y, contentWidth, bannerH, 4, 4, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(meetsRequirements ? 22 : 180, meetsRequirements ? 130 : 30, meetsRequirements ? 60 : 30);
  const statusText = meetsRequirements ? 'MEETS ZENTHIUM REQUIREMENTS' : 'DOES NOT MEET REQUIREMENTS';
  doc.text(statusText, marginL + 16, y + 27);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(30, 30, 30);
  doc.text(`${score}`, marginR - 50, y + 24);
  doc.setFontSize(10);
  doc.setTextColor(130, 130, 130);
  doc.text('/ 100', marginR - 30, y + 24);

  y += bannerH + 28;

  // ── Requirements table ──
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(30, 30, 30);
  doc.text('Critical Requirements', marginL, y);
  y += 20;

  // Table header
  doc.setFillColor(245, 245, 245);
  doc.rect(marginL, y - 10, contentWidth, 16, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 100, 100);
  doc.text('STATUS', marginL + 10, y);
  doc.text('REQUIREMENT', marginL + 55, y);
  doc.text('CURRENT VALUE', marginL + 200, y);
  doc.text('MINIMUM', marginL + 330, y);
  y += 16;

  // Table rows
  checks.forEach((check, index) => {
    // Alternate row background
    if (index % 2 === 0) {
      doc.setFillColor(251, 251, 251);
      doc.rect(marginL, y - 10, contentWidth, 22, 'F');
    }

    // Status badge
    const badgeW = 32;
    const badgeH = 13;
    doc.setFillColor(check.pass ? 34 : 220, check.pass ? 197 : 38, check.pass ? 94 : 38);
    doc.roundedRect(marginL + 4, y - 8, badgeW, badgeH, 2, 2, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(255, 255, 255);
    doc.text(check.pass ? 'PASS' : 'FAIL', marginL + 4 + badgeW / 2, y + 1, { align: 'center' });

    // Requirement name
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(40, 40, 40);
    doc.text(check.label, marginL + 55, y + 1);

    // Current value
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(check.pass ? 40 : 180, check.pass ? 40 : 30, check.pass ? 40 : 30);
    doc.text(check.value, marginL + 200, y + 1);

    // Minimum required
    doc.setTextColor(100, 100, 100);
    doc.text(check.requirement, marginL + 330, y + 1);

    y += 22;
  });

  y += 16;

  // ── Location ──
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(30, 30, 30);
  doc.text('Property Location', marginL, y);
  y += 18;

  doc.setFillColor(248, 249, 250);
  doc.setDrawColor(215, 215, 215);
  doc.setLineWidth(0.5);
  doc.roundedRect(marginL, y, contentWidth, 70, 4, 4, 'FD');

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(50, 50, 50);

  const addrParts = [submission.address, submission.city, submission.state, submission.zip].filter(Boolean);
  const fullAddress = addrParts.length > 0 ? addrParts.join(', ') : 'Address available upon request';
  doc.text(fullAddress, marginL + 14, y + 22);

  if (submission.coordinates) {
    doc.setTextColor(100, 100, 100);
    doc.text(`Coordinates: ${submission.coordinates}`, marginL + 14, y + 38);
  }

  doc.setFontSize(8);
  doc.setTextColor(80, 130, 180);
  doc.text('View on OpenStreetMap', marginL + 14, y + 56);

  y += 90;

  // ── Infrastructure ──
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(30, 30, 30);
  doc.text('Infrastructure Details', marginL, y);
  y += 18;

  const infraItems = [
    { label: 'Ceiling Height', value: ceilingFt > 0 ? `${ceilingFt} ft` : 'Not specified' },
    { label: 'Fiber Connectivity', value: submission.fiberAvailable ? safe(submission.fiberProviders, 'Available') : 'Not available' },
    { label: 'Backup Power', value: submission.hasBackupPower ? 'Yes' : 'No' },
    { label: 'HVAC Installed', value: submission.hvacInstalled ? 'Yes' : 'No' },
    { label: 'Flood Zone', value: submission.floodZone ? 'Yes — Risk' : 'No' },
    { label: 'Environmental Clearance', value: safe(submission.environmentalClearance, 'Pending review') },
  ];

  // Two-column layout
  const colWidth = contentWidth / 2;
  infraItems.forEach((item, index) => {
    const col = index % 2;
    const row = Math.floor(index / 2);
    const xPos = marginL + col * colWidth;
    const yPos = y + row * 20;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(100, 100, 100);
    doc.text(item.label + ':', xPos, yPos);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(40, 40, 40);
    doc.text(item.value, xPos + 110, yPos);
  });

  drawFooter();

  return doc;
}

function generateToken(submissionId: string): string {
  // Simple token generation - in production use crypto
  const timestamp = Date.now();
  return Buffer.from(`${submissionId}:${timestamp}`).toString('base64');
}
