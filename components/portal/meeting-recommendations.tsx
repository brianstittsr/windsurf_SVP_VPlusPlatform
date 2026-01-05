"use client";

import { useState, useEffect } from "react";
import { useUserProfile } from "@/contexts/user-profile-context";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Users,
  Sparkles,
  Calendar,
  CheckCircle,
  X,
  ChevronRight,
  MessageSquare,
  Building2,
  Loader2,
  RefreshCw,
} from "lucide-react";

interface MatchReason {
  category: string;
  description: string;
  weight: number;
}

interface MeetingSuggestion {
  id: string;
  partnerId: string;
  partnerName: string;
  partnerCompany: string;
  partnerExpertise: string[];
  matchScore: number;
  reasons: MatchReason[];
  talkingPoints: string[];
}

export function MeetingRecommendations() {
  const { profile, linkedTeamMember, networkingCompletion } = useUserProfile();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<MeetingSuggestion[]>([]);
  const [selectedSuggestion, setSelectedSuggestion] = useState<MeetingSuggestion | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Show recommendations when networking profile is complete
  useEffect(() => {
    if (profile.isAffiliate && networkingCompletion >= 80 && linkedTeamMember) {
      // Check if we should show recommendations (e.g., first time after completion)
      const hasSeenRecommendations = sessionStorage.getItem("svp_seen_recommendations");
      if (!hasSeenRecommendations) {
        setIsOpen(true);
        fetchRecommendations();
      }
    }
  }, [profile.isAffiliate, networkingCompletion, linkedTeamMember]);

  const fetchRecommendations = async () => {
    if (!linkedTeamMember) return;

    setIsLoading(true);
    try {
      const response = await fetch("/api/ai/networking/match-recommendations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          affiliateId: linkedTeamMember.id,
          count: 5,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setSuggestions(data.suggestions || []);
      }
    } catch (error) {
      console.error("Failed to fetch recommendations:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAccept = async (suggestion: MeetingSuggestion) => {
    setActionLoading(suggestion.id);
    try {
      const response = await fetch("/api/ai/networking/accept-recommendation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          suggestionId: suggestion.id,
          affiliateId: linkedTeamMember?.id,
          partnerId: suggestion.partnerId,
        }),
      });

      if (response.ok) {
        // Remove from list and show success
        setSuggestions((prev) => prev.filter((s) => s.id !== suggestion.id));
        setSelectedSuggestion(null);
      }
    } catch (error) {
      console.error("Failed to accept recommendation:", error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDecline = async (suggestion: MeetingSuggestion) => {
    setActionLoading(suggestion.id);
    try {
      const response = await fetch("/api/ai/networking/decline-recommendation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          suggestionId: suggestion.id,
        }),
      });

      if (response.ok) {
        setSuggestions((prev) => prev.filter((s) => s.id !== suggestion.id));
        setSelectedSuggestion(null);
      }
    } catch (error) {
      console.error("Failed to decline recommendation:", error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleClose = () => {
    sessionStorage.setItem("svp_seen_recommendations", "true");
    setIsOpen(false);
  };

  const getScoreColor = (score: number) => {
    if (score >= 70) return "text-green-600 bg-green-100";
    if (score >= 50) return "text-yellow-600 bg-yellow-100";
    return "text-orange-600 bg-orange-100";
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500 to-purple-600">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            AI-Powered Meeting Recommendations
          </DialogTitle>
          <DialogDescription>
            Based on your networking profile, we've identified affiliates who could be great referral partners for you.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Card key={i}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      <Skeleton className="h-12 w-12 rounded-full" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-1/3" />
                        <Skeleton className="h-3 w-1/4" />
                        <Skeleton className="h-3 w-full" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : suggestions.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-medium mb-2">No Recommendations Yet</h3>
              <p className="text-sm text-muted-foreground mb-4">
                We're still analyzing the network to find your best matches.
              </p>
              <Button onClick={fetchRecommendations} variant="outline">
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>
          ) : selectedSuggestion ? (
            // Detail view
            <div className="space-y-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedSuggestion(null)}
                className="mb-2"
              >
                ← Back to all recommendations
              </Button>

              <Card>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-xl font-semibold text-primary">
                          {selectedSuggestion.partnerName.charAt(0)}
                        </span>
                      </div>
                      <div>
                        <CardTitle className="text-lg">{selectedSuggestion.partnerName}</CardTitle>
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          <Building2 className="h-3 w-3" />
                          {selectedSuggestion.partnerCompany}
                        </p>
                      </div>
                    </div>
                    <Badge className={getScoreColor(selectedSuggestion.matchScore)}>
                      {selectedSuggestion.matchScore}% Match
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Expertise */}
                  {selectedSuggestion.partnerExpertise.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium mb-2">Expertise</h4>
                      <div className="flex flex-wrap gap-1">
                        {selectedSuggestion.partnerExpertise.map((exp, i) => (
                          <Badge key={i} variant="secondary" className="text-xs">
                            {exp}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Why this match */}
                  <div>
                    <h4 className="text-sm font-medium mb-2">Why This Match</h4>
                    <ul className="space-y-2">
                      {selectedSuggestion.reasons.map((reason, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm">
                          <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                          <span>{reason.description}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Talking points */}
                  <div>
                    <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                      <MessageSquare className="h-4 w-4" />
                      Suggested Talking Points
                    </h4>
                    <ul className="space-y-2 bg-muted/50 rounded-lg p-3">
                      {selectedSuggestion.talkingPoints.map((point, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm">
                          <span className="text-primary font-medium">{i + 1}.</span>
                          <span>{point}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3 pt-4">
                    <Button
                      className="flex-1"
                      onClick={() => handleAccept(selectedSuggestion)}
                      disabled={actionLoading === selectedSuggestion.id}
                    >
                      {actionLoading === selectedSuggestion.id ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Calendar className="h-4 w-4 mr-2" />
                      )}
                      Schedule Meeting
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => handleDecline(selectedSuggestion)}
                      disabled={actionLoading === selectedSuggestion.id}
                    >
                      <X className="h-4 w-4 mr-2" />
                      Not Now
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            // List view
            <div className="space-y-3">
              {suggestions.map((suggestion) => (
                <Card
                  key={suggestion.id}
                  className="cursor-pointer hover:border-primary/50 transition-colors"
                  onClick={() => setSelectedSuggestion(suggestion)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <span className="text-lg font-semibold text-primary">
                          {suggestion.partnerName.charAt(0)}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium truncate">{suggestion.partnerName}</h4>
                          <Badge className={`${getScoreColor(suggestion.matchScore)} shrink-0 ml-2`}>
                            {suggestion.matchScore}%
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground truncate">
                          {suggestion.partnerCompany}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                          {suggestion.reasons[0]?.description}
                        </p>
                      </div>
                      <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={handleClose}>
            View Later
          </Button>
          {suggestions.length > 0 && !selectedSuggestion && (
            <Button onClick={fetchRecommendations} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Get More Suggestions
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
