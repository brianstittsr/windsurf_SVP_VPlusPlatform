"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
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
import { MapPin, Zap, Network, Droplets, User, Building2, Mail, Phone, Loader2, CheckCircle, FileText, AlertTriangle, CheckCircle2, ExternalLink } from "lucide-react";
import { GoogleMap } from "@/components/zenthium/google-map";
import { downloadPropertyPDF } from "@/lib/zenthium-pdf";
import { evaluateSite, SiteEvaluationResult } from "@/lib/zenthium-evaluation";

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

interface FormData {
  // Submitter (POC)
  submitterName: string;
  submitterEmail: string;
  submitterPhone: string;
  submitterCompany: string;
  // Property
  propertyName: string;
  propertyType: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  coordinates: string;
  squareFootage: string;
  acreage: string;
  zoningClassification: string;
  // Property Features
  isSingleStory: boolean;
  isFloor: boolean;
  floodZone: boolean;
  // Infrastructure
  powerAvailableMW: string;
  powerType: string;
  hasBackupPower: boolean;
  ceilingHeightFt: string;
  fiberAvailable: boolean;
  fiberProviders: string;
  waterAvailable: boolean;
  waterSource: string;
  coolingCapacity: string;
  hvacInstalled: boolean;
  // Ownership & Pricing
  ownershipType: string;
  askingPrice: string;
  leaseRate: string;
  timeline: string;
  // Environmental
  environmentalClearance: string;
  additionalNotes: string;
  // Direct Contact
  directContactName: string;
  directContactCompany: string;
  directContactEmail: string;
  directContactPhone: string;
}

const INITIAL_FORM_DATA: FormData = {
  submitterName: "",
  submitterEmail: "",
  submitterPhone: "",
  submitterCompany: "",
  propertyName: "",
  propertyType: "",
  address: "",
  city: "",
  state: "",
  zip: "",
  country: "US",
  coordinates: "",
  squareFootage: "",
  acreage: "",
  zoningClassification: "",
  isSingleStory: false,
  isFloor: false,
  floodZone: false,
  powerAvailableMW: "",
  powerType: "",
  hasBackupPower: false,
  ceilingHeightFt: "",
  fiberAvailable: false,
  fiberProviders: "",
  waterAvailable: false,
  waterSource: "",
  coolingCapacity: "",
  hvacInstalled: false,
  ownershipType: "",
  askingPrice: "",
  leaseRate: "",
  timeline: "",
  environmentalClearance: "",
  additionalNotes: "",
  directContactName: "",
  directContactCompany: "",
  directContactEmail: "",
  directContactPhone: "",
};

export default function ZenthiumSubmitPage() {
  const router = useRouter();
  const [form, setForm] = useState<FormData>(INITIAL_FORM_DATA);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [evaluation, setEvaluation] = useState<SiteEvaluationResult | null>(null);
  const [showMap, setShowMap] = useState(false);

  const setField = <K extends keyof FormData>(field: K, value: FormData[K]) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  // Auto-evaluate site when relevant fields change
  useEffect(() => {
    const evaluationData = {
      squareFootage: form.squareFootage ? Number(form.squareFootage) : undefined,
      powerAvailableMW: form.powerAvailableMW ? Number(form.powerAvailableMW) : undefined,
      ceilingHeightFt: form.ceilingHeightFt ? Number(form.ceilingHeightFt) : undefined,
      isSingleStory: form.isSingleStory,
      isFloor: form.isFloor,
      propertyType: form.propertyType,
      waterAvailable: form.waterAvailable,
      waterSource: form.waterSource,
      fiberAvailable: form.fiberAvailable,
      fiberProviders: form.fiberProviders,
      zoningClassification: form.zoningClassification,
      environmentalClearance: form.environmentalClearance,
      floodZone: form.floodZone,
    };
    const result = evaluateSite(evaluationData);
    setEvaluation(result);
  }, [
    form.squareFootage,
    form.powerAvailableMW,
    form.ceilingHeightFt,
    form.isSingleStory,
    form.isFloor,
    form.propertyType,
    form.waterAvailable,
    form.waterSource,
    form.fiberAvailable,
    form.fiberProviders,
    form.zoningClassification,
    form.environmentalClearance,
    form.floodZone,
  ]);

  const handleGeneratePDF = () => {
    const pdfData = {
      propertyName: form.propertyName,
      propertyType: form.propertyType,
      address: form.address,
      city: form.city,
      state: form.state,
      zip: form.zip,
      country: form.country,
      coordinates: form.coordinates,
      squareFootage: form.squareFootage ? Number(form.squareFootage) : undefined,
      acreage: form.acreage ? Number(form.acreage) : undefined,
      zoningClassification: form.zoningClassification,
      powerAvailableMW: form.powerAvailableMW ? Number(form.powerAvailableMW) : undefined,
      powerType: form.powerType,
      ceilingHeightFt: form.ceilingHeightFt ? Number(form.ceilingHeightFt) : undefined,
      fiberAvailable: form.fiberAvailable,
      fiberProviders: form.fiberProviders,
      waterAvailable: form.waterAvailable,
      waterSource: form.waterSource,
      coolingCapacity: form.coolingCapacity,
      environmentalClearance: form.environmentalClearance,
      ownershipType: form.ownershipType,
      askingPrice: form.askingPrice,
      leaseRate: form.leaseRate,
      timeline: form.timeline,
      description: form.additionalNotes,
      submitterName: form.submitterName,
      submitterEmail: form.submitterEmail,
      submitterPhone: form.submitterPhone,
      submitterCompany: form.submitterCompany,
      directContactName: form.directContactName,
      directContactEmail: form.directContactEmail,
      directContactPhone: form.directContactPhone,
      directContactCompany: form.directContactCompany,
    };
    downloadPropertyPDF(pdfData);
    toast.success("PDF generated successfully!");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Transform flat form data to nested API structure
      const submissionData = {
        title: `${form.propertyName || "Property Submission"} — ${form.city || "Unknown Location"}`,
        propertyName: form.propertyName,
        address: {
          street: form.address,
          city: form.city,
          state: form.state,
          zip: form.zip,
          country: form.country || "US",
        },
        coordinates: form.coordinates,
        squareFootage: form.squareFootage ? Number(form.squareFootage) : undefined,
        acreage: form.acreage ? Number(form.acreage) : undefined,
        powerCapacityMW: form.powerAvailableMW ? Number(form.powerAvailableMW) : undefined,
        utilities: "",
        fiberAvailability: form.fiberAvailable ? form.fiberProviders : "",
        waterAvailability: form.waterAvailable ? form.waterSource : "",
        zoning: form.zoningClassification,
        ownership: form.ownershipType,
        pricing: form.askingPrice || form.leaseRate,
        timeline: form.timeline,
        description: form.additionalNotes || "No description provided",
        environmentalNotes: "",
        poc: {
          name: form.submitterName,
          email: form.submitterEmail,
          phone: form.submitterPhone,
          company: form.submitterCompany,
        },
        directContact: {
          name: form.directContactName,
          email: form.directContactEmail,
          phone: form.directContactPhone,
          company: form.directContactCompany,
        },
        // Additional fields stored for admin view
        propertyType: form.propertyType,
        powerType: form.powerType,
        hasBackupPower: form.hasBackupPower,
        ceilingHeightFt: form.ceilingHeightFt ? Number(form.ceilingHeightFt) : undefined,
        fiberProviders: form.fiberProviders,
        waterSource: form.waterSource,
        coolingCapacity: form.coolingCapacity,
        hvacInstalled: form.hvacInstalled,
        isSingleStory: form.isSingleStory,
        isFloor: form.isFloor,
        floodZone: form.floodZone,
        environmentalClearance: form.environmentalClearance,
        leaseRate: form.leaseRate,
      };

      const res = await fetch("/api/zenthium/location-submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(submissionData),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to submit");
      }

      setIsSuccess(true);
      toast.success("Location submitted successfully!");
    } catch (error) {
      console.error("Submission error:", error);
      toast.error(error instanceof Error ? error.message : "Failed to submit location");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <Card className="text-center py-12">
            <CardContent className="space-y-4">
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900">Submission Received!</h1>
              <p className="text-gray-600">
                Thank you for submitting your property. Our team will review your submission within 5 business days.
              </p>
              <Button onClick={() => { setIsSuccess(false); setForm(INITIAL_FORM_DATA); }} variant="outline" className="mt-4">
                Submit Another Location
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-primary/10">
              <MapPin className="h-6 w-6 text-primary" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight">Submit a Data Center Location</h1>
          </div>
          <p className="text-muted-foreground ml-11">
            Complete all sections to submit your property for Zenthium evaluation. Our team reviews every submission within 5 business days.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Submitter Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Submitter Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground uppercase tracking-wide">Full Name *</Label>
                    <Input 
                      value={form.submitterName} 
                      onChange={(e) => setField("submitterName", e.target.value)}
                      placeholder="Your full name"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground uppercase tracking-wide">Company</Label>
                    <Input 
                      value={form.submitterCompany} 
                      onChange={(e) => setField("submitterCompany", e.target.value)}
                      placeholder="Your company"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground uppercase tracking-wide">Email *</Label>
                    <Input 
                      type="email"
                      value={form.submitterEmail} 
                      onChange={(e) => setField("submitterEmail", e.target.value)}
                      placeholder="your@email.com"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground uppercase tracking-wide">Phone</Label>
                    <Input 
                      value={form.submitterPhone} 
                      onChange={(e) => setField("submitterPhone", e.target.value)}
                      placeholder="(555) 123-4567"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Property Details */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Property Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2 space-y-1">
                      <Label className="text-xs text-muted-foreground uppercase tracking-wide">Property Name *</Label>
                      <Input 
                        value={form.propertyName} 
                        onChange={(e) => setField("propertyName", e.target.value)}
                        placeholder="e.g., Desert Ridge Industrial Park"
                        required
                      />
                    </div>
                    <div className="col-span-2 space-y-1">
                      <Label className="text-xs text-muted-foreground uppercase tracking-wide">Property Type</Label>
                      <Select value={form.propertyType} onValueChange={(v) => setField("propertyType", v)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select property type..." />
                        </SelectTrigger>
                        <SelectContent>
                          {PROPERTY_TYPE_OPTIONS.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="col-span-2 space-y-1">
                      <Label className="text-xs text-muted-foreground uppercase tracking-wide">Street Address</Label>
                      <Input 
                        value={form.address} 
                        onChange={(e) => setField("address", e.target.value)}
                        placeholder="1234 Industrial Blvd"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground uppercase tracking-wide">City *</Label>
                      <Input 
                        value={form.city} 
                        onChange={(e) => setField("city", e.target.value)}
                        placeholder="Phoenix"
                        required
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground uppercase tracking-wide">State *</Label>
                      <Input 
                        value={form.state} 
                        onChange={(e) => setField("state", e.target.value)}
                        placeholder="AZ"
                        maxLength={2}
                        required
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground uppercase tracking-wide">ZIP</Label>
                      <Input 
                        value={form.zip} 
                        onChange={(e) => setField("zip", e.target.value)}
                        placeholder="85001"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground uppercase tracking-wide">Coordinates</Label>
                      <Input 
                        value={form.coordinates} 
                        onChange={(e) => setField("coordinates", e.target.value)}
                        placeholder="33.4484,-112.0740"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground uppercase tracking-wide">Square Footage</Label>
                      <Input 
                        type="number"
                        value={form.squareFootage} 
                        onChange={(e) => setField("squareFootage", e.target.value)}
                        placeholder="500000"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground uppercase tracking-wide">Acreage</Label>
                      <Input 
                        type="number"
                        value={form.acreage} 
                        onChange={(e) => setField("acreage", e.target.value)}
                        placeholder="125"
                      />
                    </div>
                    <div className="col-span-2 space-y-1">
                      <Label className="text-xs text-muted-foreground uppercase tracking-wide">Zoning Classification</Label>
                      <Input 
                        value={form.zoningClassification} 
                        onChange={(e) => setField("zoningClassification", e.target.value)}
                        placeholder="e.g., Industrial, Commercial"
                      />
                    </div>
                  </div>
                  <Separator />
                  <div className="space-y-3">
                    {[
                      { id: "single-story", field: "isSingleStory" as const, label: "Single-story building" },
                      { id: "flat-floor", field: "isFloor" as const, label: "Level, flat floor" },
                      { id: "flood-zone", field: "floodZone" as const, label: "Located in FEMA flood zone" },
                    ].map(({ id, field, label }) => (
                      <div key={id} className="flex items-center gap-3">
                        <Checkbox
                          id={id}
                          checked={form[field]}
                          onCheckedChange={(v) => setField(field, !!v)}
                        />
                        <Label htmlFor={id} className="cursor-pointer text-sm">{label}</Label>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Infrastructure */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Zap className="h-4 w-4 text-yellow-500" />
                    Infrastructure
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground uppercase tracking-wide">Power (MW)</Label>
                      <Input 
                        type="number"
                        value={form.powerAvailableMW} 
                        onChange={(e) => setField("powerAvailableMW", e.target.value)}
                        placeholder="100"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground uppercase tracking-wide">Power Type</Label>
                      <Select value={form.powerType} onValueChange={(v) => setField("powerType", v)}>
                        <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                        <SelectContent>
                          {POWER_TYPE_OPTIONS.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground uppercase tracking-wide">Ceiling Height (ft)</Label>
                      <Input 
                        type="number"
                        value={form.ceilingHeightFt} 
                        onChange={(e) => setField("ceilingHeightFt", e.target.value)}
                        placeholder="24"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground uppercase tracking-wide">Environmental Status</Label>
                      <Select value={form.environmentalClearance} onValueChange={(v) => setField("environmentalClearance", v)}>
                        <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="clean">Clean</SelectItem>
                          <SelectItem value="phase1_done">Phase I — Clean</SelectItem>
                          <SelectItem value="phase2_done">Phase II — Remediated</SelectItem>
                          <SelectItem value="unknown">Unknown</SelectItem>
                          <SelectItem value="issues">Known Issues</SelectItem>
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
                    <div className="col-span-2 space-y-1">
                      <Label className="text-xs text-muted-foreground uppercase tracking-wide">Cooling Capacity</Label>
                      <Input 
                        value={form.coolingCapacity} 
                        onChange={(e) => setField("coolingCapacity", e.target.value)}
                        placeholder="System type or capacity"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
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
                        <Label htmlFor={id} className="cursor-pointer text-sm">{label}</Label>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Ownership & Pricing */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Ownership & Financials</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground uppercase tracking-wide">Ownership Type</Label>
                    <Select value={form.ownershipType} onValueChange={(v) => setField("ownershipType", v)}>
                      <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="own">Owner outright</SelectItem>
                        <SelectItem value="lease">Holds lease / master lease</SelectItem>
                        <SelectItem value="option">Holds purchase option</SelectItem>
                        <SelectItem value="other">Other / Broker / Rep</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground uppercase tracking-wide">Asking / Sale Price</Label>
                      <Input 
                        value={form.askingPrice} 
                        onChange={(e) => setField("askingPrice", e.target.value)}
                        placeholder="e.g., $5,000,000"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground uppercase tracking-wide">Lease Rate</Label>
                      <Input 
                        value={form.leaseRate} 
                        onChange={(e) => setField("leaseRate", e.target.value)}
                        placeholder="e.g., $12/sq ft/year"
                      />
                    </div>
                    <div className="col-span-2 space-y-1">
                      <Label className="text-xs text-muted-foreground uppercase tracking-wide">Timeline</Label>
                      <Input 
                        value={form.timeline} 
                        onChange={(e) => setField("timeline", e.target.value)}
                        placeholder="e.g., Ready now, Q4 2024, etc."
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground uppercase tracking-wide">Additional Notes / Description *</Label>
                    <Textarea 
                      value={form.additionalNotes} 
                      onChange={(e) => setField("additionalNotes", e.target.value)}
                      placeholder="Describe the property and its data center potential..."
                      rows={4}
                      required
                    />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Site Evaluation */}
              {evaluation && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4" />
                      Site Evaluation
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="text-center py-3">
                      <div className="text-3xl font-bold mb-1">{evaluation.score}/100</div>
                      <Badge variant={evaluation.meetsRequirements ? "default" : "destructive"} className="mb-2">
                        {evaluation.meetsRequirements ? "Meets Requirements" : "Does Not Meet Requirements"}
                      </Badge>
                      <p className="text-xs text-muted-foreground">{evaluation.summary}</p>
                    </div>
                    <Separator />
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {evaluation.requirements.map((req) => (
                        <div key={req.id} className="flex items-start gap-2 text-sm">
                          {req.status === "pass" && <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />}
                          {req.status === "fail" && <AlertTriangle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />}
                          {req.status === "partial" && <AlertTriangle className="h-4 w-4 text-yellow-500 mt-0.5 flex-shrink-0" />}
                          {req.status === "pending" && <AlertTriangle className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-medium truncate">{req.title}</span>
                              <Badge variant={req.isRequired ? "default" : "outline"} className="text-xs flex-shrink-0">
                                {req.isRequired ? "Required" : "Preferred"}
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground truncate">{req.currentValue}</p>
                            {req.notes && <p className="text-xs text-muted-foreground">{req.notes}</p>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Google Map */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Location Map
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {showMap && (form.address || form.city) ? (
                    <GoogleMap
                      address={form.address}
                      city={form.city}
                      state={form.state}
                      zip={form.zip}
                      height="200px"
                    />
                  ) : (
                    <div className="text-center py-8 text-sm text-muted-foreground">
                      Enter address details to view map
                    </div>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => setShowMap(!showMap)}
                    disabled={!form.address && !form.city}
                  >
                    {showMap ? "Hide Map" : "Show Map"}
                  </Button>
                </CardContent>
              </Card>

              {/* PDF Generation */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Export
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={handleGeneratePDF}
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Generate PDF
                  </Button>
                  <p className="text-xs text-muted-foreground text-center">
                    Download a letterhead PDF with property details
                  </p>
                </CardContent>
              </Card>

              {/* Water & Power Data Resources */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Zap className="h-4 w-4" />
                    Infrastructure Research
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <p className="text-xs text-muted-foreground mb-3">
                    Research water availability and power grid data for this location:
                  </p>
                  <a
                    href="https://api.waterdata.usgs.gov/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-blue-600 hover:underline"
                  >
                    <Droplets className="h-3.5 w-3.5" />
                    USGS Water Data API
                    <ExternalLink className="h-3 w-3" />
                  </a>
                  <a
                    href="https://www.eia.gov/opendata/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-blue-600 hover:underline"
                  >
                    <Zap className="h-3.5 w-3.5" />
                    EIA Energy Data API
                    <ExternalLink className="h-3 w-3" />
                  </a>
                  <a
                    href="https://www.electricitymaps.com/docs"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-blue-600 hover:underline"
                  >
                    <Network className="h-3.5 w-3.5" />
                    Electricity Maps API
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </CardContent>
              </Card>

              {/* Direct Contact */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Direct Contact</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground uppercase tracking-wide flex items-center gap-1">
                      <User className="h-3.5 w-3.5" />
                      Name
                    </Label>
                    <Input 
                      value={form.directContactName} 
                      onChange={(e) => setField("directContactName", e.target.value)}
                      placeholder="Contact name"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground uppercase tracking-wide flex items-center gap-1">
                      <Building2 className="h-3.5 w-3.5" />
                      Company
                    </Label>
                    <Input 
                      value={form.directContactCompany} 
                      onChange={(e) => setField("directContactCompany", e.target.value)}
                      placeholder="Company"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground uppercase tracking-wide flex items-center gap-1">
                      <Mail className="h-3.5 w-3.5" />
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
                    <Label className="text-xs text-muted-foreground uppercase tracking-wide flex items-center gap-1">
                      <Phone className="h-3.5 w-3.5" />
                      Phone
                    </Label>
                    <Input 
                      value={form.directContactPhone} 
                      onChange={(e) => setField("directContactPhone", e.target.value)}
                      placeholder="(555) 123-4567"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Submit Button */}
              <Card>
                <CardContent className="pt-6">
                  <Button 
                    type="submit" 
                    className="w-full" 
                    size="lg"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Submitting...</>
                    ) : (
                      "Submit Location"
                    )}
                  </Button>
                  <p className="text-xs text-muted-foreground text-center mt-3">
                    By submitting, you agree to our terms of service and privacy policy.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
