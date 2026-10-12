"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { captureJson } from "@/lib/capture/api-client";
import type { CaptureOpportunity, CaptureTask } from "@/lib/schema";
import { toast } from "sonner";

export default function MyTasksPage() {
  const [tasks, setTasks] = useState<CaptureTask[]>([]);
  const [opps, setOpps] = useState<Map<string, CaptureOpportunity>>(new Map());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      captureJson<{ tasks: CaptureTask[] }>("/api/capture/tasks"),
      captureJson<{ opportunities: CaptureOpportunity[] }>("/api/capture/opportunities"),
    ])
      .then(([t, o]) => {
        setTasks(t.tasks);
        setOpps(new Map(o.opportunities.map((x) => [x.id!, x])));
      })
      .catch((e) => toast.error(e.message))
      .finally(() => setLoading(false));
  }, []);

  const toggle = async (task: CaptureTask) => {
    const status = task.status === "done" ? "open" : "done";
    try {
      const { task: updated } = await captureJson<{ task: CaptureTask }>(`/api/capture/tasks/${task.id}`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
      setTasks((prev) => prev.map((x) => (x.id === task.id ? updated : x)));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Update failed");
    }
  };

  const open = tasks.filter((t) => t.status !== "done");
  const done = tasks.filter((t) => t.status === "done");

  const renderRow = (t: CaptureTask) => {
    const opp = opps.get(t.opportunityId);
    const overdue = t.status !== "done" && t.dueDate && t.dueDate < new Date().toISOString().slice(0, 10);
    return (
      <div key={t.id} className="flex items-center gap-3 py-3 border-b last:border-0">
        <Checkbox checked={t.status === "done"} onCheckedChange={() => toggle(t)} aria-label={`Complete "${t.title}"`} />
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-medium ${t.status === "done" ? "line-through text-muted-foreground" : ""}`}>
            {t.title}
          </p>
          {opp && (
            <Link href={`/portal/capture/opportunities/${opp.id}`} className="text-xs text-muted-foreground hover:underline">
              {opp.title}
            </Link>
          )}
        </div>
        <span className={`text-xs ${overdue ? "text-red-600 font-medium" : "text-muted-foreground"}`}>
          {overdue ? "Overdue · " : ""}
          {t.dueDate || "No due date"}
        </span>
      </div>
    );
  };

  return (
    <div className="p-6 space-y-6 max-w-3xl">
      <h1 className="text-2xl font-bold">My Tasks</h1>
      <Card>
        <CardContent className="pt-6">
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading...</p>
          ) : tasks.length === 0 ? (
            <p className="text-sm text-muted-foreground">No tasks assigned to you.</p>
          ) : (
            <>
              {open.map(renderRow)}
              {done.length > 0 && (
                <>
                  <p className="text-xs font-medium text-muted-foreground mt-6 mb-1">Completed</p>
                  {done.map(renderRow)}
                </>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
