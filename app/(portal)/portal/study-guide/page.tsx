"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { auth } from "@/lib/firebase";
import { useRequireAuth } from "@/lib/hooks/use-auth";
import { QuizLab } from "@/components/study-guide/quiz-lab";
import type { StudyGuideData, StudyGuideTermView } from "@/lib/study-guide-types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { BookOpen, Download, Shuffle } from "lucide-react";

type Tab = "quiz" | "vocabulary" | "progress";
interface ApiResult<T> { data?: T; error?: string }

function percentage(correct: number, answered: number): number {
  return answered ? Math.round((correct / answered) * 100) : 0;
}

export default function StudyGuidePage() {
  const { isLoading: authLoading, isAuthenticated } = useRequireAuth();
  const [data, setData] = useState<StudyGuideData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tab, setTab] = useState<Tab>("quiz");
  const [vocabFilter, setVocabFilter] = useState<"all" | "known" | "unknown">("all");
  const [vocabOrder, setVocabOrder] = useState<StudyGuideTermView[]>([]);
  const [flipped, setFlipped] = useState<Record<string, boolean>>({});

  const getToken = useCallback(async () => {
    if (!auth?.currentUser) throw new Error("Sign in again to continue");
    return auth.currentUser.getIdToken();
  }, []);

  const load = useCallback(async () => {
    const token = await getToken();
    const response = await fetch("/api/study-guide", { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" });
    const result = (await response.json()) as ApiResult<StudyGuideData>;
    if (!response.ok || !result.data) throw new Error(result.error || "Unable to load study guide");
    setData(result.data);
    setVocabOrder(result.data.vocabulary);
  }, [getToken]);

  useEffect(() => {
    if (!isAuthenticated) return;
    let active = true;
    void load().catch((reason: unknown) => { if (active) setError(reason instanceof Error ? reason.message : "Unable to load study guide"); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [isAuthenticated, load]);

  const markKnown = async (termId: string, known: boolean) => {
    try {
      const token = await getToken();
      const response = await fetch("/api/study-guide/vocab", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ termId, known }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Unable to update vocabulary progress");
      setData((current) => current ? { ...current, progress: { ...current.progress, knownVocab: known ? [...new Set([...current.progress.knownVocab, termId])] : current.progress.knownVocab.filter((id) => id !== termId) } } : current);
    } catch (reason) {
      toast.error(reason instanceof Error ? reason.message : "Unable to update vocabulary progress");
    }
  };

  const filteredVocab = useMemo(() => (vocabOrder.length ? vocabOrder : data?.vocabulary || []).filter((term) => {
    const known = data?.progress.knownVocab.includes(term.id) || false;
    return vocabFilter === "all" || (vocabFilter === "known" ? known : !known);
  }), [vocabOrder, data, vocabFilter]);

  if (authLoading || loading) return <Skeleton className="h-[560px] w-full" />;
  if (!data) return <div className="mx-auto max-w-2xl space-y-5 py-16 text-center"><Card><CardContent className="space-y-4 py-10"><BookOpen className="mx-auto h-10 w-10 text-[#8A6212]" /><h1 className="font-display text-2xl font-bold">Part 107 Digital Study Guide</h1><p className="text-muted-foreground">{error || "The study guide is not available."}</p><Button asChild className="bg-[#8A6212] hover:bg-[#8A6212]"><Link href="/pricing">View courses and guide access</Link></Button></CardContent></Card></div>;

  const categoryPerformance = data.categories.map((category) => {
    const stats = data.progress.byCategory[category.id] || { answered: 0, correct: 0 };
    return { category, stats, rate: percentage(stats.correct, stats.answered) };
  });
  const readiness = Math.round(categoryPerformance.reduce((sum, item) => sum + item.rate, 0) / Math.max(1, categoryPerformance.length));
  const weakestArea = categoryPerformance.filter((item) => item.stats.answered > 0).sort((a, b) => a.rate - b.rate)[0]?.category.name || "Not enough data";
  const exportReadinessReport = () => {
    if (!data.proActive) return;
    const csvCell = (value: string | number) => `"${String(value).replaceAll("\"", "\"\"")}"`;
    const rows: (string | number)[][] = [["V+ Part 107 Readiness Report", new Date().toLocaleDateString()], ["Knowledge area", "Answered", "Correct", "Accuracy"]];
    for (const item of categoryPerformance) rows.push([item.category.name, item.stats.answered, item.stats.correct, `${item.rate}%`]);
    rows.push([], ["Recent session", "Completed", "Score", "Questions"]);
    for (const session of data.history) rows.push([session.categoryId === "all" ? "Mixed review" : data.categories.find((category) => category.id === session.categoryId)?.name || session.categoryId, session.completedAt ? new Date(session.completedAt).toLocaleDateString() : "", session.score, session.questionCount]);
    const csv = rows.map((row) => row.map(csvCell).join(",")).join("\r\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "vplus-part107-readiness.csv";
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return <div className="space-y-6">
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div><p className="font-display text-sm font-semibold tracking-[0.2em] text-[#8A6212]">V+ ACADEMY</p><h1 className="font-display text-3xl font-bold">Part 107 Digital Study Guide</h1><p className="text-muted-foreground">Practice the FAA knowledge areas, review vocabulary, and track your learning.</p></div>
      <div className="flex gap-2 rounded-lg border p-1" role="tablist" aria-label="Study guide sections">
        {([['quiz', 'Quiz Lab'], ['vocabulary', 'Vocabulary'], ['progress', 'Progress']] as const).map(([value, label]) => <Button key={value} type="button" size="sm" variant={tab === value ? "default" : "ghost"} role="tab" aria-selected={tab === value} onClick={() => setTab(value)}>{label}</Button>)}
      </div>
    </div>

    {tab === "quiz" && <QuizLab data={data} onProgressChanged={load} />}

    {tab === "vocabulary" && <Card><CardHeader><div className="flex flex-wrap items-center justify-between gap-3"><div><CardTitle className="font-display">Vocabulary Deck</CardTitle><CardDescription>Flip through terms and mark the ones you have mastered.</CardDescription></div><div className="flex gap-2"><select value={vocabFilter} onChange={(event) => setVocabFilter(event.target.value as typeof vocabFilter)} className="rounded-md border border-input bg-background px-3 py-2 text-sm"><option value="all">All terms</option><option value="unknown">Not mastered</option><option value="known">Mastered</option></select><Button type="button" variant="outline" size="sm" onClick={() => setVocabOrder([...data.vocabulary].sort(() => Math.random() - 0.5))}><Shuffle className="mr-2 h-4 w-4" />Shuffle</Button></div></div></CardHeader><CardContent>{filteredVocab.length ? <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{filteredVocab.map((term) => { const known = data.progress.knownVocab.includes(term.id); return <Card key={term.id} className="cursor-pointer" onClick={() => setFlipped((current) => ({ ...current, [term.id]: !current[term.id] }))}><CardContent className="space-y-4 p-5"><Badge variant="outline">{data.categories.find((category) => category.id === term.categoryId)?.name || term.categoryId}</Badge><p className={flipped[term.id] ? "min-h-20 text-sm text-muted-foreground" : "min-h-20 text-xl font-semibold"}>{flipped[term.id] ? term.definition : term.term}</p><div className="flex items-center justify-between"><Button size="sm" variant={known ? "outline" : "default"} onClick={(event) => { event.stopPropagation(); void markKnown(term.id, !known); }}>{known ? "Unmark mastered" : "Mark mastered"}</Button><span className="text-xs text-muted-foreground">Click card to flip</span></div></CardContent></Card>; })}</div> : <p className="py-8 text-center text-muted-foreground">No vocabulary terms match this filter.</p>}</CardContent></Card>}

    {tab === "progress" && <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{[{ label: "Questions answered", value: data.progress.answered }, { label: "Accuracy", value: `${percentage(data.progress.correct, data.progress.answered)}%` }, { label: "Readiness", value: `${readiness}%` }, { label: "Weakest area", value: weakestArea }, { label: "Terms mastered", value: data.progress.knownVocab.length }, { label: "Study streak", value: data.progress.streak }].map((metric) => <Card key={metric.label}><CardHeader className="pb-2"><CardDescription className="uppercase">{metric.label}</CardDescription></CardHeader><CardContent><p className="text-2xl font-bold">{metric.value}</p></CardContent></Card>)}</div>
      <Card><CardHeader><CardTitle className="font-display">Progress by knowledge area</CardTitle></CardHeader><CardContent className="space-y-4">{data.categories.map((category) => { const stats = data.progress.byCategory[category.id] || { answered: 0, correct: 0 }; const rate = percentage(stats.correct, stats.answered); return <div key={category.id} className="space-y-2"><div className="flex justify-between text-sm"><span className="font-medium">{category.name}</span><span className="text-muted-foreground">{stats.answered ? `${rate}% · ${stats.correct}/${stats.answered}` : "Not started"}</span></div><Progress value={rate} /></div>; })}</CardContent></Card>
      {data.proActive ? <Card><CardHeader><div className="flex flex-wrap items-center justify-between gap-2"><div><CardTitle className="font-display">Quiz history</CardTitle><CardDescription>Recent saved study sessions</CardDescription></div><Button type="button" variant="outline" size="sm" onClick={exportReadinessReport}><Download className="mr-2 h-4 w-4" />Export readiness CSV</Button></div></CardHeader><CardContent className="space-y-2">{data.history.length ? data.history.map((session) => <div key={session.id} className="flex flex-wrap items-center justify-between gap-2 rounded border p-3"><div><p className="font-medium">{session.categoryId === "all" ? "Mixed review" : data.categories.find((category) => category.id === session.categoryId)?.name || session.categoryId}</p><p className="text-xs text-muted-foreground">{session.completedAt ? new Date(session.completedAt).toLocaleString() : "Completed"} · {session.score}/{session.questionCount} correct</p></div><Badge variant="outline">{percentage(session.score, session.questionCount)}%</Badge></div>) : <p className="text-sm text-muted-foreground">Completed practice sessions will appear here.</p>}</CardContent></Card> : <Card className="border-[#C9962B]"><CardContent className="flex flex-wrap items-center justify-between gap-3 py-4"><div><p className="font-semibold">Unlock full quiz history</p><p className="text-sm text-muted-foreground">Part 107 Pro adds your complete practice-session history and deeper analytics.</p></div><Button asChild><Link href="/portal/pro">View Pro plans</Link></Button></CardContent></Card>}
      <p className="text-xs text-muted-foreground">Study history is saved to your V+ Academy account and is not connected to the former standalone study app.</p>
    </div>}
  </div>;
}
