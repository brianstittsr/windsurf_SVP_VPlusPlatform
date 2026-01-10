"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import {
  Flame,
  Settings,
  Search,
  MoreHorizontal,
  Eye,
  CheckCircle2,
  Circle,
  Clock,
  Sparkles,
  Users,
  FileText,
  ListTodo,
  Loader2,
  Play,
  Calendar,
  User,
  ExternalLink,
  RefreshCw,
  Download,
  BarChart3,
  MessageSquare,
  HelpCircle,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

interface FirefliesActionItem {
  id: string;
  text: string;
  assigneeId?: string;
  assigneeName?: string;
  status: "pending" | "in_progress" | "completed" | "cancelled";
  dueDate?: { seconds: number };
  completedAt?: { seconds: number };
  createdFromTranscript: boolean;
}

interface FirefliesSentence {
  index: number;
  speakerName: string;
  speakerId?: string;
  text: string;
  startTime: number;
  endTime: number;
  sentiment?: string;
  isTask?: boolean;
  isQuestion?: boolean;
}

interface FirefliesMeeting {
  id: string;
  firefliesMeetingId: string;
  title: string;
  meetingDate: { seconds: number };
  duration: number;
  transcriptUrl?: string;
  audioUrl?: string;
  videoUrl?: string;
  participants: string[];
  hostEmail?: string;
  speakers?: Array<{ id: string; name: string }>;
  summary?: {
    keywords?: string[];
    actionItems?: string[];
    shortSummary?: string;
    overview?: string;
    meetingType?: string;
    topicsDiscussed?: string[];
  };
  sentences?: FirefliesSentence[];
  transcriptText?: string;
  analytics?: {
    sentiments?: {
      positivePct: number;
      neutralPct: number;
      negativePct: number;
    };
    taskCount?: number;
    questionCount?: number;
  };
  actionItems: FirefliesActionItem[];
  processingStatus: "pending" | "processed" | "failed";
  aiTasksExtracted: boolean;
  source: "webhook" | "manual" | "api";
}

interface FirefliesSettings {
  id?: string;
  apiKey?: string;
  isConnected: boolean;
  webhookSecret?: string;
  autoExtractTasks: boolean;
  autoAssignTasks: boolean;
  defaultTaskDueDays: number;
  notifyOnNewMeeting: boolean;
  notifyOnTaskCreated: boolean;
  notificationEmails: string[];
  autoLinkToCustomers: boolean;
  autoLinkToProjects: boolean;
}

export default function FirefliesIntegrationPage() {
  const [meetings, setMeetings] = useState<FirefliesMeeting[]>([]);
  const [settings, setSettings] = useState<FirefliesSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMeeting, setSelectedMeeting] = useState<FirefliesMeeting | null>(null);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isExtractingTasks, setIsExtractingTasks] = useState(false);
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  // Settings form state
  const [settingsForm, setSettingsForm] = useState<FirefliesSettings>({
    isConnected: false,
    autoExtractTasks: true,
    autoAssignTasks: true,
    defaultTaskDueDays: 7,
    notifyOnNewMeeting: true,
    notifyOnTaskCreated: true,
    notificationEmails: [],
    autoLinkToCustomers: true,
    autoLinkToProjects: true,
  });

  // Import state
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importPreview, setImportPreview] = useState<{
    availableMeetings: number;
    hasMorePages: boolean;
    alreadyImported: number;
  } | null>(null);
  const [importDateFrom, setImportDateFrom] = useState("");
  const [importDateTo, setImportDateTo] = useState("");
  const [importLimit, setImportLimit] = useState("100");

  // Fetch meetings
  const fetchMeetings = async () => {
    try {
      const response = await fetch("/api/fireflies/meetings");
      if (response.ok) {
        const data = await response.json();
        setMeetings(data.meetings || []);
      }
    } catch (error) {
      console.error("Error fetching meetings:", error);
      toast.error("Failed to fetch meetings");
    }
  };

  // Fetch settings
  const fetchSettings = async () => {
    try {
      const response = await fetch("/api/fireflies/settings");
      if (response.ok) {
        const data = await response.json();
        setSettings(data.settings);
        setSettingsForm(data.settings);
      }
    } catch (error) {
      console.error("Error fetching settings:", error);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      await Promise.all([fetchMeetings(), fetchSettings()]);
      setIsLoading(false);
    };
    loadData();
  }, []);

  // Fetch import preview
  const fetchImportPreview = async () => {
    try {
      const response = await fetch("/api/fireflies/import?action=preview");
      if (response.ok) {
        const data = await response.json();
        if (data.configured) {
          setImportPreview({
            availableMeetings: data.availableMeetings,
            hasMorePages: data.hasMorePages,
            alreadyImported: data.alreadyImported,
          });
        }
      }
    } catch (error) {
      console.error("Error fetching import preview:", error);
    }
  };

  // Import meetings from Fireflies
  const handleImportMeetings = async () => {
    setIsImporting(true);
    try {
      const body: Record<string, unknown> = {
        limit: parseInt(importLimit),
      };

      if (importDateFrom) {
        body.fromDate = importDateFrom;
      }
      if (importDateTo) {
        body.toDate = importDateTo;
      }

      const response = await fetch("/api/fireflies/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        toast.success(data.message);
        setIsImportOpen(false);
        fetchMeetings();
        fetchImportPreview();
      } else {
        toast.error(data.error || "Failed to import meetings");
      }
    } catch (error) {
      console.error("Error importing meetings:", error);
      toast.error("Failed to import meetings");
    } finally {
      setIsImporting(false);
    }
  };

  // Save settings
  const handleSaveSettings = async () => {
    setIsSavingSettings(true);
    try {
      const response = await fetch("/api/fireflies/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settingsForm),
      });

      if (response.ok) {
        toast.success("Settings saved successfully");
        setIsSettingsOpen(false);
        fetchSettings();
      } else {
        toast.error("Failed to save settings");
      }
    } catch (error) {
      console.error("Error saving settings:", error);
      toast.error("Failed to save settings");
    } finally {
      setIsSavingSettings(false);
    }
  };

  // Extract tasks from transcript
  const handleExtractTasks = async (meetingId: string) => {
    setIsExtractingTasks(true);
    try {
      const response = await fetch(`/api/fireflies/meetings/${meetingId}/extract-tasks`, {
        method: "POST",
      });

      if (response.ok) {
        const data = await response.json();
        toast.success(`Extracted ${data.extractedCount} new tasks`);
        fetchMeetings();
        if (selectedMeeting?.id === meetingId) {
          const meetingResponse = await fetch(`/api/fireflies/meetings/${meetingId}`);
          if (meetingResponse.ok) {
            const meetingData = await meetingResponse.json();
            setSelectedMeeting(meetingData.meeting);
          }
        }
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to extract tasks");
      }
    } catch (error) {
      console.error("Error extracting tasks:", error);
      toast.error("Failed to extract tasks");
    } finally {
      setIsExtractingTasks(false);
    }
  };

  // Update action item status
  const handleUpdateTaskStatus = async (
    meetingId: string,
    actionItemId: string,
    newStatus: string
  ) => {
    try {
      const response = await fetch(`/api/fireflies/meetings/${meetingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          actionItemId,
          actionItemStatus: newStatus,
        }),
      });

      if (response.ok) {
        toast.success("Task updated");
        fetchMeetings();
        if (selectedMeeting?.id === meetingId) {
          const meetingResponse = await fetch(`/api/fireflies/meetings/${meetingId}`);
          if (meetingResponse.ok) {
            const meetingData = await meetingResponse.json();
            setSelectedMeeting(meetingData.meeting);
          }
        }
      }
    } catch (error) {
      console.error("Error updating task:", error);
      toast.error("Failed to update task");
    }
  };

  // Format duration
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const hrs = Math.floor(mins / 60);
    if (hrs > 0) {
      return `${hrs}h ${mins % 60}m`;
    }
    return `${mins}m`;
  };

  // Filter meetings
  const filteredMeetings = meetings.filter((m) =>
    m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.participants.some((p) => p.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Stats
  const totalMeetings = meetings.length;
  const pendingTasks = meetings.reduce(
    (sum, m) => sum + m.actionItems.filter((a) => a.status === "pending").length,
    0
  );
  const completedTasks = meetings.reduce(
    (sum, m) => sum + m.actionItems.filter((a) => a.status === "completed").length,
    0
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Flame className="h-8 w-8 text-orange-500" />
            Fireflies.ai Integration
          </h1>
          <p className="text-muted-foreground">
            Capture meeting recordings and extract action items from transcripts
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={() => {
              setIsImportOpen(true);
              fetchImportPreview();
            }}
            disabled={!settings?.isConnected}
          >
            <Download className="mr-2 h-4 w-4" />
            Import Meetings
          </Button>
          <Button variant="outline" onClick={() => setIsSettingsOpen(true)}>
            <Settings className="mr-2 h-4 w-4" />
            Settings
          </Button>
          <Button variant="outline" onClick={fetchMeetings}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Connection Status */}
      {settings && !settings.isConnected && (
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-orange-100">
                <Flame className="h-6 w-6 text-orange-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold">Connect Fireflies.ai</h3>
                <p className="text-sm text-muted-foreground">
                  Add your Fireflies API key to start receiving meeting recordings and transcripts
                </p>
              </div>
              <Button onClick={() => setIsSettingsOpen(true)}>
                Connect Now
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Meetings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalMeetings}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Pending Tasks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{pendingTasks}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Completed Tasks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{completedTasks}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Connection</CardTitle>
          </CardHeader>
          <CardContent>
            <Badge className={settings?.isConnected ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}>
              {settings?.isConnected ? "Connected" : "Not Connected"}
            </Badge>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search meetings..."
              className="pl-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Meetings Table */}
      <Card>
        <CardHeader>
          <CardTitle>Meeting Recordings</CardTitle>
          <CardDescription>
            Meetings captured from Fireflies.ai with transcripts and action items
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredMeetings.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
              <Flame className="h-12 w-12 mb-4" />
              <p className="text-lg font-medium">No meetings found</p>
              <p className="text-sm">Meetings will appear here when received from Fireflies.ai</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Meeting</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Participants</TableHead>
                  <TableHead>Tasks</TableHead>
                  <TableHead>Analytics</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMeetings.map((meeting) => (
                  <TableRow key={meeting.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center">
                          <Flame className="h-5 w-5 text-orange-500" />
                        </div>
                        <div>
                          <button
                            onClick={() => {
                              setSelectedMeeting(meeting);
                              setIsViewOpen(true);
                            }}
                            className="font-medium hover:underline text-left"
                          >
                            {meeting.title}
                          </button>
                          {meeting.summary?.shortSummary && (
                            <p className="text-xs text-muted-foreground line-clamp-1 max-w-[300px]">
                              {meeting.summary.shortSummary}
                            </p>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm">
                        <Calendar className="h-3 w-3 text-muted-foreground" />
                        {format(new Date(meeting.meetingDate.seconds * 1000), "MMM d, yyyy")}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm">
                        <Clock className="h-3 w-3 text-muted-foreground" />
                        {formatDuration(meeting.duration)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        {meeting.participants.length}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">
                          {meeting.actionItems.filter((a) => a.status === "pending").length} pending
                        </Badge>
                        {meeting.aiTasksExtracted && (
                          <Badge variant="secondary" className="text-xs">
                            <Sparkles className="h-3 w-3 mr-1" />
                            AI
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {meeting.analytics?.sentiments && (
                        <div className="flex items-center gap-1">
                          <BarChart3 className="h-4 w-4 text-muted-foreground" />
                          <span className="text-xs text-green-600">
                            {Math.round(meeting.analytics.sentiments.positivePct)}%
                          </span>
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => {
                              setSelectedMeeting(meeting);
                              setIsViewOpen(true);
                            }}
                          >
                            <Eye className="mr-2 h-4 w-4" />
                            View Details
                          </DropdownMenuItem>
                          {meeting.transcriptUrl && (
                            <DropdownMenuItem asChild>
                              <a href={meeting.transcriptUrl} target="_blank" rel="noopener noreferrer">
                                <ExternalLink className="mr-2 h-4 w-4" />
                                View in Fireflies
                              </a>
                            </DropdownMenuItem>
                          )}
                          {meeting.audioUrl && (
                            <DropdownMenuItem asChild>
                              <a href={meeting.audioUrl} target="_blank" rel="noopener noreferrer">
                                <Play className="mr-2 h-4 w-4" />
                                Listen to Audio
                              </a>
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => handleExtractTasks(meeting.id)}
                            disabled={isExtractingTasks || !meeting.transcriptText}
                          >
                            <Sparkles className="mr-2 h-4 w-4" />
                            Extract Tasks with AI
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Meeting Details Dialog */}
      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>{selectedMeeting?.title}</DialogTitle>
            <DialogDescription>
              {selectedMeeting && format(new Date(selectedMeeting.meetingDate.seconds * 1000), "MMMM d, yyyy 'at' h:mm a")}
              {selectedMeeting && ` • ${formatDuration(selectedMeeting.duration)}`}
            </DialogDescription>
          </DialogHeader>

          {selectedMeeting && (
            <Tabs defaultValue="summary" className="flex-1 overflow-hidden flex flex-col">
              <TabsList>
                <TabsTrigger value="summary">
                  <FileText className="h-4 w-4 mr-2" />
                  Summary
                </TabsTrigger>
                <TabsTrigger value="tasks">
                  <ListTodo className="h-4 w-4 mr-2" />
                  Tasks ({selectedMeeting.actionItems.length})
                </TabsTrigger>
                <TabsTrigger value="transcript">
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Transcript
                </TabsTrigger>
                <TabsTrigger value="analytics">
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Analytics
                </TabsTrigger>
              </TabsList>

              <TabsContent value="summary" className="flex-1 overflow-auto">
                <div className="space-y-4 p-4">
                  {selectedMeeting.summary?.overview ? (
                    <div className="prose prose-sm max-w-none">
                      <p>{selectedMeeting.summary.overview}</p>
                    </div>
                  ) : selectedMeeting.summary?.shortSummary ? (
                    <div className="prose prose-sm max-w-none">
                      <p>{selectedMeeting.summary.shortSummary}</p>
                    </div>
                  ) : (
                    <p className="text-muted-foreground">No summary available</p>
                  )}

                  {selectedMeeting.summary?.keywords && selectedMeeting.summary.keywords.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-2">Keywords</h4>
                      <div className="flex flex-wrap gap-2">
                        {selectedMeeting.summary.keywords.map((keyword, i) => (
                          <Badge key={i} variant="secondary">{keyword}</Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {selectedMeeting.summary?.topicsDiscussed && selectedMeeting.summary.topicsDiscussed.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-2">Topics Discussed</h4>
                      <ul className="list-disc list-inside space-y-1 text-sm">
                        {selectedMeeting.summary.topicsDiscussed.map((topic, i) => (
                          <li key={i}>{topic}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="flex gap-2 pt-4">
                    {selectedMeeting.transcriptUrl && (
                      <Button asChild variant="outline">
                        <a href={selectedMeeting.transcriptUrl} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="mr-2 h-4 w-4" />
                          View in Fireflies
                        </a>
                      </Button>
                    )}
                    {selectedMeeting.audioUrl && (
                      <Button asChild variant="outline">
                        <a href={selectedMeeting.audioUrl} target="_blank" rel="noopener noreferrer">
                          <Play className="mr-2 h-4 w-4" />
                          Listen to Audio
                        </a>
                      </Button>
                    )}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="tasks" className="flex-1 overflow-auto">
                <div className="space-y-4 p-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold">Action Items</h3>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleExtractTasks(selectedMeeting.id)}
                      disabled={isExtractingTasks || !selectedMeeting.transcriptText}
                    >
                      {isExtractingTasks ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Sparkles className="mr-2 h-4 w-4" />
                      )}
                      Extract More Tasks
                    </Button>
                  </div>

                  {selectedMeeting.actionItems.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">
                      No action items found. Click "Extract More Tasks" to analyze the transcript.
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {selectedMeeting.actionItems.map((item) => (
                        <div
                          key={item.id}
                          className="flex items-start gap-3 p-3 border rounded-lg"
                        >
                          <Select
                            value={item.status}
                            onValueChange={(value) =>
                              handleUpdateTaskStatus(selectedMeeting.id, item.id, value)
                            }
                          >
                            <SelectTrigger className="w-[140px]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pending">Pending</SelectItem>
                              <SelectItem value="in_progress">In Progress</SelectItem>
                              <SelectItem value="completed">Completed</SelectItem>
                              <SelectItem value="cancelled">Cancelled</SelectItem>
                            </SelectContent>
                          </Select>
                          <div className="flex-1">
                            <p className={item.status === "completed" ? "line-through text-muted-foreground" : ""}>
                              {item.text}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              {item.assigneeName && (
                                <Badge variant="outline" className="text-xs">
                                  <User className="h-3 w-3 mr-1" />
                                  {item.assigneeName}
                                </Badge>
                              )}
                              {item.createdFromTranscript && (
                                <Badge variant="secondary" className="text-xs">
                                  <Sparkles className="h-3 w-3 mr-1" />
                                  AI Extracted
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="transcript" className="flex-1 overflow-hidden">
                <ScrollArea className="h-[400px] p-4">
                  {selectedMeeting.sentences && selectedMeeting.sentences.length > 0 ? (
                    <div className="space-y-4">
                      {selectedMeeting.sentences.map((sentence, index) => (
                        <div key={index} className="flex gap-3">
                          <div className="w-28 flex-shrink-0">
                            <p className="font-medium text-sm">{sentence.speakerName}</p>
                            <p className="text-xs text-muted-foreground">
                              {Math.floor(sentence.startTime / 60000)}:{String(Math.floor((sentence.startTime % 60000) / 1000)).padStart(2, "0")}
                            </p>
                          </div>
                          <div className="flex-1">
                            <p className="text-sm">{sentence.text}</p>
                            <div className="flex gap-1 mt-1">
                              {sentence.isTask && (
                                <Badge variant="outline" className="text-xs">
                                  <CheckCircle2 className="h-3 w-3 mr-1" />
                                  Task
                                </Badge>
                              )}
                              {sentence.isQuestion && (
                                <Badge variant="outline" className="text-xs">
                                  <HelpCircle className="h-3 w-3 mr-1" />
                                  Question
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : selectedMeeting.transcriptText ? (
                    <div className="prose prose-sm max-w-none whitespace-pre-wrap">
                      {selectedMeeting.transcriptText}
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-center py-8">
                      No transcript available
                    </p>
                  )}
                </ScrollArea>
              </TabsContent>

              <TabsContent value="analytics" className="flex-1 overflow-auto">
                <div className="space-y-6 p-4">
                  {selectedMeeting.analytics?.sentiments && (
                    <div>
                      <h4 className="font-medium mb-3">Sentiment Analysis</h4>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="w-20 text-sm">Positive</span>
                          <Progress value={selectedMeeting.analytics.sentiments.positivePct} className="flex-1" />
                          <span className="w-12 text-sm text-right text-green-600">
                            {Math.round(selectedMeeting.analytics.sentiments.positivePct)}%
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="w-20 text-sm">Neutral</span>
                          <Progress value={selectedMeeting.analytics.sentiments.neutralPct} className="flex-1" />
                          <span className="w-12 text-sm text-right text-gray-600">
                            {Math.round(selectedMeeting.analytics.sentiments.neutralPct)}%
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="w-20 text-sm">Negative</span>
                          <Progress value={selectedMeeting.analytics.sentiments.negativePct} className="flex-1" />
                          <span className="w-12 text-sm text-right text-red-600">
                            {Math.round(selectedMeeting.analytics.sentiments.negativePct)}%
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <Card>
                      <CardContent className="pt-4">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="h-5 w-5 text-blue-500" />
                          <div>
                            <p className="text-2xl font-bold">{selectedMeeting.analytics?.taskCount || 0}</p>
                            <p className="text-sm text-muted-foreground">Tasks Detected</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-4">
                        <div className="flex items-center gap-2">
                          <HelpCircle className="h-5 w-5 text-purple-500" />
                          <div>
                            <p className="text-2xl font-bold">{selectedMeeting.analytics?.questionCount || 0}</p>
                            <p className="text-sm text-muted-foreground">Questions Asked</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {selectedMeeting.speakers && selectedMeeting.speakers.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-3">Speakers</h4>
                      <div className="space-y-2">
                        {selectedMeeting.speakers.map((speaker) => (
                          <div key={speaker.id} className="flex items-center gap-2 p-2 border rounded">
                            <User className="h-4 w-4 text-muted-foreground" />
                            <span>{speaker.name}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>

      {/* Settings Dialog */}
      <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Fireflies.ai Settings</DialogTitle>
            <DialogDescription>
              Configure your Fireflies connection and automation preferences
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* API Key */}
            <div className="space-y-2">
              <Label htmlFor="apiKey">Fireflies API Key</Label>
              <Input
                id="apiKey"
                type="password"
                value={settingsForm.apiKey || ""}
                onChange={(e) => setSettingsForm((prev) => ({ ...prev, apiKey: e.target.value }))}
                placeholder="Enter your Fireflies API key"
              />
              <p className="text-xs text-muted-foreground">
                Get your API key from{" "}
                <a
                  href="https://app.fireflies.ai/integrations/custom/fireflies"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  Fireflies Integrations
                </a>
              </p>
            </div>

            <Separator />

            {/* Webhook URL */}
            <div className="space-y-2">
              <Label>Webhook URL</Label>
              <div className="flex gap-2">
                <Input
                  readOnly
                  value={`${typeof window !== "undefined" ? window.location.origin : ""}/api/fireflies/webhook`}
                />
                <Button
                  variant="outline"
                  onClick={() => {
                    navigator.clipboard.writeText(
                      `${window.location.origin}/api/fireflies/webhook`
                    );
                    toast.success("Webhook URL copied");
                  }}
                >
                  Copy
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Add this URL as a webhook in your Fireflies settings
              </p>
            </div>

            <Separator />

            {/* Automation Settings */}
            <div className="space-y-4">
              <h4 className="font-medium">Automation</h4>

              <div className="flex items-center justify-between">
                <div>
                  <Label>Auto-extract tasks with AI</Label>
                  <p className="text-xs text-muted-foreground">
                    Automatically analyze transcripts for action items
                  </p>
                </div>
                <Switch
                  checked={settingsForm.autoExtractTasks}
                  onCheckedChange={(checked) =>
                    setSettingsForm((prev) => ({ ...prev, autoExtractTasks: checked }))
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>Auto-assign tasks</Label>
                  <p className="text-xs text-muted-foreground">
                    Try to match tasks to team members
                  </p>
                </div>
                <Switch
                  checked={settingsForm.autoAssignTasks}
                  onCheckedChange={(checked) =>
                    setSettingsForm((prev) => ({ ...prev, autoAssignTasks: checked }))
                  }
                />
              </div>

              <div className="space-y-2">
                <Label>Default task due date</Label>
                <Select
                  value={String(settingsForm.defaultTaskDueDays)}
                  onValueChange={(value) =>
                    setSettingsForm((prev) => ({ ...prev, defaultTaskDueDays: parseInt(value) }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="3">3 days after meeting</SelectItem>
                    <SelectItem value="7">7 days after meeting</SelectItem>
                    <SelectItem value="14">14 days after meeting</SelectItem>
                    <SelectItem value="30">30 days after meeting</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Separator />

            {/* Notifications */}
            <div className="space-y-4">
              <h4 className="font-medium">Notifications</h4>

              <div className="flex items-center justify-between">
                <div>
                  <Label>Notify on new meeting</Label>
                  <p className="text-xs text-muted-foreground">
                    Send notification when a meeting is received
                  </p>
                </div>
                <Switch
                  checked={settingsForm.notifyOnNewMeeting}
                  onCheckedChange={(checked) =>
                    setSettingsForm((prev) => ({ ...prev, notifyOnNewMeeting: checked }))
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>Notify on task created</Label>
                  <p className="text-xs text-muted-foreground">
                    Send notification when tasks are extracted
                  </p>
                </div>
                <Switch
                  checked={settingsForm.notifyOnTaskCreated}
                  onCheckedChange={(checked) =>
                    setSettingsForm((prev) => ({ ...prev, notifyOnTaskCreated: checked }))
                  }
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsSettingsOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveSettings} disabled={isSavingSettings}>
              {isSavingSettings ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Settings"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Import Meetings Dialog */}
      <Dialog open={isImportOpen} onOpenChange={setIsImportOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Import Meetings from Fireflies.ai</DialogTitle>
            <DialogDescription>
              Import all your meeting recordings and transcripts from Fireflies
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Preview Stats */}
            {importPreview && (
              <div className="p-4 bg-muted rounded-lg space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Available in Fireflies</span>
                  <span className="text-sm font-medium">
                    {importPreview.availableMeetings}{importPreview.hasMorePages ? "+" : ""} meetings
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Already Imported</span>
                  <span className="text-sm font-medium">{importPreview.alreadyImported} meetings</span>
                </div>
              </div>
            )}

            {/* Date Range Filter */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="dateFrom">From Date (Optional)</Label>
                <Input
                  id="dateFrom"
                  type="date"
                  value={importDateFrom}
                  onChange={(e) => setImportDateFrom(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dateTo">To Date (Optional)</Label>
                <Input
                  id="dateTo"
                  type="date"
                  value={importDateTo}
                  onChange={(e) => setImportDateTo(e.target.value)}
                />
              </div>
            </div>

            {/* Limit */}
            <div className="space-y-2">
              <Label>Maximum Meetings to Import</Label>
              <Select value={importLimit} onValueChange={setImportLimit}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="25">25 meetings</SelectItem>
                  <SelectItem value="50">50 meetings</SelectItem>
                  <SelectItem value="100">100 meetings</SelectItem>
                  <SelectItem value="250">250 meetings</SelectItem>
                  <SelectItem value="500">500 meetings</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Info */}
            <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
              <div className="flex gap-2">
                <Flame className="h-5 w-5 text-orange-600 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-orange-800">What will be imported</p>
                  <ul className="text-sm text-orange-700 mt-1 space-y-1">
                    <li>• Meeting titles and dates</li>
                    <li>• Full transcripts with speaker names</li>
                    <li>• AI-generated summaries</li>
                    <li>• Action items and keywords</li>
                    <li>• Sentiment analytics</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsImportOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleImportMeetings} disabled={isImporting}>
              {isImporting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Importing...
                </>
              ) : (
                <>
                  <Download className="mr-2 h-4 w-4" />
                  Import Meetings
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
