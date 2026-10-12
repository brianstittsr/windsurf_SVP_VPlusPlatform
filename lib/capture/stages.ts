import type { CaptureBoardType, CaptureStageDef } from "@/lib/schema";

export const STANDARD_STAGES: CaptureStageDef[] = [
  { id: "found", label: "Found" },
  { id: "qualifying", label: "Qualifying" },
  { id: "bid-no-bid", label: "Bid/No-Bid" },
  { id: "proposal", label: "Proposal" },
  { id: "submitted", label: "Submitted" },
  { id: "won", label: "Won" },
  { id: "lost", label: "Lost" },
  { id: "closed", label: "Closed" },
];

export const RFI_STAGES: CaptureStageDef[] = [
  { id: "found", label: "Found" },
  { id: "responding", label: "Responding" },
  { id: "submitted", label: "Submitted" },
  { id: "closed", label: "Closed" },
];

export const OUTCOME_STAGES = new Set(["won", "lost", "closed"]);

export function stagesForBoard(boardType: CaptureBoardType | string): CaptureStageDef[] {
  return boardType === "rfi" ? RFI_STAGES : STANDARD_STAGES;
}

export function stageLabel(boardType: CaptureBoardType | string, stageId: string): string {
  return stagesForBoard(boardType).find((s) => s.id === stageId)?.label || stageId;
}

/**
 * Whether moving to `toStage` is a legal transition.
 * - Forward moves through the ordered stage list are allowed (any distance).
 * - "won" is only reachable from "submitted".
 * - "lost"/"closed" are reachable from any earlier stage.
 * - Backward moves are allowed but re-evaluate gates on the next forward move.
 */
export function isValidTransition(
  boardType: CaptureBoardType | string,
  fromStage: string,
  toStage: string
): { ok: boolean; reason?: string } {
  if (fromStage === toStage) return { ok: true };
  const stages = stagesForBoard(boardType);
  const toIdx = stages.findIndex((s) => s.id === toStage);
  if (toIdx === -1) return { ok: false, reason: `Unknown stage "${toStage}"` };
  if (toStage === "won" && fromStage !== "submitted") {
    return { ok: false, reason: "An opportunity can only be marked Won from Submitted" };
  }
  if (fromStage === "won" || fromStage === "lost" || fromStage === "closed") {
    return { ok: false, reason: `"${fromStage}" is a terminal stage` };
  }
  return { ok: true };
}

/** Whether the target stage sits past the bid/no-bid gate (standard boards only). */
export function passesBidNoBidGate(boardType: CaptureBoardType | string, toStage: string): boolean {
  if (boardType !== "standard") return false;
  const stages = stagesForBoard(boardType);
  const gateIdx = stages.findIndex((s) => s.id === "bid-no-bid");
  const toIdx = stages.findIndex((s) => s.id === toStage);
  return gateIdx !== -1 && toIdx > gateIdx;
}
