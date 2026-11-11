"use client";

import { useEffect, useState } from "react";
import { auth } from "@/lib/firebase";
import { useRequireAuth } from "@/lib/hooks/use-auth";
import {
  listEnrollments,
  listCourses,
  listUsers,
} from "@/lib/lms";
import type { CourseDoc, EnrollmentDoc, TeamMemberDoc } from "@/lib/schema";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Plus } from "lucide-react";

export default function AdminEnrollmentsPage() {
  const { isLoading, isAuthenticated } = useRequireAuth(["admin"]);
  const [rows, setRows] = useState<
    (EnrollmentDoc & { student?: TeamMemberDoc; course?: CourseDoc })[]
  >([]);
  const [students, setStudents] = useState<TeamMemberDoc[]>([]);
  const [courses, setCourses] = useState<CourseDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ studentId: "", courseId: "" });

  const load = async () => {
    const [enrolls, users, courseList] = await Promise.all([
      listEnrollments(),
      listUsers(),
      listCourses(false),
    ]);
    const userMap = new Map(users.map((u) => [u.id, u]));
    const courseMap = new Map(courseList.map((c) => [c.id, c]));
    setRows(
      enrolls.map((e) => ({
        ...e,
        student: userMap.get(e.studentId),
        course: courseMap.get(e.courseId),
      }))
    );
    setStudents(users.filter((u) => u.role === "student"));
    setCourses(courseList);
    setLoading(false);
  };

  useEffect(() => {
    if (!isAuthenticated) return;
    let cancelled = false;
    void (async () => {
      const [enrolls, users, courseList] = await Promise.all([
        listEnrollments(),
        listUsers(),
        listCourses(false),
      ]);
      if (cancelled) return;
      const userMap = new Map(users.map((u) => [u.id, u]));
      const courseMap = new Map(courseList.map((c) => [c.id, c]));
      setRows(
        enrolls.map((e) => ({
          ...e,
          student: userMap.get(e.studentId),
          course: courseMap.get(e.courseId),
        }))
      );
      setStudents(users.filter((u) => u.role === "student"));
      setCourses(courseList);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated]);

  const create = async () => {
    if (!form.studentId || !form.courseId || !auth?.currentUser) return;
    try {
      const idToken = await auth.currentUser.getIdToken();
      const response = await fetch("/api/lms/enrollments", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${idToken}` },
        body: JSON.stringify({ studentId: form.studentId, courseId: form.courseId }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Unable to create enrollment");
      toast.success("Enrollment created");
      setOpen(false);
      setForm({ studentId: "", courseId: "" });
      load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to create enrollment");
    }
  };

  const setStatus = async (
    enrollment: EnrollmentDoc,
    status: EnrollmentDoc["status"]
  ) => {
    if (!auth?.currentUser) return;
    try {
      const idToken = await auth.currentUser.getIdToken();
      const response = await fetch("/api/lms/enrollments", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${idToken}` },
        body: JSON.stringify({ enrollmentId: enrollment.id, status }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Unable to update status");
      if (status === "completed" && result.data?.certificateIssued) {
        toast.success("Enrollment completed — certificate issued");
      }
      load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to update status");
    }
  };

  if (isLoading || !isAuthenticated || loading) {
    return <Skeleton className="h-96 w-full" />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-display">Enrollments</h1>
          <p className="text-muted-foreground">
            Manage student course enrollments
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="bg-[#8A6212] hover:bg-[#8A6212]">
              <Plus className="mr-2 h-4 w-4" /> Manual Enrollment
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Enroll a Student</DialogTitle>
              <DialogDescription>
                For ACH-invoiced and comped seats — no payment required
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Student</Label>
                <Select
                  value={form.studentId}
                  onValueChange={(v) =>
                    setForm((s) => ({ ...s, studentId: v }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select student" />
                  </SelectTrigger>
                  <SelectContent>
                    {students.map((s) => (
                      <SelectItem key={s.id} value={s.id} disabled={!s.firebaseUid}>
                        {s.firstName} {s.lastName} — {s.emailPrimary}{!s.firebaseUid ? " (no Academy sign-in)" : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Course</Label>
                <Select
                  value={form.courseId}
                  onValueChange={(v) =>
                    setForm((s) => ({ ...s, courseId: v }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select course" />
                  </SelectTrigger>
                  <SelectContent>
                    {courses.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.code} — {c.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button
                onClick={create}
                disabled={!form.studentId || !form.courseId}
                className="w-full bg-[#8A6212] hover:bg-[#8A6212]"
              >
                Enroll
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead>Course</TableHead>
                <TableHead>Enrolled</TableHead>
                <TableHead>Progress</TableHead>
                <TableHead>Payment</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="text-center text-muted-foreground py-10"
                  >
                    No enrollments yet.
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell>
                      <div className="font-medium">
                        {r.student
                          ? `${r.student.firstName} ${r.student.lastName}`
                          : r.studentId}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {r.student?.emailPrimary}
                      </div>
                    </TableCell>
                    <TableCell>{r.course?.code || r.courseId}</TableCell>
                    <TableCell className="text-sm">
                      {r.enrolledAt?.toDate().toLocaleDateString()}
                    </TableCell>
                    <TableCell>{r.progressPercent}%</TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {r.paymentId ? "Stripe" : "Manual"}
                    </TableCell>
                    <TableCell>
                      <Select
                        value={r.status}
                        onValueChange={(v) =>
                          setStatus(r, v as EnrollmentDoc["status"])
                        }
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                          <SelectItem value="expired">Expired</SelectItem>
                          <SelectItem value="cancelled">Cancelled</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
