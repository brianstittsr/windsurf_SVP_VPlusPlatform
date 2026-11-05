"use client";

import { useEffect, useState } from "react";
import { auth } from "@/lib/firebase";
import { useRequireAuth } from "@/lib/hooks/use-auth";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Database, Loader2, Trash2, CheckCircle } from "lucide-react";

interface SeedResponse {
  data?: { created?: boolean; message?: string; counts?: Record<string, number>; seeded?: boolean; version?: string };
  error?: string;
}

export default function AdminSeedPage() {
  const { isLoading, isAuthenticated } = useRequireAuth(["admin"]);
  const [seeded, setSeeded] = useState<boolean | null>(null);
  const [studyGuideSeeded, setStudyGuideSeeded] = useState<boolean | null>(null);
  const [working, setWorking] = useState(false);
  const [counts, setCounts] = useState<Record<string, number>>({});

  const callSeedApi = async (method: "GET" | "POST" | "DELETE"): Promise<SeedResponse> => {
    if (!auth?.currentUser) throw new Error("Sign in again to continue");
    const token = await auth.currentUser.getIdToken();
    const response = await fetch("/api/admin/seed/ac1", { method, headers: { Authorization: `Bearer ${token}` } });
    const result = (await response.json()) as SeedResponse;
    if (!response.ok) throw new Error(result.error || "Demo-data operation failed");
    return result;
  };

  useEffect(() => {
    if (!isAuthenticated) return;
    let active = true;
    void Promise.all([
      callSeedApi("GET"),
      (async () => {
        if (!auth?.currentUser) throw new Error("Sign in again to continue");
        const token = await auth.currentUser.getIdToken();
        const response = await fetch("/api/admin/seed/study-guide", { headers: { Authorization: `Bearer ${token}` } });
        const result = (await response.json()) as SeedResponse;
        if (!response.ok) throw new Error(result.error || "Unable to check study-guide data");
        return result;
      })(),
    ])
      .then(([ac1, guide]) => {
        if (!active) return;
        setSeeded(ac1.data?.seeded === true);
        setStudyGuideSeeded(guide.data?.seeded === true);
      })
      .catch((error: unknown) => {
        if (active) {
          setSeeded(false);
          setStudyGuideSeeded(false);
          toast.error(error instanceof Error ? error.message : "Unable to check seed data");
        }
      });
    return () => { active = false; };
  }, [isAuthenticated]);

  const seed = async () => {
    setWorking(true);
    try {
      const result = await callSeedApi("POST");
      setCounts(result.data?.counts || {});
      setSeeded(result.data?.created === true || seeded === true);
      if (result.data?.created) toast.success(result.data.message || "Sample course data seeded");
      else toast.info(result.data?.message || "Demo data already exists");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Seeding failed");
    } finally {
      setWorking(false);
    }
  };

  const seedStudyGuide = async () => {
    setWorking(true);
    try {
      if (!auth?.currentUser) throw new Error("Sign in again to continue");
      const token = await auth.currentUser.getIdToken();
      const response = await fetch("/api/admin/seed/study-guide", { method: "POST", headers: { Authorization: `Bearer ${token}` } });
      const result = (await response.json()) as SeedResponse;
      if (!response.ok) throw new Error(result.error || "Study-guide import failed");
      setStudyGuideSeeded(true);
      toast.success(`Imported ${result.data?.counts?.questions || 0} study questions and ${result.data?.counts?.vocabularyTerms || 0} vocabulary terms into LMS Firestore.`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Study-guide import failed");
    } finally {
      setWorking(false);
    }
  };

  const remove = async () => {
    setWorking(true);
    try {
      const result = await callSeedApi("DELETE");
      setCounts(result.data?.counts || {});
      setSeeded(false);
      toast.success("All demo data removed.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Removal failed");
    } finally {
      setWorking(false);
    }
  };

  if (isLoading || !isAuthenticated || seeded === null || studyGuideSeeded === null) return <Skeleton className="h-96 w-full" />;

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold">Demo Data</h1>
        <p className="text-muted-foreground">
          Seed or remove the sample AC1 Part 107 course, quizzes, final exam, and mock students.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-display"><Database className="h-5 w-5 text-[#1478ac]" />AC1 — FAA Part 107 Sample Course</CardTitle>
          <CardDescription>
            Creates six lessons with imagery, five section quizzes, a randomized final exam, six mock students with enrollments, lesson progress, graded attempts, and three completion certificates. Correct answers stay server-side; mock records are tagged for removal.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2"><span className="text-sm text-muted-foreground">Status:</span><Badge variant={seeded ? "default" : "outline"}>{seeded ? "Seeded" : "Not seeded"}</Badge></div>
          <div className="flex flex-wrap gap-3">
            <Button onClick={seed} disabled={working || seeded} className="bg-[#1478ac] hover:bg-[#318dc1]">
              {working ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle className="mr-2 h-4 w-4" />}
              Seed Demo Data
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild><Button variant="destructive" disabled={working || !seeded}><Trash2 className="mr-2 h-4 w-4" />Remove Demo Data</Button></AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader><AlertDialogTitle>Remove all demo data?</AlertDialogTitle><AlertDialogDescription>This removes mock students, enrollments, progress records, exam attempts, and certificates tagged with the demo seed marker. If AC1 has been imported as a catalog course, its course and lesson content are preserved; otherwise the demo course content is removed. Real data is not affected.</AlertDialogDescription></AlertDialogHeader>
                <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={remove}>Delete Demo Data</AlertDialogAction></AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
          {Object.keys(counts).length > 0 && <div className="rounded-md border bg-muted/40 p-3 text-sm"><p className="mb-1 font-medium">Last operation:</p><ul className="grid grid-cols-2 gap-x-6 gap-y-1">{Object.entries(counts).map(([key, value]) => <li key={key} className="flex justify-between"><span className="text-muted-foreground">{key}</span><span className="font-mono">{value}</span></li>)}</ul></div>}
          <p className="text-xs text-muted-foreground">Mock students cannot sign in — they exist as roster/report data only. Enroll with your own student account to try the learner experience.</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-display"><Database className="h-5 w-5 text-[#1478ac]" />Part 107 Study Guide Content</CardTitle>
          <CardDescription>Imports the complete question bank, nine categories, explanations, and vocabulary into LMS Firestore. Correct answers remain available only to server-side grading.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center justify-between gap-4">
          <Badge variant={studyGuideSeeded ? "default" : "outline"}>{studyGuideSeeded ? "Content in LMS database" : "Not imported"}</Badge>
          <Button onClick={seedStudyGuide} disabled={working || studyGuideSeeded} className="bg-[#1478ac] hover:bg-[#318dc1]">{working ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle className="mr-2 h-4 w-4" />}Import study content</Button>
        </CardContent>
      </Card>
    </div>
  );
}
