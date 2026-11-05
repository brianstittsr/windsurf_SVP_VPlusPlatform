"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRequireAuth } from "@/lib/hooks/use-auth";
import { listCourses, getStudentEnrollments } from "@/lib/lms";
import type { CourseDoc, EnrollmentDoc } from "@/lib/schema";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowRight } from "lucide-react";

export default function CourseCatalogPage() {
  const { isLoading: authLoading, isAuthenticated, profile } = useRequireAuth();
  const [courses, setCourses] = useState<CourseDoc[]>([]);
  const [enrolledIds, setEnrolledIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) return;
    const load = async () => {
      const [courseList, enrolls] = await Promise.all([
        listCourses(true),
        profile.id ? getStudentEnrollments(profile.id, profile.firebaseUid) : Promise.resolve([]),
      ]);
      setCourses(courseList);
      setEnrolledIds(
        new Set(
          enrolls
            .filter((e: EnrollmentDoc) => e.status !== "cancelled")
            .map((e: EnrollmentDoc) => e.courseId)
        )
      );
      setLoading(false);
    };
    load();
  }, [isAuthenticated, profile.id, profile.firebaseUid]);

  const price = (cents: number) =>
    cents === 0 ? "Free" : `$${(cents / 100).toFixed(2)}`;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold font-display">Course Catalog</h1>
        <p className="text-muted-foreground">
          EFVS Academy courses and certification programs
        </p>
      </div>

      {authLoading || loading ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-72 w-full" />
          ))}
        </div>
      ) : courses.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">
              No courses are published yet. Please check back soon.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {courses.map((course) => (
            <Card key={course.id} className="flex flex-col overflow-hidden">
              {course.imageUrl && (
                <div className="relative h-40 w-full">
                  <Image
                    src={course.imageUrl}
                    alt={course.title}
                    fill
                    className="object-cover"
                  />
                </div>
              )}
              <CardHeader>
                <div className="flex items-center justify-between">
                  <Badge variant="secondary">{course.code}</Badge>
                  <span className="font-semibold text-[#1478ac]">
                    {price(course.priceCents)}
                  </span>
                </div>
                <CardTitle className="text-lg">{course.title}</CardTitle>
                <CardDescription className="line-clamp-3">
                  {course.description}
                </CardDescription>
              </CardHeader>
              <CardFooter className="mt-auto">
                {enrolledIds.has(course.id) ? (
                  <Button asChild className="w-full" variant="secondary">
                    <Link href="/portal/my-courses">
                      Enrolled — Go to My Courses
                    </Link>
                  </Button>
                ) : (
                  <Button
                    asChild
                    className="w-full bg-[#1478ac] hover:bg-[#318dc1]"
                  >
                    <Link href={`/portal/courses/${course.id}`}>
                      View Course <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                )}
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
