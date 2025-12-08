"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DollarSign,
  Plus,
  Search,
  Filter,
  MoreHorizontal,
  Building2,
  Calendar,
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  ArrowUpRight,
  Pencil,
  Trash2,
  Eye,
} from "lucide-react";
import { cn } from "@/lib/utils";

// Deal stages
const dealStages = [
  { id: "referral", name: "Referral Made", color: "bg-gray-500", commission: 7 },
  { id: "qualified", name: "Lead Qualified", color: "bg-blue-500", commission: 7 },
  { id: "proposal", name: "Proposal Sent", color: "bg-yellow-500", commission: 12 },
  { id: "negotiation", name: "In Negotiation", color: "bg-orange-500", commission: 12 },
  { id: "closed-won", name: "Closed Won", color: "bg-green-500", commission: 17 },
  { id: "closed-lost", name: "Closed Lost", color: "bg-red-500", commission: 0 },
];

// Commission tiers
const commissionTiers = [
  { level: "referral", name: "Referral Only", rate: 7, description: "Simple introduction" },
  { level: "assist", name: "Assist Sales", rate: 12, description: "Help warm the lead" },
  { level: "co-sell", name: "Co-Sell & Close", rate: 17, description: "Support sales process" },
];

// Mock deals data
const mockDeals = [
  {
    id: "1",
    companyName: "Precision Manufacturing Co.",
    contactName: "John Smith",
    contactEmail: "john@precisionmfg.com",
    stage: "proposal",
    value: 45000,
    commissionTier: "assist",
    referredBy: "Sarah Chen",
    referredByType: "affiliate",
    createdAt: "2024-11-15",
    lastActivity: "2024-12-05",
    notes: "Interested in ISO 9001 certification and lean manufacturing consulting.",
    services: ["ISO 9001", "Lean Manufacturing"],
  },
  {
    id: "2",
    companyName: "TechParts Industries",
    contactName: "Maria Garcia",
    contactEmail: "maria@techparts.com",
    stage: "negotiation",
    value: 85000,
    commissionTier: "co-sell",
    referredBy: "You",
    referredByType: "self",
    createdAt: "2024-10-20",
    lastActivity: "2024-12-08",
    notes: "Large digital transformation project. Multiple phases planned.",
    services: ["Digital Twins", "AI Implementation", "Industry 4.0"],
  },
  {
    id: "3",
    companyName: "Midwest Metals LLC",
    contactName: "Robert Johnson",
    contactEmail: "rjohnson@midwestmetals.com",
    stage: "closed-won",
    value: 32000,
    commissionTier: "referral",
    referredBy: "Michael Rodriguez",
    referredByType: "affiliate",
    createdAt: "2024-09-10",
    lastActivity: "2024-11-28",
    notes: "IATF 16949 certification completed successfully.",
    services: ["IATF 16949"],
  },
  {
    id: "4",
    companyName: "Global Components Inc.",
    contactName: "Lisa Wang",
    contactEmail: "lwang@globalcomp.com",
    stage: "qualified",
    value: 120000,
    commissionTier: "assist",
    referredBy: "You",
    referredByType: "self",
    createdAt: "2024-12-01",
    lastActivity: "2024-12-07",
    notes: "Reshoring project from China. Complex supply chain restructuring.",
    services: ["Reshoring", "Supply Chain", "Quality Management"],
  },
  {
    id: "5",
    companyName: "AutoParts Express",
    contactName: "David Thompson",
    contactEmail: "dthompson@autoparts.com",
    stage: "closed-lost",
    value: 28000,
    commissionTier: "referral",
    referredBy: "Jennifer Park",
    referredByType: "affiliate",
    createdAt: "2024-08-15",
    lastActivity: "2024-10-20",
    notes: "Lost to competitor. Budget constraints cited.",
    services: ["Automation"],
  },
];

export default function DealsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [stageFilter, setStageFilter] = useState<string | null>(null);
  const [isNewDealOpen, setIsNewDealOpen] = useState(false);
  const [selectedDeal, setSelectedDeal] = useState<typeof mockDeals[0] | null>(null);
  const [newDeal, setNewDeal] = useState({
    companyName: "",
    contactName: "",
    contactEmail: "",
    value: "",
    commissionTier: "referral",
    services: "",
    notes: "",
  });

  const filteredDeals = mockDeals.filter((deal) => {
    const matchesSearch =
      deal.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      deal.contactName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStage = !stageFilter || deal.stage === stageFilter;
    return matchesSearch && matchesStage;
  });

  const totalPipelineValue = mockDeals
    .filter((d) => !["closed-won", "closed-lost"].includes(d.stage))
    .reduce((sum, d) => sum + d.value, 0);

  const totalWonValue = mockDeals
    .filter((d) => d.stage === "closed-won")
    .reduce((sum, d) => sum + d.value, 0);

  const totalCommissionEarned = mockDeals
    .filter((d) => d.stage === "closed-won")
    .reduce((sum, d) => {
      const tier = commissionTiers.find((t) => t.level === d.commissionTier);
      return sum + (d.value * (tier?.rate || 0)) / 100;
    }, 0);

  const potentialCommission = mockDeals
    .filter((d) => !["closed-won", "closed-lost"].includes(d.stage))
    .reduce((sum, d) => {
      const tier = commissionTiers.find((t) => t.level === d.commissionTier);
      return sum + (d.value * (tier?.rate || 0)) / 100;
    }, 0);

  const getStageInfo = (stageId: string) => {
    return dealStages.find((s) => s.id === stageId) || dealStages[0];
  };

  const getCommissionTier = (tierId: string) => {
    return commissionTiers.find((t) => t.level === tierId) || commissionTiers[0];
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
    }).format(value);
  };

  const submitNewDeal = () => {
    console.log("Creating new deal:", newDeal);
    setIsNewDealOpen(false);
    setNewDeal({
      companyName: "",
      contactName: "",
      contactEmail: "",
      value: "",
      commissionTier: "referral",
      services: "",
      notes: "",
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Deal Tracking</h1>
          <p className="text-muted-foreground">
            Track referrals and commissions with affiliates
          </p>
        </div>
        <Button onClick={() => setIsNewDealOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          New Referral
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pipeline Value
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalPipelineValue)}</div>
            <p className="text-xs text-muted-foreground">Active deals</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Closed Won
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(totalWonValue)}
            </div>
            <p className="text-xs text-muted-foreground">This year</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Commission Earned
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              {formatCurrency(totalCommissionEarned)}
            </div>
            <p className="text-xs text-muted-foreground">Paid out</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Potential Commission
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {formatCurrency(potentialCommission)}
            </div>
            <p className="text-xs text-muted-foreground">If all close</p>
          </CardContent>
        </Card>
      </div>

      {/* Commission Tiers Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Commission Structure</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            {commissionTiers.map((tier) => (
              <div
                key={tier.level}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div>
                  <p className="font-medium">{tier.name}</p>
                  <p className="text-sm text-muted-foreground">{tier.description}</p>
                </div>
                <Badge variant="secondary" className="text-lg">
                  {tier.rate}%
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search deals..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Select
          value={stageFilter || "all"}
          onValueChange={(v) => setStageFilter(v === "all" ? null : v)}
        >
          <SelectTrigger className="w-[200px]">
            <Filter className="mr-2 h-4 w-4" />
            <SelectValue placeholder="Filter by stage" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Stages</SelectItem>
            {dealStages.map((stage) => (
              <SelectItem key={stage.id} value={stage.id}>
                {stage.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Deals Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Company</TableHead>
                <TableHead>Stage</TableHead>
                <TableHead>Value</TableHead>
                <TableHead>Commission</TableHead>
                <TableHead>Referred By</TableHead>
                <TableHead>Last Activity</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredDeals.map((deal) => {
                const stage = getStageInfo(deal.stage);
                const tier = getCommissionTier(deal.commissionTier);
                const commission = (deal.value * tier.rate) / 100;

                return (
                  <TableRow key={deal.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{deal.companyName}</p>
                        <p className="text-sm text-muted-foreground">{deal.contactName}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="secondary"
                        className={cn("text-white", stage.color)}
                      >
                        {stage.name}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium">
                      {formatCurrency(deal.value)}
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium text-primary">
                          {formatCurrency(commission)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {tier.rate}% - {tier.name}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                          <AvatarFallback className="text-xs">
                            {deal.referredBy.split(" ").map((n) => n[0]).join("")}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm">{deal.referredBy}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(deal.lastActivity).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setSelectedDeal(deal)}>
                            <Eye className="mr-2 h-4 w-4" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Pencil className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive">
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* New Deal Dialog */}
      <Dialog open={isNewDealOpen} onOpenChange={setIsNewDealOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create New Referral</DialogTitle>
            <DialogDescription>
              Add a new referral to track commissions
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="companyName">Company Name</Label>
              <Input
                id="companyName"
                placeholder="Enter company name"
                value={newDeal.companyName}
                onChange={(e) => setNewDeal({ ...newDeal, companyName: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="contactName">Contact Name</Label>
                <Input
                  id="contactName"
                  placeholder="Contact name"
                  value={newDeal.contactName}
                  onChange={(e) => setNewDeal({ ...newDeal, contactName: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contactEmail">Contact Email</Label>
                <Input
                  id="contactEmail"
                  type="email"
                  placeholder="email@company.com"
                  value={newDeal.contactEmail}
                  onChange={(e) => setNewDeal({ ...newDeal, contactEmail: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="value">Estimated Value</Label>
                <Input
                  id="value"
                  type="number"
                  placeholder="$0"
                  value={newDeal.value}
                  onChange={(e) => setNewDeal({ ...newDeal, value: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tier">Commission Tier</Label>
                <Select
                  value={newDeal.commissionTier}
                  onValueChange={(v) => setNewDeal({ ...newDeal, commissionTier: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {commissionTiers.map((tier) => (
                      <SelectItem key={tier.level} value={tier.level}>
                        {tier.name} ({tier.rate}%)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="services">Services Interested In</Label>
              <Input
                id="services"
                placeholder="e.g., ISO 9001, Lean Manufacturing"
                value={newDeal.services}
                onChange={(e) => setNewDeal({ ...newDeal, services: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                placeholder="Additional details about the referral..."
                value={newDeal.notes}
                onChange={(e) => setNewDeal({ ...newDeal, notes: e.target.value })}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsNewDealOpen(false)}>
              Cancel
            </Button>
            <Button onClick={submitNewDeal}>
              <Plus className="mr-2 h-4 w-4" />
              Create Referral
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Deal Details Dialog */}
      <Dialog open={!!selectedDeal} onOpenChange={() => setSelectedDeal(null)}>
        <DialogContent className="max-w-lg">
          {selectedDeal && (
            <>
              <DialogHeader>
                <DialogTitle>{selectedDeal.companyName}</DialogTitle>
                <DialogDescription>
                  Deal details and activity
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground">Contact</Label>
                    <p className="font-medium">{selectedDeal.contactName}</p>
                    <p className="text-sm text-muted-foreground">{selectedDeal.contactEmail}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Stage</Label>
                    <Badge
                      variant="secondary"
                      className={cn("text-white mt-1", getStageInfo(selectedDeal.stage).color)}
                    >
                      {getStageInfo(selectedDeal.stage).name}
                    </Badge>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground">Deal Value</Label>
                    <p className="text-xl font-bold">{formatCurrency(selectedDeal.value)}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Your Commission</Label>
                    <p className="text-xl font-bold text-primary">
                      {formatCurrency(
                        (selectedDeal.value * getCommissionTier(selectedDeal.commissionTier).rate) / 100
                      )}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {getCommissionTier(selectedDeal.commissionTier).rate}% - {getCommissionTier(selectedDeal.commissionTier).name}
                    </p>
                  </div>
                </div>

                <div>
                  <Label className="text-muted-foreground">Services</Label>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {selectedDeal.services.map((service) => (
                      <Badge key={service} variant="outline">
                        {service}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div>
                  <Label className="text-muted-foreground">Notes</Label>
                  <p className="text-sm mt-1">{selectedDeal.notes}</p>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <Label className="text-muted-foreground">Created</Label>
                    <p>{new Date(selectedDeal.createdAt).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Last Activity</Label>
                    <p>{new Date(selectedDeal.lastActivity).toLocaleDateString()}</p>
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setSelectedDeal(null)}>
                  Close
                </Button>
                <Button>
                  <Pencil className="mr-2 h-4 w-4" />
                  Edit Deal
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
