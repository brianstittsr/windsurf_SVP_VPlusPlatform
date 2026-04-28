"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  MapPin,
  Search,
  Loader2,
  ExternalLink,
  Plus,
  Filter,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Submission {
  id: string;
  title: string;
  propertyName: string;
  submitterName: string;
  submitterEmail: string;
  city: string;
  state: string;
  status: string;
  createdAt: string;
}

const STATUS_OPTIONS = ["All", "Submitted", "Under Review", "Approved", "Rejected", "Archived"];

export default function ZenthiumReferralsPage() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  useEffect(() => {
    fetchSubmissions();
  }, []);

  const fetchSubmissions = async () => {
    try {
      const res = await fetch("/api/zenthium/location-submissions");
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setSubmissions(data.submissions || []);
    } catch (error) {
      console.error("Fetch error:", error);
      toast.error("Failed to load submissions");
    } finally {
      setIsLoading(false);
    }
  };

  const filteredSubmissions = submissions.filter((sub) => {
    const matchesSearch =
      sub.title?.toLowerCase().includes(search.toLowerCase()) ||
      sub.propertyName?.toLowerCase().includes(search.toLowerCase()) ||
      sub.submitterName?.toLowerCase().includes(search.toLowerCase()) ||
      sub.city?.toLowerCase().includes(search.toLowerCase());
    
    const matchesStatus = statusFilter === "All" || sub.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      Submitted: "bg-blue-100 text-blue-800 border-blue-200",
      "Under Review": "bg-amber-100 text-amber-800 border-amber-200",
      Approved: "bg-green-100 text-green-800 border-green-200",
      Rejected: "bg-red-100 text-red-800 border-red-200",
      Archived: "bg-gray-100 text-gray-800 border-gray-200",
    };
    return variants[status] || "bg-gray-100 text-gray-800 border-gray-200";
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "—";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <MapPin className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Zenthium Location Submissions</h1>
              <p className="text-muted-foreground text-sm">
                Manage and review data center location submissions
              </p>
            </div>
          </div>
          <Button asChild>
            <Link href="/zenthium/submit" target="_blank">
              <Plus className="h-4 w-4 mr-1" />
              New Submission
            </Link>
          </Button>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search submissions..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((opt) => (
                    <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Submissions Table */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Submissions ({filteredSubmissions.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : filteredSubmissions.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <MapPin className="h-12 w-12 mx-auto mb-3 opacity-20" />
                <p>No submissions found</p>
                {search && (
                  <p className="text-sm mt-1">Try adjusting your search or filters</p>
                )}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Property</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Submitter</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Submitted</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSubmissions.map((sub) => (
                    <TableRow key={sub.id}>
                      <TableCell>
                        <div className="font-medium">{sub.propertyName || "—"}</div>
                        <div className="text-sm text-muted-foreground">{sub.title || "—"}</div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {sub.city || "—"}, {sub.state || "—"}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">{sub.submitterName || "—"}</div>
                        <div className="text-sm text-muted-foreground">{sub.submitterEmail || "—"}</div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusBadge(sub.status)} variant="outline">
                          {sub.status || "Submitted"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">
                        {formatDate(sub.createdAt)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={`/portal/admin/zenthium-referrals/submissions/${sub.id}`}>
                            <ExternalLink className="h-4 w-4 mr-1" />
                            View
                          </Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
