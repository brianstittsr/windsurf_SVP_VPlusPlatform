"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile } from "firebase/auth";
import { Loader2, ShieldCheck } from "lucide-react";
import { auth } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";

interface InviteData {
  email: string;
  fullName: string;
  courses: { code: string; title: string; priceCents: number }[];
  sponsorshipApproved: boolean;
  expiresAt: string;
}

function RegistrationClaimContent() {
  const search = useSearchParams();
  const router = useRouter();
  const [token, setToken] = useState("");
  const [invite, setInvite] = useState<InviteData | null>(null);
  const [mode, setMode] = useState<"create" | "signin">("create");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [promoCode, setPromoCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const inviteToken = search.get("token") || "";
    setToken(inviteToken);
    if (inviteToken) window.history.replaceState(null, "", "/registration/claim");
    void fetch(`/api/registration/claim?token=${encodeURIComponent(inviteToken)}`, { cache: "no-store" })
      .then(async (response) => {
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || "Invitation unavailable");
        setInvite(result.data as InviteData);
      })
      .catch((reason: unknown) => setError(reason instanceof Error ? reason.message : "Invitation unavailable"))
      .finally(() => setLoading(false));
  }, [search]);

  const continueRegistration = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!invite || !auth || !token) return;
    if (mode === "create" && password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      let user = auth.currentUser;
      if (mode === "create") {
        if (password.length < 8) throw new Error("Password must be at least 8 characters.");
        const credential = await createUserWithEmailAndPassword(auth, invite.email, password);
        user = credential.user;
        await updateProfile(user, { displayName: invite.fullName });
        const [firstName, ...rest] = invite.fullName.trim().split(/\s+/);
        const bootstrapToken = await user.getIdToken();
        const bootstrapResponse = await fetch("/api/profile/bootstrap", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${bootstrapToken}` },
          body: JSON.stringify({ firstName, lastName: rest.join(" ") }),
        });
        const bootstrapResult = await bootstrapResponse.json();
        if (!bootstrapResponse.ok) throw new Error(bootstrapResult.error || "Unable to create student profile");
      } else {
        const credential = await signInWithEmailAndPassword(auth, invite.email, password);
        user = credential.user;
      }
      if (!user || user.email?.toLowerCase() !== invite.email.toLowerCase()) {
        throw new Error("Sign in with the email address that received this invitation.");
      }
      const idToken = await user.getIdToken();
      const claimResponse = await fetch("/api/registration/claim", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${idToken}` },
        body: JSON.stringify({ token }),
      });
      const claimResult = await claimResponse.json();
      if (!claimResponse.ok) throw new Error(claimResult.error || "Unable to claim invitation");
      if (claimResult.data.sponsored) {
        router.replace("/portal/my-courses?registration=approved");
        return;
      }
      const checkoutResponse = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${idToken}` },
        body: JSON.stringify({ registrationSubmissionId: claimResult.data.submissionId, promoCode: promoCode.trim() || undefined }),
      });
      const checkout = await checkoutResponse.json();
      if (!checkoutResponse.ok || !checkout.url) throw new Error(checkout.error || "Unable to start secure checkout");
      window.location.assign(checkout.url);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to continue registration");
      setBusy(false);
    }
  };

  if (loading) return <div className="container max-w-xl py-12"><Skeleton className="h-96" /></div>;
  if (!invite) return <div className="container max-w-xl py-14"><Alert variant="destructive"><AlertDescription>{error || "This registration invitation is unavailable."}</AlertDescription></Alert><Button asChild variant="link" className="mt-3"><Link href="/pricing">View courses and pricing</Link></Button></div>;

  return (
    <div className="container max-w-xl py-10 md:py-14">
      <Card>
        <CardHeader>
          <div className="mx-auto rounded-full bg-[#F4EAD3] p-3"><ShieldCheck className="h-7 w-7 text-[#8A6212]" /></div>
          <CardTitle className="text-center font-display text-2xl">Continue your V+ registration</CardTitle>
          <CardDescription className="text-center">Approved for {invite.fullName}. Create an Academy account or sign in to claim your registration.</CardDescription>
        </CardHeader>
        <CardContent>
          {error && <Alert variant="destructive" className="mb-4"><AlertDescription>{error}</AlertDescription></Alert>}
          <div className="mb-4 rounded-md bg-muted/50 p-3 text-sm"><p className="font-medium">{invite.email}</p><ul className="mt-2 space-y-1 text-muted-foreground">{invite.courses.map((course) => <li key={course.code}>{course.code} — {course.title} · ${(course.priceCents / 100).toFixed(2)}</li>)}</ul></div>
          <div className="mb-4 flex gap-2"><Button type="button" variant={mode === "create" ? "default" : "outline"} onClick={() => setMode("create")}>Create account</Button><Button type="button" variant={mode === "signin" ? "default" : "outline"} onClick={() => setMode("signin")}>I have an account</Button></div>
          <form onSubmit={continueRegistration} className="space-y-4">
            <div className="space-y-2"><Label htmlFor="claim-email">Email</Label><Input id="claim-email" type="email" value={invite.email} disabled /></div>
            <div className="space-y-2"><Label htmlFor="claim-password">{mode === "create" ? "Create password" : "Password"}</Label><Input id="claim-password" type="password" autoComplete={mode === "create" ? "new-password" : "current-password"} minLength={8} required value={password} onChange={(e) => setPassword(e.target.value)} /></div>
            {mode === "create" && <div className="space-y-2"><Label htmlFor="claim-confirm">Confirm password</Label><Input id="claim-confirm" type="password" autoComplete="new-password" required value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} /></div>}
            {!invite.sponsorshipApproved && <div className="space-y-2"><Label htmlFor="claim-promo">Discount code (optional)</Label><Input id="claim-promo" value={promoCode} onChange={(e) => setPromoCode(e.target.value)} autoComplete="off" placeholder="Enter a veteran or promotional code" /></div>}
            <Button type="submit" disabled={busy} className="w-full bg-[#8A6212] hover:bg-[#8A6212]">{busy ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Continuing…</> : invite.sponsorshipApproved ? "Claim sponsored enrollment" : "Continue to secure checkout"}</Button>
            <p className="text-center text-xs text-muted-foreground">Invitation expires {new Date(invite.expiresAt).toLocaleString()}. Payment is collected securely by Stripe; card and bank details are not stored by V+.</p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export default function RegistrationClaimPage() {
  return <Suspense fallback={<div className="container max-w-xl py-12"><Skeleton className="h-96" /></div>}><RegistrationClaimContent /></Suspense>;
}
