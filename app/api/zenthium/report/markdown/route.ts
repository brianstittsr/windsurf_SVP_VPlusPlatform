import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { COLLECTIONS } from "@/lib/schema";

export async function GET(request: NextRequest) {
  if (!adminDb) {
    return NextResponse.json(
      { error: "Database not initialized" },
      { status: 500 }
    );
  }

  try {
    // Fetch all submissions
    const snapshot = await adminDb
      .collection(COLLECTIONS.ZENTHIUM_LOCATION_SUBMISSIONS)
      .orderBy("createdAt", "desc")
      .get();

    const submissions = snapshot.docs.map((doc) => {
      const data = doc.data() as any;
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate?.() || data.createdAt,
        updatedAt: data.updatedAt?.toDate?.() || data.updatedAt,
      };
    });

    // Generate summary statistics
    const stats = {
      totalSubmissions: submissions.length,
      byStatus: {} as Record<string, number>,
      byState: {} as Record<string, number>,
      byPropertyType: {} as Record<string, number>,
      totalAcreage: 0,
      totalPowerMW: 0,
    };

    submissions.forEach((sub) => {
      const status = sub.status || "Submitted";
      stats.byStatus[status] = (stats.byStatus[status] || 0) + 1;

      const state = sub.state || sub.address?.state || "Unknown";
      if (state) {
        stats.byState[state] = (stats.byState[state] || 0) + 1;
      }

      const propType = sub.propertyType || "Unknown";
      stats.byPropertyType[propType] = (stats.byPropertyType[propType] || 0) + 1;

      if (sub.acreage) {
        stats.totalAcreage += Number(sub.acreage);
      }

      if (sub.powerAvailableMW || sub.powerCapacityMW) {
        stats.totalPowerMW += Number(sub.powerAvailableMW || sub.powerCapacityMW);
      }
    });

    // Generate Markdown content
    const markdown = generateMarkdownReport(submissions, stats);

    // Return as downloadable file
    return new NextResponse(markdown, {
      headers: {
        "Content-Type": "text/markdown; charset=utf-8",
        "Content-Disposition": `attachment; filename="zenthium-report-${new Date().toISOString().split("T")[0]}.md"`,
      },
    });

  } catch (error) {
    console.error("[Zenthium] Markdown report generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate markdown report", details: String(error) },
      { status: 500 }
    );
  }
}

function generateMarkdownReport(submissions: any[], stats: any): string {
  const now = new Date();
  
  let md = `# Zenthium Data Center Submissions Report\n\n`;
  md += `**Generated:** ${now.toLocaleString()}  \n`;
  md += `**Total Submissions:** ${stats.totalSubmissions}  \n`;
  md += `**Total Acreage:** ${stats.totalAcreage.toLocaleString()} acres  \n`;
  md += `**Total Power Capacity:** ${stats.totalPowerMW.toLocaleString()} MW  \n\n`;

  md += `---\n\n`;

  // Summary Statistics
  md += `## Summary Statistics\n\n`;

  md += `### By Status\n\n`;
  md += `| Status | Count |\n`;
  md += `|--------|-------|\n`;
  Object.entries(stats.byStatus).forEach(([status, count]) => {
    md += `| ${status} | ${count} |\n`;
  });
  md += `\n`;

  md += `### By State\n\n`;
  md += `| State | Count |\n`;
  md += `|-------|-------|\n`;
  Object.entries(stats.byState)
    .sort(([,a], [,b]) => (b as number) - (a as number))
    .forEach(([state, count]) => {
      md += `| ${state} | ${count} |\n`;
    });
  md += `\n`;

  md += `### By Property Type\n\n`;
  md += `| Type | Count |\n`;
  md += `|------|-------|\n`;
  Object.entries(stats.byPropertyType).forEach(([type, count]) => {
    md += `| ${type.replace(/_/g, " ")} | ${count} |\n`;
  });
  md += `\n`;

  md += `---\n\n`;

  // Detailed Submissions
  md += `## Detailed Submissions\n\n`;

  submissions.forEach((sub, index) => {
    const title = sub.title || sub.propertyName || "Unnamed Property";
    const status = sub.status || "Submitted";
    
    md += `### ${index + 1}. ${title}\n\n`;
    md += `- **ID:** \`${sub.id}\`  \n`;
    md += `- **Status:** ${status}  \n`;
    md += `- **Submitted:** ${formatDate(sub.createdAt)}  \n`;
    md += `- **Updated:** ${formatDate(sub.updatedAt)}  \n\n`;

    // Submitter Information
    const submitterName = sub.poc?.name || sub.submitterName || sub.directContact?.name || "N/A";
    const submitterEmail = sub.poc?.email || sub.submitterEmail || sub.directContact?.email || "N/A";
    const submitterPhone = sub.poc?.phone || sub.submitterPhone || sub.directContact?.phone || "N/A";
    const submitterCompany = sub.poc?.company || sub.submitterCompany || sub.directContact?.company || "N/A";

    md += `#### Submitter Information\n\n`;
    md += `- **Name:** ${submitterName}  \n`;
    md += `- **Email:** ${submitterEmail}  \n`;
    md += `- **Phone:** ${submitterPhone}  \n`;
    md += `- **Company:** ${submitterCompany}  \n\n`;

    // Location
    md += `#### Location\n\n`;
    if (sub.address) md += `- **Address:** ${sub.address}  \n`;
    if (sub.city || sub.state) {
      md += `- **City/State:** ${sub.city || ""}${sub.city && sub.state ? ", " : ""}${sub.state || ""}  \n`;
    }
    if (sub.zip) md += `- **ZIP:** ${sub.zip}  \n`;
    if (sub.country) md += `- **Country:** ${sub.country}  \n`;
    if (sub.coordinates) md += `- **Coordinates:** ${sub.coordinates}  \n`;
    md += `\n`;

    // Property Details
    md += `#### Property Details\n\n`;
    if (sub.propertyType) md += `- **Type:** ${sub.propertyType}  \n`;
    if (sub.propertyTypeOther) md += `- **Type (Other):** ${sub.propertyTypeOther}  \n`;
    if (sub.acreage) md += `- **Acreage:** ${sub.acreage} acres  \n`;
    if (sub.squareFootage) md += `- **Square Footage:** ${sub.squareFootage.toLocaleString()} sq ft  \n`;
    if (sub.zoning || sub.zoningClassification) md += `- **Zoning:** ${sub.zoning || sub.zoningClassification}  \n`;
    if (sub.parcelNumber) md += `- **Parcel Number:** ${sub.parcelNumber}  \n`;
    md += `\n`;

    // Infrastructure
    md += `#### Infrastructure\n\n`;
    const power = sub.powerAvailableMW || sub.powerCapacityMW;
    if (power) md += `- **Power Capacity:** ${power} MW  \n`;
    if (sub.powerType) md += `- **Power Type:** ${sub.powerType}  \n`;
    if (sub.hasBackupPower !== undefined) md += `- **Backup Power:** ${sub.hasBackupPower ? "Yes" : "No"}  \n`;
    if (sub.fiberAvailable !== undefined) md += `- **Fiber Available:** ${sub.fiberAvailable ? "Yes" : "No"}  \n`;
    if (sub.fiberProviders) md += `- **Fiber Providers:** ${sub.fiberProviders}  \n`;
    if (sub.waterAvailable !== undefined) md += `- **Water Available:** ${sub.waterAvailable ? "Yes" : "No"}  \n`;
    if (sub.waterSource) md += `- **Water Source:** ${sub.waterSource}  \n`;
    if (sub.coolingCapacity) md += `- **Cooling Capacity:** ${sub.coolingCapacity}  \n`;
    if (sub.hvacInstalled !== undefined) md += `- **HVAC Installed:** ${sub.hvacInstalled ? "Yes" : "No"}  \n`;
    if (sub.ceilingHeightFt) md += `- **Ceiling Height:** ${sub.ceilingHeightFt} ft  \n`;
    md += `\n`;

    // Building Features
    md += `#### Building Features\n\n`;
    if (sub.isSingleStory !== undefined) md += `- **Single Story:** ${sub.isSingleStory ? "Yes" : "No"}  \n`;
    if (sub.isFloor !== undefined) md += `- **Floor Loading:** ${sub.isFloor ? "Yes" : "No"}  \n`;
    if (sub.floodZone !== undefined) md += `- **In Flood Zone:** ${sub.floodZone ? "Yes" : "No"}  \n`;
    md += `\n`;

    // Ownership
    md += `#### Ownership & Financial\n\n`;
    if (sub.ownershipType) md += `- **Ownership Type:** ${sub.ownershipType}  \n`;
    if (sub.askingPrice) md += `- **Asking Price:** ${sub.askingPrice}  \n`;
    if (sub.leaseRate) md += `- **Lease Rate:** ${sub.leaseRate}  \n`;
    md += `\n`;

    // Timeline
    md += `#### Timeline\n\n`;
    if (sub.timeline) md += `- **Availability:** ${sub.timeline}  \n`;
    if (sub.environmentalClearance) md += `- **Environmental Clearance:** ${sub.environmentalClearance}  \n`;
    md += `\n`;

    // Notes
    const notes = sub.additionalNotes || sub.description || sub.notes;
    if (notes) {
      md += `#### Notes\n\n`;
      md += `${notes}\n\n`;
    }

    // Partner Response (if available)
    if (sub.partnerResponse) {
      md += `#### Partner Response\n\n`;
      md += `- **Interested:** ${sub.partnerResponse.interested ? "Yes ✓" : "No ✗"}  \n`;
      md += `- **Responded At:** ${formatDate(sub.partnerResponse.respondedAt)}  \n`;
      md += `- **Previous Status:** ${sub.partnerResponse.previousStatus || "N/A"}  \n\n`;
    }

    md += `---\n\n`;
  });

  // Footer
  md += `## Footer\n\n`;
  md += `*Report generated by Zenthium Data Center Partnership Program*  \n`;
  md += `*Strategic Value Plus, Inc.*  \n`;
  md += `*Generated: ${now.toLocaleString()}*`;

  return md;
}

function formatDate(date: any): string {
  if (!date) return "N/A";
  try {
    const d = new Date(date);
    return d.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return String(date);
  }
}
