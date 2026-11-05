"use client";

import { useEffect, useState } from "react";
import { useRequireAuth } from "@/lib/hooks/use-auth";
import { listDiscountCodes, saveDiscountCode } from "@/lib/lms";
import { logAudit } from "@/lib/activity-logger";
import type { DiscountCodeDoc } from "@/lib/schema";
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
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Plus, Tag, ShieldCheck } from "lucide-react";

export default function AdminDiscountsPage() {
  const { isLoading, isAuthenticated, profile } = useRequireAuth(["admin"]);
  const [codes, setCodes] = useState<DiscountCodeDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    code: "",
    percentOff: "10",
    militaryOnly: false,
    active: true,
    maxRedemptions: "",
    stripePromotionCodeId: "",
  });

  const load = async () => {
    setCodes(await listDiscountCodes());
    setLoading(false);
  };

  useEffect(() => {
    if (!isAuthenticated) return;
    let cancelled = false;
    void (async () => {
      const data = await listDiscountCodes();
      if (!cancelled) {
        setCodes(data);
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated]);

  const save = async () => {
    const percent = parseInt(form.percentOff || "0", 10);
    if (!form.code.trim() || percent <= 0 || percent >= 100) {
      toast.error("Enter a code and a percent between 1 and 99");
      return;
    }
    await saveDiscountCode({
      code: form.code,
      percentOff: percent,
      militaryOnly: form.militaryOnly,
      active: form.active,
      maxRedemptions: form.maxRedemptions
        ? parseInt(form.maxRedemptions, 10)
        : undefined,
      stripePromotionCodeId: form.stripePromotionCodeId.trim() || undefined,
    });
    await logAudit({
      actorId: profile.id,
      actorEmail: profile.email,
      action: "discount.created",
      entityType: "discount",
      entityId: form.code.toUpperCase(),
      metadata: { percentOff: percent, militaryOnly: form.militaryOnly },
    });
    toast.success("Discount code saved");
    setOpen(false);
    setForm({
      code: "",
      percentOff: "10",
      militaryOnly: false,
      active: true,
      maxRedemptions: "",
      stripePromotionCodeId: "",
    });
    load();
  };

  const toggle = async (code: DiscountCodeDoc, active: boolean) => {
    await saveDiscountCode({ ...code, active }, code.id);
    load();
  };

  if (isLoading || !isAuthenticated || loading) {
    return <Skeleton className="h-96 w-full" />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-display">Discount Codes</h1>
          <p className="text-muted-foreground">
            Promotional pricing and military veteran discounts
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="bg-[#1478ac] hover:bg-[#318dc1]">
              <Plus className="mr-2 h-4 w-4" /> New Code
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Discount Code</DialogTitle>
              <DialogDescription>
                Redeemable on approved course registrations and Pro access checkout
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Code</Label>
                <Input
                  value={form.code}
                  onChange={(e) => setForm((s) => ({ ...s, code: e.target.value }))}
                  placeholder="VETERAN20"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Percent Off</Label>
                  <Input
                    type="number"
                    value={form.percentOff}
                    onChange={(e) =>
                      setForm((s) => ({ ...s, percentOff: e.target.value }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Max Redemptions (optional)</Label>
                  <Input
                    type="number"
                    value={form.maxRedemptions}
                    onChange={(e) =>
                      setForm((s) => ({
                        ...s,
                        maxRedemptions: e.target.value,
                      }))
                    }
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Stripe Promotion Code ID (optional)</Label>
                <Input
                  value={form.stripePromotionCodeId}
                  onChange={(event) => setForm((current) => ({ ...current, stripePromotionCodeId: event.target.value }))}
                  placeholder="promo_…"
                />
                <p className="text-xs text-muted-foreground">Use this for recurring-plan discounts or a Stripe-managed promotion. Leave blank to apply this percent once through the server.</p>
              </div>
              <div className="flex items-center justify-between">
                <Label className="font-normal flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-[#1478ac]" />
                  Military veterans only
                </Label>
                <Switch
                  checked={form.militaryOnly}
                  onCheckedChange={(v) =>
                    setForm((s) => ({ ...s, militaryOnly: v }))
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <Label className="font-normal">Active</Label>
                <Switch
                  checked={form.active}
                  onCheckedChange={(v) => setForm((s) => ({ ...s, active: v }))}
                />
              </div>
              <Button
                onClick={save}
                className="w-full bg-[#1478ac] hover:bg-[#318dc1]"
              >
                Save Code
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
                <TableHead>Code</TableHead>
                <TableHead>Discount</TableHead>
                <TableHead>Restriction</TableHead>
                <TableHead>Redemptions</TableHead>
                <TableHead>Status</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {codes.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="text-center text-muted-foreground py-10"
                  >
                    <Tag className="h-8 w-8 mx-auto mb-2 opacity-40" />
                    No discount codes yet.
                  </TableCell>
                </TableRow>
              ) : (
                codes.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-mono font-medium">
                      {c.code}
                    </TableCell>
                    <TableCell>{c.percentOff}% off</TableCell>
                    <TableCell>
                      {c.militaryOnly ? (
                        <Badge className="bg-[#1478ac]">Veterans only</Badge>
                      ) : (
                        <Badge variant="secondary">Everyone</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {c.timesRedeemed}
                      {c.maxRedemptions ? ` / ${c.maxRedemptions}` : ""}
                    </TableCell>
                    <TableCell>
                      <Badge variant={c.active ? "default" : "outline"}>
                        {c.active ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Switch
                        checked={c.active}
                        onCheckedChange={(v) => toggle(c, v)}
                      />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
