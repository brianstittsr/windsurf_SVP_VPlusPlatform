"use client";

import { useCallback, useEffect, useState } from "react";
import {
  listCourseModules,
  saveCourseModule,
  deleteCourseModule,
  listQuestionBanksFull,
  saveQuestionBank,
  deleteQuestionBank,
} from "@/lib/lms";
import type {
  CourseDoc,
  CourseModuleDoc,
  QuestionBankDoc,
  QuizQuestion,
} from "@/lib/schema";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import {
  ArrowDown,
  ArrowUp,
  FileQuestion,
  FileText,
  Pencil,
  Plus,
  Trash2,
  Video,
} from "lucide-react";

interface CourseContentDialogProps {
  course: CourseDoc | null;
  onClose: () => void;
}

const MODULE_TYPES: { value: CourseModuleDoc["type"]; label: string }[] = [
  { value: "document", label: "Document / text" },
  { value: "video", label: "Video" },
  { value: "quiz", label: "Quiz placeholder" },
];

function newQuestion(): QuizQuestion {
  return {
    id: `q_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
    question: "",
    options: ["", "", "", ""],
    correctIndex: 0,
    explanation: "",
  };
}

/** Full module + question-bank authoring dialog for a course. Admin-only. */
export function CourseContentDialog({ course, onClose }: CourseContentDialogProps) {
  const [modules, setModules] = useState<CourseModuleDoc[]>([]);
  const [banks, setBanks] = useState<QuestionBankDoc[]>([]);
  const [moduleEditing, setModuleEditing] = useState<Partial<CourseModuleDoc> | null>(null);
  const [bankEditing, setBankEditing] = useState<QuestionBankDoc | null>(null);
  const [bankIsNew, setBankIsNew] = useState(false);
  const [saving, setSaving] = useState(false);

  const reload = useCallback(async () => {
    if (!course) return;
    const [mods, qbs] = await Promise.all([
      listCourseModules(course.id),
      listQuestionBanksFull(course.id),
    ]);
    setModules(mods.sort((a, b) => a.order - b.order));
    setBanks(qbs);
  }, [course]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const moveModule = async (moduleId: string, direction: -1 | 1) => {
    const index = modules.findIndex((m) => m.id === moduleId);
    const swapIndex = index + direction;
    if (index < 0 || swapIndex < 0 || swapIndex >= modules.length) return;
    const current = modules[index];
    const swap = modules[swapIndex];
    await Promise.all([
      saveCourseModule({ ...current, order: swap.order }, current.id),
      saveCourseModule({ ...swap, order: current.order }, swap.id),
    ]);
    await reload();
  };

  const saveModule = async () => {
    if (!course || !moduleEditing?.title?.trim()) {
      toast.error("Module title is required");
      return;
    }
    setSaving(true);
    try {
      await saveCourseModule(
        {
          courseId: course.id,
          title: moduleEditing.title.trim(),
          description: moduleEditing.description || "",
          order: moduleEditing.order ?? modules.length + 1,
          type: moduleEditing.type || "document",
          contentUrl: moduleEditing.contentUrl || "",
          contentHtml: moduleEditing.contentHtml || "",
        },
        moduleEditing.id
      );
      toast.success("Module saved");
      setModuleEditing(null);
      await reload();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to save module");
    } finally {
      setSaving(false);
    }
  };

  const saveBank = async () => {
    if (!course || !bankEditing) return;
    if (!bankEditing.title.trim()) {
      toast.error("Assessment title is required");
      return;
    }
    if (!bankEditing.questions.length) {
      toast.error("Add at least one question");
      return;
    }
    const invalid = bankEditing.questions.findIndex(
      (q) => !q.question.trim() || q.options.some((o) => !o.trim()) || q.options.length < 2
    );
    if (invalid >= 0) {
      toast.error(`Question ${invalid + 1} needs text and at least 2 filled options`);
      return;
    }
    setSaving(true);
    try {
      await saveQuestionBank(
        {
          courseId: course.id,
          moduleId: bankEditing.moduleId || undefined,
          title: bankEditing.title.trim(),
          type: bankEditing.type,
          randomize: bankEditing.randomize,
          questionsPerAttempt: bankEditing.questionsPerAttempt || undefined,
          questions: bankEditing.questions,
        },
        bankIsNew ? undefined : bankEditing.id
      );
      toast.success("Assessment saved");
      setBankEditing(null);
      await reload();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to save assessment");
    } finally {
      setSaving(false);
    }
  };

  const updateQuestion = (index: number, patch: Partial<QuizQuestion>) => {
    setBankEditing((current) => {
      if (!current) return current;
      const questions = [...current.questions];
      questions[index] = { ...questions[index], ...patch };
      return { ...current, questions };
    });
  };

  const moduleTypeBadge = (type: CourseModuleDoc["type"]) => {
    if (type === "video") return <Badge variant="secondary"><Video className="mr-1 h-3 w-3" />Video</Badge>;
    if (type === "quiz") return <Badge variant="secondary"><FileQuestion className="mr-1 h-3 w-3" />Quiz</Badge>;
    if (type === "scorm") return <Badge variant="secondary">SCORM</Badge>;
    return <Badge variant="secondary"><FileText className="mr-1 h-3 w-3" />Doc</Badge>;
  };

  return (
    <Dialog open={!!course} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Course Content — {course?.code}</DialogTitle>
          <DialogDescription>
            Lessons, attached section quizzes, and the final examination bank.
          </DialogDescription>
        </DialogHeader>

        {/* ---------- Modules ---------- */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="font-semibold text-sm">Lessons / modules</p>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                setModuleEditing({
                  title: "",
                  description: "",
                  type: "document",
                  order: modules.length + 1,
                  contentUrl: "",
                  contentHtml: "",
                })
              }
            >
              <Plus className="mr-1 h-4 w-4" /> Add lesson
            </Button>
          </div>
          {modules.length === 0 && (
            <p className="text-sm text-muted-foreground rounded border p-3">
              No lessons yet. Add the first lesson or upload a SCORM package.
            </p>
          )}
          {modules.map((module, index) => (
            <div
              key={module.id}
              className="flex items-center justify-between gap-2 border rounded-md px-3 py-2"
            >
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-xs text-muted-foreground w-6">{module.order}.</span>
                {moduleTypeBadge(module.type)}
                <span className="text-sm truncate">{module.title}</span>
                {banks.some((bank) => bank.moduleId === module.id) && (
                  <Badge variant="outline" className="text-xs">quiz attached</Badge>
                )}
              </div>
              <div className="flex items-center">
                <Button variant="ghost" size="icon" disabled={index === 0} onClick={() => void moveModule(module.id, -1)} title="Move up">
                  <ArrowUp className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" disabled={index === modules.length - 1} onClick={() => void moveModule(module.id, 1)} title="Move down">
                  <ArrowDown className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => setModuleEditing(module)} title="Edit">
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  title="Delete"
                  onClick={async () => {
                    await deleteCourseModule(module.id);
                    await reload();
                  }}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </div>
          ))}
        </div>

        {/* ---------- Question banks ---------- */}
        <div className="space-y-2 border-t pt-4">
          <div className="flex items-center justify-between">
            <p className="font-semibold text-sm">Quizzes &amp; exams</p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setBankIsNew(true);
                setBankEditing({
                  id: "",
                  courseId: course!.id,
                  title: "",
                  type: "quiz",
                  moduleId: "",
                  randomize: true,
                  questions: [newQuestion()],
                  createdAt: null as unknown as QuestionBankDoc["createdAt"],
                });
              }}
            >
              <Plus className="mr-1 h-4 w-4" /> New assessment
            </Button>
          </div>
          {banks.length === 0 && (
            <p className="text-sm text-muted-foreground rounded border p-3">
              No assessments yet. Section quizzes attach to a lesson; exams unlock after all lessons are complete.
            </p>
          )}
          {banks.map((bank) => (
            <div key={bank.id} className="flex items-center justify-between gap-2 border rounded-md px-3 py-2">
              <div className="flex items-center gap-2 min-w-0">
                <Badge variant={bank.type === "exam" ? "default" : "outline"} className={bank.type === "exam" ? "bg-[#1478ac]" : ""}>
                  {bank.type}
                </Badge>
                <span className="text-sm truncate">{bank.title}</span>
                <span className="text-xs text-muted-foreground">
                  {bank.questions.length} question{bank.questions.length === 1 ? "" : "s"}
                  {bank.moduleId ? ` · lesson ${modules.find((m) => m.id === bank.moduleId)?.order || "?"}` : " · course-level"}
                </span>
              </div>
              <div className="flex items-center">
                <Button variant="ghost" size="icon" onClick={() => { setBankIsNew(false); setBankEditing(bank); }} title="Edit">
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  title="Delete"
                  onClick={async () => {
                    await deleteQuestionBank(bank.id);
                    await reload();
                  }}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </div>
          ))}
        </div>

        {/* ---------- Module editor (inline) ---------- */}
        {moduleEditing && (
          <div className="space-y-3 rounded-md border border-[#1478ac]/40 bg-[#f8f7f1] p-4">
            <p className="font-semibold text-sm">{moduleEditing.id ? "Edit lesson" : "New lesson"}</p>
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="space-y-1 sm:col-span-2">
                <Label>Title</Label>
                <Input
                  value={moduleEditing.title || ""}
                  onChange={(e) => setModuleEditing((s) => ({ ...s, title: e.target.value }))}
                />
              </div>
              <div className="space-y-1">
                <Label>Type</Label>
                <Select
                  value={moduleEditing.type || "document"}
                  onValueChange={(value) => setModuleEditing((s) => ({ ...s, type: value as CourseModuleDoc["type"] }))}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {MODULE_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1">
              <Label>Description</Label>
              <Input
                value={moduleEditing.description || ""}
                onChange={(e) => setModuleEditing((s) => ({ ...s, description: e.target.value }))}
              />
            </div>
            <div className="space-y-1">
              <Label>{moduleEditing.type === "video" ? "Video URL" : "Material URL (optional)"}</Label>
              <Input
                value={moduleEditing.contentUrl || ""}
                onChange={(e) => setModuleEditing((s) => ({ ...s, contentUrl: e.target.value }))}
                placeholder={moduleEditing.type === "video" ? "https://…/lesson.mp4" : "https://…/material.pdf"}
              />
            </div>
            <div className="space-y-1">
              <Label>Lesson body (HTML, optional)</Label>
              <Textarea
                rows={4}
                value={moduleEditing.contentHtml || ""}
                onChange={(e) => setModuleEditing((s) => ({ ...s, contentHtml: e.target.value }))}
                placeholder="<h4>Overview</h4><p>…</p>"
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={saveModule} disabled={saving} className="bg-[#1478ac] hover:bg-[#318dc1]">
                Save lesson
              </Button>
              <Button variant="outline" onClick={() => setModuleEditing(null)}>Cancel</Button>
            </div>
          </div>
        )}

        {/* ---------- Question bank editor (inline) ---------- */}
        {bankEditing && (
          <div className="space-y-3 rounded-md border border-[#1478ac]/40 bg-[#f8f7f1] p-4">
            <p className="font-semibold text-sm">{bankIsNew ? "New assessment" : "Edit assessment"}</p>
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="space-y-1 sm:col-span-2">
                <Label>Title</Label>
                <Input
                  value={bankEditing.title}
                  onChange={(e) => setBankEditing((s) => s ? { ...s, title: e.target.value } : s)}
                />
              </div>
              <div className="space-y-1">
                <Label>Type</Label>
                <Select
                  value={bankEditing.type}
                  onValueChange={(value) => setBankEditing((s) => s ? { ...s, type: value as "quiz" | "exam" } : s)}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="quiz">Section quiz</SelectItem>
                    <SelectItem value="exam">Final exam</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="space-y-1">
                <Label>Attach to lesson</Label>
                <Select
                  value={bankEditing.moduleId || "none"}
                  onValueChange={(value) => setBankEditing((s) => s ? { ...s, moduleId: value === "none" ? undefined : value } : s)}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Course-level (final exam)</SelectItem>
                    {modules.map((module) => (
                      <SelectItem key={module.id} value={module.id}>
                        {module.order}. {module.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Questions per attempt</Label>
                <Input
                  type="number"
                  min={0}
                  max={bankEditing.questions.length}
                  value={bankEditing.questionsPerAttempt || ""}
                  onChange={(e) =>
                    setBankEditing((s) => s ? { ...s, questionsPerAttempt: e.target.value ? parseInt(e.target.value, 10) : undefined } : s)
                  }
                  placeholder={`All ${bankEditing.questions.length}`}
                />
              </div>
              <div className="flex items-end justify-between rounded border p-2 bg-white">
                <Label className="font-normal">Randomize questions</Label>
                <Switch
                  checked={bankEditing.randomize}
                  onCheckedChange={(value) => setBankEditing((s) => s ? { ...s, randomize: value } : s)}
                />
              </div>
            </div>

            <div className="space-y-3">
              {bankEditing.questions.map((question, qIndex) => (
                <div key={question.id} className="space-y-2 rounded-md border bg-white p-3">
                  <div className="flex items-center justify-between">
                    <Label>Question {qIndex + 1}</Label>
                    <Button
                      variant="ghost"
                      size="icon"
                      title="Remove question"
                      onClick={() =>
                        setBankEditing((s) => s ? { ...s, questions: s.questions.filter((_, i) => i !== qIndex) } : s)
                      }
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                  <Textarea
                    rows={2}
                    value={question.question}
                    onChange={(e) => updateQuestion(qIndex, { question: e.target.value })}
                    placeholder="Question text"
                  />
                  <div className="grid gap-2 sm:grid-cols-2">
                    {question.options.map((option, oIndex) => (
                      <div key={oIndex} className="flex items-center gap-2">
                        <input
                          type="radio"
                          name={`correct-${question.id}`}
                          checked={question.correctIndex === oIndex}
                          onChange={() => updateQuestion(qIndex, { correctIndex: oIndex })}
                          title="Correct answer"
                          aria-label={`Mark option ${oIndex + 1} correct`}
                        />
                        <Input
                          value={option}
                          onChange={(e) =>
                            updateQuestion(qIndex, {
                              options: question.options.map((o, i) => (i === oIndex ? e.target.value : o)),
                            })
                          }
                          placeholder={`Option ${oIndex + 1}`}
                        />
                        {question.options.length > 2 && (
                          <Button
                            variant="ghost"
                            size="icon"
                            title="Remove option"
                            onClick={() => {
                              const options = question.options.filter((_, i) => i !== oIndex);
                              updateQuestion(qIndex, {
                                options,
                                correctIndex: question.correctIndex === oIndex
                                  ? 0
                                  : question.correctIndex > oIndex
                                    ? question.correctIndex - 1
                                    : question.correctIndex,
                              });
                            }}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={question.options.length >= 6}
                    onClick={() => updateQuestion(qIndex, { options: [...question.options, ""] })}
                  >
                    <Plus className="mr-1 h-3 w-3" /> Add option
                  </Button>
                  <Input
                    value={question.explanation || ""}
                    onChange={(e) => updateQuestion(qIndex, { explanation: e.target.value })}
                    placeholder="Explanation shown after grading (optional)"
                  />
                </div>
              ))}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setBankEditing((s) => s ? { ...s, questions: [...s.questions, newQuestion()] } : s)}
              >
                <Plus className="mr-1 h-3 w-3" /> Add question
              </Button>
            </div>

            <div className="flex gap-2">
              <Button onClick={saveBank} disabled={saving} className="bg-[#1478ac] hover:bg-[#318dc1]">
                Save assessment
              </Button>
              <Button variant="outline" onClick={() => setBankEditing(null)}>Cancel</Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
