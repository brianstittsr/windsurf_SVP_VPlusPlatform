"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Loader2, Search, Download, AlertCircle, CheckCircle, Copy, ExternalLink } from "lucide-react";
import { SamApiResponse, SamSection } from "@/lib/sam-api";

export default function SamTesterPage() {
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<SamApiResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("search");

  // Search parameters
  const [ueiSAM, setUeiSAM] = useState("");
  const [cage, setCage] = useState("");
  const [q, setQ] = useState("");
  const [page, setPage] = useState("1");
  const [size, setSize] = useState("10");

  // Section selection
  const [sections, setSections] = useState<SamSection[]>(["All"]);

  // Auth for POST requests
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const availableSections: SamSection[] = [
    "entityRegistration",
    "coreData",
    "assertions",
    "pointsOfContact",
    "repsAndCerts",
    "integrityInformation",
    "All",
  ];

  const handleSectionToggle = (section: SamSection) => {
    if (section === "All") {
      setSections(["All"]);
    } else {
      setSections((prev) => {
        const newSections = prev.filter((s) => s !== "All");
        if (newSections.includes(section)) {
          return newSections.filter((s) => s !== section);
        } else {
          return [...newSections, section];
        }
      });
    }
  };

  const handleSearch = async (usePost: boolean = false) => {
    setLoading(true);
    setError(null);
    setResponse(null);

    try {
      const params: Record<string, string | string[]> = {};

      if (ueiSAM) params.ueiSAM = ueiSAM;
      if (cage) params.cage = cage;
      if (q) params.q = q;
      if (page) params.page = page;
      if (size) params.size = size;
      if (sections.length > 0) params.includeSections = sections;

      const headers: HeadersInit = {
        "Content-Type": "application/json",
      };

      if (usePost && username && password) {
        const auth = btoa(`${username}:${password}`);
        headers["Authorization"] = `Basic ${auth}`;
      }

      const res = await fetch(
        `/api/sam/entities${usePost ? "" : `?${new URLSearchParams(params as any).toString()}`}`,
        {
          method: usePost ? "POST" : "GET",
          headers,
          body: usePost ? JSON.stringify(params) : undefined,
        }
      );

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || `HTTP ${res.status}`);
      }

      const data = await res.json();
      setResponse(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch data");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const downloadJson = () => {
    if (!response) return;
    const blob = new Blob([JSON.stringify(response, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `sam-response-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">SAM.gov API Tester</h1>
          <p className="text-muted-foreground">
            Test the SAM.gov Entity Management API features and search for federal entities.
          </p>
          <div className="mt-4 flex gap-2">
            <Badge variant="outline" className="text-xs">
              <ExternalLink className="h-3 w-3 mr-1" />
              <a href="https://open.gsa.gov/api/entity-api/" target="_blank" rel="noopener noreferrer">
                API Documentation
              </a>
            </Badge>
            <Badge variant="outline" className="text-xs">
              <ExternalLink className="h-3 w-3 mr-1" />
              <a href="https://sam.gov" target="_blank" rel="noopener noreferrer">
                SAM.gov
              </a>
            </Badge>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="search">Search Entities</TabsTrigger>
            <TabsTrigger value="advanced">Advanced Search</TabsTrigger>
            <TabsTrigger value="response">Response</TabsTrigger>
          </TabsList>

          <TabsContent value="search" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Basic Search</CardTitle>
                <CardDescription>
                  Search SAM.gov entities by UEI, CAGE code, or free text
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="ueiSAM">UEI SAM</Label>
                    <Input
                      id="ueiSAM"
                      placeholder="e.g., 12 characters UEI"
                      value={ueiSAM}
                      onChange={(e) => setUeiSAM(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">
                      Unique Entity Identifier (12 characters)
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cage">CAGE Code</Label>
                    <Input
                      id="cage"
                      placeholder="e.g., 5 character CAGE"
                      value={cage}
                      onChange={(e) => setCage(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">
                      Commercial and Government Entity code
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="q">Free Text Search (q)</Label>
                  <Textarea
                    id="q"
                    placeholder="Search by company name, address, or other fields"
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    rows={2}
                  />
                  <p className="text-xs text-muted-foreground">
                    Supports AND (&), OR (~), NOT (!) operators
                  </p>
                </div>

                <Separator />

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="page">Page</Label>
                    <Input
                      id="page"
                      type="number"
                      min="1"
                      value={page}
                      onChange={(e) => setPage(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="size">Records per page (max 10)</Label>
                    <Select value={size} onValueChange={setSize}>
                      <SelectTrigger id="size">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">1</SelectItem>
                        <SelectItem value="5">5</SelectItem>
                        <SelectItem value="10">10</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button onClick={() => handleSearch(false)} disabled={loading}>
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Searching...
                      </>
                    ) : (
                      <>
                        <Search className="h-4 w-4 mr-2" />
                        Search (GET)
                      </>
                    )}
                  </Button>
                  <Button variant="outline" onClick={() => {
                    setUeiSAM("");
                    setCage("");
                    setQ("");
                    setPage("1");
                    setSize("10");
                    setSections(["All"]);
                    setResponse(null);
                    setError(null);
                  }}>
                    Clear
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="advanced" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Advanced Options</CardTitle>
                <CardDescription>
                  Configure data sections and authentication for FOUO/Sensitive data
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-3">
                  <Label>Data Sections to Include</Label>
                  <div className="grid md:grid-cols-2 gap-2">
                    {availableSections.map((section) => (
                      <div key={section} className="flex items-center space-x-2">
                        <Checkbox
                          id={`section-${section}`}
                          checked={sections.includes(section)}
                          onCheckedChange={() => handleSectionToggle(section)}
                        />
                        <Label htmlFor={`section-${section}`} className="text-sm cursor-pointer">
                          {section}
                        </Label>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Select "All" to include all sections, or select individual sections
                  </p>
                </div>

                <Separator />

                <div className="space-y-3">
                  <Label className="text-base font-semibold">
                    POST Request with Authentication (FOUO/Sensitive Data)
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Requires Federal System Account with appropriate permissions
                  </p>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="username">System Account Username</Label>
                      <Input
                        id="username"
                        placeholder="System Account ID"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="password">System Account Password</Label>
                      <Input
                        id="password"
                        type="password"
                        placeholder="System Account Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                      />
                    </div>
                  </div>
                  <Button
                    onClick={() => handleSearch(true)}
                    disabled={loading}
                    variant="default"
                    className="w-full"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Searching...
                      </>
                    ) : (
                      <>
                        <Search className="h-4 w-4 mr-2" />
                        Search with Auth (POST)
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="response" className="space-y-6">
            {error && (
              <Card className="border-destructive">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-destructive">
                    <AlertCircle className="h-5 w-5" />
                    Error
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-destructive">{error}</p>
                </CardContent>
              </Card>
            )}

            {response && (
              <>
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        <CheckCircle className="h-5 w-5 text-green-500" />
                        Response Summary
                      </CardTitle>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={downloadJson}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Download JSON
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid md:grid-cols-3 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Total Records</p>
                        <p className="text-2xl font-bold">{response.totalRecords}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Returned Records</p>
                        <p className="text-2xl font-bold">{response.entityData?.length || 0}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Status</p>
                        <Badge variant="outline" className="text-green-500">
                          Success
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {response.entityData && response.entityData.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Entity Results</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {response.entityData.map((entity, index) => (
                          <div
                            key={index}
                            className="border rounded-lg p-4 space-y-3"
                          >
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1 space-y-2">
                                {entity.entityRegistration && (
                                  <>
                                    <div className="flex items-center gap-2">
                                      <Badge variant="outline">UEI</Badge>
                                      <span className="font-mono text-sm">
                                        {entity.entityRegistration.ueiSAM}
                                      </span>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-6 w-6 p-0"
                                        onClick={() => copyToClipboard(entity.entityRegistration!.ueiSAM)}
                                      >
                                        <Copy className="h-3 w-3" />
                                      </Button>
                                    </div>
                                    <h3 className="font-semibold text-lg">
                                      {entity.entityRegistration.legalBusinessName}
                                    </h3>
                                    {entity.entityRegistration.dbaName && (
                                      <p className="text-sm text-muted-foreground">
                                        DBA: {entity.entityRegistration.dbaName}
                                      </p>
                                    )}
                                    <div className="grid md:grid-cols-2 gap-2 text-sm">
                                      {entity.entityRegistration.physicalAddress && (
                                        <div>
                                          <p className="text-muted-foreground">Address:</p>
                                          <p>
                                            {[
                                              entity.entityRegistration.physicalAddress.line1,
                                              entity.entityRegistration.physicalAddress.line2,
                                              entity.entityRegistration.physicalAddress.city,
                                              entity.entityRegistration.physicalAddress.state,
                                              entity.entityRegistration.physicalAddress.zip,
                                            ]
                                              .filter(Boolean)
                                              .join(", ")}
                                          </p>
                                        </div>
                                      )}
                                      <div>
                                        <p className="text-muted-foreground">Entity State:</p>
                                        <p>{entity.entityRegistration.entityState}</p>
                                      </div>
                                    </div>
                                    {entity.entityRegistration.businessTypes && entity.entityRegistration.businessTypes.length > 0 && (
                                      <div>
                                        <p className="text-muted-foreground text-sm">Business Types:</p>
                                        <div className="flex flex-wrap gap-1 mt-1">
                                          {entity.entityRegistration.businessTypes.map((type, i) => (
                                            <Badge key={i} variant="secondary" className="text-xs">
                                              {type}
                                            </Badge>
                                          ))}
                                        </div>
                                      </div>
                                    )}
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                <Card>
                  <CardHeader>
                    <CardTitle>Full JSON Response</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="relative">
                      <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-xs">
                        {JSON.stringify(response, null, 2)}
                      </pre>
                      <Button
                        variant="outline"
                        size="sm"
                        className="absolute top-2 right-2"
                        onClick={() => copyToClipboard(JSON.stringify(response, null, 2))}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}

            {!response && !error && (
              <Card>
                <CardContent className="py-12 text-center">
                  <Search className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">
                    No response yet. Use the Search tab to query SAM.gov entities.
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
