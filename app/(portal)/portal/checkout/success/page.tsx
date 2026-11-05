"use client";

import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { auth } from "@/lib/firebase";
import { useRequireAuth } from "@/lib/hooks/use-auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle, ArrowRight, Loader2, XCircle } from "lucide-react";

type Confirmation = "loading" | "paid" | "failed" | "timed_out" | "invalid";
interface SessionResponse {
  data?: { paymentStatus: string | null; sessionStatus: string | null; orderStatus: string; orderId: string | null; purchaseKind?: string };
  error?: string;
}

function CheckoutSuccessInner() {
  const searchParams = useSearchParams();
  const { isLoading, isAuthenticated } = useRequireAuth();
  const [confirmation, setConfirmation] = useState<Confirmation>("loading");
  const [purchaseKind, setPurchaseKind] = useState("");
  const [error, setError] = useState("");
  const sessionId = searchParams.get("session_id") || "";

  useEffect(() => {
    if (!isAuthenticated || !sessionId || !auth?.currentUser) {
      if (!sessionId) setConfirmation("invalid");
      return;
    }
    let cancelled = false;
    let attempts = 0;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const poll = async () => {
      try {
        const idToken = await auth!.currentUser!.getIdToken();
        const response = await fetch(`/api/stripe/session?session_id=${encodeURIComponent(sessionId)}`, {
          headers: { Authorization: `Bearer ${idToken}` },
          cache: "no-store",
        });
        const result = (await response.json()) as SessionResponse;
        if (!response.ok) throw new Error(result.error || "Unable to verify payment");
        const data = result.data;
        if (!data) throw new Error("Payment status is unavailable");
        if (!cancelled) setPurchaseKind(data.purchaseKind || "");
        if ((data.orderId && data.orderStatus === "paid") || (!data.orderId && data.paymentStatus === "paid")) {
          if (!cancelled) setConfirmation("paid");
          return;
        }
        if (data.orderStatus === "failed" || data.orderStatus === "cancelled" || data.sessionStatus === "expired") {
          if (!cancelled) setConfirmation("failed");
          return;
        }
        if (++attempts >= 15) {
          if (!cancelled) setConfirmation("timed_out");
          return;
        }
        timer = setTimeout(poll, 2000);
      } catch (reason) {
        if (!cancelled) {
          setError(reason instanceof Error ? reason.message : "Unable to verify payment");
          setConfirmation("invalid");
        }
      }
    };
    void poll();
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [isAuthenticated, sessionId]);

  if (isLoading || !isAuthenticated) return <Loader2 className="h-8 w-8 animate-spin" />;

  const paid = confirmation === "paid";
  const failed = confirmation === "failed" || confirmation === "invalid";
  return (
    <div className="mx-auto max-w-lg py-16">
      <Card>
        <CardHeader className="text-center">
          {paid ? <CheckCircle className="mx-auto h-14 w-14 text-green-600" /> : failed ? <XCircle className="mx-auto h-14 w-14 text-destructive" /> : <Loader2 className="mx-auto h-10 w-10 animate-spin text-[#1478ac]" />}
          <CardTitle className="mt-4 font-display text-2xl">{paid ? "Payment confirmed" : failed ? "Payment not completed" : "Confirming your payment"}</CardTitle>
          <CardDescription>{paid ? purchaseKind === "pro-access" ? "Your Pro study-guide access is active." : "Your order is confirmed and course access is being finalized." : failed ? "This checkout was not completed. Your registration remains available for another attempt." : "Stripe is confirming the payment. This can take a few seconds for some payment methods."}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-center">
          {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}
          {confirmation === "timed_out" && <p className="text-sm text-muted-foreground">Payment is still processing. Check My Courses shortly; access appears after Stripe confirms the payment.</p>}
          {paid ? <Button asChild className="bg-[#1478ac] hover:bg-[#318dc1]"><Link href={purchaseKind === "pro-access" ? "/portal/pro" : "/portal/my-courses"}>{purchaseKind === "pro-access" ? "Open Pro Access" : "Go to My Courses"}<ArrowRight className="ml-2 h-4 w-4" /></Link></Button> : failed ? <Button asChild variant="outline"><Link href="/portal/documents">View registration and purchase history</Link></Button> : null}
          <p className="text-xs text-muted-foreground">Session {sessionId.slice(0, 24)}… · Receipts are sent by Stripe.</p>
        </CardContent>
      </Card>
    </div>
  );
}

export default function CheckoutSuccessPage() {
  return <Suspense fallback={<Loader2 className="h-8 w-8 animate-spin" />}><CheckoutSuccessInner /></Suspense>;
}
