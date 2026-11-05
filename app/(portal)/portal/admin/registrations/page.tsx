"use client";

import { useCallback, useEffect, useState } from "react";
import { auth } from "@/lib/firebase";
import { useRequireAuth } from "@/lib/hooks/use-auth";
import type { RegistrationSubmissionDoc } from "@/lib/schema";
import { logAudit } from "@/lib/activity-logger";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import { Download, Loader2, RefreshCw, ShieldCheck } from "lucide-react";

interface RegistrationListResponse { data?: RegistrationSubmissionDoc[]; error?: string }
interface ReviewResponse { data?: { decision: string; inviteUrl?: string; invitationEmailConfigured: boolean }; error?: string }

function displayValue(value: unknown): string {
  if (value === null || value === undefined) return "—";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (Array.isArray(value)) return value.map(displayValue).join(", ");
  if (typeof value === "object") return Object.entries(value as Record<string, unknown>).map(([key, item]) => `${key}: ${displayValue(item)}`).join(" · ");
  return String(value);
}

function money(cents: number): string { return `$${(cents / 100).toFixed(2)}`; }
function affirmsVeteran(value: unknown): boolean { return value === true || (typeof value === "string" && ["yes", "veteran", "military", "true"].includes(value.toLowerCase())); }

export default function AdminRegistrationsPage() {
  const { isLoading, isAuthenticated, profile } = useRequireAuth(["admin"]);
  const [rows, setRows] = useState<RegistrationSubmissionDoc[]>([]);
  const [selected, setSelected] = useState<RegistrationSubmissionDoc | null>(null);
  const [notes, setNotes] = useState("");
  const [veteranVerified, setVeteranVerified] = useState(false);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [inviteUrl, setInviteUrl] = useState("");
  const [error, setError] = useState("");

  const getToken = useCallback(async () => {
    if (!auth?.currentUser) throw new Error("Your session ended. Sign in again.");
    return auth.currentUser.getIdToken();
  }, []);

  const load = useCallback(async () => {
    const token = await getToken();
    const response = await fetch("/api/admin/registrations", { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" });
    const result = (await response.json()) as RegistrationListResponse;
    if (!response.ok) throw new Error(result.error || "Unable to load registrations");
    setRows(result.data || []);
    setSelected((current) => current ? (result.data || []).find((item) => item.id === current.id) || null : null);
  }, [getToken]);

  useEffect(() => {
    if (!isAuthenticated) return;
    let active = true;
    void load().catch((reason: unknown) => { if (active) setError(reason instanceof Error ? reason.message : "Unable to load registrations"); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [isAuthenticated, load]);

  const review = async (decision: "approve" | "sponsor" | "needs_information" | "reject") => {
    if (!selected) return;
    setWorking(true);
    setError("");
    setInviteUrl("");
    try {
      const token = await getToken();
      const response = await fetch(`/api/admin/registrations/${selected.id}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ decision, notes, veteranStatusVerified: veteranVerified }),
      });
      const result = (await response.json()) as ReviewResponse;
      if (!response.ok) throw new Error(result.error || "Review action failed");
      if (result.data?.inviteUrl) setInviteUrl(result.data.inviteUrl);
      await logAudit({
        actorId: profile.id,
        actorEmail: profile.email,
        action: `registration.${decision}`,
        entityType: "registration",
        entityId: selected.id,
        metadata: { sponsored: decision === "sponsor" },
      });
      toast.success(decision === "sponsor" ? "Sponsorship approved" : `Registration ${decision.replaceAll("_", " ")}`);
      await load();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Review action failed");
    } finally {
      setWorking(false);
    }
  };

  const downloadDocument = async (fieldId: string, fileName: string) => {
    if (!selected) return;
    try {
      const token = await getToken();
      const response = await fetch(`/api/admin/registrations/${selected.id}/documents/${encodeURIComponent(fieldId)}`, { headers: { Authorization: `Bearer ${token}` } });
      if (!response.ok) throw new Error("Unable to download document");
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = fileName;
      anchor.click();
      URL.revokeObjectURL(url);
    } catch (reason) {
      toast.error(reason instanceof Error ? reason.message : "Unable to download document");
    }
  };

  const veteranField = selected?.formSnapshot.find((field) => field.purpose === "veteranStatus");
  const veteranClaimed = veteranField ? affirmsVeteran(selected?.answers[veteranField.id]) : false;

  if (isLoading || !isAuthenticated || loading) return <Skeleton className="h-96 w-full" />;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div><h1 className="font-display text-3xl font-bold">Registration Review</h1><p className="text-muted-foreground">Review signed submissions before account invitations and checkout.</p></div>
        <Button variant="outline" onClick={() => void load()}><RefreshCw className="mr-2 h-4 w-4" />Refresh</Button>
      </div>
      {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}
      {inviteUrl && <Alert><AlertDescription><span className="block font-semibold">Email delivery is unavailable; copy this one-time invitation and send it securely to the applicant.</span><span className="mt-2 block break-all font-mono text-xs">{inviteUrl}</span></AlertDescription></Alert>}
      <div className="grid gap-6 xl:grid-cols-[minmax(280px,0.8fr)_minmax(0,1.6fr)]">
        <Card className="h-fit">
          <CardHeader><CardTitle className="font-display">Submissions ({rows.length})</CardTitle><CardDescription>Newest first</CardDescription></CardHeader>
          <CardContent className="space-y-2">
            {rows.map((row) => <button key={row.id} type="button" onClick={() => { setSelected(row); setNotes(row.reviewerNotes || ""); setVeteranVerified(row.veteranStatusVerified === true); setInviteUrl(""); }} className={`w-full rounded-md border p-3 text-left ${selected?.id === row.id ? "border-[#1478ac] bg-[#e9f3f8]" : "hover:bg-muted/40"}`}>
              <span className="flex items-center justify-between gap-2 font-medium"><span>{row.fullName}</span><Badge variant={row.status === "paid" ? "default" : row.status === "rejected" ? "destructive" : "outline"}>{row.status.replaceAll("_", " ")}</Badge></span>
              <span className="mt-1 block truncate text-xs text-muted-foreground">{row.email}</span>
              <span className="mt-1 block text-xs text-muted-foreground">{row.submittedAt?.toDate?.().toLocaleString() || "—"}</span>
            </button>)}
            {rows.length === 0 && <p className="py-8 text-center text-sm text-muted-foreground">No registration submissions yet.</p>}
          </CardContent>
        </Card>

        {selected ? <Card>
          <CardHeader><div className="flex flex-wrap items-start justify-between gap-3"><div><CardTitle className="font-display">{selected.fullName}</CardTitle><CardDescription>{selected.email} · {selected.phone || "No phone"} · {selected.company || "No company"}</CardDescription></div><Badge variant="secondary">Form v{selected.formVersion}</Badge></div></CardHeader>
          <CardContent className="space-y-5">
            <section><h2 className="mb-2 font-semibold">Registration answers</h2><dl className="grid gap-3 sm:grid-cols-2">{selected.formSnapshot.filter((field) => field.type !== "section" && field.type !== "paragraph" && field.type !== "signature" && field.type !== "file").map((field) => <div key={field.id} className="rounded border p-3"><dt className="text-xs font-medium text-muted-foreground">{field.label}</dt><dd className="mt-1 break-words text-sm">{displayValue(selected.answers[field.id])}</dd></div>)}</dl></section>
            <section><h2 className="mb-2 font-semibold">Selected courses · {money(selected.totalCents)}</h2><ul className="space-y-2">{selected.selectedCoursesSnapshot.map((course) => <li key={course.courseId} className="flex justify-between gap-3 rounded border p-3 text-sm"><span><strong>{course.code} — {course.title}</strong><span className="block text-xs text-muted-foreground">{course.description}</span></span><span className="shrink-0 font-semibold">{money(course.priceCents)}</span></li>)}</ul></section>
            <section><h2 className="mb-2 font-semibold">Signed record and attachments</h2><div className="space-y-2">{selected.attachments?.map((file) => <div key={file.storagePath} className="flex flex-wrap items-center justify-between gap-2 rounded border p-3 text-sm"><span>{file.displayName} <span className="text-xs text-muted-foreground">· {file.fileName} · {(file.sizeBytes / 1024).toFixed(0)} KB</span></span><Button size="sm" variant="outline" onClick={() => void downloadDocument(file.fieldId, file.fileName)}><Download className="mr-2 h-4 w-4" />Download</Button></div>)}</div><p className="mt-2 flex gap-2 text-xs text-muted-foreground"><ShieldCheck className="h-4 w-4 shrink-0" />Signed content is versioned and stored privately. Card or bank details are not collected here.</p></section>
            {veteranClaimed && <div className="flex items-start gap-3 rounded-md border border-[#d9d8ce] p-3"><Checkbox id="verify-veteran" checked={veteranVerified} onCheckedChange={(checked) => setVeteranVerified(checked === true)} /><Label htmlFor="verify-veteran" className="text-sm font-normal">I have verified the applicant’s veteran eligibility; enable veteran discount eligibility on their Academy profile.</Label></div>}
            <div className="space-y-2"><Label htmlFor="review-notes">Internal review notes</Label><Textarea id="review-notes" rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={4000} /></div>
            <div className="flex flex-wrap gap-2">
              <Button disabled={working || ["paid", "rejected", "cancelled"].includes(selected.status)} onClick={() => void review("approve")} className="bg-[#1478ac] hover:bg-[#318dc1]">{working ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}Approve · payment required</Button>
              <Button disabled={working || ["paid", "rejected", "cancelled"].includes(selected.status)} onClick={() => void review("sponsor")} variant="outline">Approve sponsored enrollment</Button>
              <Button disabled={working || ["paid", "rejected", "cancelled"].includes(selected.status)} onClick={() => void review("needs_information")} variant="outline">Request information</Button>
              <Button disabled={working || ["paid", "rejected", "cancelled"].includes(selected.status)} onClick={() => void review("reject")} variant="destructive">Reject</Button>
            </div>
            {selected.signatures.map((signature) => <p key={signature.fieldId} className="text-xs text-muted-foreground">Signed by {signature.typedName} at {signature.signedAt?.toDate?.().toLocaleString()} · form hash {signature.formSnapshotHash.slice(0, 16)}…</p>)}
          </CardContent>
        </Card> : <Card><CardContent className="py-16 text-center text-muted-foreground">Select a registration to review.</CardContent></Card>}
      </div>
    </div>
  );
}
