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
  const margin = 50;
  let y = 0;

  // Colors
  const orangeColor = [249, 115, 22];
  const goldColor = [255, 193, 7];
  const darkColor = [40, 40, 40];
  const grayColor = [100, 100, 100];

  // === HEADER ===
  doc.setFillColor(orangeColor[0], orangeColor[1], orangeColor[2]);
  doc.rect(0, 0, pageWidth, 70, 'F');
  
  // V+ Logo
  doc.setTextColor(goldColor[0], goldColor[1], goldColor[2]);
  doc.setFontSize(32);
  doc.setFont('helvetica', 'bold');
  doc.text('V+', margin, 45);

  // Company Name
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('Strategic Value Plus', margin + 60, 35);

  // Subtitle
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Zenthium Data Center Division', margin + 60, 50);

  y = 90;

  // Date
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(grayColor[0], grayColor[1], grayColor[2]);
  doc.text(new Date().toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  }), pageWidth - margin, y, { align: 'right' });

  y += 30;

  // Recipient
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
  doc.text('TO:', margin, y);
  
  doc.setFont('helvetica', 'normal');
  const recipientText = recipientName || 'Prospective Partner';
  doc.text(recipientText, margin + 30, y);
  y += 14;
  
  if (recipientCompany) {
    doc.text(recipientCompany, margin + 30, y);
    y += 14;
  }
  
  y += 20;

  // Subject Line
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(orangeColor[0], orangeColor[1], orangeColor[2]);
  doc.text('RE: Data Center Development Opportunity', margin, y);
  
  y += 25;

  // Salutation
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
  const salutation = recipientName ? `Dear ${recipientName.split(' ')[0]},` : 'Dear Partner,';
  doc.text(salutation, margin, y);

  y += 25;

  // Body - Introduction
  doc.setFontSize(9);
  const introText = customMessage || 
    `We are pleased to present an exceptional property opportunity for data center development. This location offers significant strategic advantages for infrastructure expansion.`;
  
  const introLines = doc.splitTextToSize(introText, pageWidth - (margin * 2));
  doc.text(introLines, margin, y);
  y += (introLines.length * 12) + 20;

  // Property Details Box
  doc.setFillColor(250, 250, 250);
  doc.setDrawColor(orangeColor[0], orangeColor[1], orangeColor[2]);
  doc.setLineWidth(1);
  doc.roundedRect(margin, y, pageWidth - (margin * 2), 160, 5, 5, 'FD');
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(orangeColor[0], orangeColor[1], orangeColor[2]);
  doc.text('PROPERTY DETAILS', margin + 10, y + 20);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);

  let detailY = y + 40;
  const labelX = margin + 10;
  const valueX = margin + 100;
  
  // Property Name
  doc.setFont('helvetica', 'bold');
  doc.text('Property:', labelX, detailY);
  doc.setFont('helvetica', 'normal');
  const propertyName = submission.propertyName || 'Property Opportunity';
  doc.text(propertyName, valueX, detailY);
  detailY += 15;

  // Address
  doc.setFont('helvetica', 'bold');
  doc.text('Location:', labelX, detailY);
  doc.setFont('helvetica', 'normal');
  const address = submission.address ? 
    `${submission.city || ''}, ${submission.state || ''}` : 
    'Available upon request';
  doc.text(address, valueX, detailY);
  detailY += 15;

  // Size
  doc.setFont('helvetica', 'bold');
  doc.text('Size:', labelX, detailY);
  doc.setFont('helvetica', 'normal');
  const size = submission.squareFootage ? 
    `${Number(submission.squareFootage).toLocaleString()} sq ft` : 
    (submission.acreage ? `${submission.acreage} acres` : 'Contact for details');
  doc.text(size, valueX, detailY);
  detailY += 15;

  // Power
  doc.setFont('helvetica', 'bold');
  doc.text('Power:', labelX, detailY);
  doc.setFont('helvetica', 'normal');
  const power = submission.powerCapacityMW || submission.powerAvailableMW || 'Available';
  doc.text(`${power} MW`, valueX, detailY);
  detailY += 15;

  // Zoning
  doc.setFont('helvetica', 'bold');
  doc.text('Zoning:', labelX, detailY);
  doc.setFont('helvetica', 'normal');
  const zoning = submission.zoning || submission.zoningClassification || 'Industrial';
  doc.text(zoning, valueX, detailY);
  detailY += 15;

  // Property Type
  doc.setFont('helvetica', 'bold');
  doc.text('Type:', labelX, detailY);
  doc.setFont('helvetica', 'normal');
  const propType = submission.propertyType || 'Data Center Site';
  doc.text(propType, valueX, detailY);

  y += 170;

  // Next Steps
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(orangeColor[0], orangeColor[1], orangeColor[2]);
  doc.text('NEXT STEPS', margin, y);

  y += 20;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
  const responseText = 'If you are interested in this opportunity, please contact us using the information below. Our team is ready to provide additional details, arrange site visits, and discuss next steps.';
  const responseLines = doc.splitTextToSize(responseText, pageWidth - (margin * 2));
  doc.text(responseLines, margin, y);
  y += (responseLines.length * 12) + 20;

  // Closing
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text('We appreciate your consideration of this opportunity.', margin, y);

  y += 30;

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

  // === PAGE 2: DETAILED ANALYSIS ===
  doc.addPage();
  y = margin;

  // Requirements Analysis Section
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(orangeColor[0], orangeColor[1], orangeColor[2]);
  doc.text('ZENTHIUM REQUIREMENTS ANALYSIS', margin, y);
  y += 25;

  // Calculate compliance
  const powerMW = Number(submission.powerCapacityMW || submission.powerAvailableMW || 0);
  const sqft = Number(submission.squareFootage || 0);
  const ceilingFt = Number(submission.ceilingHeightFt || 0);
  const waterAvail = submission.waterAvailable || false;
  const isSingleStory = submission.isSingleStory || false;
  const isFloor = submission.isFloor || false;

  const powerPass = powerMW >= 20;
  const sizePass = sqft >= 10000;
  const ceilingPass = ceilingFt >= 18;
  const waterPass = waterAvail;
  const storyPass = isSingleStory;
  const floorPass = isFloor;

  const totalChecks = 6;
  const passedChecks = [powerPass, sizePass, ceilingPass, waterPass, storyPass, floorPass].filter(Boolean).length;
  const score = Math.round((passedChecks / totalChecks) * 100);
  const meetsRequirements = passedChecks >= 4; // Need at least 4 of 6

  // Compliance Summary Box
  doc.setFillColor(meetsRequirements ? 240 : 255, meetsRequirements ? 253 : 245, meetsRequirements ? 244 : 245);
  doc.setDrawColor(meetsRequirements ? 34 : 220, meetsRequirements ? 197 : 38, meetsRequirements ? 94 : 38);
  doc.setLineWidth(2);
  doc.roundedRect(margin, y, pageWidth - (margin * 2), 50, 5, 5, 'FD');

  doc.setTextColor(meetsRequirements ? 34 : 180, meetsRequirements ? 150 : 38, meetsRequirements ? 94 : 38);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text(meetsRequirements ? '✓ MEETS ZENTHIUM REQUIREMENTS' : '✗ DOES NOT MEET REQUIREMENTS', margin + 15, y + 20);

  doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
  doc.setFontSize(20);
  doc.text(`${score}/100`, pageWidth - margin - 50, y + 25, { align: 'center' });

  y += 60;

  // Requirements Checklist
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(orangeColor[0], orangeColor[1], orangeColor[2]);
  doc.text('REQUIRED CRITERIA', margin, y);
  y += 20;

  const drawRequirement = (label: string, value: string, pass: boolean, yPos: number) => {
    // Badge
    doc.setFillColor(pass ? 34 : 220, pass ? 197 : 38, pass ? 94 : 38);
    doc.roundedRect(margin, yPos - 8, 30, 12, 2, 2, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text(pass ? 'PASS' : 'FAIL', margin + 15, yPos, { align: 'center' });

    // Label and value
    doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text(label, margin + 40, yPos);
    doc.setFont('helvetica', 'normal');
    doc.text(value, margin + 150, yPos);
  };

  drawRequirement('Power Capacity', powerMW > 0 ? `${powerMW} MW (Need 20+)` : 'Not specified', powerPass, y);
  y += 18;
  drawRequirement('Property Size', sqft > 0 ? `${sqft.toLocaleString()} sq ft (Need 10,000+)` : 'Not specified', sizePass, y);
  y += 18;
  drawRequirement('Ceiling Height', ceilingFt > 0 ? `${ceilingFt} ft (Need 18+)` : 'Not specified', ceilingPass, y);
  y += 18;
  drawRequirement('Water Access', waterAvail ? 'Available' : 'Not confirmed', waterPass, y);
  y += 18;
  drawRequirement('Single Story', isSingleStory ? 'Yes' : 'No', storyPass, y);
  y += 18;
  drawRequirement('Flat Floor', isFloor ? 'Yes' : 'No', floorPass, y);
  y += 30;

  // Location Map Section
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(orangeColor[0], orangeColor[1], orangeColor[2]);
  doc.text('PROPERTY LOCATION', margin, y);
  y += 20;

  // Map placeholder
  doc.setFillColor(240, 248, 255);
  doc.setDrawColor(100, 149, 237);
  doc.roundedRect(margin, y, pageWidth - (margin * 2), 80, 5, 5, 'FD');

  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
  doc.text('📍 Location Map', margin + 10, y + 20);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  const fullAddress = submission.address ? 
    `${submission.address}, ${submission.city || ''}, ${submission.state || ''} ${submission.zip || ''}` : 
    `${submission.city || ''}, ${submission.state || ''}`;
  doc.text(fullAddress, margin + 10, y + 40);

  if (submission.coordinates) {
    doc.text(`Coordinates: ${submission.coordinates}`, margin + 10, y + 55);
  }

  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  doc.text('View on OpenStreetMap: openstreetmap.org', margin + 10, y + 70);

  y += 90;

  // Infrastructure Details
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(orangeColor[0], orangeColor[1], orangeColor[2]);
  doc.text('INFRASTRUCTURE DETAILS', margin, y);
  y += 20;

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);

  const infraDetails = [
    { label: 'Ceiling Height', value: ceilingFt > 0 ? `${ceilingFt} ft` : 'Not specified' },
    { label: 'Fiber Connectivity', value: submission.fiberAvailable ? (submission.fiberProviders || 'Yes') : 'No' },
    { label: 'Backup Power', value: submission.hasBackupPower ? 'Yes' : 'No' },
    { label: 'HVAC Installed', value: submission.hvacInstalled ? 'Yes' : 'No' },
    { label: 'Flood Zone', value: submission.floodZone ? 'Yes' : 'No' },
    { label: 'Environmental', value: submission.environmentalClearance || 'Not specified' },
  ];

  infraDetails.forEach(detail => {
    doc.setFont('helvetica', 'bold');
    doc.text(`${detail.label}:`, margin, y);
    doc.setFont('helvetica', 'normal');
    doc.text(detail.value, margin + 120, y);
    y += 14;
  });

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
