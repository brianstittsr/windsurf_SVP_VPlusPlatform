/**
 * Sync a grant's submission deadline to the shared calendarEvents collection.
 * Idempotent: updates the linked event when the deadline changes; removes it when cleared.
 */
import { Timestamp } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase-admin";
import { COLLECTIONS, type CalendarEventDoc } from "@/lib/schema";

export async function syncGrantDeadlineEvent(params: {
  grantId: string;
  title: string;
  funder?: string;
  deadlineAt?: { toMillis(): number } | null;
  existingEventId?: string;
}): Promise<string | null> {
  if (!adminDb) return null;
  const { grantId, title, funder, deadlineAt, existingEventId } = params;
  const col = adminDb.collection(COLLECTIONS.CALENDAR_EVENTS);

  // Deadline removed → delete the linked event if present
  if (!deadlineAt) {
    if (existingEventId) await col.doc(existingEventId).delete().catch(() => undefined);
    return null;
  }

  const endDate = Timestamp.fromMillis(deadlineAt.toMillis() + 60 * 60 * 1000);
  const payload = {
    title: `Grant deadline: ${title}`,
    description: funder ? `Submission deadline — ${funder}` : "Grant submission deadline",
    startDate: deadlineAt,
    endDate,
    allDay: false,
    type: "grant-deadline",
    color: "#dc2626",
    grantId,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  } as unknown as Omit<CalendarEventDoc, "id">;

  if (existingEventId) {
    const ref = col.doc(existingEventId);
    const snap = await ref.get();
    if (snap.exists) {
      await ref.update({ ...payload, createdAt: snap.get("createdAt") });
      return existingEventId;
    }
  }
  const ref = await col.add(payload);
  return ref.id;
}
