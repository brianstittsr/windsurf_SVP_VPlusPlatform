"use client";

import { Suspense, useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import { RegistrationFormRenderer } from "@/components/forms/registration-form-renderer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface PublishedForm {
  id: string;
  name: string;
  slug: string;
  description: string;
  version: number;
  fields: import("@/lib/schema").RegistrationFormFieldDoc[];
}

function RegistrationPageContent() {
  const params = useParams<{ slug: string }>();
  const searchParams = useSearchParams();
  const [form, setForm] = useState<PublishedForm | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [submissionId, setSubmissionId] = useState("");

  useEffect(() => {
    let active = true;
    void fetch(`/api/forms/${encodeURIComponent(params.slug)}`, { cache: "no-store" })
      .then(async (response) => {
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || "Registration form unavailable");
        if (active) setForm(result.data as PublishedForm);
      })
      .catch((reason: unknown) => { if (active) setError(reason instanceof Error ? reason.message : "Registration form unavailable"); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [params.slug]);

  if (loading) return <div className="container max-w-3xl py-12"><Skeleton className="h-96 w-full" /></div>;
  if (error || !form) return <div className="container max-w-2xl py-16"><Card><CardContent className="py-10 text-center"><p className="text-muted-foreground">{error || "This registration form is not available."}</p><Button asChild className="mt-4"><Link href="/pricing">View course pricing</Link></Button></CardContent></Card></div>;

  if (submissionId) {
    return (
      <div className="container max-w-2xl py-14">
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto rounded-full bg-[#F4EAD3] p-4"><ShieldCheck className="h-8 w-8 text-[#8A6212]" /></div>
            <CardTitle className="mt-3 font-display text-3xl">Registration received</CardTitle>
            <CardDescription>V+ will review your signed registration. If approved, you will receive a secure link to create your student account and complete payment.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-center">
            <p className="font-mono text-xs text-muted-foreground">Reference: {submissionId}</p>
            <p className="text-sm text-muted-foreground">Course access is not activated until payment or an approved sponsorship has been confirmed. No card or bank details were collected on this form.</p>
            <Button asChild variant="outline"><Link href="/pricing">Back to course pricing</Link></Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container max-w-3xl space-y-6 py-10 md:py-14">
      <div>
        <p className="font-display text-sm font-semibold tracking-[0.2em] text-[#8A6212]">V+ UAS TRAINING ACADEMY</p>
        <h1 className="mt-2 font-display text-4xl font-bold text-[#15181C]">Student registration</h1>
        <p className="mt-3 text-muted-foreground">Complete the form for staff review. Approved applicants receive a secure account and checkout link.</p>
      </div>
      <RegistrationFormRenderer
        form={form}
        initialCourseId={searchParams.get("course") || undefined}
        onSubmitted={setSubmissionId}
      />
      <p className="text-center text-xs text-muted-foreground">Questions? Contact <a className="text-[#8A6212] hover:underline" href="mailto:info@strategicvalueplus.com">info@strategicvalueplus.com</a>.</p>
    </div>
  );
}

export default function RegistrationPage() {
  return <Suspense fallback={<div className="container max-w-3xl py-12"><Skeleton className="h-96 w-full" /></div>}><RegistrationPageContent /></Suspense>;
}
