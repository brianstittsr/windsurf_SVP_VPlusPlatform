"use client";

import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  doc,
  updateDoc,
  deleteDoc,
  Timestamp,
} from "firebase/firestore";
import { COLLECTIONS, BookCallLeadDoc } from "@/lib/schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
  DialogHeader,
  DialogTitle,
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
  Phone,
  Mail,
  Building,
  Calendar,
  Clock,
  MoreHorizontal,
  Trash2,
  Eye,
  CheckCircle,
  XCircle,
  Loader2,
  MessageSquare,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

type LeadStatus = "new" | "contacted" | "scheduled" | "completed" | "cancelled";

interface Lead extends Omit<BookCallLeadDoc, "createdAt" | "updatedAt" | "scheduledCallDate" | "completedAt"> {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  scheduledCallDate?: Date;
  completedAt?: Date;
}

const statusColors: Record<LeadStatus, string> = {
  new: "bg-blue-500",
  contacted: "bg-yellow-500",
  scheduled: "bg-purple-500",
  completed: "bg-green-500",
  cancelled: "bg-gray-500",
};

const statusLabels: Record<LeadStatus, string> = {
  new: "New",
  contacted: "Contacted",
  scheduled: "Scheduled",
  completed: "Completed",
  cancelled: "Cancelled",
};

export default function BookCallLeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [notes, setNotes] = useState("");
  const [filterStatus, setFilterStatus] = useState<LeadStatus | "all">("all");

  useEffect(() => {
    if (!db) {
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, COLLECTIONS.BOOK_CALL_LEADS),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const leadsData: Lead[] = snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email,
          phone: data.phone,
          company: data.company,
          jobTitle: data.jobTitle,
          preferredDate: data.preferredDate,
          preferredTime: data.preferredTime,
          timezone: data.timezone,
          message: data.message,
          source: data.source,
          formType: data.formType,
          companySize: data.companySize,
          industry: data.industry,
          serviceInterest: data.serviceInterest,
          newsletterOptIn: data.newsletterOptIn,
          status: data.status,
          assignedTo: data.assignedTo,
          assignedToName: data.assignedToName,
          notes: data.notes,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
          scheduledCallDate: data.scheduledCallDate?.toDate(),
          completedAt: data.completedAt?.toDate(),
        };
      });
      setLeads(leadsData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const updateLeadStatus = async (leadId: string, newStatus: LeadStatus) => {
    if (!db) return;
    setUpdating(true);

    try {
      const updateData: Record<string, unknown> = {
        status: newStatus,
        updatedAt: Timestamp.now(),
      };

      if (newStatus === "completed") {
        updateData.completedAt = Timestamp.now();
      }

      await updateDoc(doc(db, COLLECTIONS.BOOK_CALL_LEADS, leadId), updateData);
      toast.success(`Lead status updated to ${statusLabels[newStatus]}`);
    } catch (error) {
      console.error("Error updating lead:", error);
      toast.error("Failed to update lead status");
    } finally {
      setUpdating(false);
    }
  };

  const updateLeadNotes = async (leadId: string) => {
    if (!db) return;
    setUpdating(true);

    try {
      await updateDoc(doc(db, COLLECTIONS.BOOK_CALL_LEADS, leadId), {
        notes,
        updatedAt: Timestamp.now(),
      });
      toast.success("Notes updated");
    } catch (error) {
      console.error("Error updating notes:", error);
      toast.error("Failed to update notes");
    } finally {
      setUpdating(false);
    }
  };

  const deleteLead = async (leadId: string) => {
    if (!db) return;

    try {
      await deleteDoc(doc(db, COLLECTIONS.BOOK_CALL_LEADS, leadId));
      toast.success("Lead deleted");
      setDetailsOpen(false);
    } catch (error) {
      console.error("Error deleting lead:", error);
      toast.error("Failed to delete lead");
    }
  };

  const openDetails = (lead: Lead) => {
    setSelectedLead(lead);
    setNotes(lead.notes || "");
    setDetailsOpen(true);
  };

  const filteredLeads = filterStatus === "all" 
    ? leads 
    : leads.filter(lead => lead.status === filterStatus);

  const newLeadsCount = leads.filter(l => l.status === "new").length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Book Call Leads</h1>
          <p className="text-muted-foreground">
            Manage incoming call booking requests from the contact page
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Badge variant="secondary" className="text-lg px-4 py-2">
            {newLeadsCount} New
          </Badge>
          <Select value={filterStatus} onValueChange={(v) => setFilterStatus(v as LeadStatus | "all")}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Leads</SelectItem>
              <SelectItem value="new">New</SelectItem>
              <SelectItem value="contacted">Contacted</SelectItem>
              <SelectItem value="scheduled">Scheduled</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lead Queue ({filteredLeads.length})</CardTitle>
          <CardDescription>
            Click on a lead to view details and update status
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredLeads.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Phone className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No leads found</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Company</TableHead>
                  <TableHead>Preferred Time</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Submitted</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLeads.map((lead) => (
                  <TableRow 
                    key={lead.id} 
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => openDetails(lead)}
                  >
                    <TableCell className="font-medium">
                      {lead.firstName} {lead.lastName}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <span className="text-sm">{lead.email}</span>
                        {lead.phone && (
                          <span className="text-xs text-muted-foreground">{lead.phone}</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {lead.formType === "assessment" ? "Assessment" : "Call"}
                      </Badge>
                    </TableCell>
                    <TableCell>{lead.company || "-"}</TableCell>
                    <TableCell>
                      {lead.preferredDate && (
                        <div className="flex flex-col gap-1">
                          <span className="text-sm">{lead.preferredDate}</span>
                          {lead.preferredTime && (
                            <span className="text-xs text-muted-foreground capitalize">
                              {lead.preferredTime}
                            </span>
                          )}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge className={statusColors[lead.status as LeadStatus]}>
                        {statusLabels[lead.status as LeadStatus]}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {format(lead.createdAt, "MMM d, yyyy")}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); openDetails(lead); }}>
                            <Eye className="mr-2 h-4 w-4" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); updateLeadStatus(lead.id, "contacted"); }}>
                            <Phone className="mr-2 h-4 w-4" />
                            Mark Contacted
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); updateLeadStatus(lead.id, "scheduled"); }}>
                            <Calendar className="mr-2 h-4 w-4" />
                            Mark Scheduled
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); updateLeadStatus(lead.id, "completed"); }}>
                            <CheckCircle className="mr-2 h-4 w-4" />
                            Mark Completed
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={(e) => { e.stopPropagation(); deleteLead(lead.id); }}
                            className="text-destructive"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
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

      {/* Lead Details Dialog */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Lead Details</DialogTitle>
            <DialogDescription>
              View and manage this lead&apos;s information
            </DialogDescription>
          </DialogHeader>
          {selectedLead && (
            <div className="space-y-6">
              {/* Contact Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold mb-2">Contact Information</h4>
                  <div className="space-y-2 text-sm">
                    <p className="font-medium text-lg">
                      {selectedLead.firstName} {selectedLead.lastName}
                    </p>
                    <p className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <a href={`mailto:${selectedLead.email}`} className="text-primary hover:underline">
                        {selectedLead.email}
                      </a>
                    </p>
                    {selectedLead.phone && (
                      <p className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <a href={`tel:${selectedLead.phone}`} className="text-primary hover:underline">
                          {selectedLead.phone}
                        </a>
                      </p>
                    )}
                    {selectedLead.company && (
                      <p className="flex items-center gap-2">
                        <Building className="h-4 w-4 text-muted-foreground" />
                        {selectedLead.company}
                      </p>
                    )}
                  </div>
                </div>
                <div>
                  {selectedLead.formType === "assessment" && (
                    <>
                      <h4 className="font-semibold mb-2">Assessment Details</h4>
                      <div className="space-y-2 text-sm mb-4">
                        {selectedLead.serviceInterest && <p>Service: {selectedLead.serviceInterest}</p>}
                        {selectedLead.companySize && <p>Company size: {selectedLead.companySize}</p>}
                        {selectedLead.industry && <p>Industry: {selectedLead.industry}</p>}
                        {selectedLead.newsletterOptIn && (
                          <p className="text-muted-foreground">Subscribed to newsletter</p>
                        )}
                      </div>
                    </>
                  )}
                  <h4 className="font-semibold mb-2">Scheduling Preferences</h4>
                  <div className="space-y-2 text-sm">
                    {selectedLead.preferredDate && (
                      <p className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        {selectedLead.preferredDate}
                      </p>
                    )}
                    {selectedLead.preferredTime && (
                      <p className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span className="capitalize">{selectedLead.preferredTime}</span>
                      </p>
                    )}
                    <p className="text-muted-foreground">
                      Submitted: {format(selectedLead.createdAt, "PPpp")}
                    </p>
                  </div>
                </div>
              </div>

              {/* Message */}
              {selectedLead.message && (
                <div>
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <MessageSquare className="h-4 w-4" />
                    Message
                  </h4>
                  <p className="text-sm bg-muted p-3 rounded-md">
                    {selectedLead.message}
                  </p>
                </div>
              )}

              {/* Status Update */}
              <div>
                <h4 className="font-semibold mb-2">Update Status</h4>
                <div className="flex gap-2 flex-wrap">
                  {(["new", "contacted", "scheduled", "completed", "cancelled"] as LeadStatus[]).map((status) => (
                    <Button
                      key={status}
                      variant={selectedLead.status === status ? "default" : "outline"}
                      size="sm"
                      onClick={() => updateLeadStatus(selectedLead.id, status)}
                      disabled={updating}
                    >
                      {statusLabels[status]}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Notes */}
              <div>
                <h4 className="font-semibold mb-2">Notes</h4>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add notes about this lead..."
                  rows={3}
                />
                <Button
                  className="mt-2"
                  size="sm"
                  onClick={() => updateLeadNotes(selectedLead.id)}
                  disabled={updating}
                >
                  {updating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Save Notes
                </Button>
              </div>

              {/* Actions */}
              <div className="flex justify-between pt-4 border-t">
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => deleteLead(selectedLead.id)}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Lead
                </Button>
                <Button variant="outline" onClick={() => setDetailsOpen(false)}>
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
