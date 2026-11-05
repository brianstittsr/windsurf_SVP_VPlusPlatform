"use client";

import { useRequireAuth } from "@/lib/hooks/use-auth";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { toast } from "sonner";

export default function SettingsPage() {
  const { isLoading, isAuthenticated, profile } = useRequireAuth();
  const [prefs, setPrefs] = useState({
    emailProgress: true,
    emailCompletion: true,
    emailMarketing: false,
  });
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    // Preferences persist client-side for now; server persistence can be
    // added when notification templates are configured.
    localStorage.setItem("efvs_notification_prefs", JSON.stringify(prefs));
    setTimeout(() => {
      setSaving(false);
      toast.success("Preferences saved");
    }, 300);
  };

  if (isLoading || !isAuthenticated) {
    return <Skeleton className="h-64 w-full" />;
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold font-display">Settings</h1>
        <p className="text-muted-foreground">
          Account and notification preferences
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Account</CardTitle>
          <CardDescription>{profile.email}</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center gap-2">
          <Badge variant="secondary" className="capitalize">
            {profile.role}
          </Badge>
          {profile.isVeteran && (
            <Badge className="bg-[#1478ac]">Veteran</Badge>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Email Notifications</CardTitle>
          <CardDescription>
            Choose which emails you receive from the Academy
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {(
            [
              ["emailProgress", "Progress reminders"],
              ["emailCompletion", "Completion & certificate notices"],
              ["emailMarketing", "New course announcements"],
            ] as const
          ).map(([key, label]) => (
            <div key={key} className="flex items-center justify-between">
              <Label htmlFor={key} className="font-normal">
                {label}
              </Label>
              <Switch
                id={key}
                checked={prefs[key]}
                onCheckedChange={(v) =>
                  setPrefs((p) => ({ ...p, [key]: v }))
                }
              />
            </div>
          ))}
          <Button
            onClick={save}
            disabled={saving}
            className="bg-[#1478ac] hover:bg-[#318dc1]"
          >
            {saving ? "Saving…" : "Save Preferences"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
