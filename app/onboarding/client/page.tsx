"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { onAuthStateChanged, type User } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Building2,
  Landmark,
  Factory,
  CheckCircle,
  ChevronRight,
  ChevronLeft,
  Loader2,
  Users,
  Target,
  X,
  Plus,
} from "lucide-react";
import { toast } from "sonner";

const TABS = ["company", "govcon", "capabilities", "market", "review"] as const;
type Tab = (typeof TABS)[number];

const companyTypes = [
  "Manufacturer",
  "Supplier/Vendor",
  "OEM",
  "Tier 1 Supplier",
  "Tier 2 Supplier",
  "Distributor",
  "Service Provider",
  "Other",
];

const industrySectors = [
  "Automotive",
  "Aerospace & Defense",
  "Electronics",
  "Medical Devices",
  "Industrial Equipment",
  "Consumer Products",
  "Energy & Utilities",
  "Food & Beverage",
  "Pharmaceutical",
  "IT & Software",
  "Professional Services",
  "Other",
];

const capabilities = [
  "CNC Machining",
  "Metal Stamping",
  "Injection Molding",
  "Die Casting",
  "Welding & Fabrication",
  "Assembly",
  "Electronics Assembly",
  "Surface Finishing",
  "Testing & Inspection",
  "Packaging",
  "Engineering & Design",
  "Logistics & Distribution",
];

const qualityCertifications = [
  "ISO 9001",
  "ISO 14001",
  "IATF 16949",
  "AS9100",
  "ISO 13485",
  "ISO 45001",
  "NADCAP",
  "CMMI",
  "ITAR Registered",
  "CMM/CQMS",
];

// SBA / socioeconomic set-aside programs — drives SAM.gov match scoring.
const setAsideCerts = [
  { id: "8a", name: "8(a) Business Development" },
  { id: "hubzone", name: "HUBZone" },
  { id: "sdvosb", name: "Service-Disabled Veteran-Owned (SDVOSB)" },
  { id: "vosb", name: "Veteran-Owned (VOSB)" },
  { id: "edwosb", name: "Economically Disadvantaged WOSB" },
  { id: "wosb", name: "Women-Owned Small Business (WOSB)" },
  { id: "mbe", name: "Minority Business Enterprise (MBE)" },
  { id: "dbw", name: "Disadvantaged Business Enterprise (DBE)" },
];

const clearanceLevels = [
  { value: "none", label: "None" },
  { value: "public-trust", label: "Public Trust" },
  { value: "secret", label: "Secret" },
  { value: "top-secret", label: "Top Secret" },
  { value: "other", label: "Other" },
];

const servicesOfInterest = [
  "Lean Manufacturing",
  "Quality Systems & ISO",
  "Automation & Industry 4.0",
  "Workforce Development",
  "Supply Chain Optimization",
  "Digital Transformation",
  "Government Contracting",
  "Capture & Proposal Support",
];

interface FormData {
  companyName: string;
  companyType: string;
  website: string;
  yearEstablished: string;
  employeeCount: string;
  streetAddress: string;
  city: string;
  state: string;
  zipCode: string;
  // GovCon
  uei: string;
  cageCode: string;
  samExpiry: string;
  samRegistered: boolean;
  naicsCodes: string[];
  pscCodes: string[];
  clearanceLevel: string;
  setAsides: Record<string, boolean>;
  certExpiries: Record<string, string>;
  keywords: string[];
  targetAgencies: string[];
  // Capabilities
  industrySectors: string[];
  capabilities: string[];
  qualityCerts: string[];
  quality: {
    qualityManual: boolean;
    documentedProcesses: boolean;
    internalAudits: boolean;
    correctiveActionProcess: boolean;
    supplierQualification: boolean;
  };
  // Market & goals
  servicesInterested: string[];
  primaryGoals: string;
  currentChallenges: string;
  timeline: string;
  howDidYouHear: string;
  additionalNotes: string;
  // Contacts
  contactName: string;
  contactTitle: string;
  contactEmail: string;
  contactPhone: string;
  secondaryName: string;
  secondaryTitle: string;
  secondaryEmail: string;
  secondaryPhone: string;
  agreeToTerms: boolean;
}

const initialForm: FormData = {
  companyName: "",
  companyType: "",
  website: "",
  yearEstablished: "",
  employeeCount: "",
  streetAddress: "",
  city: "",
  state: "",
  zipCode: "",
  uei: "",
  cageCode: "",
  samExpiry: "",
  samRegistered: false,
  naicsCodes: [],
  pscCodes: [],
  clearanceLevel: "none",
  setAsides: {},
  certExpiries: {},
  keywords: [],
  targetAgencies: [],
  industrySectors: [],
  capabilities: [],
  qualityCerts: [],
  quality: {
    qualityManual: false,
    documentedProcesses: false,
    internalAudits: false,
    correctiveActionProcess: false,
    supplierQualification: false,
  },
  servicesInterested: [],
  primaryGoals: "",
  currentChallenges: "",
  timeline: "",
  howDidYouHear: "",
  additionalNotes: "",
  contactName: "",
  contactTitle: "",
  contactEmail: "",
  contactPhone: "",
  secondaryName: "",
  secondaryTitle: "",
  secondaryEmail: "",
  secondaryPhone: "",
  agreeToTerms: false,
};

function ToggleGrid({
  options,
  selected,
  onToggle,
  cols = 3,
}: {
  options: string[];
  selected: string[];
  onToggle: (value: string) => void;
  cols?: 2 | 3 | 4;
}) {
  const colClass = cols === 4 ? "md:grid-cols-4" : cols === 2 ? "md:grid-cols-2" : "md:grid-cols-3";
  return (
    <div className={`grid grid-cols-2 ${colClass} gap-3`}>
      {options.map((option) => (
        <div
          key={option}
          className={`flex items-center space-x-2 p-3 border rounded-lg cursor-pointer transition-all ${
            selected.includes(option) ? "border-[#C8A951] bg-[#C8A951]/5" : "border-muted hover:border-muted-foreground/50"
          }`}
          onClick={() => onToggle(option)}
        >
          <Checkbox checked={selected.includes(option)} onCheckedChange={() => onToggle(option)} />
          <span className="text-sm">{option}</span>
        </div>
      ))}
    </div>
  );
}

function TagInput({
  label,
  hint,
  values,
  onAdd,
  onRemove,
  placeholder,
  pattern,
  normalize,
}: {
  label: string;
  hint?: string;
  values: string[];
  onAdd: (v: string) => void;
  onRemove: (v: string) => void;
  placeholder: string;
  pattern?: RegExp;
  normalize?: (v: string) => string;
}) {
  const [draft, setDraft] = useState("");
  const add = () => {
    const v = normalize ? normalize(draft) : draft.trim();
    if (!v) return;
    if (pattern && !pattern.test(v)) {
      toast.error(`"${v}" doesn't match the expected format`);
      return;
    }
    if (!values.includes(v)) onAdd(v);
    setDraft("");
  };
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      <div className="flex gap-2">
        <Input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              add();
            }
          }}
          placeholder={placeholder}
        />
        <Button type="button" variant="outline" size="icon" onClick={add} aria-label={`Add ${label}`}>
          <Plus className="h-4 w-4" />
        </Button>
      </div>
      {values.length > 0 && (
        <div className="flex flex-wrap gap-2 pt-1">
          {values.map((v) => (
            <span key={v} className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-1 text-xs">
              {v}
              <button type="button" onClick={() => onRemove(v)} aria-label={`Remove ${v}`}>
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

export default function ClientOnboardingPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>("company");
  const [isSaving, setIsSaving] = useState(false);
  const [completedTabs, setCompletedTabs] = useState<string[]>([]);
  const [formData, setFormData] = useState<FormData>(initialForm);

  useEffect(() => {
    if (!auth) {
      setAuthChecked(true);
      return;
    }
    return onAuthStateChanged(auth, (u) => {
      setUser(u);
      setAuthChecked(true);
      if (u) {
        const name = sessionStorage.getItem("svp_user_name") || u.displayName || "";
        const company = sessionStorage.getItem("svp_user_company") || "";
        const phone = sessionStorage.getItem("svp_user_phone") || "";
        setFormData((prev) => ({
          ...prev,
          contactName: prev.contactName || name,
          contactEmail: prev.contactEmail || u.email || "",
          companyName: prev.companyName || company,
          contactPhone: prev.contactPhone || phone,
        }));
      }
    });
  }, []);

  const set = <K extends keyof FormData>(field: K, value: FormData[K]) =>
    setFormData((prev) => ({ ...prev, [field]: value }));

  const toggleIn = (field: keyof FormData, value: string) => {
    const arr = (formData[field] as string[]) || [];
    set(field as never, (arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value]) as never);
  };

  const addTag = (field: "naicsCodes" | "pscCodes" | "keywords" | "targetAgencies", v: string) =>
    set(field, [...formData[field], v]);
  const removeTag = (field: "naicsCodes" | "pscCodes" | "keywords" | "targetAgencies", v: string) =>
    set(field, formData[field].filter((x) => x !== v));

  const isTabComplete = (tab: Tab): boolean => {
    switch (tab) {
      case "company":
        return !!(formData.companyName && formData.streetAddress && formData.city && formData.state && formData.zipCode);
      case "govcon":
        return formData.naicsCodes.length > 0;
      case "capabilities":
        return true;
      case "market":
        return true;
      case "review":
        return !!(formData.contactName && formData.contactEmail && formData.agreeToTerms);
    }
  };

  const handleTabChange = (tab: string) => {
    if (isTabComplete(activeTab) && !completedTabs.includes(activeTab)) {
      setCompletedTabs((prev) => [...prev, activeTab]);
    }
    setActiveTab(tab as Tab);
  };

  const step = (dir: 1 | -1) => {
    const i = TABS.indexOf(activeTab) + dir;
    if (i >= 0 && i < TABS.length) handleTabChange(TABS[i]);
  };

  const progress = Math.round((TABS.filter((t) => isTabComplete(t)).length / TABS.length) * 100);

  const handleSubmit = async () => {
    if (!user) {
      toast.error("Please sign in to submit your onboarding");
      return;
    }
    setIsSaving(true);
    try {
      const token = await user.getIdToken();
      const certifications = setAsideCerts
        .filter((c) => formData.setAsides[c.id])
        .map((c) => ({
          name: c.id,
          ...(formData.certExpiries[c.id] ? { expiresAt: new Date(formData.certExpiries[c.id]).toISOString() } : {}),
        }));

      const res = await fetch("/api/onboarding/client", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          company: {
            name: formData.companyName,
            type: formData.companyType || undefined,
            website: formData.website || undefined,
            yearEstablished: formData.yearEstablished || undefined,
            employeeCount: formData.employeeCount || undefined,
            streetAddress: formData.streetAddress || undefined,
            city: formData.city || undefined,
            state: formData.state || undefined,
            zipCode: formData.zipCode || undefined,
            country: "United States",
          },
          primaryContact: {
            name: formData.contactName,
            title: formData.contactTitle || undefined,
            email: formData.contactEmail,
            phone: formData.contactPhone || undefined,
          },
          secondaryContact: formData.secondaryName
            ? {
                name: formData.secondaryName,
                title: formData.secondaryTitle || undefined,
                email: formData.secondaryEmail || undefined,
                phone: formData.secondaryPhone || undefined,
              }
            : undefined,
          govcon: {
            uei: formData.uei || undefined,
            cageCode: formData.cageCode || undefined,
            samRegistrationExpiry: formData.samExpiry ? new Date(formData.samExpiry).toISOString() : undefined,
            clearanceLevel: formData.clearanceLevel,
            naicsCodes: formData.naicsCodes,
            pscCodes: formData.pscCodes,
            certifications,
            keywords: formData.keywords,
            targetAgencies: formData.targetAgencies,
          },
          onboarding: {
            industrySectors: formData.industrySectors,
            capabilities: formData.capabilities,
            quality: {
              ...formData.quality,
              certifications: formData.qualityCerts,
            },
            servicesInterested: formData.servicesInterested,
            primaryGoals: formData.primaryGoals || undefined,
            currentChallenges: formData.currentChallenges || undefined,
            timeline: formData.timeline || undefined,
            howDidYouHear: formData.howDidYouHear || undefined,
            additionalNotes: formData.additionalNotes || undefined,
          },
        }),
      });

      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(data?.error || "Submission failed");
      }

      toast.success("Profile saved!", { description: "Your company profile is now active for opportunity matching." });
      router.push("/portal");
    } catch (error) {
      console.error("Onboarding submit failed:", error);
      toast.error(error instanceof Error ? error.message : "Failed to save. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  if (!authChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <CardTitle>Sign In Required</CardTitle>
            <CardDescription>
              You need a Strategic Value+ account to complete client onboarding. Sign in or create an account to continue.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <Button asChild>
              <Link href="/sign-in">Sign In</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/sign-up">Create Account</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const TabIcon = ({ tab }: { tab: Tab }) =>
    completedTabs.includes(tab) ? <CheckCircle className="h-3 w-3 text-green-500" /> : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur">
        <div className="container flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Image src="/VPlus_logo.webp" alt="Strategic Value+ Logo" width={40} height={40} className="h-10 w-auto" />
            <div className="flex flex-col">
              <span className="text-lg font-bold leading-none">Strategic Value+</span>
              <span className="text-xs text-muted-foreground">Client Onboarding</span>
            </div>
          </Link>
          <div className="flex items-center gap-4">
            <div className="text-sm text-muted-foreground">Progress: {progress}%</div>
            <Progress value={progress} className="w-32 h-2" />
          </div>
        </div>
      </header>

      <main className="container py-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-[#C8A951] to-[#a08840] mb-4">
              <Landmark className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold mb-2">Client Registration</h1>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Complete your company and government-contracting profile so we can match you with relevant SAM.gov opportunities.
            </p>
          </div>

          <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="company" className="flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                <span className="hidden sm:inline">Company</span>
                <TabIcon tab="company" />
              </TabsTrigger>
              <TabsTrigger value="govcon" className="flex items-center gap-2">
                <Landmark className="h-4 w-4" />
                <span className="hidden sm:inline">GovCon</span>
                <TabIcon tab="govcon" />
              </TabsTrigger>
              <TabsTrigger value="capabilities" className="flex items-center gap-2">
                <Factory className="h-4 w-4" />
                <span className="hidden sm:inline">Capabilities</span>
                <TabIcon tab="capabilities" />
              </TabsTrigger>
              <TabsTrigger value="market" className="flex items-center gap-2">
                <Target className="h-4 w-4" />
                <span className="hidden sm:inline">Market</span>
                <TabIcon tab="market" />
              </TabsTrigger>
              <TabsTrigger value="review" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                <span className="hidden sm:inline">Review</span>
                <TabIcon tab="review" />
              </TabsTrigger>
            </TabsList>

            {/* ============ COMPANY ============ */}
            <TabsContent value="company" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Company Information</CardTitle>
                  <CardDescription>Basic details about your organization</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="companyName">Company Name *</Label>
                      <Input id="companyName" value={formData.companyName} onChange={(e) => set("companyName", e.target.value)} placeholder="Your Company LLC" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="companyType">Company Type</Label>
                      <Select value={formData.companyType} onValueChange={(v) => set("companyType", v)}>
                        <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                        <SelectContent>
                          {companyTypes.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="website">Website</Label>
                      <Input id="website" value={formData.website} onChange={(e) => set("website", e.target.value)} placeholder="www.yourcompany.com" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="yearEstablished">Year Established</Label>
                      <Input id="yearEstablished" value={formData.yearEstablished} onChange={(e) => set("yearEstablished", e.target.value)} placeholder="1990" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="employeeCount">Employees</Label>
                      <Select value={formData.employeeCount} onValueChange={(v) => set("employeeCount", v)}>
                        <SelectTrigger><SelectValue placeholder="Select range" /></SelectTrigger>
                        <SelectContent>
                          {["1-10", "11-50", "51-100", "101-250", "251-500", "500+"].map((r) => (
                            <SelectItem key={r} value={r}>{r}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="border-t pt-6">
                    <h4 className="font-medium mb-1">Government Identifiers</h4>
                    <p className="text-xs text-muted-foreground mb-4">
                      From your SAM.gov entity registration — these power opportunity matching and eligibility checks.
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="uei">UEI (Unique Entity ID)</Label>
                        <Input id="uei" value={formData.uei} onChange={(e) => set("uei", e.target.value.toUpperCase())} placeholder="12-character SAM.gov UEI" maxLength={12} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="cageCode">CAGE Code</Label>
                        <Input id="cageCode" value={formData.cageCode} onChange={(e) => set("cageCode", e.target.value.toUpperCase())} placeholder="5-character CAGE" maxLength={5} />
                      </div>
                    </div>
                  </div>

                  <div className="border-t pt-6">
                    <h4 className="font-medium mb-4">Company Address</h4>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="streetAddress">Street Address *</Label>
                        <Input id="streetAddress" value={formData.streetAddress} onChange={(e) => set("streetAddress", e.target.value)} placeholder="123 Manufacturing Way" />
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="city">City *</Label>
                          <Input id="city" value={formData.city} onChange={(e) => set("city", e.target.value)} placeholder="Greensboro" />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="state">State *</Label>
                          <Input id="state" value={formData.state} onChange={(e) => set("state", e.target.value.toUpperCase())} placeholder="NC" maxLength={2} />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="zipCode">ZIP Code *</Label>
                          <Input id="zipCode" value={formData.zipCode} onChange={(e) => set("zipCode", e.target.value)} placeholder="27401" />
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* ============ GOVCON ============ */}
            <TabsContent value="govcon" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>SAM.gov Registration</CardTitle>
                  <CardDescription>Your federal registration status drives eligibility warnings and expiry alerts</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center space-x-3 p-4 border rounded-lg">
                    <Checkbox
                      id="samRegistered"
                      checked={formData.samRegistered}
                      onCheckedChange={(c) => set("samRegistered", c === true)}
                    />
                    <div>
                      <Label htmlFor="samRegistered" className="font-medium cursor-pointer">Registered in SAM.gov</Label>
                      <p className="text-sm text-muted-foreground">Our entity registration is active in SAM.gov</p>
                    </div>
                  </div>
                  {formData.samRegistered && (
                    <div className="space-y-2 max-w-xs">
                      <Label htmlFor="samExpiry">SAM Registration Expires</Label>
                      <Input id="samExpiry" type="date" value={formData.samExpiry} onChange={(e) => set("samExpiry", e.target.value)} />
                    </div>
                  )}
                  <div className="space-y-2 max-w-xs">
                    <Label htmlFor="clearanceLevel">Facility Clearance Level</Label>
                    <Select value={formData.clearanceLevel} onValueChange={(v) => set("clearanceLevel", v)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {clearanceLevels.map((l) => (
                          <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Socioeconomic Certifications</CardTitle>
                  <CardDescription>SBA and set-aside programs — determines which restricted opportunities you can bid</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {setAsideCerts.map((cert) => (
                    <div key={cert.id} className="flex items-center gap-4 p-3 border rounded-lg">
                      <Checkbox
                        checked={!!formData.setAsides[cert.id]}
                        onCheckedChange={(c) => set("setAsides", { ...formData.setAsides, [cert.id]: c === true })}
                      />
                      <span className="text-sm flex-1">{cert.name}</span>
                      {formData.setAsides[cert.id] && (
                        <div className="flex items-center gap-2">
                          <Label className="text-xs text-muted-foreground whitespace-nowrap">Expires</Label>
                          <Input
                            type="date"
                            className="w-40"
                            value={formData.certExpiries[cert.id] || ""}
                            onChange={(e) => set("certExpiries", { ...formData.certExpiries, [cert.id]: e.target.value })}
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Classification Codes *</CardTitle>
                  <CardDescription>NAICS codes are the primary driver of SAM.gov opportunity matching</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <TagInput
                    label="NAICS Codes"
                    hint="4–6 digit codes from your SAM.gov registration (e.g. 541330, 332710). At least one required."
                    values={formData.naicsCodes}
                    onAdd={(v) => addTag("naicsCodes", v)}
                    onRemove={(v) => removeTag("naicsCodes", v)}
                    placeholder="e.g. 541330"
                    pattern={/^\d{4,6}$/}
                  />
                  <TagInput
                    label="PSC / FSC Codes (optional)"
                    hint="Product Service Codes for goods you supply (e.g. 3440, R425)"
                    values={formData.pscCodes}
                    onAdd={(v) => addTag("pscCodes", v)}
                    onRemove={(v) => removeTag("pscCodes", v)}
                    placeholder="e.g. R425"
                    normalize={(v) => v.trim().toUpperCase()}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            {/* ============ CAPABILITIES ============ */}
            <TabsContent value="capabilities" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Industry Sectors</CardTitle>
                  <CardDescription>Select all industries you serve</CardDescription>
                </CardHeader>
                <CardContent>
                  <ToggleGrid options={industrySectors} selected={formData.industrySectors} onToggle={(v) => toggleIn("industrySectors", v)} />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Core Capabilities</CardTitle>
                  <CardDescription>These also seed your matching keywords</CardDescription>
                </CardHeader>
                <CardContent>
                  <ToggleGrid options={capabilities} selected={formData.capabilities} onToggle={(v) => toggleIn("capabilities", v)} />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Quality Certifications</CardTitle>
                  <CardDescription>Quality/QMS credentials (separate from socioeconomic set-asides)</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ToggleGrid options={qualityCertifications} selected={formData.qualityCerts} onToggle={(v) => toggleIn("qualityCerts", v)} cols={4} />
                  <div className="space-y-3 border-t pt-4">
                    {(
                      [
                        ["qualityManual", "Quality Manual", "We have a documented quality manual"],
                        ["documentedProcesses", "Documented Processes", "We have documented work instructions and procedures"],
                        ["internalAudits", "Internal Audits", "We conduct regular internal quality audits"],
                        ["correctiveActionProcess", "Corrective Action (CAPA)", "We have a formal corrective action process"],
                        ["supplierQualification", "Supplier Qualification", "We have a supplier qualification and monitoring program"],
                      ] as const
                    ).map(([key, label, desc]) => (
                      <div key={key} className="flex items-center space-x-3">
                        <Checkbox
                          id={key}
                          checked={formData.quality[key]}
                          onCheckedChange={(c) => set("quality", { ...formData.quality, [key]: c === true })}
                        />
                        <div>
                          <Label htmlFor={key} className="font-medium cursor-pointer">{label}</Label>
                          <p className="text-xs text-muted-foreground">{desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Matching Keywords</CardTitle>
                  <CardDescription>Terms matched against SAM.gov notice titles and descriptions</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        set("keywords", Array.from(new Set([...formData.keywords, ...formData.capabilities])))
                      }
                    >
                      <Plus className="h-3 w-3 mr-1" /> Add selected capabilities as keywords
                    </Button>
                  </div>
                  <TagInput
                    label="Keywords"
                    values={formData.keywords}
                    onAdd={(v) => addTag("keywords", v)}
                    onRemove={(v) => removeTag("keywords", v)}
                    placeholder="e.g. machining, prototyping, ISO"
                  />
                </CardContent>
              </Card>
            </TabsContent>

            {/* ============ MARKET ============ */}
            <TabsContent value="market" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Target Agencies</CardTitle>
                  <CardDescription>Federal agencies you want to sell to — boosts matching for their notices</CardDescription>
                </CardHeader>
                <CardContent>
                  <TagInput
                    label="Agencies"
                    hint='e.g. "Department of Defense", "GSA", "NASA", "Department of Veterans Affairs"'
                    values={formData.targetAgencies}
                    onAdd={(v) => addTag("targetAgencies", v)}
                    onRemove={(v) => removeTag("targetAgencies", v)}
                    placeholder="e.g. Department of Defense"
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Services of Interest</CardTitle>
                  <CardDescription>Strategic Value+ services you&apos;re interested in</CardDescription>
                </CardHeader>
                <CardContent>
                  <ToggleGrid options={servicesOfInterest} selected={formData.servicesInterested} onToggle={(v) => toggleIn("servicesInterested", v)} cols={4} />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Goals & Challenges</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="primaryGoals">Primary Goals</Label>
                    <Textarea id="primaryGoals" value={formData.primaryGoals} onChange={(e) => set("primaryGoals", e.target.value)} placeholder="What are your main objectives?" rows={3} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="currentChallenges">Current Challenges</Label>
                    <Textarea id="currentChallenges" value={formData.currentChallenges} onChange={(e) => set("currentChallenges", e.target.value)} placeholder="What challenges are you facing?" rows={3} />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="timeline">Timeline</Label>
                      <Select value={formData.timeline} onValueChange={(v) => set("timeline", v)}>
                        <SelectTrigger><SelectValue placeholder="Select timeline" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="immediate">Immediate (within 1 month)</SelectItem>
                          <SelectItem value="short">Short-term (1-3 months)</SelectItem>
                          <SelectItem value="medium">Medium-term (3-6 months)</SelectItem>
                          <SelectItem value="long">Long-term (6+ months)</SelectItem>
                          <SelectItem value="exploring">Just exploring options</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="howDidYouHear">How did you hear about us?</Label>
                      <Select value={formData.howDidYouHear} onValueChange={(v) => set("howDidYouHear", v)}>
                        <SelectTrigger><SelectValue placeholder="Select option" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="referral">Referral</SelectItem>
                          <SelectItem value="search">Online Search</SelectItem>
                          <SelectItem value="linkedin">LinkedIn</SelectItem>
                          <SelectItem value="event">Trade Show/Event</SelectItem>
                          <SelectItem value="partner">Partner Organization</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* ============ REVIEW ============ */}
            <TabsContent value="review" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Primary Contact</CardTitle>
                  <CardDescription>Main point of contact for your organization</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="contactName">Full Name *</Label>
                      <Input id="contactName" value={formData.contactName} onChange={(e) => set("contactName", e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="contactTitle">Title</Label>
                      <Input id="contactTitle" value={formData.contactTitle} onChange={(e) => set("contactTitle", e.target.value)} placeholder="Operations Manager" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="contactEmail">Email *</Label>
                      <Input id="contactEmail" type="email" value={formData.contactEmail} onChange={(e) => set("contactEmail", e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="contactPhone">Phone</Label>
                      <Input id="contactPhone" type="tel" value={formData.contactPhone} onChange={(e) => set("contactPhone", e.target.value)} placeholder="(555) 123-4567" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Secondary Contact (Optional)</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="secondaryName">Full Name</Label>
                      <Input id="secondaryName" value={formData.secondaryName} onChange={(e) => set("secondaryName", e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="secondaryTitle">Title</Label>
                      <Input id="secondaryTitle" value={formData.secondaryTitle} onChange={(e) => set("secondaryTitle", e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="secondaryEmail">Email</Label>
                      <Input id="secondaryEmail" type="email" value={formData.secondaryEmail} onChange={(e) => set("secondaryEmail", e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="secondaryPhone">Phone</Label>
                      <Input id="secondaryPhone" type="tel" value={formData.secondaryPhone} onChange={(e) => set("secondaryPhone", e.target.value)} />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Profile Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2 text-sm">
                    <div><dt className="text-muted-foreground inline">Company: </dt><dd className="inline">{formData.companyName || "—"}</dd></div>
                    <div><dt className="text-muted-foreground inline">UEI: </dt><dd className="inline">{formData.uei || "—"}</dd></div>
                    <div><dt className="text-muted-foreground inline">CAGE: </dt><dd className="inline">{formData.cageCode || "—"}</dd></div>
                    <div><dt className="text-muted-foreground inline">NAICS: </dt><dd className="inline">{formData.naicsCodes.join(", ") || "—"}</dd></div>
                    <div><dt className="text-muted-foreground inline">Set-asides: </dt><dd className="inline">{setAsideCerts.filter((c) => formData.setAsides[c.id]).map((c) => c.name).join(", ") || "None"}</dd></div>
                    <div><dt className="text-muted-foreground inline">Agencies: </dt><dd className="inline">{formData.targetAgencies.join(", ") || "—"}</dd></div>
                    <div><dt className="text-muted-foreground inline">Keywords: </dt><dd className="inline">{formData.keywords.join(", ") || "—"}</dd></div>
                  </dl>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-start space-x-3">
                    <Checkbox
                      id="agreeToTerms"
                      checked={formData.agreeToTerms}
                      onCheckedChange={(c) => set("agreeToTerms", c === true)}
                    />
                    <Label htmlFor="agreeToTerms" className="text-sm font-normal cursor-pointer">
                      I certify that the information provided is accurate and agree to the{" "}
                      <Link href="/terms" className="text-primary underline">Terms of Service</Link> and{" "}
                      <Link href="/privacy" className="text-primary underline">Privacy Policy</Link>. *
                    </Label>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Navigation */}
          <div className="flex justify-between mt-8">
            <Button variant="outline" onClick={() => step(-1)} disabled={activeTab === "company"}>
              <ChevronLeft className="mr-2 h-4 w-4" /> Back
            </Button>
            {activeTab === "review" ? (
              <Button onClick={handleSubmit} disabled={isSaving || !isTabComplete("review")} className="bg-[#C8A951] hover:bg-[#b89a48]">
                {isSaving ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</>
                ) : (
                  <>Submit Registration <ChevronRight className="ml-2 h-4 w-4" /></>
                )}
              </Button>
            ) : (
              <Button onClick={() => step(1)} className="bg-[#C8A951] hover:bg-[#b89a48]">
                Next <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
