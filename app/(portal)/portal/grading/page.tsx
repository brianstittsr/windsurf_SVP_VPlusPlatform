"use client";

import { useEffect, useState } from "react";
import { useRequireAuth } from "@/lib/hooks/use-auth";
import { listExamAttempts, listCourses, listUsers } from "@/lib/lms";
import type { CourseDoc, ExamAttemptDoc, TeamMemberDoc } from "@/lib/schema";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { CheckCircle, XCircle } from "lucide-react";

export default function GradingPage() {
  const { isLoading, isAuthenticated } = useRequireAuth([
    "instructor",
    "admin",
  ]);
  const [rows, setRows] = useState<
    (ExamAttemptDoc & { student?: TeamMemberDoc; course?: CourseDoc })[]
  >([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) return;
    const load = async () => {
      const [attempts, courses, users] = await Promise.all([
        listExamAttempts(),
        listCourses(false),
        listUsers(),
      ]);
      const courseMap = new Map(courses.map((c) => [c.id, c]));
      const userMap = new Map(users.map((u) => [u.id, u]));
      setRows(
        attempts
          .map((a) => ({
            ...a,
            course: courseMap.get(a.courseId),
            student: userMap.get(a.studentId),
          }))
          .sort(
            (a, b) =>
              (b.submittedAt?.toMillis?.() ?? 0) -
              (a.submittedAt?.toMillis?.() ?? 0)
          )
      );
      setLoading(false);
    };
    load();
  }, [isAuthenticated]);

  if (isLoading || !isAuthenticated || loading) {
    return <Skeleton className="h-96 w-full" />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold font-display">Grading</h1>
        <p className="text-muted-foreground">
          Quiz and exam attempts across all courses
        </p>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead>Course</TableHead>
                <TableHead>Attempt</TableHead>
                <TableHead>Score</TableHead>
                <TableHead>Result</TableHead>
                <TableHead>Submitted</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="text-center text-muted-foreground py-10"
                  >
                    No exam attempts recorded yet.
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
                    </TableCell>
                    <TableCell>{r.course?.code || r.courseId}</TableCell>
                    <TableCell>#{r.attemptNumber}</TableCell>
                    <TableCell className="font-medium">
                      {r.scorePercent}%
                    </TableCell>
                    <TableCell>
                      {r.passed ? (
                        <Badge className="bg-green-600">
                          <CheckCircle className="h-3 w-3 mr-1" /> Passed
                        </Badge>
                      ) : (
                        <Badge variant="destructive">
                          <XCircle className="h-3 w-3 mr-1" /> Failed
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-sm">
                      {r.submittedAt?.toDate().toLocaleString()}
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
