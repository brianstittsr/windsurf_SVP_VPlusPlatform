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
      const data = doc.data();
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
      dateRange: {
        earliest: submissions.length > 0 ? submissions[submissions.length - 1].createdAt : null,
        latest: submissions.length > 0 ? submissions[0].createdAt : null,
      },
    };

    submissions.forEach((sub) => {
      // Count by status
      const status = sub.status || "Submitted";
      stats.byStatus[status] = (stats.byStatus[status] || 0) + 1;

      // Count by state
      const state = sub.state || sub.address?.state || "Unknown";
      if (state) {
        stats.byState[state] = (stats.byState[state] || 0) + 1;
      }

      // Count by property type
      const propType = sub.propertyType || "Unknown";
      stats.byPropertyType[propType] = (stats.byPropertyType[propType] || 0) + 1;

      // Sum acreage
      if (sub.acreage) {
        stats.totalAcreage += Number(sub.acreage);
      }

      // Sum power
      if (sub.powerAvailableMW || sub.powerCapacityMW) {
        stats.totalPowerMW += Number(sub.powerAvailableMW || sub.powerCapacityMW);
      }
    });

    // Format for printing
    const report = {
      generatedAt: new Date().toISOString(),
      statistics: stats,
      submissions: submissions.map((sub) => ({
        id: sub.id,
        title: sub.title || sub.propertyName || "Unnamed Property",
        propertyName: sub.propertyName,
        status: sub.status || "Submitted",
        submitter: {
          name: sub.poc?.name || sub.submitterName || sub.directContact?.name || "N/A",
          email: sub.poc?.email || sub.submitterEmail || sub.directContact?.email || "N/A",
          phone: sub.poc?.phone || sub.submitterPhone || sub.directContact?.phone || "N/A",
          company: sub.poc?.company || sub.submitterCompany || sub.directContact?.company || "N/A",
        },
        location: {
          address: sub.address,
          city: sub.city,
          state: sub.state,
          zip: sub.zip,
          coordinates: sub.coordinates,
        },
        propertyDetails: {
          type: sub.propertyType,
          acreage: sub.acreage,
          squareFootage: sub.squareFootage,
          zoning: sub.zoning || sub.zoningClassification,
        },
        infrastructure: {
          powerMW: sub.powerAvailableMW || sub.powerCapacityMW,
          powerType: sub.powerType,
          fiberAvailable: sub.fiberAvailable,
          fiberProviders: sub.fiberProviders,
          waterAvailable: sub.waterAvailable,
          ceilingHeight: sub.ceilingHeightFt,
        },
        ownership: {
          type: sub.ownershipType,
          askingPrice: sub.askingPrice,
          leaseRate: sub.leaseRate,
        },
        timeline: sub.timeline,
        environmental: sub.environmentalClearance,
        notes: sub.additionalNotes || sub.description,
        createdAt: sub.createdAt,
        updatedAt: sub.updatedAt,
      })),
    };

    return NextResponse.json(report);

  } catch (error) {
    console.error("[Zenthium] Report generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate report", details: String(error) },
      { status: 500 }
    );
  }
}
