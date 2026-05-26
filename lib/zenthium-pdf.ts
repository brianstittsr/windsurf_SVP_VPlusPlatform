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

// Draw section header with icon
function drawSectionHeader(doc: jsPDF, title: string, y: number, color: [number, number, number] = [249, 115, 22], icon?: string): number {
  // Left accent bar
  doc.setFillColor(color[0], color[1], color[2]);
  doc.rect(15, y - 6, 4, 12, "F");
  
  // Background with subtle fill
  doc.setFillColor(250, 250, 250);
  doc.rect(19, y - 6, 176, 12, "F");
  
  // Border
  doc.setDrawColor(color[0], color[1], color[2]);
  doc.setLineWidth(0.5);
  doc.rect(15, y - 6, 180, 12, "S");
  
  // Icon (if provided)
  if (icon) {
    doc.setTextColor(color[0], color[1], color[2]);
    doc.setFontSize(12);
    doc.text(icon, 23, y + 1);
  }
  
  // Title
  doc.setTextColor(color[0], color[1], color[2]);
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text(title, icon ? 32 : 23, y + 1);
  
  doc.setTextColor(0, 0, 0);
  return y + 18;
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
function drawInfoRow(doc: jsPDF, label: string, value: unknown, y: number, indent: number = 20): number {
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(80, 80, 80);
  doc.text(label, indent, y);
  
  doc.setFont("helvetica", "normal");
  doc.setTextColor(0, 0, 0);
  
  // Convert value to string safely
  let stringValue: string;
  if (value === null || value === undefined) {
    stringValue = "N/A";
  } else if (typeof value === "object") {
    // If it's an object with a label or name property, use that
    if (value && typeof value === "object" && "label" in value) {
      stringValue = String((value as { label: unknown }).label);
    } else if (value && typeof value === "object" && "name" in value) {
      stringValue = String((value as { name: unknown }).name);
    } else if (value && typeof value === "object" && "value" in value) {
      stringValue = String((value as { value: unknown }).value);
    } else {
      stringValue = "[Invalid Data]";
    }
  } else {
    stringValue = String(value);
  }
  
  const splitValue = doc.splitTextToSize(stringValue || "N/A", 120);
  doc.text(splitValue, indent + 50, y);
  
  return y + (splitValue.length * 5) + 3;
}

export async function generatePropertyPDF(data: PropertyPDFData): Promise<jsPDF> {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  let y = 0;

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
  const meetsRequirements = evaluation.meetsRequirements;
  const score = evaluation.score;

  // === PAGE 1: HERO SECTION (Minimal Light Theme) ===
  
  // White background
  doc.setFillColor(255, 255, 255);
  doc.rect(0, 0, pageWidth, pageHeight, "F");
  
  // Thin top border (subtle accent)
  doc.setDrawColor(230, 230, 230);
  doc.setLineWidth(0.5);
  doc.line(0, 0, pageWidth, 0);
  
  // V+ Logo (minimal, dark gray)
  doc.setTextColor(60, 60, 60);
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.text("V+", 15, 25);
  
  // Company name (light gray, smaller)
  doc.setTextColor(120, 120, 120);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text("Strategic Value Plus", 40, 20);
  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  doc.text("Zenthium Data Center Division", 40, 28);
  
  y = 50;
  
  // Qualification Badge (minimal outline)
  const badgeColor = meetsRequirements ? [34, 197, 94] : [239, 68, 68];
  doc.setDrawColor(badgeColor[0], badgeColor[1], badgeColor[2]);
  doc.setLineWidth(1);
  doc.roundedRect(pageWidth / 2 - 35, y, 70, 10, 2, 2, "S");
  doc.setTextColor(badgeColor[0], badgeColor[1], badgeColor[2]);
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  const badgeText = meetsRequirements ? "✓ QUALIFIED" : "REVIEW REQUIRED";
  doc.text(badgeText, pageWidth / 2, y + 7, { align: "center" });
  
  y += 20;
  
  // Property Name (Large, centered, dark gray)
  doc.setTextColor(40, 40, 40);
  doc.setFontSize(28);
  doc.setFont("helvetica", "bold");
  const propertyTitle = data.propertyName || "Data Center Site";
  const titleLines = doc.splitTextToSize(propertyTitle, 180);
  titleLines.forEach((line: string) => {
    doc.text(line, pageWidth / 2, y, { align: "center" });
    y += 10;
  });
  
  y += 5;
  
  // Location (medium gray)
  doc.setTextColor(100, 100, 100);
  doc.setFontSize(12);
  doc.setFont("helvetica", "normal");
  const location = `${data.city || ""}, ${data.state || ""}`;
  doc.text(location, pageWidth / 2, y, { align: "center" });
  
  y += 10;
  
  // Address (light gray, small)
  doc.setTextColor(140, 140, 140);
  doc.setFontSize(9);
  doc.text(data.address || "", pageWidth / 2, y, { align: "center" });
  
  y += 20;
  
  // Score Circle (minimal, centered)
  const circleX = pageWidth / 2;
  const circleY = y + 20;
  const circleRadius = 22;
  
  // Circle border (thin)
  doc.setDrawColor(badgeColor[0], badgeColor[1], badgeColor[2]);
  doc.setLineWidth(2);
  doc.circle(circleX, circleY, circleRadius, "S");
  
  // Score text
  doc.setTextColor(40, 40, 40);
  doc.setFontSize(24);
  doc.setFont("helvetica", "bold");
  doc.text(String(score), circleX, circleY + 4, { align: "center" });
  
  doc.setFontSize(9);
  doc.setTextColor(120, 120, 120);
  doc.text("/ 100", circleX, circleY + 13, { align: "center" });
  
  y = circleY + circleRadius + 25;

  // === PAGE 2: LOCATION & MAP ===
  doc.addPage();
  
  // White background
  doc.setFillColor(255, 255, 255);
  doc.rect(0, 0, pageWidth, pageHeight, "F");
  
  y = 25;
  
  // Section Title
  doc.setTextColor(40, 40, 40);
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text("Prime Location", pageWidth / 2, y, { align: "center" });
  
  y += 8;
  
  doc.setTextColor(120, 120, 120);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text("Strategic positioning for data center operations", pageWidth / 2, y, { align: "center" });
  
  y += 20;

  // Map Box (light gray card with border)
  doc.setFillColor(250, 250, 250);
  doc.setDrawColor(220, 220, 220);
  doc.setLineWidth(0.5);
  doc.roundedRect(15, y, pageWidth - 30, 90, 3, 3, "FD");
  
  // Map icon and title
  doc.setTextColor(80, 80, 80);
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("📍 Location Map", 25, y + 15);
  
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
  
  // Map content (inside light card)
  if (hasCoords) {
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(80, 80, 80);
    doc.text(`${data.address || ""}`, 25, y + 30);
    doc.text(`${data.city || ""}, ${data.state || ""} ${data.zip || ""}`, 25, y + 40);
    doc.text(`Coordinates: ${lat.toFixed(4)}, ${lon.toFixed(4)}`, 25, y + 55);
    
    doc.setFontSize(8);
    doc.setTextColor(70, 130, 180);
    doc.text("View on OpenStreetMap", 25, y + 70);
  } else {
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(80, 80, 80);
    doc.text(`${data.address || ""}`, 25, y + 30);
    doc.text(`${data.city || ""}, ${data.state || ""} ${data.zip || ""}`, 25, y + 40);
  }
  
  y += 100;
  
  // Property Details Card
  doc.setFillColor(250, 250, 250);
  doc.setDrawColor(220, 220, 220);
  doc.roundedRect(15, y, pageWidth - 30, 60, 3, 3, "FD");
  
  doc.setTextColor(60, 60, 60);
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("Site Characteristics", 25, y + 15);
  
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(120, 120, 120);
  doc.text("Property Type:", 25, y + 28);
  doc.setTextColor(60, 60, 60);
  doc.text(data.propertyType || "N/A", 80, y + 28);
  
  doc.setTextColor(120, 120, 120);
  doc.text("Zoning:", 25, y + 38);
  doc.setTextColor(60, 60, 60);
  doc.text(data.zoningClassification || "N/A", 80, y + 38);
  
  doc.setTextColor(120, 120, 120);
  doc.text("Size:", 25, y + 48);
  doc.setTextColor(60, 60, 60);
  const sizeText = data.squareFootage ? `${data.squareFootage.toLocaleString()} sq ft` : "N/A";
  doc.text(sizeText, 80, y + 48);
  
  if (data.acreage) {
    doc.setTextColor(120, 120, 120);
    doc.text("Acreage:", 125, y + 28);
    doc.setTextColor(60, 60, 60);
    doc.text(`${data.acreage} acres`, 160, y + 28);
  }
  
  y += 80;
  
  // === PAGE 3: REQUIREMENTS ANALYSIS ===
  doc.addPage();
  
  // White background
  doc.setFillColor(255, 255, 255);
  doc.rect(0, 0, pageWidth, pageHeight, "F");
  
  y = 25;
  
  // Section Title
  doc.setTextColor(40, 40, 40);
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text("Requirements Analysis", pageWidth / 2, y, { align: "center" });
  
  y += 8;
  
  doc.setTextColor(120, 120, 120);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text("Zenthium data center specifications", pageWidth / 2, y, { align: "center" });
  
  y += 20;

  // Power Card
  const powerMW = data.powerAvailableMW || 0;
  const powerPass = powerMW >= 20;
  
  doc.setFillColor(250, 250, 250);
  doc.setDrawColor(220, 220, 220);
  doc.roundedRect(15, y, 60, 45, 3, 3, "FD");
  
  doc.setTextColor(80, 80, 80);
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.text("⚡ Power", 25, y + 12);
  
  doc.setTextColor(40, 40, 40);
  doc.setFontSize(12);
  doc.text(`${powerMW} MW`, 25, y + 24);
  
  doc.setFontSize(7);
  doc.setTextColor(powerPass ? 34 : 239, powerPass ? 197 : 68, powerPass ? 94 : 68);
  doc.text(powerPass ? "✓ Meets" : "✗ Below", 25, y + 33);
  doc.setTextColor(140, 140, 140);
  doc.text("(20+ MW)", 25, y + 40);
  
  // Water Card
  const waterPass = data.waterAvailable;
  
  doc.setFillColor(250, 250, 250);
  doc.roundedRect(80, y, 60, 45, 3, 3, "FD");
  
  doc.setTextColor(80, 80, 80);
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.text("💧 Water", 90, y + 12);
  
  doc.setTextColor(40, 40, 40);
  doc.setFontSize(9);
  doc.text(waterPass ? "Available" : "No Access", 90, y + 24);
  
  doc.setFontSize(7);
  doc.setTextColor(waterPass ? 34 : 239, waterPass ? 197 : 68, waterPass ? 94 : 68);
  doc.text(waterPass ? "✓ Meets" : "✗ Required", 90, y + 33);
  
  // Connectivity Card
  const fiberPass = data.fiberAvailable;
  
  doc.setFillColor(250, 250, 250);
  doc.roundedRect(145, y, 60, 45, 3, 3, "FD");
  
  doc.setTextColor(80, 80, 80);
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.text("📡 Fiber", 155, y + 12);
  
  doc.setTextColor(40, 40, 40);
  doc.setFontSize(9);
  doc.text(fiberPass ? "Available" : "No Fiber", 155, y + 24);
  
  doc.setFontSize(7);
  doc.setTextColor(fiberPass ? 34 : 239, fiberPass ? 197 : 68, fiberPass ? 94 : 68);
  doc.text(fiberPass ? "✓ Meets" : "✗ Preferred", 155, y + 33);
  
  y += 55;
  
  // Building Specs Card
  const ceilingFt = data.ceilingHeightFt || 0;
  const ceilingPass = ceilingFt >= 18;
  const storyPass = data.isSingleStory ?? false;
  const floorPass = data.isFloor ?? false;
  
  doc.setFillColor(250, 250, 250);
  doc.roundedRect(15, y, 90, 50, 3, 3, "FD");
  
  doc.setTextColor(60, 60, 60);
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.text("🏢 Building Specs", 25, y + 12);
  
  doc.setFontSize(7);
  doc.setFont("helvetica", "normal");
  
  doc.setTextColor(120, 120, 120);
  doc.text("Ceiling Height:", 25, y + 23);
  doc.setTextColor(ceilingPass ? 34 : 239, ceilingPass ? 197 : 68, ceilingPass ? 94 : 68);
  doc.text(`${ceilingFt} ft ${ceilingPass ? "✓" : "✗"}`, 70, y + 23);
  
  doc.setTextColor(120, 120, 120);
  doc.text("Single Story:", 25, y + 32);
  doc.setTextColor(storyPass ? 34 : 239, storyPass ? 197 : 68, storyPass ? 94 : 68);
  doc.text(storyPass ? "Yes ✓" : "No ✗", 70, y + 32);
  
  doc.setTextColor(120, 120, 120);
  doc.text("Flat Floor:", 25, y + 41);
  doc.setTextColor(floorPass ? 34 : 239, floorPass ? 197 : 68, floorPass ? 94 : 68);
  doc.text(floorPass ? "Yes ✓" : "No ✗", 70, y + 41);
  
  // Environmental Card
  const floodPass = !data.floodZone;
  
  doc.setFillColor(250, 250, 250);
  doc.roundedRect(115, y, 90, 50, 3, 3, "FD");
  
  doc.setTextColor(60, 60, 60);
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.text("🌍 Environmental", 125, y + 12);
  
  doc.setFontSize(7);
  doc.setFont("helvetica", "normal");
  
  doc.setTextColor(120, 120, 120);
  doc.text("Flood Zone:", 125, y + 23);
  doc.setTextColor(floodPass ? 34 : 239, floodPass ? 197 : 68, floodPass ? 94 : 68);
  doc.text(floodPass ? "No ✓" : "Yes ✗", 170, y + 23);
  
  doc.setTextColor(120, 120, 120);
  doc.text("Clearance:", 125, y + 32);
  doc.setTextColor(80, 80, 80);
  const envText = data.environmentalClearance || "Pending";
  doc.text(envText.substring(0, 15), 125, y + 41);
  
  y += 60;
  
  // Data Center Advantages Section
  doc.setTextColor(60, 60, 60);
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("Data Center Advantages", pageWidth / 2, y, { align: "center" });
  
  y += 12;
  
  // Advantage cards in 2x2 grid
  const cardWidth = 90;
  const cardHeight = 35;
  const gap = 10;
  
  // High Power Density
  doc.setFillColor(250, 250, 250);
  doc.setDrawColor(220, 220, 220);
  doc.roundedRect(15, y, cardWidth, cardHeight, 3, 3, "FD");
  doc.setTextColor(80, 80, 80);
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.text("⚡ High Power Density", 25, y + 10);
  doc.setTextColor(120, 120, 120);
  doc.setFontSize(7);
  doc.setFont("helvetica", "normal");
  doc.text(`${powerMW} MW for intensive`, 25, y + 20);
  doc.text("compute workloads", 25, y + 27);
  
  // Low Latency
  doc.setFillColor(250, 250, 250);
  doc.roundedRect(15 + cardWidth + gap, y, cardWidth, cardHeight, 3, 3, "FD");
  doc.setTextColor(80, 80, 80);
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.text("📡 Low Latency", 125, y + 10);
  doc.setTextColor(120, 120, 120);
  doc.setFontSize(7);
  doc.setFont("helvetica", "normal");
  doc.text("Fiber connectivity for", 125, y + 20);
  doc.text("high-speed data transfer", 125, y + 27);
  
  y += cardHeight + gap;
  
  // Efficient Cooling
  doc.setFillColor(250, 250, 250);
  doc.roundedRect(15, y, cardWidth, cardHeight, 3, 3, "FD");
  doc.setTextColor(80, 80, 80);
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.text("❄️ Efficient Cooling", 25, y + 10);
  doc.setTextColor(120, 120, 120);
  doc.setFontSize(7);
  doc.setFont("helvetica", "normal");
  doc.text("Water access and climate", 25, y + 20);
  doc.text("for optimal PUE", 25, y + 27);
  
  // Industrial Zoning
  doc.setFillColor(250, 250, 250);
  doc.roundedRect(15 + cardWidth + gap, y, cardWidth, cardHeight, 3, 3, "FD");
  doc.setTextColor(80, 80, 80);
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.text("🏭 Industrial Zoning", 125, y + 10);
  doc.setTextColor(120, 120, 120);
  doc.setFontSize(7);
  doc.setFont("helvetica", "normal");
  doc.text("Proper zoning for", 125, y + 20);
  doc.text("24/7 operations", 125, y + 27);
  
  // Footer on all pages
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    
    // Footer line
    doc.setDrawColor(230, 230, 230);
    doc.setLineWidth(0.5);
    doc.line(15, pageHeight - 20, pageWidth - 15, pageHeight - 20);
    
    // Footer text
    doc.setTextColor(150, 150, 150);
    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    doc.text("Strategic Value Plus | Zenthium Data Center Division", 15, pageHeight - 12);
    doc.text(`Page ${i} of ${pageCount}`, pageWidth / 2, pageHeight - 12, { align: "center" });
    doc.text("zenthium@strategicvalueplus.com", pageWidth - 15, pageHeight - 12, { align: "right" });
  }

  return doc;
}

export async function downloadPropertyPDF(data: PropertyPDFData, filename?: string) {
  const doc = await generatePropertyPDF(data);
  const defaultFilename = `zenthium-${data.propertyName?.replace(/[^a-z0-9]/gi, "_").toLowerCase() || "property"}-${Date.now()}.pdf`;
  doc.save(filename || defaultFilename);
}
