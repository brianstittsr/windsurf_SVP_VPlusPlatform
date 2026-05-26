"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowUp, Delete, Space } from "lucide-react";
import { cn } from "@/lib/utils";

type Layout = "alpha" | "numeric" | "phone" | "date";

interface OnScreenKeyboardProps {
  layout?: Layout;
  onKeyPress: (key: string) => void;
  onBackspace: () => void;
  onClear?: () => void;
}

const ALPHA_ROWS: string[][] = [
  ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0"],
  ["q", "w", "e", "r", "t", "y", "u", "i", "o", "p"],
  ["a", "s", "d", "f", "g", "h", "j", "k", "l"],
  ["z", "x", "c", "v", "b", "n", "m", "-", "'"],
];

const NUMERIC_ROWS: string[][] = [
  ["1", "2", "3"],
  ["4", "5", "6"],
  ["7", "8", "9"],
  [".", "0", ""],
];

export function OnScreenKeyboard({
  layout = "alpha",
  onKeyPress,
  onBackspace,
  onClear,
}: OnScreenKeyboardProps) {
  const [shift, setShift] = useState(false);

  const press = (k: string) => {
    if (!k) return;
    onKeyPress(shift && layout === "alpha" ? k.toUpperCase() : k);
    if (shift) setShift(false);
  };

  // ---------- Numeric / Phone / Date keypad ----------
  if (layout === "numeric" || layout === "phone" || layout === "date") {
    const rows =
      layout === "date"
        ? [
            ["1", "2", "3"],
            ["4", "5", "6"],
            ["7", "8", "9"],
            ["/", "0", ""],
          ]
        : NUMERIC_ROWS;

    return (
      <div className="w-full max-w-md mx-auto select-none">
        <div className="grid grid-cols-3 gap-2">
          {rows.flat().map((k, i) => (
            <Button
              key={i}
              type="button"
              variant="outline"
              onClick={() => press(k)}
              disabled={!k}
              className={cn(
                "h-16 text-2xl font-semibold",
                !k && "invisible"
              )}
            >
              {k}
            </Button>
          ))}
          <Button
            type="button"
            variant="outline"
            onClick={onBackspace}
            className="h-16 col-span-2 text-base"
          >
            <Delete className="h-5 w-5 mr-1" /> Backspace
          </Button>
          {onClear ? (
            <Button
              type="button"
              variant="outline"
              onClick={onClear}
              className="h-16 text-base"
            >
              Clear
            </Button>
          ) : (
            <div />
          )}
        </div>
      </div>
    );
  }

  // ---------- Alphanumeric keyboard ----------
  return (
    <div className="w-full max-w-4xl mx-auto select-none">
      {ALPHA_ROWS.map((row, ri) => (
        <div key={ri} className="flex justify-center gap-1 mb-1">
          {row.map((k) => (
            <Button
              key={k}
              type="button"
              variant="outline"
              onClick={() => press(k)}
              className="h-10 w-10 sm:h-12 sm:w-12 text-base sm:text-lg font-semibold p-0"
            >
              {shift ? k.toUpperCase() : k}
            </Button>
          ))}
        </div>
      ))}
      <div className="flex justify-center gap-1">
        <Button
          type="button"
          variant={shift ? "default" : "outline"}
          onClick={() => setShift((s) => !s)}
          className="h-10 sm:h-12 px-3 text-sm"
        >
          <ArrowUp className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => press(" ")}
          className="h-10 sm:h-12 flex-1 max-w-md text-sm"
        >
          <Space className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={onBackspace}
          className="h-10 sm:h-12 px-3 text-sm"
        >
          <Delete className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
