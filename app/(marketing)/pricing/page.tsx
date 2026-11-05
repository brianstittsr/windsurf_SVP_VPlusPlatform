"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Clock3, GraduationCap, ShieldCheck } from "lucide-react";
import type { CourseDoc, LmsProductDoc } from "@/lib/schema";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface CatalogResponse {
  data?: CourseDoc[];
  products?: LmsProductDoc[];
  error?: string;
}

function formatPrice(cents: number, currency = "usd"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(cents / 100);
}

export default function PricingPage() {
  const [courses, setCourses] = useState<CourseDoc[]>([]);
  const [products, setProducts] = useState<LmsProductDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    void fetch("/api/catalog/courses", { cache: "no-store" })
      .then(async (response) => {
        const result = (await response.json()) as CatalogResponse;
        if (!response.ok) throw new Error(result.error || "Unable to load courses");
        if (active) {
          setCourses(result.data || []);
          setProducts(result.products || []);
        }
      })
      .catch((reason: unknown) => {
        if (active) setError(reason instanceof Error ? reason.message : "Unable to load courses");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="bg-background">
      <section className="bg-[#071628] text-white">
        <div className="container py-16 md:py-20">
          <p className="font-display text-sm font-semibold tracking-[0.2em] text-[#56b8e8]">
            EFVS UAS TRAINING ACADEMY
          </p>
          <h1 className="mt-3 max-w-3xl font-display text-4xl font-bold md:text-6xl">
            Courses and pricing
          </h1>
          <p className="mt-5 max-w-2xl text-white/75">
            Compare EFVS Academy training programs. Course descriptions and retail prices are maintained in the Academy catalog.
            Submit the registration form for staff review; checkout and course access follow approval.
          </p>
        </div>
      </section>

      <section className="container py-12 md:py-16">
        {loading ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[0, 1, 2].map((i) => <Skeleton key={i} className="h-[420px]" />)}
          </div>
        ) : error ? (
          <Card><CardContent className="py-10 text-center text-destructive">{error}</CardContent></Card>
        ) : courses.length === 0 && products.length === 0 ? (
          <Card><CardContent className="py-12 text-center text-muted-foreground">Academy products are being prepared. Please check back soon.</CardContent></Card>
        ) : (
          <div className="space-y-14">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {courses.map((course) => (
              <Card key={course.id} className="flex overflow-hidden flex-col">
                {course.imageUrl ? (
                  <div className="relative h-48 w-full bg-muted">
                    <Image src={course.imageUrl} alt={course.title} fill className="object-cover" sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw" />
                  </div>
                ) : (
                  <div className="flex h-48 items-center justify-center bg-[#071628] text-[#d3ac63]"><GraduationCap className="h-12 w-12" /></div>
                )}
                <CardHeader className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <Badge variant="secondary">{course.code}</Badge>
                    <span className="text-lg font-bold text-[#1478ac]">{formatPrice(course.priceCents, course.currency)}</span>
                  </div>
                  <CardTitle className="font-display text-xl">{course.title}</CardTitle>
                  <CardDescription className="line-clamp-4">
                    {course.shortDescription || course.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 text-sm text-muted-foreground">
                  <div className="flex flex-wrap gap-2">
                    {course.category && <Badge variant="outline">{course.category}</Badge>}
                    {course.estimatedHours ? <Badge variant="outline"><Clock3 className="mr-1 h-3 w-3" />{course.estimatedHours} hours</Badge> : null}
                  </div>
                  {course.prerequisiteDescription && (
                    <p><strong className="text-foreground">Prerequisite:</strong> {course.prerequisiteDescription}</p>
                  )}
                  {course.bundleContents && course.bundleContents.length > 0 && (
                    <p><strong className="text-foreground">Includes:</strong> {course.bundleContents.join(" · ")}</p>
                  )}
                </CardContent>
                <CardFooter className="mt-auto flex-col items-stretch gap-3">
                  <Button asChild className="bg-[#1478ac] hover:bg-[#318dc1]">
                    <Link href={course.purchaseMode === "registration" ? `/register/student-registration?course=${encodeURIComponent(course.id)}` : `/portal/courses/${encodeURIComponent(course.id)}`}>
                      {course.purchaseMode === "registration" ? `Register for ${course.code}` : course.priceCents === 0 ? `Enroll in ${course.code}` : `Enroll in ${course.code} — ${formatPrice(course.priceCents, course.currency)}`}<ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                  <p className="flex items-start gap-1 text-xs text-muted-foreground">
                    <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0" />{course.purchaseMode === "registration" ? "Staff reviews registrations before secure payment and enrollment." : "Sign in to enroll — secure checkout by Stripe."}
                  </p>
                </CardFooter>
              </Card>
            ))}
          </div>
          {products.length > 0 && (
            <section className="space-y-5">
              <div><p className="font-display text-sm font-semibold tracking-[0.18em] text-[#1478ac]">STUDY GUIDE ACCESS</p><h2 className="mt-2 font-display text-3xl font-bold">Part 107 Pro plans</h2><p className="mt-2 text-muted-foreground">Choose a monthly subscription or prepaid study-guide access period.</p></div>
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {products.map((product) => (
                  <Card key={product.id} className="flex flex-col border-[#d9d8ce]">
                    <CardHeader><div className="flex items-start justify-between gap-2"><Badge variant="secondary">PRO ACCESS</Badge><span className="text-lg font-bold text-[#1478ac]">{formatPrice(product.priceCents, product.currency)}{product.billingMode === "subscription" ? <span className="text-xs font-normal text-muted-foreground">/mo</span> : null}</span></div><CardTitle className="font-display text-xl">{product.title}</CardTitle><CardDescription>{product.description}</CardDescription></CardHeader>
                    <CardContent className="flex-1"><ul className="space-y-2 text-sm text-muted-foreground">{product.benefits.map((benefit) => <li key={benefit} className="flex gap-2"><ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-[#1478ac]" />{benefit}</li>)}</ul>{product.billingMode === "payment" && <p className="mt-4 text-xs text-muted-foreground">Prepaid access for {product.durationMonths} months.</p>}</CardContent>
                    <CardFooter><Button asChild className="w-full bg-[#1478ac] hover:bg-[#318dc1]"><Link href={`/portal/pro?product=${encodeURIComponent(product.id)}`}>Choose Pro plan<ArrowRight className="ml-2 h-4 w-4" /></Link></Button></CardFooter>
                  </Card>
                ))}
              </div>
            </section>
          )}
          </div>
        )}
      </section>

      <section className="border-t bg-[#f8f7f1] py-10">
        <div className="container flex flex-col gap-3 text-sm text-muted-foreground md:flex-row md:items-center md:justify-between">
          <p>Course completion credentials document EFVS training and do not constitute FAA-issued certification.</p>
          <Link href="mailto:efvsflight@efvertical.com" className="text-[#1478ac] hover:underline">Questions? Contact EFVS Flight School</Link>
        </div>
      </section>
    </div>
  );
}
