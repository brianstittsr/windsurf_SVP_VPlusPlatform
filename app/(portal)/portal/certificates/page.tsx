"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { auth } from "@/lib/firebase";
import { useRequireAuth } from "@/lib/hooks/use-auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Award, Copy, Download, ExternalLink, Loader2, ShieldCheck } from "lucide-react";

interface CertificateView {
  id: string;
  certificateNumber: string;
  publicCredentialId?: string;
  publicSharingEnabled?: boolean;
  publicNameConsent?: boolean;
  badgeTitle?: string;
  studentName: string;
  courseId: string;
  courseCode: string;
  courseTitle: string;
  issuedAt: string | null;
  studentDocumentId: string | null;
}

export default function CertificatesPage() {
  const { isLoading: authLoading, isAuthenticated } = useRequireAuth();
  const [certificates, setCertificates] = useState<CertificateView[]>([]);
  const [consent, setConsent] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState("");
  const [addToProfileUrl, setAddToProfileUrl] = useState("");

  const getToken = useCallback(async () => {
    if (!auth?.currentUser) throw new Error("Sign in again to continue");
    return auth.currentUser.getIdToken();
  }, []);

  const load = useCallback(async () => {
    const token = await getToken();
    const response = await fetch("/api/certificates", { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "Unable to load certificates");
    setCertificates(result.data || []);
  }, [getToken]);

  useEffect(() => {
    setAddToProfileUrl(process.env.NEXT_PUBLIC_LINKEDIN_ADD_TO_PROFILE_URL || "");
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return;
    let active = true;
    void load().catch((error: unknown) => toast.error(error instanceof Error ? error.message : "Unable to load certificates"))
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [isAuthenticated, load]);

  const download = async (documentId: string, fileName: string) => {
    try {
      const token = await getToken();
      const response = await fetch(`/api/student-documents/${documentId}`, { headers: { Authorization: `Bearer ${token}` } });
      if (!response.ok) throw new Error("Certificate download is unavailable");
      const url = URL.createObjectURL(await response.blob());
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = fileName;
      anchor.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to download certificate");
    }
  };

  const setPublicSharing = async (certificate: CertificateView, enabled: boolean) => {
    if (enabled && consent[certificate.id] !== true) {
      toast.error("Review and accept the public credential consent first.");
      return;
    }
    setBusyId(certificate.id);
    try {
      const token = await getToken();
      const response = await fetch("/api/credentials/share", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ certificateId: certificate.id, enabled, publicNameConsent: enabled && consent[certificate.id] === true }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Unable to update credential sharing");
      setCertificates((items) => items.map((item) => item.id === certificate.id ? { ...item, publicCredentialId: result.data.publicCredentialId, publicSharingEnabled: enabled, publicNameConsent: enabled } : item));
      toast.success(enabled ? "Public credential link enabled" : "Public credential link disabled");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to update sharing");
    } finally {
      setBusyId("");
    }
  };

  const copyLinkedInDetails = async (certificate: CertificateView) => {
    const credentialUrl = `${window.location.origin}/credentials/${certificate.publicCredentialId}`;
    const text = [
      `Certification: ${certificate.badgeTitle || `${certificate.courseCode} — Course Completion`}`,
      "Issuing organization: Strategic Value Plus Solutions, LLC · V+ Academy",
      `Issue date: ${certificate.issuedAt ? new Date(certificate.issuedAt).toLocaleDateString() : ""}`,
      `Credential ID: ${certificate.certificateNumber}`,
      `Credential URL: ${credentialUrl}`,
    ].join("\n");
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Credential details copied for LinkedIn");
    } catch {
      toast.error("Clipboard access is unavailable in this browser");
    }
  };

  if (authLoading || !isAuthenticated || loading) return <Skeleton className="h-64 w-full" />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold">My Certificates</h1>
        <p className="text-muted-foreground">V+ course-completion credentials and shareable verification links.</p>
      </div>
      {certificates.length === 0 ? (
        <Card><CardContent className="py-12 text-center"><Award className="mx-auto h-12 w-12 text-muted-foreground/40" /><p className="mt-4 text-muted-foreground">No certificates yet. Complete an eligible course to earn one.</p></CardContent></Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {certificates.map((certificate) => {
            const isPublic = certificate.publicSharingEnabled === true && certificate.publicNameConsent === true;
            const credentialUrl = certificate.publicCredentialId ? `${typeof window !== "undefined" ? window.location.origin : "https://strategicvalueplus.com"}/credentials/${certificate.publicCredentialId}` : "";
            return <Card key={certificate.id}>
              <CardHeader>
                <div className="flex items-center justify-between gap-2"><Award className="h-6 w-6 text-[#C9962B]" /><Badge variant="secondary">{certificate.certificateNumber}</Badge></div>
                <CardTitle className="text-lg">{certificate.badgeTitle || `${certificate.courseCode} — ${certificate.courseTitle}`}</CardTitle>
                <CardDescription>Issued {certificate.issuedAt ? new Date(certificate.issuedAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }) : "—"}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {certificate.studentDocumentId && <Button variant="outline" className="w-full" onClick={() => void download(certificate.studentDocumentId!, `${certificate.certificateNumber}.pdf`)}><Download className="mr-2 h-4 w-4" />Download V+ certificate PDF</Button>}
                <div className="space-y-3 rounded-md border p-3">
                  <div className="flex items-center justify-between gap-3"><div><p className="font-medium text-sm">Public credential page</p><p className="text-xs text-muted-foreground">Share a credential-only verification page; private profile and documents stay hidden.</p></div><Button size="sm" variant={isPublic ? "destructive" : "outline"} disabled={busyId === certificate.id} onClick={() => void setPublicSharing(certificate, !isPublic)}>{busyId === certificate.id ? <Loader2 className="h-4 w-4 animate-spin" /> : isPublic ? "Turn off" : "Enable"}</Button></div>
                  {!isPublic && <div className="flex items-start gap-2"><Checkbox id={`share-consent-${certificate.id}`} checked={consent[certificate.id] === true} onCheckedChange={(checked) => setConsent((current) => ({ ...current, [certificate.id]: checked === true }))} /><Label htmlFor={`share-consent-${certificate.id}`} className="text-xs font-normal leading-relaxed">I consent to display my name, course credential, issue date, credential ID, and verification status on a public page.</Label></div>}
                  {isPublic && credentialUrl && <div className="space-y-2"><Link className="block break-all text-xs text-[#8A6212] underline" href={credentialUrl} target="_blank">{credentialUrl}</Link><div className="flex flex-wrap gap-2"><Button variant="outline" size="sm" asChild><Link href={credentialUrl} target="_blank"><ShieldCheck className="mr-2 h-4 w-4" />View verified badge</Link></Button><Button variant="outline" size="sm" onClick={() => void copyLinkedInDetails(certificate)}><Copy className="mr-2 h-4 w-4" />Copy LinkedIn details</Button>{addToProfileUrl && <Button variant="outline" size="sm" asChild><a href={addToProfileUrl} target="_blank" rel="noopener noreferrer"><ExternalLink className="mr-2 h-4 w-4" />Add to LinkedIn</a></Button>}</div><p className="text-xs text-muted-foreground">LinkedIn currently opens its certification form without prefilled details. Use “Copy LinkedIn details,” then paste the credential ID and verification URL.</p></div>}
                </div>
                <p className="text-xs text-muted-foreground">V+ credentials document V+ training completion; they are not FAA Remote Pilot Certificates.</p>
              </CardContent>
            </Card>;
          })}
        </div>
      )}
    </div>
  );
}
