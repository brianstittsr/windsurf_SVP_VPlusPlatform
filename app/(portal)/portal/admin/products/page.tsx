"use client";

import { useCallback, useEffect, useState } from "react";
import { auth } from "@/lib/firebase";
import { useRequireAuth } from "@/lib/hooks/use-auth";
import type { LmsProductDoc } from "@/lib/schema";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Save } from "lucide-react";

interface ProductResponse { data?: LmsProductDoc[]; error?: string }

export default function AdminProductsPage() {
  const { isLoading, isAuthenticated } = useRequireAuth(["admin"]);
  const [products, setProducts] = useState<LmsProductDoc[]>([]);
  const [drafts, setDrafts] = useState<Record<string, { title: string; description: string; price: string; benefits: string; published: boolean }>>({});
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);

  const request = useCallback(async (url: string, init?: RequestInit) => {
    if (!auth?.currentUser) throw new Error("Sign in again to manage products");
    const token = await auth.currentUser.getIdToken();
    const response = await fetch(url, { ...init, headers: { Authorization: `Bearer ${token}`, ...(init?.body ? { "Content-Type": "application/json" } : {}) } });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "Product request failed");
    return result;
  }, []);

  const load = useCallback(async () => {
    const result = (await request("/api/admin/products")) as ProductResponse;
    const items = result.data || [];
    setProducts(items);
    setDrafts(Object.fromEntries(items.map((product) => [product.id, {
      title: product.title,
      description: product.description,
      price: (product.priceCents / 100).toFixed(2),
      benefits: product.benefits.join("\n"),
      published: product.published,
    }])));
  }, [request]);

  useEffect(() => {
    if (!isAuthenticated) return;
    let active = true;
    void load().catch((error: unknown) => toast.error(error instanceof Error ? error.message : "Unable to load product plans"))
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [isAuthenticated, load]);

  const seed = async () => {
    setWorking(true);
    try {
      const result = await request("/api/admin/products/seed", { method: "POST" });
      await load();
      toast.success(`${result.data.createdCount} plan${result.data.createdCount === 1 ? "" : "s"} added; existing plan codes were left unchanged.`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to import Pro plans");
    } finally {
      setWorking(false);
    }
  };

  const save = async (product: LmsProductDoc) => {
    const form = drafts[product.id];
    const priceCents = Math.round(Number(form.price) * 100);
    if (!Number.isFinite(priceCents) || priceCents < 0 || (form.published && priceCents === 0)) {
      toast.error("Enter a positive price before publishing a plan");
      return;
    }
    setWorking(true);
    try {
      await request(`/api/admin/products/${product.id}`, {
        method: "PATCH",
        body: JSON.stringify({ title: form.title, description: form.description, priceCents, benefits: form.benefits.split(/\r?\n/).map((item) => item.trim()).filter(Boolean), published: form.published }),
      });
      await load();
      toast.success(`${product.code} saved`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to save plan");
    } finally {
      setWorking(false);
    }
  };

  if (isLoading || !isAuthenticated || loading) return <Skeleton className="h-96 w-full" />;
  return <div className="max-w-5xl space-y-6">
    <div className="flex flex-wrap items-center justify-between gap-3"><div><h1 className="font-display text-3xl font-bold">Digital Access Products</h1><p className="text-muted-foreground">Manage the retained Part 107 Pro plans shown with courses on Pricing.</p></div><Button variant="outline" disabled={working} onClick={seed}>Import standard Pro plans</Button></div>
    {products.map((product) => {
      const form = drafts[product.id];
      if (!form) return null;
      return <Card key={product.id}><CardHeader><div className="flex flex-wrap items-center justify-between gap-2"><div><CardTitle className="font-display">{product.title}</CardTitle><CardDescription>{product.code} · {product.billingMode === "subscription" ? "Recurring subscription" : `${product.durationMonths}-month prepaid access`}</CardDescription></div><Badge variant={product.published ? "default" : "outline"}>{product.published ? "Published" : "Draft"}</Badge></div></CardHeader><CardContent className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2"><Label>Plan title</Label><Input value={form.title} onChange={(e) => setDrafts((current) => ({ ...current, [product.id]: { ...form, title: e.target.value } }))} /></div>
        <div className="space-y-2"><Label>Retail price (USD)</Label><Input type="number" min="0" step="0.01" value={form.price} onChange={(e) => setDrafts((current) => ({ ...current, [product.id]: { ...form, price: e.target.value } }))} /></div>
        <div className="space-y-2 md:col-span-2"><Label>Description</Label><Textarea rows={2} value={form.description} onChange={(e) => setDrafts((current) => ({ ...current, [product.id]: { ...form, description: e.target.value } }))} /></div>
        <div className="space-y-2 md:col-span-2"><Label>Benefits (one per line)</Label><Textarea rows={4} value={form.benefits} onChange={(e) => setDrafts((current) => ({ ...current, [product.id]: { ...form, benefits: e.target.value } }))} /></div>
        <div className="flex items-center justify-between rounded border px-3"><Label className="font-normal">Published in Pricing</Label><Switch checked={form.published} onCheckedChange={(published) => setDrafts((current) => ({ ...current, [product.id]: { ...form, published } }))} /></div>
        <div className="flex items-end justify-end"><Button disabled={working} onClick={() => void save(product)}><Save className="mr-2 h-4 w-4" />Save plan</Button></div>
      </CardContent></Card>;
    })}
    {products.length === 0 && <Card><CardContent className="py-10 text-center text-muted-foreground">No Pro products yet. Import the standard pricing options to begin.</CardContent></Card>}
    <p className="text-xs text-muted-foreground">Prices and billing mode are read by the server at checkout. Do not change an active plan’s price without reviewing the Stripe billing impact.</p>
  </div>;
}
