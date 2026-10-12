"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { auth } from "@/lib/firebase";
import { Download } from "lucide-react";
import { toast } from "sonner";

interface Props {
  filters?: { clientId?: string; stage?: string; ownerId?: string; type?: string };
  variant?: "default" | "outline";
  size?: "default" | "sm";
}

/** Export filtered opportunities to an xlsx workbook via /api/capture/export. */
export function ExportButton({ filters = {}, variant = "outline", size = "sm" }: Props) {
  const [exporting, setExporting] = useState(false);

  const doExport = async () => {
    if (!auth?.currentUser) {
      toast.error("Sign in required");
      return;
    }
    setExporting(true);
    try {
      const token = await auth.currentUser.getIdToken();
      const res = await fetch("/api/capture/export", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(filters),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Export failed");
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `capture-opportunities-${new Date().toISOString().slice(0, 10)}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Export downloaded");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Export failed");
    } finally {
      setExporting(false);
    }
  };

  return (
    <Button variant={variant} size={size} onClick={doExport} disabled={exporting}>
      <Download className="h-4 w-4 mr-2" />
      {exporting ? "Exporting..." : "Export Excel"}
    </Button>
  );
}
