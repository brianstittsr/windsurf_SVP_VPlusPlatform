"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, Bug } from "lucide-react";

interface QaDebugPanelProps {
  answers: Record<string, any>;
  currentField?: string;
}

/**
 * QA Debug Panel — fixed to the bottom of the viewport, collapsible.
 * Shows every answer captured by the interview as the user progresses.
 * Intended for development / QA only.
 */
export function QaDebugPanel({ answers, currentField }: QaDebugPanelProps) {
  const [open, setOpen] = useState(false);

  const entries = Object.entries(answers).filter(
    ([, v]) => v !== undefined && v !== null && v !== ""
  );

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-slate-900 text-slate-100 border-t-2 border-slate-700 shadow-2xl">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-4 py-2 text-sm font-mono hover:bg-slate-800"
      >
        <span className="flex items-center gap-2">
          <Bug className="h-4 w-4 text-amber-400" />
          QA Debug — {entries.length} answer{entries.length === 1 ? "" : "s"} captured
        </span>
        {open ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
      </button>

      {open && (
        <div className="max-h-64 overflow-y-auto px-4 py-3 text-xs font-mono">
          {entries.length === 0 ? (
            <p className="text-slate-400 italic">No answers captured yet.</p>
          ) : (
            <table className="w-full">
              <tbody>
                {entries.map(([key, value]) => {
                  const isCurrent = key === currentField;
                  return (
                    <tr
                      key={key}
                      className={isCurrent ? "bg-amber-900/40" : "hover:bg-slate-800"}
                    >
                      <td className="py-1 pr-4 text-slate-400 whitespace-nowrap align-top">
                        {key}
                      </td>
                      <td className="py-1 text-emerald-300 break-all">
                        {typeof value === "object"
                          ? JSON.stringify(value)
                          : String(value)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
