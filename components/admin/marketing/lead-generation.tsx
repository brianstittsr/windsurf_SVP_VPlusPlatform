"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
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
  UserPlus,
  FileText,
  Gift,
  TrendingUp,
  Star,
  Download,
  Percent,
  Calendar,
  Mail,
  Phone,
  MapPin,
  Building,
  Briefcase,
  DollarSign,
  Target,
  Filter,
  BarChart3,
  Eye,
  MousePointer,
  Users,
  CheckCircle2,
  XCircle,
  Clock,
  Zap,
} from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface Lead {
  id: string;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  source: string;
  score: number;
  status: "new" | "contacted" | "qualified" | "converted" | "lost";
  createdDate: string;
  lastActivity?: string;
}

interface LeadForm {
  id: string;
  name: string;
  type: "popup" | "embedded" | "exit-intent";
  status: "active" | "paused" | "draft";
  views: number;
  submissions: number;
  conversionRate: number;
}

interface LeadMagnet {
  id: string;
  name: string;
  type: "pdf" | "discount" | "consultation";
  downloads: number;
  leads: number;
  status: "active" | "inactive";
}

export function LeadGeneration() {
  const [activeTab, setActiveTab] = useState("leads");
  const [leads, setLeads] = useState<Lead[]>([
    {
      id: "1",
      name: "John Anderson",
      email: "john.anderson@manufacturing.com",
      phone: "(555) 123-4567",
      company: "Anderson Manufacturing",
      source: "Website Form",
      score: 85,
      status: "qualified",
      createdDate: "2024-12-20",
      lastActivity: "2024-12-22",
    },
    {
      id: "2",
      name: "Sarah Chen",
      email: "sarah.chen@techcorp.com",
      company: "TechCorp Industries",
      source: "LinkedIn",
      score: 72,
      status: "contacted",
      createdDate: "2024-12-18",
      lastActivity: "2024-12-19",
    },
    {
      id: "3",
      name: "Michael Roberts",
      email: "m.roberts@email.com",
      phone: "(555) 987-6543",
      source: "Webinar",
      score: 45,
      status: "new",
      createdDate: "2024-12-22",
    },
  ]);

  const [forms, setForms] = useState<LeadForm[]>([
    {
      id: "1",
      name: "Contact Us Form",
      type: "embedded",
      status: "active",
      views: 2450,
      submissions: 187,
      conversionRate: 7.6,
    },
    {
      id: "2",
      name: "Free Assessment Popup",
      type: "popup",
      status: "active",
      views: 5820,
      submissions: 349,
      conversionRate: 6.0,
    },
    {
      id: "3",
      name: "Exit Intent Offer",
      type: "exit-intent",
      status: "active",
      views: 1890,
      submissions: 142,
      conversionRate: 7.5,
    },
  ]);

  const [leadMagnets, setLeadMagnets] = useState<LeadMagnet[]>([
    {
      id: "1",
      name: "Manufacturing Excellence Guide",
      type: "pdf",
      downloads: 342,
      leads: 298,
      status: "active",
    },
    {
      id: "2",
      name: "10% Off First Service",
      type: "discount",
      downloads: 567,
      leads: 489,
      status: "active",
    },
    {
      id: "3",
      name: "Free Consultation",
      type: "consultation",
      downloads: 189,
      leads: 176,
      status: "active",
    },
  ]);

  const stats = {
    totalLeads: leads.length,
    newLeads: leads.filter(l => l.status === "new").length,
    qualifiedLeads: leads.filter(l => l.status === "qualified").length,
    conversionRate: 12.5,
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  const getScoreBadge = (score: number) => {
    if (score >= 80) return { label: "Hot", className: "bg-red-500" };
    if (score >= 60) return { label: "Warm", className: "bg-yellow-500" };
    return { label: "Cold", className: "bg-blue-500" };
  };

  const getStatusBadge = (status: Lead["status"]) => {
    const variants = {
      new: { variant: "default" as const, label: "New", className: "bg-blue-500" },
      contacted: { variant: "secondary" as const, label: "Contacted", className: "" },
      qualified: { variant: "default" as const, label: "Qualified", className: "bg-green-500" },
      converted: { variant: "default" as const, label: "Converted", className: "bg-purple-500" },
      lost: { variant: "outline" as const, label: "Lost", className: "" },
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
            <UserPlus className="h-6 w-6 text-green-500" />
            Lead Generation
          </h2>
          <p className="text-muted-foreground">Capture and qualify leads</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export Leads
          </Button>
          <Dialog>
            <DialogTrigger asChild>
              <Button>
                <UserPlus className="h-4 w-4 mr-2" />
                Add Lead
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Add New Lead</DialogTitle>
                <DialogDescription>Manually add a lead to your database</DialogDescription>
              </DialogHeader>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Full Name</Label>
                  <Input placeholder="John Doe" />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input type="email" placeholder="john@company.com" />
                </div>
                <div className="space-y-2">
                  <Label>Phone</Label>
                  <Input type="tel" placeholder="(555) 123-4567" />
                </div>
                <div className="space-y-2">
                  <Label>Company</Label>
                  <Input placeholder="Company Name" />
                </div>
                <div className="space-y-2">
                  <Label>Source</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select source" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="website">Website</SelectItem>
                      <SelectItem value="referral">Referral</SelectItem>
                      <SelectItem value="linkedin">LinkedIn</SelectItem>
                      <SelectItem value="event">Event</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Lead Score</Label>
                  <Input type="number" placeholder="0-100" min="0" max="100" />
                </div>
                <div className="col-span-2 space-y-2">
                  <Label>Notes</Label>
                  <Textarea placeholder="Additional information..." rows={3} />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline">Cancel</Button>
                <Button>Add Lead</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Leads
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalLeads}</div>
            <p className="text-xs text-green-600 flex items-center gap-1">
              <TrendingUp className="h-3 w-3" />
              +18% this month
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              New Leads
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.newLeads}</div>
            <p className="text-xs text-muted-foreground">Awaiting contact</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Qualified
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.qualifiedLeads}</div>
            <p className="text-xs text-muted-foreground">Ready for sales</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Conversion Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.conversionRate}%</div>
            <Progress value={stats.conversionRate} className="mt-2" />
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="leads">Leads</TabsTrigger>
          <TabsTrigger value="forms">Forms</TabsTrigger>
          <TabsTrigger value="magnets">Lead Magnets</TabsTrigger>
          <TabsTrigger value="scoring">Scoring</TabsTrigger>
        </TabsList>

        <TabsContent value="leads" className="space-y-4">
          <div className="flex items-center gap-2">
            <Select defaultValue="all">
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Leads</SelectItem>
                <SelectItem value="new">New</SelectItem>
                <SelectItem value="contacted">Contacted</SelectItem>
                <SelectItem value="qualified">Qualified</SelectItem>
                <SelectItem value="converted">Converted</SelectItem>
                <SelectItem value="lost">Lost</SelectItem>
              </SelectContent>
            </Select>
            <Select defaultValue="all">
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by source" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sources</SelectItem>
                <SelectItem value="website">Website</SelectItem>
                <SelectItem value="linkedin">LinkedIn</SelectItem>
                <SelectItem value="webinar">Webinar</SelectItem>
                <SelectItem value="referral">Referral</SelectItem>
              </SelectContent>
            </Select>
            <Select defaultValue="all">
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by score" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Scores</SelectItem>
                <SelectItem value="hot">Hot (80+)</SelectItem>
                <SelectItem value="warm">Warm (60-79)</SelectItem>
                <SelectItem value="cold">Cold (&lt;60)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-4">
            {leads.map((lead) => {
              const scoreBadge = getScoreBadge(lead.score);
              return (
                <Card key={lead.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center gap-2">
                          <CardTitle className="text-base">{lead.name}</CardTitle>
                          {getStatusBadge(lead.status)}
                          <Badge className={scoreBadge.className}>{scoreBadge.label}</Badge>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Mail className="h-4 w-4" />
                            {lead.email}
                          </div>
                          {lead.phone && (
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <Phone className="h-4 w-4" />
                              {lead.phone}
                            </div>
                          )}
                          {lead.company && (
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <Building className="h-4 w-4" />
                              {lead.company}
                            </div>
                          )}
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Target className="h-4 w-4" />
                            {lead.source}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`text-2xl font-bold ${getScoreColor(lead.score)}`}>
                          {lead.score}
                        </div>
                        <p className="text-xs text-muted-foreground">Lead Score</p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          Created {lead.createdDate}
                        </div>
                        {lead.lastActivity && (
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            Last activity {lead.lastActivity}
                          </div>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline">
                          <Mail className="h-4 w-4 mr-2" />
                          Email
                        </Button>
                        <Button size="sm" variant="outline">
                          <Phone className="h-4 w-4 mr-2" />
                          Call
                        </Button>
                        <Button size="sm">View Details</Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="forms" className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Create and manage lead capture forms
            </p>
            <Button>
              <FileText className="h-4 w-4 mr-2" />
              New Form
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {forms.map((form) => (
              <Card key={form.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">{form.name}</CardTitle>
                    <Badge
                      variant={form.status === "active" ? "default" : "secondary"}
                      className={form.status === "active" ? "bg-green-500" : ""}
                    >
                      {form.status}
                    </Badge>
                  </div>
                  <CardDescription className="capitalize">{form.type.replace("-", " ")}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="flex items-center gap-1 text-muted-foreground text-xs mb-1">
                        <Eye className="h-3 w-3" />
                        Views
                      </div>
                      <p className="text-lg font-semibold">{form.views.toLocaleString()}</p>
                    </div>
                    <div>
                      <div className="flex items-center gap-1 text-muted-foreground text-xs mb-1">
                        <MousePointer className="h-3 w-3" />
                        Submissions
                      </div>
                      <p className="text-lg font-semibold">{form.submissions.toLocaleString()}</p>
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="text-muted-foreground">Conversion Rate</span>
                      <span className="font-semibold">{form.conversionRate}%</span>
                    </div>
                    <Progress value={form.conversionRate} />
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" className="flex-1">
                      Edit
                    </Button>
                    <Button size="sm" variant="outline" className="flex-1">
                      <BarChart3 className="h-4 w-4 mr-2" />
                      Stats
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Form Builder</CardTitle>
              <CardDescription>Create custom lead capture forms</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-4">
                  <h3 className="font-semibold">Form Fields</h3>
                  <div className="space-y-2">
                    {[
                      { icon: Mail, label: "Email Field" },
                      { icon: Phone, label: "Phone Field" },
                      { icon: Building, label: "Company Field" },
                      { icon: Briefcase, label: "Job Title Field" },
                      { icon: MapPin, label: "Location Field" },
                    ].map((field, idx) => (
                      <div
                        key={idx}
                        className="border rounded-lg p-3 cursor-move hover:border-primary transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <field.icon className="h-4 w-4" />
                          <span className="text-sm font-medium">{field.label}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="border-2 border-dashed rounded-lg p-6 bg-muted/20">
                  <div className="space-y-4 max-w-md mx-auto">
                    <div>
                      <h3 className="font-bold text-lg mb-2">Get Your Free Assessment</h3>
                      <p className="text-sm text-muted-foreground">
                        Fill out the form below to get started
                      </p>
                    </div>
                    <div className="space-y-3">
                      <div className="space-y-1">
                        <Label className="text-xs">Full Name *</Label>
                        <div className="h-8 bg-white border rounded"></div>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Email *</Label>
                        <div className="h-8 bg-white border rounded"></div>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Company</Label>
                        <div className="h-8 bg-white border rounded"></div>
                      </div>
                      <div className="h-9 bg-primary/20 rounded flex items-center justify-center">
                        <span className="text-xs font-medium">Submit</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-semibold">Settings</h3>
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <Label className="text-xs">Form Name</Label>
                      <Input placeholder="Contact Form" className="h-8 text-sm" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs">Form Type</Label>
                      <Select>
                        <SelectTrigger className="h-8 text-sm">
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="popup">Popup</SelectItem>
                          <SelectItem value="embedded">Embedded</SelectItem>
                          <SelectItem value="exit">Exit Intent</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-center justify-between">
                      <Label className="text-xs">Show on mobile</Label>
                      <Switch />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label className="text-xs">Require email</Label>
                      <Switch defaultChecked />
                    </div>
                    <Button size="sm" className="w-full">
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                      Save Form
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="magnets" className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Offer valuable resources to capture leads
            </p>
            <Button>
              <Gift className="h-4 w-4 mr-2" />
              New Lead Magnet
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {leadMagnets.map((magnet) => (
              <Card key={magnet.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {magnet.type === "pdf" && <FileText className="h-5 w-5 text-red-500" />}
                      {magnet.type === "discount" && <Percent className="h-5 w-5 text-green-500" />}
                      {magnet.type === "consultation" && <Users className="h-5 w-5 text-blue-500" />}
                      <CardTitle className="text-base">{magnet.name}</CardTitle>
                    </div>
                    <Badge
                      variant={magnet.status === "active" ? "default" : "secondary"}
                      className={magnet.status === "active" ? "bg-green-500" : ""}
                    >
                      {magnet.status}
                    </Badge>
                  </div>
                  <CardDescription className="capitalize">{magnet.type}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="flex items-center gap-1 text-muted-foreground text-xs mb-1">
                        <Download className="h-3 w-3" />
                        Downloads
                      </div>
                      <p className="text-lg font-semibold">{magnet.downloads}</p>
                    </div>
                    <div>
                      <div className="flex items-center gap-1 text-muted-foreground text-xs mb-1">
                        <UserPlus className="h-3 w-3" />
                        Leads
                      </div>
                      <p className="text-lg font-semibold">{magnet.leads}</p>
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="text-muted-foreground">Conversion</span>
                      <span className="font-semibold">
                        {((magnet.leads / magnet.downloads) * 100).toFixed(1)}%
                      </span>
                    </div>
                    <Progress value={(magnet.leads / magnet.downloads) * 100} />
                  </div>
                  <Button size="sm" variant="outline" className="w-full">
                    Edit Magnet
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="border-2 border-dashed">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  PDF Download
                </CardTitle>
                <CardDescription>Offer a downloadable guide or ebook</CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" className="w-full">Create PDF Magnet</Button>
              </CardContent>
            </Card>

            <Card className="border-2 border-dashed">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Percent className="h-5 w-5" />
                  Discount Code
                </CardTitle>
                <CardDescription>Provide a special discount offer</CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" className="w-full">Create Discount</Button>
              </CardContent>
            </Card>

            <Card className="border-2 border-dashed">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Free Consultation
                </CardTitle>
                <CardDescription>Offer a free consultation booking</CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" className="w-full">Create Consultation</Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="scoring" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Lead Scoring Rules</CardTitle>
              <CardDescription>
                Define criteria to automatically score and qualify leads
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h3 className="font-semibold">Engagement Scoring</h3>
                <div className="space-y-3">
                  {[
                    { action: "Downloaded resource", points: 10 },
                    { action: "Visited pricing page", points: 15 },
                    { action: "Watched demo video", points: 20 },
                    { action: "Requested consultation", points: 30 },
                    { action: "Attended webinar", points: 25 },
                  ].map((rule, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-2">
                        <Zap className="h-4 w-4 text-yellow-500" />
                        <span className="text-sm">{rule.action}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">+{rule.points} points</Badge>
                        <Button variant="ghost" size="sm">Edit</Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="font-semibold">Demographic Scoring</h3>
                <div className="space-y-3">
                  {[
                    { criteria: "Company size > 50 employees", points: 15 },
                    { criteria: "Job title contains 'Director' or 'Manager'", points: 20 },
                    { criteria: "Industry: Manufacturing", points: 25 },
                  ].map((rule, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-2">
                        <Target className="h-4 w-4 text-blue-500" />
                        <span className="text-sm">{rule.criteria}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">+{rule.points} points</Badge>
                        <Button variant="ghost" size="sm">Edit</Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="font-semibold">Qualification Thresholds</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 border rounded-lg bg-red-50">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-red-500"></div>
                      <span className="font-medium">Hot Lead</span>
                    </div>
                    <span className="text-sm text-muted-foreground">Score ≥ 80</span>
                  </div>
                  <div className="flex items-center justify-between p-3 border rounded-lg bg-yellow-50">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                      <span className="font-medium">Warm Lead</span>
                    </div>
                    <span className="text-sm text-muted-foreground">Score 60-79</span>
                  </div>
                  <div className="flex items-center justify-between p-3 border rounded-lg bg-blue-50">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                      <span className="font-medium">Cold Lead</span>
                    </div>
                    <span className="text-sm text-muted-foreground">Score &lt; 60</span>
                  </div>
                </div>
              </div>

              <Button>
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Save Scoring Rules
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
