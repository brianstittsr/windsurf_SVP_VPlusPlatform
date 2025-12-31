"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Mail,
  Send,
  Calendar,
  Users,
  TrendingUp,
  Eye,
  MousePointer,
  UserCheck,
  Layout,
  Image as ImageIcon,
  Type,
  Link as LinkIcon,
  Palette,
  Play,
  Pause,
  Copy,
  Trash2,
  Edit,
  BarChart3,
  Clock,
  CheckCircle2,
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";

interface EmailCampaign {
  id: string;
  name: string;
  subject: string;
  status: "draft" | "scheduled" | "sent" | "active";
  type: "one-time" | "automated";
  recipients: number;
  openRate?: number;
  clickRate?: number;
  scheduledDate?: string;
  sentDate?: string;
}

interface EmailTemplate {
  id: string;
  name: string;
  category: string;
  thumbnail: string;
  description: string;
}

interface Segment {
  id: string;
  name: string;
  criteria: string;
  count: number;
}

export function EmailMarketing() {
  const [activeTab, setActiveTab] = useState("campaigns");
  const [campaigns, setCampaigns] = useState<EmailCampaign[]>([
    {
      id: "1",
      name: "Welcome Series",
      subject: "Welcome to Strategic Value+",
      status: "active",
      type: "automated",
      recipients: 1250,
      openRate: 45.2,
      clickRate: 12.8,
    },
    {
      id: "2",
      name: "Monthly Newsletter",
      subject: "December Updates & Industry Insights",
      status: "scheduled",
      type: "one-time",
      recipients: 3420,
      scheduledDate: "2024-12-30",
    },
    {
      id: "3",
      name: "Product Launch",
      subject: "Introducing EDGE-X™ Manufacturing Intelligence",
      status: "sent",
      type: "one-time",
      recipients: 2890,
      openRate: 52.1,
      clickRate: 18.5,
      sentDate: "2024-12-15",
    },
  ]);

  const [templates, setTemplates] = useState<EmailTemplate[]>([
    {
      id: "1",
      name: "Modern Newsletter",
      category: "Newsletter",
      thumbnail: "📰",
      description: "Clean, professional newsletter layout",
    },
    {
      id: "2",
      name: "Product Announcement",
      category: "Announcement",
      thumbnail: "🚀",
      description: "Eye-catching product launch template",
    },
    {
      id: "3",
      name: "Welcome Email",
      category: "Onboarding",
      thumbnail: "👋",
      description: "Warm welcome message for new subscribers",
    },
    {
      id: "4",
      name: "Event Invitation",
      category: "Event",
      thumbnail: "📅",
      description: "Professional event invitation design",
    },
  ]);

  const [segments, setSegments] = useState<Segment[]>([
    { id: "1", name: "All Subscribers", criteria: "All contacts", count: 5420 },
    { id: "2", name: "Active Customers", criteria: "Purchased in last 90 days", count: 1250 },
    { id: "3", name: "Prospects", criteria: "Never purchased", count: 2890 },
    { id: "4", name: "VIP Clients", criteria: "Lifetime value > $10k", count: 180 },
  ]);

  const stats = {
    totalSubscribers: 5420,
    activeCampaigns: campaigns.filter(c => c.status === "active").length,
    avgOpenRate: 48.5,
    avgClickRate: 15.2,
  };

  const getStatusBadge = (status: EmailCampaign["status"]) => {
    const variants = {
      draft: { variant: "outline" as const, label: "Draft", className: "" },
      scheduled: { variant: "secondary" as const, label: "Scheduled", className: "" },
      sent: { variant: "default" as const, label: "Sent", className: "" },
      active: { variant: "default" as const, label: "Active", className: "bg-green-500" },
    };
    const config = variants[status];
    return (
      <Badge variant={config.variant} className={config.className}>
        {config.label}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Mail className="h-6 w-6 text-blue-500" />
            Email Marketing
          </h2>
          <p className="text-muted-foreground">Create and manage email campaigns</p>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button>
              <Mail className="h-4 w-4 mr-2" />
              New Campaign
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create Email Campaign</DialogTitle>
              <DialogDescription>
                Set up a new email campaign to engage your audience
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Campaign Name</Label>
                <Input placeholder="e.g., January Newsletter" />
              </div>
              <div className="space-y-2">
                <Label>Campaign Type</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="one-time">One-time Campaign</SelectItem>
                    <SelectItem value="automated">Automated Sequence</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Select Template</Label>
                <div className="grid grid-cols-2 gap-3">
                  {templates.slice(0, 4).map((template) => (
                    <div
                      key={template.id}
                      className="border rounded-lg p-3 cursor-pointer hover:border-primary transition-colors"
                    >
                      <div className="text-3xl mb-2">{template.thumbnail}</div>
                      <p className="font-medium text-sm">{template.name}</p>
                      <p className="text-xs text-muted-foreground">{template.category}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline">Cancel</Button>
                <Button>Continue to Editor</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Subscribers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalSubscribers.toLocaleString()}</div>
            <p className="text-xs text-green-600 flex items-center gap-1">
              <TrendingUp className="h-3 w-3" />
              +12% this month
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Active Campaigns
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeCampaigns}</div>
            <p className="text-xs text-muted-foreground">Running automations</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Avg. Open Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.avgOpenRate}%</div>
            <Progress value={stats.avgOpenRate} className="mt-2" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Avg. Click Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.avgClickRate}%</div>
            <Progress value={stats.avgClickRate} className="mt-2" />
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
          <TabsTrigger value="builder">Email Builder</TabsTrigger>
          <TabsTrigger value="segments">Segments</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="campaigns" className="space-y-4">
          <div className="flex items-center gap-2">
            <Select defaultValue="all">
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Campaigns</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="scheduled">Scheduled</SelectItem>
                <SelectItem value="sent">Sent</SelectItem>
                <SelectItem value="draft">Drafts</SelectItem>
              </SelectContent>
            </Select>
            <Select defaultValue="all">
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="one-time">One-time</SelectItem>
                <SelectItem value="automated">Automated</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-4">
            {campaigns.map((campaign) => (
              <Card key={campaign.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-base">{campaign.name}</CardTitle>
                        {getStatusBadge(campaign.status)}
                        <Badge variant="outline">{campaign.type}</Badge>
                      </div>
                      <CardDescription>{campaign.subject}</CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="icon">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon">
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="text-destructive">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Recipients</p>
                      <p className="text-lg font-semibold">{campaign.recipients.toLocaleString()}</p>
                    </div>
                    {campaign.openRate !== undefined && (
                      <div>
                        <p className="text-sm text-muted-foreground">Open Rate</p>
                        <p className="text-lg font-semibold">{campaign.openRate}%</p>
                      </div>
                    )}
                    {campaign.clickRate !== undefined && (
                      <div>
                        <p className="text-sm text-muted-foreground">Click Rate</p>
                        <p className="text-lg font-semibold">{campaign.clickRate}%</p>
                      </div>
                    )}
                    {campaign.scheduledDate && (
                      <div>
                        <p className="text-sm text-muted-foreground">Scheduled</p>
                        <p className="text-lg font-semibold">{campaign.scheduledDate}</p>
                      </div>
                    )}
                    {campaign.sentDate && (
                      <div>
                        <p className="text-sm text-muted-foreground">Sent</p>
                        <p className="text-lg font-semibold">{campaign.sentDate}</p>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      {campaign.status === "active" && (
                        <Button size="sm" variant="outline">
                          <Pause className="h-4 w-4 mr-2" />
                          Pause
                        </Button>
                      )}
                      {campaign.status === "draft" && (
                        <Button size="sm">
                          <Send className="h-4 w-4 mr-2" />
                          Send
                        </Button>
                      )}
                      {campaign.status === "sent" && (
                        <Button size="sm" variant="outline">
                          <BarChart3 className="h-4 w-4 mr-2" />
                          View Report
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="builder" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Drag-and-Drop Email Builder</CardTitle>
              <CardDescription>
                Create beautiful, responsive emails with our visual editor
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold mb-3">Content Blocks</h3>
                    <div className="space-y-2">
                      {[
                        { icon: Type, label: "Text Block" },
                        { icon: ImageIcon, label: "Image" },
                        { icon: Layout, label: "Button" },
                        { icon: LinkIcon, label: "Link" },
                        { icon: Palette, label: "Divider" },
                      ].map((block, idx) => (
                        <div
                          key={idx}
                          className="border rounded-lg p-3 cursor-move hover:border-primary transition-colors"
                        >
                          <div className="flex items-center gap-2">
                            <block.icon className="h-4 w-4" />
                            <span className="text-sm font-medium">{block.label}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-3">Templates</h3>
                    <div className="space-y-2">
                      {templates.slice(0, 3).map((template) => (
                        <div
                          key={template.id}
                          className="border rounded-lg p-3 cursor-pointer hover:border-primary transition-colors"
                        >
                          <div className="text-2xl mb-1">{template.thumbnail}</div>
                          <p className="text-sm font-medium">{template.name}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="md:col-span-2">
                  <div className="border-2 border-dashed rounded-lg p-8 min-h-[600px] bg-muted/20">
                    <div className="bg-white rounded-lg shadow-sm p-6 max-w-xl mx-auto">
                      <div className="space-y-4">
                        <div className="h-12 bg-primary/10 rounded flex items-center justify-center">
                          <span className="text-sm text-muted-foreground">Header / Logo</span>
                        </div>
                        <div className="space-y-2">
                          <div className="h-8 bg-muted rounded w-3/4"></div>
                          <div className="h-4 bg-muted rounded"></div>
                          <div className="h-4 bg-muted rounded w-5/6"></div>
                        </div>
                        <div className="h-48 bg-muted rounded flex items-center justify-center">
                          <ImageIcon className="h-12 w-12 text-muted-foreground" />
                        </div>
                        <div className="space-y-2">
                          <div className="h-4 bg-muted rounded"></div>
                          <div className="h-4 bg-muted rounded w-4/5"></div>
                          <div className="h-4 bg-muted rounded w-3/4"></div>
                        </div>
                        <div className="flex justify-center">
                          <div className="h-10 bg-primary/20 rounded w-32 flex items-center justify-center">
                            <span className="text-xs text-muted-foreground">Button</span>
                          </div>
                        </div>
                        <div className="h-8 bg-muted/50 rounded flex items-center justify-center">
                          <span className="text-xs text-muted-foreground">Footer</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold mb-3">Settings</h3>
                    <div className="space-y-3">
                      <div className="space-y-2">
                        <Label className="text-xs">Subject Line</Label>
                        <Input placeholder="Enter subject..." className="h-8 text-sm" />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs">Preview Text</Label>
                        <Input placeholder="Preview text..." className="h-8 text-sm" />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs">From Name</Label>
                        <Input placeholder="Your Name" className="h-8 text-sm" />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs">From Email</Label>
                        <Input placeholder="email@company.com" className="h-8 text-sm" />
                      </div>
                    </div>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-3">Actions</h3>
                    <div className="space-y-2">
                      <Button size="sm" variant="outline" className="w-full">
                        <Eye className="h-4 w-4 mr-2" />
                        Preview
                      </Button>
                      <Button size="sm" variant="outline" className="w-full">
                        <Send className="h-4 w-4 mr-2" />
                        Test Email
                      </Button>
                      <Button size="sm" className="w-full">
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                        Save Draft
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="segments" className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Create targeted segments to send personalized campaigns
            </p>
            <Button>
              <Users className="h-4 w-4 mr-2" />
              New Segment
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {segments.map((segment) => (
              <Card key={segment.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-base">{segment.name}</CardTitle>
                      <CardDescription>{segment.criteria}</CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="icon">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="text-destructive">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-2xl font-bold">{segment.count.toLocaleString()}</p>
                      <p className="text-sm text-muted-foreground">contacts</p>
                    </div>
                    <Button size="sm">
                      <Send className="h-4 w-4 mr-2" />
                      Send Campaign
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Create New Segment</CardTitle>
              <CardDescription>Define criteria to segment your audience</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Segment Name</Label>
                  <Input placeholder="e.g., High-Value Customers" />
                </div>
                <div className="space-y-2">
                  <Label>Criteria Type</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select criteria" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="engagement">Engagement Level</SelectItem>
                      <SelectItem value="purchase">Purchase History</SelectItem>
                      <SelectItem value="demographic">Demographics</SelectItem>
                      <SelectItem value="behavior">Behavior</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button>Create Segment</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Campaign Performance</CardTitle>
                <CardDescription>Last 30 days</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Emails Sent</span>
                    <span className="font-semibold">12,450</span>
                  </div>
                  <Progress value={85} />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Delivered</span>
                    <span className="font-semibold">12,180 (97.8%)</span>
                  </div>
                  <Progress value={97.8} />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Opened</span>
                    <span className="font-semibold">5,910 (48.5%)</span>
                  </div>
                  <Progress value={48.5} />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Clicked</span>
                    <span className="font-semibold">1,851 (15.2%)</span>
                  </div>
                  <Progress value={15.2} />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Unsubscribed</span>
                    <span className="font-semibold">45 (0.4%)</span>
                  </div>
                  <Progress value={0.4} className="bg-red-100" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Top Performing Campaigns</CardTitle>
                <CardDescription>By click-through rate</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {campaigns
                    .filter(c => c.clickRate)
                    .sort((a, b) => (b.clickRate || 0) - (a.clickRate || 0))
                    .map((campaign) => (
                      <div key={campaign.id} className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-medium truncate flex-1">{campaign.name}</span>
                          <span className="text-muted-foreground ml-2">{campaign.clickRate}%</span>
                        </div>
                        <Progress value={campaign.clickRate} />
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Subscriber Growth</CardTitle>
                <CardDescription>Monthly trend</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    { month: "December", subscribers: 5420, growth: 12 },
                    { month: "November", subscribers: 4839, growth: 8 },
                    { month: "October", subscribers: 4481, growth: 15 },
                    { month: "September", subscribers: 3897, growth: 10 },
                  ].map((data, idx) => (
                    <div key={idx} className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{data.month}</p>
                        <p className="text-sm text-muted-foreground">
                          {data.subscribers.toLocaleString()} subscribers
                        </p>
                      </div>
                      <Badge className="bg-green-500">+{data.growth}%</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Engagement Insights</CardTitle>
                <CardDescription>Optimize your campaigns</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-start gap-2 text-sm">
                  <Clock className="h-4 w-4 text-blue-500 mt-0.5" />
                  <div>
                    <p className="font-medium">Best Send Time</p>
                    <p className="text-muted-foreground">Tuesday, 10:00 AM</p>
                  </div>
                </div>
                <div className="flex items-start gap-2 text-sm">
                  <Eye className="h-4 w-4 text-green-500 mt-0.5" />
                  <div>
                    <p className="font-medium">Highest Open Rate</p>
                    <p className="text-muted-foreground">Subject lines under 50 characters</p>
                  </div>
                </div>
                <div className="flex items-start gap-2 text-sm">
                  <MousePointer className="h-4 w-4 text-purple-500 mt-0.5" />
                  <div>
                    <p className="font-medium">Most Clicked Content</p>
                    <p className="text-muted-foreground">Product announcements</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
