"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Loader2, Download, Printer, MapPin, Zap, Building2, User, Calendar, DollarSign, FileText } from "lucide-react";

interface Submission {
  id: string;
  title: string;
  propertyName: string;
  status: string;
  submitter: {
    name: string;
    email: string;
    phone: string;
    company: string;
  };
  location: {
    address: string;
    city: string;
    state: string;
    zip: string;
    coordinates: string;
  };
  propertyDetails: {
    type: string;
    acreage: number;
    squareFootage: number;
    zoning: string;
  };
  infrastructure: {
    powerMW: number;
    powerType: string;
    fiberAvailable: boolean;
    fiberProviders: string;
    waterAvailable: boolean;
    ceilingHeight: number;
  };
  ownership: {
    type: string;
    askingPrice: string;
    leaseRate: string;
  };
  timeline: string;
  environmental: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

interface ReportStats {
  totalSubmissions: number;
  byStatus: Record<string, number>;
  byState: Record<string, number>;
  byPropertyType: Record<string, number>;
  totalAcreage: number;
  totalPowerMW: number;
  dateRange: {
    earliest: string;
    latest: string;
  };
}

interface ReportData {
  generatedAt: string;
  statistics: ReportStats;
  submissions: Submission[];
}

export default function ZenthiumReportPage() {
  const [report, setReport] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchReport();
  }, []);

  const fetchReport = async () => {
    try {
      const res = await fetch("/api/zenthium/report");
      if (!res.ok) throw new Error("Failed to fetch report");
      const data = await res.json();
      setReport(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadJSON = () => {
    if (!report) return;
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `zenthium-report-${new Date().toISOString().split("T")[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDownloadMarkdown = () => {
    // Direct browser download from API
    const a = document.createElement("a");
    a.href = "/api/zenthium/report/markdown";
    a.download = `zenthium-report-${new Date().toISOString().split("T")[0]}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-red-500 mb-4">Error loading report: {error}</p>
          <Button onClick={fetchReport}>Retry</Button>
        </div>
      </div>
    );
  }

  if (!report) return null;

  const { statistics, submissions } = report;

  return (
    <div className="min-h-screen bg-background p-8 print:p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-start mb-8 print:mb-4">
          <div>
            <h1 className="text-3xl font-bold print:text-2xl">Zenthium Data Center Submissions Report</h1>
            <p className="text-muted-foreground mt-2">
              Generated: {new Date(report.generatedAt).toLocaleString()}
            </p>
          </div>
          <div className="flex gap-2 print:hidden">
            <Button onClick={handlePrint} variant="outline">
              <Printer className="h-4 w-4 mr-2" />
              Print
            </Button>
            <Button onClick={handleDownloadMarkdown} variant="outline">
              <FileText className="h-4 w-4 mr-2" />
              Download Markdown
            </Button>
            <Button onClick={handleDownloadJSON}>
              <Download className="h-4 w-4 mr-2" />
              Download JSON
            </Button>
          </div>
        </div>

        {/* Statistics Overview */}
        <Card className="mb-8 print:mb-4 print:border print:border-gray-300">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Summary Statistics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-muted p-4 rounded-lg">
                <div className="text-2xl font-bold text-primary">{statistics.totalSubmissions}</div>
                <div className="text-sm text-muted-foreground">Total Submissions</div>
              </div>
              <div className="bg-muted p-4 rounded-lg">
                <div className="text-2xl font-bold text-primary">{statistics.totalAcreage.toLocaleString()}</div>
                <div className="text-sm text-muted-foreground">Total Acres</div>
              </div>
              <div className="bg-muted p-4 rounded-lg">
                <div className="text-2xl font-bold text-primary">{statistics.totalPowerMW.toLocaleString()}</div>
                <div className="text-sm text-muted-foreground">Total Power (MW)</div>
              </div>
              <div className="bg-muted p-4 rounded-lg">
                <div className="text-2xl font-bold text-primary">
                  {Object.keys(statistics.byState).length}
                </div>
                <div className="text-sm text-muted-foreground">States Covered</div>
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-6 mt-6">
              {/* Status Breakdown */}
              <div>
                <h4 className="font-semibold mb-3">By Status</h4>
                <div className="space-y-2">
                  {Object.entries(statistics.byStatus).map(([status, count]) => (
                    <div key={status} className="flex justify-between items-center">
                      <span className="text-sm">{status}</span>
                      <Badge variant="secondary">{count}</Badge>
                    </div>
                  ))}
                </div>
              </div>

              {/* State Breakdown */}
              <div>
                <h4 className="font-semibold mb-3">By State</h4>
                <div className="space-y-2">
                  {Object.entries(statistics.byState)
                    .sort(([,a], [,b]) => b - a)
                    .slice(0, 10)
                    .map(([state, count]) => (
                    <div key={state} className="flex justify-between items-center">
                      <span className="text-sm">{state}</span>
                      <Badge variant="secondary">{count}</Badge>
                    </div>
                  ))}
                </div>
              </div>

              {/* Property Type Breakdown */}
              <div>
                <h4 className="font-semibold mb-3">By Property Type</h4>
                <div className="space-y-2">
                  {Object.entries(statistics.byPropertyType).map(([type, count]) => (
                    <div key={type} className="flex justify-between items-center">
                      <span className="text-sm capitalize">{type.replace(/_/g, " ")}</span>
                      <Badge variant="secondary">{count}</Badge>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Separator className="my-8 print:my-4" />

        {/* Detailed Submissions */}
        <div>
          <h2 className="text-2xl font-bold mb-6 print:text-xl">Detailed Submissions</h2>
          <div className="space-y-6">
            {submissions.map((sub, index) => (
              <Card key={sub.id} className="print:border print:border-gray-300 print:mb-4 print:break-inside-avoid">
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <span className="text-muted-foreground">#{index + 1}</span>
                        {sub.title}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">
                        ID: {sub.id}
                      </p>
                    </div>
                    <Badge>{sub.status}</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {/* Submitter Info */}
                    <div>
                      <h4 className="font-semibold mb-2 flex items-center gap-2">
                        <User className="h-4 w-4" />
                        Submitter
                      </h4>
                      <div className="text-sm space-y-1">
                        <p><strong>Name:</strong> {sub.submitter.name}</p>
                        <p><strong>Email:</strong> {sub.submitter.email}</p>
                        <p><strong>Phone:</strong> {sub.submitter.phone}</p>
                        <p><strong>Company:</strong> {sub.submitter.company}</p>
                      </div>
                    </div>

                    {/* Location */}
                    <div>
                      <h4 className="font-semibold mb-2 flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        Location
                      </h4>
                      <div className="text-sm space-y-1">
                        <p>{sub.location.address}</p>
                        <p>{sub.location.city}, {sub.location.state} {sub.location.zip}</p>
                        {sub.location.coordinates && (
                          <p className="text-muted-foreground">{sub.location.coordinates}</p>
                        )}
                      </div>
                    </div>

                    {/* Property Details */}
                    <div>
                      <h4 className="font-semibold mb-2 flex items-center gap-2">
                        <Building2 className="h-4 w-4" />
                        Property Details
                      </h4>
                      <div className="text-sm space-y-1">
                        <p><strong>Type:</strong> {sub.propertyDetails.type || "N/A"}</p>
                        {sub.propertyDetails.acreage && (
                          <p><strong>Acreage:</strong> {sub.propertyDetails.acreage} acres</p>
                        )}
                        {sub.propertyDetails.squareFootage && (
                          <p><strong>Building:</strong> {sub.propertyDetails.squareFootage.toLocaleString()} sq ft</p>
                        )}
                        <p><strong>Zoning:</strong> {sub.propertyDetails.zoning || "N/A"}</p>
                      </div>
                    </div>

                    {/* Infrastructure */}
                    <div>
                      <h4 className="font-semibold mb-2 flex items-center gap-2">
                        <Zap className="h-4 w-4" />
                        Infrastructure
                      </h4>
                      <div className="text-sm space-y-1">
                        {sub.infrastructure.powerMW && (
                          <p><strong>Power:</strong> {sub.infrastructure.powerMW} MW</p>
                        )}
                        {sub.infrastructure.powerType && (
                          <p><strong>Type:</strong> {sub.infrastructure.powerType}</p>
                        )}
                        <p><strong>Fiber:</strong> {sub.infrastructure.fiberAvailable ? "Available" : "Not Available"}</p>
                        {sub.infrastructure.fiberProviders && (
                          <p><strong>Providers:</strong> {sub.infrastructure.fiberProviders}</p>
                        )}
                        <p><strong>Water:</strong> {sub.infrastructure.waterAvailable ? "Available" : "Not Available"}</p>
                        {sub.infrastructure.ceilingHeight && (
                          <p><strong>Ceiling:</strong> {sub.infrastructure.ceilingHeight} ft</p>
                        )}
                      </div>
                    </div>

                    {/* Ownership */}
                    <div>
                      <h4 className="font-semibold mb-2 flex items-center gap-2">
                        <DollarSign className="h-4 w-4" />
                        Ownership
                      </h4>
                      <div className="text-sm space-y-1">
                        <p><strong>Type:</strong> {sub.ownership.type || "N/A"}</p>
                        {sub.ownership.askingPrice && (
                          <p><strong>Asking Price:</strong> {sub.ownership.askingPrice}</p>
                        )}
                        {sub.ownership.leaseRate && (
                          <p><strong>Lease Rate:</strong> {sub.ownership.leaseRate}</p>
                        )}
                      </div>
                    </div>

                    {/* Timeline */}
                    <div>
                      <h4 className="font-semibold mb-2 flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        Timeline
                      </h4>
                      <div className="text-sm space-y-1">
                        {sub.timeline && <p><strong>Availability:</strong> {sub.timeline}</p>}
                        {sub.environmental && <p><strong>Environmental:</strong> {sub.environmental}</p>}
                        <p><strong>Submitted:</strong> {new Date(sub.createdAt).toLocaleDateString()}</p>
                        <p><strong>Updated:</strong> {new Date(sub.updatedAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                  </div>

                  {/* Notes */}
                  {sub.notes && (
                    <div className="mt-4 pt-4 border-t">
                      <h4 className="font-semibold mb-2">Notes</h4>
                      <p className="text-sm text-muted-foreground">{sub.notes}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-12 pt-8 border-t text-center text-sm text-muted-foreground print:mt-8">
          <p>Strategic Value Plus, Inc. - Zenthium Data Center Division</p>
          <p>Report generated on {new Date(report.generatedAt).toLocaleString()}</p>
        </div>
      </div>
    </div>
  );
}
