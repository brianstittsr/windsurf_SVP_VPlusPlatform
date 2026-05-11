/**
 * PDF Generation for Zenthium Property Submissions
 * Generates a letterhead PDF with property details
 */

import { jsPDF } from "jspdf";

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

export function generatePropertyPDF(data: PropertyPDFData): jsPDF {
  const doc = new jsPDF();
  let y = 20;

  // Letterhead - Orange background
  doc.setFillColor(249, 115, 22);
  doc.rect(0, 0, 210, 50, "F");

  // Add V+ Logo (using text representation for now - can be replaced with image)
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(32);
  doc.setFont("helvetica", "bold");
  doc.text("V+", 20, 32);

  doc.setFontSize(16);
  doc.setFont("helvetica", "normal");
  doc.text("| Zenthium Property Submission", 40, 32);

  // Date
  doc.setFontSize(10);
  doc.text(new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }), 150, 25);

  y = 60;

  // Property Name
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(0, 0, 0);
  doc.text(data.propertyName || "Property Submission", 20, y);
  y += 15;

  // Property Details Section
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("Property Details", 20, y);
  y += 10;

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");

  const propertyFields = [
    { label: "Property Type", value: data.propertyType || "Not provided" },
    { label: "Address", value: data.address || "Not provided" },
    { label: "City", value: data.city || "Not provided" },
    { label: "State", value: data.state || "Not provided" },
    { label: "ZIP", value: data.zip || "Not provided" },
    { label: "Country", value: data.country || "Not provided" },
    { label: "Coordinates", value: data.coordinates || "Not provided" },
    { label: "Square Footage", value: data.squareFootage ? `${data.squareFootage.toLocaleString()} sq ft` : "Not provided" },
    { label: "Acreage", value: data.acreage ? `${data.acreage} acres` : "Not provided" },
    { label: "Zoning Classification", value: data.zoningClassification || "Not provided" },
    { label: "Single Story", value: data.isSingleStory !== undefined ? (data.isSingleStory ? "Yes" : "No") : "Not provided" },
    { label: "Flat Floor", value: data.isFloor !== undefined ? (data.isFloor ? "Yes" : "No") : "Not provided" },
    { label: "Flood Zone", value: data.floodZone !== undefined ? (data.floodZone ? "Yes" : "No") : "Not provided" },
  ];

  for (const field of propertyFields) {
    doc.text(`${field.label}:`, 20, y);
    doc.text(field.value, 70, y);
    y += 7;
  }

  y += 5;

  // Location Map Section
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("Location Map", 20, y);
  y += 10;

  // Map placeholder with Google Maps URL
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  const mapUrl = data.address && data.city
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${data.address}, ${data.city}, ${data.state} ${data.zip}`)}`
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${data.city}, ${data.state}`)}`;

  doc.text("View location on Google Maps:", 20, y);
  y += 5;
  doc.setTextColor(0, 0, 255);
  doc.text(mapUrl, 20, y, { maxWidth: 170 });
  doc.setTextColor(0, 0, 0);
  y += 10;

  // Power Requirements Section
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("Power Requirements", 20, y);
  y += 10;

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");

  const powerFields = [
    { label: "Power Available", value: data.powerAvailableMW ? `${data.powerAvailableMW} MW` : "Not provided" },
    { label: "Power Type", value: data.powerType || "Not provided" },
    { label: "Backup Power", value: data.hasBackupPower !== undefined ? (data.hasBackupPower ? "Yes" : "No") : "Not provided" },
    { label: "Zenthium Requirement", value: "20+ MW (Required)" },
  ];

  for (const field of powerFields) {
    doc.text(`${field.label}:`, 20, y);
    doc.text(field.value, 70, y);
    y += 7;
  }

  y += 5;

  // Water Requirements Section
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("Water Requirements", 20, y);
  y += 10;

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");

  const waterFields = [
    { label: "Water Access", value: data.waterAvailable ? (data.waterSource || "Yes") : "No" },
    { label: "Water Source", value: data.waterSource || "Not provided" },
    { label: "Cooling Capacity", value: data.coolingCapacity || "Not provided" },
    { label: "HVAC Installed", value: data.hvacInstalled !== undefined ? (data.hvacInstalled ? "Yes" : "No") : "Not provided" },
    { label: "Zenthium Requirement", value: "Water access for cooling (Required)" },
  ];

  for (const field of waterFields) {
    doc.text(`${field.label}:`, 20, y);
    doc.text(field.value, 70, y);
    y += 7;
  }

  y += 5;

  // Infrastructure Section
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("Infrastructure", 20, y);
  y += 10;

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");

  const infrastructureFields = [
    { label: "Ceiling Height", value: data.ceilingHeightFt ? `${data.ceilingHeightFt} ft` : "Not provided" },
    { label: "Zenthium Requirement", value: "18+ ft clear height (Required)" },
    { label: "Fiber Connectivity", value: data.fiberAvailable ? (data.fiberProviders || "Yes") : "No" },
    { label: "Fiber Providers", value: data.fiberProviders || "Not provided" },
    { label: "Environmental Clearance", value: data.environmentalClearance || "Not provided" },
  ];

  for (const field of infrastructureFields) {
    doc.text(`${field.label}:`, 20, y);
    doc.text(field.value, 70, y);
    y += 7;
  }

  // Check if we need a new page
  if (y > 250) {
    doc.addPage();
    y = 20;
  }

  y += 5;

  // Ownership & Financials Section
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("Ownership & Financials", 20, y);
  y += 10;

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");

  const financialFields = [
    { label: "Ownership Type", value: data.ownershipType || "Not provided" },
    { label: "Asking Price", value: data.askingPrice || "Not provided" },
    { label: "Lease Rate", value: data.leaseRate || "Not provided" },
    { label: "Timeline", value: data.timeline || "Not provided" },
  ];

  for (const field of financialFields) {
    doc.text(`${field.label}:`, 20, y);
    doc.text(field.value, 70, y);
    y += 7;
  }

  y += 5;

  // Description Section
  if (data.description) {
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("Description", 20, y);
    y += 10;

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    const splitDescription = doc.splitTextToSize(data.description, 170);
    doc.text(splitDescription, 20, y);
    y += splitDescription.length * 7 + 5;
  }

  // New page for contacts
  doc.addPage();
  y = 20;

  // Submitter Information
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("Submitter Information", 20, y);
  y += 10;

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");

  const submitterFields = [
    { label: "Name", value: data.submitterName },
    { label: "Company", value: data.submitterCompany },
    { label: "Email", value: data.submitterEmail },
    { label: "Phone", value: data.submitterPhone },
  ];

  for (const field of submitterFields) {
    doc.text(`${field.label}:`, 20, y);
    doc.text(field.value || "N/A", 70, y);
    y += 7;
  }

  y += 10;

  // Direct Contact Information
  if (data.directContactName) {
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("Direct Contact Information", 20, y);
    y += 10;

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");

    const contactFields = [
      { label: "Name", value: data.directContactName },
      { label: "Company", value: data.directContactCompany },
      { label: "Email", value: data.directContactEmail },
      { label: "Phone", value: data.directContactPhone },
    ];

    for (const field of contactFields) {
      doc.text(`${field.label}:`, 20, y);
      doc.text(field.value || "N/A", 70, y);
      y += 7;
    }
  }

  // Footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(128, 128, 128);
    doc.text(
      "V+ | Strategic Value+ | Zenthium Property Submission",
      105,
      290,
      { align: "center" }
    );
    doc.text(`Page ${i} of ${pageCount}`, 105, 295, { align: "center" });
  }

  return doc;
}

export function downloadPropertyPDF(data: PropertyPDFData, filename?: string) {
  const doc = generatePropertyPDF(data);
  const defaultFilename = `zenthium-${data.propertyName || "property"}-${Date.now()}.pdf`;
  doc.save(filename || defaultFilename);
}
