/**
 * GoHighLevel Integrations API
 * 
 * Endpoints for managing GHL integrations:
 * - GET: List all integrations
 * - POST: Create new integration
 */

import { NextRequest, NextResponse } from "next/server";
import { collection, getDocs, addDoc, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { COLLECTIONS, GHLIntegrationDoc } from "@/lib/schema";

// Serialize Firestore timestamps to ISO strings
function serializeIntegration(doc: GHLIntegrationDoc): Record<string, unknown> {
  return {
    ...doc,
    // Mask API token for security
    apiToken: doc.apiToken ? `****${doc.apiToken.slice(-4)}` : undefined,
    lastSyncAt: (doc.lastSyncAt as unknown as { toDate?: () => Date })?.toDate?.()?.toISOString() || doc.lastSyncAt,
    rateLimitReset: (doc.rateLimitReset as unknown as { toDate?: () => Date })?.toDate?.()?.toISOString() || doc.rateLimitReset,
    createdAt: (doc.createdAt as unknown as { toDate?: () => Date })?.toDate?.()?.toISOString() || doc.createdAt,
    updatedAt: (doc.updatedAt as unknown as { toDate?: () => Date })?.toDate?.()?.toISOString() || doc.updatedAt,
  };
}

export async function GET() {
  try {
    if (!db) {
      // Return empty array instead of error to prevent UI crashes
      return NextResponse.json({ success: true, integrations: [] });
    }

    const snapshot = await getDocs(collection(db, COLLECTIONS.GHL_INTEGRATIONS));
    const integrations = snapshot.docs.map((doc) => {
      const data = doc.data() as GHLIntegrationDoc;
      return serializeIntegration({ ...data, id: doc.id });
    });

    return NextResponse.json({ success: true, integrations });
  } catch (error) {
    console.error("Error fetching GHL integrations:", error);
    // Return empty array instead of error to prevent UI crashes
    return NextResponse.json({ success: true, integrations: [] });
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!db) {
      return NextResponse.json(
        { success: false, error: "Database not configured" },
        { status: 503 }
      );
    }

    const body = await request.json();
    const {
      name,
      apiToken,
      locationId,
      agencyId,
      description,
      syncContacts = true,
      syncOpportunities = true,
      syncCalendars = false,
      syncPipelines = false,
      syncCampaigns = false,
      contactMapping = {},
      defaultPipelineId,
      defaultStageId,
      enableWebhooks = false,
    } = body;

    // Validate required fields
    if (!name || !apiToken || !locationId) {
      return NextResponse.json(
        { success: false, error: "Name, API token, and Location ID are required" },
        { status: 400 }
      );
    }

    const now = Timestamp.now();
    const integration: Omit<GHLIntegrationDoc, "id"> = {
      name,
      apiToken,
      locationId,
      agencyId,
      description,
      isActive: true,
      syncContacts,
      syncOpportunities,
      syncCalendars,
      syncPipelines,
      syncCampaigns,
      contactMapping,
      defaultPipelineId,
      defaultStageId,
      enableWebhooks,
      lastSyncStatus: "never",
      totalContactsSynced: 0,
      totalOpportunitiesSynced: 0,
      createdBy: "system", // TODO: Get from auth
      lastModifiedBy: "system",
      createdAt: now,
      updatedAt: now,
    };

    const docRef = await addDoc(collection(db, COLLECTIONS.GHL_INTEGRATIONS), integration);

    return NextResponse.json({
      success: true,
      integration: {
        id: docRef.id,
        ...integration,
        apiToken: `****${apiToken.slice(-4)}`,
        createdAt: now.toDate().toISOString(),
        updatedAt: now.toDate().toISOString(),
      },
    });
  } catch (error) {
    console.error("Error creating GHL integration:", error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
