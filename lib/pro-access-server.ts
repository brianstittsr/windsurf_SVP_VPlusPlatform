import { adminDb } from "@/lib/firebase-admin";
import { COLLECTIONS, type TeamMemberDoc } from "@/lib/schema";
import { hasActiveProAccess } from "@/lib/pro-access";

export async function hasProAccessForUid(firebaseUid: string): Promise<boolean> {
  if (!adminDb) return false;
  const snapshot = await adminDb.collection(COLLECTIONS.TEAM_MEMBERS)
    .where("firebaseUid", "==", firebaseUid)
    .limit(1)
    .get();
  if (snapshot.empty) return false;
  return hasActiveProAccess(snapshot.docs[0].data() as TeamMemberDoc);
}
