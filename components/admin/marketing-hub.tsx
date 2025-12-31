"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import {
  Megaphone,
  Target,
  Star,
  Share2,
  Mail,
  Video,
  UserPlus,
  Tag,
  TrendingUp,
  CheckCircle2,
  Circle,
  Clock,
  DollarSign,
  Users,
  BarChart3,
  Settings,
  Zap,
  Eye,
  MessageSquare,
  Calendar,
  Image as ImageIcon,
  FileText,
  Link as LinkIcon,
  Gift,
  Percent,
  RefreshCw,
  ArrowRight,
} from "lucide-react";
import { ReputationManagement } from "./marketing/reputation-management";
import { EmailMarketing } from "./marketing/email-marketing";
import { SocialMediaManagement } from "./marketing/social-media-management";
import { LeadGeneration } from "./marketing/lead-generation";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface Feature {
  title: string;
  completed: boolean;
  items: string[];
}

interface MarketingSection {
  id: string;
  title: string;
  icon: React.ElementType;
  status: "not_started" | "in_progress" | "partial" | "completed";
  description: string;
  features: Feature[];
  priority: number;
}

export function MarketingHub() {
  const [activeSection, setActiveSection] = useState<string>("overview");

  const marketingSections: MarketingSection[] = [
    {
      id: "paid-traffic",
      title: "Paid Traffic Management",
      icon: Target,
      status: "in_progress",
      description: "Manage advertising campaigns across multiple platforms",
      priority: 5,
      features: [
        {
          title: "Multi-Platform Ad Management",
          completed: false,
          items: [
            "Google Ads integration (API connection)",
            "Facebook/Meta Ads Manager integration",
            "Instagram Ads integration",
            "TikTok Ads integration",
            "Dashboard to view all campaigns in one place",
            "Create/edit/pause campaigns from admin panel",
          ],
        },
        {
          title: "Audience Targeting",
          completed: false,
          items: [
            "Custom audience builder",
            "Lookalike audience creation",
            "Demographic targeting options",
            "Interest-based targeting",
            "Retargeting pixel management",
          ],
        },
        {
          title: "Campaign Optimization",
          completed: false,
          items: [
            "A/B testing tools",
            "Auto-optimization rules",
            "Performance alerts and notifications",
            "Bid strategy recommendations",
          ],
        },
        {
          title: "Budget Tracking",
          completed: false,
          items: [
            "Daily/weekly/monthly budget views",
            "Spend alerts when approaching limits",
            "Budget allocation across platforms",
            "Cost per acquisition tracking",
          ],
        },
        {
          title: "ROI Calculator",
          completed: false,
          items: [
            "Revenue tracking integration",
            "ROAS (Return on Ad Spend) calculator",
            "Customer lifetime value estimation",
            "Break-even analysis tool",
          ],
        },
      ],
    },
    {
      id: "retargeting",
      title: "Retargeting",
      icon: RefreshCw,
      status: "not_started",
      description: "Re-engage visitors with targeted campaigns",
      priority: 6,
      features: [
        {
          title: "Pixel Management",
          completed: false,
          items: [
            "Facebook Pixel installation wizard",
            "Google Tag Manager integration",
            "TikTok Pixel setup",
            "Custom event tracking",
          ],
        },
        {
          title: "Audience Segments",
          completed: false,
          items: [
            "Website visitors (last 7/30/90 days)",
            "Cart abandoners",
            "Past customers",
            "Email list uploads",
          ],
        },
        {
          title: "Retargeting Campaigns",
          completed: false,
          items: [
            "Dynamic product ads",
            "Abandoned booking reminders",
            "Cross-sell/upsell campaigns",
          ],
        },
      ],
    },
    {
      id: "reputation",
      title: "Reputation Management",
      icon: Star,
      status: "partial",
      description: "Monitor and manage your online reputation",
      priority: 1,
      features: [
        {
          title: "Review Aggregation",
          completed: false,
          items: [
            "Google Reviews integration ✓",
            "Yelp Reviews integration",
            "Facebook Reviews integration",
            "Unified review dashboard",
          ],
        },
        {
          title: "Review Response",
          completed: false,
          items: [
            "AI-powered response suggestions",
            "Template responses library",
            "Response tracking and analytics",
          ],
        },
        {
          title: "Review Generation",
          completed: false,
          items: [
            "Automated review request emails",
            "SMS review request campaigns",
            "QR code for in-store review requests",
            "Review incentive tracking",
          ],
        },
      ],
    },
    {
      id: "social-media",
      title: "Social Media Management",
      icon: Share2,
      status: "not_started",
      description: "Schedule and manage social media content",
      priority: 3,
      features: [
        {
          title: "Content Calendar",
          completed: false,
          items: [
            "Visual calendar view",
            "Drag-and-drop scheduling",
            "Multi-platform posting",
            "Content library",
          ],
        },
        {
          title: "Platform Integrations",
          completed: false,
          items: [
            "Instagram posting/scheduling",
            "Facebook posting/scheduling",
            "TikTok posting/scheduling",
            "Pinterest posting/scheduling",
          ],
        },
        {
          title: "Analytics Dashboard",
          completed: false,
          items: [
            "Engagement metrics",
            "Follower growth tracking",
            "Best posting times analysis",
            "Hashtag performance",
          ],
        },
      ],
    },
    {
      id: "email-marketing",
      title: "Email Marketing",
      icon: Mail,
      status: "not_started",
      description: "Create and manage email campaigns",
      priority: 2,
      features: [
        {
          title: "Email Builder",
          completed: false,
          items: [
            "Drag-and-drop email editor",
            "Pre-built templates",
            "Mobile-responsive designs",
            "Brand asset library",
          ],
        },
        {
          title: "Campaign Management",
          completed: false,
          items: [
            "Scheduled campaigns",
            "Automated sequences",
            "A/B testing",
            "Segmentation",
          ],
        },
        {
          title: "Analytics",
          completed: false,
          items: [
            "Open rates",
            "Click-through rates",
            "Conversion tracking",
            "Unsubscribe management",
          ],
        },
      ],
    },
    {
      id: "video-marketing",
      title: "Video Marketing",
      icon: Video,
      status: "not_started",
      description: "Manage and distribute video content",
      priority: 7,
      features: [
        {
          title: "Video Library",
          completed: false,
          items: [
            "Upload and organize videos",
            "Thumbnail generation",
            "Video compression",
          ],
        },
        {
          title: "YouTube Integration",
          completed: false,
          items: [
            "Upload to YouTube",
            "Analytics sync",
            "Playlist management",
          ],
        },
        {
          title: "Video Embedding",
          completed: false,
          items: [
            "Embed videos on website",
            "Video testimonials section",
            "Before/after video galleries",
          ],
        },
      ],
    },
    {
      id: "lead-generation",
      title: "Lead Generation",
      icon: UserPlus,
      status: "not_started",
      description: "Capture and qualify leads",
      priority: 4,
      features: [
        {
          title: "Lead Capture Forms",
          completed: false,
          items: [
            "Form builder",
            "Pop-up forms",
            "Exit-intent forms",
            "Embedded forms",
          ],
        },
        {
          title: "Lead Magnets",
          completed: false,
          items: [
            "PDF download delivery",
            "Discount code delivery",
            "Consultation booking",
          ],
        },
        {
          title: "Lead Scoring",
          completed: false,
          items: [
            "Engagement scoring",
            "Source tracking",
            "Qualification criteria",
          ],
        },
      ],
    },
    {
      id: "online-offers",
      title: "Online Offers",
      icon: Gift,
      status: "not_started",
      description: "Create and track promotional offers",
      priority: 8,
      features: [
        {
          title: "Coupon Management",
          completed: false,
          items: [
            "Create discount codes",
            "Usage limits",
            "Expiration dates",
            "Tracking and analytics",
          ],
        },
        {
          title: "Flash Sales",
          completed: false,
          items: [
            "Countdown timers",
            "Limited availability",
            "Urgency messaging",
          ],
        },
        {
          title: "Referral Program",
          completed: false,
          items: [
            "Referral link generation",
            "Reward tracking",
            "Automated payouts",
          ],
        },
      ],
    },
    {
      id: "ppc-campaigns",
      title: "PPC Campaigns",
      icon: TrendingUp,
      status: "not_started",
      description: "Advanced pay-per-click advertising",
      priority: 9,
      features: [
        {
          title: "Campaign Builder",
          completed: false,
          items: [
            "Keyword research tools",
            "Ad copy generator",
            "Landing page builder",
          ],
        },
        {
          title: "Bid Management",
          completed: false,
          items: [
            "Automated bidding",
            "Budget pacing",
            "Competitor analysis",
          ],
        },
        {
          title: "Reporting",
          completed: false,
          items: [
            "Click-through rates",
            "Quality scores",
            "Conversion tracking",
          ],
        },
      ],
    },
  ];

  const getStatusBadge = (status: MarketingSection["status"]) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-green-500">Completed</Badge>;
      case "in_progress":
        return <Badge className="bg-blue-500">In Progress</Badge>;
      case "partial":
        return <Badge className="bg-yellow-500">Partially Implemented</Badge>;
      case "not_started":
        return <Badge variant="outline">Not Started</Badge>;
    }
  };

  const calculateProgress = (section: MarketingSection) => {
    const totalItems = section.features.reduce((acc, f) => acc + f.items.length, 0);
    const completedItems = section.features.reduce(
      (acc, f) => acc + (f.completed ? f.items.length : 0),
      0
    );
    return totalItems > 0 ? (completedItems / totalItems) * 100 : 0;
  };

  const overallProgress = () => {
    const total = marketingSections.length;
    const completed = marketingSections.filter((s) => s.status === "completed").length;
    const inProgress = marketingSections.filter((s) => s.status === "in_progress" || s.status === "partial").length;
    return {
      completed,
      inProgress,
      notStarted: total - completed - inProgress,
      percentage: (completed / total) * 100,
    };
  };

  const stats = overallProgress();

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Megaphone className="h-8 w-8 text-primary" />
            Marketing Hub
          </h1>
          <p className="text-muted-foreground mt-1">
            Comprehensive marketing solutions suite to drive traffic and manage campaigns
          </p>
        </div>
        <Button>
          <Settings className="h-4 w-4 mr-2" />
          Configure
        </Button>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Overall Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.percentage.toFixed(0)}%</div>
            <Progress value={stats.percentage} className="mt-2" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Completed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
            <p className="text-xs text-muted-foreground">of {marketingSections.length} modules</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              In Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.inProgress}</div>
            <p className="text-xs text-muted-foreground">modules active</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Not Started
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-600">{stats.notStarted}</div>
            <p className="text-xs text-muted-foreground">modules pending</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeSection} onValueChange={setActiveSection} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3 lg:grid-cols-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="modules">Modules</TabsTrigger>
          <TabsTrigger value="priority">Priority</TabsTrigger>
          <TabsTrigger value="status">Status</TabsTrigger>
          <TabsTrigger value="roadmap">Roadmap</TabsTrigger>
          <TabsTrigger value="technical">Technical</TabsTrigger>
        </TabsList>

        {/* Modules Tab */}
        <TabsContent value="modules" className="space-y-4">
          <Tabs defaultValue="reputation" className="space-y-4">
            <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4">
              <TabsTrigger value="reputation">
                <Star className="h-4 w-4 mr-2" />
                Reputation
              </TabsTrigger>
              <TabsTrigger value="email">
                <Mail className="h-4 w-4 mr-2" />
                Email
              </TabsTrigger>
              <TabsTrigger value="social">
                <Share2 className="h-4 w-4 mr-2" />
                Social Media
              </TabsTrigger>
              <TabsTrigger value="leads">
                <UserPlus className="h-4 w-4 mr-2" />
                Lead Gen
              </TabsTrigger>
            </TabsList>

            <TabsContent value="reputation">
              <ReputationManagement />
            </TabsContent>

            <TabsContent value="email">
              <EmailMarketing />
            </TabsContent>

            <TabsContent value="social">
              <SocialMediaManagement />
            </TabsContent>

            <TabsContent value="leads">
              <LeadGeneration />
            </TabsContent>
          </Tabs>
        </TabsContent>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {marketingSections.map((section) => {
              const SectionIcon = section.icon;
              const progress = calculateProgress(section);
              
              const hasModule = ["reputation", "email-marketing", "social-media", "lead-generation"].includes(section.id);
              
              return (
                <Card key={section.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <SectionIcon className="h-5 w-5 text-primary" />
                        <CardTitle className="text-lg">{section.title}</CardTitle>
                      </div>
                      {getStatusBadge(section.status)}
                    </div>
                    <CardDescription>{section.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-muted-foreground">Progress</span>
                        <span className="font-medium">{progress.toFixed(0)}%</span>
                      </div>
                      <Progress value={progress} />
                    </div>
                    <div className="space-y-2">
                      {section.features.map((feature, idx) => (
                        <div key={idx} className="flex items-start gap-2 text-sm">
                          {feature.completed ? (
                            <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                          ) : (
                            <Circle className="h-4 w-4 text-gray-300 mt-0.5 flex-shrink-0" />
                          )}
                          <span className={feature.completed ? "line-through text-muted-foreground" : ""}>
                            {feature.title}
                          </span>
                        </div>
                      ))}
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        Priority: {section.priority}
                      </div>
                      {hasModule && (
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => setActiveSection("modules")}
                        >
                          Open Module
                          <ArrowRight className="h-3 w-3 ml-1" />
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* Priority Tab */}
        <TabsContent value="priority" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recommended Implementation Order</CardTitle>
              <CardDescription>
                Features ordered by business impact and dependencies
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                {[...marketingSections]
                  .sort((a, b) => a.priority - b.priority)
                  .map((section, idx) => {
                    const SectionIcon = section.icon;
                    return (
                      <AccordionItem key={section.id} value={section.id}>
                        <AccordionTrigger>
                          <div className="flex items-center gap-3 text-left">
                            <Badge variant="outline" className="font-mono">
                              #{idx + 1}
                            </Badge>
                            <SectionIcon className="h-5 w-5 text-primary" />
                            <span className="font-semibold">{section.title}</span>
                            {getStatusBadge(section.status)}
                          </div>
                        </AccordionTrigger>
                        <AccordionContent>
                          <div className="pl-16 space-y-3">
                            <p className="text-sm text-muted-foreground">{section.description}</p>
                            {section.features.map((feature, fIdx) => (
                              <div key={fIdx} className="space-y-2">
                                <h4 className="font-medium text-sm">{feature.title}</h4>
                                <ul className="space-y-1 ml-4">
                                  {feature.items.map((item, iIdx) => (
                                    <li key={iIdx} className="text-sm text-muted-foreground flex items-start gap-2">
                                      <span className="text-primary mt-1">•</span>
                                      {item}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            ))}
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    );
                  })}
              </Accordion>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Status Tab */}
        <TabsContent value="status" className="space-y-4">
          {["completed", "in_progress", "partial", "not_started"].map((status) => {
            const sections = marketingSections.filter((s) => s.status === status);
            if (sections.length === 0) return null;

            return (
              <Card key={status}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    {status === "completed" && <CheckCircle2 className="h-5 w-5 text-green-500" />}
                    {status === "in_progress" && <Zap className="h-5 w-5 text-blue-500" />}
                    {status === "partial" && <Clock className="h-5 w-5 text-yellow-500" />}
                    {status === "not_started" && <Circle className="h-5 w-5 text-gray-400" />}
                    {status.replace("_", " ").charAt(0).toUpperCase() + status.slice(1).replace("_", " ")}
                  </CardTitle>
                  <CardDescription>{sections.length} modules</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {sections.map((section) => {
                      const SectionIcon = section.icon;
                      return (
                        <div key={section.id} className="border rounded-lg p-4 space-y-2">
                          <div className="flex items-center gap-2">
                            <SectionIcon className="h-4 w-4 text-primary" />
                            <h3 className="font-semibold">{section.title}</h3>
                          </div>
                          <p className="text-sm text-muted-foreground">{section.description}</p>
                          <div className="text-xs text-muted-foreground">
                            Priority: {section.priority} | {section.features.length} feature groups
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </TabsContent>

        {/* Roadmap Tab */}
        <TabsContent value="roadmap" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Development Roadmap</CardTitle>
              <CardDescription>
                Phased approach to building the Marketing Hub
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {[
                {
                  phase: "Phase 1: Foundation",
                  items: ["Reputation Management", "Email Marketing"],
                  description: "Build on existing Google Reviews and establish email capabilities",
                },
                {
                  phase: "Phase 2: Engagement",
                  items: ["Social Media Management", "Lead Generation"],
                  description: "Content scheduling and lead capture systems",
                },
                {
                  phase: "Phase 3: Growth",
                  items: ["Paid Traffic", "Retargeting"],
                  description: "Scale with advertising and re-engagement",
                },
                {
                  phase: "Phase 4: Advanced",
                  items: ["Video Marketing", "Online Offers", "PPC Campaigns"],
                  description: "Advanced marketing capabilities",
                },
              ].map((phase, idx) => (
                <div key={idx} className="relative pl-8 pb-6 border-l-2 border-primary/20 last:border-0">
                  <div className="absolute -left-3 top-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">
                    {idx + 1}
                  </div>
                  <div className="space-y-2">
                    <h3 className="font-bold text-lg">{phase.phase}</h3>
                    <p className="text-sm text-muted-foreground">{phase.description}</p>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {phase.items.map((item, itemIdx) => (
                        <Badge key={itemIdx} variant="secondary">
                          {item}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Technical Tab */}
        <TabsContent value="technical" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Technical Requirements</CardTitle>
              <CardDescription>
                Infrastructure and integrations needed for the Marketing Hub
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  {
                    title: "API Credentials",
                    icon: LinkIcon,
                    items: [
                      "Google Ads API",
                      "Facebook/Meta Business API",
                      "TikTok Marketing API",
                      "YouTube Data API",
                      "Email service provider API",
                    ],
                  },
                  {
                    title: "Database Schema",
                    icon: FileText,
                    items: [
                      "Unified analytics database",
                      "Campaign tracking tables",
                      "Lead scoring system",
                      "Review aggregation storage",
                    ],
                  },
                  {
                    title: "Real-time Updates",
                    icon: Zap,
                    items: [
                      "Webhook handlers for platform events",
                      "Real-time campaign performance sync",
                      "Notification system for alerts",
                    ],
                  },
                  {
                    title: "Access Control",
                    icon: Users,
                    items: [
                      "Role-based access for team members",
                      "Permission levels for campaigns",
                      "Audit logging for changes",
                    ],
                  },
                ].map((req, idx) => {
                  const ReqIcon = req.icon;
                  return (
                    <div key={idx} className="border rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <ReqIcon className="h-5 w-5 text-primary" />
                        <h3 className="font-semibold">{req.title}</h3>
                      </div>
                      <ul className="space-y-2 ml-7">
                        {req.items.map((item, itemIdx) => (
                          <li key={itemIdx} className="text-sm text-muted-foreground flex items-start gap-2">
                            <Circle className="h-3 w-3 mt-1 flex-shrink-0" />
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
