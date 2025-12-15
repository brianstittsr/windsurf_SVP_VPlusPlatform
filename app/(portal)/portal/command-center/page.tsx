import { Metadata } from "next";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import {
  ArrowRight,
  ArrowUpRight,
  ArrowDownRight,
  TrendingUp,
  Target,
  FolderKanban,
  CheckSquare,
  Users,
  Calendar,
  Clock,
  Video,
  FileText,
  AlertCircle,
  MoreHorizontal,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Command Center",
  description: "Business Command Center - Real-time overview of your operations",
};

// Mock data - in production this would come from API/database
const stats = {
  pipeline: {
    value: 1250000,
    change: 12,
    trend: "up",
  },
  activeProjects: {
    count: 8,
    atRisk: 2,
  },
  rocks: {
    progress: 67,
    daysRemaining: 14,
  },
  teamOnline: 5,
};

const opportunities = [
  {
    id: "1",
    name: "ABC Manufacturing",
    stage: "Proposal",
    value: 85000,
    daysAgo: 3,
    owner: { name: "John D.", initials: "JD" },
  },
  {
    id: "2",
    name: "XYZ Industries",
    stage: "Discovery",
    value: 120000,
    daysAgo: 0,
    owner: { name: "Sarah W.", initials: "SW" },
  },
  {
    id: "3",
    name: "123 Components",
    stage: "Contract",
    value: 45000,
    daysAgo: 1,
    owner: { name: "Mike R.", initials: "MR" },
  },
  {
    id: "4",
    name: "Precision Parts Co",
    stage: "Negotiation",
    value: 95000,
    daysAgo: 5,
    owner: { name: "John D.", initials: "JD" },
  },
];

const meetings = [
  {
    id: "1",
    title: "ABC Mfg Discovery Call",
    time: "10:00 AM",
    duration: "30 min",
    attendees: 3,
  },
  {
    id: "2",
    title: "Affiliate Sync",
    time: "2:00 PM",
    duration: "45 min",
    attendees: 8,
  },
  {
    id: "3",
    title: "XYZ Industries Follow-up",
    time: "4:00 PM",
    duration: "30 min",
    attendees: 2,
  },
];

const actionItems = [
  {
    id: "1",
    title: "Send proposal to ABC Manufacturing",
    dueDate: "Tomorrow",
    priority: "high",
    completed: false,
  },
  {
    id: "2",
    title: "Review affiliate capability matrix",
    dueDate: "Friday",
    priority: "medium",
    completed: false,
  },
  {
    id: "3",
    title: "Complete grant application draft",
    dueDate: "Next Week",
    priority: "medium",
    completed: false,
  },
  {
    id: "4",
    title: "Follow up with Precision Parts",
    dueDate: "Today",
    priority: "high",
    completed: true,
  },
];

const recentActivity = [
  {
    id: "1",
    type: "opportunity",
    message: "New lead from website: TechForm Industries",
    time: "10 min ago",
  },
  {
    id: "2",
    type: "meeting",
    message: "Meeting notes added: ABC Mfg Discovery",
    time: "1 hour ago",
  },
  {
    id: "3",
    type: "document",
    message: "Proposal uploaded: XYZ Industries",
    time: "2 hours ago",
  },
  {
    id: "4",
    type: "project",
    message: "Milestone completed: ISO Audit Prep",
    time: "3 hours ago",
  },
];

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

function getStageColor(stage: string) {
  const colors: Record<string, string> = {
    Lead: "bg-gray-500",
    Discovery: "bg-blue-500",
    Proposal: "bg-yellow-500",
    Negotiation: "bg-orange-500",
    Contract: "bg-green-500",
  };
  return colors[stage] || "bg-gray-500";
}

export default function CommandCenterPage() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Command Center</h1>
          <p className="text-muted-foreground">
            Welcome back! Here's what's happening today.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href="/portal/ask">
              Ask AI
            </Link>
          </Button>
          <Button asChild>
            <Link href="/portal/opportunities/new">
              New Opportunity
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Pipeline */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Pipeline Value</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.pipeline.value)}</div>
            <div className="flex items-center text-xs text-muted-foreground">
              {stats.pipeline.trend === "up" ? (
                <ArrowUpRight className="mr-1 h-4 w-4 text-green-500" />
              ) : (
                <ArrowDownRight className="mr-1 h-4 w-4 text-red-500" />
              )}
              <span className={stats.pipeline.trend === "up" ? "text-green-500" : "text-red-500"}>
                {stats.pipeline.change}%
              </span>
              <span className="ml-1">from last month</span>
            </div>
          </CardContent>
        </Card>

        {/* Active Projects */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Active Projects</CardTitle>
            <FolderKanban className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeProjects.count}</div>
            <div className="flex items-center text-xs text-muted-foreground">
              {stats.activeProjects.atRisk > 0 && (
                <>
                  <AlertCircle className="mr-1 h-4 w-4 text-orange-500" />
                  <span className="text-orange-500">{stats.activeProjects.atRisk} at risk</span>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Rocks Progress */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Q1 Rocks</CardTitle>
            <CheckSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.rocks.progress}%</div>
            <Progress value={stats.rocks.progress} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-2">
              {stats.rocks.daysRemaining} days remaining
            </p>
          </CardContent>
        </Card>

        {/* Team Online */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Team Online</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.teamOnline}</div>
            <div className="flex -space-x-2 mt-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <Avatar key={i} className="h-8 w-8 border-2 border-background">
                  <AvatarFallback className="bg-primary/20 text-primary text-xs">
                    {String.fromCharCode(64 + i)}
                  </AvatarFallback>
                </Avatar>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Opportunities */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Recent Opportunities</CardTitle>
              <CardDescription>Your latest pipeline activity</CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/portal/opportunities">
                View All
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {opportunities.map((opp) => (
                <div
                  key={opp.id}
                  className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-primary/20 text-primary">
                        {opp.owner.initials}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{opp.name}</p>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Badge variant="secondary" className={`${getStageColor(opp.stage)} text-white`}>
                          {opp.stage}
                        </Badge>
                        <span>•</span>
                        <span>{opp.daysAgo === 0 ? "Today" : `${opp.daysAgo} days ago`}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{formatCurrency(opp.value)}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Today's Meetings */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Today's Meetings</CardTitle>
              <CardDescription>Your schedule for today</CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/portal/meetings">
                View All
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {meetings.map((meeting) => (
                <div
                  key={meeting.id}
                  className="flex items-start gap-3 p-3 rounded-lg border"
                >
                  <div className="w-10 h-10 rounded-lg bg-secondary/20 flex items-center justify-center shrink-0">
                    <Video className="h-5 w-5 text-secondary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{meeting.title}</p>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      <span>{meeting.time}</span>
                      <span>•</span>
                      <span>{meeting.duration}</span>
                    </div>
                  </div>
                  <Button size="sm" variant="outline">
                    Join
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Action Items */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Action Items</CardTitle>
              <CardDescription>Tasks requiring your attention</CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/portal/tasks">
                View All
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {actionItems.map((item) => (
                <div
                  key={item.id}
                  className={`flex items-center gap-3 p-3 rounded-lg border ${
                    item.completed ? "opacity-60" : ""
                  }`}
                >
                  <Checkbox checked={item.completed} />
                  <div className="flex-1">
                    <p className={`font-medium ${item.completed ? "line-through" : ""}`}>
                      {item.title}
                    </p>
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-muted-foreground">Due: {item.dueDate}</span>
                      {item.priority === "high" && !item.completed && (
                        <Badge variant="destructive" className="text-xs">
                          High Priority
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Latest updates across the platform</CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/portal/notifications">
                View All
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                    {activity.type === "opportunity" && <Target className="h-4 w-4" />}
                    {activity.type === "meeting" && <Calendar className="h-4 w-4" />}
                    {activity.type === "document" && <FileText className="h-4 w-4" />}
                    {activity.type === "project" && <FolderKanban className="h-4 w-4" />}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm">{activity.message}</p>
                    <p className="text-xs text-muted-foreground">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
