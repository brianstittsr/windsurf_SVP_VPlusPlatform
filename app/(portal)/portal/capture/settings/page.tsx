"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { captureJson } from "@/lib/capture/api-client";
import { useUserProfile } from "@/contexts/user-profile-context";
import type { CaptureSettingsDoc } from "@/lib/schema";
import { Save } from "lucide-react";
import { toast } from "sonner";

export default function CaptureSettingsPage() {
  const { profile } = useUserProfile();
  const isAdmin = profile.role === "admin";
  const [settings, setSettings] = useState<CaptureSettingsDoc | null>(null);
  const [forbidden, setForbidden] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    deadlineYellowDays: "7",
    deadlineRedDays: "3",
    expiryWarningDays: "90",
    fileTags: "",
    alertDays: "7, 3, 1",
    expiryAlertDays: "90, 60, 30",
    matchScoreCutoff: "60",
    wNaics: "25",
    wSetAside: "20",
    wKeywords: "25",
    wPsc: "10",
    wAgency: "10",
    wValue: "10",
    bidCutoff: "70",
    noBidCutoff: "50",
    mustHaves: "",
    weightedQs: "",
  });

  useEffect(() => {
    captureJson<{ settings: CaptureSettingsDoc }>("/api/capture/settings")
      .then(({ settings: s }) => {
        setSettings(s);
        setForm({
          deadlineYellowDays: String(s.deadlineYellowDays),
          deadlineRedDays: String(s.deadlineRedDays),
          expiryWarningDays: String(s.expiryWarningDays),
          fileTags: s.fileTags.join(", "),
          alertDays: (s.alertDays || [7, 3, 1]).join(", "),
          expiryAlertDays: (s.expiryAlertDays || [90, 60, 30]).join(", "),
          matchScoreCutoff: String(s.matchScoreCutoff ?? 60),
          wNaics: String(s.matchWeights?.naics ?? 25),
          wSetAside: String(s.matchWeights?.setAside ?? 20),
          wKeywords: String(s.matchWeights?.keywords ?? 25),
          wPsc: String(s.matchWeights?.psc ?? 10),
          wAgency: String(s.matchWeights?.agency ?? 10),
          wValue: String(s.matchWeights?.value ?? 10),
          bidCutoff: String(s.scorecard?.bidCutoff ?? 70),
          noBidCutoff: String(s.scorecard?.noBidCutoff ?? 50),
          mustHaves: (s.scorecard?.mustHaves || []).join("\n"),
          weightedQs: (s.scorecard?.weighted || []).map((q) => `${q.question} | ${q.weight}`).join("\n"),
        });
      })
      .catch((e) => toast.error(e.message));
  }, []);

  const save = async () => {
    setSaving(true);
    try {
      const { settings: s } = await captureJson<{ settings: CaptureSettingsDoc }>("/api/capture/settings", {
        method: "PATCH",
        body: JSON.stringify({
          deadlineYellowDays: Number(form.deadlineYellowDays),
          deadlineRedDays: Number(form.deadlineRedDays),
          expiryWarningDays: Number(form.expiryWarningDays),
          fileTags: form.fileTags.split(",").map((t) => t.trim()).filter(Boolean),
          alertDays: form.alertDays.split(",").map((t) => Number(t.trim())).filter((n) => Number.isFinite(n)),
          expiryAlertDays: form.expiryAlertDays.split(",").map((t) => Number(t.trim())).filter((n) => Number.isFinite(n) && n > 0),
          matchScoreCutoff: Number(form.matchScoreCutoff),
          matchWeights: {
            naics: Number(form.wNaics),
            setAside: Number(form.wSetAside),
            keywords: Number(form.wKeywords),
            psc: Number(form.wPsc),
            agency: Number(form.wAgency),
            value: Number(form.wValue),
          },
          scorecard: {
            mustHaves: form.mustHaves.split("\n").map((t) => t.trim()).filter(Boolean),
            weighted: form.weightedQs
              .split("\n")
              .map((line) => line.trim())
              .filter(Boolean)
              .map((line) => {
                const [question, w] = line.split("|").map((s) => s.trim());
                return { question, weight: Number(w) || 1 };
              })
              .filter((q) => q.question),
            bidCutoff: Number(form.bidCutoff),
            noBidCutoff: Number(form.noBidCutoff),
          },
        }),
      });
      setSettings(s);
      toast.success("Settings saved");
    } catch (e) {
      if (e instanceof Error && e.message.toLowerCase().includes("forbidden")) {
        setForbidden(true);
      }
      toast.error(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  if (!settings) return <div className="p-6 text-muted-foreground">Loading settings...</div>;

  const disabled = !isAdmin || forbidden;

  return (
    <div className="p-6 space-y-6 max-w-3xl">
      <h1 className="text-2xl font-bold">Capture Settings</h1>
      {disabled && (
        <p className="text-sm text-muted-foreground">Admin access is required to change settings.</p>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Deadline Thresholds</CardTitle>
          <CardDescription>Days before a deadline to show yellow/red warnings.</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="yellow">Yellow (days)</Label>
            <Input id="yellow" type="number" min={1} value={form.deadlineYellowDays} onChange={(e) => setForm({ ...form, deadlineYellowDays: e.target.value })} disabled={disabled} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="red">Red (days)</Label>
            <Input id="red" type="number" min={1} value={form.deadlineRedDays} onChange={(e) => setForm({ ...form, deadlineRedDays: e.target.value })} disabled={disabled} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="expiry">Expiry warning (days)</Label>
            <Input id="expiry" type="number" min={1} value={form.expiryWarningDays} onChange={(e) => setForm({ ...form, expiryWarningDays: e.target.value })} disabled={disabled} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">File Tags</CardTitle>
          <CardDescription>Allowed tags for uploaded opportunity files (comma-separated).</CardDescription>
        </CardHeader>
        <CardContent>
          <Input value={form.fileTags} onChange={(e) => setForm({ ...form, fileTags: e.target.value })} disabled={disabled} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Alert Windows</CardTitle>
          <CardDescription>Days before deadlines / expiries that trigger alert emails (comma-separated).</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="alertDays">Deadline alerts (days)</Label>
            <Input id="alertDays" value={form.alertDays} onChange={(e) => setForm({ ...form, alertDays: e.target.value })} disabled={disabled} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="expiryAlerts">SAM/cert expiry alerts (days)</Label>
            <Input id="expiryAlerts" value={form.expiryAlertDays} onChange={(e) => setForm({ ...form, expiryAlertDays: e.target.value })} disabled={disabled} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Match Scoring</CardTitle>
          <CardDescription>Weights must sum to 100. Notices at or above the cutoff enter the Match Queue.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
            {(["wNaics", "wSetAside", "wKeywords", "wPsc", "wAgency", "wValue"] as const).map((k) => (
              <div key={k} className="space-y-1">
                <Label className="text-xs">{k.slice(1)}</Label>
                <Input type="number" min={0} value={form[k]} onChange={(e) => setForm({ ...form, [k]: e.target.value })} disabled={disabled} />
              </div>
            ))}
          </div>
          <div className="w-40 space-y-2">
            <Label htmlFor="cutoff">Queue cutoff (%)</Label>
            <Input id="cutoff" type="number" min={0} max={100} value={form.matchScoreCutoff} onChange={(e) => setForm({ ...form, matchScoreCutoff: e.target.value })} disabled={disabled} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Bid/No-Bid Scorecard</CardTitle>
          <CardDescription>
            One must-have question per line. Weighted questions as &quot;Question | weight&quot; per line.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="bidCutoff">Bid cutoff (%)</Label>
              <Input id="bidCutoff" type="number" min={0} max={100} value={form.bidCutoff} onChange={(e) => setForm({ ...form, bidCutoff: e.target.value })} disabled={disabled} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="noBidCutoff">No-bid cutoff (%)</Label>
              <Input id="noBidCutoff" type="number" min={0} max={100} value={form.noBidCutoff} onChange={(e) => setForm({ ...form, noBidCutoff: e.target.value })} disabled={disabled} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Must-haves (unchecked = suggested no-bid)</Label>
            <Textarea rows={4} value={form.mustHaves} onChange={(e) => setForm({ ...form, mustHaves: e.target.value })} disabled={disabled} />
          </div>
          <div className="space-y-2">
            <Label>Weighted questions (1–5 scale)</Label>
            <Textarea rows={6} value={form.weightedQs} onChange={(e) => setForm({ ...form, weightedQs: e.target.value })} disabled={disabled} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Pipeline Stages</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="text-sm text-muted-foreground">
            Standard: {settings.standardStages.map((s) => s.label).join(" → ")}
          </p>
          <p className="text-sm text-muted-foreground">
            RFI: {settings.rfiStages.map((s) => s.label).join(" → ")}
          </p>
        </CardContent>
      </Card>

      {!disabled && (
        <Button onClick={save} disabled={saving}>
          <Save className="h-4 w-4 mr-2" />
          {saving ? "Saving..." : "Save Settings"}
        </Button>
      )}
    </div>
  );
}
