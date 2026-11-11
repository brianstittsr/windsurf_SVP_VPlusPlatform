"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import Link from "next/link";
import { auth } from "@/lib/firebase";
import { useRequireAuth } from "@/lib/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2 } from "lucide-react";

function CheckoutCancelledContent() {
  const params = useSearchParams();
  const registrationId = params.get("registration") || "";
  const { isLoading, isAuthenticated } = useRequireAuth();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const resume = async () => {
    if (!registrationId || !auth?.currentUser) return;
    setBusy(true);
    setError("");
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
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to resume checkout");
      setBusy(false);
    }
  };

  if (isLoading || !isAuthenticated) return <div className="container py-16"><Loader2 className="mx-auto h-8 w-8 animate-spin" /></div>;
  return <div className="container max-w-xl py-16"><Card><CardHeader><CardTitle className="font-display text-2xl">Checkout cancelled</CardTitle><CardDescription>Your signed registration is still on file. You can return to secure payment when ready.</CardDescription></CardHeader><CardContent className="space-y-4">{error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}{registrationId ? <Button disabled={busy} onClick={resume} className="w-full bg-[#8A6212] hover:bg-[#8A6212]">{busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}Continue to secure checkout</Button> : null}<Button asChild variant="outline" className="w-full"><Link href="/portal/documents">View purchases and documents</Link></Button></CardContent></Card></div>;
}

export default function CheckoutCancelledPage() {
  return <Suspense fallback={<div className="container py-16"><Loader2 className="mx-auto h-8 w-8 animate-spin" /></div>}><CheckoutCancelledContent /></Suspense>;
}
