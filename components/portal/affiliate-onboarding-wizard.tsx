"use client";

import { useState, useCallback } from "react";
import { useUserProfile } from "@/contexts/user-profile-context";
import { db } from "@/lib/firebase";
import { collection, addDoc, Timestamp, doc, setDoc } from "firebase/firestore";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Handshake,
  CheckCircle,
  ChevronRight,
  ChevronLeft,
  Users,
  Target,
  MessageSquare,
  Calendar,
  DollarSign,
  FileText,
  Star,
  Lightbulb,
  Award,
  Loader2,
  Wand2,
  Sparkles,
  User,
  Building,
  MapPin,
  Phone,
  Mail,
  Briefcase,
  ExternalLink,
  Globe,
  Linkedin,
} from "lucide-react";
import { useRouter } from "next/navigation";

// AI Enhancement prompts for each field
const aiEnhancementPrompts: Record<string, string> = {
  expertise: "Transform these bullet points about professional expertise into a polished, comma-separated list of specific skills and areas of expertise suitable for a professional networking profile:",
  idealReferralPartner: "Transform these bullet points about ideal referral partners into a professional paragraph describing the types of professionals this person works best with and wants to connect with:",
  topReferralSources: "Transform these bullet points about referral sources into a concise, professional description of where this person's best business referrals typically come from:",
  uniqueValueProposition: "Transform these bullet points into a compelling unique value proposition paragraph that highlights what makes this professional stand out:",
  problemsYouSolve: "Transform these bullet points into a clear, professional description of the business problems and challenges this person helps clients solve:",
  targetClientProfile: "Transform these bullet points into a professional description of the ideal client profile this person serves:",
  goalsThisQuarter: "Transform these bullet points into clear, actionable networking goals for this quarter:",
  successStory: "Transform these bullet points into a compelling success story or case study that demonstrates the value this professional delivers:",
};

// AI-Enhanced Textarea Component
function AIEnhancedTextarea({
  id,
  value,
  onChange,
  placeholder,
  rows = 3,
  fieldKey,
  label,
}: {
  id: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  rows?: number;
  fieldKey: string;
  label?: string;
}) {
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const enhanceWithAI = useCallback(async () => {
    if (!value.trim()) {
      setError("Please enter some bullet points or notes first");
      setTimeout(() => setError(null), 3000);
      return;
    }

    setIsEnhancing(true);
    setError(null);

    try {
      const response = await fetch("/api/ai/enhance-text", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: value,
          prompt: aiEnhancementPrompts[fieldKey] || "Enhance this text to be more professional and polished:",
          fieldType: fieldKey,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to enhance text");
      }

      const data = await response.json();
      if (data.enhancedText) {
        onChange(data.enhancedText);
      }
    } catch (err) {
      console.error("AI enhancement error:", err);
      // Fallback: simple bullet-to-prose conversion
      const lines = value.split("\n").map(line => line.replace(/^[-•*]\s*/, "").trim()).filter(Boolean);
      if (lines.length > 0) {
        const enhanced = lines.join(". ") + ".";
        onChange(enhanced.charAt(0).toUpperCase() + enhanced.slice(1));
      }
    } finally {
      setIsEnhancing(false);
    }
  }, [value, fieldKey, onChange]);

  return (
    <div className="space-y-2">
      {label && <Label htmlFor={id}>{label}</Label>}
      <div className="relative">
        <Textarea
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={rows}
          className="pr-12"
        />
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-2 top-2 h-8 w-8 text-primary hover:text-primary hover:bg-primary/10"
                onClick={enhanceWithAI}
                disabled={isEnhancing}
              >
                {isEnhancing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Wand2 className="h-4 w-4" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="left">
              <p className="text-xs">Enhance with AI</p>
              <p className="text-xs text-muted-foreground">Enter bullet points, then click to polish</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
      <p className="text-xs text-muted-foreground flex items-center gap-1">
        <Wand2 className="h-3 w-3" />
        Tip: Enter bullet points (- item) then click the wand to enhance with AI
      </p>
    </div>
  );
}

// Circular progress component
function CircularProgress({ percentage, size = 100, strokeWidth = 8 }: { percentage: number; size?: number; strokeWidth?: number }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="none"
          className="text-muted/20"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="text-primary transition-all duration-500"
        />
      </svg>
      <div className="absolute flex flex-col items-center justify-center">
        <span className="text-xl font-bold">{percentage}%</span>
      </div>
    </div>
  );
}

// Affiliate categories for expertise selection
const affiliateCategories = [
  { id: "manufacturing", name: "Manufacturing Operations", icon: "🏭" },
  { id: "quality", name: "Quality & ISO", icon: "✅" },
  { id: "technology", name: "Technology & AI", icon: "🤖" },
  { id: "finance", name: "Finance & Accounting", icon: "💰" },
  { id: "sales", name: "Sales & Marketing", icon: "📈" },
  { id: "hr", name: "HR & Workforce", icon: "👥" },
  { id: "supply-chain", name: "Supply Chain", icon: "🔗" },
  { id: "international", name: "International Business", icon: "🌍" },
];

// Affiliate commitment items
const affiliateCommitments = [
  {
    icon: Calendar,
    title: "Monthly Networking Meetings",
    description: "Attend at least 2 affiliate networking meetings per month",
  },
  {
    icon: Users,
    title: "One-to-One Meetings",
    description: "Complete at least 4 One-to-One meetings with other affiliates monthly",
  },
  {
    icon: Target,
    title: "Referral Generation",
    description: "Actively identify and refer qualified leads to the SVP network",
  },
  {
    icon: MessageSquare,
    title: "Communication",
    description: "Respond to referral requests and communications within 24-48 hours",
  },
  {
    icon: DollarSign,
    title: "Revenue Sharing",
    description: "Participate in the SVP revenue sharing model as outlined in your agreement",
  },
  {
    icon: Award,
    title: "Professional Standards",
    description: "Maintain professional standards and represent SVP values in all interactions",
  },
];

// Industry options for business info
const industries = [
  "Manufacturing", "Technology", "Healthcare", "Finance", "Retail",
  "Construction", "Professional Services", "Education", "Hospitality",
  "Transportation", "Real Estate", "Other",
];

// Geographic focus options
const geographicOptions = ["Local", "Regional", "National", "International"];

// Networking goals options
const networkingGoalOptions = [
  "Generate referrals for my business",
  "Refer clients to other affiliates",
  "Learn from other business owners",
  "Expand my professional network",
  "Find strategic partnerships",
];

// Comprehensive steps - includes profile, business info, expertise, and networking
const steps = [
  { id: 1, title: "Welcome", icon: Handshake },
  { id: 2, title: "Commitments", icon: FileText },
  { id: 3, title: "Profile", icon: User },
  { id: 4, title: "Company", icon: Building },
  { id: 5, title: "Business", icon: Briefcase },
  { id: 6, title: "Expertise", icon: Star },
  { id: 7, title: "Partners", icon: Users },
  { id: 8, title: "Availability", icon: Calendar },
  { id: 9, title: "Complete!", icon: CheckCircle },
];

export function AffiliateOnboardingWizard() {
  const { profile, updateProfile, saveProfile, networkingCompletion, showAffiliateOnboarding, setShowAffiliateOnboarding } = useUserProfile();
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [acknowledgedCommitments, setAcknowledgedCommitments] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<string[]>(profile.networkingProfile.categories || []);
  const [expertise, setExpertise] = useState<string>(profile.networkingProfile.expertise.join(", ") || "");
  
  // Profile data state
  const [profileData, setProfileData] = useState({
    firstName: profile.firstName || "",
    lastName: profile.lastName || "",
    email: profile.email || "",
    phone: profile.phone || "",
    company: profile.company || "",
    jobTitle: profile.jobTitle || "",
    location: profile.location || "",
    bio: profile.bio || "",
    linkedIn: (profile as any).linkedIn || "",
    website: (profile as any).website || "",
  });

  // Business/Networking profile data state (from Networking Profile Setup form)
  const [businessData, setBusinessData] = useState({
    businessType: (profile.networkingProfile as any).businessType || "",
    industry: (profile.networkingProfile as any).industry || [],
    targetCustomers: (profile.networkingProfile as any).targetCustomers || "",
    servicesOffered: (profile.networkingProfile as any).servicesOffered || "",
    geographicFocus: (profile.networkingProfile as any).geographicFocus || [],
    networkingGoals: (profile.networkingProfile as any).networkingGoals || [],
    meetingFrequency: (profile.networkingProfile as any).meetingFrequency || "",
    availableDays: (profile.networkingProfile as any).availableDays || [],
    timePreference: (profile.networkingProfile as any).timePreference || "",
    communicationPreference: (profile.networkingProfile as any).communicationPreference || "",
  });

  // Networking data state
  const [networkingData, setNetworkingData] = useState({
    idealReferralPartner: profile.networkingProfile.idealReferralPartner || "",
    topReferralSources: profile.networkingProfile.topReferralSources || "",
    goalsThisQuarter: profile.networkingProfile.goalsThisQuarter || "",
    uniqueValueProposition: profile.networkingProfile.uniqueValueProposition || "",
    targetClientProfile: profile.networkingProfile.targetClientProfile || "",
    problemsYouSolve: profile.networkingProfile.problemsYouSolve || "",
    successStory: profile.networkingProfile.successStory || "",
  });

  // Helper to update business data fields
  const updateBusinessField = (field: string, value: any) => {
    setBusinessData((prev) => ({ ...prev, [field]: value }));
  };

  // Helper to toggle array items
  const toggleArrayItem = (array: string[], item: string) => {
    if (array.includes(item)) {
      return array.filter((i) => i !== item);
    }
    return [...array, item];
  };

  // Helper to update profile data fields
  const updateProfileField = (field: string, value: string) => {
    setProfileData((prev) => ({ ...prev, [field]: value }));
  };

  // Helper to update networking data fields
  const updateNetworkingField = (field: string, value: string) => {
    setNetworkingData((prev) => ({ ...prev, [field]: value }));
  };

  const handleCategoryToggle = (categoryId: string) => {
    setSelectedCategories((prev) =>
      prev.includes(categoryId)
        ? prev.filter((c) => c !== categoryId)
        : [...prev, categoryId]
    );
  };

  const handleNetworkingChange = (field: string, value: string) => {
    setNetworkingData((prev) => ({ ...prev, [field]: value }));
  };

  const handleNext = () => {
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const [isSaving, setIsSaving] = useState(false);

  const handleComplete = async () => {
    setIsSaving(true);
    
    try {
      // Create Team Member document in Firebase with all profile and networking data
      const teamMemberData = {
        firstName: profileData.firstName,
        lastName: profileData.lastName,
        emailPrimary: profileData.email,
        mobile: profileData.phone || "",
        expertise: expertise,
        title: profileData.jobTitle || "",
        company: profileData.company || "",
        location: profileData.location || "",
        bio: profileData.bio || "",
        avatar: profile.avatarUrl || "",
        linkedIn: profileData.linkedIn || "",
        website: profileData.website || "",
        role: "affiliate" as const,
        status: "active" as const,
        // Networking profile data (includes business data)
        networkingProfile: {
          categories: selectedCategories,
          expertise: expertise.split(",").map((e) => e.trim()).filter((e) => e),
          ...networkingData,
          ...businessData,
        },
        affiliateOnboardingComplete: true,
        affiliateAgreementSigned: true,
        affiliateAgreementDate: new Date().toISOString(),
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      };

      // Save to Firebase team_members collection
      if (!db) {
        throw new Error("Firebase not initialized");
      }
      const teamMembersRef = collection(db, "team_members");
      const docRef = await addDoc(teamMembersRef, teamMemberData);
      
      console.log("Team Member created with ID:", docRef.id);

      // Update local profile state with all collected data
      updateProfile({
        id: docRef.id,
        firstName: profileData.firstName,
        lastName: profileData.lastName,
        email: profileData.email,
        phone: profileData.phone,
        company: profileData.company,
        jobTitle: profileData.jobTitle,
        location: profileData.location,
        bio: profileData.bio,
        affiliateOnboardingComplete: true,
        networkingProfile: {
          ...profile.networkingProfile,
          categories: selectedCategories,
          expertise: expertise.split(",").map((e) => e.trim()).filter((e) => e),
          ...networkingData,
          ...businessData,
        },
      });

      // Save to Firestore
      await saveProfile();
      
      setShowAffiliateOnboarding(false);
      
      // Redirect to profile page
      router.push("/portal/profile");
    } catch (error) {
      console.error("Error saving affiliate data to Firebase:", error);
      // Still update local state even if Firebase fails
      updateProfile({
        firstName: profileData.firstName,
        lastName: profileData.lastName,
        email: profileData.email,
        phone: profileData.phone,
        company: profileData.company,
        jobTitle: profileData.jobTitle,
        location: profileData.location,
        bio: profileData.bio,
        affiliateOnboardingComplete: true,
        networkingProfile: {
          ...profile.networkingProfile,
          categories: selectedCategories,
          expertise: expertise.split(",").map((e) => e.trim()).filter((e) => e),
          ...networkingData,
          ...businessData,
        },
      });
      setShowAffiliateOnboarding(false);
      router.push("/portal/profile");
    } finally {
      setIsSaving(false);
    }
  };

  const isStepValid = () => {
    switch (currentStep) {
      case 1: // Welcome
        return true;
      case 2: // Commitments
        return acknowledgedCommitments;
      case 3: // Profile (name, email, phone)
        return (
          profileData.firstName.trim() !== "" &&
          profileData.lastName.trim() !== "" &&
          profileData.email.trim() !== "" &&
          profileData.phone.trim() !== ""
        );
      case 4: // Company (company, title, location)
        return (
          profileData.company.trim() !== "" &&
          profileData.jobTitle.trim() !== "" &&
          profileData.location.trim() !== ""
        );
      case 5: // Business Info (business type, industry)
        return businessData.businessType !== "" && businessData.industry.length > 0;
      case 6: // Expertise
        return selectedCategories.length > 0 && expertise.trim() !== "";
      case 7: // Partners & Value
        return (
          networkingData.idealReferralPartner.trim() !== "" &&
          networkingData.uniqueValueProposition.trim() !== ""
        );
      case 8: // Availability
        return true; // Optional step
      case 9: // Complete
        return true;
      default:
        return true;
    }
  };

  // Save current progress and close (Edit Later)
  const handleSaveAndClose = async () => {
    setIsSaving(true);
    try {
      // Update profile with current data
      updateProfile({
        firstName: profileData.firstName,
        lastName: profileData.lastName,
        email: profileData.email,
        phone: profileData.phone,
        company: profileData.company,
        jobTitle: profileData.jobTitle,
        location: profileData.location,
        bio: profileData.bio,
        networkingProfile: {
          ...profile.networkingProfile,
          categories: selectedCategories,
          expertise: expertise.split(",").map((e) => e.trim()).filter((e) => e),
          ...networkingData,
          ...businessData,
        },
      });
      await saveProfile();
      setShowAffiliateOnboarding(false);
    } catch (error) {
      console.error("Error saving progress:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const getStepProgress = () => {
    return Math.round((currentStep / steps.length) * 100);
  };

  return (
    <Dialog open={showAffiliateOnboarding} onOpenChange={setShowAffiliateOnboarding}>
      <DialogContent className="max-w-6xl max-h-[90vh] w-[98vw] sm:w-[95vw] md:w-[90vw] lg:w-[85vw]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-green-500 to-green-600">
              <Handshake className="h-5 w-5 text-white" />
            </div>
            Affiliate Onboarding
          </DialogTitle>
          <DialogDescription>
            Welcome to the SVP Affiliate Network! Let&apos;s get you set up for success.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {/* Step indicators - compact version */}
          <div className="flex items-center justify-center gap-1 mb-6 flex-wrap">
            {steps.map((step, index) => {
              const Icon = step.icon;
              const isActive = currentStep === step.id;
              const isCompleted = currentStep > step.id;
              
              return (
                <div key={step.id} className="flex items-center">
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center transition-colors ${
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : isCompleted
                        ? "bg-green-500 text-white"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {isCompleted ? <CheckCircle className="h-3 w-3" /> : <Icon className="h-3 w-3" />}
                  </div>
                  {index < steps.length - 1 && (
                    <div className={`w-6 h-0.5 ${isCompleted ? "bg-green-500" : "bg-muted"}`} />
                  )}
                </div>
              );
            })}
          </div>

          <ScrollArea className="h-[400px] pr-4">
            {/* Step 1: Welcome */}
            {currentStep === 1 && (
              <div className="space-y-6 px-2">
                <div className="text-center">
                  <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
                    <Handshake className="h-10 w-10 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">Welcome to the SVP Affiliate Network!</h3>
                  <p className="text-muted-foreground max-w-md mx-auto">
                    Thank you for joining Strategic Value Plus as an affiliate partner. This onboarding process will help you understand your commitments and set up your networking profile.
                  </p>
                </div>

                <Card className="bg-muted/50">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <Lightbulb className="h-5 w-5 text-yellow-500 mt-0.5" />
                      <div>
                        <p className="font-medium">What to expect:</p>
                        <ul className="text-sm text-muted-foreground mt-2 space-y-1">
                          <li>• Review your affiliate commitments</li>
                          <li>• Set up your expertise and categories</li>
                          <li>• Complete your networking profile for One-to-Ones</li>
                          <li>• Get ready to connect with other affiliates</li>
                        </ul>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {profile.affiliateAgreementDate && (
                  <p className="text-sm text-center text-muted-foreground">
                    Agreement signed on: {new Date(profile.affiliateAgreementDate).toLocaleDateString()}
                  </p>
                )}
              </div>
            )}

            {/* Step 2: Commitments */}
            {currentStep === 2 && (
              <div className="space-y-4 px-2">
                <div className="text-center mb-4">
                  <h3 className="text-lg font-semibold">Your Affiliate Commitments</h3>
                  <p className="text-sm text-muted-foreground">
                    As an SVP affiliate, you&apos;ve agreed to the following commitments:
                  </p>
                </div>

                <div className="grid gap-3">
                  {affiliateCommitments.map((commitment, index) => {
                    const Icon = commitment.icon;
                    return (
                      <Card key={index} className="bg-muted/30">
                        <CardContent className="p-4 flex items-start gap-3">
                          <div className="p-2 rounded-lg bg-primary/10">
                            <Icon className="h-4 w-4 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium">{commitment.title}</p>
                            <p className="text-sm text-muted-foreground">{commitment.description}</p>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>

                <div className="flex items-center space-x-2 pt-4 border-t">
                  <Checkbox
                    id="acknowledge"
                    checked={acknowledgedCommitments}
                    onCheckedChange={(checked) => setAcknowledgedCommitments(checked as boolean)}
                  />
                  <Label htmlFor="acknowledge" className="text-sm">
                    I understand and acknowledge my commitments as an SVP affiliate
                  </Label>
                </div>
              </div>
            )}

            {/* Step 3: Profile Information */}
            {currentStep === 3 && (
              <div className="space-y-4 px-2">
                <Alert className="border-blue-200 bg-blue-50 dark:bg-blue-950/30">
                  <User className="h-4 w-4 text-blue-600" />
                  <AlertDescription className="text-sm">
                    <strong>Your Profile</strong> - This information helps other affiliates identify and connect with you.
                  </AlertDescription>
                </Alert>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name *</Label>
                    <Input
                      id="firstName"
                      value={profileData.firstName}
                      onChange={(e) => updateProfileField("firstName", e.target.value)}
                      placeholder="Enter your first name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name *</Label>
                    <Input
                      id="lastName"
                      value={profileData.lastName}
                      onChange={(e) => updateProfileField("lastName", e.target.value)}
                      placeholder="Enter your last name"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email Address *</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      value={profileData.email}
                      onChange={(e) => updateProfileField("email", e.target.value)}
                      placeholder="you@company.com"
                      className="pl-10"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number *</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="phone"
                      type="tel"
                      value={profileData.phone}
                      onChange={(e) => updateProfileField("phone", e.target.value)}
                      placeholder="(555) 123-4567"
                      className="pl-10"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Step 4: Company Information */}
            {currentStep === 4 && (
              <div className="space-y-4 px-2">
                <Alert className="border-purple-200 bg-purple-50 dark:bg-purple-950/30">
                  <Building className="h-4 w-4 text-purple-600" />
                  <AlertDescription className="text-sm">
                    <strong>Your Company</strong> - Tell us about your business and professional background.
                  </AlertDescription>
                </Alert>

                <div className="space-y-2">
                  <Label htmlFor="company">Company Name *</Label>
                  <div className="relative">
                    <Building className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="company"
                      value={profileData.company}
                      onChange={(e) => updateProfileField("company", e.target.value)}
                      placeholder="Your company name"
                      className="pl-10"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="jobTitle">Job Title *</Label>
                  <div className="relative">
                    <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="jobTitle"
                      value={profileData.jobTitle}
                      onChange={(e) => updateProfileField("jobTitle", e.target.value)}
                      placeholder="Your job title"
                      className="pl-10"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="location">Location *</Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="location"
                      value={profileData.location}
                      onChange={(e) => updateProfileField("location", e.target.value)}
                      placeholder="City, State"
                      className="pl-10"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bio">Professional Bio</Label>
                  <Textarea
                    id="bio"
                    value={profileData.bio}
                    onChange={(e) => updateProfileField("bio", e.target.value)}
                    placeholder="Tell us about yourself and your expertise..."
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="linkedIn">LinkedIn URL</Label>
                    <div className="relative">
                      <Linkedin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="linkedIn"
                        value={profileData.linkedIn}
                        onChange={(e) => updateProfileField("linkedIn", e.target.value)}
                        placeholder="linkedin.com/in/yourname"
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="website">Website</Label>
                    <div className="relative">
                      <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="website"
                        value={profileData.website}
                        onChange={(e) => updateProfileField("website", e.target.value)}
                        placeholder="www.yourcompany.com"
                        className="pl-10"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 5: Business Information */}
            {currentStep === 5 && (
              <div className="space-y-4 px-2">
                <Alert className="border-orange-200 bg-orange-50 dark:bg-orange-950/30">
                  <Briefcase className="h-4 w-4 text-orange-600" />
                  <AlertDescription className="text-sm">
                    <strong>Business Information</strong> - Help us match you with the right networking partners.
                  </AlertDescription>
                </Alert>

                <div className="space-y-2">
                  <Label>Business Type *</Label>
                  <Select
                    value={businessData.businessType}
                    onValueChange={(value) => updateBusinessField("businessType", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select your business type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="manufacturer">Manufacturer</SelectItem>
                      <SelectItem value="distributor">Distributor</SelectItem>
                      <SelectItem value="service-provider">Service Provider</SelectItem>
                      <SelectItem value="consultant">Consultant</SelectItem>
                      <SelectItem value="supplier">Supplier</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Industry (Select all that apply) *</Label>
                  <div className="grid grid-cols-3 gap-2">
                    {industries.map((industry) => (
                      <div key={industry} className="flex items-center space-x-2">
                        <Checkbox
                          id={`industry-${industry}`}
                          checked={businessData.industry.includes(industry)}
                          onCheckedChange={() =>
                            updateBusinessField("industry", toggleArrayItem(businessData.industry, industry))
                          }
                        />
                        <label htmlFor={`industry-${industry}`} className="text-xs cursor-pointer">
                          {industry}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Target Customers</Label>
                  <Textarea
                    placeholder="Describe your ideal customer (e.g., Mid-sized manufacturers in automotive sector)"
                    value={businessData.targetCustomers}
                    onChange={(e) => updateBusinessField("targetCustomers", e.target.value)}
                    rows={2}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Services/Products Offered</Label>
                  <Textarea
                    placeholder="Briefly describe what you offer"
                    value={businessData.servicesOffered}
                    onChange={(e) => updateBusinessField("servicesOffered", e.target.value)}
                    rows={2}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Geographic Focus</Label>
                  <div className="grid grid-cols-4 gap-2">
                    {geographicOptions.map((geo) => (
                      <div key={geo} className="flex items-center space-x-2">
                        <Checkbox
                          id={`geo-${geo}`}
                          checked={businessData.geographicFocus.includes(geo)}
                          onCheckedChange={() =>
                            updateBusinessField("geographicFocus", toggleArrayItem(businessData.geographicFocus, geo))
                          }
                        />
                        <label htmlFor={`geo-${geo}`} className="text-xs cursor-pointer">
                          {geo}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Step 6: Expertise */}
            {currentStep === 6 && (
              <div className="space-y-4 px-2">
                <Alert className="border-yellow-200 bg-yellow-50 dark:bg-yellow-950/30">
                  <Star className="h-4 w-4 text-yellow-600" />
                  <AlertDescription className="text-sm">
                    <strong>Your Expertise</strong> - Select categories and describe your specific skills for AI matching.
                  </AlertDescription>
                </Alert>

                <div className="grid grid-cols-2 gap-2">
                  {affiliateCategories.map((category) => (
                    <button
                      key={category.id}
                      onClick={() => handleCategoryToggle(category.id)}
                      className={`p-2 rounded-lg border text-left transition-colors ${
                        selectedCategories.includes(category.id)
                          ? "border-primary bg-primary/10"
                          : "border-muted hover:border-primary/50"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-sm">{category.icon}</span>
                        <span className="text-xs font-medium">{category.name}</span>
                        {selectedCategories.includes(category.id) && (
                          <CheckCircle className="h-3 w-3 text-primary ml-auto" />
                        )}
                      </div>
                    </button>
                  ))}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="expertise">Specific Expertise (comma separated) *</Label>
                  <Input
                    id="expertise"
                    value={expertise}
                    onChange={(e) => setExpertise(e.target.value)}
                    placeholder="e.g., Six Sigma, ISO 9001, Lean Manufacturing"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Networking Goals</Label>
                  <div className="space-y-1">
                    {networkingGoalOptions.map((goal) => (
                      <div key={goal} className="flex items-center space-x-2">
                        <Checkbox
                          id={`goal-${goal}`}
                          checked={businessData.networkingGoals.includes(goal)}
                          onCheckedChange={() =>
                            updateBusinessField("networkingGoals", toggleArrayItem(businessData.networkingGoals, goal))
                          }
                        />
                        <label htmlFor={`goal-${goal}`} className="text-xs cursor-pointer">
                          {goal}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Step 7: Partners & Value Proposition */}
            {currentStep === 7 && (
              <div className="space-y-4 px-2">
                <Alert className="border-green-200 bg-green-50 dark:bg-green-950/30">
                  <Users className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-sm">
                    <strong>Your Value & Partners</strong> - Help others understand what makes you unique 
                    and who you work best with. This enables better referral matching.
                  </AlertDescription>
                </Alert>

                <AIEnhancedTextarea
                  id="idealReferralPartner"
                  label="Who is your ideal referral partner? *"
                  value={networkingData.idealReferralPartner}
                  onChange={(value) => updateNetworkingField("idealReferralPartner", value)}
                  placeholder="- CFOs and financial consultants
- Technology vendors for Industry 4.0
- Manufacturing clients needing improvements"
                  rows={2}
                  fieldKey="idealReferralPartner"
                />

                <AIEnhancedTextarea
                  id="uniqueValueProposition"
                  label="What makes you unique? *"
                  value={networkingData.uniqueValueProposition}
                  onChange={(value) => updateNetworkingField("uniqueValueProposition", value)}
                  placeholder="- 25+ years manufacturing experience
- Six Sigma Black Belt certified
- Reduce costs 15-30% in 6 months"
                  rows={2}
                  fieldKey="uniqueValueProposition"
                />

                <AIEnhancedTextarea
                  id="problemsYouSolve"
                  label="What problems do you solve? *"
                  value={networkingData.problemsYouSolve}
                  onChange={(value) => updateNetworkingField("problemsYouSolve", value)}
                  placeholder="- High production costs
- Quality control issues
- Supply chain disruptions"
                  rows={2}
                  fieldKey="problemsYouSolve"
                />

                <AIEnhancedTextarea
                  id="targetClientProfile"
                  label="Describe your ideal client"
                  value={networkingData.targetClientProfile}
                  onChange={(value) => updateNetworkingField("targetClientProfile", value)}
                  placeholder="- Mid-size manufacturers ($10M-$100M)
- Located in the Midwest
- Automotive, aerospace, medical devices"
                  rows={2}
                  fieldKey="targetClientProfile"
                />
              </div>
            )}

            {/* Step 8: Availability & Preferences */}
            {currentStep === 8 && (
              <div className="space-y-4 px-2">
                <Alert className="border-cyan-200 bg-cyan-50 dark:bg-cyan-950/30">
                  <Calendar className="h-4 w-4 text-cyan-600" />
                  <AlertDescription className="text-sm">
                    <strong>Availability</strong> - Let us know when you&apos;re available for networking meetings.
                  </AlertDescription>
                </Alert>

                <div className="space-y-2">
                  <Label>Preferred Meeting Frequency</Label>
                  <RadioGroup
                    value={businessData.meetingFrequency}
                    onValueChange={(value) => updateBusinessField("meetingFrequency", value)}
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="weekly" id="weekly" />
                      <label htmlFor="weekly" className="text-sm cursor-pointer">Weekly</label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="biweekly" id="biweekly" />
                      <label htmlFor="biweekly" className="text-sm cursor-pointer">Bi-weekly</label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="monthly" id="monthly" />
                      <label htmlFor="monthly" className="text-sm cursor-pointer">Monthly</label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="flexible" id="flexible" />
                      <label htmlFor="flexible" className="text-sm cursor-pointer">Flexible</label>
                    </div>
                  </RadioGroup>
                </div>

                <div className="space-y-2">
                  <Label>Available Days</Label>
                  <div className="grid grid-cols-4 gap-2">
                    {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"].map((day) => (
                      <div key={day} className="flex items-center space-x-2">
                        <Checkbox
                          id={`day-${day}`}
                          checked={businessData.availableDays.includes(day)}
                          onCheckedChange={() =>
                            updateBusinessField("availableDays", toggleArrayItem(businessData.availableDays, day))
                          }
                        />
                        <label htmlFor={`day-${day}`} className="text-xs cursor-pointer">
                          {day.slice(0, 3)}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Preferred Time</Label>
                  <Select
                    value={businessData.timePreference}
                    onValueChange={(value) => updateBusinessField("timePreference", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select preferred time" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="early-morning">Early Morning (6-9 AM)</SelectItem>
                      <SelectItem value="morning">Morning (9 AM-12 PM)</SelectItem>
                      <SelectItem value="lunch">Lunch (12-2 PM)</SelectItem>
                      <SelectItem value="afternoon">Afternoon (2-5 PM)</SelectItem>
                      <SelectItem value="flexible">Flexible</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Communication Preference</Label>
                  <RadioGroup
                    value={businessData.communicationPreference}
                    onValueChange={(value) => updateBusinessField("communicationPreference", value)}
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="in-person" id="in-person" />
                      <label htmlFor="in-person" className="text-sm cursor-pointer">In-Person</label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="virtual" id="virtual" />
                      <label htmlFor="virtual" className="text-sm cursor-pointer">Virtual (Zoom, Teams)</label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="hybrid" id="hybrid" />
                      <label htmlFor="hybrid" className="text-sm cursor-pointer">Both</label>
                    </div>
                  </RadioGroup>
                </div>

                <AIEnhancedTextarea
                  id="goalsThisQuarter"
                  label="Networking goals this quarter"
                  value={networkingData.goalsThisQuarter}
                  onChange={(value) => updateNetworkingField("goalsThisQuarter", value)}
                  placeholder="- Connect with 5 new referral partners
- Schedule 10 one-to-one meetings"
                  rows={2}
                  fieldKey="goalsThisQuarter"
                />
              </div>
            )}

            {/* Step 9: Complete - Ready to Connect */}
            {currentStep === 9 && (
              <div className="space-y-6 px-2">
                <div className="text-center">
                  <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-green-500/20 to-green-500/10 flex items-center justify-center">
                    <CheckCircle className="h-10 w-10 text-green-500" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">You&apos;re All Set!</h3>
                  <p className="text-muted-foreground max-w-md mx-auto">
                    Your affiliate onboarding is complete. You&apos;re now ready to start networking with other affiliates.
                  </p>
                </div>

                <div className="flex justify-center">
                  <CircularProgress percentage={networkingCompletion} />
                </div>

                <Card className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
                  <CardContent className="p-4">
                    <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-2 flex items-center gap-2">
                      <Lightbulb className="h-4 w-4" />
                      Where to Update Your Information
                    </h4>
                    <p className="text-sm text-blue-700 dark:text-blue-300 mb-3">
                      Your profile and networking information is used for AI-powered matching. You can update it anytime:
                    </p>
                    <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-2">
                      <li className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        <strong>Profile Page</strong> - Update your contact info, bio, and company details
                      </li>
                      <li className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        <strong>Networking Settings</strong> - Update your expertise, goals, and referral preferences
                      </li>
                    </ul>
                  </CardContent>
                </Card>

                <Card className="bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800">
                  <CardContent className="p-4">
                    <h4 className="font-medium text-green-800 dark:text-green-200 mb-2">Next Steps:</h4>
                    <ul className="text-sm text-green-700 dark:text-green-300 space-y-2">
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4" />
                        Browse the affiliate directory
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4" />
                        Schedule your first One-to-One meeting
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4" />
                        Attend the next affiliate networking event
                      </li>
                    </ul>
                  </CardContent>
                </Card>
              </div>
            )}
          </ScrollArea>
        </div>

        <DialogFooter className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              Step {currentStep} of {steps.length}
            </span>
            {currentStep > 2 && currentStep < steps.length && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleSaveAndClose}
                disabled={isSaving}
                className="text-xs"
              >
                {isSaving ? "Saving..." : "Save & Edit Later"}
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            {currentStep > 1 && (
              <Button variant="outline" size="sm" onClick={handleBack}>
                <ChevronLeft className="h-4 w-4 mr-1" />
                Back
              </Button>
            )}
            {currentStep < steps.length ? (
              <Button size="sm" onClick={handleNext} disabled={!isStepValid()}>
                Next
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            ) : (
              <Button onClick={handleComplete} className="bg-green-600 hover:bg-green-700" disabled={isSaving}>
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Complete Onboarding
                  </>
                )}
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
