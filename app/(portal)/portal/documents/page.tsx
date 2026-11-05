"use client";

import { useCallback, useEffect, useState } from "react";
import { auth } from "@/lib/firebase";
import { useRequireAuth } from "@/lib/hooks/use-auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Download, FileText, Loader2, Upload } from "lucide-react";
import { ResumePaymentCard } from "@/components/lms/resume-payment-card";

interface StudentDocument {
  id: string;
  kind: string;
  displayName: string;
  fileName: string;
  sizeBytes: number;
  createdAt: string;
}
interface PurchaseOrder {
  id: string;
  status: string;
  paymentMethod?: string;
  totalCents: number;
  currency: string;
  createdAt: string | null;
  items: { code: string; title: string; quantity: number; unitAmountCents: number; includedInBundle?: boolean }[];
}
interface PurchaseInvoice {
  id: string;
  productId: string | null;
  courseId: string | null;
  courseIds: string[];
  amountCents: number;
  currency: string;
  status: string;
  method: string;
  createdAt: string | null;
}
interface EnrollmentHistory {
  id: string;
  courseName: string;
  status: string;
  progressPercent: number;
  enrolledAt: string | null;
  completedAt: string | null;
}
interface PageData { documents: StudentDocument[]; orders: PurchaseOrder[]; invoices: PurchaseInvoice[]; enrollments: EnrollmentHistory[] }

function money(cents: number, currency = "usd"): string { return new Intl.NumberFormat("en-US", { style: "currency", currency: currency.toUpperCase() }).format(cents / 100); }

export default function StudentDocumentsPage() {
  const { isLoading: authLoading, isAuthenticated } = useRequireAuth();
  const [data, setData] = useState<PageData>({ documents: [], orders: [], invoices: [], enrollments: [] });
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [kind, setKind] = useState("faa_certificate_proof");
  const [displayName, setDisplayName] = useState("");
  const [file, setFile] = useState<File | null>(null);

  const getToken = useCallback(async () => {
    if (!auth?.currentUser) throw new Error("Sign in again to continue");
    return auth.currentUser.getIdToken();
  }, []);

  const load = useCallback(async () => {
    const token = await getToken();
    const response = await fetch("/api/student-documents", { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "Unable to load records");
    setData(result.data);
  }, [getToken]);

  useEffect(() => {
    if (!isAuthenticated) return;
    let active = true;
    void load().catch((error: unknown) => toast.error(error instanceof Error ? error.message : "Unable to load records"))
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [isAuthenticated, load]);

  const upload = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!file) { toast.error("Choose a file first"); return; }
    setUploading(true);
    try {
      const token = await getToken();
      const body = new FormData();
      body.append("file", file);
      body.append("kind", kind);
      body.append("displayName", displayName || file.name);
      const response = await fetch("/api/student-documents", { method: "POST", headers: { Authorization: `Bearer ${token}` }, body });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Upload failed");
      toast.success("Document uploaded privately");
      setFile(null);
      setDisplayName("");
      await load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const download = async (documentId: string, fileName: string) => {
    try {
      const token = await getToken();
      const response = await fetch(`/api/student-documents/${documentId}`, { headers: { Authorization: `Bearer ${token}` } });
      if (!response.ok) throw new Error("Unable to download document");
      const url = URL.createObjectURL(await response.blob());
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = fileName;
      anchor.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to download document");
    }
  };

  if (authLoading || !isAuthenticated || loading) return <Skeleton className="h-96 w-full" />;

  return (
    <div className="max-w-5xl space-y-6">
      <div><h1 className="font-display text-3xl font-bold">Purchases & Documents</h1><p className="text-muted-foreground">Your EFVS purchase, enrollment, completion, and credential history.</p></div>
      <ResumePaymentCard />
      <Card>
        <CardHeader><CardTitle className="font-display">Upload a credential document</CardTitle><CardDescription>Private to your LMS account and authorized EFVS staff. Accepted files: PDF, JPEG, PNG, or WebP up to 12 MB.</CardDescription></CardHeader>
        <CardContent>
          <form onSubmit={upload} className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2"><Label>Document type</Label><Select value={kind} onValueChange={setKind}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="faa_certificate_proof">FAA Part 107 certificate / exam proof</SelectItem><SelectItem value="training_credential">Training credential</SelectItem><SelectItem value="other">Other course document</SelectItem></SelectContent></Select></div>
            <div className="space-y-2"><Label>Display name (optional)</Label><Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="FAA Remote Pilot Certificate" /></div>
            <div className="space-y-2"><Label>File</Label><Input type="file" accept="application/pdf,image/jpeg,image/png,image/webp" onChange={(e) => setFile(e.target.files?.[0] || null)} /></div>
            <div className="flex items-end"><Button type="submit" disabled={!file || uploading} className="bg-[#1478ac] hover:bg-[#318dc1]">{uploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}Upload privately</Button></div>
          </form>
        </CardContent>
      </Card>

      <Card><CardHeader><CardTitle className="font-display">Purchase history</CardTitle></CardHeader><CardContent className="space-y-3">{data.orders.length ? data.orders.map((order) => <div key={order.id} className="rounded border p-4"><div className="flex flex-wrap justify-between gap-2"><div><Badge variant={order.status === "paid" ? "default" : "outline"}>{order.status}</Badge><span className="ml-2 text-sm text-muted-foreground">{order.createdAt ? new Date(order.createdAt).toLocaleDateString() : ""} · {order.paymentMethod || "Stripe"}</span></div><strong>{money(order.totalCents, order.currency)}</strong></div><ul className="mt-2 text-sm">{order.items?.map((item, index) => <li key={`${order.id}-${index}`}>{item.code} — {item.title}{item.includedInBundle ? " (included)" : ""}</li>)}</ul></div>) : <p className="text-sm text-muted-foreground">No purchases are linked to this account yet.</p>}</CardContent></Card>

      <Card><CardHeader><CardTitle className="font-display">Invoices & renewals</CardTitle><CardDescription>Payment records for one-time and recurring purchases.</CardDescription></CardHeader><CardContent className="space-y-2">{data.invoices.length ? data.invoices.map((invoice) => <div key={invoice.id} className="flex flex-wrap items-center justify-between gap-3 rounded border p-3"><div><p className="font-medium">{invoice.productId ? "Part 107 Pro access" : invoice.courseId ? `Course ${invoice.courseId}` : "Course purchase"}</p><p className="text-xs text-muted-foreground">{invoice.createdAt ? new Date(invoice.createdAt).toLocaleDateString() : "—"} · {invoice.method.toUpperCase()} · {invoice.id.slice(0, 12)}</p></div><div className="text-right"><p className="font-semibold">{money(invoice.amountCents, invoice.currency)}</p><Badge variant={invoice.status === "paid" ? "default" : "outline"}>{invoice.status}</Badge></div></div>) : <p className="text-sm text-muted-foreground">No invoice records yet.</p>}</CardContent></Card>

      <Card><CardHeader><CardTitle className="font-display">Course history</CardTitle></CardHeader><CardContent className="space-y-3">{data.enrollments.length ? data.enrollments.map((enrollment) => <div key={enrollment.id} className="flex flex-wrap items-center justify-between gap-3 rounded border p-3"><div><p className="font-medium">{enrollment.courseName}</p><p className="text-xs text-muted-foreground">Enrolled {enrollment.enrolledAt ? new Date(enrollment.enrolledAt).toLocaleDateString() : "—"}{enrollment.completedAt ? ` · Completed ${new Date(enrollment.completedAt).toLocaleDateString()}` : ""}</p></div><Badge variant={enrollment.status === "completed" ? "default" : "secondary"}>{enrollment.status} · {enrollment.progressPercent}%</Badge></div>) : <p className="text-sm text-muted-foreground">No course enrollments are linked to this account yet.</p>}</CardContent></Card>

      <Card><CardHeader><CardTitle className="font-display">My documents</CardTitle><CardDescription>Signed registration records, receipts, and uploaded credentials.</CardDescription></CardHeader><CardContent className="space-y-2">{data.documents.length ? data.documents.map((item) => <div key={item.id} className="flex flex-wrap items-center justify-between gap-2 rounded border p-3"><div className="flex items-center gap-3"><FileText className="h-4 w-4 text-[#1478ac]" /><div><p className="font-medium">{item.displayName}</p><p className="text-xs text-muted-foreground">{item.kind.replaceAll("_", " ")} · {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : ""} · {(item.sizeBytes / 1024).toFixed(0)} KB</p></div></div><Button size="sm" variant="outline" onClick={() => void download(item.id, item.fileName)}><Download className="mr-2 h-4 w-4" />Download</Button></div>) : <p className="text-sm text-muted-foreground">Your signed forms and uploaded documents will appear here.</p>}</CardContent></Card>
      <p className="text-xs text-muted-foreground">Signed forms and student documents are private and visible only to you and authorized EFVS staff. LinkedIn credential pages never expose these files.</p>
    </div>
  );
}
