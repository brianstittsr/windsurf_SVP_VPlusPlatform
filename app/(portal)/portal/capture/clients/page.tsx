"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { captureJson } from "@/lib/capture/api-client";
import { useUserProfile } from "@/contexts/user-profile-context";
import type { CustomerDoc } from "@/lib/schema";
import { Plus } from "lucide-react";
import { toast } from "sonner";

export default function CaptureClientsPage() {
  const { profile } = useUserProfile();
  const isAdmin = profile.role === "admin";
  const [clients, setClients] = useState<CustomerDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: "", primaryContact: "", uei: "", cageCode: "" });

  const load = () => {
    captureJson<{ clients: CustomerDoc[] }>("/api/capture/clients")
      .then((d) => setClients(d.clients))
      .catch((e) => toast.error(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const create = async () => {
    if (!form.name.trim() || !form.primaryContact.trim()) {
      toast.error("Name and primary contact are required");
      return;
    }
    setSaving(true);
    try {
      await captureJson("/api/capture/clients", {
        method: "POST",
        body: JSON.stringify({
          name: form.name.trim(),
          primaryContact: form.primaryContact.trim(),
          govcon: {
            ...(form.uei.trim() ? { uei: form.uei.trim() } : {}),
            ...(form.cageCode.trim() ? { cageCode: form.cageCode.trim() } : {}),
          },
        }),
      });
      toast.success("Client created");
      setOpen(false);
      setForm({ name: "", primaryContact: "", uei: "", cageCode: "" });
      load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to create client");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Capture Clients</h1>
        {isAdmin && (
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Client
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>New Capture Client</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label htmlFor="c-name">Client Name *</Label>
                <Input id="c-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="c-contact">Primary Contact *</Label>
                <Input
                  id="c-contact"
                  value={form.primaryContact}
                  onChange={(e) => setForm({ ...form, primaryContact: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="c-uei">UEI</Label>
                  <Input id="c-uei" value={form.uei} onChange={(e) => setForm({ ...form, uei: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="c-cage">CAGE Code</Label>
                  <Input
                    id="c-cage"
                    value={form.cageCode}
                    onChange={(e) => setForm({ ...form, cageCode: e.target.value })}
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)} disabled={saving}>
                Cancel
              </Button>
              <Button onClick={create} disabled={saving}>
                {saving ? "Creating..." : "Create Client"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        )}
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Primary Contact</TableHead>
                <TableHead>UEI</TableHead>
                <TableHead>CAGE</TableHead>
                <TableHead>SAM Expiry</TableHead>
                <TableHead>Certifications</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    Loading...
                  </TableCell>
                </TableRow>
              ) : clients.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    No capture clients yet.
                  </TableCell>
                </TableRow>
              ) : (
                clients.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell>
                      <Link href={`/portal/capture/clients/${c.id}`} className="font-medium hover:underline">
                        {c.name}
                      </Link>
                    </TableCell>
                    <TableCell>{c.primaryContact}</TableCell>
                    <TableCell>{c.govcon?.uei || "—"}</TableCell>
                    <TableCell>{c.govcon?.cageCode || "—"}</TableCell>
                    <TableCell>
                      {c.govcon?.samRegistrationExpiry
                        ? new Date(c.govcon.samRegistrationExpiry).toLocaleDateString()
                        : "—"}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1 flex-wrap">
                        {(c.govcon?.certifications || []).map((cert) => (
                          <Badge key={cert.name} variant="secondary">
                            {cert.name}
                          </Badge>
                        ))}
                      </div>
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
