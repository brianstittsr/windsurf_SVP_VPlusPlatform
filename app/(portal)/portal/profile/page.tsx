"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
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
  DialogFooter,
} from "@/components/ui/dialog";
import {
  User,
  Building2,
  MapPin,
  Mail,
  Phone,
  Globe,
  Linkedin,
  Save,
  Plus,
  X,
  Briefcase,
  Target,
  Users,
  Award,
  Calendar,
  Shield,
  Camera,
  Upload,
  Video,
  Play,
  ExternalLink,
  Twitter,
  Facebook,
  Instagram,
  Youtube,
  MessageSquare,
  Handshake,
  Clock,
  CheckCircle,
  Settings,
  Wrench,
  FileText,
  Link as LinkIcon,
  GraduationCap,
  Star,
  Search,
  Truck,
  Brain,
  Bot,
  Zap,
  Bug,
  Lock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useUserProfile } from "@/contexts/user-profile-context";

// User roles
const userRoles = [
  { id: "affiliate", name: "Affiliate", description: "Referral partner earning commissions" },
  { id: "consultant", name: "Consultant", description: "V+ team member providing services" },
  { id: "team", name: "Team Member", description: "Core SVP team member" },
  { id: "admin", name: "Administrator", description: "Platform administrator" },
];

// Affiliate categories
const affiliateCategories = [
  { id: "manufacturing", name: "Manufacturing Operations" },
  { id: "quality", name: "Quality & ISO" },
  { id: "technology", name: "Technology & AI" },
  { id: "finance", name: "Finance & Accounting" },
  { id: "sales", name: "Sales & Marketing" },
  { id: "hr", name: "HR & Workforce" },
  { id: "supply-chain", name: "Supply Chain" },
  { id: "international", name: "International Business" },
];

// Industries
const industries = [
  "Automotive",
  "Aerospace",
  "Medical Devices",
  "Electronics",
  "Food & Beverage",
  "Plastics",
  "Metal Fabrication",
  "Machinery",
  "Consumer Goods",
  "Defense",
];

// SVP Tools list with role-based access
interface SVPTool {
  id: string;
  name: string;
  description: string;
  icon: string;
  href: string;
  teamAccess: boolean;
  affiliateAccess: boolean;
}

const svpTools: SVPTool[] = [
  { id: "apollo", name: "Apollo Search", description: "Lead generation and prospecting", icon: "search", href: "/portal/apollo", teamAccess: true, affiliateAccess: false },
  { id: "supplier", name: "Supplier Search", description: "Find and evaluate suppliers", icon: "truck", href: "/portal/suppliers", teamAccess: true, affiliateAccess: true },
  { id: "deals", name: "Deals", description: "Track and manage deals", icon: "handshake", href: "/portal/deals", teamAccess: true, affiliateAccess: true },
  { id: "calendar", name: "Calendar", description: "Schedule and manage meetings", icon: "calendar", href: "/portal/calendar", teamAccess: true, affiliateAccess: true },
  { id: "proposal", name: "Proposal Creator", description: "Create professional proposals", icon: "file-text", href: "/portal/proposals", teamAccess: true, affiliateAccess: false },
  { id: "intelliedge", name: "Ask IntelliEdge", description: "AI-powered business intelligence", icon: "brain", href: "/portal/intelliedge", teamAccess: true, affiliateAccess: false },
  { id: "linkedin", name: "LinkedIn Content", description: "Create and schedule LinkedIn posts", icon: "linkedin", href: "/portal/linkedin", teamAccess: true, affiliateAccess: false },
  { id: "docuseal", name: "DocuSeal", description: "Document signing and management", icon: "file-signature", href: "/portal/docuseal", teamAccess: true, affiliateAccess: false },
  { id: "aiworkforce", name: "AI Workforce", description: "AI agents and automation", icon: "bot", href: "/portal/ai-workforce", teamAccess: true, affiliateAccess: false },
  { id: "gohighlevel", name: "GoHighLevel", description: "CRM and marketing automation", icon: "zap", href: "/portal/gohighlevel", teamAccess: true, affiliateAccess: false },
  { id: "bugtracker", name: "Bug Tracker", description: "Report and track issues", icon: "bug", href: "/portal/bugs", teamAccess: true, affiliateAccess: false },
  { id: "availability", name: "Availability", description: "Set your availability schedule", icon: "clock", href: "/portal/availability", teamAccess: true, affiliateAccess: false },
];

// Mock meeting recordings
const mockRecordings = [
  { id: "1", title: "Affiliate Orientation Call", date: "2024-12-10", duration: "45 min", type: "onboarding" },
  { id: "2", title: "One-to-One with Sarah Chen", date: "2024-12-05", duration: "30 min", type: "networking" },
  { id: "3", title: "Monthly Affiliate Meeting", date: "2024-12-01", duration: "60 min", type: "group" },
  { id: "4", title: "ISO Training Workshop", date: "2024-11-28", duration: "90 min", type: "training" },
];

// Mock certifications
const mockCertifications = [
  { id: "1", name: "ISO 9001 Lead Auditor", issuer: "IRCA", date: "2023-06-15", expires: "2026-06-15", status: "active" },
  { id: "2", name: "Six Sigma Black Belt", issuer: "ASQ", date: "2022-03-20", expires: null, status: "active" },
  { id: "3", name: "Lean Practitioner", issuer: "SME", date: "2021-09-10", expires: "2024-09-10", status: "expiring" },
];

// Mock One-to-One history
const mockOneToOnes = [
  { id: "1", partner: "Sarah Chen", date: "2024-12-05", status: "completed", notes: "Discussed lean manufacturing collaboration" },
  { id: "2", partner: "Michael Rodriguez", date: "2024-12-12", status: "scheduled", notes: "ISO certification referral opportunities" },
  { id: "3", partner: "Jennifer Park", date: "2024-12-15", status: "pending", notes: "AI solutions for manufacturing" },
];

export default function ProfilePage() {
  const { profile: userProfile, getDisplayName, getInitials } = useUserProfile();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  
  const [profile, setProfile] = useState({
    id: "current-user",
    role: userProfile.role || "affiliate",
    firstName: userProfile.firstName || "",
    lastName: userProfile.lastName || "",
    email: userProfile.email || "",
    phone: userProfile.phone || "",
    title: userProfile.jobTitle || "",
    company: userProfile.company || "",
    location: userProfile.location || "",
    website: "",
    linkedin: "",
    twitter: "",
    facebook: "",
    instagram: "",
    youtube: "",
    bio: userProfile.bio || "",
    categories: [] as string[],
    expertise: [] as string[],
    industries: [] as string[],
    idealReferral: "",
    canOffer: "",
    lookingFor: "",
    goalsThisQuarter: "",
    uniqueValueProposition: "",
    targetClientProfile: "",
    problemsYouSolve: "",
    availability: {
      oneToOne: true,
      speaking: true,
      consulting: true,
    },
    certifications: mockCertifications,
    memberSince: "2024-01-15",
  });

  const [newExpertise, setNewExpertise] = useState("");
  const [newCertification, setNewCertification] = useState({
    name: "",
    issuer: "",
    date: "",
    expires: "",
  });
  const [isSaving, setIsSaving] = useState(false);
  const [showCertDialog, setShowCertDialog] = useState(false);

  const updateProfile = (field: string, value: any) => {
    setProfile({ ...profile, [field]: value });
  };

  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const addExpertise = () => {
    if (newExpertise.trim() && !profile.expertise.includes(newExpertise.trim())) {
      updateProfile("expertise", [...profile.expertise, newExpertise.trim()]);
      setNewExpertise("");
    }
  };

  const removeExpertise = (item: string) => {
    updateProfile("expertise", profile.expertise.filter((e) => e !== item));
  };

  const addCertification = () => {
    if (newCertification.name.trim()) {
      const cert = {
        id: Date.now().toString(),
        name: newCertification.name,
        issuer: newCertification.issuer,
        date: newCertification.date,
        expires: newCertification.expires || null,
        status: "active" as const,
      };
      updateProfile("certifications", [...profile.certifications, cert]);
      setNewCertification({ name: "", issuer: "", date: "", expires: "" });
      setShowCertDialog(false);
    }
  };

  const removeCertification = (id: string) => {
    updateProfile("certifications", profile.certifications.filter((c: any) => c.id !== id));
  };

  const toggleCategory = (categoryId: string) => {
    if (profile.categories.includes(categoryId)) {
      updateProfile("categories", profile.categories.filter((c) => c !== categoryId));
    } else {
      updateProfile("categories", [...profile.categories, categoryId]);
    }
  };

  const toggleIndustry = (industry: string) => {
    if (profile.industries.includes(industry)) {
      updateProfile("industries", profile.industries.filter((i) => i !== industry));
    } else {
      updateProfile("industries", [...profile.industries, industry]);
    }
  };

  const saveProfile = async () => {
    setIsSaving(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsSaving(false);
    alert("Profile saved successfully!");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">My Profile</h1>
          <p className="text-muted-foreground">
            Manage your profile, networking preferences, and SVP tools
          </p>
        </div>
        <Button onClick={saveProfile} disabled={isSaving}>
          <Save className="mr-2 h-4 w-4" />
          {isSaving ? "Saving..." : "Save Changes"}
        </Button>
      </div>

      {/* Profile Header Card with Photo */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-6 items-start">
            {/* Photo Upload Section */}
            <div className="relative group">
              <Avatar className="h-32 w-32 border-4 border-background shadow-lg">
                <AvatarImage src={avatarPreview || undefined} />
                <AvatarFallback className="text-3xl bg-primary/10 text-primary">
                  {getInitials()}
                </AvatarFallback>
              </Avatar>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handlePhotoUpload}
                className="hidden"
              />
              <div 
                className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                onClick={() => fileInputRef.current?.click()}
              >
                <div className="text-center text-white">
                  <Camera className="h-6 w-6 mx-auto mb-1" />
                  <span className="text-xs">Change Photo</span>
                </div>
              </div>
              <Button
                size="sm"
                variant="outline"
                className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full p-0 bg-background"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-3">
                <h2 className="text-2xl font-bold">
                  {profile.firstName || userProfile.firstName} {profile.lastName || userProfile.lastName}
                </h2>
                <Badge variant="secondary">
                  {userRoles.find((r) => r.id === profile.role)?.name || "Member"}
                </Badge>
              </div>
              <p className="text-muted-foreground">{profile.title || "Add your professional title"}</p>
              <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                {profile.company && (
                  <span className="flex items-center gap-1">
                    <Building2 className="h-4 w-4" />
                    {profile.company}
                  </span>
                )}
                {profile.location && (
                  <span className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    {profile.location}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  Member since {new Date(profile.memberSince).toLocaleDateString()}
                </span>
              </div>
              {/* Quick Stats */}
              <div className="flex gap-6 pt-2">
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">{mockOneToOnes.length}</div>
                  <div className="text-xs text-muted-foreground">One-to-Ones</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">{profile.certifications.length}</div>
                  <div className="text-xs text-muted-foreground">Certifications</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">{mockRecordings.length}</div>
                  <div className="text-xs text-muted-foreground">Recordings</div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabbed Content */}
      <Tabs defaultValue="basic" className="space-y-6">
        <TabsList className="grid grid-cols-7 w-full">
          <TabsTrigger value="basic" className="text-xs sm:text-sm">
            <User className="h-4 w-4 mr-1 hidden sm:inline" />
            Basic Info
          </TabsTrigger>
          <TabsTrigger value="professional" className="text-xs sm:text-sm">
            <Briefcase className="h-4 w-4 mr-1 hidden sm:inline" />
            Professional
          </TabsTrigger>
          <TabsTrigger value="certifications" className="text-xs sm:text-sm">
            <Award className="h-4 w-4 mr-1 hidden sm:inline" />
            Certifications
          </TabsTrigger>
          <TabsTrigger value="networking" className="text-xs sm:text-sm">
            <Handshake className="h-4 w-4 mr-1 hidden sm:inline" />
            Networking
          </TabsTrigger>
          <TabsTrigger value="tools" className="text-xs sm:text-sm">
            <Wrench className="h-4 w-4 mr-1 hidden sm:inline" />
            SVP Tools
          </TabsTrigger>
          <TabsTrigger value="recordings" className="text-xs sm:text-sm">
            <Video className="h-4 w-4 mr-1 hidden sm:inline" />
            Recordings
          </TabsTrigger>
          <TabsTrigger value="social" className="text-xs sm:text-sm">
            <Globe className="h-4 w-4 mr-1 hidden sm:inline" />
            Social
          </TabsTrigger>
        </TabsList>

        {/* Basic Info Tab */}
        <TabsContent value="basic" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
              <CardDescription>Your basic contact and company details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    value={profile.firstName}
                    onChange={(e) => updateProfile("firstName", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    value={profile.lastName}
                    onChange={(e) => updateProfile("lastName", e.target.value)}
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      value={profile.email}
                      onChange={(e) => updateProfile("email", e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="phone"
                      value={profile.phone}
                      onChange={(e) => updateProfile("phone", e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="company">Company</Label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="company"
                      value={profile.company}
                      onChange={(e) => updateProfile("company", e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="location">Location</Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="location"
                      value={profile.location}
                      onChange={(e) => updateProfile("location", e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                  id="bio"
                  value={profile.bio}
                  onChange={(e) => updateProfile("bio", e.target.value)}
                  rows={4}
                  placeholder="Tell others about yourself and your background..."
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Role & Permissions</CardTitle>
              <CardDescription>Your current role and access level</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4 p-4 bg-muted rounded-lg">
                <Shield className="h-8 w-8 text-primary" />
                <div>
                  <p className="font-medium">
                    {userRoles.find((r) => r.id === profile.role)?.name}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {userRoles.find((r) => r.id === profile.role)?.description}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Professional Info Tab */}
        <TabsContent value="professional" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Professional Title</CardTitle>
              <CardDescription>Your role and professional identity</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Professional Title</Label>
                <Input
                  id="title"
                  value={profile.title}
                  onChange={(e) => updateProfile("title", e.target.value)}
                  placeholder="e.g., Manufacturing Consultant, ISO Specialist"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="website">Website</Label>
                <div className="relative">
                  <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="website"
                    value={profile.website}
                    onChange={(e) => updateProfile("website", e.target.value)}
                    className="pl-10"
                    placeholder="https://yourwebsite.com"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Categories</CardTitle>
              <CardDescription>Select the categories that best describe your expertise</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {affiliateCategories.map((cat) => (
                  <Badge
                    key={cat.id}
                    variant={profile.categories.includes(cat.id) ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => toggleCategory(cat.id)}
                  >
                    {cat.name}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Industries</CardTitle>
              <CardDescription>Select the industries you have experience in</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {industries.map((industry) => (
                  <Badge
                    key={industry}
                    variant={profile.industries.includes(industry) ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => toggleIndustry(industry)}
                  >
                    {industry}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Skills & Expertise</CardTitle>
              <CardDescription>Add your specific skills and areas of expertise</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {profile.expertise.map((skill) => (
                  <Badge key={skill} variant="secondary" className="pr-1">
                    {skill}
                    <button
                      onClick={() => removeExpertise(skill)}
                      className="ml-2 hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
                {profile.expertise.length === 0 && (
                  <p className="text-sm text-muted-foreground">No skills added yet</p>
                )}
              </div>
              <div className="flex gap-2">
                <Input
                  placeholder="Add a skill..."
                  value={newExpertise}
                  onChange={(e) => setNewExpertise(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addExpertise()}
                />
                <Button onClick={addExpertise}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Certifications Tab */}
        <TabsContent value="certifications" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Professional Certifications</CardTitle>
                  <CardDescription>Manage your certifications and credentials</CardDescription>
                </div>
                <Button onClick={() => setShowCertDialog(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Certification
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {profile.certifications.map((cert: any) => (
                  <div
                    key={cert.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex items-center gap-4">
                      <div className={cn(
                        "p-2 rounded-full",
                        cert.status === "active" ? "bg-green-100" : "bg-yellow-100"
                      )}>
                        <GraduationCap className={cn(
                          "h-5 w-5",
                          cert.status === "active" ? "text-green-600" : "text-yellow-600"
                        )} />
                      </div>
                      <div>
                        <p className="font-medium">{cert.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {cert.issuer} • Issued {new Date(cert.date).toLocaleDateString()}
                        </p>
                        {cert.expires && (
                          <p className="text-xs text-muted-foreground">
                            Expires: {new Date(cert.expires).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={cert.status === "active" ? "default" : "secondary"}>
                        {cert.status === "active" ? "Active" : "Expiring Soon"}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeCertification(cert.id)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
                {profile.certifications.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Award className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No certifications added yet</p>
                    <Button variant="outline" className="mt-4" onClick={() => setShowCertDialog(true)}>
                      Add Your First Certification
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Networking Tab */}
        <TabsContent value="networking" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Networking Profile</CardTitle>
              <CardDescription>
                This information helps other affiliates understand how to refer business to you
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="idealReferral">Who is your ideal referral partner?</Label>
                <Textarea
                  id="idealReferral"
                  value={profile.idealReferral}
                  onChange={(e) => updateProfile("idealReferral", e.target.value)}
                  rows={3}
                  placeholder="Describe the type of affiliate who would be a great referral partner for you..."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="uniqueValueProposition">What is your unique value proposition?</Label>
                <Textarea
                  id="uniqueValueProposition"
                  value={profile.uniqueValueProposition}
                  onChange={(e) => updateProfile("uniqueValueProposition", e.target.value)}
                  rows={3}
                  placeholder="What makes you different from others in your field?"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="problemsYouSolve">What problems do you solve for clients?</Label>
                <Textarea
                  id="problemsYouSolve"
                  value={profile.problemsYouSolve}
                  onChange={(e) => updateProfile("problemsYouSolve", e.target.value)}
                  rows={3}
                  placeholder="Describe the main challenges you help clients overcome..."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="targetClientProfile">Describe your ideal client</Label>
                <Textarea
                  id="targetClientProfile"
                  value={profile.targetClientProfile}
                  onChange={(e) => updateProfile("targetClientProfile", e.target.value)}
                  rows={3}
                  placeholder="Industry, company size, specific needs..."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="goalsThisQuarter">What are your goals this quarter?</Label>
                <Textarea
                  id="goalsThisQuarter"
                  value={profile.goalsThisQuarter}
                  onChange={(e) => updateProfile("goalsThisQuarter", e.target.value)}
                  rows={3}
                  placeholder="What do you hope to achieve through the affiliate network?"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>One-to-One History</CardTitle>
              <CardDescription>Your networking meetings with other affiliates</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {mockOneToOnes.map((meeting) => (
                  <div
                    key={meeting.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "p-2 rounded-full",
                        meeting.status === "completed" ? "bg-green-100" :
                        meeting.status === "scheduled" ? "bg-blue-100" : "bg-yellow-100"
                      )}>
                        {meeting.status === "completed" ? (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        ) : meeting.status === "scheduled" ? (
                          <Calendar className="h-4 w-4 text-blue-600" />
                        ) : (
                          <Clock className="h-4 w-4 text-yellow-600" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium">One-to-One with {meeting.partner}</p>
                        <p className="text-sm text-muted-foreground">{meeting.notes}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant={
                        meeting.status === "completed" ? "default" :
                        meeting.status === "scheduled" ? "secondary" : "outline"
                      }>
                        {meeting.status}
                      </Badge>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(meeting.date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Availability Settings</CardTitle>
              <CardDescription>Control how others can connect with you</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <Users className="h-5 w-5 text-primary" />
                  <div>
                    <Label>Available for One-to-Ones</Label>
                    <p className="text-sm text-muted-foreground">
                      Allow other affiliates to request networking meetings
                    </p>
                  </div>
                </div>
                <Switch
                  checked={profile.availability.oneToOne}
                  onCheckedChange={(checked) =>
                    updateProfile("availability", { ...profile.availability, oneToOne: checked })
                  }
                />
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <Briefcase className="h-5 w-5 text-primary" />
                  <div>
                    <Label>Available for Consulting</Label>
                    <p className="text-sm text-muted-foreground">
                      Show as available for consulting engagements
                    </p>
                  </div>
                </div>
                <Switch
                  checked={profile.availability.consulting}
                  onCheckedChange={(checked) =>
                    updateProfile("availability", { ...profile.availability, consulting: checked })
                  }
                />
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <Target className="h-5 w-5 text-primary" />
                  <div>
                    <Label>Available for Speaking</Label>
                    <p className="text-sm text-muted-foreground">
                      Show as available for speaking engagements and workshops
                    </p>
                  </div>
                </div>
                <Switch
                  checked={profile.availability.speaking}
                  onCheckedChange={(checked) =>
                    updateProfile("availability", { ...profile.availability, speaking: checked })
                  }
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* SVP Tools Tab */}
        <TabsContent value="tools" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>SVP Tools</CardTitle>
              <CardDescription>
                Access Strategic Value+ platform tools based on your role
                {(profile.role === "team_member" || profile.role === "admin") && (
                  <Badge variant="secondary" className="ml-2">Team Access</Badge>
                )}
                {profile.role === "affiliate" && (
                  <Badge variant="outline" className="ml-2">Affiliate Access</Badge>
                )}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                {svpTools.map((tool) => {
                  const isTeamOrAdmin = profile.role === "team_member" || profile.role === "admin";
                  const hasAccess = isTeamOrAdmin ? tool.teamAccess : tool.affiliateAccess;
                  const isGrayedOut = !hasAccess;

                  // Get the appropriate icon
                  const getToolIcon = () => {
                    switch (tool.icon) {
                      case "search": return <Search className="h-5 w-5" />;
                      case "truck": return <Truck className="h-5 w-5" />;
                      case "handshake": return <Handshake className="h-5 w-5" />;
                      case "calendar": return <Calendar className="h-5 w-5" />;
                      case "file-text": return <FileText className="h-5 w-5" />;
                      case "brain": return <Brain className="h-5 w-5" />;
                      case "linkedin": return <Linkedin className="h-5 w-5" />;
                      case "file-signature": return <FileText className="h-5 w-5" />;
                      case "bot": return <Bot className="h-5 w-5" />;
                      case "zap": return <Zap className="h-5 w-5" />;
                      case "bug": return <Bug className="h-5 w-5" />;
                      case "clock": return <Clock className="h-5 w-5" />;
                      default: return <Wrench className="h-5 w-5" />;
                    }
                  };

                  return (
                    <div
                      key={tool.id}
                      className={cn(
                        "flex items-center justify-between p-4 border rounded-lg transition-all",
                        isGrayedOut 
                          ? "opacity-50 bg-muted/30 cursor-not-allowed" 
                          : "hover:bg-muted/50 hover:shadow-sm cursor-pointer"
                      )}
                    >
                      <div className="flex items-center gap-4">
                        <div className={cn(
                          "p-2 rounded-lg",
                          isGrayedOut ? "bg-muted" : "bg-primary/10"
                        )}>
                          <div className={cn(
                            isGrayedOut ? "text-muted-foreground" : "text-primary"
                          )}>
                            {getToolIcon()}
                          </div>
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className={cn(
                              "font-medium",
                              isGrayedOut && "text-muted-foreground"
                            )}>
                              {tool.name}
                            </p>
                            {isGrayedOut && (
                              <Lock className="h-3 w-3 text-muted-foreground" />
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">{tool.description}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {isGrayedOut ? (
                          <Badge variant="outline" className="text-muted-foreground">
                            Team Only
                          </Badge>
                        ) : (
                          <Button variant="outline" size="sm" asChild>
                            <a href={tool.href}>
                              Open
                              <ExternalLink className="ml-2 h-3 w-3" />
                            </a>
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Access Legend */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Access Legend</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded bg-primary/10">
                    <Wrench className="h-4 w-4 text-primary" />
                  </div>
                  <span>Full Access</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded bg-muted">
                    <Lock className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <span className="text-muted-foreground">Team Only (Upgrade Required)</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Meeting Recordings Tab */}
        <TabsContent value="recordings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Meeting Recordings</CardTitle>
              <CardDescription>Access recordings from your meetings and training sessions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockRecordings.map((recording) => (
                  <div
                    key={recording.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <Video className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">{recording.title}</p>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <span>{new Date(recording.date).toLocaleDateString()}</span>
                          <span>•</span>
                          <span>{recording.duration}</span>
                          <Badge variant="outline" className="text-xs">
                            {recording.type}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm">
                        <Play className="mr-2 h-4 w-4" />
                        Watch
                      </Button>
                      <Button variant="ghost" size="icon">
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
                {mockRecordings.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Video className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No recordings available yet</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Social Tab */}
        <TabsContent value="social" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Social Media Profiles</CardTitle>
              <CardDescription>Connect your social media accounts</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="linkedin">LinkedIn</Label>
                <div className="relative">
                  <Linkedin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#0077B5]" />
                  <Input
                    id="linkedin"
                    value={profile.linkedin}
                    onChange={(e) => updateProfile("linkedin", e.target.value)}
                    className="pl-10"
                    placeholder="https://linkedin.com/in/yourprofile"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="twitter">Twitter / X</Label>
                <div className="relative">
                  <Twitter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="twitter"
                    value={profile.twitter}
                    onChange={(e) => updateProfile("twitter", e.target.value)}
                    className="pl-10"
                    placeholder="https://twitter.com/yourhandle"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="facebook">Facebook</Label>
                <div className="relative">
                  <Facebook className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#1877F2]" />
                  <Input
                    id="facebook"
                    value={profile.facebook}
                    onChange={(e) => updateProfile("facebook", e.target.value)}
                    className="pl-10"
                    placeholder="https://facebook.com/yourpage"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="instagram">Instagram</Label>
                <div className="relative">
                  <Instagram className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#E4405F]" />
                  <Input
                    id="instagram"
                    value={profile.instagram}
                    onChange={(e) => updateProfile("instagram", e.target.value)}
                    className="pl-10"
                    placeholder="https://instagram.com/yourhandle"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="youtube">YouTube</Label>
                <div className="relative">
                  <Youtube className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#FF0000]" />
                  <Input
                    id="youtube"
                    value={profile.youtube}
                    onChange={(e) => updateProfile("youtube", e.target.value)}
                    className="pl-10"
                    placeholder="https://youtube.com/@yourchannel"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Add Certification Dialog */}
      <Dialog open={showCertDialog} onOpenChange={setShowCertDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Certification</DialogTitle>
            <DialogDescription>
              Add a professional certification to your profile
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="certName">Certification Name *</Label>
              <Input
                id="certName"
                value={newCertification.name}
                onChange={(e) => setNewCertification({ ...newCertification, name: e.target.value })}
                placeholder="e.g., ISO 9001 Lead Auditor"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="certIssuer">Issuing Organization</Label>
              <Input
                id="certIssuer"
                value={newCertification.issuer}
                onChange={(e) => setNewCertification({ ...newCertification, issuer: e.target.value })}
                placeholder="e.g., IRCA, ASQ, SME"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="certDate">Issue Date</Label>
                <Input
                  id="certDate"
                  type="date"
                  value={newCertification.date}
                  onChange={(e) => setNewCertification({ ...newCertification, date: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="certExpires">Expiration Date</Label>
                <Input
                  id="certExpires"
                  type="date"
                  value={newCertification.expires}
                  onChange={(e) => setNewCertification({ ...newCertification, expires: e.target.value })}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCertDialog(false)}>
              Cancel
            </Button>
            <Button onClick={addCertification} disabled={!newCertification.name.trim()}>
              Add Certification
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
