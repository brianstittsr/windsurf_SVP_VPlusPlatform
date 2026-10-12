"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { captureJson } from "@/lib/capture/api-client";
import type { CustomerDoc, CaptureOpportunity } from "@/lib/schema";
import { toast } from "sonner";
import { ArrowLeft, Save } from "lucide-react";

const CERT_KEYS = ["8a", "hubzone", "sdvosb", "wosb", "mbe", "dbw"] as const;

export default function ClientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [client, setClient] = useState<CustomerDoc | null>(null);
  const [opps, setOpps] = useState<CaptureOpportunity[]>([]);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: "",
    primaryContact: "",
    uei: "",
    cageCode: "",
    samExpiry: "",
    naicsCodes: "",
    keywords: "",
    targetAgencies: "",
  });
  const [certs, setCerts] = useState<Record<string, boolean>>({});
  const [certExpiries, setCertExpiries] = useState<Record<string, string>>({});

  useEffect(() => {
    Promise.all([
      captureJson<{ client: CustomerDoc }>(`/api/capture/clients/${id}`),
      captureJson<{ opportunities: CaptureOpportunity[] }>(`/api/capture/opportunities?clientId=${id}`),
    ])
      .then(([c, o]) => {
        setClient(c.client);
        setOpps(o.opportunities);
        const g = c.client.govcon || {};
        setForm({
          name: c.client.name || "",
          primaryContact: c.client.primaryContact || "",
          uei: g.uei || "",
          cageCode: g.cageCode || "",
          samExpiry: g.samRegistrationExpiry ? g.samRegistrationExpiry.slice(0, 10) : "",
          naicsCodes: (g.naicsCodes || []).join(", "),
          keywords: (g.keywords || []).join(", "),
          targetAgencies: (g.targetAgencies || []).join(", "),
        });
        const cOn: Record<string, boolean> = {};
        const cExp: Record<string, string> = {};
        for (const k of CERT_KEYS) {
          const cert = (g.certifications || []).find((c) => c.name.toLowerCase() === k.toLowerCase());
          cOn[k] = !!cert;
          cExp[k] = cert?.expiresAt?.slice(0, 10) || "";
        }
        setCerts(cOn);
        setCertExpiries(cExp);
      })
      .catch((e) => toast.error(e.message));
  }, [id]);

  const save = async () => {
    setSaving(true);
    try {
      const split = (s: string) => s.split(",").map((x) => x.trim()).filter(Boolean);
      const { client: updated } = await captureJson<{ client: CustomerDoc }>(`/api/capture/clients/${id}`, {
        method: "PATCH",
        body: JSON.stringify({
          name: form.name,
          primaryContact: form.primaryContact,
          govcon: {
            uei: form.uei || undefined,
            cageCode: form.cageCode || undefined,
            samRegistrationExpiry: form.samExpiry ? new Date(form.samExpiry).toISOString() : undefined,
            naicsCodes: split(form.naicsCodes),
            keywords: split(form.keywords),
            targetAgencies: split(form.targetAgencies),
            certifications: CERT_KEYS.filter((k) => certs[k]).map((k) => ({
              name: k,
              ...(certExpiries[k] ? { expiresAt: new Date(certExpiries[k]).toISOString() } : {}),
            })),
          },
        }),
      });
      setClient(updated);
      toast.success("Client saved");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  if (!client) return <div className="p-6 text-muted-foreground">Loading client...</div>;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild aria-label="Back to clients">
          <Link href="/portal/capture/clients">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h1 className="text-2xl font-bold">{client.name}</h1>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Client Info</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Primary Contact</Label>
              <Input value={form.primaryContact} onChange={(e) => setForm({ ...form, primaryContact: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>UEI</Label>
                <Input value={form.uei} onChange={(e) => setForm({ ...form, uei: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>CAGE Code</Label>
                <Input value={form.cageCode} onChange={(e) => setForm({ ...form, cageCode: e.target.value })} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>SAM Registration Expiry</Label>
              <Input
                type="date"
                value={form.samExpiry}
                onChange={(e) => setForm({ ...form, samExpiry: e.target.value })}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">GovCon Profile</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>NAICS Codes (comma-separated)</Label>
              <Input value={form.naicsCodes} onChange={(e) => setForm({ ...form, naicsCodes: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Keywords (comma-separated)</Label>
              <Textarea value={form.keywords} onChange={(e) => setForm({ ...form, keywords: e.target.value })} rows={2} />
            </div>
            <div className="space-y-2">
              <Label>Target Agencies (comma-separated)</Label>
              <Textarea
                value={form.targetAgencies}
                onChange={(e) => setForm({ ...form, targetAgencies: e.target.value })}
                rows={2}
              />
            </div>
            <div className="space-y-2">
              <Label>Certifications</Label>
              <div className="grid grid-cols-2 gap-2">
                {CERT_KEYS.map((k) => (
                  <div key={k} className="space-y-1">
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={!!certs[k]}
                        onChange={(e) => setCerts({ ...certs, [k]: e.target.checked })}
                        className="accent-primary"
                      />
                      <span className="uppercase">{k}</span>
                    </label>
                    {certs[k] && (
                      <Input
                        type="date"
                        value={certExpiries[k] || ""}
                        onChange={(e) => setCertExpiries({ ...certExpiries, [k]: e.target.value })}
                        aria-label={`${k} expiry`}
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Button onClick={save} disabled={saving}>
        <Save className="h-4 w-4 mr-2" />
        {saving ? "Saving..." : "Save Client"}
      </Button>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Opportunities ({opps.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {opps.length === 0 ? (
            <p className="text-sm text-muted-foreground">No opportunities for this client.</p>
          ) : (
            <div className="divide-y">
              {opps.map((o) => (
                <Link
                  key={o.id}
                  href={`/portal/capture/opportunities/${o.id}`}
                  className="flex items-center justify-between py-2.5 hover:bg-muted/50 -mx-2 px-2 rounded"
                >
                  <span className="text-sm font-medium">{o.title}</span>
                  <Badge variant="secondary">{o.stage}</Badge>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
