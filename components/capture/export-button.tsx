"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { auth } from "@/lib/firebase";
import { Download } from "lucide-react";
import { toast } from "sonner";

interface Props {
  filters?: { clientId?: string; stage?: string; ownerId?: string; type?: string };
  format?: "xlsx" | "pdf";
  variant?: "default" | "outline";
  size?: "default" | "sm";
}

/** Export filtered opportunities — xlsx via /api/capture/export, pdf via /api/capture/export/pdf. */
export function ExportButton({ filters = {}, format = "xlsx", variant = "outline", size = "sm" }: Props) {
  const [exporting, setExporting] = useState(false);

  const doExport = async () => {
    if (!auth?.currentUser) {
      toast.error("Sign in required");
      return;
    }
    setExporting(true);
    try {
      const token = await auth.currentUser.getIdToken();
      let res: Response;
      if (format === "pdf") {
        const params = new URLSearchParams(
          Object.entries(filters).filter(([, v]) => !!v) as [string, string][]
        );
        res = await fetch(`/api/capture/export/pdf?${params}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
      } else {
        res = await fetch("/api/capture/export", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify(filters),
        });
      }
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Export failed");
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `capture-opportunities-${new Date().toISOString().slice(0, 10)}.${format}`;
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
      {exporting ? "Exporting..." : format === "pdf" ? "Export PDF" : "Export Excel"}
    </Button>
  );
}
