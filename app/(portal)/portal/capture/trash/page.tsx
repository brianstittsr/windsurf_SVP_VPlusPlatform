"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { captureJson } from "@/lib/capture/api-client";
import type { CaptureOpportunity, CustomerDoc } from "@/lib/schema";
import { RotateCcw } from "lucide-react";
import { toast } from "sonner";

interface TrashResponse {
  opportunities: CaptureOpportunity[];
  clients: CustomerDoc[];
}

export default function CaptureTrashPage() {
  const [trash, setTrash] = useState<TrashResponse>({ opportunities: [], clients: [] });
  const [forbidden, setForbidden] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = () => {
    captureJson<TrashResponse>("/api/capture/trash")
      .then(setTrash)
      .catch((e) => {
        if (e.message.toLowerCase().includes("forbidden")) setForbidden(true);
        else toast.error(e.message);
      })
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const restore = async (type: "opportunity" | "client", id: string) => {
    try {
      await captureJson("/api/capture/trash/restore", {
        method: "POST",
        body: JSON.stringify({ type, id }),
      });
      toast.success("Restored");
      load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Restore failed");
    }
  };

  if (loading) return <div className="p-6 text-muted-foreground">Loading trash...</div>;
  if (forbidden) return <div className="p-6 text-muted-foreground">Admin access required to view trash.</div>;

  const fmtDate = (v: unknown) => (typeof v === "string" ? new Date(v).toLocaleDateString() : "—");
  const empty = trash.opportunities.length === 0 && trash.clients.length === 0;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Trash</h1>
        <p className="text-sm text-muted-foreground">Deleted items are recoverable for 30 days.</p>
      </div>

      {empty && <p className="text-sm text-muted-foreground">Trash is empty.</p>}

      {trash.opportunities.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Opportunities</CardTitle>
          </CardHeader>
          <CardContent>
            {trash.opportunities.map((o) => (
              <div key={o.id} className="flex items-center justify-between py-2 border-b last:border-0">
                <div>
                  <p className="text-sm font-medium">{o.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {o.clientName} · deleted {fmtDate(o.deletedAt)}
                  </p>
                </div>
                <Button variant="outline" size="sm" onClick={() => restore("opportunity", o.id!)}>
                  <RotateCcw className="h-4 w-4 mr-1" />
                  Restore
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {trash.clients.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Clients</CardTitle>
          </CardHeader>
          <CardContent>
            {trash.clients.map((c) => (
              <div key={c.id} className="flex items-center justify-between py-2 border-b last:border-0">
                <div>
                  <p className="text-sm font-medium">{c.name}</p>
                  <p className="text-xs text-muted-foreground">deleted {fmtDate(c.deletedAt)}</p>
                </div>
                <Button variant="outline" size="sm" onClick={() => restore("client", c.id)}>
                  <RotateCcw className="h-4 w-4 mr-1" />
                  Restore
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
