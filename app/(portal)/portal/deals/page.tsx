"use client";

import { useState, useEffect } from "react";
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
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useUserProfile } from "@/contexts/user-profile-context";
import { toast } from "sonner";

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

// Deal interface mapped from ReferralDoc
interface Deal {
  id: string;
  companyName: string;
  contactName: string;
  contactEmail: string;
  stage: string;
  value: number;
  commissionTier: string;
  referredBy: string;
  referredByType: "affiliate" | "self";
  createdAt: string;
  lastActivity: string;
  notes: string;
  services: string[];
}

// Map referral status to deal stage
const statusToStage: Record<string, string> = {
  "submitted": "referral",
  "contacted": "qualified",
  "meeting-scheduled": "qualified",
  "proposal": "proposal",
  "negotiation": "negotiation",
  "won": "closed-won",
  "lost": "closed-lost",
};

export default function DealsPage() {
  const { linkedTeamMember } = useUserProfile();
  const [searchQuery, setSearchQuery] = useState("");
  const [stageFilter, setStageFilter] = useState<string | null>(null);
  const [isNewDealOpen, setIsNewDealOpen] = useState(false);
  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newDeal, setNewDeal] = useState({
    companyName: "",
    contactName: "",
    contactEmail: "",
    value: "",
    commissionTier: "referral",
    services: "",
    notes: "",
  });

  // Fetch deals from Firebase
  const fetchDeals = async () => {
    if (!linkedTeamMember?.id) {
      setIsLoading(false);
      return;
    }

    try {
      // Fetch SVP referrals (deals) where the current user is the referrer
      const response = await fetch(`/api/referrals?affiliateId=${linkedTeamMember.id}&type=given`);
      
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.referrals) {
          // Filter for SVP referrals only (these are the "deals")
          const svpReferrals = data.referrals.filter((r: any) => r.isSvpReferral);
          
          // Transform referrals to deals format
          const transformedDeals: Deal[] = svpReferrals.map((ref: any) => ({
            id: ref.id,
            companyName: ref.prospectCompany || "Unknown Company",
            contactName: ref.prospectName,
            contactEmail: ref.prospectEmail || "",
            stage: statusToStage[ref.status] || "referral",
            value: ref.dealValue || 0,
            commissionTier: ref.commissionTier || "referral",
            referredBy: `${linkedTeamMember.firstName} ${linkedTeamMember.lastName}`,
            referredByType: "self" as const,
            createdAt: ref.createdAt || new Date().toISOString(),
            lastActivity: ref.updatedAt || ref.createdAt || new Date().toISOString(),
            notes: ref.description || "",
            services: ref.svpServiceInterest ? [ref.svpServiceInterest] : [],
          }));
          
          setDeals(transformedDeals);
        }
      }
    } catch (error) {
      console.error("Error fetching deals:", error);
      toast.error("Failed to load deals");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDeals();
  }, [linkedTeamMember?.id]);

  const filteredDeals = deals.filter((deal) => {
    const matchesSearch =
      deal.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      deal.contactName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStage = !stageFilter || deal.stage === stageFilter;
    return matchesSearch && matchesStage;
  });

  const totalPipelineValue = deals
    .filter((d) => !["closed-won", "closed-lost"].includes(d.stage))
    .reduce((sum, d) => sum + d.value, 0);

  const totalWonValue = deals
    .filter((d) => d.stage === "closed-won")
    .reduce((sum, d) => sum + d.value, 0);

  const totalCommissionEarned = deals
    .filter((d) => d.stage === "closed-won")
    .reduce((sum, d) => {
      const tier = commissionTiers.find((t) => t.level === d.commissionTier);
      return sum + (d.value * (tier?.rate || 0)) / 100;
    }, 0);

  const potentialCommission = deals
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

  const submitNewDeal = async () => {
    if (!linkedTeamMember?.id) {
      toast.error("Unable to create deal. Please try again.");
      return;
    }

    if (!newDeal.companyName || !newDeal.contactName) {
      toast.error("Company name and contact name are required.");
      return;
    }

    setIsSubmitting(true);
    try {
      // Create as an SVP referral in Firebase
      const response = await fetch("/api/referrals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          referrerId: linkedTeamMember.id,
          recipientId: "svp", // SVP is the recipient for deals
          prospectName: newDeal.contactName,
          prospectCompany: newDeal.companyName,
          prospectEmail: newDeal.contactEmail,
          description: newDeal.notes || `Referral for ${newDeal.services || "SVP services"}`,
          isSvpReferral: true,
          svpServiceInterest: newDeal.services,
          referralType: "short-term",
          dealValue: parseFloat(newDeal.value) || 0,
          commissionTier: newDeal.commissionTier,
        }),
      });

      if (response.ok) {
        toast.success("Deal created successfully!");
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
        // Refresh deals list
        fetchDeals();
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to create deal");
      }
    } catch (error) {
      console.error("Error creating deal:", error);
      toast.error("Failed to create deal. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

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
              {filteredDeals.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="h-32 text-center">
                    <div className="flex flex-col items-center justify-center text-muted-foreground">
                      <DollarSign className="h-8 w-8 mb-2" />
                      <p className="font-medium">No deals found</p>
                      <p className="text-sm">Create your first SVP referral to start tracking deals</p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
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
            <Button variant="outline" onClick={() => setIsNewDealOpen(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button onClick={submitNewDeal} disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Referral
                </>
              )}
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
