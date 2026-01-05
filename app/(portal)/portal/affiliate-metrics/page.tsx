"use client";

import { useState, useEffect } from "react";
import { useUserProfile } from "@/contexts/user-profile-context";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Trophy,
  TrendingUp,
  Users,
  DollarSign,
  Calendar,
  ArrowUpRight,
  ArrowDownLeft,
  Target,
  Zap,
  Medal,
  Crown,
  Star,
  Loader2,
  RefreshCw,
} from "lucide-react";

interface AffiliateMetrics {
  affiliateId: string;
  affiliateName: string;
  company: string;
  totalOneToOnes: number;
  oneToOnesThisMonth: number;
  oneToOnesThisQuarter: number;
  referralsGiven: number;
  referralsReceived: number;
  referralsGivenThisMonth: number;
  referralsReceivedThisMonth: number;
  dealsClosedFromGiven: number;
  dealsClosedFromReceived: number;
  totalRevenueGenerated: number;
  totalRevenueReceived: number;
  svpReferralsGiven: number;
  svpReferralsClosed: number;
  svpRevenueGenerated: number;
  givenConversionRate: number;
  receivedConversionRate: number;
  engagementScore: number;
}

export default function AffiliateMetricsPage() {
  const { linkedTeamMember } = useUserProfile();
  const [myMetrics, setMyMetrics] = useState<AffiliateMetrics | null>(null);
  const [leaderboard, setLeaderboard] = useState<AffiliateMetrics[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("my-metrics");

  useEffect(() => {
    fetchData();
  }, [linkedTeamMember]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      // Fetch my metrics
      if (linkedTeamMember) {
        const myResponse = await fetch(`/api/affiliate-metrics?affiliateId=${linkedTeamMember.id}`);
        if (myResponse.ok) {
          const data = await myResponse.json();
          setMyMetrics(data.metrics);
        }
      }

      // Fetch leaderboard
      const leaderboardResponse = await fetch("/api/affiliate-metrics?leaderboard=true");
      if (leaderboardResponse.ok) {
        const data = await leaderboardResponse.json();
        setLeaderboard(data.leaderboard || []);
      }
    } catch (error) {
      console.error("Failed to fetch metrics:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getRankIcon = (index: number) => {
    if (index === 0) return <Crown className="h-5 w-5 text-yellow-500" />;
    if (index === 1) return <Medal className="h-5 w-5 text-gray-400" />;
    if (index === 2) return <Medal className="h-5 w-5 text-amber-600" />;
    return <span className="text-muted-foreground font-medium">{index + 1}</span>;
  };

  const getEngagementColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
    if (score >= 40) return "text-orange-600";
    return "text-red-600";
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Affiliate Metrics</h1>
          <p className="text-muted-foreground">
            Track your networking performance and see how you rank among affiliates
          </p>
        </div>
        <Button onClick={fetchData} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="my-metrics">My Metrics</TabsTrigger>
          <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
        </TabsList>

        <TabsContent value="my-metrics" className="space-y-6">
          {myMetrics ? (
            <>
              {/* Engagement Score Card */}
              <Card className="bg-gradient-to-br from-primary/10 to-primary/5">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-medium">Engagement Score</h3>
                      <p className="text-sm text-muted-foreground">
                        Based on your networking activity this quarter
                      </p>
                    </div>
                    <div className="text-right">
                      <div className={`text-4xl font-bold ${getEngagementColor(myMetrics.engagementScore)}`}>
                        {myMetrics.engagementScore}
                      </div>
                      <p className="text-sm text-muted-foreground">out of 100</p>
                    </div>
                  </div>
                  <Progress value={myMetrics.engagementScore} className="mt-4 h-3" />
                </CardContent>
              </Card>

              {/* Key Metrics Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-blue-100">
                        <Calendar className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">One-to-Ones</p>
                        <p className="text-2xl font-bold">{myMetrics.totalOneToOnes}</p>
                        <p className="text-xs text-muted-foreground">
                          {myMetrics.oneToOnesThisMonth} this month
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-green-100">
                        <ArrowUpRight className="h-5 w-5 text-green-600" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Referrals Given</p>
                        <p className="text-2xl font-bold">{myMetrics.referralsGiven}</p>
                        <p className="text-xs text-muted-foreground">
                          {myMetrics.givenConversionRate}% conversion
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-purple-100">
                        <ArrowDownLeft className="h-5 w-5 text-purple-600" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Referrals Received</p>
                        <p className="text-2xl font-bold">{myMetrics.referralsReceived}</p>
                        <p className="text-xs text-muted-foreground">
                          {myMetrics.receivedConversionRate}% conversion
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-amber-100">
                        <DollarSign className="h-5 w-5 text-amber-600" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Revenue Generated</p>
                        <p className="text-2xl font-bold">
                          ${myMetrics.totalRevenueGenerated.toLocaleString()}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          from referrals given
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Detailed Stats */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Target className="h-5 w-5" />
                      Deal Performance
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Deals Closed (Given)</span>
                      <Badge variant="secondary">{myMetrics.dealsClosedFromGiven}</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Deals Closed (Received)</span>
                      <Badge variant="secondary">{myMetrics.dealsClosedFromReceived}</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Revenue from Received</span>
                      <Badge variant="secondary">
                        ${myMetrics.totalRevenueReceived.toLocaleString()}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Star className="h-5 w-5" />
                      SVP Referrals
                    </CardTitle>
                    <CardDescription>
                      Referrals specifically for SVP services
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">SVP Referrals Given</span>
                      <Badge variant="secondary">{myMetrics.svpReferralsGiven}</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">SVP Referrals Closed</span>
                      <Badge variant="secondary">{myMetrics.svpReferralsClosed}</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">SVP Revenue Generated</span>
                      <Badge className="bg-primary">
                        ${myMetrics.svpRevenueGenerated.toLocaleString()}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <Zap className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="font-medium mb-2">No Metrics Available</h3>
                <p className="text-sm text-muted-foreground">
                  Complete your profile and start networking to see your metrics.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="leaderboard" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-yellow-500" />
                Affiliate Leaderboard
              </CardTitle>
              <CardDescription>
                See how affiliates are performing across the network
              </CardDescription>
            </CardHeader>
            <CardContent>
              {leaderboard.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No leaderboard data available yet.</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">Rank</TableHead>
                      <TableHead>Affiliate</TableHead>
                      <TableHead>Company</TableHead>
                      <TableHead className="text-center">Score</TableHead>
                      <TableHead className="text-center">1-to-1s</TableHead>
                      <TableHead className="text-center">Referrals</TableHead>
                      <TableHead className="text-center">Deals</TableHead>
                      <TableHead className="text-right">Revenue</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {leaderboard.map((affiliate, index) => (
                      <TableRow
                        key={affiliate.affiliateId}
                        className={affiliate.affiliateId === linkedTeamMember?.id ? "bg-primary/5" : ""}
                      >
                        <TableCell className="font-medium">
                          <div className="flex items-center justify-center w-8 h-8">
                            {getRankIcon(index)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                              <span className="text-sm font-medium text-primary">
                                {affiliate.affiliateName.charAt(0)}
                              </span>
                            </div>
                            <span className="font-medium">{affiliate.affiliateName}</span>
                            {affiliate.affiliateId === linkedTeamMember?.id && (
                              <Badge variant="outline" className="text-xs">You</Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {affiliate.company}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge className={`${getEngagementColor(affiliate.engagementScore)} bg-transparent`}>
                            {affiliate.engagementScore}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          {affiliate.totalOneToOnes}
                        </TableCell>
                        <TableCell className="text-center">
                          <span className="text-green-600">{affiliate.referralsGiven}</span>
                          {" / "}
                          <span className="text-purple-600">{affiliate.referralsReceived}</span>
                        </TableCell>
                        <TableCell className="text-center">
                          {affiliate.dealsClosedFromGiven + affiliate.dealsClosedFromReceived}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          ${(affiliate.totalRevenueGenerated + affiliate.totalRevenueReceived).toLocaleString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* Power of SVP Affiliates */}
          <Card className="bg-gradient-to-br from-primary/10 to-primary/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-primary" />
                The Power of SVP Affiliates
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <p className="text-3xl font-bold text-primary">
                    {leaderboard.reduce((sum, a) => sum + a.referralsGiven, 0)}
                  </p>
                  <p className="text-sm text-muted-foreground">Total Referrals Exchanged</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-primary">
                    {leaderboard.reduce((sum, a) => sum + a.dealsClosedFromGiven + a.dealsClosedFromReceived, 0)}
                  </p>
                  <p className="text-sm text-muted-foreground">Deals Closed</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-primary">
                    ${leaderboard.reduce((sum, a) => sum + a.totalRevenueGenerated + a.totalRevenueReceived, 0).toLocaleString()}
                  </p>
                  <p className="text-sm text-muted-foreground">Total Revenue Generated</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
