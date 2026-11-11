"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRequireAuth } from "@/lib/hooks/use-auth";
import { getStudentEnrollments, listCourses } from "@/lib/lms";
import type { CourseDoc, EnrollmentDoc } from "@/lib/schema";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowRight, CheckCircle, AlertTriangle, XCircle } from "lucide-react";

export default function MyCoursesPage() {
  const { isLoading: authLoading, isAuthenticated, profile } = useRequireAuth();
  const [enrollments, setEnrollments] = useState<EnrollmentDoc[]>([]);
  const [courses, setCourses] = useState<Record<string, CourseDoc>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated || !profile.id) return;
    const load = async () => {
      const [enrolls, courseList] = await Promise.all([
        getStudentEnrollments(profile.id, profile.firebaseUid),
        listCourses(false),
      ]);
      setEnrollments(enrolls);
      setCourses(Object.fromEntries(courseList.map((c) => [c.id, c])));
      setLoading(false);
    };
    load();
  }, [isAuthenticated, profile.id, profile.firebaseUid]);

  if (authLoading || !isAuthenticated) {
    return <Skeleton className="h-64 w-full" />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold font-display">My Courses</h1>
        <p className="text-muted-foreground">
          Your enrolled courses and progress
        </p>
      </div>

      {loading ? (
        <Skeleton className="h-64 w-full" />
      ) : enrollments.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground mb-4">
              You haven&apos;t enrolled in any courses yet.
            </p>
            <Button asChild>
              <Link href="/portal/courses">Browse Catalog</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {enrollments.map((enrollment) => {
            const course = courses[enrollment.courseId];
            const isComplete = enrollment.status === "completed";
            const isInactive = enrollment.status === "cancelled" || enrollment.status === "expired";
            const statusBadge = isComplete ? (
              <Badge variant="default" className="bg-[#8A6212]">
                <span className="flex items-center gap-1">
                  <CheckCircle className="h-3 w-3" /> Completed
                </span>
              </Badge>
            ) : enrollment.status === "cancelled" ? (
              <Badge variant="outline" className="border-destructive text-destructive">
                <span className="flex items-center gap-1">
                  <XCircle className="h-3 w-3" /> Cancelled
                </span>
              </Badge>
            ) : enrollment.status === "expired" ? (
              <Badge variant="outline" className="border-amber-600 text-amber-700">
                <span className="flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" /> Expired
                </span>
              </Badge>
            ) : (
              <Badge variant="secondary">In Progress</Badge>
            );
            return (
              <Card key={enrollment.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    {statusBadge}
                    <span className="text-xs text-muted-foreground">
                      Enrolled{" "}
                      {enrollment.enrolledAt?.toDate().toLocaleDateString()}
                    </span>
                  </div>
                  <CardTitle className="text-lg">
                    {course?.code} — {course?.title || enrollment.courseId}
                  </CardTitle>
                  <CardDescription className="line-clamp-2">
                    {course?.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Progress
                      value={enrollment.progressPercent}
                      className="h-2 flex-1"
                    />
                    <span className="text-sm text-muted-foreground w-12 text-right">
                      {enrollment.progressPercent}%
                    </span>
                  </div>
                  {isInactive ? (
                    <>
                      <p className="text-sm text-muted-foreground">
                        {enrollment.status === "cancelled"
                          ? "This enrollment was cancelled. Contact V+ support if you believe this is an error."
                          : "This enrollment has expired. Contact V+ to discuss re-enrollment."}
                      </p>
                      <Button asChild variant="outline" className="w-full">
                        <Link href={`/portal/courses/${enrollment.courseId}`}>
                          View Course Details <ArrowRight className="ml-2 h-4 w-4" />
                        </Link>
                      </Button>
                    </>
                  ) : (
                    <Button
                      asChild
                      className="w-full bg-[#8A6212] hover:bg-[#8A6212]"
                    >
                      <Link href={`/portal/learn/${enrollment.id}`}>
                        {isComplete ? "Review Course" : "Continue Course"}{" "}
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
