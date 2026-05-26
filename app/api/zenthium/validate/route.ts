import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/zenthium/validate
 * Validates a property against Zenthium's 6 critical requirements
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Extract property data
    const {
      powerAvailableMW,
      squareFootage,
      ceilingHeightFt,
      waterAvailable,
      isSingleStory,
      isFloor,
    } = body;

    // Define the 6 critical requirements
    const requirements = [
      {
        id: "power",
        name: "Power Capacity",
        description: "Minimum 20 MW power capacity required",
        required: 20,
        actual: Number(powerAvailableMW) || 0,
        unit: "MW",
        passes: (Number(powerAvailableMW) || 0) >= 20,
        critical: true,
        weight: 25,
      },
      {
        id: "size",
        name: "Property Size",
        description: "Minimum 10,000 sq ft required",
        required: 10000,
        actual: Number(squareFootage) || 0,
        unit: "sq ft",
        passes: (Number(squareFootage) || 0) >= 10000,
        critical: true,
        weight: 20,
      },
      {
        id: "ceiling",
        name: "Ceiling Height",
        description: "Minimum 18 ft ceiling height required",
        required: 18,
        actual: Number(ceilingHeightFt) || 0,
        unit: "ft",
        passes: (Number(ceilingHeightFt) || 0) >= 18,
        critical: true,
        weight: 15,
      },
      {
        id: "water",
        name: "Water Access",
        description: "Water access required for cooling systems",
        required: true,
        actual: waterAvailable || false,
        unit: "boolean",
        passes: waterAvailable === true,
        critical: true,
        weight: 20,
      },
      {
        id: "singleStory",
        name: "Single Story",
        description: "Must be single story for optimal operations",
        required: true,
        actual: isSingleStory || false,
        unit: "boolean",
        passes: isSingleStory === true,
        critical: true,
        weight: 10,
      },
      {
        id: "flatFloor",
        name: "Flat Floor",
        description: "Must have flat floor for equipment installation",
        required: true,
        actual: isFloor || false,
        unit: "boolean",
        passes: isFloor === true,
        critical: true,
        weight: 10,
      },
    ];

    // Calculate overall score
    const passedRequirements = requirements.filter((r) => r.passes);
    const totalWeight = requirements.reduce((sum, r) => sum + r.weight, 0);
    const achievedWeight = passedRequirements.reduce((sum, r) => sum + r.weight, 0);
    const score = Math.round((achievedWeight / totalWeight) * 100);

    // Determine if property qualifies (need at least 4 of 6 critical requirements)
    const qualifies = passedRequirements.length >= 4;

    // Generate detailed feedback
    const failedRequirements = requirements.filter((r) => !r.passes);
    const feedback = {
      overall: qualifies
        ? "Property meets minimum Zenthium requirements"
        : "Property does not meet minimum requirements",
      passed: passedRequirements.map((r) => ({
        requirement: r.name,
        message: `✓ ${r.name}: ${r.actual} ${r.unit} (Required: ${r.required} ${r.unit})`,
      })),
      failed: failedRequirements.map((r) => ({
        requirement: r.name,
        message: `✗ ${r.name}: ${r.actual} ${r.unit} (Required: ${r.required} ${r.unit})`,
        recommendation: getRecommendation(r.id, r.actual, r.required),
      })),
    };

    // Response
    return NextResponse.json({
      qualifies,
      score,
      requirements,
      passedCount: passedRequirements.length,
      failedCount: failedRequirements.length,
      totalRequirements: requirements.length,
      feedback,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Validation error:", error);
    return NextResponse.json(
      { error: "Failed to validate property requirements" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/zenthium/validate/requirements
 * Returns the list of all Zenthium requirements
 */
export async function GET() {
  const requirements = [
    {
      id: "power",
      name: "Power Capacity",
      description: "Minimum 20 MW power capacity for data center operations",
      minimum: 20,
      unit: "MW",
      critical: true,
      category: "Infrastructure",
    },
    {
      id: "size",
      name: "Property Size",
      description: "Minimum 10,000 sq ft for server racks and cooling equipment",
      minimum: 10000,
      unit: "sq ft",
      critical: true,
      category: "Physical",
    },
    {
      id: "ceiling",
      name: "Ceiling Height",
      description: "Minimum 18 ft ceiling height for proper airflow and equipment",
      minimum: 18,
      unit: "ft",
      critical: true,
      category: "Physical",
    },
    {
      id: "water",
      name: "Water Access",
      description: "Water access required for cooling tower operations",
      minimum: true,
      unit: "boolean",
      critical: true,
      category: "Infrastructure",
    },
    {
      id: "singleStory",
      name: "Single Story",
      description: "Single story building preferred for load distribution",
      minimum: true,
      unit: "boolean",
      critical: true,
      category: "Physical",
    },
    {
      id: "flatFloor",
      name: "Flat Floor",
      description: "Flat floor required for raised floor installation",
      minimum: true,
      unit: "boolean",
      critical: true,
      category: "Physical",
    },
  ];

  return NextResponse.json({
    requirements,
    totalCount: requirements.length,
    criticalCount: requirements.filter((r) => r.critical).length,
    categories: ["Infrastructure", "Physical"],
  });
}

function getRecommendation(requirementId: string, actual: any, required: any): string {
  const recommendations: Record<string, string> = {
    power: `Current power capacity is ${actual} MW. Consider upgrading electrical infrastructure to meet the 20 MW minimum requirement.`,
    size: `Property is ${actual.toLocaleString()} sq ft. Zenthium requires at least 10,000 sq ft for viable data center operations.`,
    ceiling: `Ceiling height is ${actual} ft. Consider structural modifications to achieve the 18 ft minimum clearance.`,
    water: "Water access is not available. Explore options for water line installation or alternative cooling solutions.",
    singleStory: "Property is multi-story. Single story buildings are preferred for optimal load distribution and operations.",
    flatFloor: "Floor is not flat. Consider floor leveling or raised floor installation for equipment placement.",
  };

  return recommendations[requirementId] || "Please address this requirement to improve qualification.";
}
