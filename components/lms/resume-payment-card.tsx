"use client";

import { useCallback, useEffect, useState } from "react";
import { auth } from "@/lib/firebase";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CreditCard, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface PendingRegistration {
  id: string;
  courses: { courseId: string; code: string; title: string; priceCents: number }[];
  totalCents: number;
  currency: string;
}

function money(cents: number, currency = "usd"): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: currency.toUpperCase() }).format(cents / 100);
}

/**
 * Shows the signed-in student's approved registrations that are still awaiting
 * payment, with a button that resumes the Stripe checkout session.
 */
export function ResumePaymentCard() {
  const [pending, setPending] = useState<PendingRegistration[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [resuming, setResuming] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!auth?.currentUser) return;
    try {
      const token = await auth.currentUser.getIdToken();
      const response = await fetch("/api/registration/pending", {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      });
      if (response.ok) {
        const result = await response.json();
        setPending(result.data || []);
      }
    } finally {
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    const unsubscribe = auth?.onAuthStateChanged(() => void load());
    void load();
    return () => unsubscribe?.();
  }, [load]);

  const resume = async (registrationId: string) => {
    if (!auth?.currentUser) return;
    setResuming(registrationId);
    try {
      const token = await auth.currentUser.getIdToken();
      const response = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ registrationSubmissionId: registrationId }),
      });
      const result = await response.json();
      if (!response.ok || !result.data?.url) throw new Error(result.error || "Unable to resume checkout");
      window.location.assign(result.data.url);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to resume checkout");
      setResuming(null);
    }
  };

  if (!loaded || pending.length === 0) return null;

  return (
    <Card className="border-[#d3ac63]">
      <CardHeader>
        <CardTitle className="font-display flex items-center gap-2">
          <CreditCard className="h-5 w-5 text-[#d3ac63]" /> Registration awaiting payment
        </CardTitle>
        <CardDescription>
          Your registration was approved. Complete secure checkout to activate your course access.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {pending.map((registration) => (
          <div key={registration.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-4">
            <div>
              <p className="font-medium">
                {registration.courses.map((course) => `${course.code} — ${course.title}`).join(" · ")}
              </p>
              <p className="text-sm text-muted-foreground">Total due: {money(registration.totalCents, registration.currency)}</p>
            </div>
            <Button
              className="bg-[#1478ac] hover:bg-[#318dc1]"
              onClick={() => void resume(registration.id)}
              disabled={resuming !== null}
            >
              {resuming === registration.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Continue to payment
            </Button>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
