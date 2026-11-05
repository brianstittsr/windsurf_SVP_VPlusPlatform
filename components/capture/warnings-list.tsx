"use client";

import { AlertTriangle } from "lucide-react";

export function WarningsList({ warnings }: { warnings?: string[] }) {
  if (!warnings?.length) return null;
  return (
    <div className="rounded-lg border border-yellow-300 bg-yellow-50 dark:bg-yellow-950/30 p-3 space-y-1">
      {warnings.map((w, i) => (
        <p key={i} className="flex items-start gap-2 text-sm text-yellow-800 dark:text-yellow-200">
          <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
          {w}
        </p>
      ))}
    </div>
  );
}
