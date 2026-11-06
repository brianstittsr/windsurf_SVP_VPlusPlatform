"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { GrantBoard } from "@/components/grants/grant-board";
import { captureJson } from "@/lib/capture/api-client";
import { GRANT_STAGES } from "@/lib/grants/stages";
import type { GrantOpportunityDoc, GrantStage } from "@/lib/schema";
import { LayoutGrid, List, Plus } from "lucide-react";
import { useRequireAuth } from "@/lib/hooks/use-auth";

interface SerializedGrant extends Omit<GrantOpportunityDoc, "deadlineAt" | "createdAt" | "updatedAt" | "analyzedAt" | "submittedAt"> {
  deadlineAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

const stageLabel = (id: string) => GRANT_STAGES.find((s) => s.id === id)?.label || id;
const stageColor = (id: string) => GRANT_STAGES.find((s) => s.id === id)?.color || "bg-slate-500";

export default function GrantsPage() {
  const { isLoading: authLoading, isAuthenticated } = useRequireAuth(["admin", "instructor"]);
  const [grants, setGrants] = useState<SerializedGrant[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"board" | "list">("board");
  const [search, setSearch] = useState("");

  useEffect(() => {
    captureJson<{ grants: SerializedGrant[] }>("/api/grants")
      .then((d) => setGrants(d.grants))
      .catch((e) => console.error(e))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    if (!q) return grants;
    return grants.filter(
      (g) =>
        g.title.toLowerCase().includes(q) ||
        (g.funder || "").toLowerCase().includes(q) ||
        (g.description || "").toLowerCase().includes(q)
    );
  }, [grants, search]);

  const handleMoved = (id: string, stage: GrantStage) => {
    setGrants((prev) => prev.map((g) => (g.id === id ? { ...g, stage } : g)));
  };

  if (loading) return <div className="p-6 text-muted-foreground">Loading grants…</div>;

  if (authLoading || !isAuthenticated) return <div className="p-6 text-muted-foreground">Loading...</div>;

  return (
    <div className="p-6 space-y-4 h-full flex flex-col">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold">Grant Builder</h1>
        <div className="flex items-center gap-2">
          <Input
            placeholder="Search grants or funders…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-64"
          />
          <div className="flex border rounded-md overflow-hidden">
            <Button
              variant={view === "board" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setView("board")}
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button
              variant={view === "list" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setView("list")}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
          <Button asChild size="sm">
            <Link href="/portal/grants/new">
              <Plus className="h-4 w-4 mr-1" /> New Grant
            </Link>
          </Button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center gap-3 border border-dashed rounded-lg p-12">
          <p className="text-muted-foreground">
            {grants.length === 0
              ? "No grants yet — analyze a grant webpage or add one manually."
              : "No grants match your search."}
          </p>
          <Button asChild size="sm">
            <Link href="/portal/grants/new">
              <Plus className="h-4 w-4 mr-1" /> Add your first grant
            </Link>
          </Button>
        </div>
      ) : view === "board" ? (
        <div className="flex-1 overflow-hidden">
          <GrantBoard grants={filtered} onMoved={handleMoved} />
        </div>
      ) : (
        <div className="border rounded-lg overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Grant</TableHead>
                <TableHead>Funder</TableHead>
                <TableHead>Stage</TableHead>
                <TableHead>Deadline</TableHead>
                <TableHead>Award</TableHead>
                <TableHead>Responses</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((g) => {
                const answered = g.questions.filter((q) => q.response).length;
                return (
                  <TableRow key={g.id}>
                    <TableCell>
                      <Link href={`/portal/grants/${g.id}`} className="font-medium hover:underline">
                        {g.title}
                      </Link>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{g.funder || "—"}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="gap-1.5">
                        <span className={`h-2 w-2 rounded-full ${stageColor(g.stage)}`} />
                        {stageLabel(g.stage)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {g.deadlineAt ? new Date(g.deadlineAt).toLocaleDateString() : "—"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {g.awardMax ? `$${g.awardMax.toLocaleString()}` : "—"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {g.questions.length ? `${answered}/${g.questions.length}` : "—"}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
