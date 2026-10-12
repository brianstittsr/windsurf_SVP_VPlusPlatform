"use client";

import { useState } from "react";
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

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  opportunityTitle?: string;
  onConfirm: (decision: "bid" | "no-bid", reason: string) => void;
  submitting?: boolean;
}

/** Rule 2: Bid/No-Bid decision gate dialog (admin only records it). */
export function BidNoBidDialog({ open, onOpenChange, opportunityTitle, onConfirm, submitting }: Props) {
  const [decision, setDecision] = useState<"bid" | "no-bid">("bid");
  const [reason, setReason] = useState("");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Bid / No-Bid Decision</DialogTitle>
          <DialogDescription>
            A decision is required before moving {opportunityTitle ? `"${opportunityTitle}" ` : "this opportunity "}
            past the gate.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
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
          <Button onClick={() => onConfirm(decision, reason)} disabled={!reason.trim() || submitting}>
            {submitting ? "Saving..." : "Record Decision"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
