"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { captureFetch, captureJson } from "@/lib/capture/api-client";
import type { GrantDocumentDoc, GrantOpportunityDoc, GrantOrgProfileDoc, GrantQuestion } from "@/lib/schema";
import { Check, CheckCircle2, ChevronRight, FileText, Globe, Loader2, Sparkles, Upload } from "lucide-react";
import { toast } from "sonner";

interface SerializedGrant extends Omit<GrantOpportunityDoc, "deadlineAt" | "createdAt" | "updatedAt" | "analyzedAt" | "submittedAt"> {
  deadlineAt?: string;
}

interface WizardProps {
  grant: SerializedGrant;
  orgProfiles: GrantOrgProfileDoc[];
  documents: GrantDocumentDoc[];
  onGrantChange: (g: SerializedGrant) => void;
  onProfilesChange: (p: GrantOrgProfileDoc[]) => void;
  onDocumentsChange: (d: GrantDocumentDoc[]) => void;
}

const STATUS_BADGE: Record<GrantQuestion["status"], { label: string; variant: "secondary" | "default" | "outline" }> = {
  pending: { label: "Pending", variant: "outline" },
  drafted: { label: "Drafted", variant: "secondary" },
  accepted: { label: "Accepted", variant: "default" },
  edited: { label: "Edited", variant: "default" },
};

export function GrantWizard({ grant, orgProfiles, documents, onGrantChange, onProfilesChange, onDocumentsChange }: WizardProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [orgUrl, setOrgUrl] = useState("");
  const [buildingOrg, setBuildingOrg] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [currentQ, setCurrentQ] = useState(() => {
    const first = grant.questions.findIndex((q) => !q.response);
    return first === -1 ? 0 : first;
  });
  const [drafting, setDrafting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editText, setEditText] = useState("");

  const question = grant.questions[currentQ];
  const answered = grant.questions.filter((q) => q.response).length;
  const total = grant.questions.length;
  const orgProfile = orgProfiles.find((p) => p.id === grant.orgProfileId);

  const attachProfile = async (profileId: string) => {
    try {
      const { grant: updated } = await captureJson<{ grant: SerializedGrant }>(`/api/grants/${grant.id}`, {
        method: "PATCH",
        body: JSON.stringify({ orgProfileId: profileId }),
      });
      onGrantChange(updated);
      toast.success("Organization profile attached");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not attach profile");
    }
  };

  const buildOrgProfile = async () => {
    if (!orgUrl.trim()) return;
    setBuildingOrg(true);
    try {
      const { profile } = await captureJson<{ profile: GrantOrgProfileDoc }>("/api/grants/org-profiles", {
        method: "POST",
        body: JSON.stringify({ websiteUrl: orgUrl.trim() }),
      });
      onProfilesChange([profile, ...orgProfiles]);
      await attachProfile(profile.id);
      setOrgUrl("");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not analyze website");
    } finally {
      setBuildingOrg(false);
    }
  };

  const uploadFile = async (file: File) => {
    setUploading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await captureFetch(`/api/grants/${grant.id}/documents`, { method: "POST", body: form });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error((data as { error?: string }).error || "Upload failed");
      onDocumentsChange([data.document, ...documents]);
      toast.success(`${file.name} converted to markdown`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const generateDraft = async () => {
    if (!question) return;
    setDrafting(true);
    try {
      const { aiDraft } = await captureJson<{ aiDraft: string }>(
        `/api/grants/${grant.id}/questions/${question.id}/draft`,
        { method: "POST" }
      );
      onGrantChange({
        ...grant,
        questions: grant.questions.map((q) => (q.id === question.id ? { ...q, aiDraft, status: "drafted" } : q)),
      });
      setEditText(aiDraft);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Drafting failed");
    } finally {
      setDrafting(false);
    }
  };

  const saveResponse = async (text: string) => {
    if (!question) return;
    setSaving(true);
    try {
      const result = await captureJson<{ status: string }>(
        `/api/grants/${grant.id}/questions/${question.id}/respond`,
        { method: "POST", body: JSON.stringify({ response: text, accept: true }) }
      );
      const updatedQuestions = grant.questions.map((q) =>
        q.id === question.id ? { ...q, response: text, status: result.status as GrantQuestion["status"] } : q
      );
      onGrantChange({ ...grant, questions: updatedQuestions });
      setEditText("");
      const next = updatedQuestions.findIndex((q) => !q.response);
      if (next !== -1 && next !== currentQ) setCurrentQ(next);
      toast.success("Response saved");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not save response");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {/* Left column: inputs */}
      <div className="space-y-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Globe className="h-4 w-4" /> Organization profile
            </CardTitle>
            <CardDescription>Analyze a company or nonprofit website to feed the AI.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Select value={grant.orgProfileId || ""} onValueChange={attachProfile}>
              <SelectTrigger>
                <SelectValue placeholder="Select a profile…" />
              </SelectTrigger>
              <SelectContent>
                {orgProfiles.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {orgProfile && (
              <div className="text-xs space-y-1 border rounded-md p-2 bg-muted/40">
                {orgProfile.mission && <p className="line-clamp-2"><span className="font-medium">Mission:</span> {orgProfile.mission}</p>}
                {orgProfile.productsServices?.length ? (
                  <p className="line-clamp-2"><span className="font-medium">Products/Services:</span> {orgProfile.productsServices.slice(0, 5).join(", ")}</p>
                ) : null}
              </div>
            )}
            <div className="flex gap-2">
              <Input
                placeholder="https://org-website.org"
                value={orgUrl}
                onChange={(e) => setOrgUrl(e.target.value)}
              />
              <Button variant="outline" size="sm" onClick={buildOrgProfile} disabled={buildingOrg || !orgUrl.trim()}>
                {buildingOrg ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">Paste a website URL to create a new profile.</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="h-4 w-4" /> Input documents
            </CardTitle>
            <CardDescription>PDF, DOCX, images, or text — converted to markdown.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <input
              ref={fileRef}
              type="file"
              className="hidden"
              accept=".pdf,.docx,.txt,.md,.csv,.png,.jpg,.jpeg,.webp"
              onChange={(e) => e.target.files?.[0] && uploadFile(e.target.files[0])}
            />
            <Button variant="outline" size="sm" className="w-full" onClick={() => fileRef.current?.click()} disabled={uploading}>
              {uploading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Upload className="h-4 w-4 mr-2" />}
              {uploading ? "Converting…" : "Upload document"}
            </Button>
            <div className="space-y-1">
              {documents.map((d) => (
                <div key={d.id} className="flex items-center justify-between text-xs border rounded px-2 py-1.5">
                  <span className="truncate max-w-[180px]">{d.fileName}</span>
                  <Badge variant={d.status === "converted" ? "secondary" : d.status === "failed" ? "destructive" : "outline"}>
                    {d.status}
                  </Badge>
                </div>
              ))}
              {documents.length === 0 && <p className="text-xs text-muted-foreground">No documents yet.</p>}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Right column: question loop */}
      <div className="lg:col-span-2 space-y-4">
        {total === 0 ? (
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              No application questions extracted yet. Analyze a grant URL or add questions on the Overview tab.
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">
                  {answered} of {total} questions answered
                </span>
                <span className="text-muted-foreground">
                  Question {currentQ + 1}/{total}
                </span>
              </div>
              <Progress value={total ? (answered / total) * 100 : 0} />
              <div className="flex gap-1 flex-wrap">
                {grant.questions.map((q, i) => (
                  <button
                    key={q.id}
                    onClick={() => {
                      setCurrentQ(i);
                      setEditText("");
                    }}
                    className={`h-7 min-w-7 px-1.5 rounded text-xs font-medium border transition-colors ${
                      i === currentQ
                        ? "bg-primary text-primary-foreground"
                        : q.response
                          ? "bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300"
                          : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {q.response ? <Check className="h-3 w-3 inline" /> : i + 1}
                  </button>
                ))}
              </div>
            </div>

            {question && (
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-3">
                    <CardTitle className="text-base leading-snug">{question.text}</CardTitle>
                    <Badge variant={STATUS_BADGE[question.status].variant}>{STATUS_BADGE[question.status].label}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {!question.aiDraft && !question.response ? (
                    <div className="flex flex-col items-center gap-3 py-6 text-center">
                      <p className="text-sm text-muted-foreground">
                        Generate an AI draft using the organization profile and uploaded documents.
                      </p>
                      <Button onClick={generateDraft} disabled={drafting}>
                        {drafting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Sparkles className="h-4 w-4 mr-2" />}
                        {drafting ? "Drafting…" : "Generate AI response"}
                      </Button>
                      {!orgProfile && documents.filter((d) => d.status === "converted").length === 0 && (
                        <p className="text-xs text-amber-600">
                          No org profile or documents attached — the draft will be generic.
                        </p>
                      )}
                    </div>
                  ) : (
                    <>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label>Response</Label>
                          <Button variant="ghost" size="sm" onClick={generateDraft} disabled={drafting}>
                            {drafting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                            <span className="ml-1.5 text-xs">Regenerate</span>
                          </Button>
                        </div>
                        <Textarea
                          rows={12}
                          value={editText || question.response || question.aiDraft || ""}
                          onChange={(e) => setEditText(e.target.value)}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={currentQ === 0}
                          onClick={() => setCurrentQ((c) => Math.max(0, c - 1))}
                        >
                          Previous
                        </Button>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => saveResponse(editText || question.response || question.aiDraft || "")}
                            disabled={saving}
                          >
                            {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <CheckCircle2 className="h-4 w-4 mr-2" />}
                            {question.response ? "Save changes" : "Accept response"}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={currentQ >= total - 1}
                            onClick={() => setCurrentQ((c) => Math.min(total - 1, c + 1))}
                          >
                            Next <ChevronRight className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </div>
  );
}
