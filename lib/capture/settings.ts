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
  alertDays: [7, 3, 1],
  expiryAlertDays: [90, 60, 30],
  matchWeights: { naics: 25, setAside: 20, keywords: 25, psc: 10, agency: 10, value: 10 },
  matchScoreCutoff: 60,
  scorecard: {
    mustHaves: [
      "Does the work fit our capabilities?",
      "Can we meet the required certifications/set-asides?",
      "Is the timeline achievable?",
    ],
    weighted: [
      { question: "Past performance relevance", weight: 25 },
      { question: "Agency relationship / knowledge", weight: 20 },
      { question: "Competitive position", weight: 20 },
      { question: "Resource availability", weight: 20 },
      { question: "Expected value vs effort", weight: 15 },
    ],
    bidCutoff: 70,
    noBidCutoff: 50,
  },
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
    const data = snap.data() as Partial<CaptureSettingsDoc>;
    // Merge over defaults so older docs gain newly-added fields
    return {
      id: snap.id,
      ...DEFAULT_CAPTURE_SETTINGS,
      ...data,
      matchWeights: { ...DEFAULT_CAPTURE_SETTINGS.matchWeights, ...data.matchWeights },
      scorecard: { ...DEFAULT_CAPTURE_SETTINGS.scorecard, ...data.scorecard },
    } as CaptureSettingsDoc;
  }
  await ref.set({
    ...DEFAULT_CAPTURE_SETTINGS,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });
  return fallback;
}
