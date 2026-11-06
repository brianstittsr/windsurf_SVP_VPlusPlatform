import type { GrantStage } from "@/lib/schema";

export interface GrantStageDef {
  id: GrantStage;
  label: string;
  color: string;
}

export const GRANT_STAGES: GrantStageDef[] = [
  { id: "discovered", label: "Discovered", color: "bg-slate-500" },
  { id: "analyzed", label: "Analyzed", color: "bg-blue-500" },
  { id: "drafting", label: "Drafting", color: "bg-amber-500" },
  { id: "review", label: "In Review", color: "bg-violet-500" },
  { id: "submitted", label: "Submitted", color: "bg-cyan-600" },
  { id: "awarded", label: "Awarded", color: "bg-emerald-600" },
  { id: "denied", label: "Denied", color: "bg-rose-600" },
];

export const GRANT_STAGE_IDS = GRANT_STAGES.map((s) => s.id);

export function isGrantStage(value: string): value is GrantStage {
  return GRANT_STAGE_IDS.includes(value as GrantStage);
}
