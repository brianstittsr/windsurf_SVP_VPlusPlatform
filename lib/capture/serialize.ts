import { Timestamp } from "firebase-admin/firestore";

/** Convert Firestore admin Timestamps in a doc to ISO strings for JSON responses. */
export function serializeDoc<T>(data: T): T {
  if (data === null || data === undefined) return data;
  if (data instanceof Timestamp) return data.toDate().toISOString() as T;
  if (Array.isArray(data)) return data.map((v) => serializeDoc(v)) as T;
  if (typeof data === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(data as Record<string, unknown>)) {
      out[k] = serializeDoc(v);
    }
    return out as T;
  }
  return data;
}
