"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { auth } from "@/lib/firebase";
import { useRequireAuth } from "@/lib/hooks/use-auth";
import {
  getCourse,
  getEnrollmentForCourse,
  listCourseModules,
  listCourses,
} from "@/lib/lms";
import type { CourseDoc, CourseModuleDoc } from "@/lib/schema";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, CheckCircle, Loader2, ShieldCheck } from "lucide-react";

export default function CourseDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { isLoading: authLoading, isAuthenticated, profile } = useRequireAuth();
  const [course, setCourse] = useState<CourseDoc | null>(null);
  const [modules, setModules] = useState<CourseModuleDoc[]>([]);
  const [catalogCourses, setCatalogCourses] = useState<CourseDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [enrolled, setEnrolled] = useState<string | null>(null);
  const [checkingOut, setCheckingOut] = useState(false);
  const [promoCode, setPromoCode] = useState("");
  const [purchaseError, setPurchaseError] = useState("");

  useEffect(() => {
    if (!isAuthenticated || !params.id) return;
    const load = async () => {
      const c = await getCourse(params.id);
      setCourse(c);
      if (c) {
        setCatalogCourses(await listCourses(false));
        if (profile.id) {
          const enrollment = await getEnrollmentForCourse(profile.id, c.id, profile.firebaseUid);
          if (enrollment) {
            setEnrolled(enrollment.id);
            setModules(await listCourseModules(c.id));
          }
        }
      }
      setLoading(false);
    };
    load();
  }, [isAuthenticated, params.id, profile.id, profile.firebaseUid]);

  const startRegistration = () => {
    if (!course) return;
    setCheckingOut(true);
    window.location.assign(`/register/student-registration?course=${encodeURIComponent(course.id)}`);
  };

  const enrollFree = async () => {
    if (!course || !auth?.currentUser) return;
    setCheckingOut(true);
    setPurchaseError("");
    try {
      const idToken = await auth.currentUser.getIdToken();
      const response = await fetch("/api/lms/enroll", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${idToken}` },
        body: JSON.stringify({ courseId: course.id }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Unable to enroll");
      router.push(`/portal/learn/${result.data.enrollmentId}`);
    } catch (reason) {
      setPurchaseError(reason instanceof Error ? reason.message : "Unable to enroll");
      setCheckingOut(false);
    }
  };

  const buyCourse = async () => {
    if (!course || !auth?.currentUser) return;
    setCheckingOut(true);
    setPurchaseError("");
    try {
      const idToken = await auth.currentUser.getIdToken();
      const response = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${idToken}` },
        body: JSON.stringify({ courseId: course.id, promoCode: promoCode.trim() || undefined }),
      });
      const result = await response.json();
      if (!response.ok || !result.data?.url) throw new Error(result.error || "Unable to start secure checkout");
      window.location.assign(result.data.url);
    } catch (reason) {
      setPurchaseError(reason instanceof Error ? reason.message : "Unable to start secure checkout");
      setCheckingOut(false);
    }
  };

  if (authLoading || loading) {
    return <Skeleton className="h-96 w-full" />;
  }

  if (!course || course.archived) {
    return (
      <div className="text-center py-16">
        <p className="text-muted-foreground">Course not found.</p>
        <Button variant="link" asChild className="mt-2">
          <Link href="/portal/courses">Back to catalog</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <Button variant="ghost" asChild className="-ml-2">
        <Link href="/portal/courses">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Catalog
        </Link>
      </Button>

      <div className="grid gap-8 md:grid-cols-[2fr_1fr]">
        <div className="space-y-6">
          {course.imageUrl && (
            <div className="relative aspect-video rounded-xl overflow-hidden">
              <Image
                src={course.imageUrl}
                alt={course.title}
                fill
                className="object-cover"
              />
            </div>
          )}
          <div>
            <div className="flex flex-wrap gap-2 mb-2">
              <Badge variant="secondary">{course.code}</Badge>
              {course.category && <Badge variant="outline">{course.category}</Badge>}
              {course.estimatedHours && <Badge variant="outline">{course.estimatedHours} instructional hours</Badge>}
            </div>
            <h1 className="text-3xl font-bold font-display">{course.title}</h1>
            {course.shortDescription && (
              <p className="mt-3 text-lg font-medium">{course.shortDescription}</p>
            )}
            <p className="mt-3 text-muted-foreground leading-relaxed">
              {course.description}
            </p>
          </div>

          {(course.learningOutcomes?.length || course.bundleContents?.length || course.includedCourseIds?.length || course.prerequisiteDescription || modules.length > 0) && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base font-display">Course details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-5 text-sm">
                {course.learningOutcomes && course.learningOutcomes.length > 0 && (
                  <section>
                    <h2 className="font-semibold mb-2">Learning outcomes</h2>
                    <ul className="space-y-2">
                      {course.learningOutcomes.map((item) => (
                        <li key={item} className="flex items-start gap-2">
                          <ShieldCheck className="h-4 w-4 mt-0.5 text-[#1478ac] shrink-0" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </section>
                )}
                {course.prerequisiteDescription && (
                  <section>
                    <h2 className="font-semibold mb-1">Prerequisites</h2>
                    <p className="text-muted-foreground">{course.prerequisiteDescription}</p>
                  </section>
                )}
                {(course.bundleContents?.length || course.includedCourseIds?.length) ? (
                  <section>
                    <h2 className="font-semibold mb-2">Included in this course</h2>
                    <ul className="list-disc pl-5 space-y-1">
                      {(course.bundleContents || []).map((item) => <li key={item}>{item}</li>)}
                      {(course.includedCourseIds || []).map((id) => {
                        const included = catalogCourses.find((item) => item.id === id);
                        return <li key={id}>{included ? `${included.code} — ${included.title}` : `Included course (${id})`}</li>;
                      })}
                    </ul>
                  </section>
                ) : null}
                {modules.length > 0 && (
                  <section>
                    <h2 className="font-semibold mb-2">Course outline</h2>
                    <ol className="list-decimal pl-5 space-y-1">
                      {modules.map((module) => <li key={module.id}>{module.title}{module.description ? ` — ${module.description}` : ""}</li>)}
                    </ol>
                  </section>
                )}
                {course.badge?.issueOnCompletion && (
                  <p className="text-muted-foreground">
                    An EFVS completion credential may be issued when the course completion requirements are met. It is not an FAA-issued certificate.
                  </p>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Purchase panel */}
        <Card className="h-fit sticky top-20">
          <CardHeader>
            <CardTitle className="font-display">Enroll in {course.code}</CardTitle>
            <CardDescription>
              Passing score: {course.passingScore}% · Max attempts:{" "}
              {course.maxAttempts}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {enrolled ? (
              <>
                <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 rounded-md p-3">
                  <CheckCircle className="h-4 w-4" /> You are enrolled in this
                  course.
                </div>
                <Button
                  asChild
                  className="w-full bg-[#1478ac] hover:bg-[#318dc1]"
                >
                  <Link href={`/portal/learn/${enrolled}`}>Start Learning</Link>
                </Button>
              </>
            ) : (
              <>
                <div>
                  <div className="text-3xl font-bold">
                    {course.priceCents === 0 ? "Free" : `$${(course.priceCents / 100).toFixed(2)}`}
                  </div>
                  {course.estimatedHours ? (
                    <p className="mt-1 text-sm text-muted-foreground">{course.estimatedHours} instructional hours</p>
                  ) : null}
                </div>
                {purchaseError && (
                  <Alert variant="destructive">
                    <AlertDescription>{purchaseError}</AlertDescription>
                  </Alert>
                )}
                {course.purchaseMode === "registration" ? (
                  <>
                    <div className="rounded-md border border-[#d9d8ce] bg-[#f8f7f1] p-3 text-sm">
                      <p className="font-medium">Registration and staff review are required.</p>
                      <p className="mt-1 text-muted-foreground">Submit the signed registration form. EFVS will review your application and email a secure checkout link if approved.</p>
                    </div>
                    <Button
                      className="w-full bg-[#1478ac] hover:bg-[#318dc1]"
                      onClick={startRegistration}
                      disabled={checkingOut}
                    >
                      {checkingOut ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                      Continue to Registration
                    </Button>
                    <p className="text-xs text-muted-foreground">
                      Payments are collected by Stripe only after registration approval. This page does not collect card or bank details.
                    </p>
                  </>
                ) : course.priceCents === 0 ? (
                  <>
                    <Button
                      className="w-full bg-[#1478ac] hover:bg-[#318dc1]"
                      onClick={enrollFree}
                      disabled={checkingOut}
                    >
                      {checkingOut ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                      Enroll Free
                    </Button>
                    <p className="text-xs text-muted-foreground">
                      No payment required. Enrollment starts immediately.
                    </p>
                  </>
                ) : (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="course-promo" className="text-xs">Discount code (optional)</Label>
                      <Input
                        id="course-promo"
                        value={promoCode}
                        onChange={(e) => setPromoCode(e.target.value)}
                        placeholder="Enter a veteran or promotional code"
                        autoComplete="off"
                      />
                    </div>
                    <Button
                      className="w-full bg-[#1478ac] hover:bg-[#318dc1]"
                      onClick={buyCourse}
                      disabled={checkingOut}
                    >
                      {checkingOut ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                      Buy Now — ${(course.priceCents / 100).toFixed(2)}
                    </Button>
                    <p className="text-xs text-muted-foreground">
                      Secure checkout by Stripe. Card and bank details are never stored by EFVS.
                    </p>
                  </>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
