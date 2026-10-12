import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase-admin";
import { COLLECTIONS, type CaptureSettingsDoc } from "@/lib/schema";
import { RFI_STAGES, STANDARD_STAGES } from "./stages";

export const CAPTURE_SETTINGS_DOC_ID = "global";

export const DEFAULT_CAPTURE_SETTINGS: Omit<CaptureSettingsDoc, "id" | "createdAt" | "updatedAt"> = {
  standardStages: STANDARD_STAGES,
  rfiStages: RFI_STAGES,
  opportunityTypes: ["rfi", "sources-sought", "rfp", "rfq", "grant"],
  setAsides: ["unrestricted", "small-business", "8(a)", "hubzone", "sdvosb", "vosb", "wosb", "edwosb"],
  noBidReasons: [
    "Out of scope",
    "Insufficient capacity",
    "Price uncompetitive",
    "Timeline too short",
    "Past performance gap",
    "Other",
  ],
  fileTags: ["rfp", "amendment", "draft", "final-submission", "qa", "other"],
  deadlineYellowDays: 7,
  deadlineRedDays: 3,
  expiryWarningDays: 90,
};

/** Load capture settings, seeding the defaults doc on first use. */
export async function getCaptureSettings(): Promise<CaptureSettingsDoc> {
  const fallback: CaptureSettingsDoc = {
    id: CAPTURE_SETTINGS_DOC_ID,
    ...DEFAULT_CAPTURE_SETTINGS,
    createdAt: null as unknown as CaptureSettingsDoc["createdAt"],
    updatedAt: null as unknown as CaptureSettingsDoc["updatedAt"],
  };
  if (!adminDb) return fallback;
  const ref = adminDb.collection(COLLECTIONS.CAPTURE_SETTINGS).doc(CAPTURE_SETTINGS_DOC_ID);
  const snap = await ref.get();
  if (snap.exists) {
    return { id: snap.id, ...snap.data() } as CaptureSettingsDoc;
  }
  await ref.set({
    ...DEFAULT_CAPTURE_SETTINGS,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });
  return fallback;
}
