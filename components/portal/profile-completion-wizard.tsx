"use client";

import { useState } from "react";
import { useUserProfile } from "@/contexts/user-profile-context";
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
import { Progress } from "@/components/ui/progress";
import {
  User,
  Building,
  MapPin,
  Phone,
  Mail,
  Briefcase,
  FileText,
  CheckCircle,
  ChevronRight,
  ChevronLeft,
} from "lucide-react";

// Circular progress component
function CircularProgress({ percentage, size = 120, strokeWidth = 10 }: { percentage: number; size?: number; strokeWidth?: number }) {
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
        <span className="text-2xl font-bold">{percentage}%</span>
        <span className="text-xs text-muted-foreground">Complete</span>
      </div>
    </div>
  );
}

const steps = [
  { id: 1, title: "Basic Info", icon: User },
  { id: 2, title: "Contact", icon: Phone },
  { id: 3, title: "Company", icon: Building },
  { id: 4, title: "About You", icon: FileText },
];

export function ProfileCompletionWizard() {
  const { profile, updateProfile, saveProfile, isSaving, profileCompletion, showProfileWizard, setShowProfileWizard } = useUserProfile();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    firstName: profile.firstName || "",
    lastName: profile.lastName || "",
    email: profile.email || "",
    phone: profile.phone || "",
    company: profile.company || "",
    jobTitle: profile.jobTitle || "",
    location: profile.location || "",
    bio: profile.bio || "",
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
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

  const handleComplete = async () => {
    updateProfile({
      ...formData,
      profileCompletedAt: new Date().toISOString(),
    });
    // Save to Firestore
    await saveProfile();
    setShowProfileWizard(false);
  };

  const handleSkip = async () => {
    // Save what we have so far
    updateProfile(formData);
    // Save to Firestore
    await saveProfile();
    setShowProfileWizard(false);
  };

  const isStepValid = () => {
    switch (currentStep) {
      case 1:
        return formData.firstName.trim() !== "" && formData.lastName.trim() !== "";
      case 2:
        return formData.email.trim() !== "" && formData.phone.trim() !== "";
      case 3:
        return formData.company.trim() !== "" && formData.jobTitle.trim() !== "";
      case 4:
        return formData.location.trim() !== "" && formData.bio.trim() !== "";
      default:
        return true;
    }
  };

  return (
    <Dialog open={showProfileWizard} onOpenChange={setShowProfileWizard}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-primary to-primary/80">
              <User className="h-5 w-5 text-white" />
            </div>
            Complete Your Profile
          </DialogTitle>
          <DialogDescription>
            Help us personalize your experience by completing your profile
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {/* Progress indicator */}
          <div className="flex items-center justify-center mb-8">
            <CircularProgress percentage={profileCompletion} />
          </div>

          {/* Step indicators */}
          <div className="flex items-center justify-between mb-8 px-4">
            {steps.map((step, index) => {
              const Icon = step.icon;
              const isActive = currentStep === step.id;
              const isCompleted = currentStep > step.id;
              
              return (
                <div key={step.id} className="flex items-center">
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                        isActive
                          ? "bg-primary text-primary-foreground"
                          : isCompleted
                          ? "bg-green-500 text-white"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {isCompleted ? <CheckCircle className="h-5 w-5" /> : <Icon className="h-5 w-5" />}
                    </div>
                    <span className={`text-xs mt-1 ${isActive ? "text-primary font-medium" : "text-muted-foreground"}`}>
                      {step.title}
                    </span>
                  </div>
                  {index < steps.length - 1 && (
                    <div className={`w-16 h-0.5 mx-2 ${isCompleted ? "bg-green-500" : "bg-muted"}`} />
                  )}
                </div>
              );
            })}
          </div>

          {/* Step content */}
          <div className="space-y-4 px-4">
            {currentStep === 1 && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name *</Label>
                    <Input
                      id="firstName"
                      value={formData.firstName}
                      onChange={(e) => handleInputChange("firstName", e.target.value)}
                      placeholder="Enter your first name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name *</Label>
                    <Input
                      id="lastName"
                      value={formData.lastName}
                      onChange={(e) => handleInputChange("lastName", e.target.value)}
                      placeholder="Enter your last name"
                    />
                  </div>
                </div>
              </>
            )}

            {currentStep === 2 && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address *</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange("email", e.target.value)}
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
                      value={formData.phone}
                      onChange={(e) => handleInputChange("phone", e.target.value)}
                      placeholder="(555) 123-4567"
                      className="pl-10"
                    />
                  </div>
                </div>
              </>
            )}

            {currentStep === 3 && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="company">Company Name *</Label>
                  <div className="relative">
                    <Building className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="company"
                      value={formData.company}
                      onChange={(e) => handleInputChange("company", e.target.value)}
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
                      value={formData.jobTitle}
                      onChange={(e) => handleInputChange("jobTitle", e.target.value)}
                      placeholder="Your job title"
                      className="pl-10"
                    />
                  </div>
                </div>
              </>
            )}

            {currentStep === 4 && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="location">Location *</Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="location"
                      value={formData.location}
                      onChange={(e) => handleInputChange("location", e.target.value)}
                      placeholder="City, State"
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bio">Bio *</Label>
                  <Textarea
                    id="bio"
                    value={formData.bio}
                    onChange={(e) => handleInputChange("bio", e.target.value)}
                    placeholder="Tell us about yourself and your expertise..."
                    rows={4}
                  />
                </div>
              </>
            )}
          </div>
        </div>

        <DialogFooter className="flex items-center justify-between">
          <Button variant="ghost" onClick={handleSkip}>
            Skip for now
          </Button>
          <div className="flex gap-2">
            {currentStep > 1 && (
              <Button variant="outline" onClick={handleBack}>
                <ChevronLeft className="h-4 w-4 mr-1" />
                Back
              </Button>
            )}
            {currentStep < steps.length ? (
              <Button onClick={handleNext} disabled={!isStepValid()}>
                Next
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            ) : (
              <Button onClick={handleComplete} disabled={!isStepValid() || isSaving}>
                <CheckCircle className="h-4 w-4 mr-2" />
                {isSaving ? "Saving..." : "Complete Profile"}
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
