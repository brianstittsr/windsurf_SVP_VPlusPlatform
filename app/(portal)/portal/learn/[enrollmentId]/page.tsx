"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/firebase";
import { useRequireAuth } from "@/lib/hooks/use-auth";
import {
  getEnrollment,
  getCourse,
  getScormPackage,
  listCourseModules,
  listQuestionBanks,
  markEnrollmentAccessed,
  getScormRuntime,
  getLessonProgress,
} from "@/lib/lms";
import type {
  CourseDoc,
  CourseModuleDoc,
  EnrollmentDoc,
  LearnerQuestionBankDoc,
  ScormPackageDoc,
} from "@/lib/schema";
import { ScormPlayer } from "@/components/lms/scorm-player";
import { QuizPlayer } from "@/components/lms/quiz-player";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { ArrowLeft, CheckCircle, Award, FileText, Video } from "lucide-react";

export default function LearnPage() {
  const params = useParams<{ enrollmentId: string }>();
  const {
    isLoading: authLoading,
    isAuthenticated,
    profile,
  } = useRequireAuth();
  const [enrollment, setEnrollment] = useState<EnrollmentDoc | null>(null);
  const [course, setCourse] = useState<CourseDoc | null>(null);
  const [pkg, setPkg] = useState<ScormPackageDoc | null>(null);
  const [modules, setModules] = useState<CourseModuleDoc[]>([]);
  const [banks, setBanks] = useState<LearnerQuestionBankDoc[]>([]);
  const [activeModule, setActiveModule] = useState<CourseModuleDoc | null>(null);
  const [completedModuleIds, setCompletedModuleIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  const issueCertIfComplete = useCallback(async () => {
    if (!enrollment || !course || !auth?.currentUser) return;
    try {
      const idToken = await auth.currentUser.getIdToken();
      const response = await fetch("/api/certificates/issue", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${idToken}` },
        body: JSON.stringify({ enrollmentId: enrollment.id }),
      });
      const result = await response.json();
      if (response.status === 409) return;
      if (!response.ok) throw new Error(result.error || "Unable to issue completion credential");
      toast.success(`Certificate ${result.data.certificateNumber} issued!`, { description: "Find and share it from your Certificates page." });
    } catch (error) {
      console.error("[learn] certificate issue failed:", error);
      toast.error(error instanceof Error ? error.message : "Unable to issue certificate");
    }
  }, [enrollment, course]);

  useEffect(() => {
    if (!isAuthenticated || !params.enrollmentId) return;
    const load = async () => {
      const en = await getEnrollment(params.enrollmentId);
      if (!en || (en.studentId !== profile.id && profile.role !== "admin" && profile.role !== "instructor")) {
        setLoading(false);
        return;
      }
      setEnrollment(en);
      await markEnrollmentAccessed(en.id);
      const c = await getCourse(en.courseId);
      setCourse(c);
      if (c) {
        if (c.format === "scorm" && c.scormPackageId) {
          const p = await getScormPackage(c.scormPackageId);
          setPkg(p);
        }
        const [mods, qbs, progress] = await Promise.all([
          listCourseModules(c.id),
          listQuestionBanks(c.id),
          getLessonProgress(en.id),
        ]);
        setModules(mods);
        setBanks(qbs);
        const done = new Set(progress.filter((p) => p.status === "completed").map((p) => p.moduleId));
        setCompletedModuleIds(done);
        // Auto-resume: open the first incomplete lesson (or the first lesson).
        const resumeModule = mods.find((m) => !done.has(m.id)) || mods[0] || null;
        setActiveModule(resumeModule);
      }
      setLoading(false);
    };
    load();
  }, [isAuthenticated, params.enrollmentId, profile.id, profile.role]);

  const markModuleComplete = async (module: CourseModuleDoc) => {
    if (!enrollment || !auth?.currentUser) return;
    try {
      const idToken = await auth.currentUser.getIdToken();
      const response = await fetch("/api/lms/progress/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${idToken}` },
        body: JSON.stringify({ enrollmentId: enrollment.id, moduleId: module.id }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Unable to save lesson progress");
      const progress = result.data as { progressPercent: number; completed: boolean };
      setEnrollment((current) => current ? { ...current, progressPercent: progress.progressPercent, status: progress.completed ? "completed" : current.status } : current);
      setCompletedModuleIds((current) => new Set(current).add(module.id));
      if (progress.completed) await issueCertIfComplete();
      toast.success("Lesson marked complete");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to save lesson progress");
    }
  };

  const syncScormStatus = async () => {
    if (!enrollment) return;
    const rt = await getScormRuntime(enrollment.id, enrollment.firebaseUid);
    if (!rt) {
      toast.info("No progress reported by the course yet.");
      return;
    }
    const updated = await getEnrollment(enrollment.id);
    if (updated) setEnrollment(updated);
    const completed = rt.lessonStatus === "completed" || rt.lessonStatus === "passed";
    if (completed && updated?.status === "completed") await issueCertIfComplete();
    toast.success(
      `Course status: ${rt.lessonStatus || "in progress"}${rt.scoreRaw ? ` · Score: ${rt.scoreRaw}` : ""}`
    );
  };

  if (authLoading || loading) {
    return <Skeleton className="h-[600px] w-full" />;
  }

  if (!enrollment || !course) {
    return (
      <div className="text-center py-16">
        <p className="text-muted-foreground">
          Enrollment not found or you don&apos;t have access.
        </p>
        <Button variant="link" asChild className="mt-2">
          <Link href="/portal/my-courses">Back to My Courses</Link>
        </Button>
      </div>
    );
  }

  if (enrollment.status === "cancelled" || enrollment.status === "expired") {
    return (
      <div className="text-center py-16 space-y-3">
        <Badge variant="outline" className="border-destructive text-destructive">
          {enrollment.status === "cancelled" ? "Enrollment cancelled" : "Enrollment expired"}
        </Badge>
        <p className="text-muted-foreground max-w-md mx-auto">
          {enrollment.status === "cancelled"
            ? "Learning access to this course is unavailable because the enrollment was cancelled."
            : "Learning access to this course is unavailable because the enrollment period has ended."}
          {" "}Contact V+ support if you believe this is an error.
        </p>
        <Button variant="link" asChild>
          <Link href="/portal/my-courses">Back to My Courses</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <Button variant="ghost" asChild className="-ml-2 mb-1">
            <Link href="/portal/my-courses">
              <ArrowLeft className="mr-2 h-4 w-4" /> My Courses
            </Link>
          </Button>
          <h1 className="text-2xl font-bold font-display">
            {course.code} — {course.title}
          </h1>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 w-48">
            <Progress value={enrollment.progressPercent} className="h-2" />
            <span className="text-sm text-muted-foreground">
              {enrollment.progressPercent}%
            </span>
          </div>
          {enrollment.status === "completed" && (
            <Badge className="bg-[#8A6212]">
              <Award className="h-3 w-3 mr-1" /> Completed
            </Badge>
          )}
        </div>
      </div>

      {course.format === "scorm" && !pkg ? (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            This course&apos;s training package has not been published yet. Please check back later or contact V+.
          </CardContent>
        </Card>
      ) : course.format === "scorm" && pkg ? (
        <div className="space-y-4">
          <ScormPlayer enrollment={enrollment} pkg={pkg} />
          <div className="flex justify-end">
            <Button variant="outline" onClick={syncScormStatus}>
              Sync progress &amp; status
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
          {/* Module list */}
          <Card className="h-fit">
            <CardHeader>
              <CardTitle className="text-base font-display">
                Course Content
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              {modules.length === 0 && banks.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  No course content has been published yet.
                </p>
              )}
              {modules.map((m, i) => {
                const isDone = completedModuleIds.has(m.id);
                return (
                  <button
                    key={m.id}
                    onClick={() => setActiveModule(m)}
                    className={`w-full text-left px-3 py-2 rounded-md text-sm flex items-center gap-2 transition-colors ${
                      activeModule?.id === m.id
                        ? "bg-[#8A6212]/10 text-[#8A6212] font-medium"
                        : "hover:bg-muted"
                    }`}
                  >
                    {isDone ? (
                      <CheckCircle className="h-4 w-4 shrink-0 text-green-600" />
                    ) : m.type === "video" ? (
                      <Video className="h-4 w-4 shrink-0" />
                    ) : m.type === "document" ? (
                      <FileText className="h-4 w-4 shrink-0" />
                    ) : (
                      <CheckCircle className="h-4 w-4 shrink-0 text-muted-foreground/40" />
                    )}
                    {i + 1}. {m.title}
                  </button>
                );
              })}
            </CardContent>
          </Card>

          {/* Active module / quizzes */}
          <div className="space-y-6">
            {activeModule ? (
              <>
              <Card>
                <CardHeader>
                  <CardTitle className="font-display">
                    {activeModule.title}
                  </CardTitle>
                  {activeModule.description && (
                    <CardDescription>{activeModule.description}</CardDescription>
                  )}
                </CardHeader>
                <CardContent className="space-y-4">
                  {activeModule.contentHtml && (
                    <div
                      className="prose-sm max-w-none text-foreground [&_h4]:font-semibold [&_h4]:mt-4 [&_h4]:mb-1 [&_ul]:list-disc [&_ul]:pl-5 [&_li]:my-1 [&_p]:my-2 [&_img]:rounded-lg"
                      dangerouslySetInnerHTML={{
                        __html: activeModule.contentHtml,
                      }}
                    />
                  )}
                  {activeModule.contentUrl &&
                    (activeModule.type === "video" ? (
                      <video
                        src={activeModule.contentUrl}
                        controls
                        className="w-full rounded-lg"
                      />
                    ) : (
                      <Button variant="outline" asChild>
                        <a
                          href={activeModule.contentUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <FileText className="mr-2 h-4 w-4" /> Open Material
                        </a>
                      </Button>
                    ))}
                  <Button
                    onClick={() => markModuleComplete(activeModule)}
                    className="bg-[#8A6212] hover:bg-[#8A6212]"
                  >
                    <CheckCircle className="mr-2 h-4 w-4" /> Mark Complete
                  </Button>
                </CardContent>
              </Card>

              {/* Section quiz attached to this lesson */}
              {banks
                .filter((b) => b.moduleId === activeModule.id)
                .map((bank) => (
                  <QuizPlayer
                    key={bank.id}
                    bank={bank}
                    course={course}
                    enrollment={enrollment}
                    onPassed={issueCertIfComplete}
                  />
                ))}
              </>
            ) : (
              <Card>
                <CardContent className="py-10 text-center text-muted-foreground">
                  Select a lesson from the course outline to begin.
                </CardContent>
              </Card>
            )}

            {/* Final exam / course-level assessments — gated until lessons done */}
            {banks.filter((b) => !b.moduleId).length > 0 && (() => {
              const lessonsDone = modules.length === 0 || modules.every((m) => completedModuleIds.has(m.id));
              const remaining = modules.filter((m) => !completedModuleIds.has(m.id)).length;
              return (
                <div className="space-y-4 pt-4">
                  <h2 className="text-xl font-bold font-display">
                    Final Examination
                  </h2>
                  {!lessonsDone ? (
                    <Card>
                      <CardContent className="py-8 text-center text-muted-foreground">
                        Complete all {modules.length} lessons to unlock the final examination
                        ({remaining} remaining).
                      </CardContent>
                    </Card>
                  ) : (
                    banks
                      .filter((b) => !b.moduleId)
                      .map((bank) => (
                        <QuizPlayer
                          key={bank.id}
                          bank={bank}
                          course={course}
                          enrollment={enrollment}
                          onPassed={issueCertIfComplete}
                        />
                      ))
                  )}
                </div>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
}
