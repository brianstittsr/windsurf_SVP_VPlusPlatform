"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Network,
  Building,
  Target,
  Users,
  Briefcase,
  MapPin,
  Calendar,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Sparkles,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useUserProfile } from "@/contexts/user-profile-context";

interface NetworkingFormData {
  businessType: string;
  industry: string[];
  targetCustomers: string;
  servicesOffered: string;
  geographicFocus: string[];
  networkingGoals: string[];
  idealReferralPartner: string;
  meetingFrequency: string;
  availability: {
    days: string[];
    timePreference: string;
  };
  communicationPreference: string;
  expertise: string[];
  lookingFor: string[];
  canProvide: string[];
  additionalNotes: string;
}

export function NetworkingSetupForm() {
  const router = useRouter();
  const { profile, updateProfile, saveProfile } = useUserProfile();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSaving, setIsSaving] = useState(false);
  
  // Initialize form data from profile's networkingProfile
  const networkingProfile = profile.networkingProfile as any;
  const [formData, setFormData] = useState<NetworkingFormData>({
    businessType: networkingProfile?.businessType || "",
    industry: networkingProfile?.industry || [],
    targetCustomers: networkingProfile?.targetCustomers || "",
    servicesOffered: networkingProfile?.servicesOffered || "",
    geographicFocus: networkingProfile?.geographicFocus || [],
    networkingGoals: networkingProfile?.networkingGoals || [],
    idealReferralPartner: networkingProfile?.idealReferralPartner || "",
    meetingFrequency: networkingProfile?.meetingFrequency || "",
    availability: {
      days: networkingProfile?.availableDays || [],
      timePreference: networkingProfile?.timePreference || "",
    },
    communicationPreference: networkingProfile?.communicationPreference || "",
    expertise: networkingProfile?.expertise || [],
    lookingFor: networkingProfile?.lookingFor || [],
    canProvide: networkingProfile?.canProvide || [],
    additionalNotes: networkingProfile?.additionalNotes || "",
  });

  // Update form data when profile changes
  useEffect(() => {
    const np = profile.networkingProfile as any;
    if (np) {
      setFormData({
        businessType: np.businessType || "",
        industry: np.industry || [],
        targetCustomers: np.targetCustomers || "",
        servicesOffered: np.servicesOffered || "",
        geographicFocus: np.geographicFocus || [],
        networkingGoals: np.networkingGoals || [],
        idealReferralPartner: np.idealReferralPartner || "",
        meetingFrequency: np.meetingFrequency || "",
        availability: {
          days: np.availableDays || [],
          timePreference: np.timePreference || "",
        },
        communicationPreference: np.communicationPreference || "",
        expertise: np.expertise || [],
        lookingFor: np.lookingFor || [],
        canProvide: np.canProvide || [],
        additionalNotes: np.additionalNotes || "",
      });
    }
  }, [profile.networkingProfile]);

  const totalSteps = 4;

  const industries = [
    "Manufacturing",
    "Technology",
    "Healthcare",
    "Finance",
    "Retail",
    "Construction",
    "Professional Services",
    "Education",
    "Hospitality",
    "Transportation",
    "Real Estate",
    "Other",
  ];

  const networkingGoals = [
    "Generate referrals for my business",
    "Refer clients to other affiliates",
    "Learn from other business owners",
    "Expand my professional network",
    "Find strategic partnerships",
    "Access new markets",
    "Share best practices",
  ];

  const expertiseAreas = [
    "Sales & Marketing",
    "Operations Management",
    "Financial Planning",
    "Human Resources",
    "Technology & IT",
    "Supply Chain",
    "Quality Management",
    "Business Development",
    "Legal & Compliance",
    "Customer Service",
  ];

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    setIsSaving(true);
    try {
      // Save networking profile data to user profile context
      updateProfile({
        networkingProfile: {
          ...profile.networkingProfile,
          businessType: formData.businessType,
          industry: formData.industry,
          targetCustomers: formData.targetCustomers,
          servicesOffered: formData.servicesOffered,
          geographicFocus: formData.geographicFocus,
          networkingGoals: formData.networkingGoals,
          idealReferralPartner: formData.idealReferralPartner,
          meetingFrequency: formData.meetingFrequency,
          availableDays: formData.availability.days,
          timePreference: formData.availability.timePreference,
          communicationPreference: formData.communicationPreference,
          expertise: formData.expertise,
          lookingFor: formData.lookingFor,
          canProvide: formData.canProvide,
          additionalNotes: formData.additionalNotes,
        },
      });
      
      // Save to Firestore
      await saveProfile();
      console.log("Networking profile saved successfully");
      router.push("/portal/networking");
    } catch (error) {
      console.error("Error saving networking profile:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const toggleArrayItem = (array: string[], item: string) => {
    if (array.includes(item)) {
      return array.filter(i => i !== item);
    }
    return [...array, item];
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Progress Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between mb-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Network className="h-6 w-6 text-primary" />
                Networking Profile Setup
              </CardTitle>
              <CardDescription>
                Help us match you with the right networking partners
              </CardDescription>
            </div>
            <Badge variant="outline" className="text-sm">
              Step {currentStep} of {totalSteps}
            </Badge>
          </div>
          <div className="flex gap-2">
            {Array.from({ length: totalSteps }).map((_, index) => (
              <div
                key={index}
                className={`h-2 flex-1 rounded-full transition-colors ${
                  index + 1 <= currentStep ? "bg-primary" : "bg-muted"
                }`}
              />
            ))}
          </div>
        </CardHeader>
      </Card>

      {/* Step 1: Business Information */}
      {currentStep === 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building className="h-5 w-5" />
              Business Information
            </CardTitle>
            <CardDescription>Tell us about your business</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label>Business Type</Label>
              <Select
                value={formData.businessType}
                onValueChange={(value) => setFormData({ ...formData, businessType: value })}
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
              <Label>Industry (Select all that apply)</Label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {industries.map((industry) => (
                  <div key={industry} className="flex items-center space-x-2">
                    <Checkbox
                      id={industry}
                      checked={formData.industry.includes(industry)}
                      onCheckedChange={() =>
                        setFormData({
                          ...formData,
                          industry: toggleArrayItem(formData.industry, industry),
                        })
                      }
                    />
                    <label
                      htmlFor={industry}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                    >
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
                value={formData.targetCustomers}
                onChange={(e) => setFormData({ ...formData, targetCustomers: e.target.value })}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label>Services/Products Offered</Label>
              <Textarea
                placeholder="Briefly describe what you offer"
                value={formData.servicesOffered}
                onChange={(e) => setFormData({ ...formData, servicesOffered: e.target.value })}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label>Geographic Focus</Label>
              <div className="grid grid-cols-2 gap-3">
                {["Local", "Regional", "National", "International"].map((geo) => (
                  <div key={geo} className="flex items-center space-x-2">
                    <Checkbox
                      id={geo}
                      checked={formData.geographicFocus.includes(geo)}
                      onCheckedChange={() =>
                        setFormData({
                          ...formData,
                          geographicFocus: toggleArrayItem(formData.geographicFocus, geo),
                        })
                      }
                    />
                    <label
                      htmlFor={geo}
                      className="text-sm font-medium leading-none cursor-pointer"
                    >
                      {geo}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Networking Goals */}
      {currentStep === 2 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Networking Goals
            </CardTitle>
            <CardDescription>What do you hope to achieve through networking?</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label>Primary Networking Goals (Select all that apply)</Label>
              <div className="space-y-3">
                {networkingGoals.map((goal) => (
                  <div key={goal} className="flex items-center space-x-2">
                    <Checkbox
                      id={goal}
                      checked={formData.networkingGoals.includes(goal)}
                      onCheckedChange={() =>
                        setFormData({
                          ...formData,
                          networkingGoals: toggleArrayItem(formData.networkingGoals, goal),
                        })
                      }
                    />
                    <label
                      htmlFor={goal}
                      className="text-sm font-medium leading-none cursor-pointer"
                    >
                      {goal}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Ideal Referral Partner</Label>
              <Textarea
                placeholder="Describe the type of business or professional you'd like to partner with for referrals (e.g., 'Commercial real estate agents who work with manufacturers')"
                value={formData.idealReferralPartner}
                onChange={(e) =>
                  setFormData({ ...formData, idealReferralPartner: e.target.value })
                }
                rows={4}
              />
            </div>

            <div className="space-y-2">
              <Label>Your Areas of Expertise</Label>
              <div className="grid grid-cols-2 gap-3">
                {expertiseAreas.map((area) => (
                  <div key={area} className="flex items-center space-x-2">
                    <Checkbox
                      id={`expertise-${area}`}
                      checked={formData.expertise.includes(area)}
                      onCheckedChange={() =>
                        setFormData({
                          ...formData,
                          expertise: toggleArrayItem(formData.expertise, area),
                        })
                      }
                    />
                    <label
                      htmlFor={`expertise-${area}`}
                      className="text-sm font-medium leading-none cursor-pointer"
                    >
                      {area}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label>What I'm Looking For</Label>
                <Textarea
                  placeholder="Resources, connections, or support you need"
                  value={formData.lookingFor.join("\n")}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      lookingFor: e.target.value.split("\n").filter(Boolean),
                    })
                  }
                  rows={4}
                />
                <p className="text-xs text-muted-foreground">One item per line</p>
              </div>

              <div className="space-y-2">
                <Label>What I Can Provide</Label>
                <Textarea
                  placeholder="Resources, connections, or support you can offer"
                  value={formData.canProvide.join("\n")}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      canProvide: e.target.value.split("\n").filter(Boolean),
                    })
                  }
                  rows={4}
                />
                <p className="text-xs text-muted-foreground">One item per line</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Availability & Preferences */}
      {currentStep === 3 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Availability & Preferences
            </CardTitle>
            <CardDescription>When and how would you like to network?</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label>Preferred Meeting Frequency</Label>
              <RadioGroup
                value={formData.meetingFrequency}
                onValueChange={(value) => setFormData({ ...formData, meetingFrequency: value })}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="weekly" id="weekly" />
                  <label htmlFor="weekly" className="text-sm font-medium cursor-pointer">
                    Weekly - I want to network actively
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="biweekly" id="biweekly" />
                  <label htmlFor="biweekly" className="text-sm font-medium cursor-pointer">
                    Bi-weekly - Regular but manageable
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="monthly" id="monthly" />
                  <label htmlFor="monthly" className="text-sm font-medium cursor-pointer">
                    Monthly - Steady networking pace
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="flexible" id="flexible" />
                  <label htmlFor="flexible" className="text-sm font-medium cursor-pointer">
                    Flexible - As opportunities arise
                  </label>
                </div>
              </RadioGroup>
            </div>

            <div className="space-y-2">
              <Label>Available Days (Select all that apply)</Label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].map(
                  (day) => (
                    <div key={day} className="flex items-center space-x-2">
                      <Checkbox
                        id={day}
                        checked={formData.availability.days.includes(day)}
                        onCheckedChange={() =>
                          setFormData({
                            ...formData,
                            availability: {
                              ...formData.availability,
                              days: toggleArrayItem(formData.availability.days, day),
                            },
                          })
                        }
                      />
                      <label htmlFor={day} className="text-sm font-medium cursor-pointer">
                        {day}
                      </label>
                    </div>
                  )
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Preferred Time of Day</Label>
              <Select
                value={formData.availability.timePreference}
                onValueChange={(value) =>
                  setFormData({
                    ...formData,
                    availability: { ...formData.availability, timePreference: value },
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select preferred time" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="early-morning">Early Morning (6-9 AM)</SelectItem>
                  <SelectItem value="morning">Morning (9 AM-12 PM)</SelectItem>
                  <SelectItem value="lunch">Lunch Time (12-2 PM)</SelectItem>
                  <SelectItem value="afternoon">Afternoon (2-5 PM)</SelectItem>
                  <SelectItem value="evening">Evening (5-8 PM)</SelectItem>
                  <SelectItem value="flexible">Flexible</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Communication Preference</Label>
              <RadioGroup
                value={formData.communicationPreference}
                onValueChange={(value) =>
                  setFormData({ ...formData, communicationPreference: value })
                }
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="in-person" id="in-person" />
                  <label htmlFor="in-person" className="text-sm font-medium cursor-pointer">
                    In-Person Meetings (Coffee, lunch, office visits)
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="virtual" id="virtual" />
                  <label htmlFor="virtual" className="text-sm font-medium cursor-pointer">
                    Virtual Meetings (Zoom, Teams, Google Meet)
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="hybrid" id="hybrid" />
                  <label htmlFor="hybrid" className="text-sm font-medium cursor-pointer">
                    Hybrid - Both in-person and virtual
                  </label>
                </div>
              </RadioGroup>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 4: Review & Submit */}
      {currentStep === 4 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5" />
              Review & Submit
            </CardTitle>
            <CardDescription>Review your networking profile before submitting</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="border-b pb-4">
                <h3 className="font-semibold mb-2">Business Information</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Business Type</p>
                    <p className="font-medium capitalize">
                      {formData.businessType.replace("-", " ")}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Industries</p>
                    <p className="font-medium">{formData.industry.join(", ") || "Not specified"}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-muted-foreground">Target Customers</p>
                    <p className="font-medium">{formData.targetCustomers || "Not specified"}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-muted-foreground">Geographic Focus</p>
                    <p className="font-medium">
                      {formData.geographicFocus.join(", ") || "Not specified"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="border-b pb-4">
                <h3 className="font-semibold mb-2">Networking Goals</h3>
                <div className="space-y-2 text-sm">
                  <div>
                    <p className="text-muted-foreground">Goals</p>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {formData.networkingGoals.map((goal) => (
                        <Badge key={goal} variant="secondary">
                          {goal}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Expertise Areas</p>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {formData.expertise.map((area) => (
                        <Badge key={area} variant="outline">
                          {area}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="border-b pb-4">
                <h3 className="font-semibold mb-2">Availability</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Meeting Frequency</p>
                    <p className="font-medium capitalize">
                      {formData.meetingFrequency.replace("-", " ")}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Communication</p>
                    <p className="font-medium capitalize">
                      {formData.communicationPreference.replace("-", " ")}
                    </p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-muted-foreground">Available Days</p>
                    <p className="font-medium">
                      {formData.availability.days.join(", ") || "Not specified"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Additional Notes (Optional)</Label>
                <Textarea
                  placeholder="Any additional information you'd like to share about your networking preferences or goals"
                  value={formData.additionalNotes}
                  onChange={(e) => setFormData({ ...formData, additionalNotes: e.target.value })}
                  rows={4}
                />
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Sparkles className="h-5 w-5 text-blue-600 mt-0.5" />
                <div>
                  <p className="font-medium text-blue-900">AI-Powered Matching</p>
                  <p className="text-sm text-blue-700">
                    Once submitted, our AI will analyze your profile and recommend the best
                    networking matches based on complementary goals, industries, and availability.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Navigation Buttons */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex justify-between">
            <Button
              variant="outline"
              onClick={handleBack}
              disabled={currentStep === 1}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>

            {currentStep < totalSteps ? (
              <Button onClick={handleNext}>
                Next
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            ) : (
              <Button onClick={handleSubmit} className="bg-green-600">
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Complete Setup
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
