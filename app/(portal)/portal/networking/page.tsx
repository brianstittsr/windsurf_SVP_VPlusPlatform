"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Users,
  Calendar,
  MessageSquare,
  Handshake,
  Search,
  Filter,
  Plus,
  Clock,
  CheckCircle,
  XCircle,
  ChevronRight,
  Building2,
  MapPin,
  Briefcase,
  Star,
  UserPlus,
} from "lucide-react";
import { cn } from "@/lib/utils";

// Affiliate categories based on services
const affiliateCategories = [
  { id: "manufacturing", name: "Manufacturing Operations", color: "bg-blue-500" },
  { id: "quality", name: "Quality & ISO", color: "bg-green-500" },
  { id: "technology", name: "Technology & AI", color: "bg-purple-500" },
  { id: "finance", name: "Finance & Accounting", color: "bg-yellow-500" },
  { id: "sales", name: "Sales & Marketing", color: "bg-red-500" },
  { id: "hr", name: "HR & Workforce", color: "bg-pink-500" },
  { id: "supply-chain", name: "Supply Chain", color: "bg-orange-500" },
  { id: "international", name: "International Business", color: "bg-teal-500" },
];

// Mock affiliates data
const mockAffiliates = [
  {
    id: "1",
    name: "Sarah Chen",
    title: "Lean Manufacturing Consultant",
    company: "Chen Consulting Group",
    location: "Detroit, MI",
    categories: ["manufacturing", "quality"],
    expertise: ["Six Sigma", "Lean Manufacturing", "Process Optimization"],
    bio: "15+ years helping manufacturers streamline operations and reduce waste.",
    rating: 4.9,
    completedOneToOnes: 24,
    avatar: null,
  },
  {
    id: "2",
    name: "Michael Rodriguez",
    title: "ISO Implementation Specialist",
    company: "Quality First Solutions",
    location: "Houston, TX",
    categories: ["quality"],
    expertise: ["ISO 9001", "IATF 16949", "AS9100", "Auditing"],
    bio: "Certified lead auditor with experience in automotive and aerospace sectors.",
    rating: 4.8,
    completedOneToOnes: 18,
    avatar: null,
  },
  {
    id: "3",
    name: "Jennifer Park",
    title: "AI & Automation Strategist",
    company: "TechForward Inc",
    location: "San Francisco, CA",
    categories: ["technology"],
    expertise: ["AI Implementation", "Digital Twins", "Robotics", "Industry 4.0"],
    bio: "Helping manufacturers embrace digital transformation and smart factory solutions.",
    rating: 5.0,
    completedOneToOnes: 31,
    avatar: null,
  },
  {
    id: "4",
    name: "David Thompson",
    title: "Manufacturing Finance Advisor",
    company: "Thompson Financial",
    location: "Chicago, IL",
    categories: ["finance"],
    expertise: ["R&D Tax Credits", "Cost Accounting", "Financial Planning"],
    bio: "Specialized in manufacturing economics and helping companies maximize profitability.",
    rating: 4.7,
    completedOneToOnes: 15,
    avatar: null,
  },
  {
    id: "5",
    name: "Lisa Wang",
    title: "International Trade Specialist",
    company: "Global Bridge Consulting",
    location: "Los Angeles, CA",
    categories: ["international", "supply-chain"],
    expertise: ["China Sourcing", "Reshoring", "Supply Chain Optimization"],
    bio: "Fluent in Mandarin. Expert in navigating international manufacturing partnerships.",
    rating: 4.9,
    completedOneToOnes: 22,
    avatar: null,
  },
];

// Mock One-to-One requests
const mockOneToOnes = [
  {
    id: "1",
    requesterId: "current-user",
    requesterName: "You",
    targetId: "3",
    targetName: "Jennifer Park",
    status: "pending",
    proposedDate: "2024-12-15T14:00:00",
    topic: "Exploring AI solutions for our manufacturing clients",
    notes: "Would like to discuss potential collaboration on digital twin projects.",
  },
  {
    id: "2",
    requesterId: "2",
    requesterName: "Michael Rodriguez",
    targetId: "current-user",
    targetName: "You",
    status: "accepted",
    proposedDate: "2024-12-12T10:00:00",
    topic: "ISO certification referral opportunities",
    notes: "Michael wants to discuss how we can cross-refer clients.",
  },
  {
    id: "3",
    requesterId: "current-user",
    requesterName: "You",
    targetId: "1",
    targetName: "Sarah Chen",
    status: "completed",
    proposedDate: "2024-12-01T15:00:00",
    topic: "Lean manufacturing collaboration",
    notes: "Great meeting! Agreed to collaborate on upcoming projects.",
  },
];

// Leadership team for One-to-One requests
const leadershipTeam = [
  { id: "nel", name: "Nel Varenas", title: "CEO", available: true },
  { id: "brian", name: "Brian Stitt", title: "CTO", available: true },
  { id: "roy", name: "Roy Dickan", title: "CRO", available: false },
  { id: "dave", name: "Dave McFarland", title: "COO", available: true },
];

export default function NetworkingPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [isRequestDialogOpen, setIsRequestDialogOpen] = useState(false);
  const [selectedAffiliate, setSelectedAffiliate] = useState<typeof mockAffiliates[0] | null>(null);
  const [requestForm, setRequestForm] = useState({
    targetType: "affiliate" as "affiliate" | "leadership",
    targetId: "",
    proposedDate: "",
    proposedTime: "",
    topic: "",
    notes: "",
  });

  const filteredAffiliates = mockAffiliates.filter((affiliate) => {
    const matchesSearch =
      affiliate.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      affiliate.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
      affiliate.expertise.some((e) => e.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = !selectedCategory || affiliate.categories.includes(selectedCategory);
    return matchesSearch && matchesCategory;
  });

  const openRequestDialog = (affiliate?: typeof mockAffiliates[0]) => {
    if (affiliate) {
      setSelectedAffiliate(affiliate);
      setRequestForm({ ...requestForm, targetType: "affiliate", targetId: affiliate.id });
    }
    setIsRequestDialogOpen(true);
  };

  const submitRequest = () => {
    console.log("Submitting One-to-One request:", requestForm);
    setIsRequestDialogOpen(false);
    setRequestForm({
      targetType: "affiliate",
      targetId: "",
      proposedDate: "",
      proposedTime: "",
      topic: "",
      notes: "",
    });
    setSelectedAffiliate(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Affiliate Networking</h1>
          <p className="text-muted-foreground">
            Connect with other affiliates using the BNI One-to-One model
          </p>
        </div>
        <Button onClick={() => openRequestDialog()}>
          <UserPlus className="mr-2 h-4 w-4" />
          Request One-to-One
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Network Size
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockAffiliates.length}</div>
            <p className="text-xs text-muted-foreground">Active affiliates</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pending Requests
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {mockOneToOnes.filter((o) => o.status === "pending").length}
            </div>
            <p className="text-xs text-muted-foreground">Awaiting response</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Upcoming Meetings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {mockOneToOnes.filter((o) => o.status === "accepted").length}
            </div>
            <p className="text-xs text-muted-foreground">Scheduled One-to-Ones</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Completed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {mockOneToOnes.filter((o) => o.status === "completed").length}
            </div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="directory" className="space-y-6">
        <TabsList>
          <TabsTrigger value="directory">Affiliate Directory</TabsTrigger>
          <TabsTrigger value="one-to-ones">My One-to-Ones</TabsTrigger>
          <TabsTrigger value="leadership">Leadership Access</TabsTrigger>
        </TabsList>

        {/* Affiliate Directory */}
        <TabsContent value="directory" className="space-y-6">
          {/* Search and Filter */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search affiliates by name, company, or expertise..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Select
              value={selectedCategory || "all"}
              onValueChange={(v) => setSelectedCategory(v === "all" ? null : v)}
            >
              <SelectTrigger className="w-[200px]">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {affiliateCategories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Category Pills */}
          <div className="flex flex-wrap gap-2">
            {affiliateCategories.map((cat) => (
              <Badge
                key={cat.id}
                variant={selectedCategory === cat.id ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => setSelectedCategory(selectedCategory === cat.id ? null : cat.id)}
              >
                <div className={cn("w-2 h-2 rounded-full mr-2", cat.color)} />
                {cat.name}
              </Badge>
            ))}
          </div>

          {/* Affiliates Grid */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredAffiliates.map((affiliate) => (
              <Card key={affiliate.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start gap-4">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={affiliate.avatar || undefined} />
                      <AvatarFallback>
                        {affiliate.name.split(" ").map((n) => n[0]).join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-lg">{affiliate.name}</CardTitle>
                      <CardDescription>{affiliate.title}</CardDescription>
                    </div>
                    <div className="flex items-center gap-1 text-yellow-500">
                      <Star className="h-4 w-4 fill-current" />
                      <span className="text-sm font-medium">{affiliate.rating}</span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Building2 className="h-4 w-4" />
                      {affiliate.company}
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      {affiliate.location}
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Handshake className="h-4 w-4" />
                      {affiliate.completedOneToOnes} One-to-Ones completed
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1">
                    {affiliate.categories.map((catId) => {
                      const cat = affiliateCategories.find((c) => c.id === catId);
                      return cat ? (
                        <Badge key={catId} variant="secondary" className="text-xs">
                          {cat.name}
                        </Badge>
                      ) : null;
                    })}
                  </div>

                  <div className="flex flex-wrap gap-1">
                    {affiliate.expertise.slice(0, 3).map((exp) => (
                      <Badge key={exp} variant="outline" className="text-xs">
                        {exp}
                      </Badge>
                    ))}
                    {affiliate.expertise.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{affiliate.expertise.length - 3} more
                      </Badge>
                    )}
                  </div>

                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {affiliate.bio}
                  </p>

                  <Button
                    className="w-full"
                    onClick={() => openRequestDialog(affiliate)}
                  >
                    <Calendar className="mr-2 h-4 w-4" />
                    Request One-to-One
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* My One-to-Ones */}
        <TabsContent value="one-to-ones" className="space-y-6">
          <div className="space-y-4">
            {mockOneToOnes.map((oneToOne) => (
              <Card key={oneToOne.id}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div
                        className={cn(
                          "p-3 rounded-full",
                          oneToOne.status === "pending"
                            ? "bg-yellow-100"
                            : oneToOne.status === "accepted"
                            ? "bg-blue-100"
                            : "bg-green-100"
                        )}
                      >
                        {oneToOne.status === "pending" ? (
                          <Clock className="h-5 w-5 text-yellow-600" />
                        ) : oneToOne.status === "accepted" ? (
                          <Calendar className="h-5 w-5 text-blue-600" />
                        ) : (
                          <CheckCircle className="h-5 w-5 text-green-600" />
                        )}
                      </div>
                      <div>
                        <h3 className="font-semibold">
                          One-to-One with {oneToOne.targetName}
                        </h3>
                        <p className="text-sm text-muted-foreground">{oneToOne.topic}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(oneToOne.proposedDate).toLocaleDateString("en-US", {
                            weekday: "long",
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={
                          oneToOne.status === "pending"
                            ? "secondary"
                            : oneToOne.status === "accepted"
                            ? "default"
                            : "outline"
                        }
                      >
                        {oneToOne.status.charAt(0).toUpperCase() + oneToOne.status.slice(1)}
                      </Badge>
                      {oneToOne.status === "accepted" && (
                        <Button size="sm">
                          Join Meeting
                          <ChevronRight className="ml-1 h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Leadership Access */}
        <TabsContent value="leadership" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Request One-to-One with Leadership</CardTitle>
              <CardDescription>
                Schedule a meeting with Strategic Value+ leadership team members
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                {leadershipTeam.map((leader) => (
                  <div
                    key={leader.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarFallback>
                          {leader.name.split(" ").map((n) => n[0]).join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{leader.name}</p>
                        <p className="text-sm text-muted-foreground">{leader.title}</p>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant={leader.available ? "default" : "secondary"}
                      disabled={!leader.available}
                      onClick={() => {
                        setRequestForm({
                          ...requestForm,
                          targetType: "leadership",
                          targetId: leader.id,
                        });
                        setIsRequestDialogOpen(true);
                      }}
                    >
                      {leader.available ? "Request Meeting" : "Unavailable"}
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Request One-to-One Dialog */}
      <Dialog open={isRequestDialogOpen} onOpenChange={setIsRequestDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Request One-to-One Meeting</DialogTitle>
            <DialogDescription>
              {selectedAffiliate
                ? `Schedule a networking meeting with ${selectedAffiliate.name}`
                : "Select who you'd like to meet with"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {!selectedAffiliate && requestForm.targetType === "affiliate" && (
              <div className="space-y-2">
                <Label>Select Affiliate</Label>
                <Select
                  value={requestForm.targetId}
                  onValueChange={(v) => setRequestForm({ ...requestForm, targetId: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choose an affiliate" />
                  </SelectTrigger>
                  <SelectContent>
                    {mockAffiliates.map((affiliate) => (
                      <SelectItem key={affiliate.id} value={affiliate.id}>
                        {affiliate.name} - {affiliate.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="date">Proposed Date</Label>
                <Input
                  id="date"
                  type="date"
                  value={requestForm.proposedDate}
                  onChange={(e) =>
                    setRequestForm({ ...requestForm, proposedDate: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="time">Proposed Time</Label>
                <Input
                  id="time"
                  type="time"
                  value={requestForm.proposedTime}
                  onChange={(e) =>
                    setRequestForm({ ...requestForm, proposedTime: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="topic">Meeting Topic</Label>
              <Input
                id="topic"
                placeholder="What would you like to discuss?"
                value={requestForm.topic}
                onChange={(e) => setRequestForm({ ...requestForm, topic: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Additional Notes</Label>
              <Textarea
                id="notes"
                placeholder="Any additional context or questions..."
                value={requestForm.notes}
                onChange={(e) => setRequestForm({ ...requestForm, notes: e.target.value })}
                rows={3}
              />
            </div>

            <div className="p-4 bg-muted rounded-lg">
              <h4 className="font-medium text-sm mb-2">BNI One-to-One Best Practices</h4>
              <ul className="text-xs text-muted-foreground space-y-1">
                <li>• Come prepared with specific questions</li>
                <li>• Share your ideal referral profile</li>
                <li>• Listen actively and take notes</li>
                <li>• Follow up within 24 hours</li>
              </ul>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRequestDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={submitRequest}>
              <Calendar className="mr-2 h-4 w-4" />
              Send Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
