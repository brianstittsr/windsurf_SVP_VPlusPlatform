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
import { Textarea } from "@/components/ui/textarea";
import {
  Video,
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
  Link2,
  Loader2,
  Play,
  Calendar,
  User,
  Building,
  ExternalLink,
  Plus,
  Trash2,
  RefreshCw,
  Download,
  Upload,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

interface FathomActionItem {
  id: string;
  text: string;
  assigneeId?: string;
  assigneeName?: string;
  status: "pending" | "in_progress" | "completed" | "cancelled";
  dueDate?: { seconds: number };
  completedAt?: { seconds: number };
  createdFromTranscript: boolean;
}

interface FathomTranscriptEntry {
  speaker: string;
  text: string;
  startTime: number;
  endTime: number;
}

interface FathomMeeting {
  id: string;
  fathomMeetingId: string;
  title: string;
  meetingDate: { seconds: number };
  duration: number;
  recordingUrl?: string;
  participants: string[];
  hostEmail?: string;
  summary?: string;
  transcript?: FathomTranscriptEntry[];
  transcriptText?: string;
  actionItems: FathomActionItem[];
  linkedCustomerId?: string;
  linkedProjectId?: string;
  processingStatus: "pending" | "processed" | "failed";
  aiTasksExtracted: boolean;
  source: "webhook" | "manual" | "api";
}

interface FathomSettings {
  id?: string;
  apiKey?: string;
  isConnected: boolean;
  autoExtractTasks: boolean;
  autoAssignTasks: boolean;
  defaultTaskDueDays: number;
  notifyOnNewMeeting: boolean;
  notifyOnTaskCreated: boolean;
  notificationEmails: string[];
  autoLinkToCustomers: boolean;
  autoLinkToProjects: boolean;
}

export default function FathomIntegrationPage() {
  const [meetings, setMeetings] = useState<FathomMeeting[]>([]);
  const [settings, setSettings] = useState<FathomSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMeeting, setSelectedMeeting] = useState<FathomMeeting | null>(null);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isExtractingTasks, setIsExtractingTasks] = useState(false);
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  // Settings form state
  const [settingsForm, setSettingsForm] = useState<FathomSettings>({
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
      const response = await fetch("/api/fathom/meetings");
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
      const response = await fetch("/api/fathom/settings");
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
      const response = await fetch("/api/fathom/import?action=preview");
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

  // Import meetings from Fathom
  const handleImportMeetings = async () => {
    setIsImporting(true);
    try {
      const body: Record<string, unknown> = {
        limit: parseInt(importLimit),
        includeTranscript: true,
        includeSummary: true,
        includeActionItems: true,
      };

      if (importDateFrom) {
        body.createdAfter = new Date(importDateFrom).toISOString();
      }
      if (importDateTo) {
        body.createdBefore = new Date(importDateTo).toISOString();
      }

      const response = await fetch("/api/fathom/import", {
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
      const response = await fetch("/api/fathom/settings", {
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
      const response = await fetch(`/api/fathom/meetings/${meetingId}/extract-tasks`, {
        method: "POST",
      });

      if (response.ok) {
        const data = await response.json();
        toast.success(`Extracted ${data.extractedCount} new tasks`);
        fetchMeetings();
        if (selectedMeeting?.id === meetingId) {
          // Refresh the selected meeting
          const meetingResponse = await fetch(`/api/fathom/meetings/${meetingId}`);
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
      const response = await fetch(`/api/fathom/meetings/${meetingId}`, {
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
          const meetingResponse = await fetch(`/api/fathom/meetings/${meetingId}`);
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

  // Get status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="outline" className="text-yellow-600"><Circle className="h-3 w-3 mr-1" />Pending</Badge>;
      case "in_progress":
        return <Badge variant="outline" className="text-blue-600"><Clock className="h-3 w-3 mr-1" />In Progress</Badge>;
      case "completed":
        return <Badge className="bg-green-100 text-green-800"><CheckCircle2 className="h-3 w-3 mr-1" />Completed</Badge>;
      case "cancelled":
        return <Badge variant="secondary">Cancelled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
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
          <h1 className="text-3xl font-bold tracking-tight">Fathom Integration</h1>
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
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-yellow-100">
                <Video className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold">Connect Fathom</h3>
                <p className="text-sm text-muted-foreground">
                  Add your Fathom API key to start receiving meeting recordings and transcripts
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
            Meetings captured from Fathom with transcripts and action items
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredMeetings.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
              <Video className="h-12 w-12 mb-4" />
              <p className="text-lg font-medium">No meetings found</p>
              <p className="text-sm">Meetings will appear here when received from Fathom</p>
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
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMeetings.map((meeting) => (
                  <TableRow key={meeting.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                          <Video className="h-5 w-5 text-primary" />
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
                          {meeting.summary && (
                            <p className="text-xs text-muted-foreground line-clamp-1 max-w-[300px]">
                              {meeting.summary}
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
                      <Badge
                        className={
                          meeting.processingStatus === "processed"
                            ? "bg-green-100 text-green-800"
                            : meeting.processingStatus === "failed"
                            ? "bg-red-100 text-red-800"
                            : "bg-yellow-100 text-yellow-800"
                        }
                      >
                        {meeting.processingStatus}
                      </Badge>
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
                          {meeting.recordingUrl && (
                            <DropdownMenuItem asChild>
                              <a href={meeting.recordingUrl} target="_blank" rel="noopener noreferrer">
                                <Play className="mr-2 h-4 w-4" />
                                Watch Recording
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
                  <FileText className="h-4 w-4 mr-2" />
                  Transcript
                </TabsTrigger>
                <TabsTrigger value="participants">
                  <Users className="h-4 w-4 mr-2" />
                  Participants
                </TabsTrigger>
              </TabsList>

              <TabsContent value="summary" className="flex-1 overflow-auto">
                <div className="space-y-4 p-4">
                  {selectedMeeting.summary ? (
                    <div className="prose prose-sm max-w-none">
                      <p>{selectedMeeting.summary}</p>
                    </div>
                  ) : (
                    <p className="text-muted-foreground">No summary available</p>
                  )}

                  {selectedMeeting.recordingUrl && (
                    <div className="pt-4">
                      <Button asChild>
                        <a href={selectedMeeting.recordingUrl} target="_blank" rel="noopener noreferrer">
                          <Play className="mr-2 h-4 w-4" />
                          Watch Recording
                          <ExternalLink className="ml-2 h-4 w-4" />
                        </a>
                      </Button>
                    </div>
                  )}
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
                  {selectedMeeting.transcript && selectedMeeting.transcript.length > 0 ? (
                    <div className="space-y-4">
                      {selectedMeeting.transcript.map((entry, index) => (
                        <div key={index} className="flex gap-3">
                          <div className="w-24 flex-shrink-0">
                            <p className="font-medium text-sm">{entry.speaker}</p>
                            <p className="text-xs text-muted-foreground">
                              {Math.floor(entry.startTime / 60)}:{String(Math.floor(entry.startTime % 60)).padStart(2, "0")}
                            </p>
                          </div>
                          <p className="text-sm">{entry.text}</p>
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

              <TabsContent value="participants" className="flex-1 overflow-auto">
                <div className="space-y-2 p-4">
                  {selectedMeeting.participants.map((participant, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-3 p-2 border rounded-lg"
                    >
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <User className="h-4 w-4 text-primary" />
                      </div>
                      <span>{participant}</span>
                      {participant === selectedMeeting.hostEmail && (
                        <Badge variant="secondary">Host</Badge>
                      )}
                    </div>
                  ))}
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
            <DialogTitle>Fathom Integration Settings</DialogTitle>
            <DialogDescription>
              Configure your Fathom connection and automation preferences
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* API Key */}
            <div className="space-y-2">
              <Label htmlFor="apiKey">Fathom API Key</Label>
              <Input
                id="apiKey"
                type="password"
                value={settingsForm.apiKey || ""}
                onChange={(e) => setSettingsForm((prev) => ({ ...prev, apiKey: e.target.value }))}
                placeholder="Enter your Fathom API key"
              />
              <p className="text-xs text-muted-foreground">
                Get your API key from{" "}
                <a
                  href="https://fathom.video/customize"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  Fathom Settings
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
                  value={`${typeof window !== "undefined" ? window.location.origin : ""}/api/fathom/webhook`}
                />
                <Button
                  variant="outline"
                  onClick={() => {
                    navigator.clipboard.writeText(
                      `${window.location.origin}/api/fathom/webhook`
                    );
                    toast.success("Webhook URL copied");
                  }}
                >
                  Copy
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Add this URL as a webhook destination in your Fathom settings
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
            <DialogTitle>Import Meetings from Fathom</DialogTitle>
            <DialogDescription>
              Import all your meeting recordings and transcripts from Fathom
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Preview Stats */}
            {importPreview && (
              <div className="p-4 bg-muted rounded-lg space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Available in Fathom</span>
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
                  <SelectItem value="1000">1000 meetings</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Info */}
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex gap-2">
                <FileText className="h-5 w-5 text-blue-600 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-blue-800">What will be imported</p>
                  <ul className="text-sm text-blue-700 mt-1 space-y-1">
                    <li>• Meeting titles and dates</li>
                    <li>• Full transcripts with speaker names</li>
                    <li>• AI-generated summaries</li>
                    <li>• Action items and assignees</li>
                    <li>• Recording URLs</li>
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
