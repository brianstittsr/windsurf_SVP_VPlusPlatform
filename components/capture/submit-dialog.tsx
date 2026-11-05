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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { CaptureFileRef } from "@/lib/schema";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  files: CaptureFileRef[];
  onConfirm: (submittedAt: string, finalSubmissionFileId: string) => void;
  submitting?: boolean;
}

/** Rule 3: Submitted gate — requires a date and a final-submission tagged file. */
export function SubmitDialog({ open, onOpenChange, files, onConfirm, submitting }: Props) {
  const finalFiles = files.filter((f) => f.tag === "final-submission");
  const [submittedAt, setSubmittedAt] = useState(new Date().toISOString().slice(0, 10));
  const [fileId, setFileId] = useState(finalFiles[0]?.id || "");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Mark as Submitted</DialogTitle>
          <DialogDescription>
            Confirm the submission date and the final submitted file. Upload a file tagged
            &quot;final-submission&quot; first if none is listed.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="submitted-at">Submission Date *</Label>
            <Input
              id="submitted-at"
              type="date"
              value={submittedAt}
              onChange={(e) => setSubmittedAt(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Final Submission File *</Label>
            {finalFiles.length === 0 ? (
              <p className="text-sm text-destructive">
                No files tagged &quot;final-submission&quot;. Upload one in the Files tab first.
              </p>
            ) : (
              <Select value={fileId} onValueChange={setFileId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select the submitted file" />
                </SelectTrigger>
                <SelectContent>
                  {finalFiles.map((f) => (
                    <SelectItem key={f.id} value={f.id}>
                      {f.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
            Cancel
          </Button>
          <Button
            onClick={() => onConfirm(new Date(submittedAt).toISOString(), fileId)}
            disabled={!submittedAt || !fileId || submitting}
          >
            {submitting ? "Saving..." : "Mark Submitted"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
