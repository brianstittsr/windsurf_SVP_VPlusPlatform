"use client";

import { use, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ref as storageRef, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "@/lib/firebase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { captureJson } from "@/lib/capture/api-client";
import { useUserProfile } from "@/contexts/user-profile-context";
import type { CustomerDoc, CaptureOpportunity } from "@/lib/schema";
import { toast } from "sonner";
import { ArrowLeft, Save, Upload, FileText, Trash2, ExternalLink } from "lucide-react";

const CERT_KEYS = ["8a", "hubzone", "sdvosb", "wosb", "mbe", "dbw"] as const;

export default function ClientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { profile } = useUserProfile();
  const isAdmin = profile.role === "admin";
  const [client, setClient] = useState<CustomerDoc | null>(null);
  const [opps, setOpps] = useState<CaptureOpportunity[]>([]);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const capInputRef = useRef<HTMLInputElement>(null);
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

  const uploadCapability = async (file: File) => {
    if (!storage) {
      toast.error("Storage is not configured");
      return;
    }
    setUploading(true);
    try {
      const path = `capture/clients/${id}/capability/${Date.now()}-${file.name}`;
      const snap = await uploadBytes(storageRef(storage, path), file);
      const existing = client?.govcon?.capabilityStatements || [];
      const nextVersion = `v${existing.length + 1}`;
      const entry = {
        fileId: crypto.randomUUID(),
        name: file.name,
        version: nextVersion,
        storagePath: path,
        uploadedAt: new Date().toISOString(),
      };
      const { client: updated } = await captureJson<{ client: CustomerDoc }>(`/api/capture/clients/${id}`, {
        method: "PATCH",
        body: JSON.stringify({
          govcon: { ...(client?.govcon || {}), capabilityStatements: [...existing, entry] },
        }),
      });
      setClient(updated);
      toast.success(`Uploaded as ${nextVersion}`);
      void snap; // URL available via storagePath if needed
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
      if (capInputRef.current) capInputRef.current.value = "";
    }
  };

  const deleteClient = async () => {
    try {
      await captureJson(`/api/capture/clients/${id}`, { method: "DELETE" });
      toast.success("Moved to trash");
      router.push("/portal/capture/clients");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Delete failed");
    }
  };

  if (!client) return <div className="p-6 text-muted-foreground">Loading client...</div>;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild aria-label="Back to clients">
            <Link href="/portal/capture/clients">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <h1 className="text-2xl font-bold">{client.name}</h1>
        </div>
        {isAdmin && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" size="icon" aria-label="Delete client">
                <Trash2 className="h-4 w-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete this client?</AlertDialogTitle>
                <AlertDialogDescription>
                  It will be moved to trash and can be restored within 30 days. Opportunities
                  linked to it are not deleted.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={deleteClient}>Move to Trash</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Client Info</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} disabled={!isAdmin} />
            </div>
            <div className="space-y-2">
              <Label>Primary Contact</Label>
              <Input value={form.primaryContact} onChange={(e) => setForm({ ...form, primaryContact: e.target.value })} disabled={!isAdmin} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>UEI</Label>
                <Input value={form.uei} onChange={(e) => setForm({ ...form, uei: e.target.value })} disabled={!isAdmin} />
              </div>
              <div className="space-y-2">
                <Label>CAGE Code</Label>
                <Input value={form.cageCode} onChange={(e) => setForm({ ...form, cageCode: e.target.value })} disabled={!isAdmin} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>SAM Registration Expiry</Label>
              <Input
                type="date"
                value={form.samExpiry}
                onChange={(e) => setForm({ ...form, samExpiry: e.target.value })}
                disabled={!isAdmin}
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
              <Input value={form.naicsCodes} onChange={(e) => setForm({ ...form, naicsCodes: e.target.value })} disabled={!isAdmin} />
            </div>
            <div className="space-y-2">
              <Label>Keywords (comma-separated)</Label>
              <Textarea value={form.keywords} onChange={(e) => setForm({ ...form, keywords: e.target.value })} rows={2} disabled={!isAdmin} />
            </div>
            <div className="space-y-2">
              <Label>Target Agencies (comma-separated)</Label>
              <Textarea
                value={form.targetAgencies}
                onChange={(e) => setForm({ ...form, targetAgencies: e.target.value })}
                rows={2}
                disabled={!isAdmin}
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
                        disabled={!isAdmin}
                        className="accent-primary"
                      />
                      <span className="uppercase">{k}</span>
                    </label>
                    {certs[k] && (
                      <Input
                        type="date"
                        value={certExpiries[k] || ""}
                        onChange={(e) => setCertExpiries({ ...certExpiries, [k]: e.target.value })}
                        disabled={!isAdmin}
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

      {isAdmin ? (
        <Button onClick={save} disabled={saving}>
          <Save className="h-4 w-4 mr-2" />
          {saving ? "Saving..." : "Save Client"}
        </Button>
      ) : (
        <p className="text-sm text-muted-foreground">Read-only — admin access required to edit clients.</p>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Capability Statements</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {isAdmin && (
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => capInputRef.current?.click()} disabled={uploading}>
                <Upload className="h-4 w-4 mr-2" />
                {uploading ? "Uploading..." : "Upload Statement"}
              </Button>
              <input
                ref={capInputRef}
                type="file"
                accept=".pdf,.doc,.docx,.ppt,.pptx"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && uploadCapability(e.target.files[0])}
              />
            </div>
          )}
          {(client.govcon?.capabilityStatements || []).length === 0 ? (
            <p className="text-sm text-muted-foreground">No capability statements uploaded.</p>
          ) : (
            <div className="space-y-2">
              {(client.govcon?.capabilityStatements || []).map((cs) => (
                <div key={cs.fileId} className="flex items-center gap-3 rounded-lg border p-3">
                  <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{cs.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {cs.version} · {new Date(cs.uploadedAt).toLocaleDateString()}
                    </p>
                  </div>
                  {storage && (
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={`Download ${cs.name}`}
                      onClick={async () => {
                        const url = await getDownloadURL(storageRef(storage!, cs.storagePath));
                        window.open(url, "_blank");
                      }}
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

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
