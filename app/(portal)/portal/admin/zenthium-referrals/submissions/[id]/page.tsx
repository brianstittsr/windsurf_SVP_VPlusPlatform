"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  MapPin,
  Zap,
  Network,
  Droplets,
  User,
  Building2,
  Mail,
  Phone,
  Loader2,
  ArrowLeft,
  Save,
  Trash2,
  Edit,
  Calendar,
  FileText,
  ExternalLink,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const PROPERTY_TYPE_OPTIONS = [
  { value: "vacant_land", label: "Vacant / Greenfield Land" },
  { value: "warehouse", label: "Vacant Warehouse" },
  { value: "industrial", label: "Industrial Building" },
  { value: "office", label: "Office / Commercial" },
  { value: "data_center", label: "Existing Data Center" },
  { value: "power_plant", label: "Power Plant / Energy Facility" },
  { value: "other", label: "Other" },
];

const POWER_TYPE_OPTIONS = [
  { value: "grid", label: "Grid-Connected" },
  { value: "behind_meter", label: "Behind-the-Meter" },
  { value: "renewable", label: "Renewable" },
  { value: "combined", label: "Combined / Hybrid" },
  { value: "unknown", label: "Unknown / TBD" },
];

const OWNERSHIP_OPTIONS = [
  { value: "own", label: "Owner outright" },
  { value: "lease", label: "Holds lease / master lease" },
  { value: "option", label: "Holds purchase option" },
  { value: "other", label: "Other / Broker / Rep" },
];

const ENVIRONMENTAL_OPTIONS = [
  { value: "clean", label: "Clean" },
  { value: "phase1_done", label: "Phase I — Clean" },
  { value: "phase2_done", label: "Phase II — Remediated" },
  { value: "unknown", label: "Unknown" },
  { value: "issues", label: "Known Issues" },
];

const STATUS_OPTIONS = [
  "Submitted",
  "Under Review",
  "Approved",
  "Rejected",
  "Archived",
];

interface Submission {
  id: string;
  title: string;
  submitterName: string;
  submitterEmail: string;
  submitterPhone: string;
  submitterCompany: string;
  propertyName: string;
  propertyType: string;
  propertyTypeOther: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  coordinates: string;
  parcelNumber: string;
  squareFootage?: number;
  acreage?: number;
  zoningClassification: string;
  isSingleStory: boolean;
  isFloor: boolean;
  floodZone: boolean;
  powerAvailableMW?: number;
  powerType: string;
  hasBackupPower: boolean;
  ceilingHeightFt?: number;
  fiberAvailable: boolean;
  fiberProviders: string;
  waterAvailable: boolean;
  waterSource: string;
  coolingCapacity: string;
  hvacInstalled: boolean;
  ownershipType: string;
  askingPrice: string;
  leaseRate: string;
  timeline: string;
  environmentalClearance: string;
  additionalNotes: string;
  directContactName: string;
  directContactCompany: string;
  directContactEmail: string;
  directContactPhone: string;
  status: string;
  adminNotes: string;
  createdAt: string;
  updatedAt: string;
}

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function SubmissionDetailPage({ params }: PageProps) {
  const router = useRouter();
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [form, setForm] = useState<Submission | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [letterheadDialogOpen, setLetterheadDialogOpen] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [id, setId] = useState<string>("");
  const [letterheadData, setLetterheadData] = useState({
    recipientEmail: "",
    recipientName: "",
    recipientCompany: "",
    message: "",
  });
  const [isGeneratingLetterhead, setIsGeneratingLetterhead] = useState(false);

  useEffect(() => {
    params.then(({ id }) => {
      setId(id);
    });
  }, [params]);

  useEffect(() => {
    if (!id) return;
    
    const fetchSubmission = async () => {
      try {
        const res = await fetch(`/api/zenthium/location-submissions/${id}`);
        if (!res.ok) throw new Error("Failed to fetch");
        const data = await res.json();
        setSubmission(data.submission);
        setForm(data.submission);
      } catch (error) {
        console.error("Fetch error:", error);
        toast.error("Failed to load submission");
      } finally {
        setIsLoading(false);
      }
    };
    fetchSubmission();
  }, [id]);

  const setField = <K extends keyof Submission>(field: K, value: Submission[K]) => {
    if (!form) return;
    setForm((prev) => {
      if (!prev) return prev;
      const updated = { ...prev, [field]: value };
      setHasChanges(JSON.stringify(updated) !== JSON.stringify(submission));
      return updated;
    });
  };

  const handleSave = async () => {
    if (!form || !id) return;
    setIsSaving(true);

    try {
      // Convert string numbers to actual numbers for the API
      const updateData = {
        ...form,
        squareFootage: form.squareFootage ? Number(form.squareFootage) : undefined,
        acreage: form.acreage ? Number(form.acreage) : undefined,
        powerAvailableMW: form.powerAvailableMW ? Number(form.powerAvailableMW) : undefined,
        ceilingHeightFt: form.ceilingHeightFt ? Number(form.ceilingHeightFt) : undefined,
      };

      const res = await fetch(`/api/zenthium/location-submissions/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updateData),
      });

      if (!res.ok) throw new Error("Failed to save");

      setSubmission(form);
      setHasChanges(false);
      toast.success("Submission updated successfully");
    } catch (error) {
      console.error("Save error:", error);
      toast.error("Failed to save changes");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!id) return;
    setIsDeleting(true);

    try {
      const res = await fetch(`/api/zenthium/location-submissions/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Failed to delete");

      toast.success("Submission deleted");
      router.push("/portal/admin/zenthium-referrals");
    } catch (error) {
      console.error("Delete error:", error);
      toast.error("Failed to delete submission");
      setIsDeleting(false);
      setDeleteDialogOpen(false);
    }
  };

  const handleGenerateLetterhead = async () => {
    if (!id || !letterheadData.recipientEmail) {
      toast.error("Recipient email is required");
      return;
    }

    setIsGeneratingLetterhead(true);

    try {
      const res = await fetch("/api/zenthium/generate-letterhead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          submissionId: id,
          recipientEmail: letterheadData.recipientEmail,
          recipientName: letterheadData.recipientName,
          recipientCompany: letterheadData.recipientCompany,
          message: letterheadData.message,
        }),
      });

      if (!res.ok) throw new Error("Failed to generate letterhead");

      const data = await res.json();
      
      // Download the PDF
      const link = document.createElement("a");
      link.href = `data:application/pdf;base64,${data.pdfBase64}`;
      link.download = data.filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success("Letterhead generated and downloaded");
      setLetterheadDialogOpen(false);
      
      // Reset form
      setLetterheadData({
        recipientEmail: "",
        recipientName: "",
        recipientCompany: "",
        message: "",
      });
    } catch (error) {
      console.error("Letterhead generation error:", error);
      toast.error("Failed to generate letterhead");
    } finally {
      setIsGeneratingLetterhead(false);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "—";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (isLoading || !form) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/portal/admin/zenthium-referrals">
                <ArrowLeft className="h-4 w-4 mr-1" />
                Back
              </Link>
            </Button>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Edit Submission</h1>
              <p className="text-muted-foreground text-sm">
                Submitted {formatDate(form.createdAt)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {hasChanges && (
              <Badge variant="outline" className="text-amber-600 border-amber-600">
                Unsaved Changes
              </Badge>
            )}
            <Button
              variant="outline"
              size="sm"
              asChild
            >
              <Link href={`/zenthium/dashboard?id=${id}`} target="_blank">
                <ExternalLink className="h-4 w-4 mr-1" />
                View Dashboard
              </Link>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setLetterheadDialogOpen(true)}
            >
              <FileText className="h-4 w-4 mr-1" />
              Generate Letterhead
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDeleteDialogOpen(true)}
              className="text-red-600 hover:text-red-700"
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Delete
            </Button>
            <Button
              size="sm"
              onClick={handleSave}
              disabled={isSaving || !hasChanges}
            >
              {isSaving ? (
                <><Loader2 className="h-4 w-4 mr-1 animate-spin" /> Saving...</>
              ) : (
                <><Save className="h-4 w-4 mr-1" /> Save Changes</>
              )}
            </Button>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Form Fields */}
          <div className="lg:col-span-2 space-y-6">
            {/* Step 1: Site Information */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold">
                      1
                    </span>
                    Site Information
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Referral Title */}
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground uppercase tracking-wide">
                    Referral Title <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    value={form.title}
                    onChange={(e) => setField("title", e.target.value)}
                    placeholder="125-Acre Industrial Site — Phoenix, AZ"
                  />
                </div>

                {/* Property Name */}
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground uppercase tracking-wide">
                    Property Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    value={form.propertyName}
                    onChange={(e) => setField("propertyName", e.target.value)}
                    placeholder="Desert Ridge Industrial Park"
                  />
                </div>

                {/* Street Address */}
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground uppercase tracking-wide">
                    Street Address
                  </Label>
                  <Input
                    value={form.address}
                    onChange={(e) => setField("address", e.target.value)}
                    placeholder="1234 Industrial Blvd"
                  />
                </div>

                {/* City, State, ZIP */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground uppercase tracking-wide">
                      City <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      value={form.city}
                      onChange={(e) => setField("city", e.target.value)}
                      placeholder="Phoenix"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground uppercase tracking-wide">
                      State <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      value={form.state}
                      onChange={(e) => setField("state", e.target.value)}
                      placeholder="AZ"
                      maxLength={2}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground uppercase tracking-wide">
                      ZIP Code
                    </Label>
                    <Input
                      value={form.zip}
                      onChange={(e) => setField("zip", e.target.value)}
                      placeholder="85001"
                    />
                  </div>
                </div>

                {/* Country, Coordinates, Parcel Number */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground uppercase tracking-wide">
                      Country
                    </Label>
                    <Input
                      value={form.country}
                      onChange={(e) => setField("country", e.target.value)}
                      placeholder="US"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground uppercase tracking-wide">
                      Coordinates (lat,lng)
                    </Label>
                    <Input
                      value={form.coordinates}
                      onChange={(e) => setField("coordinates", e.target.value)}
                      placeholder="33.4484,-112.0740"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground uppercase tracking-wide">
                      Parcel Number
                    </Label>
                    <Input
                      value={form.parcelNumber}
                      onChange={(e) => setField("parcelNumber", e.target.value)}
                      placeholder="123-45-678"
                    />
                  </div>
                </div>

                {/* Acreage, Square Footage */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground uppercase tracking-wide">
                      Acreage
                    </Label>
                    <Input
                      type="number"
                      value={form.acreage || ""}
                      onChange={(e) => setField("acreage", e.target.value ? Number(e.target.value) : undefined)}
                      placeholder="125"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground uppercase tracking-wide">
                      Square Footage
                    </Label>
                    <Input
                      type="number"
                      value={form.squareFootage || ""}
                      onChange={(e) => setField("squareFootage", e.target.value ? Number(e.target.value) : undefined)}
                      placeholder="500000"
                    />
                  </div>
                </div>

                {/* Description */}
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground uppercase tracking-wide">
                    Description <span className="text-red-500">*</span>
                  </Label>
                  <Textarea
                    value={form.additionalNotes}
                    onChange={(e) => setField("additionalNotes", e.target.value)}
                    placeholder="Describe the property and its data center potential..."
                    rows={4}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Step 2: Infrastructure */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold">
                    2
                  </span>
                  Infrastructure
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground uppercase tracking-wide">
                      Power (MW)
                    </Label>
                    <Input
                      type="number"
                      value={form.powerAvailableMW || ""}
                      onChange={(e) => setField("powerAvailableMW", e.target.value ? Number(e.target.value) : undefined)}
                      placeholder="100"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground uppercase tracking-wide">
                      Power Type
                    </Label>
                    <Select value={form.powerType} onValueChange={(v) => setField("powerType", v)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select power type..." />
                      </SelectTrigger>
                      <SelectContent>
                        {POWER_TYPE_OPTIONS.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground uppercase tracking-wide">
                      Ceiling Height (ft)
                    </Label>
                    <Input
                      type="number"
                      value={form.ceilingHeightFt || ""}
                      onChange={(e) => setField("ceilingHeightFt", e.target.value ? Number(e.target.value) : undefined)}
                      placeholder="24"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground uppercase tracking-wide">
                      Environmental Status
                    </Label>
                    <Select value={form.environmentalClearance} onValueChange={(v) => setField("environmentalClearance", v)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select status..." />
                      </SelectTrigger>
                      <SelectContent>
                        {ENVIRONMENTAL_OPTIONS.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Separator />

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground uppercase tracking-wide flex items-center gap-1">
                      <Network className="h-3.5 w-3.5" />
                      Fiber Providers
                    </Label>
                    <Input
                      value={form.fiberProviders}
                      onChange={(e) => setField("fiberProviders", e.target.value)}
                      placeholder="AT&T, Lumen, Zayo..."
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground uppercase tracking-wide flex items-center gap-1">
                      <Droplets className="h-3.5 w-3.5" />
                      Water Source
                    </Label>
                    <Input
                      value={form.waterSource}
                      onChange={(e) => setField("waterSource", e.target.value)}
                      placeholder="Municipal, well..."
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground uppercase tracking-wide">
                    Cooling Capacity
                  </Label>
                  <Input
                    value={form.coolingCapacity}
                    onChange={(e) => setField("coolingCapacity", e.target.value)}
                    placeholder="System type or capacity"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4 pt-2">
                  {[
                    { id: "backup-power", field: "hasBackupPower" as const, label: "Backup / redundant power available" },
                    { id: "fiber-avail", field: "fiberAvailable" as const, label: "Fiber connectivity on site" },
                    { id: "water-avail", field: "waterAvailable" as const, label: "Water access available" },
                    { id: "hvac", field: "hvacInstalled" as const, label: "HVAC / cooling installed" },
                  ].map(({ id, field, label }) => (
                    <div key={id} className="flex items-center gap-3">
                      <Checkbox
                        id={id}
                        checked={form[field]}
                        onCheckedChange={(v) => setField(field, !!v)}
                      />
                      <Label htmlFor={id} className="cursor-pointer text-sm">
                        {label}
                      </Label>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Step 3: Ownership & Pricing */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold">
                    3
                  </span>
                  Ownership & Pricing
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground uppercase tracking-wide">
                    Ownership Type
                  </Label>
                  <Select value={form.ownershipType} onValueChange={(v) => setField("ownershipType", v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select ownership type..." />
                    </SelectTrigger>
                    <SelectContent>
                      {OWNERSHIP_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground uppercase tracking-wide">
                      Asking / Sale Price
                    </Label>
                    <Input
                      value={form.askingPrice}
                      onChange={(e) => setField("askingPrice", e.target.value)}
                      placeholder="e.g., $5,000,000"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground uppercase tracking-wide">
                      Lease Rate
                    </Label>
                    <Input
                      value={form.leaseRate}
                      onChange={(e) => setField("leaseRate", e.target.value)}
                      placeholder="e.g., $12/sq ft/year"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground uppercase tracking-wide">
                    Timeline
                  </Label>
                  <Input
                    value={form.timeline}
                    onChange={(e) => setField("timeline", e.target.value)}
                    placeholder="e.g., Ready now, Q4 2024, etc."
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Sidebar */}
          <div className="space-y-6">
            {/* Step 4: Contacts */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold">
                    4
                  </span>
                  Contacts
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Submitter Information */}
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Submitter Information
                  </h4>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground uppercase tracking-wide">
                      Full Name
                    </Label>
                    <Input
                      value={form.submitterName}
                      onChange={(e) => setField("submitterName", e.target.value)}
                      placeholder="Full name"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground uppercase tracking-wide">
                      Company
                    </Label>
                    <Input
                      value={form.submitterCompany}
                      onChange={(e) => setField("submitterCompany", e.target.value)}
                      placeholder="Company"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground uppercase tracking-wide">
                      Email
                    </Label>
                    <Input
                      type="email"
                      value={form.submitterEmail}
                      onChange={(e) => setField("submitterEmail", e.target.value)}
                      placeholder="email@company.com"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground uppercase tracking-wide">
                      Phone
                    </Label>
                    <Input
                      value={form.submitterPhone}
                      onChange={(e) => setField("submitterPhone", e.target.value)}
                      placeholder="(555) 123-4567"
                    />
                  </div>
                </div>

                <Separator />

                {/* Direct Contact */}
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    Direct Contact
                  </h4>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground uppercase tracking-wide">
                      Name
                    </Label>
                    <Input
                      value={form.directContactName}
                      onChange={(e) => setField("directContactName", e.target.value)}
                      placeholder="Contact name"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground uppercase tracking-wide">
                      Company
                    </Label>
                    <Input
                      value={form.directContactCompany}
                      onChange={(e) => setField("directContactCompany", e.target.value)}
                      placeholder="Company"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground uppercase tracking-wide">
                      Email
                    </Label>
                    <Input
                      type="email"
                      value={form.directContactEmail}
                      onChange={(e) => setField("directContactEmail", e.target.value)}
                      placeholder="email@company.com"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground uppercase tracking-wide">
                      Phone
                    </Label>
                    <Input
                      value={form.directContactPhone}
                      onChange={(e) => setField("directContactPhone", e.target.value)}
                      placeholder="(555) 123-4567"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Step 5: Additional Notes & Status */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold">
                    5
                  </span>
                  Admin Notes
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground uppercase tracking-wide">
                    Status
                  </Label>
                  <Select value={form.status} onValueChange={(v) => setField("status", v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select status..." />
                    </SelectTrigger>
                    <SelectContent>
                      {STATUS_OPTIONS.map((opt) => (
                        <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground uppercase tracking-wide">
                    Internal Notes
                  </Label>
                  <Textarea
                    value={form.adminNotes}
                    onChange={(e) => setField("adminNotes", e.target.value)}
                    placeholder="Internal notes about this submission..."
                    rows={4}
                  />
                </div>

                <div className="pt-2 text-xs text-muted-foreground space-y-1">
                  <div className="flex justify-between">
                    <span>Submission ID:</span>
                    <span className="font-mono">{form.id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Last Updated:</span>
                    <span>{formatDate(form.updatedAt)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Submission</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this submission? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <><Loader2 className="h-4 w-4 mr-1 animate-spin" /> Deleting...</>
              ) : (
                "Delete"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Letterhead Generation Dialog */}
      <Dialog open={letterheadDialogOpen} onOpenChange={setLetterheadDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Generate Letterhead PDF</DialogTitle>
            <DialogDescription>
              Create a professional letterhead PDF to send to data center partners. 
              The PDF will include response links for the recipient to indicate interest.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="recipientEmail">
                Recipient Email <span className="text-red-500">*</span>
              </Label>
              <Input
                id="recipientEmail"
                type="email"
                placeholder="partner@datacenter.com"
                value={letterheadData.recipientEmail}
                onChange={(e) => setLetterheadData({ ...letterheadData, recipientEmail: e.target.value })}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="recipientName">Recipient Name</Label>
              <Input
                id="recipientName"
                placeholder="John Smith"
                value={letterheadData.recipientName}
                onChange={(e) => setLetterheadData({ ...letterheadData, recipientName: e.target.value })}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="recipientCompany">Company</Label>
              <Input
                id="recipientCompany"
                placeholder="Data Center Partners LLC"
                value={letterheadData.recipientCompany}
                onChange={(e) => setLetterheadData({ ...letterheadData, recipientCompany: e.target.value })}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="message">Custom Message (Optional)</Label>
              <Textarea
                id="message"
                placeholder="Add a personalized message to include in the letterhead..."
                value={letterheadData.message}
                onChange={(e) => setLetterheadData({ ...letterheadData, message: e.target.value })}
                rows={3}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setLetterheadDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleGenerateLetterhead}
              disabled={isGeneratingLetterhead || !letterheadData.recipientEmail}
            >
              {isGeneratingLetterhead ? (
                <><Loader2 className="h-4 w-4 mr-1 animate-spin" /> Generating...</>
              ) : (
                <><FileText className="h-4 w-4 mr-1" /> Generate PDF</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
