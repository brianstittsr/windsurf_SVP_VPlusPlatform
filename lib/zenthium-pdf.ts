/**
 * PDF Generation for Zenthium Property Submissions
 * Professional layout with compliance summary and visual indicators
 */

import { jsPDF } from "jspdf";
import { evaluateSite, PropertyEvaluationData } from "./zenthium-evaluation";

export interface PropertyPDFData {
  propertyName: string;
  propertyType: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  coordinates?: string;
  squareFootage?: number;
  acreage?: number;
  zoningClassification?: string;
  powerAvailableMW?: number;
  powerType?: string;
  ceilingHeightFt?: number;
  fiberAvailable: boolean;
  fiberProviders?: string;
  waterAvailable: boolean;
  waterSource?: string;
  coolingCapacity?: string;
  environmentalClearance?: string;
  ownershipType?: string;
  askingPrice?: string;
  leaseRate?: string;
  timeline?: string;
  description?: string;
  submitterName: string;
  submitterEmail: string;
  submitterPhone: string;
  submitterCompany: string;
  directContactName?: string;
  directContactEmail?: string;
  directContactPhone?: string;
  directContactCompany?: string;
  // Additional fields
  isSingleStory?: boolean;
  isFloor?: boolean;
  floodZone?: boolean;
  hasBackupPower?: boolean;
  hvacInstalled?: boolean;
}

// Helper function to check page break
function checkPageBreak(doc: jsPDF, y: number, neededSpace: number = 50): number {
  if (y + neededSpace > 270) {
    doc.addPage();
    return 20;
  }
  return y;
}

// Draw section header
function drawSectionHeader(doc: jsPDF, title: string, y: number, color: [number, number, number] = [249, 115, 22]): number {
  // Background bar
  doc.setFillColor(color[0], color[1], color[2]);
  doc.rect(15, y - 6, 180, 12, "F");
  
  // Title
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text(title, 20, y);
  
  doc.setTextColor(0, 0, 0);
  return y + 15;
}

// Draw compliance badge
function drawComplianceBadge(doc: jsPDF, label: string, value: string, pass: boolean, y: number): number {
  // Label
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(80, 80, 80);
  doc.text(label, 20, y);
  
  // Badge background
  const badgeWidth = pass ? 35 : 40;
  doc.setFillColor(pass ? 34 : 220, pass ? 197 : 38, pass ? 94 : 38);
  doc.roundedRect(130, y - 5, badgeWidth, 10, 2, 2, "F");
  
  // Badge text
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.text(pass ? "PASS" : "FAIL", 135, y);
  
  // Value
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text(value, 60, y);
  
  return y + 12;
}

// Draw info row
function drawInfoRow(doc: jsPDF, label: string, value: string, y: number, indent: number = 20): number {
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(80, 80, 80);
  doc.text(label, indent, y);
  
  doc.setFont("helvetica", "normal");
  doc.setTextColor(0, 0, 0);
  const splitValue = doc.splitTextToSize(value || "N/A", 120);
  doc.text(splitValue, indent + 50, y);
  
  return y + (splitValue.length * 5) + 3;
}

export async function generatePropertyPDF(data: PropertyPDFData): Promise<jsPDF> {
  const doc = new jsPDF();
  let y = 15;

  // Evaluate site compliance
  const evaluationData: PropertyEvaluationData = {
    squareFootage: data.squareFootage,
    powerAvailableMW: data.powerAvailableMW,
    ceilingHeightFt: data.ceilingHeightFt,
    isSingleStory: data.isSingleStory ?? false,
    isFloor: data.isFloor ?? false,
    propertyType: data.propertyType,
    waterAvailable: data.waterAvailable,
    waterSource: data.waterSource,
    fiberAvailable: data.fiberAvailable,
    fiberProviders: data.fiberProviders,
    zoningClassification: data.zoningClassification,
    environmentalClearance: data.environmentalClearance,
    floodZone: data.floodZone ?? false,
  };
  
  const evaluation = evaluateSite(evaluationData);

  // HEADER - Orange background with V+ logo
  doc.setFillColor(249, 115, 22);
  doc.rect(0, 0, 210, 35, "F");
  
  // V+ Logo
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(28);
  doc.setFont("helvetica", "bold");
  doc.text("V+", 15, 23);
  
  doc.setFontSize(14);
  doc.setFont("helvetica", "normal");
  doc.text("Zenthium Property Submission", 35, 23);
  
  // Date on right
  doc.setFontSize(9);
  doc.text(new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }), 195, 23, { align: "right" });

  y = 45;

  // PROPERTY NAME
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  const propertyTitle = data.propertyName || "Property Submission";
  const splitTitle = doc.splitTextToSize(propertyTitle, 180);
  doc.text(splitTitle, 15, y);
  y += (splitTitle.length * 8) + 5;

  // COMPLIANCE SUMMARY BOX
  const meetsRequirements = evaluation.meetsRequirements;
  
  // Box background
  doc.setFillColor(meetsRequirements ? 240 : 255, meetsRequirements ? 248 : 240, meetsRequirements ? 240 : 240);
  doc.setDrawColor(meetsRequirements ? 34 : 220, meetsRequirements ? 197 : 38, meetsRequirements ? 94 : 38);
  doc.setLineWidth(2);
  doc.roundedRect(15, y, 180, 45, 5, 5, "FD");
  
  // Compliance status
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(meetsRequirements ? 34 : 180, meetsRequirements ? 150 : 38, meetsRequirements ? 94 : 38);
  doc.text(meetsRequirements ? "✓ MEETS ZENTHIUM REQUIREMENTS" : "✗ DOES NOT MEET REQUIREMENTS", 25, y + 12);
  
  // Score
  doc.setFontSize(24);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(0, 0, 0);
  doc.text(`${evaluation.score}/100`, 165, y + 12, { align: "center" });
  
  // Summary text
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(80, 80, 80);
  const summaryLines = doc.splitTextToSize(evaluation.summary, 155);
  doc.text(summaryLines, 25, y + 22);
  
  y += 55;

  // LOCATION MAP SECTION
  y = checkPageBreak(doc, y, 80);
  y = drawSectionHeader(doc, "LOCATION MAP", y);
  
  // Parse coordinates if available
  let lat = 0;
  let lon = 0;
  let hasCoords = false;
  
  if (data.coordinates) {
    const coords = data.coordinates.split(',').map(c => parseFloat(c.trim()));
    if (coords.length === 2 && !isNaN(coords[0]) && !isNaN(coords[1])) {
      lat = coords[0];
      lon = coords[1];
      hasCoords = true;
    }
  }
  
  // Use OpenStreetMap static tiles (no API key required)
  if (hasCoords) {
    // Add placeholder for map with OpenStreetMap reference
    doc.setFillColor(240, 248, 255);
    doc.setDrawColor(100, 149, 237);
    doc.roundedRect(15, y, 180, 60, 3, 3, "FD");
    
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(0, 0, 0);
    doc.text("📍 Location Map", 25, y + 15);
    
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(50, 50, 50);
    doc.text(`Lat: ${lat.toFixed(4)}, Lon: ${lon.toFixed(4)}`, 25, y + 30);
    
    doc.setFontSize(9);
    doc.setFont("helvetica", "italic");
    doc.setTextColor(100, 100, 100);
    doc.text("OpenStreetMap integration", 25, y + 45);
    
    // OpenStreetMap link
    y += 68;
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(0, 0, 255);
    const osmUrl = `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lon}&zoom=15`;
    doc.text("View on OpenStreetMap: " + osmUrl, 15, y, { maxWidth: 180 });
    doc.setTextColor(0, 0, 0);
    y += 10;
  } else {
    // No coordinates - show text-based location info
    y = drawInfoRow(doc, "Full Address", `${data.address || ""}, ${data.city || ""}, ${data.state || ""} ${data.zip || ""}`, y, 20);
    if (data.coordinates) {
      y = drawInfoRow(doc, "Coordinates", data.coordinates, y, 20);
    }
    
    // OpenStreetMap search link
    const searchQuery = `${data.address || ""} ${data.city || ""} ${data.state || ""} ${data.zip || ""}`.trim();
    doc.setFontSize(8);
    doc.setTextColor(0, 0, 255);
    const osmSearchUrl = searchQuery 
      ? `https://www.openstreetmap.org/search?query=${encodeURIComponent(searchQuery)}`
      : `https://www.openstreetmap.org`;
    doc.text("View on OpenStreetMap: " + osmSearchUrl, 20, y, { maxWidth: 170 });
    doc.setTextColor(0, 0, 0);
    y += 10;
  }

  // PROPERTY DETAILS SECTION
  y = checkPageBreak(doc, y, 60);
  y = drawSectionHeader(doc, "PROPERTY DETAILS", y);
  
  y = drawInfoRow(doc, "Property Type", data.propertyType || "Not provided", y);
  y = drawInfoRow(doc, "Square Footage", data.squareFootage ? `${data.squareFootage.toLocaleString()} sq ft` : "Not provided", y);
  y = drawInfoRow(doc, "Acreage", data.acreage ? `${data.acreage} acres` : "Not provided", y);
  y = drawInfoRow(doc, "Zoning", data.zoningClassification || "Not provided", y);

  // REQUIREMENTS COMPLIANCE SECTION
  y = checkPageBreak(doc, y, 120);
  y = drawSectionHeader(doc, "REQUIREMENTS COMPLIANCE", y);
  
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(249, 115, 22);
  doc.text("REQUIRED CRITERIA", 20, y);
  y += 8;
  
  // Required requirements with pass/fail
  const reqSqft = evaluationData.squareFootage || 0;
  const reqPower = evaluationData.powerAvailableMW || 0;
  const reqHeight = evaluationData.ceilingHeightFt || 0;
  
  y = drawComplianceBadge(doc, "Square Footage", reqSqft >= 10000 ? `${reqSqft.toLocaleString()} sq ft` : `${reqSqft.toLocaleString()} sq ft (Need 10,000+)`, reqSqft >= 10000, y);
  y = drawComplianceBadge(doc, "Power Capacity", reqPower >= 20 ? `${reqPower} MW` : `${reqPower} MW (Need 20+)`, reqPower >= 20, y);
  y = drawComplianceBadge(doc, "Ceiling Height", reqHeight >= 18 ? `${reqHeight} ft` : `${reqHeight} ft (Need 18+)`, reqHeight >= 18, y);
  y = drawComplianceBadge(doc, "Single Story", data.isSingleStory ? "Yes" : "No", data.isSingleStory ?? false, y);
  y = drawComplianceBadge(doc, "Flat Floor", data.isFloor ? "Yes" : "No", data.isFloor ?? false, y);
  y = drawComplianceBadge(doc, "Water Access", data.waterAvailable ? (data.waterSource || "Yes") : "No", data.waterAvailable, y);
  
  y += 5;
  
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(100, 100, 100);
  doc.text("PREFERRED CRITERIA", 20, y);
  y += 8;
  
  // Preferred requirements
  y = drawComplianceBadge(doc, "Fiber Connectivity", data.fiberAvailable ? (data.fiberProviders || "Yes") : "No", data.fiberAvailable, y);
  y = drawComplianceBadge(doc, "Not in Flood Zone", data.floodZone ? "In flood zone" : "Not in flood zone", !data.floodZone, y);

  // INFRASTRUCTURE DETAILS SECTION
  y = checkPageBreak(doc, y, 80);
  y = drawSectionHeader(doc, "INFRASTRUCTURE DETAILS", y);
  
  // Power details
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(249, 115, 22);
  doc.text("POWER", 20, y);
  y += 8;
  
  y = drawInfoRow(doc, "Available Power", data.powerAvailableMW ? `${data.powerAvailableMW} MW` : "Not specified", y);
  y = drawInfoRow(doc, "Power Type", data.powerType || "Not specified", y);
  y = drawInfoRow(doc, "Backup Power", data.hasBackupPower ? "Yes" : "No", y);
  y = drawInfoRow(doc, "Zenthium Minimum", "20+ MW (Required)", y);
  
  y += 5;
  
  // Water details
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(249, 115, 22);
  doc.text("WATER & COOLING", 20, y);
  y += 8;
  
  y = drawInfoRow(doc, "Water Access", data.waterAvailable ? (data.waterSource || "Yes") : "No", y);
  y = drawInfoRow(doc, "Water Source", data.waterSource || "Not specified", y);
  y = drawInfoRow(doc, "Cooling Capacity", data.coolingCapacity || "Not specified", y);
  y = drawInfoRow(doc, "HVAC Installed", data.hvacInstalled ? "Yes" : "No", y);
  y = drawInfoRow(doc, "Zenthium Requirement", "Water access for cooling (Required)", y);
  
  y += 5;
  
  // Connectivity
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(249, 115, 22);
  doc.text("CONNECTIVITY", 20, y);
  y += 8;
  
  y = drawInfoRow(doc, "Fiber Available", data.fiberAvailable ? "Yes" : "No", y);
  y = drawInfoRow(doc, "Fiber Providers", data.fiberProviders || "Not specified", y);

  // OWNERSHIP & FINANCIALS
  y = checkPageBreak(doc, y, 50);
  y = drawSectionHeader(doc, "OWNERSHIP & FINANCIALS", y);
  
  y = drawInfoRow(doc, "Ownership Type", data.ownershipType || "Not specified", y);
  y = drawInfoRow(doc, "Asking Price", data.askingPrice || "Not specified", y);
  y = drawInfoRow(doc, "Lease Rate", data.leaseRate || "Not specified", y);
  y = drawInfoRow(doc, "Timeline", data.timeline || "Not specified", y);
  y = drawInfoRow(doc, "Environmental", data.environmentalClearance || "Not specified", y);

  // DESCRIPTION
  if (data.description) {
    y = checkPageBreak(doc, y, 60);
    y = drawSectionHeader(doc, "DESCRIPTION", y);
    
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(0, 0, 0);
    const splitDesc = doc.splitTextToSize(data.description, 170);
    doc.text(splitDesc, 20, y);
    y += (splitDesc.length * 5) + 10;
  }

  // CONTACTS ON NEW PAGE
  doc.addPage();
  y = 20;
  
  y = drawSectionHeader(doc, "CONTACT INFORMATION", y);
  
  // Submitter
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(249, 115, 22);
  doc.text("SUBMITTER", 20, y);
  y += 10;
  
  y = drawInfoRow(doc, "Name", data.submitterName, y);
  y = drawInfoRow(doc, "Company", data.submitterCompany, y);
  y = drawInfoRow(doc, "Email", data.submitterEmail, y);
  y = drawInfoRow(doc, "Phone", data.submitterPhone, y);
  
  y += 10;
  
  // Direct Contact
  if (data.directContactName) {
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(249, 115, 22);
    doc.text("DIRECT CONTACT", 20, y);
    y += 10;
    
    y = drawInfoRow(doc, "Name", data.directContactName, y);
    y = drawInfoRow(doc, "Company", data.directContactCompany || "", y);
    y = drawInfoRow(doc, "Email", data.directContactEmail || "", y);
    y = drawInfoRow(doc, "Phone", data.directContactPhone || "", y);
  }

  // FOOTER on all pages
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    
    // Footer line
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.5);
    doc.line(15, 280, 195, 280);
    
    // Footer text
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(128, 128, 128);
    doc.text("V+ | Strategic Value+ | Zenthium Property Submission", 105, 288, { align: "center" });
    doc.text(`Page ${i} of ${pageCount}`, 105, 293, { align: "center" });
  }

  return doc;
}

export async function downloadPropertyPDF(data: PropertyPDFData, filename?: string) {
  const doc = await generatePropertyPDF(data);
  const defaultFilename = `zenthium-${data.propertyName?.replace(/[^a-z0-9]/gi, "_").toLowerCase() || "property"}-${Date.now()}.pdf`;
  doc.save(filename || defaultFilename);
}
