"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { captureJson } from "@/lib/capture/api-client";
import type { CaptureNote } from "@/lib/schema";
import { toast } from "sonner";

interface Props {
  opportunityId: string;
  notes: CaptureNote[];
  onNoteAdded: (note: CaptureNote) => void;
  readOnly?: boolean;
}

export function NotesThread({ opportunityId, notes, onNoteAdded, readOnly }: Props) {
  const [text, setText] = useState("");
  const [saving, setSaving] = useState(false);

  const sorted = [...notes].sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));

  const addNote = async () => {
    if (!text.trim()) return;
    setSaving(true);
    try {
      const { note } = await captureJson<{ note: CaptureNote }>(
        `/api/capture/opportunities/${opportunityId}/notes`,
        { method: "POST", body: JSON.stringify({ text: text.trim() }) }
      );
      onNoteAdded(note);
      setText("");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to add note");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      {!readOnly && (
        <div className="space-y-2">
          <Textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Add a note..."
            rows={3}
          />
          <Button onClick={addNote} disabled={!text.trim() || saving} size="sm">
            {saving ? "Adding..." : "Add Note"}
          </Button>
        </div>
      )}

      <div className="space-y-3">
        {sorted.length === 0 && <p className="text-sm text-muted-foreground">No notes yet.</p>}
        {sorted.map((n) => (
          <div key={n.id} className="rounded-lg border p-3">
            <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
              <span className="font-medium text-foreground">{n.authorName}</span>
              <span>{n.createdAt ? new Date(n.createdAt).toLocaleString() : ""}</span>
            </div>
            <p className="text-sm whitespace-pre-wrap">{n.text}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
