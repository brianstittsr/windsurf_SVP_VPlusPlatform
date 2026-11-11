"use client";

import { useEffect, useState } from "react";
import { auth } from "@/lib/firebase";
import { useRequireAuth } from "@/lib/hooks/use-auth";
import { listInvoices, listCourses, listUsers, createInvoice } from "@/lib/lms";
import { logAudit } from "@/lib/activity-logger";
import type { CourseDoc, InvoiceDoc, TeamMemberDoc } from "@/lib/schema";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Landmark } from "lucide-react";

/**
 * Payments admin: Stripe invoices appear automatically via webhook; this page
 * also supports recording manual ACH invoices for B2B/organization purchases.
 * Raw bank details are never stored — only Stripe handles ACH collection.
 */
export default function AdminPaymentsPage() {
  const { isLoading, isAuthenticated, profile } = useRequireAuth(["admin"]);
  const [invoices, setInvoices] = useState<InvoiceDoc[]>([]);
  const [courses, setCourses] = useState<CourseDoc[]>([]);
  const [users, setUsers] = useState<TeamMemberDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    studentId: "",
    courseId: "",
    amountDollars: "",
    discountDollars: "0",
    notes: "",
  });

  const load = async () => {
    const [inv, cs, us] = await Promise.all([
      listInvoices(),
      listCourses(false),
      listUsers(),
    ]);
    setInvoices(
      inv.sort(
        (a, b) =>
          (b.createdAt?.toMillis?.() ?? 0) - (a.createdAt?.toMillis?.() ?? 0)
      )
    );
    setCourses(cs);
    setUsers(us);
    setLoading(false);
  };

  useEffect(() => {
    if (!isAuthenticated) return;
    let cancelled = false;
    void (async () => {
      const [inv, cs, us] = await Promise.all([
        listInvoices(),
        listCourses(false),
        listUsers(),
      ]);
      if (cancelled) return;
      setInvoices(
        inv.sort(
          (a, b) =>
            (b.createdAt?.toMillis?.() ?? 0) - (a.createdAt?.toMillis?.() ?? 0)
        )
      );
      setCourses(cs);
      setUsers(us);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated]);

  const userMap = new Map(users.map((u) => [u.id, u]));
  const courseMap = new Map(courses.map((c) => [c.id, c]));

  const createAchInvoice = async () => {
    const amount = Math.round(parseFloat(form.amountDollars || "0") * 100);
    const discount = Math.round(parseFloat(form.discountDollars || "0") * 100);
    if (!form.studentId || !form.courseId || amount <= 0) {
      toast.error("Student, course, and a positive amount are required");
      return;
    }
    const student = users.find((u) => u.id === form.studentId);
    const id = await createInvoice({
      studentId: form.studentId,
      firebaseUid: student?.firebaseUid,
      courseId: form.courseId,
      amountCents: amount,
      discountCents: discount,
      netCents: Math.max(0, amount - discount),
      currency: "usd",
      status: "pending",
      method: "ach-manual",
      notes: form.notes,
    });
    await logAudit({
      actorId: profile.id,
      actorEmail: profile.email,
      action: "invoice.created",
      entityType: "invoice",
      entityId: id || "",
      metadata: { method: "ach-manual", amountCents: amount },
    });
    toast.success("ACH invoice created — mark paid when the transfer clears");
    setOpen(false);
    setForm({ studentId: "", courseId: "", amountDollars: "", discountDollars: "0", notes: "" });
    load();
  };

  const settle = async (invoice: InvoiceDoc) => {
    if (!invoice.courseId) {
      toast.error("This invoice is not linked to a course enrollment.");
      return;
    }
    try {
      if (!auth?.currentUser) throw new Error("Sign in again to continue");
      const idToken = await auth.currentUser.getIdToken();
      const response = await fetch(`/api/admin/invoices/${invoice.id}/settle`, { method: "POST", headers: { Authorization: `Bearer ${idToken}` } });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Unable to settle invoice");
      toast.success("Invoice marked paid — purchase history and course enrollment updated");
      await load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to settle invoice");
    }
  };

  if (isLoading || !isAuthenticated || loading) {
    return <Skeleton className="h-96 w-full" />;
  }

  const money = (cents: number) => `$${(cents / 100).toFixed(2)}`;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-display">Payments</h1>
          <p className="text-muted-foreground">
            Invoices, Stripe payments, and B2B ACH records
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="bg-[#8A6212] hover:bg-[#8A6212]">
              <Landmark className="mr-2 h-4 w-4" /> New ACH Invoice
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create ACH Invoice</DialogTitle>
              <DialogDescription>
                Record an invoice for direct ACH payment (B2B). Bank details
                are exchanged off-platform — never stored here.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Student / Contact</Label>
                <Select
                  value={form.studentId}
                  onValueChange={(v) => setForm((s) => ({ ...s, studentId: v }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    {users.map((u) => (
                      <SelectItem key={u.id} value={u.id}>
                        {u.firstName} {u.lastName} — {u.emailPrimary}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Course</Label>
                <Select
                  value={form.courseId}
                  onValueChange={(v) => setForm((s) => ({ ...s, courseId: v }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    {courses.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.code} — {c.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Amount (USD)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={form.amountDollars}
                    onChange={(e) =>
                      setForm((s) => ({ ...s, amountDollars: e.target.value }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Discount (USD)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={form.discountDollars}
                    onChange={(e) =>
                      setForm((s) => ({
                        ...s,
                        discountDollars: e.target.value,
                      }))
                    }
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Notes (PO #, organization, etc.)</Label>
                <Textarea
                  rows={2}
                  value={form.notes}
                  onChange={(e) =>
                    setForm((s) => ({ ...s, notes: e.target.value }))
                  }
                />
              </div>
              <Button
                onClick={createAchInvoice}
                className="w-full bg-[#8A6212] hover:bg-[#8A6212]"
              >
                Create Invoice
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice</TableHead>
                <TableHead>Student</TableHead>
                <TableHead>Course</TableHead>
                <TableHead>Method</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoices.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={8}
                    className="text-center text-muted-foreground py-10"
                  >
                    No invoices yet.
                  </TableCell>
                </TableRow>
              ) : (
                invoices.map((inv) => {
                  const u = userMap.get(inv.studentId);
                  const c = inv.courseId ? courseMap.get(inv.courseId) : undefined;
                  return (
                    <TableRow key={inv.id}>
                      <TableCell className="font-mono text-xs">
                        {inv.id.slice(0, 8)}…
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">
                          {u ? `${u.firstName} ${u.lastName}` : inv.studentId}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {u?.emailPrimary}
                        </div>
                      </TableCell>
                      <TableCell>{c?.code || (inv.productId ? "Digital Pro access" : inv.courseId || "—")}</TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {inv.method === "ach-manual" ? "ACH" : "Stripe"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {money(inv.netCents)}
                        {inv.discountCents > 0 && (
                          <span className="text-xs text-muted-foreground">
                            {" "}
                            (−{money(inv.discountCents)})
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            inv.status === "paid" ? "default" : "secondary"
                          }
                          className={inv.status === "paid" ? "bg-green-600" : ""}
                        >
                          {inv.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">
                        {inv.createdAt?.toDate?.().toLocaleDateString?.() ||
                          "—"}
                      </TableCell>
                      <TableCell>
                        {inv.status === "pending" &&
                          inv.method === "ach-manual" && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => settle(inv)}
                            >
                              Mark Paid + Enroll
                            </Button>
                          )}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
