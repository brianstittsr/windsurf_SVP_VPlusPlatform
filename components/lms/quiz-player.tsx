"use client";

import { useEffect, useState } from "react";
import { auth } from "@/lib/firebase";
import type {
  EnrollmentDoc,
  LearnerQuestionBankDoc,
  LearnerQuizQuestion,
  CourseDoc,
} from "@/lib/schema";
import { getAttemptsFor } from "@/lib/lms";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { CheckCircle, XCircle, Award } from "lucide-react";
import { toast } from "sonner";

interface QuizPlayerProps {
  bank: LearnerQuestionBankDoc;
  course: CourseDoc;
  enrollment: EnrollmentDoc;
  onPassed?: () => void;
}

function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/**
 * Renders a quiz/exam from a question bank with randomized questions,
 * automated grading, pass/fail vs course.passingScore, and attempt limits.
 */
export function QuizPlayer({
  bank,
  course,
  enrollment,
  onPassed,
}: QuizPlayerProps) {
  const [attempts, setAttempts] = useState(0);
  const [questions, setQuestions] = useState<LearnerQuizQuestion[]>([]);
  const [startedAt, setStartedAt] = useState<string>("");
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [result, setResult] = useState<{
    scorePercent: number;
    passed: boolean;
    review?: { questionId: string; correct: boolean; explanation: string }[];
  } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const attemptsAllowed = course.maxAttempts || 3;
  const attemptsLeft = attemptsAllowed - attempts;

  useEffect(() => {
    void getAttemptsFor(enrollment.id, bank.id, enrollment.firebaseUid).then((attemptList) => {
      setAttempts(attemptList.length);
      const best = attemptList.filter((attempt) => attempt.passed).sort((a, b) => b.scorePercent - a.scorePercent)[0];
      if (best) setResult({ scorePercent: best.scorePercent, passed: true });
    }).catch((error: unknown) => {
      console.error("Unable to load quiz attempts:", error);
      toast.error("Unable to load assessment history");
    });
  }, [enrollment.id, enrollment.firebaseUid, bank.id]);

  const startQuiz = () => {
    let qs = bank.questions || [];
    if (bank.randomize) qs = shuffle(qs);
    if (bank.questionsPerAttempt && bank.questionsPerAttempt < qs.length) {
      qs = qs.slice(0, bank.questionsPerAttempt);
    }
    qs = qs.map((question) => ({ ...question, options: shuffle(question.options) }));
    setQuestions(qs);
    setAnswers({});
    setStartedAt(new Date().toISOString());
    setResult(null);
  };

  const submit = async () => {
    if (!auth?.currentUser) {
      toast.error("Sign in again to submit this assessment");
      return;
    }
    setSubmitting(true);
    try {
      const idToken = await auth.currentUser.getIdToken();
      const response = await fetch("/api/lms/exam-attempts", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${idToken}` },
        body: JSON.stringify({
          enrollmentId: enrollment.id,
          quizId: bank.id,
          startedAt,
          answers: questions.map((question) => ({
            questionId: question.id,
            selectedAnswer: question.options[answers[question.id]],
          })),
        }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Unable to submit assessment");
      const scorePercent = Number(result.data.scorePercent);
      const passed = result.data.passed === true;
      const review = Array.isArray(result.data.review) ? result.data.review : undefined;
      setAttempts((count) => count + 1);
      setResult({ scorePercent, passed, review });
      if (passed) onPassed?.();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to submit assessment");
    } finally {
      setSubmitting(false);
    }
  };

  if (questions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="font-display">{bank.title}</CardTitle>
          <CardDescription>
            {bank.type === "exam" ? "Examination" : "Quiz"} · Passing score{" "}
            {course.passingScore}% · Attempts left: {attemptsLeft}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {result?.passed && (
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                You have already passed this {bank.type}.
              </AlertDescription>
            </Alert>
          )}
          {attemptsLeft <= 0 && !result?.passed ? (
            <Alert variant="destructive">
              <AlertDescription>
                You have used all {attemptsAllowed} attempts. Contact V+
                support for assistance.
              </AlertDescription>
            </Alert>
          ) : (
            !result?.passed && (
              <Button
                onClick={startQuiz}
                className="bg-[#8A6212] hover:bg-[#8A6212]"
              >
                Start {bank.type === "exam" ? "Exam" : "Quiz"} (
                {bank.questions.length} questions)
              </Button>
            )
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="font-display">{bank.title}</CardTitle>
          <Badge variant="secondary">
            Attempt {attempts + 1} of {attemptsAllowed}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {result ? (
          <div
            className={`rounded-lg p-6 text-center ${
              result.passed ? "bg-green-50" : "bg-red-50"
            }`}
          >
            {result.passed ? (
              <CheckCircle className="h-10 w-10 text-green-600 mx-auto" />
            ) : (
              <XCircle className="h-10 w-10 text-red-600 mx-auto" />
            )}
            <p className="mt-2 text-2xl font-bold">{result.scorePercent}%</p>
            <p className="text-muted-foreground">
              {result.passed
                ? "Passed — great work."
                : `Not passed. Required: ${course.passingScore}%.`}
            </p>
            {!result.passed && attemptsLeft > 0 && (
              <Button variant="outline" className="mt-4" onClick={startQuiz}>
                Retake ({attemptsLeft} left)
              </Button>
            )}
            {result.passed && (
              <p className="mt-2 text-sm text-green-700 flex items-center justify-center gap-1">
                <Award className="h-4 w-4" /> Your certificate is available on
                the Certificates page.
              </p>
            )}
            {result.review && result.review.length > 0 && (
              <div className="mt-6 space-y-3 text-left">
                <p className="text-sm font-semibold">Answer review</p>
                {result.review.map((entry) => {
                  const question = questions.find((q) => q.id === entry.questionId);
                  return (
                    <div
                      key={entry.questionId}
                      className={`rounded-md border p-3 text-sm ${
                        entry.correct ? "border-green-200 bg-green-50/50" : "border-red-200 bg-red-50/50"
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        {entry.correct ? (
                          <CheckCircle className="h-4 w-4 shrink-0 text-green-600 mt-0.5" />
                        ) : (
                          <XCircle className="h-4 w-4 shrink-0 text-red-600 mt-0.5" />
                        )}
                        <div>
                          <p className="font-medium">{question?.question || "Question"}</p>
                          {entry.explanation && (
                            <p className="mt-1 text-muted-foreground">{entry.explanation}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          <>
            {questions.map((q, qi) => (
              <div key={q.id} className="space-y-3">
                <p className="font-medium">
                  {qi + 1}. {q.question}
                </p>
                <RadioGroup
                  value={answers[q.id]?.toString()}
                  onValueChange={(v) =>
                    setAnswers((a) => ({ ...a, [q.id]: parseInt(v, 10) }))
                  }
                >
                  {q.options.map((opt, oi) => (
                    <div key={oi} className="flex items-center space-x-2">
                      <RadioGroupItem
                        value={oi.toString()}
                        id={`${q.id}-${oi}`}
                      />
                      <Label htmlFor={`${q.id}-${oi}`} className="font-normal">
                        {opt}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>
            ))}
            <Button
              onClick={submit}
              disabled={
                submitting ||
                Object.keys(answers).length !== questions.length
              }
              className="bg-[#8A6212] hover:bg-[#8A6212]"
            >
              Submit Answers
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}
