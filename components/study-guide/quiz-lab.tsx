"use client";

import { useMemo, useState } from "react";
import { auth } from "@/lib/firebase";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";
import { ArrowRight, CheckCircle, Loader2, RotateCcw, XCircle } from "lucide-react";
import type { StudyGuideActiveSession, StudyGuideCategory, StudyGuideData, StudyGuideQuestionView, StudyGuideSessionQuestion } from "@/lib/study-guide-types";

interface QuizLabProps {
  data: StudyGuideData;
  onProgressChanged: () => Promise<void>;
}
interface ApiResult<T> { data?: T; error?: string }
interface SessionStartResult { sessionId: string; startedAt: string; questions: StudyGuideQuestionView[] }
interface GradeResult { correct: boolean; correctIndex: number; explanation: string }
interface CompleteResult { score: number; questionCount: number; scorePercent: number }

function accuracy(correct: number, answered: number): number { return answered ? Math.round((correct / answered) * 100) : 0; }

export function QuizLab({ data, onProgressChanged }: QuizLabProps) {
  const [categoryId, setCategoryId] = useState("all");
  const [length, setLength] = useState<number | "all">(10);
  const [sessionId, setSessionId] = useState("");
  const [questions, setQuestions] = useState<StudyGuideSessionQuestion[]>([]);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [checking, setChecking] = useState(false);
  const [saving, setSaving] = useState(false);
  const [score, setScore] = useState<CompleteResult | null>(null);

  const getToken = async (): Promise<string> => {
    if (!auth?.currentUser) throw new Error("Sign in again to continue");
    return auth.currentUser.getIdToken();
  };

  const resume = (session: StudyGuideActiveSession) => {
    setSessionId(session.id);
    setCategoryId(session.categoryId);
    setQuestions(session.questions);
    setQuestionIndex(session.currentIndex);
    setAnswers(Object.fromEntries(session.questions.filter((question) => question.selectedIndex !== null).map((question) => [question.id, question.selectedIndex as number])));
    setScore(null);
  };

  const start = async () => {
    setSaving(true);
    try {
      const token = await getToken();
      const response = await fetch("/api/study-guide/session", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ categoryId, length }),
      });
      const result = (await response.json()) as ApiResult<SessionStartResult>;
      if (!response.ok || !result.data) throw new Error(result.error || "Unable to start practice session");
      const session = result.data;
      setSessionId(session.sessionId);
      setQuestions(session.questions.map((question) => ({ ...question, selectedIndex: null, answered: false, result: null })));
      setQuestionIndex(0);
      setAnswers({});
      setScore(null);
      await onProgressChanged();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to start practice session");
    } finally {
      setSaving(false);
    }
  };

  const checkAnswer = async (question: StudyGuideSessionQuestion) => {
    const selectedIndex = answers[question.id];
    if (!sessionId || selectedIndex === undefined || checking) return;
    setChecking(true);
    try {
      const token = await getToken();
      const response = await fetch(`/api/study-guide/session/${encodeURIComponent(sessionId)}/answer`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ questionId: question.id, selectedIndex }),
      });
      const result = (await response.json()) as ApiResult<GradeResult>;
      if (!response.ok || !result.data) throw new Error(result.error || "Unable to grade answer");
      setQuestions((items) => items.map((item) => item.id === question.id ? { ...item, selectedIndex, answered: true, result: result.data || null } : item));
      await onProgressChanged();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to grade answer");
    } finally {
      setChecking(false);
    }
  };

  const complete = async () => {
    if (!sessionId || saving) return;
    setSaving(true);
    try {
      const token = await getToken();
      const response = await fetch(`/api/study-guide/session/${encodeURIComponent(sessionId)}/complete`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const result = (await response.json()) as ApiResult<CompleteResult>;
      if (!response.ok || !result.data) throw new Error(result.error || "Unable to complete practice session");
      setScore(result.data);
      setSessionId("");
      await onProgressChanged();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to complete session");
    } finally {
      setSaving(false);
    }
  };

  const question = questions[questionIndex];
  const readiness = useMemo(() => Math.round(data.categories.reduce((total, category) => {
    const stats = data.progress.byCategory[category.id] || { answered: 0, correct: 0 };
    return total + accuracy(stats.correct, stats.answered);
  }, 0) / Math.max(1, data.categories.length)), [data.categories, data.progress.byCategory]);

  if (score) return <Card className="mx-auto max-w-2xl"><CardHeader><CardTitle className="font-display">Practice session complete</CardTitle><CardDescription>Your answers and progress are saved to the LMS account.</CardDescription></CardHeader><CardContent className="space-y-4"><div className="text-center"><p className="text-4xl font-bold text-[#1478ac]">{score.scorePercent}%</p><p>{score.score} / {score.questionCount} correct</p></div><Button onClick={() => void start()} disabled={saving} className="w-full bg-[#1478ac] hover:bg-[#318dc1]">Practice again</Button></CardContent></Card>;

  if (sessionId && questions.length > 0 && !question) return <Card className="mx-auto max-w-2xl"><CardHeader><CardTitle className="font-display">Practice session saved</CardTitle><CardDescription>Every question has been answered. Finish now to record your session score.</CardDescription></CardHeader><CardContent><Button disabled={saving} onClick={() => void complete()} className="w-full bg-[#1478ac] hover:bg-[#318dc1]">{saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}Complete saved session</Button></CardContent></Card>;

  if (sessionId && question) return <Card className="mx-auto max-w-3xl"><CardHeader><div className="flex items-center justify-between gap-3"><div><CardTitle className="font-display">Practice Question {questionIndex + 1}</CardTitle><CardDescription>{questionIndex + 1} of {questions.length} · {data.categories.find((category) => category.id === question.categoryId)?.name}</CardDescription></div><Button type="button" variant="ghost" onClick={() => setSessionId("")}>Save and exit</Button></div><Progress value={(questionIndex / questions.length) * 100} /></CardHeader><CardContent className="space-y-5"><p className="text-lg font-medium">{question.question}</p><RadioGroup value={answers[question.id]?.toString()} onValueChange={(value) => setAnswers((current) => ({ ...current, [question.id]: Number(value) }))} disabled={Boolean(question.result)}>{question.answers.map((answer, index) => <div key={`${question.id}-${index}`} className="flex items-start gap-3 rounded-md border p-3"><RadioGroupItem id={`study-${question.id}-${index}`} value={String(index)} /><Label className="font-normal leading-relaxed" htmlFor={`study-${question.id}-${index}`}>{answer}</Label></div>)}</RadioGroup>{question.result && <div className={`rounded-md p-4 ${question.result.correct ? "bg-green-50 text-green-900" : "bg-red-50 text-red-900"}`}><div className="flex items-center gap-2 font-semibold">{question.result.correct ? <CheckCircle className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}{question.result.correct ? "Correct" : `Review the answer: ${question.answers[question.result.correctIndex]}`}</div><p className="mt-2 text-sm">{question.result.explanation}</p></div>}{!question.result ? <Button disabled={answers[question.id] === undefined || checking} onClick={() => void checkAnswer(question)} className="w-full bg-[#1478ac] hover:bg-[#318dc1]">{checking ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}Check answer</Button> : <Button disabled={saving} onClick={() => questionIndex + 1 >= questions.length ? void complete() : setQuestionIndex((index) => index + 1)} className="w-full bg-[#1478ac] hover:bg-[#318dc1]">{questionIndex + 1 >= questions.length ? saving ? "Saving…" : "Finish session" : "Next question"}<ArrowRight className="ml-2 h-4 w-4" /></Button>}</CardContent></Card>;

  return <div className="space-y-6">
    {data.activeSessions.map((session) => <Card key={session.id} className="border-[#d3ac63]"><CardContent className="flex flex-wrap items-center justify-between gap-3 py-4"><div><Badge variant="outline">Saved practice</Badge><p className="mt-2 font-medium">{session.categoryId === "all" ? "Mixed review" : data.categories.find((category) => category.id === session.categoryId)?.name || session.categoryId}</p><p className="text-xs text-muted-foreground">{session.currentIndex}/{session.questions.length} answered · started {new Date(session.startedAt).toLocaleString()}</p></div><Button onClick={() => resume(session)}><RotateCcw className="mr-2 h-4 w-4" />Resume</Button></CardContent></Card>)}
    <div className="grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
      <Card><CardHeader><CardTitle className="font-display">Build a practice session</CardTitle><CardDescription>Choose a knowledge area and question count. The LMS saves each answer, so you can resume on another device.</CardDescription></CardHeader><CardContent className="space-y-4"><div className="space-y-2"><Label htmlFor="study-category">Knowledge area</Label><select id="study-category" value={categoryId} onChange={(event) => setCategoryId(event.target.value)} className="w-full rounded-md border border-input bg-background px-3 py-2"><option value="all">Mixed review — all areas</option>{data.categories.map((category: StudyGuideCategory) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></div><div className="space-y-2"><Label htmlFor="study-length">Questions</Label><select id="study-length" value={length} onChange={(event) => setLength(event.target.value === "all" ? "all" : Number(event.target.value))} className="w-full rounded-md border border-input bg-background px-3 py-2"><option value="10">10 questions</option><option value="20">20 questions</option><option value="all">All available in selection</option></select></div><Button disabled={saving} onClick={() => void start()} className="w-full bg-[#1478ac] hover:bg-[#318dc1]">{saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}Start practice quiz</Button></CardContent></Card>
      <Card><CardHeader><CardTitle className="font-display">Study status</CardTitle></CardHeader><CardContent className="space-y-3"><div className="flex justify-between"><span>Readiness</span><strong>{readiness}%</strong></div><Progress value={readiness} /><p className="text-sm text-muted-foreground">{data.progress.answered} questions answered · {accuracy(data.progress.correct, data.progress.answered)}% accuracy</p><p className="text-sm text-muted-foreground">{data.progress.streak}-day study streak · {data.progress.knownVocab.length}/{data.vocabulary.length} terms mastered</p><p className="text-xs text-muted-foreground">This is a study aid, not an FAA-issued credential or guarantee of exam passage.</p></CardContent></Card>
    </div>
  </div>;
}
