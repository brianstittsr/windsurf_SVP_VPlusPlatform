/**
 * Activity & Audit Logger
 *
 * Writes user-facing activity entries (notifications feed) and audit log
 * entries for administrative actions on the EFVS Academy platform.
 */

import { collection, addDoc, Timestamp } from "firebase/firestore";
import { db } from "./firebase";
import { COLLECTIONS } from "./schema";

export type ActivityType = "create" | "update" | "delete" | "note";

export type EntityType =
  // EFVS Academy LMS entities
  | "course"
  | "enrollment"
  | "certificate"
  | "payment"
  | "user"
  // GovCon/CRM entities (origin/main modules)
  | "opportunity"
  | "project"
  | "organization"
  | "meeting"
  | "document"
  | "task"
  | "rock"
  | "affiliate"
  | "team-member"
  | "proposal"
  | "calendar"
  | "settings"
  | "capture-client"
  | "capture-opportunity"
  | "capture-task"
  | "capture-match";

export interface LogActivityParams {
  type: ActivityType;
  entityType: EntityType;
  entityId: string;
  entityName?: string;
  description: string;
  userId?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Log an activity to the activities collection (notifications feed).
 * @param params - Activity parameters
 * @returns The ID of the created activity document, or null if failed
 */
export async function logActivity(
  params: LogActivityParams
): Promise<string | null> {
  if (!db) return null;
  try {
    const docRef = await addDoc(collection(db, COLLECTIONS.ACTIVITIES), {
      type: params.type,
      entityType: params.entityType,
      entityId: params.entityId,
      entityName: params.entityName || "",
      description: params.description,
      userId: params.userId || "system",
      metadata: params.metadata || {},
      createdAt: Timestamp.now(),
    });
    return docRef.id;
  } catch (error) {
    console.error("Error logging activity:", error);
    return null;
  }
}

export interface LogAuditParams {
  actorId: string;
  actorEmail: string;
  action: string;
  entityType: string;
  entityId: string;
  metadata?: Record<string, unknown>;
}

/**
 * Log an administrative action to the audit log.
 * @param params - Audit parameters
 * @returns The ID of the created audit document, or null if failed
 */
export async function logAudit(params: LogAuditParams): Promise<string | null> {
  if (!db) return null;
  try {
    const docRef = await addDoc(collection(db, COLLECTIONS.AUDIT_LOGS), {
      actorId: params.actorId,
      actorEmail: params.actorEmail,
      action: params.action,
      entityType: params.entityType,
      entityId: params.entityId,
      metadata: params.metadata || {},
      createdAt: Timestamp.now(),
    });
    return docRef.id;
  } catch (error) {
    console.error("Error writing audit log:", error);
    return null;
  }
}
