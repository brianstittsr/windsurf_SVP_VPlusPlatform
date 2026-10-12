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

const SET_ASIDES = ["", "8a", "hubzone", "sdvosb", "wosb", "mbe", "dbw", "unrestricted"];
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

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

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
              <Select value={form.setAside} onValueChange={(v) => set("setAside", v)}>
                <SelectTrigger><SelectValue placeholder="None" /></SelectTrigger>
                <SelectContent>
                  {SET_ASIDES.map((s) => (
                    <SelectItem key={s || "none"} value={s}>{s || "None"}</SelectItem>
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
