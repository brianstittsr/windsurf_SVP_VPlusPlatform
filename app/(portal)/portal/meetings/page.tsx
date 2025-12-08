import { Metadata } from "next";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Plus,
  Video,
  Calendar,
  Clock,
  Users,
  FileText,
  Play,
  CheckSquare,
  ExternalLink,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Meetings",
  description: "View and manage meetings with AI-extracted insights",
};

const upcomingMeetings = [
  {
    id: "1",
    title: "ABC Manufacturing Discovery Call",
    date: "2025-01-07",
    time: "10:00 AM",
    duration: "30 min",
    type: "discovery",
    attendees: [
      { name: "John Doe", initials: "JD" },
      { name: "Client Rep", initials: "CR" },
    ],
    opportunity: "ABC Manufacturing",
    joinUrl: "#",
  },
  {
    id: "2",
    title: "Weekly Affiliate Sync",
    date: "2025-01-07",
    time: "2:00 PM",
    duration: "45 min",
    type: "internal",
    attendees: [
      { name: "John Doe", initials: "JD" },
      { name: "Sarah W.", initials: "SW" },
      { name: "Mike R.", initials: "MR" },
    ],
    joinUrl: "#",
  },
  {
    id: "3",
    title: "XYZ Industries Follow-up",
    date: "2025-01-07",
    time: "4:00 PM",
    duration: "30 min",
    type: "follow-up",
    attendees: [
      { name: "Sarah W.", initials: "SW" },
      { name: "Client Rep", initials: "CR" },
    ],
    opportunity: "XYZ Industries Expansion",
    joinUrl: "#",
  },
  {
    id: "4",
    title: "Precision Parts Project Review",
    date: "2025-01-08",
    time: "11:00 AM",
    duration: "1 hour",
    type: "project",
    attendees: [
      { name: "John Doe", initials: "JD" },
      { name: "Jane D.", initials: "JD" },
    ],
    project: "Precision Parts Supplier Qualification",
    joinUrl: "#",
  },
];

const pastMeetings = [
  {
    id: "p1",
    title: "TechForm Industries Initial Call",
    date: "2025-01-03",
    time: "2:00 PM",
    duration: "45 min",
    type: "discovery",
    attendees: [
      { name: "Sarah W.", initials: "SW" },
      { name: "Client Rep", initials: "CR" },
    ],
    hasTranscript: true,
    hasNotes: true,
    actionItems: 4,
    keyDecisions: 2,
  },
  {
    id: "p2",
    title: "Q4 Review & Q1 Planning",
    date: "2025-01-02",
    time: "10:00 AM",
    duration: "2 hours",
    type: "internal",
    attendees: [
      { name: "John Doe", initials: "JD" },
      { name: "Sarah W.", initials: "SW" },
      { name: "Mike R.", initials: "MR" },
      { name: "Jane D.", initials: "JD" },
    ],
    hasTranscript: true,
    hasNotes: true,
    actionItems: 12,
    keyDecisions: 5,
  },
  {
    id: "p3",
    title: "123 Components ISO Kickoff",
    date: "2024-12-20",
    time: "9:00 AM",
    duration: "1 hour",
    type: "project",
    attendees: [
      { name: "Jane D.", initials: "JD" },
      { name: "Client Rep", initials: "CR" },
    ],
    hasTranscript: true,
    hasNotes: true,
    actionItems: 8,
    keyDecisions: 3,
  },
];

function getMeetingTypeBadge(type: string) {
  const types: Record<string, { label: string; className: string }> = {
    discovery: { label: "Discovery", className: "bg-blue-100 text-blue-800" },
    "follow-up": { label: "Follow-up", className: "bg-purple-100 text-purple-800" },
    project: { label: "Project", className: "bg-green-100 text-green-800" },
    internal: { label: "Internal", className: "bg-gray-100 text-gray-800" },
  };
  const config = types[type] || { label: type, className: "bg-gray-100 text-gray-800" };
  return <Badge className={config.className}>{config.label}</Badge>;
}

function formatDate(dateString: string) {
  const date = new Date(dateString);
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  if (date.toDateString() === today.toDateString()) {
    return "Today";
  } else if (date.toDateString() === tomorrow.toDateString()) {
    return "Tomorrow";
  }
  return date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

export default function MeetingsPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Meetings</h1>
          <p className="text-muted-foreground">
            Schedule meetings and access AI-extracted insights
          </p>
        </div>
        <Button asChild>
          <Link href="/portal/meetings/new">
            <Plus className="mr-2 h-4 w-4" />
            Schedule Meeting
          </Link>
        </Button>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="upcoming">
        <TabsList>
          <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
          <TabsTrigger value="past">Past Meetings</TabsTrigger>
        </TabsList>

        {/* Upcoming Meetings */}
        <TabsContent value="upcoming" className="space-y-4 mt-6">
          {upcomingMeetings.map((meeting) => (
            <Card key={meeting.id}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-lg bg-secondary/20 flex items-center justify-center shrink-0">
                      <Video className="h-6 w-6 text-secondary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">{meeting.title}</h3>
                      <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {formatDate(meeting.date)}
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {meeting.time} ({meeting.duration})
                        </div>
                      </div>
                      {(meeting.opportunity || meeting.project) && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {meeting.opportunity && `Opportunity: ${meeting.opportunity}`}
                          {meeting.project && `Project: ${meeting.project}`}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {getMeetingTypeBadge(meeting.type)}
                    <Button asChild>
                      <Link href={meeting.joinUrl}>
                        <Play className="mr-2 h-4 w-4" />
                        Join
                      </Link>
                    </Button>
                  </div>
                </div>

                {/* Attendees */}
                <div className="mt-4 pt-4 border-t flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Attendees:</span>
                    <div className="flex -space-x-2">
                      {meeting.attendees.map((attendee, i) => (
                        <Avatar key={i} className="h-6 w-6 border-2 border-background">
                          <AvatarFallback className="bg-primary/10 text-primary text-xs">
                            {attendee.initials}
                          </AvatarFallback>
                        </Avatar>
                      ))}
                    </div>
                  </div>
                  <Button variant="outline" size="sm">
                    Add to Calendar
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        {/* Past Meetings */}
        <TabsContent value="past" className="space-y-4 mt-6">
          {pastMeetings.map((meeting) => (
            <Card key={meeting.id}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center shrink-0">
                      <Video className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">{meeting.title}</h3>
                      <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {new Date(meeting.date).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {meeting.time} ({meeting.duration})
                        </div>
                      </div>
                    </div>
                  </div>

                  {getMeetingTypeBadge(meeting.type)}
                </div>

                {/* Meeting Intelligence */}
                <div className="mt-4 pt-4 border-t">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {meeting.hasTranscript && (
                      <Button variant="outline" size="sm" className="justify-start" asChild>
                        <Link href={`/portal/meetings/${meeting.id}/transcript`}>
                          <FileText className="mr-2 h-4 w-4" />
                          Transcript
                        </Link>
                      </Button>
                    )}
                    {meeting.hasNotes && (
                      <Button variant="outline" size="sm" className="justify-start" asChild>
                        <Link href={`/portal/meetings/${meeting.id}/notes`}>
                          <FileText className="mr-2 h-4 w-4" />
                          Notes
                        </Link>
                      </Button>
                    )}
                    <Button variant="outline" size="sm" className="justify-start" asChild>
                      <Link href={`/portal/meetings/${meeting.id}/actions`}>
                        <CheckSquare className="mr-2 h-4 w-4" />
                        {meeting.actionItems} Action Items
                      </Link>
                    </Button>
                    <Button variant="outline" size="sm" className="justify-start" asChild>
                      <Link href={`/portal/meetings/${meeting.id}`}>
                        <ExternalLink className="mr-2 h-4 w-4" />
                        View Details
                      </Link>
                    </Button>
                  </div>
                </div>

                {/* Attendees */}
                <div className="mt-4 flex items-center gap-2">
                  <div className="flex -space-x-2">
                    {meeting.attendees.map((attendee, i) => (
                      <Avatar key={i} className="h-6 w-6 border-2 border-background">
                        <AvatarFallback className="bg-primary/10 text-primary text-xs">
                          {attendee.initials}
                        </AvatarFallback>
                      </Avatar>
                    ))}
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {meeting.attendees.length} attendees
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}
