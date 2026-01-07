"use client";

import { useState, useEffect } from "react";
import { useUserProfile } from "@/contexts/user-profile-context";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Sparkles,
  Users,
  TrendingUp,
  Target,
  Zap,
  Calendar,
  MessageSquare,
  CheckCircle2,
  AlertCircle,
  Building,
  Briefcase,
  MapPin,
  Clock,
  ArrowRight,
  RefreshCw,
  ThumbsUp,
  ThumbsDown,
  Send,
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";

interface NetworkingMatch {
  id: string;
  name: string;
  company: string;
  title: string;
  avatar?: string;
  matchScore: number;
  matchReason: string;
  complementaryGoals: string[];
  sharedIndustries: string[];
  potentialSynergies: string[];
  availability: string;
  lastActive: string;
  meetingCount: number;
  referralsGiven: number;
  aiInsight: string;
  matchType: "high-value" | "complementary" | "unlikely" | "strategic";
}

interface ActivityAlert {
  id: string;
  type: "low-activity" | "missed-opportunity" | "follow-up" | "streak-risk";
  title: string;
  message: string;
  recommendation: string;
  suggestedAction: string;
  priority: "high" | "medium" | "low";
}

export function AINetworkingRecommendations() {
  const { linkedTeamMember } = useUserProfile();
  const [activeTab, setActiveTab] = useState("recommendations");
  const [selectedMatch, setSelectedMatch] = useState<NetworkingMatch | null>(null);
  const [customMessage, setCustomMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [matches, setMatches] = useState<NetworkingMatch[]>([]);
  const [alerts, setAlerts] = useState<ActivityAlert[]>([]);

  // Fetch AI recommendations from the API
  const fetchRecommendations = async (refresh = false) => {
    if (refresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }

    try {
      if (!linkedTeamMember?.id) {
        setIsLoading(false);
        setIsRefreshing(false);
        return;
      }

      // Fetch AI match recommendations
      const response = await fetch("/api/ai/networking/recommendations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          affiliateId: linkedTeamMember.id,
          limit: 5,
          includeUnlikely: true,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.recommendations) {
          const transformedMatches: NetworkingMatch[] = data.recommendations.map((rec: any) => ({
            id: rec.id,
            name: rec.name,
            company: rec.company || "Unknown Company",
            title: rec.title || "Professional",
            matchScore: rec.matchScore || 0,
            matchReason: rec.matchReason || "Potential networking opportunity",
            complementaryGoals: rec.complementaryGoals || [],
            sharedIndustries: rec.sharedIndustries || [],
            potentialSynergies: rec.potentialSynergies || [],
            availability: rec.availability || "Flexible",
            lastActive: rec.lastActive || "Recently",
            meetingCount: rec.meetingCount || 0,
            referralsGiven: rec.referralsGiven || 0,
            aiInsight: rec.aiInsight || "This connection could provide valuable networking opportunities.",
            matchType: rec.matchType || "complementary",
          }));
          setMatches(transformedMatches);

          // Generate activity alerts based on data
          const newAlerts: ActivityAlert[] = [];
          
          // Check for high-value matches
          const highValueMatch = transformedMatches.find((m: NetworkingMatch) => m.matchScore >= 90);
          if (highValueMatch) {
            newAlerts.push({
              id: "high-value",
              type: "missed-opportunity",
              title: "High-Value Match Available",
              message: `${highValueMatch.name} is a ${highValueMatch.matchScore}% match`,
              recommendation: "Reach out soon to connect with this highly compatible partner.",
              suggestedAction: `Request meeting with ${highValueMatch.name}`,
              priority: "high",
            });
          }

          setAlerts(newAlerts);
        }
      }
    } catch (error) {
      console.error("Error fetching recommendations:", error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchRecommendations();
  }, [linkedTeamMember?.id]);

  const getMatchTypeBadge = (type: NetworkingMatch["matchType"]) => {
    const configs = {
      "high-value": { label: "High Value", className: "bg-green-500" },
      complementary: { label: "Complementary", className: "bg-blue-500" },
      unlikely: { label: "Unlikely Gem", className: "bg-purple-500" },
      strategic: { label: "Strategic", className: "bg-orange-500" },
    };
    const config = configs[type];
    return <Badge className={config.className}>{config.label}</Badge>;
  };

  const getPriorityBadge = (priority: ActivityAlert["priority"]) => {
    const configs = {
      high: { label: "High Priority", className: "bg-red-500" },
      medium: { label: "Medium", className: "bg-yellow-500" },
      low: { label: "Low", className: "bg-gray-500" },
    };
    const config = configs[priority];
    return <Badge className={config.className}>{config.label}</Badge>;
  };

  const generateAIMessage = (match: NetworkingMatch) => {
    return `Hi ${match.name.split(" ")[0]},

I came across your profile through the Strategic Value+ affiliate network and was impressed by your work at ${match.company}.

${match.aiInsight}

I'd love to connect for a brief virtual coffee to explore potential synergies between our businesses. ${match.potentialSynergies[0]}, and I think we could provide value to each other's networks.

Are you available for a 30-minute call ${match.availability.toLowerCase()}?

Looking forward to connecting!`;
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-purple-500" />
            AI-Powered Networking
          </h2>
          <p className="text-muted-foreground">Smart recommendations to grow your network</p>
        </div>
        <Button variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh Matches
        </Button>
      </div>

      {/* Activity Alerts */}
      {alerts.length > 0 && (
        <div className="space-y-3">
          {alerts.map((alert) => (
            <Card key={alert.id} className="border-l-4 border-l-orange-500">
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
                      <AlertCircle className="h-5 w-5 text-orange-600" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="font-semibold">{alert.title}</h3>
                        <p className="text-sm text-muted-foreground">{alert.message}</p>
                      </div>
                      {getPriorityBadge(alert.priority)}
                    </div>
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-3">
                      <p className="text-sm font-medium text-blue-900 mb-1">
                        AI Recommendation:
                      </p>
                      <p className="text-sm text-blue-700">{alert.recommendation}</p>
                    </div>
                    <Button size="sm" className="mt-3">
                      {alert.suggestedAction}
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="recommendations">
            <Sparkles className="h-4 w-4 mr-2" />
            Recommendations
          </TabsTrigger>
          <TabsTrigger value="unlikely">
            <Zap className="h-4 w-4 mr-2" />
            Unlikely Matches
          </TabsTrigger>
          <TabsTrigger value="insights">
            <TrendingUp className="h-4 w-4 mr-2" />
            Insights
          </TabsTrigger>
        </TabsList>

        <TabsContent value="recommendations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Your Top Matches</CardTitle>
              <CardDescription>
                AI-curated connections based on your profile and networking goals
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {matches
                  .filter((m) => m.matchType !== "unlikely")
                  .map((match) => (
                    <Card key={match.id} className="overflow-hidden">
                      <CardContent className="p-6">
                        <div className="flex items-start gap-4">
                          <Avatar className="h-16 w-16">
                            <AvatarImage src={match.avatar} />
                            <AvatarFallback className="bg-primary/10 text-primary text-lg">
                              {getInitials(match.name)}
                            </AvatarFallback>
                          </Avatar>

                          <div className="flex-1">
                            <div className="flex items-start justify-between mb-2">
                              <div>
                                <div className="flex items-center gap-2 mb-1">
                                  <h3 className="font-bold text-lg">{match.name}</h3>
                                  {getMatchTypeBadge(match.matchType)}
                                </div>
                                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                                  <span className="flex items-center gap-1">
                                    <Briefcase className="h-3 w-3" />
                                    {match.title}
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <Building className="h-3 w-3" />
                                    {match.company}
                                  </span>
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="text-3xl font-bold text-primary">
                                  {match.matchScore}%
                                </div>
                                <p className="text-xs text-muted-foreground">Match Score</p>
                              </div>
                            </div>

                            <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 mb-3">
                              <div className="flex items-start gap-2">
                                <Sparkles className="h-4 w-4 text-purple-600 mt-0.5 flex-shrink-0" />
                                <div>
                                  <p className="text-sm font-medium text-purple-900">
                                    AI Insight:
                                  </p>
                                  <p className="text-sm text-purple-700">{match.aiInsight}</p>
                                </div>
                              </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                              <div>
                                <p className="text-xs font-medium text-muted-foreground mb-1">
                                  Why This Match?
                                </p>
                                <p className="text-sm">{match.matchReason}</p>
                              </div>
                              <div>
                                <p className="text-xs font-medium text-muted-foreground mb-1">
                                  Potential Synergies
                                </p>
                                <ul className="text-sm space-y-1">
                                  {match.potentialSynergies.slice(0, 2).map((synergy, idx) => (
                                    <li key={idx} className="flex items-start gap-1">
                                      <CheckCircle2 className="h-3 w-3 text-green-500 mt-0.5 flex-shrink-0" />
                                      <span>{synergy}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            </div>

                            <div className="flex items-center gap-4 text-xs text-muted-foreground mb-4">
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {match.availability}
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {match.lastActive}
                              </span>
                              <span className="flex items-center gap-1">
                                <Users className="h-3 w-3" />
                                {match.meetingCount} meetings
                              </span>
                              <span className="flex items-center gap-1">
                                <Target className="h-3 w-3" />
                                {match.referralsGiven} referrals given
                              </span>
                            </div>

                            <div className="flex gap-2">
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button
                                    onClick={() => {
                                      setSelectedMatch(match);
                                      setCustomMessage(generateAIMessage(match));
                                    }}
                                  >
                                    <Send className="h-4 w-4 mr-2" />
                                    Request Meeting
                                  </Button>
                                </DialogTrigger>
                                <DialogContent className="max-w-2xl">
                                  <DialogHeader>
                                    <DialogTitle>Request Meeting with {match.name}</DialogTitle>
                                    <DialogDescription>
                                      AI-generated message based on your profiles
                                    </DialogDescription>
                                  </DialogHeader>
                                  <div className="space-y-4">
                                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                                      <div className="flex items-start gap-2">
                                        <Sparkles className="h-4 w-4 text-blue-600 mt-0.5" />
                                        <p className="text-sm text-blue-700">
                                          This message has been personalized based on your shared
                                          interests and complementary goals. Feel free to edit it!
                                        </p>
                                      </div>
                                    </div>
                                    <Textarea
                                      value={customMessage}
                                      onChange={(e) => setCustomMessage(e.target.value)}
                                      rows={12}
                                      className="font-mono text-sm"
                                    />
                                    <div className="flex justify-end gap-2">
                                      <Button variant="outline">Cancel</Button>
                                      <Button>
                                        <Send className="h-4 w-4 mr-2" />
                                        Send Request
                                      </Button>
                                    </div>
                                  </div>
                                </DialogContent>
                              </Dialog>
                              <Button variant="outline">View Full Profile</Button>
                              <Button variant="ghost" size="icon">
                                <ThumbsDown className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="unlikely" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-purple-500" />
                Unlikely Connections
              </CardTitle>
              <CardDescription>
                AI-identified "unlikely" matches that could lead to breakthrough opportunities
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-4">
                <p className="text-sm text-purple-900">
                  <strong>Why unlikely matches matter:</strong> Research shows that weak ties and
                  unexpected connections often lead to the most valuable opportunities. These
                  matches may seem unconventional, but they could unlock new markets, perspectives,
                  or partnerships you haven't considered.
                </p>
              </div>

              <div className="space-y-4">
                {matches
                  .filter((m) => m.matchType === "unlikely")
                  .map((match) => (
                    <Card key={match.id}>
                      <CardContent className="p-6">
                        <div className="flex items-start gap-4">
                          <Avatar className="h-16 w-16">
                            <AvatarFallback className="bg-purple-100 text-purple-600 text-lg">
                              {getInitials(match.name)}
                            </AvatarFallback>
                          </Avatar>

                          <div className="flex-1">
                            <div className="flex items-start justify-between mb-2">
                              <div>
                                <div className="flex items-center gap-2 mb-1">
                                  <h3 className="font-bold text-lg">{match.name}</h3>
                                  {getMatchTypeBadge(match.matchType)}
                                </div>
                                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                                  <span className="flex items-center gap-1">
                                    <Briefcase className="h-3 w-3" />
                                    {match.title}
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <Building className="h-3 w-3" />
                                    {match.company}
                                  </span>
                                </div>
                              </div>
                            </div>

                            <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 mb-3">
                              <p className="text-sm font-medium text-purple-900 mb-1">
                                Why this unlikely match could work:
                              </p>
                              <p className="text-sm text-purple-700">{match.aiInsight}</p>
                            </div>

                            <div className="space-y-2 mb-3">
                              <p className="text-xs font-medium text-muted-foreground">
                                Potential Synergies:
                              </p>
                              <ul className="text-sm space-y-1">
                                {match.potentialSynergies.map((synergy, idx) => (
                                  <li key={idx} className="flex items-start gap-1">
                                    <Zap className="h-3 w-3 text-purple-500 mt-0.5 flex-shrink-0" />
                                    <span>{synergy}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>

                            <Button>
                              <Send className="h-4 w-4 mr-2" />
                              Take a Chance - Request Meeting
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="insights" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Networking Patterns</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-2">
                    Most successful connections
                  </p>
                  <p className="text-sm">
                    You generate the most referrals when connecting with{" "}
                    <strong>operations managers</strong> in the <strong>manufacturing</strong>{" "}
                    sector.
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Underutilized opportunities</p>
                  <p className="text-sm">
                    Consider expanding into <strong>logistics and supply chain</strong> sectors -
                    high complementary potential.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Activity Trends</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="text-muted-foreground">Meeting frequency</span>
                    <span className="font-medium">Below target</span>
                  </div>
                  <Progress value={60} />
                  <p className="text-xs text-muted-foreground mt-1">
                    Aim for 2-3 meetings per week
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Best meeting times</p>
                  <p className="text-sm">
                    Your meetings scheduled for <strong>Tuesday mornings</strong> have the highest
                    show-up rate (95%).
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Referral Quality</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="text-muted-foreground">Conversion rate</span>
                      <span className="font-semibold">35%</span>
                    </div>
                    <Progress value={35} />
                  </div>
                  <p className="text-sm">
                    Your referrals convert at <strong>15% above network average</strong>. Keep up
                    the quality!
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Growth Opportunities</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <Target className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>
                      Connect with 3 more affiliates in <strong>Professional Services</strong> to
                      unlock new referral channels
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Users className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                    <span>
                      Your network lacks connections in <strong>Finance</strong> - high potential
                      sector
                    </span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
