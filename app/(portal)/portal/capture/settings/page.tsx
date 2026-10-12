"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { captureJson } from "@/lib/capture/api-client";
import type { CaptureSettingsDoc } from "@/lib/schema";
import { Save } from "lucide-react";
import { toast } from "sonner";

export default function CaptureSettingsPage() {
  const [settings, setSettings] = useState<CaptureSettingsDoc | null>(null);
  const [forbidden, setForbidden] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ deadlineYellowDays: "7", deadlineRedDays: "3", expiryWarningDays: "90", fileTags: "" });

  useEffect(() => {
    captureJson<{ settings: CaptureSettingsDoc }>("/api/capture/settings")
      .then(({ settings: s }) => {
        setSettings(s);
        setForm({
          deadlineYellowDays: String(s.deadlineYellowDays),
          deadlineRedDays: String(s.deadlineRedDays),
          expiryWarningDays: String(s.expiryWarningDays),
          fileTags: s.fileTags.join(", "),
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

  return (
    <div className="p-6 space-y-6 max-w-2xl">
      <h1 className="text-2xl font-bold">Capture Settings</h1>
      {forbidden && (
        <p className="text-sm text-destructive">Admin access is required to change settings.</p>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Deadline Thresholds</CardTitle>
          <CardDescription>Days before a deadline to show yellow/red warnings.</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="yellow">Yellow (days)</Label>
            <Input id="yellow" type="number" min={1} value={form.deadlineYellowDays} onChange={(e) => setForm({ ...form, deadlineYellowDays: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="red">Red (days)</Label>
            <Input id="red" type="number" min={1} value={form.deadlineRedDays} onChange={(e) => setForm({ ...form, deadlineRedDays: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="expiry">Expiry warning (days)</Label>
            <Input id="expiry" type="number" min={1} value={form.expiryWarningDays} onChange={(e) => setForm({ ...form, expiryWarningDays: e.target.value })} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">File Tags</CardTitle>
          <CardDescription>Allowed tags for uploaded opportunity files (comma-separated).</CardDescription>
        </CardHeader>
        <CardContent>
          <Input value={form.fileTags} onChange={(e) => setForm({ ...form, fileTags: e.target.value })} />
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

      <Button onClick={save} disabled={saving || forbidden}>
        <Save className="h-4 w-4 mr-2" />
        {saving ? "Saving..." : "Save Settings"}
      </Button>
    </div>
  );
}
