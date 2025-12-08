import { Metadata } from "next";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Plus,
  Target,
  Calendar,
  CheckCircle,
  AlertTriangle,
  TrendingUp,
  Clock,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Rocks",
  description: "Track 90-day goals and quarterly objectives",
};

const currentQuarter = "Q1 2025";
const daysRemaining = 14;

const rocks = [
  {
    id: "1",
    title: "Launch Supplier Readiness Program",
    description: "Develop and launch standardized supplier readiness assessment and qualification program",
    owner: { name: "John Doe", initials: "JD" },
    status: "on-track",
    progress: 75,
    milestones: [
      { id: "1a", title: "Define assessment criteria", completed: true },
      { id: "1b", title: "Create assessment templates", completed: true },
      { id: "1c", title: "Train affiliate network", completed: true },
      { id: "1d", title: "Pilot with 3 customers", completed: false },
      { id: "1e", title: "Refine and document process", completed: false },
    ],
  },
  {
    id: "2",
    title: "Achieve 5 New ISO Certifications",
    description: "Help 5 customers achieve ISO 9001 certification this quarter",
    owner: { name: "Sarah Williams", initials: "SW" },
    status: "on-track",
    progress: 60,
    milestones: [
      { id: "2a", title: "ABC Manufacturing - Certified", completed: true },
      { id: "2b", title: "XYZ Industries - Certified", completed: true },
      { id: "2c", title: "123 Components - Certified", completed: true },
      { id: "2d", title: "Precision Parts - In Progress", completed: false },
      { id: "2e", title: "TechForm - In Progress", completed: false },
    ],
  },
  {
    id: "3",
    title: "Build Affiliate Capability Database",
    description: "Create comprehensive database of affiliate skills, certifications, and availability",
    owner: { name: "Mike Roberts", initials: "MR" },
    status: "at-risk",
    progress: 40,
    milestones: [
      { id: "3a", title: "Define capability taxonomy", completed: true },
      { id: "3b", title: "Survey all affiliates", completed: true },
      { id: "3c", title: "Build database structure", completed: false },
      { id: "3d", title: "Import affiliate data", completed: false },
      { id: "3e", title: "Create search/match functionality", completed: false },
    ],
  },
  {
    id: "4",
    title: "Launch Manufacturing Nexus Events",
    description: "Host 3 virtual events for U.S. manufacturing community",
    owner: { name: "Jane Doe", initials: "JD" },
    status: "completed",
    progress: 100,
    milestones: [
      { id: "4a", title: "Event 1: Industry 4.0 Basics", completed: true },
      { id: "4b", title: "Event 2: Reshoring Strategies", completed: true },
      { id: "4c", title: "Event 3: OEM Qualification", completed: true },
    ],
  },
];

function getStatusBadge(status: string) {
  switch (status) {
    case "on-track":
      return (
        <Badge className="bg-green-100 text-green-800">
          <TrendingUp className="h-3 w-3 mr-1" />
          On Track
        </Badge>
      );
    case "at-risk":
      return (
        <Badge className="bg-orange-100 text-orange-800">
          <AlertTriangle className="h-3 w-3 mr-1" />
          At Risk
        </Badge>
      );
    case "off-track":
      return (
        <Badge className="bg-red-100 text-red-800">
          <AlertTriangle className="h-3 w-3 mr-1" />
          Off Track
        </Badge>
      );
    case "completed":
      return (
        <Badge className="bg-blue-100 text-blue-800">
          <CheckCircle className="h-3 w-3 mr-1" />
          Completed
        </Badge>
      );
    default:
      return <Badge variant="secondary">{status}</Badge>;
  }
}

export default function RocksPage() {
  const totalRocks = rocks.length;
  const completedRocks = rocks.filter((r) => r.status === "completed").length;
  const atRiskRocks = rocks.filter((r) => r.status === "at-risk").length;
  const avgProgress = Math.round(rocks.reduce((sum, r) => sum + r.progress, 0) / totalRocks);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Rocks</h1>
          <p className="text-muted-foreground">
            {currentQuarter} quarterly goals • {daysRemaining} days remaining
          </p>
        </div>
        <Button asChild>
          <Link href="/portal/rocks/new">
            <Plus className="mr-2 h-4 w-4" />
            New Rock
          </Link>
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Rocks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalRocks}</div>
            <p className="text-xs text-muted-foreground">This quarter</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{completedRocks}</div>
            <p className="text-xs text-muted-foreground">
              {Math.round((completedRocks / totalRocks) * 100)}% completion rate
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">At Risk</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{atRiskRocks}</div>
            <p className="text-xs text-muted-foreground">Need attention</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Avg. Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgProgress}%</div>
            <Progress value={avgProgress} className="mt-2" />
          </CardContent>
        </Card>
      </div>

      {/* Rocks List */}
      <div className="space-y-4">
        {rocks.map((rock) => (
          <Card key={rock.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <Target className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">
                      <Link href={`/portal/rocks/${rock.id}`} className="hover:underline">
                        {rock.title}
                      </Link>
                    </CardTitle>
                    <CardDescription className="mt-1">{rock.description}</CardDescription>
                  </div>
                </div>
                {getStatusBadge(rock.status)}
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-6">
                {/* Progress */}
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-muted-foreground">Progress</span>
                    <span className="font-medium">{rock.progress}%</span>
                  </div>
                  <Progress value={rock.progress} />
                </div>

                {/* Owner */}
                <div className="flex items-center gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-primary/10 text-primary text-xs">
                      {rock.owner.initials}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium">{rock.owner.name}</p>
                    <p className="text-xs text-muted-foreground">Owner</p>
                  </div>
                </div>

                {/* Milestones Summary */}
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    {rock.milestones.filter((m) => m.completed).length} of {rock.milestones.length}{" "}
                    milestones
                  </span>
                </div>
              </div>

              {/* Milestones */}
              <div className="mt-6 pt-4 border-t">
                <p className="text-sm font-medium mb-3">Milestones</p>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-2">
                  {rock.milestones.map((milestone) => (
                    <div
                      key={milestone.id}
                      className={`flex items-center gap-2 p-2 rounded-md ${
                        milestone.completed ? "bg-green-50" : "bg-muted/50"
                      }`}
                    >
                      <Checkbox checked={milestone.completed} disabled />
                      <span
                        className={`text-sm ${
                          milestone.completed ? "line-through text-muted-foreground" : ""
                        }`}
                      >
                        {milestone.title}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
