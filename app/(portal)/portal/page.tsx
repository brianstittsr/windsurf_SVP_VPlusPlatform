"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRequireAuth } from "@/lib/hooks/use-auth";
import {
  getStudentEnrollments,
  listCourses,
  getStudentCertificates,
} from "@/lib/lms";
import type { CourseDoc, EnrollmentDoc, CertificateDoc } from "@/lib/schema";
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
import {
  GraduationCap,
  Award,
  BookOpen,
  ArrowRight,
  Clock,
} from "lucide-react";
import { ResumePaymentCard } from "@/components/lms/resume-payment-card";

export default function PortalDashboard() {
  const { isLoading: authLoading, isAuthenticated, profile } = useRequireAuth();
  const [enrollments, setEnrollments] = useState<EnrollmentDoc[]>([]);
  const [courses, setCourses] = useState<Record<string, CourseDoc>>({});
  const [certificates, setCertificates] = useState<CertificateDoc[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated || !profile.id) return;
    const load = async () => {
      const [enrolls, certs, courseList] = await Promise.all([
        getStudentEnrollments(profile.id, profile.firebaseUid),
        getStudentCertificates(profile.id, profile.firebaseUid),
        listCourses(false),
      ]);
      setEnrollments(enrolls);
      setCertificates(certs);
      setCourses(
        Object.fromEntries(courseList.map((c) => [c.id, c]))
      );
      setLoading(false);
    };
    load();
  }, [isAuthenticated, profile.id, profile.firebaseUid]);

  if (authLoading || !isAuthenticated) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  const active = enrollments.filter((e) => e.status === "active");
  const completed = enrollments.filter((e) => e.status === "completed");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold font-display">
          Welcome back{profile.firstName ? `, ${profile.firstName}` : ""}
        </h1>
        <p className="text-muted-foreground">
          EFVS UAS Training Academy student dashboard
        </p>
      </div>

      <ResumePaymentCard />

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Active Courses
            </CardTitle>
            <BookOpen className="h-4 w-4 text-[#1478ac]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{active.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <GraduationCap className="h-4 w-4 text-[#1478ac]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completed.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Certificates</CardTitle>
            <Award className="h-4 w-4 text-[#d3ac63]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{certificates.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Continue learning */}
      <Card>
        <CardHeader>
          <CardTitle className="font-display">Continue Learning</CardTitle>
          <CardDescription>
            Pick up where you left off
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading ? (
            <Skeleton className="h-24 w-full" />
          ) : active.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">
                You are not enrolled in any courses yet.
              </p>
              <Button asChild>
                <Link href="/portal/courses">
                  Browse Course Catalog <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          ) : (
            active.map((enrollment) => {
              const course = courses[enrollment.courseId];
              return (
                <div
                  key={enrollment.id}
                  className="flex items-center justify-between gap-4 border rounded-lg p-4"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">
                        {course?.code || "Course"}
                      </Badge>
                      <h3 className="font-semibold truncate">
                        {course?.title || enrollment.courseId}
                      </h3>
                    </div>
                    <div className="mt-3 flex items-center gap-3">
                      <Progress
                        value={enrollment.progressPercent}
                        className="h-2 flex-1"
                      />
                      <span className="text-sm text-muted-foreground w-12 text-right">
                        {enrollment.progressPercent}%
                      </span>
                    </div>
                    {enrollment.lastAccessedAt && (
                      <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                        <Clock className="h-3 w-3" /> Last accessed{" "}
                        {enrollment.lastAccessedAt
                          .toDate()
                          .toLocaleDateString()}
                      </p>
                    )}
                  </div>
                  <Button asChild className="bg-[#1478ac] hover:bg-[#318dc1]">
                    <Link href={`/portal/learn/${enrollment.id}`}>
                      Resume <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              );
            })
          )}
        </CardContent>
      </Card>
    </div>
  );
}
