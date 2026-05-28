"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  MapPin,
  Search,
  Loader2,
  ExternalLink,
  Plus,
  Filter,
  FileSignature,
  Building,
  User,
  FileText,
  CheckCircle,
  ChevronRight,
  ChevronLeft,
  Check,
  Download,
  Send,
  Eye,
  Trash2,
  Pen,
  Type,
  RotateCcw,
  Clock,
  Shield,
  Calendar,
  Zap,
  Mail,
  X,
  Upload,
  Sparkles,
  Building2,
  Tag,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type { ZenthiumOpportunity, OpportunityFormData } from "@/lib/types/zenthium-opportunity";
import { INITIAL_OPPORTUNITY } from "@/lib/types/zenthium-opportunity";

// ─── Types ───────────────────────────────────────────────────────────────────
interface ContractorInfo {
  name: string;
  company: string;
  email: string;
  phone: string;
}

interface SignatureCapture {
  data: string;
  type: "draw" | "type";
  signedAt: string;
  signerName: string;
}

interface ReferralAgreement {
  id: string;
  propertyAddress: string;
  propertyType: string;
  referralFeePercentage: number;
  specialInstructions: string;
  contractor: ContractorInfo;
  contractorSignature?: SignatureCapture | null;
  status: "draft" | "sent" | "signed" | "completed";
  finalDocumentBase64?: string | null;
  createdAt: string;
  signedAt?: string | null;
}

// ─── Wizard Step Config ───────────────────────────────────────────────────────
const WIZARD_STEPS = [
  { id: 1, title: "Property Details",   icon: MapPin,          description: "Property & referral information" },
  { id: 2, title: "Contractor Info",    icon: User,            description: "Contractor details" },
  { id: 3, title: "Review Agreement",   icon: FileText,        description: "Preview the agreement" },
  { id: 4, title: "Sign & Complete",    icon: FileSignature,   description: "Digital signature" },
];

// ─── Agreement Template ───────────────────────────────────────────────────────
function buildAgreementText(
  propertyAddress: string,
  propertyType: string,
  referralFeePercentage: number,
  contractor: ContractorInfo,
  specialInstructions: string
): string {
  const today = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
  return `PROPERTY LOCATION INTRODUCTION AGREEMENT

Effective Date: ${today}

PARTIES:

Introducing Party:
  Name: Nelinia Varenas
  Company: Zenthium, LLC
  Title: Authorized Representative

Contractor / Receiving Party:
  Name: ${contractor.name || "[Contractor Name]"}
  Company: ${contractor.company || "[Contractor Company]"}
  Email: ${contractor.email || "[Contractor Email]"}
  Phone: ${contractor.phone || "[Contractor Phone]"}

─────────────────────────────────────────────────────────────────────────────

RECITALS

WHEREAS, the Introducing Party has identified a property location that may be suitable for the Contractor's purposes; and

WHEREAS, the Contractor desires to receive an introduction to the property location identified by the Introducing Party;

NOW, THEREFORE, in consideration of the mutual covenants and agreements hereinafter set forth, the parties agree as follows:

─────────────────────────────────────────────────────────────────────────────

1. PROPERTY LOCATION

   Address:      ${propertyAddress || "[Property Address]"}
   Property Type: ${propertyType || "Not specified"}
   
   The Introducing Party hereby introduces the above-described property location to the Contractor for evaluation and potential use.

2. REFERRAL FEE

   In consideration of the introduction provided herein, the Contractor agrees to pay the Introducing Party a referral fee equal to ${referralFeePercentage}% of the total transaction value (purchase price or first-year lease value, as applicable) upon closing or execution of any binding agreement related to the above-referenced property, within twenty-four (24) months of the date of this Agreement.

3. EXCLUSIVITY AND NON-CIRCUMVENTION

   The Contractor agrees not to circumvent, avoid, bypass, or obviate the Introducing Party's interests by contacting, negotiating with, or transacting with the property owner, seller, or any associated party except through or with the express written consent of the Introducing Party.

4. CONFIDENTIALITY

   The Contractor agrees to keep confidential all information disclosed by the Introducing Party regarding the property location, including but not limited to the property address, owner information, pricing, and any other proprietary information.

5. TERM

   This Agreement shall remain in full force and effect for a period of twenty-four (24) months from the Effective Date above.

6. GOVERNING LAW

   This Agreement shall be governed by and construed in accordance with the laws of the State of North Carolina, without regard to its conflict of laws principles.

7. SPECIAL INSTRUCTIONS / ADDITIONAL TERMS
${specialInstructions ? "\n   " + specialInstructions + "\n" : "\n   None.\n"}

─────────────────────────────────────────────────────────────────────────────

SIGNATURES

By signing below, the parties acknowledge that they have read, understand, and agree to be bound by the terms of this Agreement.

INTRODUCING PARTY:

  Signature: [PRE-SIGNED — Nelinia Varenas]
  Printed Name: Nelinia Varenas
  Title: Authorized Representative, Zenthium LLC
  Date: ${today}


CONTRACTOR:

  Signature: ___________________________
  Printed Name: ${contractor.name || "___________________________"}
  Company: ${contractor.company || "___________________________"}
  Date: ___________________________

─────────────────────────────────────────────────────────────────────────────
© Zenthium LLC. All rights reserved.`;
}

// ─── Signature Pad Component ──────────────────────────────────────────────────
function SignaturePad({
  onCapture,
  signerName,
}: {
  onCapture: (sig: SignatureCapture) => void;
  signerName: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [mode, setMode] = useState<"draw" | "type">("draw");
  const [typedSig, setTypedSig] = useState("");
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);
  const lastPos = useRef<{ x: number; y: number } | null>(null);

  const getPos = (e: React.MouseEvent | React.TouchEvent, canvas: HTMLCanvasElement) => {
    const rect = canvas.getBoundingClientRect();
    if ("touches" in e) {
      return { x: e.touches[0].clientX - rect.left, y: e.touches[0].clientY - rect.top };
    }
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const startDraw = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    e.preventDefault();
    setIsDrawing(true);
    setHasDrawn(true);
    lastPos.current = getPos(e, canvas);
  }, []);

  const draw = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx || !lastPos.current) return;
    e.preventDefault();
    const pos = getPos(e, canvas);
    ctx.beginPath();
    ctx.moveTo(lastPos.current.x, lastPos.current.y);
    ctx.lineTo(pos.x, pos.y);
    ctx.strokeStyle = "#1a1a2e";
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.stroke();
    lastPos.current = pos;
  }, [isDrawing]);

  const stopDraw = useCallback(() => setIsDrawing(false), []);

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawn(false);
  };

  const capture = () => {
    if (mode === "draw") {
      const canvas = canvasRef.current;
      if (!canvas || !hasDrawn) { toast.error("Please draw your signature first"); return; }
      onCapture({ data: canvas.toDataURL("image/png"), type: "draw", signedAt: new Date().toISOString(), signerName });
    } else {
      if (!typedSig.trim()) { toast.error("Please type your signature first"); return; }
      // Render typed signature to canvas data
      const offscreen = document.createElement("canvas");
      offscreen.width = 400; offscreen.height = 100;
      const ctx = offscreen.getContext("2d")!;
      ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, 400, 100);
      ctx.font = "italic 36px Georgia, serif";
      ctx.fillStyle = "#1a1a2e";
      ctx.fillText(typedSig, 20, 65);
      onCapture({ data: offscreen.toDataURL("image/png"), type: "type", signedAt: new Date().toISOString(), signerName });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Button size="sm" variant={mode === "draw" ? "default" : "outline"} onClick={() => setMode("draw")}>
          <Pen className="h-3 w-3 mr-1" /> Draw
        </Button>
        <Button size="sm" variant={mode === "type" ? "default" : "outline"} onClick={() => setMode("type")}>
          <Type className="h-3 w-3 mr-1" /> Type
        </Button>
      </div>

      {mode === "draw" ? (
        <div className="border-2 border-dashed rounded-lg overflow-hidden bg-white relative">
          <canvas
            ref={canvasRef}
            width={560}
            height={120}
            className="w-full cursor-crosshair touch-none"
            onMouseDown={startDraw}
            onMouseMove={draw}
            onMouseUp={stopDraw}
            onMouseLeave={stopDraw}
            onTouchStart={startDraw}
            onTouchMove={draw}
            onTouchEnd={stopDraw}
          />
          <p className="absolute bottom-2 right-3 text-xs text-muted-foreground pointer-events-none">
            Sign here
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          <Input
            placeholder="Type your full name as signature"
            value={typedSig}
            onChange={(e) => setTypedSig(e.target.value)}
            className="text-2xl italic font-serif h-16 text-center"
            style={{ fontFamily: "Georgia, serif" }}
          />
          <p className="text-xs text-muted-foreground text-center">
            Your typed name will serve as your electronic signature
          </p>
        </div>
      )}

      <div className="flex gap-2">
        {mode === "draw" && (
          <Button variant="outline" size="sm" onClick={clearCanvas}>
            <RotateCcw className="h-3 w-3 mr-1" /> Clear
          </Button>
        )}
        <Button onClick={capture} className="flex-1">
          <Check className="h-4 w-4 mr-2" /> Apply Signature
        </Button>
      </div>
    </div>
  );
}

// ─── Status Badge Helper ──────────────────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; className: string; icon: React.ReactNode }> = {
    draft:     { label: "Draft",     className: "bg-gray-100 text-gray-700 border-gray-200",   icon: <FileText className="h-3 w-3" /> },
    sent:      { label: "Sent",      className: "bg-blue-100 text-blue-700 border-blue-200",   icon: <Send className="h-3 w-3" /> },
    signed:    { label: "Signed",    className: "bg-green-100 text-green-700 border-green-200", icon: <CheckCircle className="h-3 w-3" /> },
    completed: { label: "Completed", className: "bg-purple-100 text-purple-700 border-purple-200", icon: <Shield className="h-3 w-3" /> },
  };
  const cfg = map[status] ?? map.draft;
  return (
    <Badge variant="outline" className={cn("gap-1", cfg.className)}>
      {cfg.icon} {cfg.label}
    </Badge>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function ZenthiumReferralsPage() {
  const [pageTab, setPageTab] = useState<"agreements" | "opportunities">("agreements");

  // ── opportunities state
  const [opportunities, setOpportunities] = useState<ZenthiumOpportunity[]>([]);
  const [isLoadingOpp, setIsLoadingOpp] = useState(false);
  const [showOppWizard, setShowOppWizard] = useState(false);
  const [editingOpp, setEditingOpp] = useState<ZenthiumOpportunity | null>(null);

  const fetchOpportunities = useCallback(async () => {
    setIsLoadingOpp(true);
    try {
      const res = await fetch("/api/zenthium/opportunities");
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setOpportunities(data.opportunities ?? []);
    } catch {
      toast.error("Failed to load opportunities");
    } finally {
      setIsLoadingOpp(false);
    }
  }, []);

  useEffect(() => {
    if (pageTab === "opportunities") fetchOpportunities();
  }, [pageTab, fetchOpportunities]);

  // ── list state
  const [agreements, setAgreements] = useState<ReferralAgreement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  // ── wizard state
  const [showWizard, setShowWizard] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [isSaving, setIsSaving] = useState(false);

  // ── form state
  const [propertyAddress, setPropertyAddress] = useState("");
  const [propertyType, setPropertyType] = useState("residential");
  const [referralFee, setReferralFee] = useState(3);
  const [specialInstructions, setSpecialInstructions] = useState("");
  const [contractor, setContractor] = useState<ContractorInfo>({ name: "", company: "", email: "", phone: "" });
  const [contractorSignature, setContractorSignature] = useState<SignatureCapture | null>(null);

  // ── view modal
  const [viewingAgreement, setViewingAgreement] = useState<ReferralAgreement | null>(null);

  useEffect(() => { fetchAgreements(); }, []);

  const fetchAgreements = async () => {
    try {
      const res = await fetch("/api/zenthium/referral-agreements");
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setAgreements(data.agreements ?? []);
    } catch {
      toast.error("Failed to load agreements");
    } finally {
      setIsLoading(false);
    }
  };

  const resetWizard = () => {
    setCurrentStep(1);
    setPropertyAddress("");
    setPropertyType("residential");
    setReferralFee(3);
    setSpecialInstructions("");
    setContractor({ name: "", company: "", email: "", phone: "" });
    setContractorSignature(null);
  };

  const openWizard = () => { resetWizard(); setShowWizard(true); };
  const closeWizard = () => { setShowWizard(false); resetWizard(); };

  // ── step validation
  const canProceed = () => {
    if (currentStep === 1) return propertyAddress.trim().length > 0;
    if (currentStep === 2) return contractor.name.trim() && contractor.company.trim() && contractor.email.trim();
    if (currentStep === 3) return true;
    return false;
  };

  // ── build base64 document
  const buildDocument = (): string => {
    const text = buildAgreementText(propertyAddress, propertyType, referralFee, contractor, specialInstructions);
    return btoa(unescape(encodeURIComponent(text)));
  };

  // ── save agreement
  const saveAgreement = async (status: "draft" | "signed") => {
    if (status === "signed" && !contractorSignature) {
      toast.error("Contractor signature is required");
      return;
    }
    setIsSaving(true);
    try {
      const body = {
        propertyAddress,
        propertyType,
        referralFeePercentage: referralFee,
        specialInstructions,
        contractor,
        contractorSignature: contractorSignature ?? undefined,
        status,
        finalDocumentBase64: buildDocument(),
      };
      const res = await fetch("/api/zenthium/referral-agreements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error("Failed to save");
      toast.success(status === "signed" ? "Agreement signed and saved!" : "Agreement saved as draft");
      closeWizard();
      fetchAgreements();
    } catch {
      toast.error("Failed to save agreement");
    } finally {
      setIsSaving(false);
    }
  };

  const deleteAgreement = async (id: string) => {
    if (!confirm("Delete this agreement? This cannot be undone.")) return;
    try {
      const res = await fetch(`/api/zenthium/referral-agreements/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      toast.success("Agreement deleted");
      setAgreements((prev) => prev.filter((a) => a.id !== id));
    } catch {
      toast.error("Failed to delete agreement");
    }
  };

  const downloadDocument = (agreement: ReferralAgreement) => {
    if (!agreement.finalDocumentBase64) { toast.error("No document available"); return; }
    try {
      const text = decodeURIComponent(escape(atob(agreement.finalDocumentBase64)));
      const blob = new Blob([text], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Zenthium_Referral_Agreement_${agreement.contractor?.company ?? "Contractor"}.txt`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error("Failed to download document");
    }
  };

  const filteredAgreements = agreements.filter((a) => {
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      a.propertyAddress?.toLowerCase().includes(q) ||
      a.contractor?.name?.toLowerCase().includes(q) ||
      a.contractor?.company?.toLowerCase().includes(q);
    const matchStatus = statusFilter === "All" || a.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const formatDate = (d?: string | null) => {
    if (!d) return "—";
    return new Date(d).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
  };

  const agreementText = buildAgreementText(propertyAddress, propertyType, referralFee, contractor, specialInstructions);

  // ── Wizard Step Renderers ──────────────────────────────────────────────────
  const renderStep1 = () => (
    <div className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="propertyAddress">Property Address <span className="text-destructive">*</span></Label>
        <Textarea
          id="propertyAddress"
          placeholder="Enter full property address (street, city, state, zip)"
          value={propertyAddress}
          onChange={(e) => setPropertyAddress(e.target.value)}
          rows={3}
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Property Type</Label>
          <Select value={propertyType} onValueChange={setPropertyType}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="residential">Residential</SelectItem>
              <SelectItem value="commercial">Commercial</SelectItem>
              <SelectItem value="industrial">Industrial</SelectItem>
              <SelectItem value="mixed_use">Mixed-Use</SelectItem>
              <SelectItem value="land">Land / Vacant Lot</SelectItem>
              <SelectItem value="data_center">Data Center Site</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="referralFee">Referral Fee %</Label>
          <div className="relative">
            <Input
              id="referralFee"
              type="number"
              min={0}
              max={100}
              step={0.5}
              value={referralFee}
              onChange={(e) => setReferralFee(parseFloat(e.target.value) || 0)}
              className="pr-8"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">%</span>
          </div>
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="specialInstructions">Special Instructions (Optional)</Label>
        <Textarea
          id="specialInstructions"
          placeholder="Any additional terms or notes for this agreement..."
          value={specialInstructions}
          onChange={(e) => setSpecialInstructions(e.target.value)}
          rows={3}
        />
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="cName">Contractor Full Name <span className="text-destructive">*</span></Label>
          <Input
            id="cName"
            placeholder="John Smith"
            value={contractor.name}
            onChange={(e) => setContractor((p) => ({ ...p, name: e.target.value }))}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="cCompany">Company Name <span className="text-destructive">*</span></Label>
          <Input
            id="cCompany"
            placeholder="Smith Properties LLC"
            value={contractor.company}
            onChange={(e) => setContractor((p) => ({ ...p, company: e.target.value }))}
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="cEmail">Email Address <span className="text-destructive">*</span></Label>
          <Input
            id="cEmail"
            type="email"
            placeholder="john@smithproperties.com"
            value={contractor.email}
            onChange={(e) => setContractor((p) => ({ ...p, email: e.target.value }))}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="cPhone">Phone Number</Label>
          <Input
            id="cPhone"
            type="tel"
            placeholder="(555) 000-0000"
            value={contractor.phone}
            onChange={(e) => setContractor((p) => ({ ...p, phone: e.target.value }))}
          />
        </div>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-4">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-start gap-2">
        <Shield className="h-4 w-4 text-blue-600 mt-0.5 shrink-0" />
        <p className="text-sm text-blue-700">
          Review the agreement below. This document has been <strong>pre-signed by Nelinia Varenas</strong>. The contractor will add their signature in the next step.
        </p>
      </div>
      <div className="border rounded-lg bg-white overflow-hidden">
        <div className="bg-muted/40 px-4 py-2 border-b flex items-center gap-2">
          <FileText className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">Property Location Introduction Agreement</span>
          <Badge variant="outline" className="ml-auto text-xs bg-green-50 text-green-700 border-green-200">
            Pre-signed by Nelinia Varenas ✓
          </Badge>
        </div>
        <pre className="p-4 text-xs font-mono text-foreground/80 whitespace-pre-wrap max-h-80 overflow-y-auto leading-relaxed">
          {agreementText}
        </pre>
      </div>
    </div>
  );

  const renderStep4 = () => (
    <div className="space-y-5">
      {/* Nelinia's pre-signed block */}
      <Card className="border-green-200 bg-green-50">
        <CardContent className="pt-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-green-600 flex items-center justify-center text-white font-bold text-sm">NV</div>
            <div>
              <p className="font-semibold text-green-800">Nelinia Varenas — Pre-Signed ✓</p>
              <p className="text-xs text-green-700">Zenthium LLC · Authorized Representative · {new Date().toLocaleDateString()}</p>
            </div>
            <CheckCircle className="ml-auto h-5 w-5 text-green-600" />
          </div>
        </CardContent>
      </Card>

      <Separator />

      {/* Contractor signature */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
            <Pen className="h-4 w-4 text-primary" />
          </div>
          <div>
            <p className="font-medium">{contractor.name || "Contractor"} — Signature Required</p>
            <p className="text-xs text-muted-foreground">{contractor.company}</p>
          </div>
        </div>

        {contractorSignature ? (
          <Card className="border-green-200 bg-green-50">
            <CardContent className="pt-4 flex items-center gap-4">
              <img src={contractorSignature.data} alt="Signature" className="h-14 border bg-white rounded px-2" />
              <div className="flex-1">
                <p className="text-sm font-medium text-green-800">Signature captured ✓</p>
                <p className="text-xs text-green-700">
                  {contractorSignature.type === "draw" ? "Drawn" : "Typed"} · {new Date(contractorSignature.signedAt).toLocaleString()}
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={() => setContractorSignature(null)}>
                <RotateCcw className="h-3 w-3 mr-1" /> Re-sign
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="pt-4">
              <SignaturePad onCapture={setContractorSignature} signerName={contractor.name} />
            </CardContent>
          </Card>
        )}
      </div>

      {contractorSignature && (
        <div className="bg-muted/40 rounded-lg p-3 text-sm text-muted-foreground text-center">
          By clicking <strong>Save Signed Agreement</strong>, both parties consent to electronic signature under the ESIGN Act.
        </div>
      )}
    </div>
  );

  // ── View Agreement Modal body ──────────────────────────────────────────────
  const renderViewModal = () => {
    if (!viewingAgreement) return null;
    let docText = "No document available";
    if (viewingAgreement.finalDocumentBase64) {
      try { docText = decodeURIComponent(escape(atob(viewingAgreement.finalDocumentBase64))); } catch { /* ignore */ }
    }
    return (
      <Dialog open={!!viewingAgreement} onOpenChange={() => setViewingAgreement(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileSignature className="h-5 w-5" />
              Referral Agreement — {viewingAgreement.contractor?.company}
            </DialogTitle>
            <DialogDescription>{viewingAgreement.propertyAddress}</DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto space-y-4 min-h-0">
            <div className="flex gap-3">
              <StatusBadge status={viewingAgreement.status} />
              {viewingAgreement.signedAt && (
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Calendar className="h-3 w-3" /> Signed {formatDate(viewingAgreement.signedAt)}
                </span>
              )}
            </div>
            {viewingAgreement.contractorSignature && (
              <Card className="border-green-200 bg-green-50">
                <CardContent className="pt-3 pb-3">
                  <p className="text-xs font-medium text-green-700 mb-2">Contractor Signature</p>
                  <img src={viewingAgreement.contractorSignature.data} alt="Sig" className="h-12 bg-white border rounded px-2" />
                  <p className="text-xs text-green-600 mt-1">{viewingAgreement.contractorSignature.signerName} · {viewingAgreement.contractorSignature.type}</p>
                </CardContent>
              </Card>
            )}
            <pre className="border rounded-lg p-4 text-xs font-mono whitespace-pre-wrap bg-white max-h-96 overflow-y-auto">{docText}</pre>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => downloadDocument(viewingAgreement)}>
              <Download className="h-4 w-4 mr-2" /> Download
            </Button>
            <Button onClick={() => setViewingAgreement(null)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <FileSignature className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Zenthium Deal Management</h1>
              <p className="text-muted-foreground text-sm">
                Powered Land Opportunities · Referral Agreements · Pre-signed by Nelinia Varenas
              </p>
            </div>
          </div>
          {pageTab === "agreements" ? (
            <Button onClick={openWizard}>
              <Plus className="h-4 w-4 mr-2" /> New Agreement
            </Button>
          ) : (
            <Button onClick={() => setShowOppWizard(true)}>
              <Plus className="h-4 w-4 mr-2" /> New Opportunity
            </Button>
          )}
        </div>

        {/* Page Tabs */}
        <div className="flex gap-2 border-b pb-0">
          <Button
            variant={pageTab === "agreements" ? "default" : "ghost"}
            className="rounded-b-none"
            onClick={() => setPageTab("agreements")}
          >
            <FileSignature className="mr-2 h-4 w-4" />
            Referral Agreements
          </Button>
          <Button
            variant={pageTab === "opportunities" ? "default" : "ghost"}
            className="rounded-b-none"
            onClick={() => setPageTab("opportunities")}
          >
            <Zap className="mr-2 h-4 w-4" />
            Opportunities
            {opportunities.filter((o: ZenthiumOpportunity) => !o.intakeSentAt).length > 0 && (
              <Badge className="ml-2 bg-amber-500 text-white text-xs px-1.5">
                {opportunities.filter((o: ZenthiumOpportunity) => !o.intakeSentAt).length}
              </Badge>
            )}
          </Button>
        </div>

        {/* ── AGREEMENTS TAB CONTENT ─────────────────────────────────────── */}
        {pageTab === "agreements" && (
          <>
            {/* Stats row */}
            <div className="grid grid-cols-4 gap-4">
              {[
                { label: "Total", value: agreements.length, icon: FileText, color: "text-foreground" },
                { label: "Signed", value: agreements.filter((a) => a.status === "signed" || a.status === "completed").length, icon: CheckCircle, color: "text-green-600" },
                { label: "Pending", value: agreements.filter((a) => a.status === "draft" || a.status === "sent").length, icon: Clock, color: "text-amber-600" },
                { label: "Avg Fee", value: agreements.length ? `${(agreements.reduce((s, a) => s + (a.referralFeePercentage ?? 3), 0) / agreements.length).toFixed(1)}%` : "—", icon: Building, color: "text-blue-600" },
              ].map(({ label, value, icon: Icon, color }) => (
                <Card key={label}>
                  <CardContent className="pt-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">{label}</p>
                        <p className={cn("text-2xl font-bold", color)}>{value}</p>
                      </div>
                      <Icon className="h-8 w-8 text-muted-foreground/30" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Filters */}
            <Card>
              <CardContent className="pt-4 pb-4">
                <div className="flex items-center gap-4">
                  <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="Search by address, contractor..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
                  </div>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[180px]">
                      <Filter className="h-4 w-4 mr-2" />
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {["All", "draft", "sent", "signed", "completed"].map((s) => (
                        <SelectItem key={s} value={s} className="capitalize">{s === "All" ? "All Statuses" : s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Table */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Agreements ({filteredAgreements.length})</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : filteredAgreements.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <FileSignature className="h-12 w-12 mx-auto mb-3 opacity-20" />
                    <p className="font-medium">No agreements yet</p>
                    <p className="text-sm mt-1">Click <strong>New Agreement</strong> to create your first referral agreement.</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Property</TableHead>
                        <TableHead>Contractor</TableHead>
                        <TableHead>Fee</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredAgreements.map((a) => (
                        <TableRow key={a.id}>
                          <TableCell>
                            <div className="font-medium text-sm">{a.propertyAddress}</div>
                            <div className="text-xs text-muted-foreground capitalize">{a.propertyType?.replace("_", " ")}</div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm font-medium">{a.contractor?.name}</div>
                            <div className="text-xs text-muted-foreground">{a.contractor?.company}</div>
                          </TableCell>
                          <TableCell className="text-sm">{a.referralFeePercentage}%</TableCell>
                          <TableCell><StatusBadge status={a.status} /></TableCell>
                          <TableCell className="text-sm text-muted-foreground">{formatDate(a.createdAt)}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button variant="ghost" size="sm" onClick={() => setViewingAgreement(a)}>
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="sm" onClick={() => downloadDocument(a)}>
                                <Download className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => deleteAgreement(a.id)}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>

            {/* ── Wizard Dialog ────────────────────────────────────────────── */}
            <Dialog open={showWizard} onOpenChange={(open) => !open && closeWizard()}>
              <DialogContent className="max-w-2xl max-h-[92vh] flex flex-col">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <FileSignature className="h-5 w-5 text-primary" />
                    New Zenthium Referral Agreement
                  </DialogTitle>
                  <DialogDescription>
                    Step {currentStep} of {WIZARD_STEPS.length} — {WIZARD_STEPS[currentStep - 1].description}
                  </DialogDescription>
                </DialogHeader>

                {/* Progress */}
                <div className="space-y-2">
                  <Progress value={(currentStep / WIZARD_STEPS.length) * 100} className="h-1.5" />
                  <div className="flex justify-between">
                    {WIZARD_STEPS.map((step) => {
                      const Icon = step.icon;
                      const done = currentStep > step.id;
                      const active = currentStep === step.id;
                      return (
                        <div key={step.id} className={cn("flex items-center gap-1 text-xs", active ? "text-primary font-medium" : done ? "text-green-600" : "text-muted-foreground")}>
                          <div className={cn("w-5 h-5 rounded-full flex items-center justify-center border", active ? "border-primary bg-primary text-white" : done ? "border-green-600 bg-green-600 text-white" : "border-muted-foreground/30")}>
                            {done ? <Check className="h-3 w-3" /> : <Icon className="h-3 w-3" />}
                          </div>
                          <span className="hidden sm:inline">{step.title}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Step content */}
                <div className="flex-1 overflow-y-auto py-2">
                  {currentStep === 1 && renderStep1()}
                  {currentStep === 2 && renderStep2()}
                  {currentStep === 3 && renderStep3()}
                  {currentStep === 4 && renderStep4()}
                </div>

                {/* Footer navigation */}
                <DialogFooter className="flex items-center gap-2 pt-4 border-t">
                  <Button variant="outline" onClick={() => currentStep === 1 ? closeWizard() : setCurrentStep(s => s - 1)} disabled={isSaving}>
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    {currentStep === 1 ? "Cancel" : "Back"}
                  </Button>
                  <div className="flex-1" />
                  {currentStep < 4 && (
                    <Button onClick={() => setCurrentStep(s => s + 1)} disabled={!canProceed()}>
                      Next <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  )}
                  {currentStep === 4 && (
                    <>
                      <Button variant="outline" onClick={() => saveAgreement("draft")} disabled={isSaving}>
                        {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <FileText className="h-4 w-4 mr-2" />}
                        Save Draft
                      </Button>
                      <Button onClick={() => saveAgreement("signed")} disabled={isSaving || !contractorSignature}>
                        {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CheckCircle className="h-4 w-4 mr-2" />}
                        Save Signed Agreement
                      </Button>
                    </>
                  )}
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* ── View Agreement Modal ─────────────────────────────────────── */}
            {renderViewModal()}
          </>
        )}

        {/* ── OPPORTUNITIES TAB CONTENT ─────────────────────────────────── */}
        {pageTab === "opportunities" && (
          <OpportunitiesTab
            opportunities={opportunities}
            isLoadingOpp={isLoadingOpp}
            onRefresh={fetchOpportunities}
            showWizard={showOppWizard}
            setShowWizard={setShowOppWizard}
            editingOpp={editingOpp}
            setEditingOpp={setEditingOpp}
          />
        )}

      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// OpportunitiesTab Component
// ─────────────────────────────────────────────────────────────────────────────

const DEAL_STAGES = ["New Lead","Under Review","Site Visit Scheduled","Due Diligence","LOI Issued","Contracted","Closed","Rejected"] as const;
const PROPERTY_TYPES_OPP = ["Vacant / Greenfield Land","Powered Shell","Vacant Warehouse","Industrial Building","Existing Data Center","Power Plant / Energy Facility","Campus / Multi-Building","Other"];
const POWER_TYPES_OPP = ["Grid-Connected","Behind-the-Meter","Renewable","Nuclear Adjacent","Combined / Hybrid","Unknown / TBD"];
const COOLING_TYPES = ["Air-Cooled","Water-Cooled","Evaporative","Hybrid","N/A - Raw Land"];
const OWNERSHIP_TYPES_OPP = ["Fee Simple","Ground Lease","Easement","Joint Venture","Other"];
const POC_RELATIONSHIPS = ["Owner","Broker","Developer","Agent","Other"];

const STAGE_COLORS: Record<string, string> = {
  "New Lead": "bg-blue-100 text-blue-700",
  "Under Review": "bg-purple-100 text-purple-700",
  "Site Visit Scheduled": "bg-indigo-100 text-indigo-700",
  "Due Diligence": "bg-amber-100 text-amber-700",
  "LOI Issued": "bg-orange-100 text-orange-700",
  "Contracted": "bg-green-100 text-green-700",
  "Closed": "bg-emerald-100 text-emerald-700",
  "Rejected": "bg-red-100 text-red-700",
};

const PRIORITY_COLORS: Record<string, string> = {
  High: "bg-red-100 text-red-700",
  Medium: "bg-yellow-100 text-yellow-700",
  Low: "bg-gray-100 text-gray-600",
};

function ownerInitials(name: string) {
  return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
}

function ownerColor(name: string) {
  const colors = ["bg-blue-500","bg-purple-500","bg-green-500","bg-amber-500","bg-rose-500","bg-indigo-500","bg-teal-500"];
  const idx = name.charCodeAt(0) % colors.length;
  return colors[idx];
}

interface OppTabProps {
  opportunities: ZenthiumOpportunity[];
  isLoadingOpp: boolean;
  onRefresh: () => void;
  showWizard: boolean;
  setShowWizard: (v: boolean) => void;
  editingOpp: ZenthiumOpportunity | null;
  setEditingOpp: (v: ZenthiumOpportunity | null) => void;
}

function OpportunitiesTab({ opportunities, isLoadingOpp, onRefresh, showWizard, setShowWizard, editingOpp, setEditingOpp }: OppTabProps) {
  const [search, setSearch] = useState("");
  const [stageFilter, setStageFilter] = useState("All");
  const [priorityFilter, setPriorityFilter] = useState("All");
  const [ownerFilter, setOwnerFilter] = useState("All");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [sendOpp, setSendOpp] = useState<ZenthiumOpportunity | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [sendTo, setSendTo] = useState("joshua@zenthium.ai");
  const [ccInput, setCcInput] = useState("");
  const [ccList, setCcList] = useState<string[]>([]);
  const [coverNote, setCoverNote] = useState("");

  const filtered = opportunities.filter((o) => {
    const q = search.toLowerCase();
    const matchSearch = !q || o.projectSiteName?.toLowerCase().includes(q) || o.siteAddress?.toLowerCase().includes(q) || o.dealOwnerName?.toLowerCase().includes(q) || o.dealName?.toLowerCase().includes(q) || o.developerCompanyName?.toLowerCase().includes(q);
    const matchStage = stageFilter === "All" || o.dealStage === stageFilter;
    const matchPriority = priorityFilter === "All" || o.priority === priorityFilter;
    const matchOwner = ownerFilter === "All" || o.dealOwnerName === ownerFilter;
    return matchSearch && matchStage && matchPriority && matchOwner;
  });

  const uniqueOwners = Array.from(new Set(opportunities.map((o) => o.dealOwnerName).filter(Boolean)));

  const totalMW = opportunities.reduce((s, o) => s + (parseFloat(o.existingCapacityMW) || 0), 0);
  const sentCount = opportunities.filter((o) => o.intakeSentAt).length;
  const activeCount = opportunities.filter((o) => !["Closed","Rejected"].includes(o.dealStage)).length;

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      const res = await fetch(`/api/zenthium/opportunities/${deleteId}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      toast.success("Opportunity deleted");
      onRefresh();
    } catch {
      toast.error("Failed to delete");
    } finally {
      setDeleteId(null);
    }
  };

  const handleAddCC = () => {
    const email = ccInput.trim();
    if (!email || ccList.includes(email)) return;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { toast.error("Invalid email"); return; }
    setCcList(prev => [...prev, email]);
    setCcInput("");
  };

  const handleSendIntake = async () => {
    if (!sendOpp) return;
    setIsSending(true);
    try {
      const res = await fetch(`/api/zenthium/opportunities/${sendOpp.id}/send-intake`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to: sendTo, cc: ccList, subject: `Powered Land Intake — ${sendOpp.projectSiteName || sendOpp.dealName}`, message: coverNote }),
      });
      if (!res.ok) throw new Error();
      toast.success(`Intake sent to ${sendTo}`);
      setSendOpp(null);
      setCcList([]);
      setCoverNote("");
      onRefresh();
    } catch {
      toast.error("Failed to send intake");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "Total Opportunities", value: opportunities.length, icon: Building2, color: "text-foreground" },
          { label: "Active Deals", value: activeCount, icon: Zap, color: "text-blue-600" },
          { label: "Intake Sent", value: sentCount, icon: Send, color: "text-green-600" },
          { label: "Total Power MW", value: totalMW > 0 ? `${totalMW.toFixed(0)} MW` : "—", icon: Zap, color: "text-amber-600" },
        ].map(({ label, value, icon: Icon, color }) => (
          <Card key={label}>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{label}</p>
                  <p className={cn("text-2xl font-bold", color)}>{value}</p>
                </div>
                <Icon className="h-8 w-8 text-muted-foreground/30" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-4 pb-4">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search property, owner, location..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
            </div>
            <Select value={stageFilter} onValueChange={setStageFilter}>
              <SelectTrigger className="w-[180px]"><SelectValue placeholder="All Stages" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Stages</SelectItem>
                {DEAL_STAGES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="w-[140px]"><SelectValue placeholder="Priority" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Priorities</SelectItem>
                {["High","Medium","Low"].map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={ownerFilter} onValueChange={setOwnerFilter}>
              <SelectTrigger className="w-[160px]"><SelectValue placeholder="Deal Owner" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Owners</SelectItem>
                {uniqueOwners.map((name) => <SelectItem key={name} value={name}>{name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Opportunities ({filtered.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoadingOpp ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Zap className="h-12 w-12 mx-auto mb-3 opacity-20" />
              <p className="font-medium">No opportunities yet</p>
              <p className="text-sm mt-1">Click <strong>New Opportunity</strong> to add a powered land deal.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Property</TableHead>
                  <TableHead>Power</TableHead>
                  <TableHead>Deal Owner</TableHead>
                  <TableHead>Stage</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Intake</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((o) => (
                  <TableRow key={o.id}>
                    <TableCell>
                      <div className="font-medium text-sm">{o.projectSiteName || o.dealName || "Unnamed"}</div>
                      <div className="text-xs text-muted-foreground">{o.siteAddress || "—"}</div>
                    </TableCell>
                    <TableCell className="text-sm">
                      {o.existingCapacityMW ? `${o.existingCapacityMW} MW` : "—"}
                    </TableCell>
                    <TableCell>
                      {o.dealOwnerName ? (
                        <div className="flex items-center gap-2">
                          <div className={cn("w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold", ownerColor(o.dealOwnerName))}>
                            {ownerInitials(o.dealOwnerName)}
                          </div>
                          <span className="text-sm">{o.dealOwnerName}</span>
                        </div>
                      ) : <span className="text-muted-foreground text-sm">Unassigned</span>}
                    </TableCell>
                    <TableCell>
                      <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium", STAGE_COLORS[o.dealStage] ?? "bg-gray-100 text-gray-600")}>
                        {o.dealStage}
                      </span>
                    </TableCell>
                    <TableCell>
                      {o.priority && (
                        <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium", PRIORITY_COLORS[o.priority] ?? "")}>
                          {o.priority}
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      {o.intakeSentAt ? (
                        <span className="text-xs text-green-600 flex items-center gap-1"><CheckCircle className="h-3 w-3" /> Sent</span>
                      ) : (
                        <span className="text-xs text-muted-foreground">Not sent</span>
                      )}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {o.createdAt ? new Date(o.createdAt).toLocaleDateString() : "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="sm" title="Edit" onClick={() => { setEditingOpp(o); setShowWizard(true); }}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" title="Send Intake" onClick={() => { setSendOpp(o); setSendTo("joshua@zenthium.ai"); setCcList([]); }}>
                          <Send className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => setDeleteId(o.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* ── Opportunity Wizard Dialog ──────────────────────────────────────────── */}
      <OppWizardDialog
        open={showWizard}
        onClose={() => { setShowWizard(false); setEditingOpp(null); }}
        editingOpp={editingOpp}
        onSaved={() => { setShowWizard(false); setEditingOpp(null); onRefresh(); }}
      />

      {/* ── Send Intake Dialog ────────────────────────────────────────────────── */}
      <Dialog open={!!sendOpp} onOpenChange={(open) => !open && setSendOpp(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Mail className="h-5 w-5 text-primary" /> Send Intake Form</DialogTitle>
            <DialogDescription>Send the completed Page 1 intake to joshua@zenthium.ai</DialogDescription>
          </DialogHeader>
          {sendOpp && (
            <div className="space-y-4">
              {/* Preview */}
              <div className="rounded-lg bg-muted p-3 text-xs font-mono space-y-1">
                <p className="font-semibold text-sm font-sans">{sendOpp.projectSiteName || sendOpp.dealName}</p>
                <p className="text-muted-foreground">{sendOpp.siteAddress || "—"} · {sendOpp.existingCapacityMW ? `${sendOpp.existingCapacityMW} MW` : "Power TBD"} · {sendOpp.dealStage}</p>
              </div>
              <div className="space-y-2">
                <Label>To</Label>
                <Input value={sendTo} onChange={(e) => setSendTo(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>CC (press Enter to add)</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="email@example.com"
                    value={ccInput}
                    onChange={(e) => setCcInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter" || e.key === ",") { e.preventDefault(); handleAddCC(); } }}
                  />
                  <Button variant="outline" size="sm" onClick={handleAddCC}>Add</Button>
                </div>
                {ccList.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {ccList.map((email) => (
                      <span key={email} className="flex items-center gap-1 bg-muted text-xs px-2 py-0.5 rounded-full">
                        {email}
                        <button onClick={() => setCcList(prev => prev.filter(e => e !== email))} className="text-muted-foreground hover:text-destructive"><X className="h-3 w-3" /></button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <Label>Cover Note (optional)</Label>
                <Textarea placeholder="Additional message to include in the email body..." value={coverNote} onChange={(e) => setCoverNote(e.target.value)} rows={3} />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setSendOpp(null)}>Cancel</Button>
            <Button onClick={handleSendIntake} disabled={isSending || !sendTo}>
              {isSending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />}
              Send Intake
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Delete Confirm Dialog ─────────────────────────────────────────────── */}
      <Dialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete Opportunity?</DialogTitle>
            <DialogDescription>This action cannot be undone.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete}><Trash2 className="h-4 w-4 mr-2" /> Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// OppWizardDialog — 7-step wizard matching Powered Land Developer Intake Form
// ─────────────────────────────────────────────────────────────────────────────

const OPP_STEPS = [
  { id: 1, title: "Deal Tracking", icon: Tag },
  { id: 2, title: "S0: Developer", icon: User },
  { id: 3, title: "S1: Power", icon: Zap },
  { id: 4, title: "S2: Fiber", icon: Building2 },
  { id: 5, title: "S3: Water", icon: Building2 },
  { id: 6, title: "S4: Property", icon: MapPin },
  { id: 7, title: "S5: Incentives", icon: Send },
];

interface OppWizardProps {
  open: boolean;
  onClose: () => void;
  editingOpp: ZenthiumOpportunity | null;
  onSaved: () => void;
}

function OppWizardDialog({ open, onClose, editingOpp, onSaved }: OppWizardProps) {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<OpportunityFormData>({ ...INITIAL_OPPORTUNITY });
  const [isSaving, setIsSaving] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [aiFilledFields, setAiFilledFields] = useState<Set<string>>(new Set());
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setStep(1);
      setAiFilledFields(new Set());
      if (editingOpp) {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { id, status, intakeSentAt, intakeSentTo, intakeSentCC, createdAt, updatedAt, ...rest } = editingOpp;
        setForm({ ...INITIAL_OPPORTUNITY, ...rest });
      } else {
        setForm({ ...INITIAL_OPPORTUNITY });
      }
    }
  }, [open, editingOpp]);

  const set = <K extends keyof OpportunityFormData>(field: K, value: OpportunityFormData[K]) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setAiFilledFields((prev) => { const next = new Set(prev); next.delete(field as string); return next; });
  };

  const handleDocumentUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsParsing(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/zenthium/opportunities/parse-document", { method: "POST", body: fd });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      const filled = new Set<string>();
      const updates: Partial<OpportunityFormData> = {};
      Object.entries(data.data).forEach(([k, v]) => {
        if (v !== "" && v !== null && v !== false && k in INITIAL_OPPORTUNITY) {
          (updates as Record<string, unknown>)[k] = v;
          filled.add(k);
        }
      });
      setForm((prev) => ({ ...prev, ...updates }));
      setAiFilledFields(filled);
      toast.success(`Document parsed — ${data.fieldsFound ?? filled.size} fields populated`);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to parse document");
    } finally {
      setIsParsing(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      let id = editingOpp?.id;
      if (id) {
        await fetch(`/api/zenthium/opportunities/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...form, status: "active" }),
        });
      } else {
        const res = await fetch("/api/zenthium/opportunities", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...form, status: "active" }),
        });
        const data = await res.json();
        id = data.id;
      }
      toast.success(editingOpp ? "Opportunity updated" : "Opportunity created");
      onSaved();
    } catch {
      toast.error("Failed to save opportunity");
    } finally {
      setIsSaving(false);
    }
  };

  const canProceed = () => {
    if (step === 1) return !!form.dealName && !!form.dealOwnerName;
    if (step === 2) return !!form.developerCompanyName && !!form.primaryContactName;
    return true;
  };

  const aiFill = (field: string) => aiFilledFields.has(field) ? "ring-1 ring-amber-400 bg-amber-50" : "";

  const YNASelect = ({ field, label }: { field: keyof OpportunityFormData; label: string }) => (
    <div className="space-y-1">
      <Label>{label}</Label>
      <Select value={(form[field] as string) || ""} onValueChange={(v) => set(field, v as OpportunityFormData[typeof field])}>
        <SelectTrigger className="w-full"><SelectValue placeholder="Select" /></SelectTrigger>
        <SelectContent>
          {["Yes", "No", "N/A"].map((v) => <SelectItem key={v} value={v}>{v}</SelectItem>)}
        </SelectContent>
      </Select>
    </div>
  );

  // Step 1 — Internal deal tracking (not on spreadsheet)
  const renderStep1 = () => (
    <div className="space-y-4">
      <p className="text-xs text-muted-foreground bg-muted rounded px-3 py-2">Internal tracking fields — not part of the developer intake form.</p>
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2 space-y-1">
          <Label>Internal Deal Name <span className="text-destructive">*</span></Label>
          <Input className={aiFill("dealName")} value={form.dealName} onChange={(e) => set("dealName", e.target.value)} placeholder="e.g. Mishawaka IN Powered Land" />
        </div>
        <div className="space-y-1">
          <Label>Deal Owner <span className="text-destructive">*</span></Label>
          <Input className={aiFill("dealOwnerName")} value={form.dealOwnerName} onChange={(e) => { set("dealOwnerName", e.target.value); set("dealOwnerId", e.target.value); }} placeholder="Person who brought the deal" />
        </div>
        <div className="space-y-1">
          <Label>Owner Email</Label>
          <Input type="email" value={form.dealOwnerEmail} onChange={(e) => set("dealOwnerEmail", e.target.value)} placeholder="owner@example.com" />
        </div>
        <div className="space-y-1">
          <Label>Deal Stage</Label>
          <Select value={form.dealStage} onValueChange={(v) => set("dealStage", v as OpportunityFormData["dealStage"])}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{DEAL_STAGES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label>Priority</Label>
          <Select value={form.priority || ""} onValueChange={(v) => set("priority", v as OpportunityFormData["priority"])}>
            <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
            <SelectContent>{["High","Medium","Low"].map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label>Referral Source</Label>
          <Input value={form.referralSource} onChange={(e) => set("referralSource", e.target.value)} placeholder="LinkedIn, Broker, Direct..." />
        </div>
        <div className="col-span-2 space-y-1">
          <Label>Internal Notes</Label>
          <Textarea value={form.internalNotes} onChange={(e) => set("internalNotes", e.target.value)} rows={3} placeholder="Private deal context..." />
        </div>
      </div>
    </div>
  );

  // Step 2 — S0: Developer / Submitter Information
  const renderStep2 = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2 space-y-1">
          <Label>Developer / Company Name <span className="text-destructive">*</span></Label>
          <Input className={aiFill("developerCompanyName")} value={form.developerCompanyName} onChange={(e) => set("developerCompanyName", e.target.value)} placeholder="Acme Land Development LLC" />
        </div>
        <div className="space-y-1">
          <Label>Primary Contact Name <span className="text-destructive">*</span></Label>
          <Input className={aiFill("primaryContactName")} value={form.primaryContactName} onChange={(e) => set("primaryContactName", e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label>Title / Role</Label>
          <Input className={aiFill("titleRole")} value={form.titleRole} onChange={(e) => set("titleRole", e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label>Email Address</Label>
          <Input type="email" className={aiFill("emailAddress")} value={form.emailAddress} onChange={(e) => set("emailAddress", e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label>Phone Number</Label>
          <Input type="tel" className={aiFill("phoneNumber")} value={form.phoneNumber} onChange={(e) => set("phoneNumber", e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label>Date of Submission</Label>
          <Input type="date" value={form.dateOfSubmission} onChange={(e) => set("dateOfSubmission", e.target.value)} />
        </div>
        <div className="col-span-2 space-y-1">
          <Label>Project Site Name</Label>
          <Input className={aiFill("projectSiteName")} value={form.projectSiteName} onChange={(e) => set("projectSiteName", e.target.value)} placeholder="e.g. Mishawaka Greenfield Site" />
        </div>
      </div>
    </div>
  );

  // Step 3 — S1: Power / Utility Infrastructure
  const renderStep3 = () => (
    <div className="space-y-4">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Power / Electrical</p>
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2 space-y-1">
          <Label>Overview of Existing Infrastructure</Label>
          <Textarea className={aiFill("overviewExistingInfrastructure")} value={form.overviewExistingInfrastructure} onChange={(e) => set("overviewExistingInfrastructure", e.target.value)} rows={2} placeholder="Substation, nearby transmission lines, etc." />
        </div>
        <div className="space-y-1">
          <Label>Utility Company / Power Provider</Label>
          <Input className={aiFill("utilityCompanyPowerProvider")} value={form.utilityCompanyPowerProvider} onChange={(e) => set("utilityCompanyPowerProvider", e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label>Power Generation Source</Label>
          <Input className={aiFill("powerGenerationSource")} value={form.powerGenerationSource} onChange={(e) => set("powerGenerationSource", e.target.value)} placeholder="Solar, Wind, Nuclear, Gas..." />
        </div>
        <div className="col-span-2 space-y-1">
          <Label>Power Studies (LOA, SIS, Feasibility, etc.)</Label>
          <Textarea className={aiFill("powerStudies")} value={form.powerStudies} onChange={(e) => set("powerStudies", e.target.value)} rows={2} placeholder="All documentation with utility providers on power delivery" />
        </div>
        <YNASelect field="powerStudiesFilesAvailable" label="Power Studies Files Available?" />
        <div className="space-y-1">
          <Label>Existing Capacity (MW)</Label>
          <Input className={aiFill("existingCapacityMW")} value={form.existingCapacityMW} onChange={(e) => set("existingCapacityMW", e.target.value)} />
        </div>
        <YNASelect field="existingCapacityFilesAvailable" label="Existing Capacity Files Available?" />
        <div className="col-span-2 space-y-1">
          <Label>Maximum Capacity Available (MW) / Upgrades Required</Label>
          <Textarea className={aiFill("maximumCapacityMW")} value={form.maximumCapacityMW} onChange={(e) => set("maximumCapacityMW", e.target.value)} rows={2} />
        </div>
        <YNASelect field="maximumCapacityFilesAvailable" label="Max Capacity Files Available?" />
        <div className="col-span-2 space-y-1">
          <Label>Delivery Timelines / Ramp Schedule</Label>
          <Textarea className={aiFill("deliveryTimelines")} value={form.deliveryTimelines} onChange={(e) => set("deliveryTimelines", e.target.value)} rows={2} />
        </div>
        <YNASelect field="deliveryTimelinesFilesAvailable" label="Delivery Timeline Files Available?" />
        <div className="space-y-1">
          <Label>Cost of Power – Effective $/kWh</Label>
          <Input className={aiFill("costOfPowerPerKwh")} value={form.costOfPowerPerKwh} onChange={(e) => set("costOfPowerPerKwh", e.target.value)} placeholder="0.00" />
        </div>
        <YNASelect field="costOfPowerFilesAvailable" label="Cost of Power Files Available?" />
        <YNASelect field="powerGenerationFilesAvailable" label="Power Generation Files Available?" />
      </div>
      <Separator />
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Natural Gas</p>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label>Natural Gas Provider</Label>
          <Input className={aiFill("naturalGasProvider")} value={form.naturalGasProvider} onChange={(e) => set("naturalGasProvider", e.target.value)} />
        </div>
        <div className="col-span-2 space-y-1">
          <Label>3rd Parties Involved in Delivering Gas to Site</Label>
          <Input className={aiFill("naturalGasThirdParties")} value={form.naturalGasThirdParties} onChange={(e) => set("naturalGasThirdParties", e.target.value)} placeholder="Infrastructure buildout, etc." />
        </div>
        <div className="space-y-1">
          <Label>Transmission Pipeline Size / PSI</Label>
          <Input className={aiFill("transmissionPipelineSizePSI")} value={form.transmissionPipelineSizePSI} onChange={(e) => set("transmissionPipelineSizePSI", e.target.value)} />
        </div>
      </div>
    </div>
  );

  // Step 4 — S2: Fiber / Connectivity
  const renderStep4 = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2 space-y-1">
          <Label>Agreements Currently in Place (provider, capacity)</Label>
          <Textarea className={aiFill("fiberAgreementsInPlace")} value={form.fiberAgreementsInPlace} onChange={(e) => set("fiberAgreementsInPlace", e.target.value)} rows={2} />
        </div>
        <YNASelect field="fiberAgreementsFilesAvailable" label="Fiber Agreement Files Available?" />
        <div className="col-span-2 space-y-1">
          <Label>Overview of Fiber Providers in Proximity to the Site</Label>
          <Textarea className={aiFill("fiberProvidersProximity")} value={form.fiberProvidersProximity} onChange={(e) => set("fiberProvidersProximity", e.target.value)} rows={2} />
        </div>
        <YNASelect field="fiberProvidersFilesAvailable" label="Fiber Provider Files Available?" />
        <div className="col-span-2 space-y-1">
          <Label>Update on Discussions with Fiber Providers to Run Fiber to Site</Label>
          <Textarea className={aiFill("fiberProviderDiscussions")} value={form.fiberProviderDiscussions} onChange={(e) => set("fiberProviderDiscussions", e.target.value)} rows={2} />
        </div>
        <YNASelect field="fiberMapsAvailable" label="Fiber Maps Available?" />
      </div>
    </div>
  );

  // Step 5 — S3: Water & Sewer
  const renderStep5 = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2 space-y-1">
          <Label>Water and Sewer Service Agreements</Label>
          <Textarea className={aiFill("waterSewerServiceAgreements")} value={form.waterSewerServiceAgreements} onChange={(e) => set("waterSewerServiceAgreements", e.target.value)} rows={2} />
        </div>
        <YNASelect field="waterSewerAgreementsFilesAvailable" label="W&S Agreement Files Available?" />
        <div className="col-span-2 space-y-1">
          <Label>Water & Sewer Main Info (size, location, providers, etc.)</Label>
          <Textarea className={aiFill("waterSewerMainInfo")} value={form.waterSewerMainInfo} onChange={(e) => set("waterSewerMainInfo", e.target.value)} rows={2} />
        </div>
        <YNASelect field="waterSewerMainFilesAvailable" label="W&S Main Files Available?" />
        <div className="col-span-2 space-y-1">
          <Label>Planned / Required Water Upgrades</Label>
          <Textarea className={aiFill("plannedWaterUpgrades")} value={form.plannedWaterUpgrades} onChange={(e) => set("plannedWaterUpgrades", e.target.value)} rows={2} />
        </div>
        <YNASelect field="plannedWaterFilesAvailable" label="Water Upgrade Files Available?" />
        <div className="col-span-2 space-y-1">
          <Label>Hydrological Studies / Drainage Reports</Label>
          <Textarea className={aiFill("hydrologicalStudies")} value={form.hydrologicalStudies} onChange={(e) => set("hydrologicalStudies", e.target.value)} rows={2} />
        </div>
        <YNASelect field="hydrologicalFilesAvailable" label="Hydrological Files Available?" />
      </div>
    </div>
  );

  // Step 6 — S4: Property Information
  const renderStep6 = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2 space-y-1">
          <Label>Site Address</Label>
          <Input className={aiFill("siteAddress")} value={form.siteAddress} onChange={(e) => set("siteAddress", e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label>Site Coordinates (Lat / Long)</Label>
          <Input className={aiFill("siteCoordinates")} value={form.siteCoordinates} onChange={(e) => set("siteCoordinates", e.target.value)} placeholder="30.2672, -97.7431" />
        </div>
        <YNASelect field="siteCoordinatesFilesAvailable" label="Coordinates Files Available?" />
        <YNASelect field="siteMapAvailable" label="Site Map Available?" />
        <YNASelect field="sitePhotosAvailable" label="Site Photos / Plan Photos Available?" />
        <div className="col-span-2 space-y-1">
          <Label>Total Acreage and Developable Acreage</Label>
          <Input className={aiFill("totalAcreageDevelopable")} value={form.totalAcreageDevelopable} onChange={(e) => set("totalAcreageDevelopable", e.target.value)} placeholder="e.g. 150 total / 120 developable" />
        </div>
        <YNASelect field="totalAcreageFilesAvailable" label="Acreage Files Available?" />
        <div className="col-span-2 space-y-1">
          <Label>Existing Easements</Label>
          <Textarea className={aiFill("existingEasements")} value={form.existingEasements} onChange={(e) => set("existingEasements", e.target.value)} rows={2} />
        </div>
        <YNASelect field="existingEasementsFilesAvailable" label="Easement Files Available?" />
        <div className="col-span-2 space-y-1">
          <Label>Third Party Reports (Phase 1, Geotech, Wetlands, Flood Plain, Drainage, Groundwater)</Label>
          <Textarea className={aiFill("thirdPartyReports")} value={form.thirdPartyReports} onChange={(e) => set("thirdPartyReports", e.target.value)} rows={2} />
        </div>
        <YNASelect field="thirdPartyReportsFilesAvailable" label="Third Party Report Files Available?" />
        <YNASelect field="topographicalMapsAvailable" label="Topographical Maps Available?" />
        <YNASelect field="altaSurveyAvailable" label="ALTA Survey Available?" />
        <div className="col-span-2 space-y-1">
          <Label>Proximity to Rail and Airports</Label>
          <Input className={aiFill("proximityRailAirports")} value={form.proximityRailAirports} onChange={(e) => set("proximityRailAirports", e.target.value)} />
        </div>
        <YNASelect field="proximityRailFilesAvailable" label="Rail/Airport Files Available?" />
        <div className="col-span-2 space-y-1">
          <Label>Zoning, Permitting & Entitlements for Data Center Usage</Label>
          <Textarea className={aiFill("zoningPermittingEntitlements")} value={form.zoningPermittingEntitlements} onChange={(e) => set("zoningPermittingEntitlements", e.target.value)} rows={2} placeholder="Designation, Work Completed, Parking, Land Covenants, Setbacks, Height Restrictions" />
        </div>
        <YNASelect field="zoningFilesAvailable" label="Zoning Files Available?" />
      </div>
    </div>
  );

  // Step 7 — S5: Project Incentives
  const renderStep7 = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2 space-y-1">
          <Label>In-place Incentives</Label>
          <Textarea className={aiFill("inPlaceIncentives")} value={form.inPlaceIncentives} onChange={(e) => set("inPlaceIncentives", e.target.value)} rows={2} />
        </div>
        <YNASelect field="inPlaceIncentivesFilesAvailable" label="In-place Incentive Files Available?" />
        <div className="col-span-2 space-y-1">
          <Label>Sales Tax Exemption on Equipment</Label>
          <Textarea className={aiFill("salesTaxExemption")} value={form.salesTaxExemption} onChange={(e) => set("salesTaxExemption", e.target.value)} rows={2} />
        </div>
        <YNASelect field="salesTaxFilesAvailable" label="Sales Tax Files Available?" />
        <div className="col-span-2 space-y-1">
          <Label>Property Tax Abatements</Label>
          <Textarea className={aiFill("propertyTaxAbatements")} value={form.propertyTaxAbatements} onChange={(e) => set("propertyTaxAbatements", e.target.value)} rows={2} />
        </div>
        <YNASelect field="propertyTaxFilesAvailable" label="Property Tax Files Available?" />
        <div className="col-span-2 space-y-1">
          <Label>Local, State and National Government Support</Label>
          <Textarea className={aiFill("governmentSupport")} value={form.governmentSupport} onChange={(e) => set("governmentSupport", e.target.value)} rows={2} placeholder="Beyond publicly available information" />
        </div>
        <YNASelect field="governmentSupportFilesAvailable" label="Gov Support Files Available?" />
        <div className="col-span-2 space-y-1">
          <Label>Timelines to Receiving Incentives and Impact on Project Timelines</Label>
          <Textarea className={aiFill("incentiveTimelines")} value={form.incentiveTimelines} onChange={(e) => set("incentiveTimelines", e.target.value)} rows={2} />
        </div>
        <YNASelect field="incentiveTimelinesFilesAvailable" label="Incentive Timeline Files Available?" />
      </div>
      <Separator />
      <div className="rounded-lg border bg-muted p-4 text-xs space-y-1 font-mono max-h-40 overflow-y-auto">
        <p className="font-bold text-sm font-sans mb-2">Summary Preview</p>
        <p>Deal: {form.dealName || "—"} | Stage: {form.dealStage} | Priority: {form.priority || "—"}</p>
        <p>Developer: {form.developerCompanyName || "—"} | Contact: {form.primaryContactName || "—"}</p>
        <p>Site: {form.projectSiteName || "—"} | Address: {form.siteAddress || "—"}</p>
        <p>Existing Capacity: {form.existingCapacityMW || "—"} MW | Max: {form.maximumCapacityMW || "—"} MW</p>
        <p>Utility: {form.utilityCompanyPowerProvider || "—"} | Source: {form.powerGenerationSource || "—"}</p>
      </div>
    </div>
  );

  const stepRenders = [renderStep1, renderStep2, renderStep3, renderStep4, renderStep5, renderStep6, renderStep7];

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-2xl max-h-[92vh] flex flex-col">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-primary" />
              {editingOpp ? "Edit Opportunity" : "New Powered Land Opportunity"}
            </DialogTitle>
            {/* Document upload button */}
            <div>
              <input ref={fileInputRef} type="file" accept=".pdf,.doc,.docx" className="hidden" onChange={handleDocumentUpload} />
              <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} disabled={isParsing}>
                {isParsing ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Sparkles className="h-4 w-4 mr-1" />}
                {isParsing ? "Parsing..." : "Import from Doc"}
              </Button>
            </div>
          </div>
          {aiFilledFields.size > 0 && (
            <p className="text-xs text-amber-600 flex items-center gap-1 mt-1">
              <Sparkles className="h-3 w-3" /> {aiFilledFields.size} fields auto-filled from document — review and confirm
            </p>
          )}
        </DialogHeader>

        {/* Step progress */}
        <div className="space-y-2">
          <Progress value={(step / OPP_STEPS.length) * 100} className="h-1.5" />
          <div className="flex justify-between">
            {OPP_STEPS.map((s) => {
              const Icon = s.icon;
              const done = step > s.id;
              const active = step === s.id;
              return (
                <div key={s.id} className={cn("flex items-center gap-1 text-xs cursor-pointer", active ? "text-primary font-medium" : done ? "text-green-600" : "text-muted-foreground")} onClick={() => done && setStep(s.id)}>
                  <div className={cn("w-5 h-5 rounded-full flex items-center justify-center border", active ? "border-primary bg-primary text-white" : done ? "border-green-600 bg-green-600 text-white" : "border-muted-foreground/30")}>
                    {done ? <Check className="h-3 w-3" /> : <Icon className="h-3 w-3" />}
                  </div>
                  <span className="hidden sm:inline">{s.title}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Step content */}
        <div className="flex-1 overflow-y-auto py-2">
          {stepRenders[step - 1]?.()}
        </div>

        {/* Footer */}
        <DialogFooter className="flex items-center gap-2 pt-4 border-t">
          <Button variant="outline" onClick={() => step === 1 ? onClose() : setStep(s => s - 1)} disabled={isSaving}>
            <ChevronLeft className="h-4 w-4 mr-1" />
            {step === 1 ? "Cancel" : "Back"}
          </Button>
          <div className="flex-1" />
          <Button variant="outline" onClick={() => handleSave()} disabled={isSaving}>
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <FileText className="h-4 w-4 mr-2" />}
            Save Draft
          </Button>
          {step < OPP_STEPS.length ? (
            <Button onClick={() => setStep(s => s + 1)} disabled={!canProceed()}>
              Next <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          ) : (
            <Button onClick={() => handleSave()} disabled={isSaving || !form.dealName}>
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CheckCircle className="h-4 w-4 mr-2" />}
              Save Opportunity
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
