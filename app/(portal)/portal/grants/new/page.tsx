"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { captureJson } from "@/lib/capture/api-client";
import { GrantedSearch } from "@/components/grants/granted-search";
import type { GrantOpportunityDoc } from "@/lib/schema";
import { ArrowLeft, Globe, Loader2, Search, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { useRequireAuth } from "@/lib/hooks/use-auth";

interface SerializedGrant extends Omit<GrantOpportunityDoc, "deadlineAt" | "createdAt" | "updatedAt" | "analyzedAt" | "submittedAt"> {
  deadlineAt?: string;
}

export default function NewGrantPage() {
  const { isLoading: authLoading, isAuthenticated } = useRequireAuth(["admin", "instructor"]);
  const router = useRouter();
  const [url, setUrl] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [creating, setCreating] = useState(false);
  const [manual, setManual] = useState({
    title: "",
    funder: "",
    sourceUrl: "",
    deadlineAt: "",
    awardMax: "",
    description: "",
    eligibility: "",
  });

  const handleAnalyze = async () => {
    if (!url.trim()) return;
    setAnalyzing(true);
    try {
      const { grant } = await captureJson<{ grant: SerializedGrant }>("/api/grants/analyze-url", {
        method: "POST",
        body: JSON.stringify({ url: url.trim() }),
      });
      toast.success(`Extracted ${grant.questions.length} questions and ${grant.requirements.length} requirements`);
      router.push(`/portal/grants/${grant.id}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Analysis failed");
    } finally {
      setAnalyzing(false);
    }
  };

  const handleManual = async () => {
    if (!manual.title.trim()) return;
    setCreating(true);
    try {
      const { grant } = await captureJson<{ grant: SerializedGrant }>("/api/grants", {
        method: "POST",
        body: JSON.stringify({
          title: manual.title.trim(),
          funder: manual.funder.trim() || undefined,
          sourceUrl: manual.sourceUrl.trim() || undefined,
          deadlineAt: manual.deadlineAt || undefined,
          awardMax: manual.awardMax ? Number(manual.awardMax) : undefined,
          description: manual.description.trim() || undefined,
          eligibility: manual.eligibility.trim() || undefined,
        }),
      });
      toast.success("Grant created");
      router.push(`/portal/grants/${grant.id}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not create grant");
    } finally {
      setCreating(false);
    }
  };

  if (authLoading || !isAuthenticated) return <div className="p-6 text-muted-foreground">Loading...</div>;

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <Button variant="ghost" size="sm" asChild>
        <Link href="/portal/grants">
          <ArrowLeft className="h-4 w-4 mr-1" /> Back to board
        </Link>
      </Button>

      <div>
        <h1 className="text-2xl font-bold">Add a Grant</h1>
        <p className="text-muted-foreground">
          Analyze a grant webpage with AI to extract questions, requirements, and deadlines — or enter details manually.
        </p>
      </div>

      <Tabs defaultValue="discover">
        <TabsList>
          <TabsTrigger value="discover">
            <Search className="h-4 w-4 mr-1.5" /> Find Grants
          </TabsTrigger>
          <TabsTrigger value="url">
            <Globe className="h-4 w-4 mr-1.5" /> Analyze URL
          </TabsTrigger>
          <TabsTrigger value="manual">Manual entry</TabsTrigger>
        </TabsList>

        <TabsContent value="discover" className="mt-4">
          <GrantedSearch />
        </TabsContent>

        <TabsContent value="url">
          <Card>
            <CardHeader>
              <CardTitle>Grant webpage</CardTitle>
              <CardDescription>
                Paste the URL of a grant announcement, RFP, or application page. AI will extract the title, funder,
                deadline, eligibility, submission requirements, and every application question.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="grant-url">Grant URL</Label>
                <Input
                  id="grant-url"
                  type="url"
                  placeholder="https://example.org/grants/community-impact-2026"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAnalyze()}
                />
              </div>
              <Button onClick={handleAnalyze} disabled={analyzing || !url.trim()}>
                {analyzing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Analyzing…
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" /> Analyze grant page
                  </>
                )}
              </Button>
              <p className="text-xs text-muted-foreground">
                JavaScript-heavy portals may not extract well — use manual entry as a fallback.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="manual">
          <Card>
            <CardHeader>
              <CardTitle>Grant details</CardTitle>
              <CardDescription>Enter the basics — you can add questions and requirements later.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={manual.title}
                  onChange={(e) => setManual((m) => ({ ...m, title: e.target.value }))}
                  placeholder="Community Impact Grant 2026"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="funder">Funder</Label>
                  <Input
                    id="funder"
                    value={manual.funder}
                    onChange={(e) => setManual((m) => ({ ...m, funder: e.target.value }))}
                    placeholder="Example Foundation"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="deadline">Deadline</Label>
                  <Input
                    id="deadline"
                    type="date"
                    value={manual.deadlineAt}
                    onChange={(e) => setManual((m) => ({ ...m, deadlineAt: e.target.value }))}
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="source-url">Source URL</Label>
                  <Input
                    id="source-url"
                    type="url"
                    value={manual.sourceUrl}
                    onChange={(e) => setManual((m) => ({ ...m, sourceUrl: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="award">Award amount (max, USD)</Label>
                  <Input
                    id="award"
                    type="number"
                    min={0}
                    value={manual.awardMax}
                    onChange={(e) => setManual((m) => ({ ...m, awardMax: e.target.value }))}
                    placeholder="50000"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="desc">Description</Label>
                <Textarea
                  id="desc"
                  rows={3}
                  value={manual.description}
                  onChange={(e) => setManual((m) => ({ ...m, description: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="elig">Eligibility</Label>
                <Textarea
                  id="elig"
                  rows={2}
                  value={manual.eligibility}
                  onChange={(e) => setManual((m) => ({ ...m, eligibility: e.target.value }))}
                />
              </div>
              <Button onClick={handleManual} disabled={creating || !manual.title.trim()}>
                {creating ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                Create grant
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
