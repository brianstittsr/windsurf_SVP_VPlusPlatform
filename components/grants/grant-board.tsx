"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { DragDropContext, Droppable, Draggable, type DropResult } from "@hello-pangea/dnd";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { captureJson } from "@/lib/capture/api-client";
import { GRANT_STAGES } from "@/lib/grants/stages";
import type { GrantOpportunityDoc, GrantStage } from "@/lib/schema";
import { toast } from "sonner";

interface SerializedGrant extends Omit<GrantOpportunityDoc, "deadlineAt" | "createdAt" | "updatedAt" | "analyzedAt" | "submittedAt"> {
  deadlineAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

function daysUntil(deadline?: string): number | null {
  if (!deadline) return null;
  const diff = new Date(deadline).getTime() - Date.now();
  return Math.ceil(diff / 86_400_000);
}

export function GrantBoard({ grants, onMoved }: { grants: SerializedGrant[]; onMoved: (id: string, stage: GrantStage) => void }) {
  const [moving, setMoving] = useState<string | null>(null);

  const grouped = useMemo(() => {
    const map = new Map<GrantStage, SerializedGrant[]>();
    GRANT_STAGES.forEach((s) => map.set(s.id, []));
    for (const g of grants) {
      const col = map.get(g.stage);
      if (col) col.push(g);
      else map.get("discovered")?.push(g);
    }
    return map;
  }, [grants]);

  const onDragEnd = async (result: DropResult) => {
    const { destination, draggableId } = result;
    if (!destination) return;
    const toStage = destination.droppableId as GrantStage;
    const grant = grants.find((g) => g.id === draggableId);
    if (!grant || grant.stage === toStage) return;

    onMoved(grant.id, toStage);
    setMoving(grant.id);
    try {
      await captureJson(`/api/grants/${grant.id}`, {
        method: "PATCH",
        body: JSON.stringify({ stage: toStage }),
      });
      toast.success(`Moved to ${GRANT_STAGES.find((s) => s.id === toStage)?.label || toStage}`);
    } catch (e) {
      onMoved(grant.id, grant.stage);
      toast.error(e instanceof Error ? e.message : "Could not move grant");
    } finally {
      setMoving(null);
    }
  };

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="flex gap-3 overflow-x-auto pb-4">
        {GRANT_STAGES.map((stage) => {
          const cards = grouped.get(stage.id) || [];
          return (
            <div key={stage.id} className="min-w-64 w-64 shrink-0">
              <div className="flex items-center gap-2 mb-2 px-1">
                <span className={cn("h-2 w-2 rounded-full", stage.color)} />
                <h3 className="text-sm font-semibold">{stage.label}</h3>
                <span className="text-xs text-muted-foreground ml-auto">{cards.length}</span>
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
                    {cards.map((grant, index) => {
                      const days = daysUntil(grant.deadlineAt);
                      const answered = grant.questions.filter((q) => q.response).length;
                      return (
                        <Draggable key={grant.id} draggableId={grant.id!} index={index}>
                          {(provided, snapshot) => (
                            <Card
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className={cn(
                                "cursor-grab",
                                snapshot.isDragging && "shadow-lg rotate-1",
                                moving === grant.id && "opacity-50"
                              )}
                            >
                              <CardContent className="p-3 space-y-1.5">
                                <Link
                                  href={`/portal/grants/${grant.id}`}
                                  className="text-sm font-medium leading-tight hover:underline line-clamp-2"
                                >
                                  {grant.title}
                                </Link>
                                {grant.funder && (
                                  <p className="text-xs text-muted-foreground truncate">{grant.funder}</p>
                                )}
                                <div className="flex items-center justify-between text-xs">
                                  {days !== null ? (
                                    <span
                                      className={cn(
                                        "font-medium",
                                        days < 0
                                          ? "text-muted-foreground line-through"
                                          : days <= 7
                                            ? "text-rose-600"
                                            : days <= 21
                                              ? "text-amber-600"
                                              : "text-muted-foreground"
                                      )}
                                    >
                                      {days < 0 ? "Past due" : days === 0 ? "Due today" : `${days}d left`}
                                    </span>
                                  ) : (
                                    <span className="text-muted-foreground">No deadline</span>
                                  )}
                                  {grant.questions.length > 0 && (
                                    <span className="text-muted-foreground">
                                      {answered}/{grant.questions.length} answered
                                    </span>
                                  )}
                                </div>
                              </CardContent>
                            </Card>
                          )}
                        </Draggable>
                      );
                    })}
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
  );
}
