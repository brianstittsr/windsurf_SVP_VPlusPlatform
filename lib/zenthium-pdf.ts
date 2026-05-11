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
}

export function generatePropertyPDF(data: PropertyPDFData): jsPDF {
  const doc = new jsPDF();
  let y = 20;

  // Letterhead
  doc.setFillColor(249, 115, 22); // Orange background
  doc.rect(0, 0, 210, 40, "F");
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.setFont("helvetica", "bold");
  doc.text("Strategic Value+", 20, 25);
  
  doc.setFontSize(14);
  doc.setFont("helvetica", "normal");
  doc.text("| Zenthium Property Submission", 95, 25);

  // Date
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  const date = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  doc.text(`Date: ${date}`, 150, 20);

  y = 50;

  // Property Name
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
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
    { label: "Property Type", value: data.propertyType },
    { label: "Address", value: data.address },
    { label: "City, State, ZIP", value: `${data.city}, ${data.state} ${data.zip}` },
    { label: "Country", value: data.country },
    { label: "Coordinates", value: data.coordinates || "Not provided" },
    { label: "Square Footage", value: data.squareFootage ? `${data.squareFootage.toLocaleString()} sq ft` : "Not provided" },
    { label: "Acreage", value: data.acreage ? `${data.acreage} acres` : "Not provided" },
    { label: "Zoning Classification", value: data.zoningClassification || "Not provided" },
  ];

  for (const field of propertyFields) {
    doc.text(`${field.label}:`, 20, y);
    doc.text(field.value || "N/A", 70, y);
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
    { label: "Power Available", value: data.powerAvailableMW ? `${data.powerAvailableMW} MW` : "Not provided" },
    { label: "Power Type", value: data.powerType || "Not provided" },
    { label: "Ceiling Height", value: data.ceilingHeightFt ? `${data.ceilingHeightFt} ft` : "Not provided" },
    { label: "Fiber Connectivity", value: data.fiberAvailable ? (data.fiberProviders || "Yes") : "No" },
    { label: "Water Access", value: data.waterAvailable ? (data.waterSource || "Yes") : "No" },
    { label: "Cooling Capacity", value: data.coolingCapacity || "Not provided" },
    { label: "Environmental Clearance", value: data.environmentalClearance || "Not provided" },
  ];

  for (const field of infrastructureFields) {
    doc.text(`${field.label}:`, 20, y);
    doc.text(field.value || "N/A", 70, y);
    y += 7;
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
    doc.text(field.value || "N/A", 70, y);
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
    doc.text(
      "Strategic Value+ | Zenthium Property Submission",
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
