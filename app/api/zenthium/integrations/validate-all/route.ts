import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/zenthium/integrations/validate-all
 * Comprehensive validation using both real estate and utility APIs
 * 
 * This endpoint orchestrates multiple API calls:
 * 1. Real estate APIs (property verification)
 * 2. Utility APIs (power and water)
 * 3. Internal Zenthium requirements validation
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      // Property details
      address,
      city,
      state,
      zip,
      propertyType,
      // Submitted data
      squareFootage,
      ceilingHeightFt,
      isSingleStory,
      isFloor,
      powerAvailableMW,
      waterAvailable,
    } = body;

    if (!address || !city || !state) {
      return NextResponse.json(
        { error: "Address, city, and state are required" },
        { status: 400 }
      );
    }

    const validationResults = {
      realEstate: null as any,
      utilities: null as any,
      openGridWorks: null as any,
      zenthiumRequirements: null as any,
      overallScore: 0,
      qualified: false,
      discrepancies: [] as any[],
      recommendations: [] as string[],
    };

    // STEP 1: Validate with Real Estate APIs
    console.log("Validating property with real estate APIs...");
    try {
      const realEstateResponse = await fetch(`${getBaseUrl(request)}/api/zenthium/integrations/real-estate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address, city, state, zip, propertyType }),
      });

      if (realEstateResponse.ok) {
        validationResults.realEstate = await realEstateResponse.json();
      } else {
        validationResults.realEstate = { error: "Real estate validation failed" };
      }
    } catch (error) {
      console.error("Real estate API error:", error);
      validationResults.realEstate = { error: "Real estate API unavailable" };
    }

    // STEP 2: Validate with Utility APIs
    console.log("Validating utilities with power and water APIs...");
    try {
      const coordinates = validationResults.realEstate?.propertyDetails?.coordinates;

      const utilitiesResponse = await fetch(`${getBaseUrl(request)}/api/zenthium/integrations/utilities`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address, city, state, zip, coordinates }),
      });

      if (utilitiesResponse.ok) {
        validationResults.utilities = await utilitiesResponse.json();
      } else {
        validationResults.utilities = { error: "Utilities validation failed" };
      }
    } catch (error) {
      console.error("Utilities API error:", error);
      validationResults.utilities = { error: "Utilities API unavailable" };
    }

    // STEP 2.5: Validate with OpenGridWorks Power Plant API
    console.log("Validating power plants with OpenGridWorks API...");
    try {
      const coordinates = validationResults.realEstate?.propertyDetails?.coordinates;
      const [lat, lon] = coordinates?.split(',').map((c: string) => parseFloat(c.trim())) || [0, 0];

      if (lat && lon) {
        const openGridResponse = await fetch(`${getBaseUrl(request)}/api/zenthium/integrations/opengridworks`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ lat, lon, radiusKm: 50, mock: true }), // Use mock mode for now
        });

        if (openGridResponse.ok) {
          validationResults.openGridWorks = await openGridResponse.json();
        } else {
          validationResults.openGridWorks = { error: "OpenGridWorks validation failed" };
        }
      } else {
        validationResults.openGridWorks = { error: "No coordinates available for OpenGridWorks query" };
      }
    } catch (error) {
      console.error("OpenGridWorks API error:", error);
      validationResults.openGridWorks = { error: "OpenGridWorks API unavailable" };
    }

    // STEP 3: Validate Zenthium Requirements
    console.log("Validating Zenthium requirements...");
    try {
      // Use OpenGridWorks power data if available, otherwise fall back to utilities or submitted data
      const powerFromOpenGrid = validationResults.openGridWorks?.data?.validation?.power_capacity_mw;
      const powerFromUtilities = validationResults.utilities?.power?.capacityMW;
      const effectivePowerMW = powerFromOpenGrid || powerFromUtilities || powerAvailableMW;

      const zenthiumResponse = await fetch(`${getBaseUrl(request)}/api/zenthium/validate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          powerAvailableMW: effectivePowerMW,
          squareFootage: validationResults.realEstate?.propertyDetails?.squareFootage || squareFootage,
          ceilingHeightFt,
          waterAvailable: validationResults.utilities?.water?.available ?? waterAvailable,
          isSingleStory,
          isFloor,
        }),
      });

      if (zenthiumResponse.ok) {
        validationResults.zenthiumRequirements = await zenthiumResponse.json();
      } else {
        validationResults.zenthiumRequirements = { error: "Requirements validation failed" };
      }
    } catch (error) {
      console.error("Zenthium validation error:", error);
      validationResults.zenthiumRequirements = { error: "Requirements validation unavailable" };
    }

    // STEP 4: Check for Discrepancies
    validationResults.discrepancies = findDiscrepancies(
      body,
      validationResults.realEstate,
      validationResults.utilities
    );

    // STEP 5: Generate Recommendations
    validationResults.recommendations = generateRecommendations(
      validationResults.realEstate,
      validationResults.utilities,
      validationResults.zenthiumRequirements,
      validationResults.discrepancies
    );

    // STEP 6: Calculate Overall Score
    validationResults.overallScore = calculateOverallScore(validationResults);
    validationResults.qualified = validationResults.zenthiumRequirements?.qualifies || false;

    return NextResponse.json({
      success: true,
      validated: true,
      qualified: validationResults.qualified,
      overallScore: validationResults.overallScore,
      realEstate: validationResults.realEstate,
      utilities: validationResults.utilities,
      openGridWorks: validationResults.openGridWorks,
      zenthiumRequirements: validationResults.zenthiumRequirements,
      discrepancies: validationResults.discrepancies,
      recommendations: validationResults.recommendations,
      summary: {
        propertyVerified: validationResults.realEstate?.addressVerified || false,
        powerVerified: validationResults.utilities?.power?.verified || validationResults.openGridWorks?.data?.validation?.meets_20mw_requirement || false,
        waterVerified: validationResults.utilities?.water?.verified || false,
        powerPlantsNearby: validationResults.openGridWorks?.data?.summary?.plant_count || 0,
        maxPowerCapacityMW: validationResults.openGridWorks?.data?.validation?.power_capacity_mw || validationResults.utilities?.power?.capacityMW || 0,
        requirementsMet: validationResults.zenthiumRequirements?.passedCount || 0,
        totalRequirements: validationResults.zenthiumRequirements?.totalRequirements || 6,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Comprehensive validation error:", error);
    return NextResponse.json(
      { error: "Failed to perform comprehensive validation" },
      { status: 500 }
    );
  }
}

function getBaseUrl(request: NextRequest): string {
  const host = request.headers.get("host") || "localhost:3000";
  const protocol = host.includes("localhost") ? "http" : "https";
  return `${protocol}://${host}`;
}

function findDiscrepancies(submitted: any, realEstate: any, utilities: any) {
  const discrepancies = [];

  // Check square footage discrepancy
  if (submitted.squareFootage && realEstate?.propertyDetails?.squareFootage) {
    const diff = Math.abs(submitted.squareFootage - realEstate.propertyDetails.squareFootage);
    const percentDiff = (diff / realEstate.propertyDetails.squareFootage) * 100;
    
    if (percentDiff > 10) {
      discrepancies.push({
        field: "squareFootage",
        submitted: submitted.squareFootage,
        verified: realEstate.propertyDetails.squareFootage,
        difference: diff,
        percentDifference: percentDiff.toFixed(1),
        severity: percentDiff > 25 ? "high" : "medium",
        message: `Submitted square footage differs from verified data by ${percentDiff.toFixed(1)}%`,
      });
    }
  }

  // Check power capacity discrepancy
  if (submitted.powerAvailableMW && utilities?.power?.capacityMW) {
    const diff = Math.abs(submitted.powerAvailableMW - utilities.power.capacityMW);
    
    if (diff > 5) {
      discrepancies.push({
        field: "powerAvailableMW",
        submitted: submitted.powerAvailableMW,
        verified: utilities.power.capacityMW,
        difference: diff,
        severity: diff > 10 ? "high" : "medium",
        message: `Submitted power capacity differs from utility provider data by ${diff} MW`,
      });
    }
  }

  // Check water availability discrepancy
  if (submitted.waterAvailable !== undefined && utilities?.water?.available !== undefined) {
    if (submitted.waterAvailable !== utilities.water.available) {
      discrepancies.push({
        field: "waterAvailable",
        submitted: submitted.waterAvailable,
        verified: utilities.water.available,
        severity: "high",
        message: "Submitted water availability conflicts with water district data",
      });
    }
  }

  return discrepancies;
}

function generateRecommendations(realEstate: any, utilities: any, requirements: any, discrepancies: any[]) {
  const recommendations = [];

  // Address verification
  if (!realEstate?.addressVerified) {
    recommendations.push("⚠️ Address could not be verified. Please confirm the property address is correct.");
  }

  // Property existence
  if (!realEstate?.propertyExists) {
    recommendations.push("⚠️ Property not found in real estate databases. This may be a new development or require manual verification.");
  }

  // Power capacity
  if (utilities?.power?.capacityMW < 20) {
    recommendations.push(`⚡ Current power capacity (${utilities.power.capacityMW} MW) is below the 20 MW requirement. Consider infrastructure upgrades or alternative power sources.`);
  }

  // Water availability
  if (!utilities?.water?.available) {
    recommendations.push("💧 Water access not verified. Contact local water district to confirm availability and connection costs.");
  }

  // Discrepancies
  if (discrepancies.length > 0) {
    const highSeverity = discrepancies.filter(d => d.severity === "high");
    if (highSeverity.length > 0) {
      recommendations.push(`🔍 ${highSeverity.length} high-severity discrepancies found. Review and update submitted data to match verified information.`);
    }
  }

  // Requirements not met
  if (requirements?.failedCount > 0) {
    recommendations.push(`📋 ${requirements.failedCount} of ${requirements.totalRequirements} requirements not met. Review failed requirements and consider property improvements.`);
  }

  // Zoning
  if (realEstate?.propertyDetails?.zoning && !realEstate.propertyDetails.zoning.includes("Industrial")) {
    recommendations.push("🏭 Property zoning may not be suitable for data center operations. Verify with local planning department.");
  }

  return recommendations;
}

function calculateOverallScore(results: any): number {
  let score = 0;
  let maxScore = 0;

  // Real estate validation (30 points)
  maxScore += 30;
  if (results.realEstate?.confidenceScore) {
    score += (results.realEstate.confidenceScore / 100) * 30;
  }

  // Utilities validation (30 points)
  maxScore += 30;
  const powerConfidence = results.utilities?.power?.confidence || 0;
  const waterConfidence = results.utilities?.water?.confidence || 0;
  score += ((powerConfidence + waterConfidence) / 200) * 30;

  // Zenthium requirements (40 points)
  maxScore += 40;
  if (results.zenthiumRequirements?.score) {
    score += (results.zenthiumRequirements.score / 100) * 40;
  }

  return Math.round(score);
}
