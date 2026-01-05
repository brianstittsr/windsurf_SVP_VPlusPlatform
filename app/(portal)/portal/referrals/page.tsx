"use client";

import { useState, useEffect } from "react";
import { useUserProfile } from "@/contexts/user-profile-context";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ArrowUpRight,
  ArrowDownLeft,
  Plus,
  DollarSign,
  TrendingUp,
  Users,
  CheckCircle,
  Clock,
  XCircle,
  Building2,
  Mail,
  Phone,
  Loader2,
} from "lucide-react";

interface Referral {
  id: string;
  referrerId: string;
  recipientId: string;
  direction: "given" | "received";
  referralType: string;
  prospectName: string;
  prospectCompany?: string;
  prospectEmail?: string;
  prospectPhone?: string;
  description: string;
  whyGoodFit?: string;
  isSvpReferral: boolean;
  status: string;
  dealValue?: number;
  dealClosedDate?: string;
  createdAt: string;
}

const statusConfig: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  submitted: { label: "Submitted", color: "bg-blue-100 text-blue-700", icon: Clock },
  contacted: { label: "Contacted", color: "bg-yellow-100 text-yellow-700", icon: Clock },
  "meeting-scheduled": { label: "Meeting Scheduled", color: "bg-purple-100 text-purple-700", icon: Clock },
  proposal: { label: "Proposal", color: "bg-indigo-100 text-indigo-700", icon: Clock },
  negotiation: { label: "Negotiation", color: "bg-orange-100 text-orange-700", icon: Clock },
  won: { label: "Won", color: "bg-green-100 text-green-700", icon: CheckCircle },
  lost: { label: "Lost", color: "bg-red-100 text-red-700", icon: XCircle },
};

export default function ReferralsPage() {
  const { linkedTeamMember } = useUserProfile();
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isReportDealOpen, setIsReportDealOpen] = useState(false);
  const [selectedReferral, setSelectedReferral] = useState<Referral | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state for new referral
  const [newReferral, setNewReferral] = useState({
    recipientId: "",
    prospectName: "",
    prospectCompany: "",
    prospectEmail: "",
    prospectPhone: "",
    description: "",
    whyGoodFit: "",
    referralType: "short-term",
    isSvpReferral: false,
  });

  // Form state for reporting deal
  const [dealReport, setDealReport] = useState({
    status: "won",
    dealValue: "",
    dealClosedDate: new Date().toISOString().split("T")[0],
    lostReason: "",
  });

  useEffect(() => {
    if (linkedTeamMember) {
      fetchReferrals();
    }
  }, [linkedTeamMember]);

  const fetchReferrals = async () => {
    if (!linkedTeamMember) return;

    setIsLoading(true);
    try {
      const response = await fetch(`/api/referrals?affiliateId=${linkedTeamMember.id}`);
      if (response.ok) {
        const data = await response.json();
        setReferrals(data.referrals || []);
      }
    } catch (error) {
      console.error("Failed to fetch referrals:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateReferral = async () => {
    if (!linkedTeamMember || !newReferral.prospectName || !newReferral.description) return;

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/referrals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          referrerId: linkedTeamMember.id,
          ...newReferral,
        }),
      });

      if (response.ok) {
        setIsCreateOpen(false);
        setNewReferral({
          recipientId: "",
          prospectName: "",
          prospectCompany: "",
          prospectEmail: "",
          prospectPhone: "",
          description: "",
          whyGoodFit: "",
          referralType: "short-term",
          isSvpReferral: false,
        });
        fetchReferrals();
      }
    } catch (error) {
      console.error("Failed to create referral:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReportDeal = async () => {
    if (!selectedReferral) return;

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/referrals", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          referralId: selectedReferral.id,
          status: dealReport.status,
          dealValue: dealReport.status === "won" ? parseFloat(dealReport.dealValue) || 0 : undefined,
          dealClosedDate: dealReport.dealClosedDate,
          lostReason: dealReport.status === "lost" ? dealReport.lostReason : undefined,
        }),
      });

      if (response.ok) {
        setIsReportDealOpen(false);
        setSelectedReferral(null);
        setDealReport({
          status: "won",
          dealValue: "",
          dealClosedDate: new Date().toISOString().split("T")[0],
          lostReason: "",
        });
        fetchReferrals();
      }
    } catch (error) {
      console.error("Failed to report deal:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateStatus = async (referralId: string, newStatus: string) => {
    try {
      await fetch("/api/referrals", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ referralId, status: newStatus }),
      });
      fetchReferrals();
    } catch (error) {
      console.error("Failed to update status:", error);
    }
  };

  const filteredReferrals = referrals.filter((r) => {
    if (activeTab === "given") return r.direction === "given";
    if (activeTab === "received") return r.direction === "received";
    if (activeTab === "svp") return r.isSvpReferral;
    return true;
  });

  // Calculate metrics
  const givenReferrals = referrals.filter((r) => r.direction === "given");
  const receivedReferrals = referrals.filter((r) => r.direction === "received");
  const wonDeals = referrals.filter((r) => r.status === "won");
  const totalRevenue = wonDeals.reduce((sum, r) => sum + (r.dealValue || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Referral Tracking</h1>
          <p className="text-muted-foreground">
            Track referrals given and received, and report deal outcomes
          </p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          New Referral
        </Button>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-100">
                <ArrowUpRight className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Referrals Given</p>
                <p className="text-2xl font-bold">{givenReferrals.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-100">
                <ArrowDownLeft className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Referrals Received</p>
                <p className="text-2xl font-bold">{receivedReferrals.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-100">
                <CheckCircle className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Deals Closed</p>
                <p className="text-2xl font-bold">{wonDeals.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-100">
                <DollarSign className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Revenue</p>
                <p className="text-2xl font-bold">${totalRevenue.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Referrals Table */}
      <Card>
        <CardHeader>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="all">All ({referrals.length})</TabsTrigger>
              <TabsTrigger value="given">Given ({givenReferrals.length})</TabsTrigger>
              <TabsTrigger value="received">Received ({receivedReferrals.length})</TabsTrigger>
              <TabsTrigger value="svp">SVP Referrals</TabsTrigger>
            </TabsList>
          </Tabs>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredReferrals.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-medium mb-2">No Referrals Yet</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Start building your referral network by giving referrals to other affiliates.
              </p>
              <Button onClick={() => setIsCreateOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Referral
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Direction</TableHead>
                  <TableHead>Prospect</TableHead>
                  <TableHead>Company</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Deal Value</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredReferrals.map((referral) => {
                  const StatusIcon = statusConfig[referral.status]?.icon || Clock;
                  return (
                    <TableRow key={referral.id}>
                      <TableCell>
                        <Badge variant={referral.direction === "given" ? "default" : "secondary"}>
                          {referral.direction === "given" ? (
                            <ArrowUpRight className="h-3 w-3 mr-1" />
                          ) : (
                            <ArrowDownLeft className="h-3 w-3 mr-1" />
                          )}
                          {referral.direction}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium">{referral.prospectName}</TableCell>
                      <TableCell>{referral.prospectCompany || "-"}</TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {referral.referralType}
                          {referral.isSvpReferral && " (SVP)"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={statusConfig[referral.status]?.color}>
                          <StatusIcon className="h-3 w-3 mr-1" />
                          {statusConfig[referral.status]?.label || referral.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {referral.dealValue ? `$${referral.dealValue.toLocaleString()}` : "-"}
                      </TableCell>
                      <TableCell>
                        {new Date(referral.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        {referral.direction === "received" && referral.status !== "won" && referral.status !== "lost" && (
                          <div className="flex gap-2">
                            <Select
                              value={referral.status}
                              onValueChange={(value) => handleUpdateStatus(referral.id, value)}
                            >
                              <SelectTrigger className="w-32 h-8">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="submitted">Submitted</SelectItem>
                                <SelectItem value="contacted">Contacted</SelectItem>
                                <SelectItem value="meeting-scheduled">Meeting</SelectItem>
                                <SelectItem value="proposal">Proposal</SelectItem>
                                <SelectItem value="negotiation">Negotiation</SelectItem>
                              </SelectContent>
                            </Select>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSelectedReferral(referral);
                                setIsReportDealOpen(true);
                              }}
                            >
                              <DollarSign className="h-3 w-3 mr-1" />
                              Report
                            </Button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Create Referral Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Create New Referral</DialogTitle>
            <DialogDescription>
              Give a referral to another affiliate in the network
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="prospectName">Prospect Name *</Label>
                <Input
                  id="prospectName"
                  value={newReferral.prospectName}
                  onChange={(e) => setNewReferral({ ...newReferral, prospectName: e.target.value })}
                  placeholder="John Smith"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="prospectCompany">Company</Label>
                <Input
                  id="prospectCompany"
                  value={newReferral.prospectCompany}
                  onChange={(e) => setNewReferral({ ...newReferral, prospectCompany: e.target.value })}
                  placeholder="Acme Corp"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="prospectEmail">Email</Label>
                <Input
                  id="prospectEmail"
                  type="email"
                  value={newReferral.prospectEmail}
                  onChange={(e) => setNewReferral({ ...newReferral, prospectEmail: e.target.value })}
                  placeholder="john@acme.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="prospectPhone">Phone</Label>
                <Input
                  id="prospectPhone"
                  value={newReferral.prospectPhone}
                  onChange={(e) => setNewReferral({ ...newReferral, prospectPhone: e.target.value })}
                  placeholder="(555) 123-4567"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                value={newReferral.description}
                onChange={(e) => setNewReferral({ ...newReferral, description: e.target.value })}
                placeholder="Describe the referral opportunity..."
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="whyGoodFit">Why This Is a Good Fit</Label>
              <Textarea
                id="whyGoodFit"
                value={newReferral.whyGoodFit}
                onChange={(e) => setNewReferral({ ...newReferral, whyGoodFit: e.target.value })}
                placeholder="Explain why this prospect would be a good fit..."
                rows={2}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Referral Type</Label>
                <Select
                  value={newReferral.referralType}
                  onValueChange={(value) => setNewReferral({ ...newReferral, referralType: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="short-term">Short-term</SelectItem>
                    <SelectItem value="long-term">Long-term</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>SVP Referral?</Label>
                <Select
                  value={newReferral.isSvpReferral ? "yes" : "no"}
                  onValueChange={(value) => setNewReferral({ ...newReferral, isSvpReferral: value === "yes" })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="no">No</SelectItem>
                    <SelectItem value="yes">Yes - For SVP Services</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateReferral} disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Create Referral
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Report Deal Dialog */}
      <Dialog open={isReportDealOpen} onOpenChange={setIsReportDealOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Report Deal Outcome</DialogTitle>
            <DialogDescription>
              Report the outcome of the referral for {selectedReferral?.prospectName}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Outcome</Label>
              <Select
                value={dealReport.status}
                onValueChange={(value) => setDealReport({ ...dealReport, status: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="won">Won - Deal Closed</SelectItem>
                  <SelectItem value="lost">Lost - Did Not Close</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {dealReport.status === "won" && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="dealValue">Deal Value ($)</Label>
                  <Input
                    id="dealValue"
                    type="number"
                    value={dealReport.dealValue}
                    onChange={(e) => setDealReport({ ...dealReport, dealValue: e.target.value })}
                    placeholder="10000"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dealClosedDate">Close Date</Label>
                  <Input
                    id="dealClosedDate"
                    type="date"
                    value={dealReport.dealClosedDate}
                    onChange={(e) => setDealReport({ ...dealReport, dealClosedDate: e.target.value })}
                  />
                </div>
              </>
            )}

            {dealReport.status === "lost" && (
              <div className="space-y-2">
                <Label htmlFor="lostReason">Reason for Loss</Label>
                <Textarea
                  id="lostReason"
                  value={dealReport.lostReason}
                  onChange={(e) => setDealReport({ ...dealReport, lostReason: e.target.value })}
                  placeholder="Why did this deal not close?"
                  rows={3}
                />
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsReportDealOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleReportDeal} disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Report Outcome
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
