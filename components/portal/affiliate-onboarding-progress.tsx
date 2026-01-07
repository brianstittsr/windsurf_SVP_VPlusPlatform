"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  CheckCircle2,
  Circle,
  ArrowRight,
  UserPlus,
  User,
  Network,
  TrendingUp,
  AlertCircle,
  Sparkles,
  Calendar,
  FileText,
  Award,
} from "lucide-react";
import Link from "next/link";
import { useUserProfile } from "@/contexts/user-profile-context";

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  completed: boolean;
  required: boolean;
  href: string;
  action?: string;
  bonus?: number; // Bonus points for completing this step
}

interface AffiliateOnboardingProgressProps {
  userId?: string;
}

export function AffiliateOnboardingProgress({ userId }: AffiliateOnboardingProgressProps) {
  const { profile, setShowAffiliateOnboarding } = useUserProfile();
  
  // Check if affiliate onboarding wizard is complete - this marks steps 1-3 as done
  const onboardingComplete = profile.affiliateOnboardingComplete;
  
  const [steps, setSteps] = useState<OnboardingStep[]>([
    {
      id: "register",
      title: "Register on Platform",
      description: "Create your affiliate account",
      icon: UserPlus,
      completed: true, // Always true if they're viewing this
      required: true,
      href: "/sign-up",
    },
    {
      id: "profile",
      title: "Setup Your Profile",
      description: "Complete your professional profile with bio, expertise, and contact info",
      icon: User,
      completed: onboardingComplete,
      required: true,
      href: "/portal/profile",
      action: "Complete Profile",
    },
    {
      id: "networking-form",
      title: "Complete Networking Form",
      description: "Fill out your networking preferences and goals",
      icon: Network,
      completed: onboardingComplete,
      required: true,
      href: "/portal/networking/setup",
      action: "Fill Form",
    },
    {
      id: "first-meeting",
      title: "Schedule First 1-to-1 Meeting",
      description: "Connect with another affiliate for your first networking session",
      icon: Calendar,
      completed: false,
      required: false,
      href: "/portal/networking",
      action: "View Recommendations",
    },
    {
      id: "meeting-summary",
      title: "Submit Meeting Summary",
      description: "Document your first meeting and any referrals generated",
      icon: FileText,
      completed: false,
      required: false,
      href: "/portal/networking/meetings",
      action: "Submit Summary",
    },
    {
      id: "networking-profile",
      title: "Complete My Networking Profile",
      description: "Fill out your detailed networking profile for better AI matching",
      icon: Award,
      completed: false,
      required: false,
      href: "/portal/networking/profile",
      action: "Complete Profile",
      bonus: 500,
    },
  ]);

  // Update steps when onboarding status changes
  useEffect(() => {
    setSteps(prev => prev.map(step => {
      if (step.id === "profile" || step.id === "networking-form") {
        return { ...step, completed: onboardingComplete };
      }
      return step;
    }));
  }, [onboardingComplete]);

  // Handler to open the onboarding wizard
  const handleOpenOnboarding = () => {
    setShowAffiliateOnboarding(true);
  };

  const completedSteps = steps.filter(s => s.completed).length;
  const totalSteps = steps.length;
  const requiredSteps = steps.filter(s => s.required);
  const completedRequired = requiredSteps.filter(s => s.completed).length;
  const progressPercentage = (completedSteps / totalSteps) * 100;
  const isFullyOnboarded = requiredSteps.every(s => s.completed);

  const nextStep = steps.find(s => !s.completed);

  return (
    <div className="space-y-6">
      {/* Progress Overview */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                Affiliate Onboarding Progress
                {isFullyOnboarded && (
                  <Badge className="bg-green-500">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    Completed
                  </Badge>
                )}
              </CardTitle>
              <CardDescription>
                Complete these steps to become a fully active affiliate
              </CardDescription>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold">{completedSteps}/{totalSteps}</div>
              <p className="text-xs text-muted-foreground">Steps completed</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-muted-foreground">Overall Progress</span>
              <span className="font-medium">{progressPercentage.toFixed(0)}%</span>
            </div>
            <Progress value={progressPercentage} className="h-2" />
          </div>

          {!isFullyOnboarded && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                <div className="flex-1">
                  <p className="font-medium text-blue-900">Required Steps Remaining</p>
                  <p className="text-sm text-blue-700">
                    {completedRequired}/{requiredSteps.length} required steps completed
                  </p>
                </div>
              </div>
            </div>
          )}

          {isFullyOnboarded && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
                <div className="flex-1">
                  <p className="font-medium text-green-900">You're All Set!</p>
                  <p className="text-sm text-green-700">
                    You've completed all required onboarding steps. Start networking and generating referrals!
                  </p>
                </div>
                <Button asChild size="sm" className="bg-green-600">
                  <Link href="/portal/networking">
                    Start Networking
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Link>
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Steps Checklist */}
      <Card>
        <CardHeader>
          <CardTitle>Onboarding Checklist</CardTitle>
          <CardDescription>Follow these steps to get started</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {steps.map((step, index) => {
              const StepIcon = step.icon;
              const isNext = nextStep?.id === step.id;

              return (
                <div
                  key={step.id}
                  className={`border rounded-lg p-4 transition-all ${
                    isNext ? "border-primary bg-primary/5" : ""
                  } ${step.completed ? "bg-muted/50" : ""}`}
                >
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          step.completed
                            ? "bg-green-500 text-white"
                            : isNext
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {step.completed ? (
                          <CheckCircle2 className="h-5 w-5" />
                        ) : (
                          <span className="font-semibold">{index + 1}</span>
                        )}
                      </div>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <StepIcon className="h-4 w-4 text-muted-foreground" />
                            <h3 className="font-semibold">{step.title}</h3>
                            {step.required && !step.completed && (
                              <Badge variant="outline" className="text-xs">Required</Badge>
                            )}
                            {step.bonus && !step.completed && (
                              <Badge className="text-xs bg-yellow-500 text-white">
                                <Sparkles className="h-3 w-3 mr-1" />
                                +{step.bonus} pts
                              </Badge>
                            )}
                            {isNext && (
                              <Badge className="text-xs bg-primary">Next Step</Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">{step.description}</p>
                        </div>

                        {!step.completed && step.action && (
                          (step.id === "profile" || step.id === "networking-form") ? (
                            <Button 
                              size="sm" 
                              variant={isNext ? "default" : "outline"}
                              onClick={handleOpenOnboarding}
                            >
                              {step.id === "profile" ? "Complete Profile" : "Fill Form"}
                              <ArrowRight className="h-4 w-4 ml-2" />
                            </Button>
                          ) : (
                            <Button asChild size="sm" variant={isNext ? "default" : "outline"}>
                              <Link href={step.href}>
                                {step.action}
                                <ArrowRight className="h-4 w-4 ml-2" />
                              </Link>
                            </Button>
                          )
                        )}

                        {step.completed && (
                          <Badge className="bg-green-500">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Done
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      {isFullyOnboarded && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Network className="h-4 w-4" />
                Networking Dashboard
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-3">
                View AI-powered connection recommendations
              </p>
              <Button asChild size="sm" className="w-full">
                <Link href="/portal/networking">
                  <Sparkles className="h-4 w-4 mr-2" />
                  View Matches
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Leaderboard
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-3">
                See how you rank among affiliates
              </p>
              <Button asChild size="sm" variant="outline" className="w-full">
                <Link href="/portal/networking/leaderboard">
                  View Rankings
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Meeting History
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-3">
                Review past meetings and referrals
              </p>
              <Button asChild size="sm" variant="outline" className="w-full">
                <Link href="/portal/networking/meetings">
                  View History
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
