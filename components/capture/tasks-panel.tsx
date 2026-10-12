"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { MemberPicker } from "@/components/capture/member-picker";
import { captureJson } from "@/lib/capture/api-client";
import type { CaptureTask } from "@/lib/schema";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface Props {
  opportunityId: string;
  tasks: CaptureTask[];
  onTasksChanged: (tasks: CaptureTask[]) => void;
  readOnly?: boolean;
}

export function TasksPanel({ opportunityId, tasks, onTasksChanged, readOnly }: Props) {
  const [title, setTitle] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [assigneeId, setAssigneeId] = useState("");
  const [assigneeName, setAssigneeName] = useState("");
  const [adding, setAdding] = useState(false);

  const addTask = async () => {
    if (!title.trim() || !assigneeId || !dueDate) {
      toast.error("Title, assignee, and due date are required");
      return;
    }
    setAdding(true);
    try {
      const { task } = await captureJson<{ task: CaptureTask }>(
        `/api/capture/opportunities/${opportunityId}/tasks`,
        {
          method: "POST",
          body: JSON.stringify({ title: title.trim(), assigneeId, assigneeName, dueDate }),
        }
      );
      onTasksChanged([...tasks, task]);
      setTitle("");
      setDueDate("");
      setAssigneeId("");
      setAssigneeName("");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to add task");
    } finally {
      setAdding(false);
    }
  };

  const toggleTask = async (task: CaptureTask) => {
    const status = task.status === "done" ? "open" : "done";
    try {
      const { task: updated } = await captureJson<{ task: CaptureTask }>(`/api/capture/tasks/${task.id}`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
      onTasksChanged(tasks.map((t) => (t.id === task.id ? updated : t)));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to update task");
    }
  };

  const deleteTask = async (task: CaptureTask) => {
    try {
      await captureJson(`/api/capture/tasks/${task.id}`, { method: "DELETE" });
      onTasksChanged(tasks.filter((t) => t.id !== task.id));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to delete task");
    }
  };

  const sorted = [...tasks].sort((a, b) => (a.dueDate || "9999").localeCompare(b.dueDate || "9999"));

  return (
    <div className="space-y-4">
      {!readOnly && (
        <div className="flex items-end gap-2 flex-wrap">
          <div className="flex-1 min-w-40">
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Task title" />
          </div>
          <MemberPicker
            value={assigneeId}
            onChange={(id, m) => {
              setAssigneeId(id);
              setAssigneeName(m?.name || "");
            }}
          />
          <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="w-40" />
          <Button size="sm" onClick={addTask} disabled={adding}>
            <Plus className="h-4 w-4 mr-1" />
            Add
          </Button>
        </div>
      )}

      <div className="space-y-2">
        {sorted.length === 0 && <p className="text-sm text-muted-foreground">No tasks yet.</p>}
        {sorted.map((t) => (
          <div key={t.id} className="flex items-center gap-3 rounded-lg border p-3">
            <Checkbox
              checked={t.status === "done"}
              onCheckedChange={() => toggleTask(t)}
              aria-label={`Mark "${t.title}" done`}
            />
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-medium ${t.status === "done" ? "line-through text-muted-foreground" : ""}`}>
                {t.title}
              </p>
              <p className="text-xs text-muted-foreground">
                {t.assigneeName} · due {t.dueDate}
              </p>
            </div>
            {!readOnly && (
              <Button variant="ghost" size="icon" onClick={() => deleteTask(t)} aria-label={`Delete "${t.title}"`}>
                <Trash2 className="h-4 w-4 text-muted-foreground" />
              </Button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
