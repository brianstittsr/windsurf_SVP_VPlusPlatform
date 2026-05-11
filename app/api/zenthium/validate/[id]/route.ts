import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { COLLECTIONS } from "@/lib/schema";

/**
 * GET /api/zenthium/validate/[id]
 * Validates a specific submission by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    if (!adminDb) {
      return NextResponse.json(
        { error: "Database not initialized" },
        { status: 500 }
      );
    }

    // Fetch submission
    const submissionRef = adminDb.collection(COLLECTIONS.ZENTHIUM_LOCATION_SUBMISSIONS).doc(id);
    const submissionDoc = await submissionRef.get();

    if (!submissionDoc.exists) {
      return NextResponse.json(
        { error: "Submission not found" },
        { status: 404 }
      );
    }

    const submission = submissionDoc.data();

    // Extract validation data
    const validationData = {
      powerAvailableMW: submission?.powerCapacityMW || submission?.powerAvailableMW || 0,
      squareFootage: submission?.squareFootage || 0,
      ceilingHeightFt: submission?.ceilingHeightFt || 0,
      waterAvailable: submission?.waterAvailable || false,
      isSingleStory: submission?.isSingleStory || false,
      isFloor: submission?.isFloor || false,
    };

    // Validate requirements
    const requirements = [
      {
        id: "power",
        name: "Power Capacity",
        description: "Minimum 20 MW power capacity required",
        required: 20,
        actual: Number(validationData.powerAvailableMW) || 0,
        unit: "MW",
        passes: (Number(validationData.powerAvailableMW) || 0) >= 20,
        critical: true,
        weight: 25,
      },
      {
        id: "size",
        name: "Property Size",
        description: "Minimum 10,000 sq ft required",
        required: 10000,
        actual: Number(validationData.squareFootage) || 0,
        unit: "sq ft",
        passes: (Number(validationData.squareFootage) || 0) >= 10000,
        critical: true,
        weight: 20,
      },
      {
        id: "ceiling",
        name: "Ceiling Height",
        description: "Minimum 18 ft ceiling height required",
        required: 18,
        actual: Number(validationData.ceilingHeightFt) || 0,
        unit: "ft",
        passes: (Number(validationData.ceilingHeightFt) || 0) >= 18,
        critical: true,
        weight: 15,
      },
      {
        id: "water",
        name: "Water Access",
        description: "Water access required for cooling systems",
        required: true,
        actual: validationData.waterAvailable || false,
        unit: "boolean",
        passes: validationData.waterAvailable === true,
        critical: true,
        weight: 20,
      },
      {
        id: "singleStory",
        name: "Single Story",
        description: "Must be single story for optimal operations",
        required: true,
        actual: validationData.isSingleStory || false,
        unit: "boolean",
        passes: validationData.isSingleStory === true,
        critical: true,
        weight: 10,
      },
      {
        id: "flatFloor",
        name: "Flat Floor",
        description: "Must have flat floor for equipment installation",
        required: true,
        actual: validationData.isFloor || false,
        unit: "boolean",
        passes: validationData.isFloor === true,
        critical: true,
        weight: 10,
      },
    ];

    // Calculate score
    const passedRequirements = requirements.filter((r) => r.passes);
    const totalWeight = requirements.reduce((sum, r) => sum + r.weight, 0);
    const achievedWeight = passedRequirements.reduce((sum, r) => sum + r.weight, 0);
    const score = Math.round((achievedWeight / totalWeight) * 100);
    const qualifies = passedRequirements.length >= 4;

    // Update submission with validation results
    await submissionRef.update({
      validationScore: score,
      validationQualifies: qualifies,
      validationPassedCount: passedRequirements.length,
      validationFailedCount: requirements.length - passedRequirements.length,
      validationLastRun: new Date().toISOString(),
    });

    // Generate feedback
    const failedRequirements = requirements.filter((r) => !r.passes);
    const feedback = {
      overall: qualifies
        ? "✓ Property meets minimum Zenthium requirements"
        : "✗ Property does not meet minimum requirements",
      summary: `Passed ${passedRequirements.length} of ${requirements.length} critical requirements`,
      passed: passedRequirements.map((r) => ({
        requirement: r.name,
        value: `${r.actual} ${r.unit}`,
      })),
      failed: failedRequirements.map((r) => ({
        requirement: r.name,
        value: `${r.actual} ${r.unit}`,
        needed: `${r.required} ${r.unit}`,
        gap: r.unit === "boolean" ? "Not met" : `${Number(r.required) - Number(r.actual)} ${r.unit} short`,
      })),
    };

    return NextResponse.json({
      submissionId: id,
      propertyName: submission?.propertyName || "Unknown Property",
      qualifies,
      score,
      requirements,
      passedCount: passedRequirements.length,
      failedCount: failedRequirements.length,
      totalRequirements: requirements.length,
      feedback,
      validatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Validation error:", error);
    return NextResponse.json(
      { error: "Failed to validate submission" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/zenthium/validate/[id]/revalidate
 * Re-runs validation for a submission
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // Same as GET but forces a fresh validation
  return GET(request, { params });
}
