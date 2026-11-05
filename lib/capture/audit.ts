import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase-admin";
import { COLLECTIONS } from "@/lib/schema";
import type { ActivityType, EntityType } from "@/lib/activity-logger";

/**
 * Server-side audit writes (rule 11) into the shared `activities` collection,
 * matching the shape produced by lib/activity-logger.ts on the client.
 */
export async function captureAudit(params: {
  type: ActivityType;
  entityType: EntityType;
  entityId: string;
  entityName?: string;
  description: string;
  userId?: string;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  if (!adminDb) return;
  try {
    await adminDb.collection(COLLECTIONS.ACTIVITIES).add({
      type: params.type,
      entityType: params.entityType,
      entityId: params.entityId,
      entityName: params.entityName || "",
      description: params.description,
      userId: params.userId || "system",
      metadata: params.metadata || {},
      createdAt: FieldValue.serverTimestamp(),
    });
  } catch (error) {
    console.error("[capture] audit write failed:", error);
  }
}
