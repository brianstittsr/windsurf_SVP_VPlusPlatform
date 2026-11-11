"use client";

import { useEffect, useState } from "react";
import { collection, getDocs, orderBy, query, updateDoc, doc } from "firebase/firestore";
import { useRequireAuth } from "@/lib/hooks/use-auth";
import { db } from "@/lib/firebase";
import { COLLECTIONS } from "@/lib/schema";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Inbox, RefreshCw } from "lucide-react";

interface LeadDoc {
  id: string;
  formType: "contact" | "cogniverai" | "careers";
  name: string;
  email: string;
  phone?: string;
  company?: string;
  role?: string;
  topic?: string;
  interest?: string;
  location?: string;
  linkedin?: string;
  expertise?: string;
  years?: string;
  certifications?: string;
  message?: string;
  status: "new" | "contacted" | "closed";
  createdAt?: { toDate?: () => Date };
}

const FORM_LABELS: Record<string, string> = {
  contact: "V+ Contact",
  cogniverai: "Cogniverai",
  careers: "Careers",
};

function formatDate(createdAt: LeadDoc["createdAt"]): string {
  const d = createdAt?.toDate?.();
  return d ? d.toLocaleString() : "—";
}

function leadDetails(lead: LeadDoc): string {
  return [
    lead.topic && `Topic: ${lead.topic}`,
    lead.interest && `Interest: ${lead.interest}`,
    lead.expertise && `Expertise: ${lead.expertise}`,
    lead.years && `Exp: ${lead.years}`,
    lead.role && `Role: ${lead.role}`,
    lead.location && `Location: ${lead.location}`,
    lead.certifications && `Certs: ${lead.certifications}`,
  ]
    .filter(Boolean)
    .join(" · ");
}

export default function AdminLeadsPage() {
  const { isLoading, isAuthenticated } = useRequireAuth(["admin"]);
  const [leads, setLeads] = useState<LeadDoc[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    if (!db) return;
    setLoading(true);
    try {
      const snap = await getDocs(
        query(collection(db, COLLECTIONS.BOOK_CALL_LEADS), orderBy("createdAt", "desc"))
      );
      setLeads(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<LeadDoc, "id">) })));
    } catch (error) {
      console.error("[leads] failed to load:", error);
      toast.error("Failed to load leads");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isAuthenticated || !db) return;
    void load();
  }, [isAuthenticated]);

  const setStatus = async (lead: LeadDoc, status: LeadDoc["status"]) => {
    if (!db) return;
    try {
      await updateDoc(doc(db, COLLECTIONS.BOOK_CALL_LEADS, lead.id), { status });
      setLeads((prev) => prev.map((l) => (l.id === lead.id ? { ...l, status } : l)));
    } catch {
      toast.error("Failed to update status");
    }
  };

  if (isLoading || !isAuthenticated) {
    return <div className="p-6"><Skeleton className="h-64 w-full" /></div>;
  }

  const newCount = leads.filter((l) => l.status === "new").length;

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold">Leads</h1>
          <p className="text-muted-foreground">
            Website form submissions — V+ contact, Cogniverai, and careers.{" "}
            {newCount > 0 && <span className="font-medium text-foreground">{newCount} new.</span>}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => void load()} disabled={loading}>
          <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Company</TableHead>
                <TableHead>Details</TableHead>
                <TableHead>Message</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading && (
                <TableRow>
                  <TableCell colSpan={8}>
                    <Skeleton className="h-24 w-full" />
                  </TableCell>
                </TableRow>
              )}
              {!loading && leads.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="py-12 text-center text-muted-foreground">
                    <Inbox className="mx-auto mb-2 h-8 w-8 opacity-40" />
                    No leads yet.
                  </TableCell>
                </TableRow>
              )}
              {!loading &&
                leads.map((lead) => (
                  <TableRow key={lead.id}>
                    <TableCell className="whitespace-nowrap text-xs">
                      {formatDate(lead.createdAt)}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{FORM_LABELS[lead.formType] ?? lead.formType}</Badge>
                    </TableCell>
                    <TableCell className="font-medium">{lead.name}</TableCell>
                    <TableCell>
                      <a className="text-primary hover:underline" href={`mailto:${lead.email}`}>
                        {lead.email}
                      </a>
                      {lead.phone && <div className="text-xs text-muted-foreground">{lead.phone}</div>}
                      {lead.linkedin && (
                        <a className="block text-xs text-primary hover:underline" href={lead.linkedin} target="_blank" rel="noreferrer">
                          LinkedIn
                        </a>
                      )}
                    </TableCell>
                    <TableCell>{lead.company || "—"}</TableCell>
                    <TableCell className="max-w-[220px] text-xs text-muted-foreground">
                      {leadDetails(lead) || "—"}
                    </TableCell>
                    <TableCell className="max-w-[280px] truncate text-sm" title={lead.message}>
                      {lead.message || "—"}
                    </TableCell>
                    <TableCell>
                      <Select
                        value={lead.status}
                        onValueChange={(v) => void setStatus(lead, v as LeadDoc["status"])}
                      >
                        <SelectTrigger className="h-8 w-[110px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="new">New</SelectItem>
                          <SelectItem value="contacted">Contacted</SelectItem>
                          <SelectItem value="closed">Closed</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
