"use client";

import { useEffect, useState } from "react";
import { useRequireAuth } from "@/lib/hooks/use-auth";
import { listEnrollments, listCourses, listUsers } from "@/lib/lms";
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
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";

export default function RosterPage() {
  const { isLoading, isAuthenticated } = useRequireAuth([
    "instructor",
    "admin",
  ]);
  const [rows, setRows] = useState<
    (EnrollmentDoc & { student?: TeamMemberDoc; course?: CourseDoc })[]
  >([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) return;
    const load = async () => {
      const [enrolls, courses, users] = await Promise.all([
        listEnrollments(),
        listCourses(false),
        listUsers(),
      ]);
      const courseMap = new Map(courses.map((c) => [c.id, c]));
      const userMap = new Map(users.map((u) => [u.id, u]));
      setRows(
        enrolls.map((e) => ({
          ...e,
          course: courseMap.get(e.courseId),
          student: userMap.get(e.studentId),
        }))
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
        <h1 className="text-3xl font-bold font-display">Class Roster</h1>
        <p className="text-muted-foreground">
          All enrolled students and their progress
        </p>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead>Course</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Progress</TableHead>
                <TableHead>Enrolled</TableHead>
                <TableHead>Last Active</TableHead>
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
                    <TableCell>
                      {r.course?.code || r.courseId}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          r.status === "completed" ? "default" : "secondary"
                        }
                        className={
                          r.status === "completed" ? "bg-[#8A6212]" : ""
                        }
                      >
                        {r.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 w-32">
                        <Progress value={r.progressPercent} className="h-2" />
                        <span className="text-xs">{r.progressPercent}%</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">
                      {r.enrolledAt?.toDate().toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-sm">
                      {r.lastAccessedAt?.toDate().toLocaleDateString() || "—"}
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
