import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/firebase-admin";
import { COLLECTIONS } from "@/lib/schema";

/**
 * POST /api/zenthium/validate/batch
 * Validates multiple submissions at once
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { submissionIds } = body;

    if (!Array.isArray(submissionIds) || submissionIds.length === 0) {
      return NextResponse.json(
        { error: "submissionIds array is required" },
        { status: 400 }
      );
    }

    if (!db) {
      return NextResponse.json(
        { error: "Database not initialized" },
        { status: 500 }
      );
    }

    const results = [];

    for (const id of submissionIds) {
      try {
        const submissionRef = db.collection(COLLECTIONS.ZENTHIUM_LOCATION_SUBMISSIONS).doc(id);
        const submissionDoc = await submissionRef.get();

        if (!submissionDoc.exists) {
          results.push({
            submissionId: id,
            error: "Submission not found",
            success: false,
          });
          continue;
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
            passes: (Number(validationData.powerAvailableMW) || 0) >= 20,
            weight: 25,
          },
          {
            id: "size",
            passes: (Number(validationData.squareFootage) || 0) >= 10000,
            weight: 20,
          },
          {
            id: "ceiling",
            passes: (Number(validationData.ceilingHeightFt) || 0) >= 18,
            weight: 15,
          },
          {
            id: "water",
            passes: validationData.waterAvailable === true,
            weight: 20,
          },
          {
            id: "singleStory",
            passes: validationData.isSingleStory === true,
            weight: 10,
          },
          {
            id: "flatFloor",
            passes: validationData.isFloor === true,
            weight: 10,
          },
        ];

        const passedRequirements = requirements.filter((r) => r.passes);
        const totalWeight = requirements.reduce((sum, r) => sum + r.weight, 0);
        const achievedWeight = passedRequirements.reduce((sum, r) => sum + r.weight, 0);
        const score = Math.round((achievedWeight / totalWeight) * 100);
        const qualifies = passedRequirements.length >= 4;

        // Update submission
        await submissionRef.update({
          validationScore: score,
          validationQualifies: qualifies,
          validationPassedCount: passedRequirements.length,
          validationFailedCount: requirements.length - passedRequirements.length,
          validationLastRun: new Date().toISOString(),
        });

        results.push({
          submissionId: id,
          propertyName: submission?.propertyName || "Unknown",
          qualifies,
          score,
          passedCount: passedRequirements.length,
          failedCount: requirements.length - passedRequirements.length,
          success: true,
        });
      } catch (error) {
        console.error(`Error validating submission ${id}:`, error);
        results.push({
          submissionId: id,
          error: "Validation failed",
          success: false,
        });
      }
    }

    const successCount = results.filter((r) => r.success).length;
    const failureCount = results.filter((r) => !r.success).length;
    const qualifiedCount = results.filter((r) => r.success && r.qualifies).length;

    return NextResponse.json({
      results,
      summary: {
        total: submissionIds.length,
        successful: successCount,
        failed: failureCount,
        qualified: qualifiedCount,
        notQualified: successCount - qualifiedCount,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Batch validation error:", error);
    return NextResponse.json(
      { error: "Failed to validate submissions" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/zenthium/validate/batch/all
 * Validates all submissions in the database
 */
export async function GET() {
  try {
    if (!db) {
      return NextResponse.json(
        { error: "Database not initialized" },
        { status: 500 }
      );
    }

    // Get all submissions
    const snapshot = await db.collection(COLLECTIONS.ZENTHIUM_LOCATION_SUBMISSIONS).get();
    const submissionIds = snapshot.docs.map((doc) => doc.id);

    if (submissionIds.length === 0) {
      return NextResponse.json({
        results: [],
        summary: {
          total: 0,
          successful: 0,
          failed: 0,
          qualified: 0,
          notQualified: 0,
        },
        message: "No submissions found",
      });
    }

    // Validate all
    const results = [];

    for (const id of submissionIds) {
      const submissionDoc = snapshot.docs.find((doc) => doc.id === id);
      if (!submissionDoc) continue;

      const submission = submissionDoc.data();

      const validationData = {
        powerAvailableMW: submission?.powerCapacityMW || submission?.powerAvailableMW || 0,
        squareFootage: submission?.squareFootage || 0,
        ceilingHeightFt: submission?.ceilingHeightFt || 0,
        waterAvailable: submission?.waterAvailable || false,
        isSingleStory: submission?.isSingleStory || false,
        isFloor: submission?.isFloor || false,
      };

      const requirements = [
        { id: "power", passes: (Number(validationData.powerAvailableMW) || 0) >= 20, weight: 25 },
        { id: "size", passes: (Number(validationData.squareFootage) || 0) >= 10000, weight: 20 },
        { id: "ceiling", passes: (Number(validationData.ceilingHeightFt) || 0) >= 18, weight: 15 },
        { id: "water", passes: validationData.waterAvailable === true, weight: 20 },
        { id: "singleStory", passes: validationData.isSingleStory === true, weight: 10 },
        { id: "flatFloor", passes: validationData.isFloor === true, weight: 10 },
      ];

      const passedRequirements = requirements.filter((r) => r.passes);
      const totalWeight = requirements.reduce((sum, r) => sum + r.weight, 0);
      const achievedWeight = passedRequirements.reduce((sum, r) => sum + r.weight, 0);
      const score = Math.round((achievedWeight / totalWeight) * 100);
      const qualifies = passedRequirements.length >= 4;

      await submissionDoc.ref.update({
        validationScore: score,
        validationQualifies: qualifies,
        validationPassedCount: passedRequirements.length,
        validationFailedCount: requirements.length - passedRequirements.length,
        validationLastRun: new Date().toISOString(),
      });

      results.push({
        submissionId: id,
        propertyName: submission?.propertyName || "Unknown",
        qualifies,
        score,
        passedCount: passedRequirements.length,
      });
    }

    const qualifiedCount = results.filter((r) => r.qualifies).length;

    return NextResponse.json({
      results,
      summary: {
        total: results.length,
        successful: results.length,
        failed: 0,
        qualified: qualifiedCount,
        notQualified: results.length - qualifiedCount,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Batch validation error:", error);
    return NextResponse.json(
      { error: "Failed to validate all submissions" },
      { status: 500 }
    );
  }
}
