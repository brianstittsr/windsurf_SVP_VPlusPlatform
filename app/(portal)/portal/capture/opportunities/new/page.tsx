"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ClientPicker } from "@/components/capture/client-picker";
import { MemberPicker } from "@/components/capture/member-picker";
import { captureJson } from "@/lib/capture/api-client";
import type { CaptureOpportunity } from "@/lib/schema";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";

const SET_ASIDES = ["none", "8a", "hubzone", "sdvosb", "wosb", "mbe", "dbw", "unrestricted"];
const TYPES = ["rfi", "sources-sought", "rfp", "rfq", "grant"];

export default function NewOpportunityPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    clientId: "",
    title: "",
    solicitationNumber: "",
    type: "rfp",
    boardType: "standard",
    agency: "",
    naicsCode: "",
    setAside: "",
    description: "",
    questionsDue: "",
    responseDue: "",
    ownerId: "",
    ownerName: "",
    estValueText: "",
  });

  const [samLink, setSamLink] = useState("");
  const [importing, setImporting] = useState(false);
  const [imported, setImported] = useState<{ samNoticeId: string; samUrl?: string } | null>(null);

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const importFromSam = async () => {
    if (!samLink.trim()) return;
    setImporting(true);
    try {
      const { draft } = await captureJson<{
        draft: {
          samNoticeId: string;
          title?: string;
          solicitationNumber?: string;
          agency?: string;
          office?: string;
          type?: string;
          setAside?: string;
          naicsCode?: string;
          description?: string;
          responseDue?: { at: string; timezone: string };
          links?: { samUrl?: string };
        };
      }>("/api/capture/import/sam-link", {
        method: "POST",
        body: JSON.stringify({ url: samLink }),
      });
      setForm((f) => ({
        ...f,
        title: draft.title || f.title,
        solicitationNumber: draft.solicitationNumber || f.solicitationNumber,
        agency: draft.agency || f.agency,
        naicsCode: draft.naicsCode || f.naicsCode,
        setAside: draft.setAside || f.setAside,
        description: draft.description || f.description,
        responseDue: draft.responseDue?.at ? draft.responseDue.at.slice(0, 16) : f.responseDue,
      }));
      setImported({ samNoticeId: draft.samNoticeId, samUrl: draft.links?.samUrl });
      toast.success("Prefilled from SAM.gov — pick a client and review");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Import failed");
    } finally {
      setImporting(false);
    }
  };

  const create = async () => {
    if (!form.clientId || !form.title.trim() || !form.solicitationNumber.trim() || !form.agency.trim()) {
      toast.error("Client, title, solicitation number, and agency are required");
      return;
    }
    setSaving(true);
    try {
      const { opportunity } = await captureJson<{ opportunity: CaptureOpportunity }>("/api/capture/opportunities", {
        method: "POST",
        body: JSON.stringify({
          clientId: form.clientId,
          title: form.title.trim(),
          solicitationNumber: form.solicitationNumber.trim(),
          samNoticeId: imported?.samNoticeId || undefined,
          source: imported ? "imported" : "manual",
          links: imported?.samUrl ? { samUrl: imported.samUrl } : undefined,
          type: form.type,
          boardType: form.boardType,
          agency: form.agency.trim(),
          naicsCode: form.naicsCode || undefined,
          setAside: form.setAside || undefined,
          description: form.description || undefined,
          ownerId: form.ownerId || undefined,
          ownerName: form.ownerName || undefined,
          questionsDue: form.questionsDue
            ? { at: new Date(form.questionsDue).toISOString(), timezone: Intl.DateTimeFormat().resolvedOptions().timeZone }
            : undefined,
          responseDue: form.responseDue
            ? { at: new Date(form.responseDue).toISOString(), timezone: Intl.DateTimeFormat().resolvedOptions().timeZone }
            : undefined,
          estimatedValue: form.estValueText ? { text: form.estValueText } : undefined,
        }),
      });
      toast.success("Opportunity created");
      router.push(`/portal/capture/opportunities/${opportunity.id}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Create failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-3xl">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild aria-label="Back to board">
          <Link href="/portal/capture/board">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h1 className="text-2xl font-bold">New Capture Opportunity</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Import from SAM.gov</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-2">
            <Input
              value={samLink}
              onChange={(e) => setSamLink(e.target.value)}
              placeholder="Paste a SAM.gov notice URL or notice ID"
            />
            <Button variant="outline" onClick={importFromSam} disabled={importing || !samLink.trim()}>
              {importing ? "Fetching..." : "Import"}
            </Button>
          </div>
          {imported && (
            <p className="text-xs text-muted-foreground">
              Linked to notice {imported.samNoticeId}
              {imported.samUrl && (
                <>
                  {" — "}
                  <a href={imported.samUrl} target="_blank" rel="noreferrer" className="underline text-primary">
                    view on SAM.gov
                  </a>
                </>
              )}
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Client *</Label>
              <ClientPicker value={form.clientId} onChange={(id) => set("clientId", id)} />
            </div>
            <div className="space-y-2">
              <Label>Owner</Label>
              <MemberPicker
                value={form.ownerId}
                onChange={(id, m) => {
                  set("ownerId", id);
                  set("ownerName", m?.name || "");
                }}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Title *</Label>
            <Input value={form.title} onChange={(e) => set("title", e.target.value)} />
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Solicitation Number *</Label>
              <Input value={form.solicitationNumber} onChange={(e) => set("solicitationNumber", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Agency *</Label>
              <Input value={form.agency} onChange={(e) => set("agency", e.target.value)} />
            </div>
          </div>
          <div className="grid sm:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Type</Label>
              <Select value={form.type} onValueChange={(v) => set("type", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TYPES.map((t) => (
                    <SelectItem key={t} value={t}>{t.toUpperCase().replace("-", " ")}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Set-Aside</Label>
              <Select value={form.setAside || "none"} onValueChange={(v) => set("setAside", v === "none" ? "" : v)}>
                <SelectTrigger><SelectValue placeholder="None" /></SelectTrigger>
                <SelectContent>
                  {SET_ASIDES.map((s) => (
                    <SelectItem key={s} value={s}>{s === "none" ? "None" : s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>NAICS</Label>
              <Input value={form.naicsCode} onChange={(e) => set("naicsCode", e.target.value)} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Board Type</Label>
            <Select value={form.boardType} onValueChange={(v) => set("boardType", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="standard">Standard (with Bid/No-Bid gate)</SelectItem>
                <SelectItem value="rfi">RFI (no gate)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Questions Due</Label>
              <Input type="datetime-local" value={form.questionsDue} onChange={(e) => set("questionsDue", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Response Due</Label>
              <Input type="datetime-local" value={form.responseDue} onChange={(e) => set("responseDue", e.target.value)} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Estimated Value</Label>
            <Input value={form.estValueText} onChange={(e) => set("estValueText", e.target.value)} placeholder="e.g. $250k – $500k" />
          </div>
          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea value={form.description} onChange={(e) => set("description", e.target.value)} rows={4} />
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-3">
        <Button onClick={create} disabled={saving}>
          {saving ? "Creating..." : "Create Opportunity"}
        </Button>
        <Button variant="outline" asChild>
          <Link href="/portal/capture/board">Cancel</Link>
        </Button>
      </div>
    </div>
  );
}
