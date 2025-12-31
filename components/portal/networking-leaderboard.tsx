"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import {
  Trophy,
  TrendingUp,
  Users,
  Handshake,
  Target,
  Award,
  Medal,
  Crown,
  Zap,
  Calendar,
  MessageSquare,
  ArrowUp,
  ArrowDown,
  Minus,
  CheckCircle2,
} from "lucide-react";

interface AffiliateMetrics {
  id: string;
  name: string;
  avatar?: string;
  rank: number;
  previousRank: number;
  totalMeetings: number;
  referralsGiven: number;
  referralsReceived: number;
  svpReferrals: number;
  networkingScore: number;
  streak: number;
  lastActive: string;
}

interface LeaderboardCategory {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
}

export function NetworkingLeaderboard() {
  const [activeCategory, setActiveCategory] = useState("overall");
  const [timeframe, setTimeframe] = useState("month");

  const categories: LeaderboardCategory[] = [
    {
      id: "overall",
      title: "Overall Score",
      description: "Comprehensive networking activity",
      icon: Trophy,
    },
    {
      id: "meetings",
      title: "Most Meetings",
      description: "1-to-1 networking sessions",
      icon: Users,
    },
    {
      id: "referrals-given",
      title: "Referrals Given",
      description: "Helping other affiliates",
      icon: Handshake,
    },
    {
      id: "svp-referrals",
      title: "SVP Referrals",
      description: "Referrals to Strategic Value+",
      icon: Target,
    },
  ];

  const [leaderboard, setLeaderboard] = useState<AffiliateMetrics[]>([
    {
      id: "1",
      name: "Sarah Johnson",
      avatar: undefined,
      rank: 1,
      previousRank: 2,
      totalMeetings: 24,
      referralsGiven: 18,
      referralsReceived: 15,
      svpReferrals: 8,
      networkingScore: 950,
      streak: 12,
      lastActive: "2 hours ago",
    },
    {
      id: "2",
      name: "Michael Chen",
      avatar: undefined,
      rank: 2,
      previousRank: 1,
      totalMeetings: 22,
      referralsGiven: 16,
      referralsReceived: 19,
      svpReferrals: 7,
      networkingScore: 920,
      streak: 8,
      lastActive: "5 hours ago",
    },
    {
      id: "3",
      name: "Emily Rodriguez",
      avatar: undefined,
      rank: 3,
      previousRank: 4,
      totalMeetings: 20,
      referralsGiven: 15,
      referralsReceived: 12,
      svpReferrals: 9,
      networkingScore: 890,
      streak: 15,
      lastActive: "1 day ago",
    },
    {
      id: "4",
      name: "David Thompson",
      avatar: undefined,
      rank: 4,
      previousRank: 3,
      totalMeetings: 19,
      referralsGiven: 14,
      referralsReceived: 16,
      svpReferrals: 6,
      networkingScore: 850,
      streak: 6,
      lastActive: "3 hours ago",
    },
    {
      id: "5",
      name: "Jennifer Martinez",
      avatar: undefined,
      rank: 5,
      previousRank: 5,
      totalMeetings: 18,
      referralsGiven: 13,
      referralsReceived: 14,
      svpReferrals: 5,
      networkingScore: 820,
      streak: 10,
      lastActive: "6 hours ago",
    },
  ]);

  const currentUser = {
    id: "current",
    name: "You",
    rank: 8,
    previousRank: 9,
    totalMeetings: 15,
    referralsGiven: 10,
    referralsReceived: 11,
    svpReferrals: 4,
    networkingScore: 720,
    streak: 5,
    lastActive: "Just now",
  };

  const getRankBadge = (rank: number) => {
    if (rank === 1) {
      return (
        <div className="flex items-center gap-1 text-yellow-600">
          <Crown className="h-5 w-5 fill-yellow-600" />
          <span className="font-bold">1st</span>
        </div>
      );
    }
    if (rank === 2) {
      return (
        <div className="flex items-center gap-1 text-gray-400">
          <Medal className="h-5 w-5 fill-gray-400" />
          <span className="font-bold">2nd</span>
        </div>
      );
    }
    if (rank === 3) {
      return (
        <div className="flex items-center gap-1 text-orange-600">
          <Award className="h-5 w-5 fill-orange-600" />
          <span className="font-bold">3rd</span>
        </div>
      );
    }
    return <span className="font-bold text-muted-foreground">#{rank}</span>;
  };

  const getRankChange = (current: number, previous: number) => {
    if (current < previous) {
      return (
        <Badge className="bg-green-500">
          <ArrowUp className="h-3 w-3 mr-1" />
          {previous - current}
        </Badge>
      );
    }
    if (current > previous) {
      return (
        <Badge variant="destructive">
          <ArrowDown className="h-3 w-3 mr-1" />
          {current - previous}
        </Badge>
      );
    }
    return (
      <Badge variant="outline">
        <Minus className="h-3 w-3 mr-1" />
        Same
      </Badge>
    );
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
            <Trophy className="h-6 w-6 text-yellow-600" />
            Networking Leaderboard
          </h2>
          <p className="text-muted-foreground">See how you rank among affiliates</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={timeframe === "week" ? "default" : "outline"}
            size="sm"
            onClick={() => setTimeframe("week")}
          >
            This Week
          </Button>
          <Button
            variant={timeframe === "month" ? "default" : "outline"}
            size="sm"
            onClick={() => setTimeframe("month")}
          >
            This Month
          </Button>
          <Button
            variant={timeframe === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setTimeframe("all")}
          >
            All Time
          </Button>
        </div>
      </div>

      {/* Your Stats */}
      <Card className="border-primary">
        <CardHeader>
          <CardTitle className="text-base">Your Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Rank</p>
              <div className="flex items-center gap-2 mt-1">
                {getRankBadge(currentUser.rank)}
                {getRankChange(currentUser.rank, currentUser.previousRank)}
              </div>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Score</p>
              <p className="text-2xl font-bold">{currentUser.networkingScore}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Meetings</p>
              <p className="text-2xl font-bold">{currentUser.totalMeetings}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Referrals Given</p>
              <p className="text-2xl font-bold">{currentUser.referralsGiven}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Streak</p>
              <div className="flex items-center gap-1">
                <Zap className="h-5 w-5 text-orange-500" />
                <p className="text-2xl font-bold">{currentUser.streak}</p>
              </div>
            </div>
          </div>
          <div className="mt-4">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-muted-foreground">Progress to Next Rank</span>
              <span className="font-medium">72%</span>
            </div>
            <Progress value={72} />
            <p className="text-xs text-muted-foreground mt-1">
              28 points needed to reach rank #{currentUser.rank - 1}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Category Tabs */}
      <Tabs value={activeCategory} onValueChange={setActiveCategory}>
        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4">
          {categories.map((category) => {
            const Icon = category.icon;
            return (
              <TabsTrigger key={category.id} value={category.id}>
                <Icon className="h-4 w-4 mr-2" />
                {category.title}
              </TabsTrigger>
            );
          })}
        </TabsList>

        {categories.map((category) => (
          <TabsContent key={category.id} value={category.id} className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">{category.title} Rankings</CardTitle>
                <CardDescription>{category.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {leaderboard.map((affiliate) => (
                    <div
                      key={affiliate.id}
                      className={`flex items-center gap-4 p-4 rounded-lg border transition-colors ${
                        affiliate.rank <= 3 ? "bg-muted/50" : ""
                      }`}
                    >
                      <div className="flex-shrink-0 w-12 text-center">
                        {getRankBadge(affiliate.rank)}
                      </div>

                      <Avatar className="h-10 w-10">
                        <AvatarImage src={affiliate.avatar} />
                        <AvatarFallback className="bg-primary/10 text-primary">
                          {getInitials(affiliate.name)}
                        </AvatarFallback>
                      </Avatar>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold">{affiliate.name}</p>
                          {getRankChange(affiliate.rank, affiliate.previousRank)}
                          {affiliate.streak >= 10 && (
                            <Badge variant="outline" className="text-orange-600 border-orange-600">
                              <Zap className="h-3 w-3 mr-1 fill-orange-600" />
                              {affiliate.streak} streak
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">{affiliate.lastActive}</p>
                      </div>

                      <div className="grid grid-cols-4 gap-6 text-center">
                        <div>
                          <p className="text-xs text-muted-foreground">Score</p>
                          <p className="font-bold">{affiliate.networkingScore}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Meetings</p>
                          <p className="font-bold">{affiliate.totalMeetings}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Given</p>
                          <p className="font-bold">{affiliate.referralsGiven}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">SVP</p>
                          <p className="font-bold">{affiliate.svpReferrals}</p>
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Current User Position */}
                  {currentUser.rank > 5 && (
                    <>
                      <div className="flex items-center justify-center py-2">
                        <div className="h-px bg-border flex-1" />
                        <span className="px-4 text-xs text-muted-foreground">...</span>
                        <div className="h-px bg-border flex-1" />
                      </div>

                      <div className="flex items-center gap-4 p-4 rounded-lg border-2 border-primary bg-primary/5">
                        <div className="flex-shrink-0 w-12 text-center">
                          {getRankBadge(currentUser.rank)}
                        </div>

                        <Avatar className="h-10 w-10">
                          <AvatarFallback className="bg-primary text-primary-foreground">
                            YOU
                          </AvatarFallback>
                        </Avatar>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-semibold">{currentUser.name}</p>
                            {getRankChange(currentUser.rank, currentUser.previousRank)}
                            <Badge className="bg-primary">That's You!</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">{currentUser.lastActive}</p>
                        </div>

                        <div className="grid grid-cols-4 gap-6 text-center">
                          <div>
                            <p className="text-xs text-muted-foreground">Score</p>
                            <p className="font-bold">{currentUser.networkingScore}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Meetings</p>
                            <p className="font-bold">{currentUser.totalMeetings}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Given</p>
                            <p className="font-bold">{currentUser.referralsGiven}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">SVP</p>
                            <p className="font-bold">{currentUser.svpReferrals}</p>
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>

      {/* Achievements & Badges */}
      <Card>
        <CardHeader>
          <CardTitle>Networking Achievements</CardTitle>
          <CardDescription>Earn badges by hitting milestones</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              {
                title: "First Connection",
                description: "Complete your first 1-to-1",
                earned: true,
                icon: Handshake,
              },
              {
                title: "Networking Newbie",
                description: "5 meetings completed",
                earned: true,
                icon: Users,
              },
              {
                title: "Referral Pro",
                description: "Give 10 referrals",
                earned: true,
                icon: Target,
              },
              {
                title: "SVP Champion",
                description: "5 SVP referrals",
                earned: false,
                icon: Trophy,
              },
              {
                title: "Networking Ninja",
                description: "20 meetings completed",
                earned: false,
                icon: Zap,
              },
              {
                title: "Streak Master",
                description: "10 week streak",
                earned: false,
                icon: Calendar,
              },
              {
                title: "Community Leader",
                description: "Top 10 ranking",
                earned: false,
                icon: Crown,
              },
              {
                title: "Networking Legend",
                description: "50 meetings completed",
                earned: false,
                icon: Medal,
              },
            ].map((achievement, idx) => {
              const Icon = achievement.icon;
              return (
                <div
                  key={idx}
                  className={`border rounded-lg p-4 text-center ${
                    achievement.earned ? "bg-primary/5 border-primary" : "opacity-50"
                  }`}
                >
                  <div
                    className={`w-12 h-12 rounded-full mx-auto mb-2 flex items-center justify-center ${
                      achievement.earned ? "bg-primary text-primary-foreground" : "bg-muted"
                    }`}
                  >
                    <Icon className="h-6 w-6" />
                  </div>
                  <p className="font-semibold text-sm">{achievement.title}</p>
                  <p className="text-xs text-muted-foreground mt-1">{achievement.description}</p>
                  {achievement.earned && (
                    <Badge className="mt-2 bg-green-500">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Earned
                    </Badge>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* How Scoring Works */}
      <Card>
        <CardHeader>
          <CardTitle>How Networking Score is Calculated</CardTitle>
          <CardDescription>Understanding the leaderboard metrics</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[
              { activity: "Complete a 1-to-1 meeting", points: 10 },
              { activity: "Give a referral to another affiliate", points: 15 },
              { activity: "Receive a referral from another affiliate", points: 5 },
              { activity: "Give a referral to SVP", points: 25 },
              { activity: "Maintain weekly meeting streak", points: 5 },
              { activity: "Submit detailed meeting summary", points: 3 },
              { activity: "Successful referral conversion", points: 50 },
            ].map((item, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 border rounded-lg">
                <span className="text-sm">{item.activity}</span>
                <Badge variant="secondary">+{item.points} points</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
