import { NextRequest, NextResponse } from "next/server";

const INTAKE_EXTRACTION_PROMPT = `You are a data extraction AI specialized in the Powered Land Developer Intake Form for data center site evaluation.

Extract information from the provided document text and return a JSON object. ONLY populate fields you find evidence of — leave others as empty string "". Do not invent or guess values.

The fields map to exact sections of the intake form:

SECTION 0 — Developer / Submitter Information:
- developerCompanyName: company submitting the opportunity
- primaryContactName: primary contact person
- titleRole: their title or role
- emailAddress: contact email
- phoneNumber: contact phone
- dateOfSubmission: date submitted (YYYY-MM-DD format)
- projectSiteName: name of the site/project

SECTION 1 — Power / Utility Infrastructure:
- overviewExistingInfrastructure: overview of existing power infrastructure (substations, transmission lines, etc.)
- utilityCompanyPowerProvider: utility company / power provider name
- powerStudies: details of power studies (LOA, SIS, Feasibility, etc.)
- powerStudiesFilesAvailable: "Yes", "No", or "N/A"
- existingCapacityMW: existing capacity in MW
- existingCapacityFilesAvailable: "Yes", "No", or "N/A"
- maximumCapacityMW: maximum capacity available (MW) and upgrades required
- maximumCapacityFilesAvailable: "Yes", "No", or "N/A"
- deliveryTimelines: delivery timelines / ramp schedule
- deliveryTimelinesFilesAvailable: "Yes", "No", or "N/A"
- costOfPowerPerKwh: effective cost of power in $/kWh
- costOfPowerFilesAvailable: "Yes", "No", or "N/A"
- powerGenerationSource: source (Solar, Wind, Nuclear, Gas, etc.)
- powerGenerationFilesAvailable: "Yes", "No", or "N/A"
- naturalGasProvider: natural gas provider name
- naturalGasThirdParties: 3rd parties involved in gas delivery
- transmissionPipelineSizePSI: pipeline size and PSI

SECTION 2 — Fiber / Connectivity:
- fiberAgreementsInPlace: any fiber agreements in place (provider, capacity)
- fiberAgreementsFilesAvailable: "Yes", "No", or "N/A"
- fiberProvidersProximity: overview of fiber providers near site
- fiberProvidersFilesAvailable: "Yes", "No", or "N/A"
- fiberProviderDiscussions: update on discussions with fiber providers
- fiberMapsAvailable: "Yes", "No", or "N/A"

SECTION 3 — Water & Sewer:
- waterSewerServiceAgreements: water and sewer service agreements
- waterSewerAgreementsFilesAvailable: "Yes", "No", or "N/A"
- waterSewerMainInfo: water & sewer main info (size, location, providers)
- waterSewerMainFilesAvailable: "Yes", "No", or "N/A"
- plannedWaterUpgrades: planned or required water upgrades
- plannedWaterFilesAvailable: "Yes", "No", or "N/A"
- hydrologicalStudies: hydrological studies / drainage reports
- hydrologicalFilesAvailable: "Yes", "No", or "N/A"

SECTION 4 — Property Information:
- siteAddress: full site address
- siteCoordinates: lat/long coordinates
- siteCoordinatesFilesAvailable: "Yes", "No", or "N/A"
- siteMapAvailable: "Yes", "No", or "N/A"
- sitePhotosAvailable: "Yes", "No", or "N/A"
- totalAcreageDevelopable: total acreage and developable acreage
- totalAcreageFilesAvailable: "Yes", "No", or "N/A"
- existingEasements: existing easements description
- existingEasementsFilesAvailable: "Yes", "No", or "N/A"
- thirdPartyReports: third party reports (Phase 1, Geotech, Wetlands, Flood Plain, Drainage, Groundwater)
- thirdPartyReportsFilesAvailable: "Yes", "No", or "N/A"
- topographicalMapsAvailable: "Yes", "No", or "N/A"
- altaSurveyAvailable: "Yes", "No", or "N/A"
- proximityRailAirports: proximity to rail and airports
- proximityRailFilesAvailable: "Yes", "No", or "N/A"
- zoningPermittingEntitlements: zoning, permitting & entitlements for data center usage
- zoningFilesAvailable: "Yes", "No", or "N/A"

SECTION 5 — Project Incentives:
- inPlaceIncentives: in-place incentives description
- inPlaceIncentivesFilesAvailable: "Yes", "No", or "N/A"
- salesTaxExemption: sales tax exemption on equipment details
- salesTaxFilesAvailable: "Yes", "No", or "N/A"
- propertyTaxAbatements: property tax abatements details
- propertyTaxFilesAvailable: "Yes", "No", or "N/A"
- governmentSupport: local, state, national government support details
- governmentSupportFilesAvailable: "Yes", "No", or "N/A"
- incentiveTimelines: timelines to receiving incentives
- incentiveTimelinesFilesAvailable: "Yes", "No", or "N/A"

INTERNAL (extract if found):
- dealName: project/deal name
- referralSource: how the deal was referred

Return ONLY a flat JSON object with the above keys. All values are strings. Leave unknown fields as "".`;

function stripDocxXml(text: string): string {
  return text
    .replace(/<w:t[^>]*>/g, " ")
    .replace(/<\/w:t>/g, " ")
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s{2,}/g, " ")
    .trim();
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ success: false, error: "No file provided" }, { status: 400 });
    }

    const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
    const isDocx =
      file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
      file.name.toLowerCase().endsWith(".docx") ||
      file.name.toLowerCase().endsWith(".doc");

    if (!isPdf && !isDocx) {
      return NextResponse.json(
        { success: false, error: "Only PDF and Word (.docx) files are supported" },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    let extractedText = "";

    if (isDocx) {
      const raw = new TextDecoder("utf-8", { fatal: false }).decode(arrayBuffer);
      extractedText = stripDocxXml(raw).substring(0, 50000);
    } else {
      extractedText = new TextDecoder("utf-8", { fatal: false }).decode(arrayBuffer).substring(0, 50000);
    }

    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      return NextResponse.json({
        success: true,
        data: {},
        extractedText: extractedText.substring(0, 500),
        note: "OpenAI API key not configured. No fields auto-populated.",
      });
    }

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          { role: "system", content: INTAKE_EXTRACTION_PROMPT },
          { role: "user", content: `Extract powered land intake data from this document:\n\n${extractedText}` },
        ],
        temperature: 0.1,
        max_tokens: 2000,
        response_format: { type: "json_object" },
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const aiResponse = await response.json();
    const parsed = JSON.parse(aiResponse.choices[0]?.message?.content ?? "{}");

    return NextResponse.json({
      success: true,
      data: parsed,
      extractedText: extractedText.substring(0, 500),
      fieldsFound: Object.entries(parsed).filter(([, v]) => v !== "" && v !== null && v !== false).length,
    });
  } catch (error) {
    console.error("[Zenthium] parse-document error:", error);
    return NextResponse.json({ success: false, error: "Failed to parse document" }, { status: 500 });
  }
}
