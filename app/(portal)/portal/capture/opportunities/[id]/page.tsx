"use client";

import { use, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { db } from "@/lib/firebase";
import { collection, getDocs, orderBy, query, where } from "firebase/firestore";
import { COLLECTIONS } from "@/lib/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { DeadlineChip } from "@/components/capture/deadline-chip";
import { StageBadge } from "@/components/capture/stage-badge";
import { WarningsList } from "@/components/capture/warnings-list";
import { NotesThread } from "@/components/capture/notes-thread";
import { FilesPanel } from "@/components/capture/files-panel";
import { TasksPanel } from "@/components/capture/tasks-panel";
import { BidNoBidDialog } from "@/components/capture/bid-no-bid-dialog";
import { SubmitDialog } from "@/components/capture/submit-dialog";
import { captureJson } from "@/lib/capture/api-client";
import { useUserProfile } from "@/contexts/user-profile-context";
import type { CaptureFileRef, CaptureNote, CaptureOpportunity, CaptureSettingsDoc, CaptureTask } from "@/lib/schema";
import { stagesForBoard, passesBidNoBidGate, isValidTransition } from "@/lib/capture/stages";
import { formatDualTimezone } from "@/lib/capture/dates";
import { ArrowLeft, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface DetailResponse {
  opportunity: CaptureOpportunity;
  warnings: string[];
  canWrite: boolean;
}

interface ActivityRow {
  id: string;
  description: string;
  userId?: string;
  createdAt?: string;
}

export default function OpportunityDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { profile } = useUserProfile();
  const isAdmin = profile.role === "admin";
  const [opp, setOpp] = useState<CaptureOpportunity | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [canWrite, setCanWrite] = useState(false);
  const [tasks, setTasks] = useState<CaptureTask[]>([]);
  const [settings, setSettings] = useState<CaptureSettingsDoc | null>(null);
  const [gate, setGate] = useState<{ toStage: string; kind: "bid-no-bid" | "submit" } | null>(null);
  const [saving, setSaving] = useState(false);
  const [activities, setActivities] = useState<ActivityRow[]>([]);

  const load = useCallback(() => {
    Promise.all([
      captureJson<DetailResponse>(`/api/capture/opportunities/${id}`),
      captureJson<{ tasks: CaptureTask[] }>(`/api/capture/opportunities/${id}/tasks`),
      captureJson<{ settings: CaptureSettingsDoc }>("/api/capture/settings"),
    ])
      .then(([d, t, s]) => {
        setOpp(d.opportunity);
        setWarnings(d.warnings);
        setCanWrite(d.canWrite);
        setTasks(t.tasks);
        setSettings(s.settings);
      })
      .catch((e) => toast.error(e.message));

    // Audit trail (rule 11) — readable by any authenticated user per rules
    if (db) {
      getDocs(
        query(
          collection(db, COLLECTIONS.ACTIVITIES),
          where("entityType", "==", "capture-opportunity"),
          where("entityId", "==", id),
          orderBy("createdAt", "desc")
        )
      )
        .then((snap) =>
          setActivities(
            snap.docs.map((d) => {
              const data = d.data();
              return {
                id: d.id,
                description: (data.description as string) || "",
                userId: data.userId as string | undefined,
                createdAt: data.createdAt?.toDate?.()?.toISOString?.() as string | undefined,
              };
            })
          )
        )
        .catch((e) => console.error("Activity load failed:", e));
    }
  }, [id]);

  useEffect(load, [load]);

  const moveStage = async (toStage: string, extra: Record<string, unknown> = {}) => {
    setSaving(true);
    try {
      const { opportunity } = await captureJson<{ opportunity: CaptureOpportunity }>(
        `/api/capture/opportunities/${id}/stage`,
        { method: "POST", body: JSON.stringify({ toStage, ...extra }) }
      );
      setOpp(opportunity);
      setGate(null);
      toast.success("Stage updated");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Move failed");
    } finally {
      setSaving(false);
    }
  };

  const requestStage = (toStage: string) => {
    if (!opp) return;
    const validity = isValidTransition(opp.boardType, opp.stage, toStage);
    if (!validity.ok) {
      toast.error(validity.reason || "Invalid move");
      return;
    }
    if (toStage === "submitted" && opp.boardType === "standard") {
      setGate({ toStage, kind: "submit" });
      return;
    }
    if (passesBidNoBidGate(opp.boardType, toStage) && !opp.bidNoBid?.decision) {
      setGate({ toStage, kind: "bid-no-bid" });
      return;
    }
    moveStage(toStage);
  };

  const softDelete = async () => {
    try {
      await captureJson(`/api/capture/opportunities/${id}`, { method: "DELETE" });
      toast.success("Moved to trash");
      window.location.href = "/portal/capture/board";
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Delete failed");
    }
  };

  if (!opp || !settings) return <div className="p-6 text-muted-foreground">Loading opportunity...</div>;

  const stages = stagesForBoard(opp.boardType);
  const qDual = formatDualTimezone(opp.questionsDue);
  const rDual = formatDualTimezone(opp.responseDue);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-4 min-w-0">
          <Button variant="ghost" size="icon" asChild aria-label="Back to board">
            <Link href="/portal/capture/board">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div className="min-w-0">
            <h1 className="text-2xl font-bold truncate">{opp.title}</h1>
            <p className="text-sm text-muted-foreground">
              {opp.clientName} · {opp.solicitationNumber} · {opp.agency}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <StageBadge boardType={opp.boardType} stage={opp.stage} />
          {canWrite && !["won", "lost", "closed"].includes(opp.stage) && (
            <Select onValueChange={requestStage} disabled={saving}>
              <SelectTrigger className="w-44">
                <SelectValue placeholder="Move to stage..." />
              </SelectTrigger>
              <SelectContent>
                {stages
                  .filter((s) => s.id !== opp.stage)
                  .map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.label}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          )}
          {isAdmin && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" size="icon" aria-label="Delete opportunity">
                <Trash2 className="h-4 w-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete this opportunity?</AlertDialogTitle>
                <AlertDialogDescription>
                  It will be moved to trash and can be restored within 30 days by an admin.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={softDelete}>Move to Trash</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          )}
        </div>
      </div>

      <WarningsList warnings={warnings} />

      <div className="grid md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Questions Due</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            <DeadlineChip
              deadline={opp.questionsDue}
              yellowDays={settings.deadlineYellowDays}
              redDays={settings.deadlineRedDays}
              showDate={false}
            />
            {qDual ? (
              <>
                <p className="text-sm">Agency: {qDual.agency}</p>
                <p className="text-xs text-muted-foreground">Local: {qDual.local}</p>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">Not set</p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Response Due</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            <DeadlineChip
              deadline={opp.responseDue}
              yellowDays={settings.deadlineYellowDays}
              redDays={settings.deadlineRedDays}
              showDate={false}
            />
            {rDual ? (
              <>
                <p className="text-sm">Agency: {rDual.agency}</p>
                <p className="text-xs text-muted-foreground">Local: {rDual.local}</p>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">Not set</p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Details</CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-1">
            <p>Type: <span className="font-medium">{opp.type?.toUpperCase()}</span></p>
            <p>Owner: <span className="font-medium">{opp.ownerName || "Unassigned"}</span></p>
            {opp.setAside && <p>Set-aside: <Badge variant="secondary">{opp.setAside}</Badge></p>}
            {opp.naicsCode && <p>NAICS: {opp.naicsCode}</p>}
            {opp.estimatedValue?.text && <p>Est. value: {opp.estimatedValue.text}</p>}
            {opp.bidNoBid?.decision && (
              <p>
                Decision: <Badge variant={opp.bidNoBid.decision === "bid" ? "default" : "destructive"}>{opp.bidNoBid.decision}</Badge>
                {opp.bidNoBid.reason && <span className="text-xs text-muted-foreground ml-1">({opp.bidNoBid.reason})</span>}
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {opp.description && (
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm whitespace-pre-wrap">{opp.description}</p>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="notes">
        <TabsList>
          <TabsTrigger value="notes">Notes ({opp.notes?.length || 0})</TabsTrigger>
          <TabsTrigger value="files">Files ({opp.files?.length || 0})</TabsTrigger>
          <TabsTrigger value="tasks">Tasks ({tasks.filter((t) => t.status === "open").length})</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
        </TabsList>
        <TabsContent value="notes" className="pt-4">
          <NotesThread
            opportunityId={id}
            notes={opp.notes || []}
            onNoteAdded={(n: CaptureNote) => setOpp((o) => (o ? { ...o, notes: [...(o.notes || []), n] } : o))}
            readOnly={!canWrite}
          />
        </TabsContent>
        <TabsContent value="files" className="pt-4">
          <FilesPanel
            opportunityId={id}
            files={opp.files || []}
            fileTags={settings.fileTags}
            onFileAdded={(f: CaptureFileRef) => setOpp((o) => (o ? { ...o, files: [...(o.files || []), f] } : o))}
            readOnly={!canWrite}
          />
        </TabsContent>
        <TabsContent value="tasks" className="pt-4">
          <TasksPanel opportunityId={id} tasks={tasks} onTasksChanged={setTasks} readOnly={!canWrite} />
        </TabsContent>
        <TabsContent value="activity" className="pt-4">
          {activities.length === 0 ? (
            <p className="text-sm text-muted-foreground">No activity recorded yet.</p>
          ) : (
            <div className="space-y-2">
              {activities.map((a) => (
                <div key={a.id} className="rounded-lg border p-3">
                  <p className="text-sm">{a.description}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {a.userId || "system"}
                    {a.createdAt ? ` · ${new Date(a.createdAt).toLocaleString()}` : ""}
                  </p>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <BidNoBidDialog
        open={gate?.kind === "bid-no-bid"}
        onOpenChange={(o) => !o && setGate(null)}
        opportunityTitle={opp.title}
        submitting={saving}
        onConfirm={(decision, reason) => {
          if (!gate) return;
          const target = decision === "no-bid" ? "closed" : gate.toStage;
          moveStage(target, { bidNoBid: { decision, reason } });
        }}
      />
      <SubmitDialog
        open={gate?.kind === "submit"}
        onOpenChange={(o) => !o && setGate(null)}
        files={opp.files || []}
        submitting={saving}
        onConfirm={(submittedAt, fileId) => {
          if (!gate) return;
          moveStage(gate.toStage, { submittedAt, finalSubmissionFileId: fileId });
        }}
      />
    </div>
  );
}
