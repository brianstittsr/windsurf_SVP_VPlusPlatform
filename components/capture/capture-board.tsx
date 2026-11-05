"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { DragDropContext, Droppable, Draggable, type DropResult } from "@hello-pangea/dnd";
import { Card, CardContent } from "@/components/ui/card";
import { DeadlineChip } from "@/components/capture/deadline-chip";
import { BidNoBidDialog } from "@/components/capture/bid-no-bid-dialog";
import { SubmitDialog } from "@/components/capture/submit-dialog";
import { captureJson } from "@/lib/capture/api-client";
import type { CaptureOpportunity, CaptureSettingsDoc } from "@/lib/schema";
import { stagesForBoard, passesBidNoBidGate, isValidTransition } from "@/lib/capture/stages";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface Props {
  opportunities: CaptureOpportunity[];
  settings: CaptureSettingsDoc;
  boardType?: string;
  onUpdated: (opp: CaptureOpportunity) => void;
}

interface PendingGate {
  opp: CaptureOpportunity;
  toStage: string;
  kind: "bid-no-bid" | "submit";
}

export function CaptureBoard({ opportunities, settings, boardType = "standard", onUpdated }: Props) {
  const stages = useMemo(
    () => stagesForBoard(boardType).filter((s) => s.id !== "closed"),
    [boardType]
  );
  const [pendingGate, setPendingGate] = useState<PendingGate | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const grouped = useMemo(() => {
    const map = new Map<string, CaptureOpportunity[]>();
    stages.forEach((s) => map.set(s.id, []));
    opportunities
      .filter((o) => o.stage !== "closed")
      .forEach((o) => {
        const col = map.get(o.stage);
        if (col) col.push(o);
        else map.get(stages[0].id)?.push(o);
      });
    return map;
  }, [opportunities, stages]);

  const moveCard = async (opp: CaptureOpportunity, toStage: string, extra: Record<string, unknown> = {}) => {
    setSubmitting(true);
    try {
      const { opportunity } = await captureJson<{ opportunity: CaptureOpportunity }>(
        `/api/capture/opportunities/${opp.id}/stage`,
        { method: "POST", body: JSON.stringify({ toStage, ...extra }) }
      );
      onUpdated(opportunity);
      setPendingGate(null);
      toast.success(`Moved to ${stages.find((s) => s.id === toStage)?.label || toStage}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Move failed");
    } finally {
      setSubmitting(false);
    }
  };

  const onDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    const toStage = result.destination.droppableId;
    if (toStage === result.source.droppableId) return;

    const opp = opportunities.find((o) => o.id === result.draggableId);
    if (!opp) return;

    const validity = isValidTransition(opp.boardType || boardType, opp.stage, toStage);
    if (!validity.ok) {
      toast.error(validity.reason || "Invalid move");
      return;
    }
    if (toStage === "submitted" && (opp.boardType || boardType) === "standard") {
      setPendingGate({ opp, toStage, kind: "submit" });
      return;
    }
    if (passesBidNoBidGate(opp.boardType || boardType, toStage) && !opp.bidNoBid?.decision) {
      setPendingGate({ opp, toStage, kind: "bid-no-bid" });
      return;
    }
    moveCard(opp, toStage);
  };

  return (
    <>
      <DragDropContext onDragEnd={onDragEnd}>
        <div className="flex gap-3 overflow-x-auto pb-4">
          {stages.map((stage) => {
            const cards = grouped.get(stage.id) || [];
            return (
              <div key={stage.id} className="min-w-64 w-64 shrink-0">
                <div className="flex items-center justify-between mb-2 px-1">
                  <h3 className="text-sm font-semibold">{stage.label}</h3>
                  <span className="text-xs text-muted-foreground">{cards.length}</span>
                </div>
                <Droppable droppableId={stage.id}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={cn(
                        "min-h-48 space-y-2 rounded-lg p-2 transition-colors",
                        snapshot.isDraggingOver ? "bg-muted/70" : "bg-muted/30"
                      )}
                    >
                      {cards.map((opp, index) => (
                        <Draggable key={opp.id} draggableId={opp.id!} index={index}>
                          {(provided, snapshot) => (
                            <Card
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className={cn("cursor-grab", snapshot.isDragging && "shadow-lg rotate-1")}
                            >
                              <CardContent className="p-3 space-y-2">
                                <Link
                                  href={`/portal/capture/opportunities/${opp.id}`}
                                  className="text-sm font-medium leading-tight hover:underline line-clamp-2"
                                >
                                  {opp.title}
                                </Link>
                                <p className="text-xs text-muted-foreground">{opp.clientName}</p>
                                <DeadlineChip
                                  deadline={opp.responseDue}
                                  yellowDays={settings.deadlineYellowDays}
                                  redDays={settings.deadlineRedDays}
                                />
                              </CardContent>
                            </Card>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                      {cards.length === 0 && (
                        <p className="text-xs text-muted-foreground text-center py-6">Drop here</p>
                      )}
                    </div>
                  )}
                </Droppable>
              </div>
            );
          })}
        </div>
      </DragDropContext>

      <BidNoBidDialog
        open={pendingGate?.kind === "bid-no-bid"}
        onOpenChange={(o) => !o && setPendingGate(null)}
        opportunityTitle={pendingGate?.opp.title}
        submitting={submitting}
        onConfirm={(payload) => {
          if (!pendingGate) return;
          if (payload.decision === "no-bid") {
            moveCard(pendingGate.opp, "closed", { bidNoBid: payload });
          } else {
            moveCard(pendingGate.opp, pendingGate.toStage, { bidNoBid: payload });
          }
        }}
      />

      <SubmitDialog
        open={pendingGate?.kind === "submit"}
        onOpenChange={(o) => !o && setPendingGate(null)}
        files={pendingGate?.opp.files || []}
        submitting={submitting}
        onConfirm={(submittedAt, fileId) => {
          if (!pendingGate) return;
          moveCard(pendingGate.opp, pendingGate.toStage, { submittedAt, finalSubmissionFileId: fileId });
        }}
      />
    </>
  );
}
