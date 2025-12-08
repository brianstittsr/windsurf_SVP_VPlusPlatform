"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
} from "lucide-react";
import { cn } from "@/lib/utils";

// User roles
const userRoles = [
  { id: "affiliate", name: "Affiliate", description: "Referral partner earning commissions" },
  { id: "consultant", name: "Consultant", description: "V+ team member providing services" },
  { id: "customer", name: "Customer", description: "Manufacturing company client" },
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

// Mock user profile
const mockProfile = {
  id: "current-user",
  role: "affiliate",
  firstName: "John",
  lastName: "Doe",
  email: "john.doe@example.com",
  phone: "+1 (555) 123-4567",
  title: "Manufacturing Consultant",
  company: "Doe Consulting LLC",
  location: "Chicago, IL",
  website: "https://doeconsulting.com",
  linkedin: "https://linkedin.com/in/johndoe",
  bio: "15+ years of experience helping manufacturers optimize operations and achieve ISO certification.",
  categories: ["manufacturing", "quality"],
  expertise: ["Lean Manufacturing", "Six Sigma", "ISO 9001", "Process Optimization"],
  industries: ["Automotive", "Aerospace", "Medical Devices"],
  idealReferral: "Small to mid-sized manufacturers looking to improve quality systems or achieve ISO certification.",
  canOffer: "ISO implementation support, lean consulting, process improvement workshops.",
  lookingFor: "Connections to manufacturers needing quality management systems, referrals from technology consultants.",
  availability: {
    oneToOne: true,
    speaking: true,
    consulting: true,
  },
  certifications: ["ISO 9001 Lead Auditor", "Six Sigma Black Belt", "Lean Practitioner"],
  memberSince: "2024-01-15",
};

export default function ProfilePage() {
  const [profile, setProfile] = useState(mockProfile);
  const [newExpertise, setNewExpertise] = useState("");
  const [newCertification, setNewCertification] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const updateProfile = (field: string, value: any) => {
    setProfile({ ...profile, [field]: value });
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
    if (newCertification.trim() && !profile.certifications.includes(newCertification.trim())) {
      updateProfile("certifications", [...profile.certifications, newCertification.trim()]);
      setNewCertification("");
    }
  };

  const removeCertification = (item: string) => {
    updateProfile("certifications", profile.certifications.filter((c) => c !== item));
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
    // Simulate API call
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
            Manage your profile and networking preferences
          </p>
        </div>
        <Button onClick={saveProfile} disabled={isSaving}>
          <Save className="mr-2 h-4 w-4" />
          {isSaving ? "Saving..." : "Save Changes"}
        </Button>
      </div>

      {/* Profile Header Card */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-6 items-start">
            <div className="relative">
              <Avatar className="h-24 w-24">
                <AvatarImage src={undefined} />
                <AvatarFallback className="text-2xl">
                  {profile.firstName[0]}{profile.lastName[0]}
                </AvatarFallback>
              </Avatar>
              <Button
                size="sm"
                variant="outline"
                className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full p-0"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-3">
                <h2 className="text-2xl font-bold">
                  {profile.firstName} {profile.lastName}
                </h2>
                <Badge variant="secondary">
                  {userRoles.find((r) => r.id === profile.role)?.name}
                </Badge>
              </div>
              <p className="text-muted-foreground">{profile.title}</p>
              <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Building2 className="h-4 w-4" />
                  {profile.company}
                </span>
                <span className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  {profile.location}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  Member since {new Date(profile.memberSince).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="basic" className="space-y-6">
        <TabsList>
          <TabsTrigger value="basic">Basic Info</TabsTrigger>
          <TabsTrigger value="expertise">Expertise</TabsTrigger>
          <TabsTrigger value="networking">Networking</TabsTrigger>
          <TabsTrigger value="availability">Availability</TabsTrigger>
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
                  <Input
                    id="email"
                    type="email"
                    value={profile.email}
                    onChange={(e) => updateProfile("email", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={profile.phone}
                    onChange={(e) => updateProfile("phone", e.target.value)}
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="title">Professional Title</Label>
                  <Input
                    id="title"
                    value={profile.title}
                    onChange={(e) => updateProfile("title", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="company">Company</Label>
                  <Input
                    id="company"
                    value={profile.company}
                    onChange={(e) => updateProfile("company", e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  value={profile.location}
                  onChange={(e) => updateProfile("location", e.target.value)}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="website">Website</Label>
                  <Input
                    id="website"
                    value={profile.website}
                    onChange={(e) => updateProfile("website", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="linkedin">LinkedIn</Label>
                  <Input
                    id="linkedin"
                    value={profile.linkedin}
                    onChange={(e) => updateProfile("linkedin", e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                  id="bio"
                  value={profile.bio}
                  onChange={(e) => updateProfile("bio", e.target.value)}
                  rows={4}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Expertise Tab */}
        <TabsContent value="expertise" className="space-y-6">
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

          <Card>
            <CardHeader>
              <CardTitle>Certifications</CardTitle>
              <CardDescription>Add your professional certifications</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {profile.certifications.map((cert) => (
                  <Badge key={cert} variant="secondary" className="pr-1">
                    <Award className="h-3 w-3 mr-1" />
                    {cert}
                    <button
                      onClick={() => removeCertification(cert)}
                      className="ml-2 hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  placeholder="Add a certification..."
                  value={newCertification}
                  onChange={(e) => setNewCertification(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addCertification()}
                />
                <Button onClick={addCertification}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Networking Tab */}
        <TabsContent value="networking" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Ideal Referral Profile</CardTitle>
              <CardDescription>
                Describe your ideal client or referral so others can help you
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                value={profile.idealReferral}
                onChange={(e) => updateProfile("idealReferral", e.target.value)}
                rows={4}
                placeholder="Describe the type of clients or referrals you're looking for..."
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>What I Can Offer</CardTitle>
              <CardDescription>
                Describe the services and value you can provide to referrals
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                value={profile.canOffer}
                onChange={(e) => updateProfile("canOffer", e.target.value)}
                rows={4}
                placeholder="What services or expertise can you offer to potential clients?"
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>What I'm Looking For</CardTitle>
              <CardDescription>
                Describe the connections and opportunities you're seeking
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                value={profile.lookingFor}
                onChange={(e) => updateProfile("lookingFor", e.target.value)}
                rows={4}
                placeholder="What types of connections or referrals are you looking for?"
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Availability Tab */}
        <TabsContent value="availability" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Availability Settings</CardTitle>
              <CardDescription>
                Control how others can connect with you
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
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
      </Tabs>
    </div>
  );
}
