"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/firebase";
import { useRequireAuth } from "@/lib/hooks/use-auth";
import type { LmsProductDoc } from "@/lib/schema";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { ArrowRight, Loader2, ShieldCheck } from "lucide-react";

interface ProductsResponse { products?: LmsProductDoc[]; error?: string }

function ProAccessContent() {
  const search = useSearchParams();
  const { isLoading: authLoading, isAuthenticated, profile } = useRequireAuth();
  const [products, setProducts] = useState<LmsProductDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState("");
  const [error, setError] = useState("");
  const [billingBusy, setBillingBusy] = useState(false);
  const [promoCode, setPromoCode] = useState("");
  const selectedProductId = search.get("product") || "";

  const getToken = useCallback(async () => {
    if (!auth?.currentUser) throw new Error("Sign in again to continue");
    return auth.currentUser.getIdToken();
  }, []);

  useEffect(() => {
    let active = true;
    void fetch("/api/catalog/courses", { cache: "no-store" })
      .then(async (response) => {
        const result = (await response.json()) as ProductsResponse;
        if (!response.ok) throw new Error(result.error || "Unable to load Pro plans");
        if (active) setProducts(result.products || []);
      })
      .catch((reason: unknown) => { if (active) setError(reason instanceof Error ? reason.message : "Unable to load Pro plans"); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const purchase = async (product: LmsProductDoc) => {
    setBusyId(product.id);
    setError("");
    try {
      const token = await getToken();
      const response = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ productId: product.id, promoCode: promoCode.trim() || undefined }),
      });
      const result = await response.json();
      if (!response.ok || !result.data?.url) throw new Error(result.error || "Unable to start checkout");
      window.location.assign(result.data.url);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to start secure checkout");
      setBusyId("");
    }
  };

  const manageBilling = async () => {
    setBillingBusy(true);
    try {
      const token = await getToken();
      const response = await fetch("/api/stripe/portal", { method: "POST", headers: { Authorization: `Bearer ${token}` } });
      const result = await response.json();
      if (!response.ok || !result.data?.url) throw new Error(result.error || "Unable to open billing portal");
      window.location.assign(result.data.url);
    } catch (reason) {
      toast.error(reason instanceof Error ? reason.message : "Unable to open billing portal");
      setBillingBusy(false);
    }
  };

  if (authLoading || !isAuthenticated || loading) return <Skeleton className="h-96 w-full" />;
  const proActive = profile.proStatus === "active" && (!profile.proExpiresAt || new Date(profile.proExpiresAt).getTime() > Date.now());

  return <div className="space-y-6">
    <div><h1 className="font-display text-3xl font-bold">Part 107 Pro Access</h1><p className="text-muted-foreground">Choose the Pro access term that fits your exam preparation.</p></div>
    {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}
    {proActive && <Card className="border-[#d3ac63]"><CardContent className="flex flex-wrap items-center justify-between gap-3 py-4"><div><Badge>Pro active</Badge><p className="mt-2 font-medium">{profile.proPlanId || "Part 107 Pro"}{profile.proExpiresAt ? ` · access through ${new Date(profile.proExpiresAt).toLocaleDateString()}` : ""}</p></div>{profile.proPlanId === "pro-monthly" && <Button variant="outline" disabled={billingBusy} onClick={manageBilling}>{billingBusy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}Manage subscription</Button>}</CardContent></Card>}
    {selectedProductId && products.some((product) => product.id === selectedProductId) && <Alert><AlertDescription>The selected Pro plan is highlighted below. Stripe collects payment securely; EFVS does not store card or bank details.</AlertDescription></Alert>}
    <div className="max-w-md space-y-2"><Label htmlFor="pro-promo">Discount code (optional)</Label><Input id="pro-promo" value={promoCode} onChange={(event) => setPromoCode(event.target.value)} placeholder="Enter a veteran or promotional code" autoComplete="off" /><p className="text-xs text-muted-foreground">Recurring-plan codes must be configured as Stripe promotion codes. Veteran-only codes are checked against your verified Academy profile.</p></div>
    <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">{products.map((product) => <Card key={product.id} className={`flex flex-col ${product.id === selectedProductId ? "border-[#1478ac] ring-1 ring-[#1478ac]" : ""}`}><CardHeader><div className="flex items-center justify-between gap-2"><Badge variant="secondary">{product.billingMode === "subscription" ? "Monthly" : `${product.durationMonths} months`}</Badge><span className="text-lg font-bold text-[#1478ac]">${(product.priceCents / 100).toFixed(2)}{product.billingMode === "subscription" ? <span className="text-xs font-normal text-muted-foreground"> / month</span> : null}</span></div><CardTitle className="font-display">{product.title}</CardTitle><CardDescription>{product.description}</CardDescription></CardHeader><CardContent className="flex-1"><ul className="space-y-2 text-sm text-muted-foreground">{product.benefits.map((benefit) => <li key={benefit} className="flex gap-2"><ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-[#1478ac]" />{benefit}</li>)}</ul></CardContent><CardFooter><Button className="w-full bg-[#1478ac] hover:bg-[#318dc1]" disabled={Boolean(busyId) || proActive} onClick={() => void purchase(product)}>{busyId === product.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}{product.billingMode === "subscription" ? "Start monthly Pro" : "Buy prepaid access"}<ArrowRight className="ml-2 h-4 w-4" /></Button></CardFooter></Card>)}</div>
    <p className="text-xs text-muted-foreground">Part 107 Pro provides digital study tools. It is not an FAA Remote Pilot Certificate and does not guarantee an exam result. <Link href="/pricing" className="text-[#1478ac] underline">Browse courses and bundles</Link>.</p>
  </div>;
}

export default function ProAccessPage() {
  return <Suspense fallback={<Skeleton className="h-96 w-full" />}><ProAccessContent /></Suspense>;
}
