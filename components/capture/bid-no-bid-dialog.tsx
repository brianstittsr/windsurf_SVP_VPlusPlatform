"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { captureJson } from "@/lib/capture/api-client";
import type { CaptureScorecardConfig } from "@/lib/schema";

export interface BidNoBidPayload {
  decision: "bid" | "no-bid";
  reason: string;
  score?: number;
  suggestedDecision?: "bid" | "no-bid";
  scorecard?: {
    mustHaveAnswers: Record<string, boolean>;
    weightedAnswers: Record<string, number>;
  };
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  opportunityTitle?: string;
  onConfirm: (payload: BidNoBidPayload) => void;
  submitting?: boolean;
}

interface SettingsResponse {
  settings: { scorecard?: CaptureScorecardConfig };
}

/** Rule 2: Bid/No-Bid decision gate dialog with scorecard (admin records it). */
export function BidNoBidDialog({ open, onOpenChange, opportunityTitle, onConfirm, submitting }: Props) {
  const [decision, setDecision] = useState<"bid" | "no-bid">("bid");
  const [reason, setReason] = useState("");
  const [config, setConfig] = useState<CaptureScorecardConfig | null>(null);
  const [mustHaves, setMustHaves] = useState<Record<string, boolean>>({});
  const [weighted, setWeighted] = useState<Record<string, number>>({});

  useEffect(() => {
    if (!open) return;
    captureJson<SettingsResponse>("/api/capture/settings")
      .then((d) => setConfig(d.settings?.scorecard || null))
      .catch(() => setConfig(null));
  }, [open]);

  const score = useMemo(() => {
    if (!config) return null;
    let earned = 0;
    let possible = 0;
    for (const q of config.weighted) {
      possible += q.weight;
      const a = weighted[q.question];
      if (a) earned += (a / 5) * q.weight;
    }
    if (possible === 0) return null;
    return Math.round((earned / possible) * 100);
  }, [config, weighted]);

  const suggested = useMemo((): "bid" | "no-bid" | null => {
    if (!config) return null;
    if (config.mustHaves.some((m) => mustHaves[m] === false)) return "no-bid";
    if (score === null) return null;
    if (score >= config.bidCutoff) return "bid";
    if (score <= config.noBidCutoff) return "no-bid";
    return null;
  }, [config, mustHaves, score]);

  const handleConfirm = () => {
    const scorecard =
      config && (Object.keys(mustHaves).length || Object.keys(weighted).length)
        ? { mustHaveAnswers: mustHaves, weightedAnswers: weighted }
        : undefined;
    onConfirm({
      decision,
      reason,
      ...(score !== null && { score }),
      ...(suggested && { suggestedDecision: suggested }),
      ...(scorecard && { scorecard }),
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Bid / No-Bid Decision</DialogTitle>
          <DialogDescription>
            A decision is required before moving {opportunityTitle ? `"${opportunityTitle}" ` : "this opportunity "}
            past the gate.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {config && (config.mustHaves.length > 0 || config.weighted.length > 0) && (
            <div className="rounded-md border p-3 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold">Scorecard</h4>
                {score !== null && (
                  <Badge variant={suggested === "bid" ? "default" : suggested === "no-bid" ? "destructive" : "secondary"}>
                    {score}% {suggested ? `→ ${suggested === "bid" ? "Bid" : "No-Bid"}` : ""}
                  </Badge>
                )}
              </div>
              {config.mustHaves.map((m) => (
                <div key={m} className="flex items-start gap-2">
                  <Checkbox
                    id={`mh-${m}`}
                    checked={mustHaves[m] === true}
                    onCheckedChange={(v) => setMustHaves((s) => ({ ...s, [m]: v === true }))}
                  />
                  <Label htmlFor={`mh-${m}`} className="text-sm font-normal leading-tight cursor-pointer">
                    {m}
                  </Label>
                </div>
              ))}
              {config.weighted.map((q) => (
                <div key={q.question} className="space-y-1">
                  <div className="flex justify-between">
                    <Label className="text-sm font-normal">{q.question}</Label>
                    <span className="text-xs text-muted-foreground">w{q.weight}</span>
                  </div>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <Button
                        key={n}
                        type="button"
                        size="sm"
                        variant={weighted[q.question] === n ? "default" : "outline"}
                        className="h-7 w-7 p-0"
                        onClick={() => setWeighted((s) => ({ ...s, [q.question]: n }))}
                      >
                        {n}
                      </Button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          <RadioGroup value={decision} onValueChange={(v) => setDecision(v as "bid" | "no-bid")}>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="bid" id="bid" />
              <Label htmlFor="bid">Bid — pursue this opportunity</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="no-bid" id="no-bid" />
              <Label htmlFor="no-bid">No-Bid — close this opportunity</Label>
            </div>
          </RadioGroup>

          <div className="space-y-2">
            <Label htmlFor="bid-reason">Reason *</Label>
            <Textarea
              id="bid-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Why this decision? (required)"
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={!reason.trim() || submitting}>
            {submitting ? "Saving..." : "Record Decision"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
