import { Metadata } from "next";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Plus, Calendar, Users, AlertCircle, CheckCircle, Clock } from "lucide-react";

export const metadata: Metadata = {
  title: "Projects",
  description: "Manage active projects and engagements",
};

const projects = [
  {
    id: "1",
    name: "ABC Manufacturing ISO Implementation",
    client: "ABC Manufacturing Inc.",
    status: "active",
    progress: 65,
    startDate: "2024-11-01",
    endDate: "2025-02-28",
    team: [
      { name: "John D.", initials: "JD" },
      { name: "Sarah W.", initials: "SW" },
    ],
    milestones: { completed: 4, total: 7 },
  },
  {
    id: "2",
    name: "XYZ Industries Lean Transformation",
    client: "XYZ Industries",
    status: "active",
    progress: 35,
    startDate: "2024-12-01",
    endDate: "2025-04-30",
    team: [
      { name: "Mike R.", initials: "MR" },
      { name: "Jane D.", initials: "JD" },
    ],
    milestones: { completed: 2, total: 8 },
  },
  {
    id: "3",
    name: "Precision Parts Supplier Qualification",
    client: "Precision Parts Co",
    status: "at-risk",
    progress: 45,
    startDate: "2024-10-15",
    endDate: "2025-01-31",
    team: [{ name: "John D.", initials: "JD" }],
    milestones: { completed: 3, total: 6 },
  },
  {
    id: "4",
    name: "Metro Components Automation Pilot",
    client: "Metro Components",
    status: "completed",
    progress: 100,
    startDate: "2024-09-01",
    endDate: "2024-12-15",
    team: [
      { name: "Robert C.", initials: "RC" },
      { name: "David W.", initials: "DW" },
    ],
    milestones: { completed: 5, total: 5 },
  },
];

function getStatusBadge(status: string) {
  switch (status) {
    case "active":
      return <Badge className="bg-green-100 text-green-800">Active</Badge>;
    case "at-risk":
      return <Badge className="bg-orange-100 text-orange-800">At Risk</Badge>;
    case "completed":
      return <Badge className="bg-blue-100 text-blue-800">Completed</Badge>;
    case "on-hold":
      return <Badge className="bg-gray-100 text-gray-800">On Hold</Badge>;
    default:
      return <Badge variant="secondary">{status}</Badge>;
  }
}

export default function ProjectsPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Projects</h1>
          <p className="text-muted-foreground">
            Track and manage active client engagements
          </p>
        </div>
        <Button asChild>
          <Link href="/portal/projects/new">
            <Plus className="mr-2 h-4 w-4" />
            New Project
          </Link>
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Active Projects</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {projects.filter((p) => p.status === "active").length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">At Risk</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {projects.filter((p) => p.status === "at-risk").length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Completed (YTD)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {projects.filter((p) => p.status === "completed").length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Avg. Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.round(projects.reduce((sum, p) => sum + p.progress, 0) / projects.length)}%
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Project Cards */}
      <div className="grid gap-6 md:grid-cols-2">
        {projects.map((project) => (
          <Card key={project.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-lg">
                    <Link href={`/portal/projects/${project.id}`} className="hover:underline">
                      {project.name}
                    </Link>
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">{project.client}</p>
                </div>
                {getStatusBadge(project.status)}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Progress */}
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>Progress</span>
                  <span className="font-medium">{project.progress}%</span>
                </div>
                <Progress value={project.progress} />
              </div>

              {/* Details */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>
                    {new Date(project.endDate).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-muted-foreground" />
                  <span>
                    {project.milestones.completed}/{project.milestones.total} milestones
                  </span>
                </div>
              </div>

              {/* Team */}
              <div className="flex items-center justify-between">
                <div className="flex -space-x-2">
                  {project.team.map((member, i) => (
                    <Avatar key={i} className="h-8 w-8 border-2 border-background">
                      <AvatarFallback className="bg-primary/10 text-primary text-xs">
                        {member.initials}
                      </AvatarFallback>
                    </Avatar>
                  ))}
                </div>
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/portal/projects/${project.id}`}>View Details</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
