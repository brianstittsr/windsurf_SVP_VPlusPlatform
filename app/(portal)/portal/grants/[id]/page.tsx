"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { GrantWizard } from "@/components/grants/grant-wizard";
import { captureJson, captureFetch } from "@/lib/capture/api-client";
import { GRANT_STAGES } from "@/lib/grants/stages";
import type {
  GrantDocumentDoc,
  GrantOpportunityDoc,
  GrantOrgProfileDoc,
  GrantQuestion,
  GrantRequirement,
  GrantStage,
} from "@/lib/schema";
import { ArrowLeft, Calendar, Download, ExternalLink, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useRequireAuth } from "@/lib/hooks/use-auth";

interface SerializedGrant extends Omit<GrantOpportunityDoc, "deadlineAt" | "createdAt" | "updatedAt" | "analyzedAt" | "submittedAt"> {
  deadlineAt?: string;
  submittedAt?: string;
}

interface DetailResponse {
  grant: SerializedGrant;
  orgProfile: GrantOrgProfileDoc | null;
  documents: GrantDocumentDoc[];
}

export default function GrantDetailPage() {
  const { isLoading: authLoading, isAuthenticated } = useRequireAuth(["admin", "instructor"]);
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [grant, setGrant] = useState<SerializedGrant | null>(null);
  const [orgProfiles, setOrgProfiles] = useState<GrantOrgProfileDoc[]>([]);
  const [documents, setDocuments] = useState<GrantDocumentDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [newReq, setNewReq] = useState("");
  const [newQ, setNewQ] = useState("");
  const [savingMeta, setSavingMeta] = useState(false);

  useEffect(() => {
    Promise.all([
      captureJson<DetailResponse>(`/api/grants/${id}`),
      captureJson<{ profiles: GrantOrgProfileDoc[] }>("/api/grants/org-profiles"),
    ])
      .then(([detail, profiles]) => {
        setGrant(detail.grant);
        setDocuments(detail.documents);
        setOrgProfiles(profiles.profiles);
      })
      .catch((e) => toast.error(e instanceof Error ? e.message : "Could not load grant"))
      .finally(() => setLoading(false));
  }, [id]);

  const patch = async (body: Record<string, unknown>): Promise<SerializedGrant | null> => {
    const { grant: updated } = await captureJson<{ grant: SerializedGrant }>(`/api/grants/${id}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    });
    setGrant(updated);
    return updated;
  };

  const saveMeta = async (fields: Record<string, unknown>) => {
    setSavingMeta(true);
    try {
      await patch(fields);
      toast.success("Saved");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not save");
    } finally {
      setSavingMeta(false);
    }
  };

  const addRequirement = async () => {
    if (!grant || !newReq.trim()) return;
    const requirements: GrantRequirement[] = [
      ...grant.requirements,
      { id: crypto.randomUUID(), text: newReq.trim(), met: false },
    ];
    setNewReq("");
    await patch({ requirements });
  };

  const toggleRequirement = async (reqId: string, met: boolean) => {
    if (!grant) return;
    await patch({ requirements: grant.requirements.map((r) => (r.id === reqId ? { ...r, met } : r)) });
  };

  const removeRequirement = async (reqId: string) => {
    if (!grant) return;
    await patch({ requirements: grant.requirements.filter((r) => r.id !== reqId) });
  };

  const addQuestion = async () => {
    if (!grant || !newQ.trim()) return;
    const questions: GrantQuestion[] = [
      ...grant.questions,
      { id: crypto.randomUUID(), text: newQ.trim(), required: true, status: "pending" },
    ];
    setNewQ("");
    await patch({ questions });
  };

  const removeQuestion = async (qid: string) => {
    if (!grant) return;
    await patch({ questions: grant.questions.filter((q) => q.id !== qid) });
  };

  const deleteGrant = async () => {
    const res = await captureFetch(`/api/grants/${id}`, { method: "DELETE" });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      toast.error((data as { error?: string }).error || "Could not delete");
      return;
    }
    toast.success("Grant deleted");
    router.push("/portal/grants");
  };

  if (loading) return <div className="p-6 text-muted-foreground">Loading grant…</div>;
  if (!grant) return <div className="p-6 text-muted-foreground">Grant not found.</div>;

  const answered = grant.questions.filter((q) => q.response).length;
  const reqsMet = grant.requirements.filter((r) => r.met).length;

  if (authLoading || !isAuthenticated) return <div className="p-6 text-muted-foreground">Loading...</div>;

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/portal/grants">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-xl font-bold leading-tight">{grant.title}</h1>
            <p className="text-sm text-muted-foreground">{grant.funder || "Unknown funder"}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Select value={grant.stage} onValueChange={(v) => patch({ stage: v as GrantStage })}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {GRANT_STAGES.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {grant.sourceUrl && (
            <Button variant="outline" size="sm" asChild>
              <a href={grant.sourceUrl} target="_blank" rel="noreferrer">
                <ExternalLink className="h-4 w-4 mr-1" /> Source
              </a>
            </Button>
          )}
          <Button variant="outline" size="sm" asChild>
            <a href={`/api/grants/${id}/export`} download>
              <Download className="h-4 w-4 mr-1" /> Export
            </a>
          </Button>
          <Button variant="destructive" size="sm" onClick={deleteGrant}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="flex gap-4 text-sm flex-wrap">
        {grant.deadlineAt && (
          <Badge variant="outline" className="gap-1.5">
            <Calendar className="h-3 w-3" />
            Due {new Date(grant.deadlineAt).toLocaleDateString()}
            {grant.calendarEventId && <span className="text-emerald-600">· on calendar</span>}
          </Badge>
        )}
        {grant.awardMax && <Badge variant="outline">Up to ${grant.awardMax.toLocaleString()}</Badge>}
        <Badge variant="outline">{answered}/{grant.questions.length} responses</Badge>
        <Badge variant="outline">{reqsMet}/{grant.requirements.length} requirements met</Badge>
      </div>

      <Tabs defaultValue="wizard">
        <TabsList>
          <TabsTrigger value="wizard">Wizard</TabsTrigger>
          <TabsTrigger value="requirements">Requirements ({grant.requirements.length})</TabsTrigger>
          <TabsTrigger value="responses">Responses ({answered}/{grant.questions.length})</TabsTrigger>
          <TabsTrigger value="overview">Overview</TabsTrigger>
        </TabsList>

        <TabsContent value="wizard" className="mt-4">
          <GrantWizard
            grant={grant}
            orgProfiles={orgProfiles}
            documents={documents}
            onGrantChange={setGrant}
            onProfilesChange={setOrgProfiles}
            onDocumentsChange={setDocuments}
          />
        </TabsContent>

        <TabsContent value="requirements" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Submission requirements</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {grant.requirements.map((r) => (
                <div key={r.id} className="flex items-start gap-3 border rounded-md p-3">
                  <Checkbox
                    checked={r.met}
                    onCheckedChange={(v) => toggleRequirement(r.id, v === true)}
                    className="mt-0.5"
                  />
                  <div className="flex-1">
                    <p className={`text-sm ${r.met ? "line-through text-muted-foreground" : ""}`}>{r.text}</p>
                    {r.notes && <p className="text-xs text-muted-foreground mt-1">{r.notes}</p>}
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => removeRequirement(r.id)}>
                    <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                  </Button>
                </div>
              ))}
              {grant.requirements.length === 0 && (
                <p className="text-sm text-muted-foreground">No requirements extracted — add them below.</p>
              )}
              <div className="flex gap-2 pt-2">
                <Input
                  placeholder="Add a requirement (e.g. 'Submit 501(c)(3) letter')"
                  value={newReq}
                  onChange={(e) => setNewReq(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addRequirement()}
                />
                <Button variant="outline" onClick={addRequirement} disabled={!newReq.trim()}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="responses" className="mt-4 space-y-3">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Application questions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {grant.questions.map((q) => (
                <div key={q.id} className="border rounded-md p-3 space-y-1.5">
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-sm font-medium">{q.text}</p>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge variant={q.response ? "default" : "outline"}>
                        {q.response ? q.status : "unanswered"}
                      </Badge>
                      <Button variant="ghost" size="sm" onClick={() => removeQuestion(q.id)}>
                        <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                      </Button>
                    </div>
                  </div>
                  {q.response && (
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap border-t pt-2 mt-2">
                      {q.response}
                    </p>
                  )}
                </div>
              ))}
              {grant.questions.length === 0 && (
                <p className="text-sm text-muted-foreground">No questions yet — add them below.</p>
              )}
              <div className="flex gap-2 pt-2">
                <Input
                  placeholder="Add a question manually"
                  value={newQ}
                  onChange={(e) => setNewQ(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addQuestion()}
                />
                <Button variant="outline" onClick={addQuestion} disabled={!newQ.trim()}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="overview" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Grant details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Title</Label>
                <Input
                  defaultValue={grant.title}
                  onBlur={(e) => e.target.value !== grant.title && saveMeta({ title: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Funder</Label>
                  <Input
                    defaultValue={grant.funder || ""}
                    onBlur={(e) => e.target.value !== (grant.funder || "") && saveMeta({ funder: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Deadline (syncs to calendar)</Label>
                  <Input
                    type="date"
                    defaultValue={grant.deadlineAt ? grant.deadlineAt.slice(0, 10) : ""}
                    onBlur={(e) => saveMeta({ deadlineAt: e.target.value || null })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  rows={3}
                  defaultValue={grant.description || ""}
                  onBlur={(e) => e.target.value !== (grant.description || "") && saveMeta({ description: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Eligibility</Label>
                <Textarea
                  rows={3}
                  defaultValue={grant.eligibility || ""}
                  onBlur={(e) => e.target.value !== (grant.eligibility || "") && saveMeta({ eligibility: e.target.value })}
                />
              </div>
              {grant.aiSummary && (
                <div className="space-y-2">
                  <Label>AI summary</Label>
                  <p className="text-sm text-muted-foreground border rounded-md p-3 bg-muted/30">{grant.aiSummary}</p>
                </div>
              )}
              {savingMeta && <p className="text-xs text-muted-foreground">Saving…</p>}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
