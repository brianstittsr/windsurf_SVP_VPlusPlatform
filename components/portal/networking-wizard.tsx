"use client";

import { useState, useCallback } from "react";
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
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Handshake,
  Users,
  Target,
  Lightbulb,
  MessageSquare,
  Trophy,
  CheckCircle,
  ChevronRight,
  ChevronLeft,
  Info,
  Sparkles,
  Wand2,
  Loader2,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

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
  { id: 1, title: "Welcome", icon: Handshake },
  { id: 2, title: "Expertise", icon: Sparkles },
  { id: 3, title: "Ideal Partner", icon: Users },
  { id: 4, title: "Value Prop", icon: Lightbulb },
  { id: 5, title: "Goals", icon: Target },
];

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

// Expertise categories available for selection
const expertiseCategories = [
  { id: "technology", name: "Technology & AI", color: "bg-purple-500" },
  { id: "finance", name: "Finance & Accounting", color: "bg-yellow-500" },
  { id: "sales", name: "Sales & Marketing", color: "bg-red-500" },
  { id: "hr", name: "HR & Workforce", color: "bg-pink-500" },
  { id: "operations", name: "Operations", color: "bg-blue-500" },
  { id: "supply-chain", name: "Supply Chain", color: "bg-orange-500" },
  { id: "consulting", name: "Executive Consulting", color: "bg-teal-500" },
  { id: "legal-ip", name: "Legal & IP", color: "bg-gray-500" },
];

export function NetworkingWizard() {
  const { profile, updateProfile, saveProfile, isSaving, networkingCompletion, showNetworkingWizard, setShowNetworkingWizard } = useUserProfile();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    expertise: profile.networkingProfile?.expertise?.join(", ") || "",
    categories: profile.networkingProfile?.categories || [] as string[],
    idealReferralPartner: profile.networkingProfile?.idealReferralPartner || "",
    topReferralSources: profile.networkingProfile?.topReferralSources || "",
    goalsThisQuarter: profile.networkingProfile?.goalsThisQuarter || "",
    uniqueValueProposition: profile.networkingProfile?.uniqueValueProposition || "",
    targetClientProfile: profile.networkingProfile?.targetClientProfile || "",
    problemsYouSolve: profile.networkingProfile?.problemsYouSolve || "",
    successStory: profile.networkingProfile?.successStory || "",
  });

  const handleInputChange = (field: string, value: string | string[]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const toggleCategory = (categoryId: string) => {
    setFormData((prev) => {
      const categories = prev.categories.includes(categoryId)
        ? prev.categories.filter((c) => c !== categoryId)
        : [...prev.categories, categoryId];
      return { ...prev, categories };
    });
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
      networkingProfile: {
        ...profile.networkingProfile,
        expertise: formData.expertise.split(",").map((e) => e.trim()).filter(Boolean),
        categories: formData.categories,
        idealReferralPartner: formData.idealReferralPartner,
        topReferralSources: formData.topReferralSources,
        goalsThisQuarter: formData.goalsThisQuarter,
        uniqueValueProposition: formData.uniqueValueProposition,
        targetClientProfile: formData.targetClientProfile,
        problemsYouSolve: formData.problemsYouSolve,
        successStory: formData.successStory,
      },
    });
    await saveProfile();
    setShowNetworkingWizard(false);
  };

  const handleSkip = () => {
    // Save what we have so far
    updateProfile({
      networkingProfile: {
        ...profile.networkingProfile,
        expertise: formData.expertise.split(",").map((e) => e.trim()).filter(Boolean),
        categories: formData.categories,
        idealReferralPartner: formData.idealReferralPartner,
        topReferralSources: formData.topReferralSources,
        goalsThisQuarter: formData.goalsThisQuarter,
        uniqueValueProposition: formData.uniqueValueProposition,
        targetClientProfile: formData.targetClientProfile,
        problemsYouSolve: formData.problemsYouSolve,
        successStory: formData.successStory,
      },
    });
    setShowNetworkingWizard(false);
  };

  const isStepValid = () => {
    switch (currentStep) {
      case 1:
        return true; // Welcome step is always valid
      case 2:
        return formData.expertise.trim() !== "" || formData.categories.length > 0;
      case 3:
        return formData.idealReferralPartner.trim() !== "" && formData.topReferralSources.trim() !== "";
      case 4:
        return formData.uniqueValueProposition.trim() !== "" && formData.problemsYouSolve.trim() !== "";
      case 5:
        return formData.goalsThisQuarter.trim() !== "";
      default:
        return true;
    }
  };

  return (
    <Dialog open={showNetworkingWizard} onOpenChange={setShowNetworkingWizard}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-primary to-primary/80">
              <Handshake className="h-5 w-5 text-white" />
            </div>
            Complete Your Networking Profile
          </DialogTitle>
          <DialogDescription>
            Help other affiliates find and connect with you by completing your networking profile
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {/* Progress indicator */}
          <div className="flex items-center justify-center mb-6">
            <CircularProgress percentage={networkingCompletion} />
          </div>

          {/* Step indicators */}
          <div className="flex items-center justify-between mb-6 px-2 overflow-x-auto">
            {steps.map((step, index) => {
              const Icon = step.icon;
              const isActive = currentStep === step.id;
              const isCompleted = currentStep > step.id;
              
              return (
                <div key={step.id} className="flex items-center">
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors ${
                        isActive
                          ? "bg-primary text-primary-foreground"
                          : isCompleted
                          ? "bg-green-500 text-white"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {isCompleted ? <CheckCircle className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
                    </div>
                    <span className={`text-[10px] mt-1 text-center ${isActive ? "text-primary font-medium" : "text-muted-foreground"}`}>
                      {step.title}
                    </span>
                  </div>
                  {index < steps.length - 1 && (
                    <div className={`w-8 h-0.5 mx-1 ${isCompleted ? "bg-green-500" : "bg-muted"}`} />
                  )}
                </div>
              );
            })}
          </div>

          {/* Step content */}
          <div className="space-y-4 px-2">
            {currentStep === 1 && (
              <div className="space-y-4">
                <Alert className="border-primary/20 bg-primary/5">
                  <Info className="h-4 w-4 text-primary" />
                  <AlertDescription>
                    <strong>Why complete your networking profile?</strong>
                    <p className="mt-2 text-sm">
                      Your networking profile helps other affiliates and team members understand your expertise 
                      and find opportunities to collaborate. A complete profile enables:
                    </p>
                    <ul className="mt-2 text-sm space-y-1 list-disc list-inside">
                      <li><strong>Better Referrals:</strong> Others can send you qualified leads that match your expertise</li>
                      <li><strong>One-to-One Meetings:</strong> Connect with complementary partners for mutual referrals</li>
                      <li><strong>AI Recommendations:</strong> Our AI can suggest ideal networking partners for you</li>
                      <li><strong>Visibility:</strong> Appear in the affiliate directory with your specializations</li>
                    </ul>
                  </AlertDescription>
                </Alert>
                
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-lg border bg-muted/30">
                    <Users className="h-5 w-5 text-primary mb-2" />
                    <h4 className="font-medium text-sm">Find Partners</h4>
                    <p className="text-xs text-muted-foreground">Connect with affiliates who complement your services</p>
                  </div>
                  <div className="p-3 rounded-lg border bg-muted/30">
                    <Target className="h-5 w-5 text-primary mb-2" />
                    <h4 className="font-medium text-sm">Get Referrals</h4>
                    <p className="text-xs text-muted-foreground">Receive qualified leads from the network</p>
                  </div>
                  <div className="p-3 rounded-lg border bg-muted/30">
                    <MessageSquare className="h-5 w-5 text-primary mb-2" />
                    <h4 className="font-medium text-sm">Schedule 1-to-1s</h4>
                    <p className="text-xs text-muted-foreground">Book meetings with potential partners</p>
                  </div>
                  <div className="p-3 rounded-lg border bg-muted/30">
                    <Trophy className="h-5 w-5 text-primary mb-2" />
                    <h4 className="font-medium text-sm">Grow Together</h4>
                    <p className="text-xs text-muted-foreground">Build lasting business relationships</p>
                  </div>
                </div>
              </div>
            )}

            {currentStep === 2 && (
              <div className="space-y-4">
                <Alert className="border-blue-200 bg-blue-50 dark:bg-blue-950/30">
                  <Sparkles className="h-4 w-4 text-blue-600" />
                  <AlertDescription className="text-sm">
                    <strong>Your Expertise</strong> helps others understand what services you offer and what types 
                    of referrals you're looking for. Select categories and describe your specific skills.
                  </AlertDescription>
                </Alert>
                
                <div className="space-y-2">
                  <Label>Select Your Expertise Categories</Label>
                  <div className="flex flex-wrap gap-2">
                    {expertiseCategories.map((cat) => (
                      <Badge
                        key={cat.id}
                        variant={formData.categories.includes(cat.id) ? "default" : "outline"}
                        className={`cursor-pointer transition-all ${
                          formData.categories.includes(cat.id) 
                            ? `${cat.color} text-white border-transparent` 
                            : "hover:bg-muted"
                        }`}
                        onClick={() => toggleCategory(cat.id)}
                      >
                        {cat.name}
                      </Badge>
                    ))}
                  </div>
                </div>
                
                <AIEnhancedTextarea
                  id="expertise"
                  label="Describe Your Specific Expertise *"
                  value={formData.expertise}
                  onChange={(value) => handleInputChange("expertise", value)}
                  placeholder="- Manufacturing operations consulting
- Lean Six Sigma implementation
- Supply chain optimization
- ERP systems"
                  rows={3}
                  fieldKey="expertise"
                />
              </div>
            )}

            {currentStep === 3 && (
              <div className="space-y-4">
                <Alert className="border-green-200 bg-green-50 dark:bg-green-950/30">
                  <Users className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-sm">
                    <strong>Ideal Referral Partners</strong> are people whose services complement yours. When you 
                    describe who you work best with, our AI can match you with compatible affiliates.
                  </AlertDescription>
                </Alert>
                
                <AIEnhancedTextarea
                  id="idealReferralPartner"
                  label="Describe Your Ideal Referral Partner *"
                  value={formData.idealReferralPartner}
                  onChange={(value) => handleInputChange("idealReferralPartner", value)}
                  placeholder="- CFOs and financial consultants
- Technology vendors for Industry 4.0
- Manufacturing clients needing improvements"
                  rows={3}
                  fieldKey="idealReferralPartner"
                />
                
                <AIEnhancedTextarea
                  id="topReferralSources"
                  label="Where Do Your Best Referrals Come From? *"
                  value={formData.topReferralSources}
                  onChange={(value) => handleInputChange("topReferralSources", value)}
                  placeholder="- Accountants
- Bankers
- Equipment vendors
- Trade associations"
                  rows={2}
                  fieldKey="topReferralSources"
                />
              </div>
            )}

            {currentStep === 4 && (
              <div className="space-y-4">
                <Alert className="border-purple-200 bg-purple-50 dark:bg-purple-950/30">
                  <Lightbulb className="h-4 w-4 text-purple-600" />
                  <AlertDescription className="text-sm">
                    <strong>Your Value Proposition</strong> is what makes you unique. When other affiliates understand 
                    what problems you solve and for whom, they can send you better-qualified referrals.
                  </AlertDescription>
                </Alert>
                
                <AIEnhancedTextarea
                  id="uniqueValueProposition"
                  label="What Makes You Unique? *"
                  value={formData.uniqueValueProposition}
                  onChange={(value) => handleInputChange("uniqueValueProposition", value)}
                  placeholder="- 25+ years manufacturing experience
- Six Sigma Black Belt certified
- Reduce costs 15-30% in 6 months"
                  rows={3}
                  fieldKey="uniqueValueProposition"
                />
                
                <AIEnhancedTextarea
                  id="problemsYouSolve"
                  label="What Problems Do You Solve? *"
                  value={formData.problemsYouSolve}
                  onChange={(value) => handleInputChange("problemsYouSolve", value)}
                  placeholder="- High production costs
- Quality control issues
- Supply chain disruptions
- Workforce training gaps"
                  rows={2}
                  fieldKey="problemsYouSolve"
                />
                
                <AIEnhancedTextarea
                  id="targetClientProfile"
                  label="Who Is Your Ideal Client?"
                  value={formData.targetClientProfile}
                  onChange={(value) => handleInputChange("targetClientProfile", value)}
                  placeholder="- Mid-size manufacturers ($10M-$100M)
- Located in the Midwest
- Automotive, aerospace, medical devices"
                  rows={2}
                  fieldKey="targetClientProfile"
                />
              </div>
            )}

            {currentStep === 5 && (
              <div className="space-y-4">
                <Alert className="border-amber-200 bg-amber-50 dark:bg-amber-950/30">
                  <Target className="h-4 w-4 text-amber-600" />
                  <AlertDescription className="text-sm">
                    <strong>Your Goals</strong> help us understand what you're trying to achieve. Share your 
                    networking goals and a success story to help others understand how you deliver results.
                  </AlertDescription>
                </Alert>
                
                <AIEnhancedTextarea
                  id="goalsThisQuarter"
                  label="What Are Your Networking Goals This Quarter? *"
                  value={formData.goalsThisQuarter}
                  onChange={(value) => handleInputChange("goalsThisQuarter", value)}
                  placeholder="- Connect with 5 new referral partners
- Schedule 10 one-to-one meetings
- Generate 3 qualified leads"
                  rows={2}
                  fieldKey="goalsThisQuarter"
                />
                
                <AIEnhancedTextarea
                  id="successStory"
                  label="Share a Success Story (Optional)"
                  value={formData.successStory}
                  onChange={(value) => handleInputChange("successStory", value)}
                  placeholder="- Client: $50M automotive supplier
- Challenge: High production costs
- Solution: Lean manufacturing
- Result: 22% cost reduction, $2.2M savings"
                  rows={3}
                  fieldKey="successStory"
                />
              </div>
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
