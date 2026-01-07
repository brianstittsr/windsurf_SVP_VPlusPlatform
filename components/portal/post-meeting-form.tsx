"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Sparkles,
  FileText,
  Users,
  Target,
  Building,
  Calendar,
  Clock,
  CheckCircle2,
  Plus,
  Trash2,
  Wand2,
  Save,
  Send,
  ArrowRight,
  Lightbulb,
  TrendingUp,
  Handshake,
} from "lucide-react";
import { useRouter } from "next/navigation";

interface Referral {
  id: string;
  type: "affiliate" | "svp";
  recipientName: string;
  recipientCompany?: string;
  description: string;
  expectedValue?: string;
  followUpDate?: string;
}

interface MeetingFormData {
  attendee: string;
  meetingDate: string;
  meetingDuration: string;
  meetingType: "in-person" | "virtual";
  meetingQuality: number;
  discussionTopics: string[];
  keyTakeaways: string;
  actionItems: string[];
  referralsGiven: Referral[];
  followUpNeeded: boolean;
  followUpDate?: string;
  followUpNotes?: string;
  wouldMeetAgain: boolean;
  additionalNotes: string;
}

export function PostMeetingForm() {
  const router = useRouter();
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [formData, setFormData] = useState<MeetingFormData>({
    attendee: "",
    meetingDate: "",
    meetingDuration: "30",
    meetingType: "virtual",
    meetingQuality: 4,
    discussionTopics: [],
    keyTakeaways: "",
    actionItems: [],
    referralsGiven: [],
    followUpNeeded: false,
    wouldMeetAgain: true,
    additionalNotes: "",
  });

  const [rawNotes, setRawNotes] = useState("");
  const [isEnhancingNotes, setIsEnhancingNotes] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<{
    summary?: string;
    topics?: string[];
    actionItems?: string[];
    referrals?: string[];
  }>({});

  const discussionTopicOptions = [
    "Business challenges",
    "Market opportunities",
    "Referral opportunities",
    "Strategic partnerships",
    "Industry trends",
    "Best practices",
    "Technology solutions",
    "Growth strategies",
    "Customer acquisition",
    "Operational efficiency",
  ];

  const enhanceWithAI = async () => {
    setIsEnhancing(true);
    
    // Simulate AI processing
    setTimeout(() => {
      const suggestions = {
        summary: `Had a productive virtual meeting with ${formData.attendee || "[Attendee Name]"}. We discussed their current business challenges in manufacturing automation and explored potential collaboration opportunities. They're actively looking for quality management solutions and I identified a strong referral opportunity for SVP's ISO certification services. We agreed to introduce each other to relevant contacts in our networks and schedule a follow-up in two weeks to review progress.`,
        topics: [
          "Manufacturing automation challenges",
          "Quality management systems",
          "ISO certification needs",
          "Mutual referral opportunities",
        ],
        actionItems: [
          "Send introduction email to John Smith at ABC Manufacturing",
          "Share SVP's ISO certification case studies",
          "Connect on LinkedIn and engage with their content",
          "Schedule follow-up meeting for two weeks",
        ],
        referrals: [
          "Potential SVP referral: ISO 9001 certification for their manufacturing facility",
          "Affiliate referral: Connect them with Sarah Johnson for automation consulting",
        ],
      };

      setAiSuggestions(suggestions);
      setFormData({
        ...formData,
        keyTakeaways: suggestions.summary,
        discussionTopics: suggestions.topics,
        actionItems: suggestions.actionItems,
      });
      setIsEnhancing(false);
    }, 2000);
  };

  const enhanceAdditionalNotes = async () => {
    if (!formData.additionalNotes.trim()) return;
    
    setIsEnhancingNotes(true);
    
    // Simulate AI processing to format notes
    setTimeout(() => {
      const rawText = formData.additionalNotes;
      
      // Format the notes with bullet points and structure
      const lines = rawText.split(/[.\n]+/).filter(line => line.trim());
      const formattedNotes = lines.length > 1 
        ? lines.map(line => `• ${line.trim()}`).join('\n')
        : `• ${rawText.trim()}`;
      
      // Add a header if it looks like observations
      const enhancedNotes = `Key Observations:\n${formattedNotes}\n\nNext Steps:\n• Review notes and follow up as needed\n• Update CRM with meeting outcomes`;
      
      setFormData({
        ...formData,
        additionalNotes: enhancedNotes,
      });
      setIsEnhancingNotes(false);
    }, 1500);
  };

  const addReferral = (type: "affiliate" | "svp") => {
    const newReferral: Referral = {
      id: Date.now().toString(),
      type,
      recipientName: "",
      description: "",
    };
    setFormData({
      ...formData,
      referralsGiven: [...formData.referralsGiven, newReferral],
    });
  };

  const updateReferral = (id: string, field: keyof Referral, value: string) => {
    setFormData({
      ...formData,
      referralsGiven: formData.referralsGiven.map((ref) =>
        ref.id === id ? { ...ref, [field]: value } : ref
      ),
    });
  };

  const removeReferral = (id: string) => {
    setFormData({
      ...formData,
      referralsGiven: formData.referralsGiven.filter((ref) => ref.id !== id),
    });
  };

  const toggleTopic = (topic: string) => {
    if (formData.discussionTopics.includes(topic)) {
      setFormData({
        ...formData,
        discussionTopics: formData.discussionTopics.filter((t) => t !== topic),
      });
    } else {
      setFormData({
        ...formData,
        discussionTopics: [...formData.discussionTopics, topic],
      });
    }
  };

  const addActionItem = () => {
    setFormData({
      ...formData,
      actionItems: [...formData.actionItems, ""],
    });
  };

  const updateActionItem = (index: number, value: string) => {
    const newActionItems = [...formData.actionItems];
    newActionItems[index] = value;
    setFormData({
      ...formData,
      actionItems: newActionItems,
    });
  };

  const removeActionItem = (index: number) => {
    setFormData({
      ...formData,
      actionItems: formData.actionItems.filter((_, i) => i !== index),
    });
  };

  const handleSubmit = () => {
    console.log("Meeting summary submitted:", formData);
    router.push("/portal/networking/meetings");
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-6 w-6 text-primary" />
            Post-Meeting Summary
          </CardTitle>
          <CardDescription>
            Document your networking meeting and track referrals
          </CardDescription>
        </CardHeader>
      </Card>

      {/* AI Enhancement Section */}
      <Card className="border-purple-200 bg-purple-50/50">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-600" />
            AI-Powered Meeting Summary
          </CardTitle>
          <CardDescription>
            Let AI help you create a comprehensive meeting summary
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Quick Notes from Meeting</Label>
            <Textarea
              placeholder="Paste your rough notes here... AI will help organize them into a structured summary, identify action items, and suggest potential referrals."
              value={rawNotes}
              onChange={(e) => setRawNotes(e.target.value)}
              rows={6}
            />
          </div>
          <Button
            onClick={enhanceWithAI}
            disabled={isEnhancing || !rawNotes}
            className="w-full bg-purple-600 hover:bg-purple-700"
          >
            {isEnhancing ? (
              <>
                <Wand2 className="h-4 w-4 mr-2 animate-spin" />
                Enhancing with AI...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-2" />
                Enhance with AI
              </>
            )}
          </Button>

          {aiSuggestions.summary && (
            <div className="bg-white border border-purple-200 rounded-lg p-4 space-y-3">
              <div className="flex items-start gap-2">
                <Lightbulb className="h-5 w-5 text-purple-600 mt-0.5" />
                <div className="flex-1">
                  <p className="font-medium text-purple-900 mb-2">AI Suggestions Applied:</p>
                  <ul className="text-sm text-purple-700 space-y-1">
                    <li>✓ Generated meeting summary</li>
                    <li>✓ Identified {aiSuggestions.topics?.length || 0} discussion topics</li>
                    <li>✓ Extracted {aiSuggestions.actionItems?.length || 0} action items</li>
                    <li>✓ Found {aiSuggestions.referrals?.length || 0} potential referrals</li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Meeting Details */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Meeting Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Who did you meet with? *</Label>
              <Input
                placeholder="Attendee name"
                value={formData.attendee}
                onChange={(e) => setFormData({ ...formData, attendee: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Meeting Date *</Label>
              <Input
                type="date"
                value={formData.meetingDate}
                onChange={(e) => setFormData({ ...formData, meetingDate: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Duration (minutes)</Label>
              <Select
                value={formData.meetingDuration}
                onValueChange={(value) => setFormData({ ...formData, meetingDuration: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="15">15 minutes</SelectItem>
                  <SelectItem value="30">30 minutes</SelectItem>
                  <SelectItem value="45">45 minutes</SelectItem>
                  <SelectItem value="60">1 hour</SelectItem>
                  <SelectItem value="90">1.5 hours</SelectItem>
                  <SelectItem value="120">2 hours</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Meeting Type</Label>
              <RadioGroup
                value={formData.meetingType}
                onValueChange={(value: "in-person" | "virtual") =>
                  setFormData({ ...formData, meetingType: value })
                }
              >
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="virtual" id="virtual" />
                    <label htmlFor="virtual" className="text-sm cursor-pointer">
                      Virtual
                    </label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="in-person" id="in-person" />
                    <label htmlFor="in-person" className="text-sm cursor-pointer">
                      In-Person
                    </label>
                  </div>
                </div>
              </RadioGroup>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Meeting Quality</Label>
            <div className="flex items-center gap-4">
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((rating) => (
                  <button
                    key={rating}
                    type="button"
                    onClick={() => setFormData({ ...formData, meetingQuality: rating })}
                    className={`w-10 h-10 rounded-full border-2 transition-colors ${
                      formData.meetingQuality >= rating
                        ? "bg-primary border-primary text-primary-foreground"
                        : "border-muted-foreground/20 hover:border-primary/50"
                    }`}
                  >
                    {rating}
                  </button>
                ))}
              </div>
              <span className="text-sm text-muted-foreground">
                {formData.meetingQuality === 5 && "Excellent"}
                {formData.meetingQuality === 4 && "Very Good"}
                {formData.meetingQuality === 3 && "Good"}
                {formData.meetingQuality === 2 && "Fair"}
                {formData.meetingQuality === 1 && "Poor"}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Discussion Topics */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">What did you discuss?</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {discussionTopicOptions.map((topic) => (
              <div key={topic} className="flex items-center space-x-2">
                <Checkbox
                  id={topic}
                  checked={formData.discussionTopics.includes(topic)}
                  onCheckedChange={() => toggleTopic(topic)}
                />
                <label
                  htmlFor={topic}
                  className="text-sm font-medium leading-none cursor-pointer"
                >
                  {topic}
                </label>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Key Takeaways */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Key Takeaways & Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <Textarea
            placeholder="Summarize the main points and outcomes of the meeting..."
            value={formData.keyTakeaways}
            onChange={(e) => setFormData({ ...formData, keyTakeaways: e.target.value })}
            rows={6}
          />
          {aiSuggestions.summary && (
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Sparkles className="h-3 w-3" />
              AI-enhanced summary
            </p>
          )}
        </CardContent>
      </Card>

      {/* Action Items */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Action Items</CardTitle>
            <Button size="sm" variant="outline" onClick={addActionItem}>
              <Plus className="h-4 w-4 mr-2" />
              Add Action
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {formData.actionItems.map((item, index) => (
            <div key={index} className="flex items-start gap-2">
              <CheckCircle2 className="h-5 w-5 text-muted-foreground mt-2" />
              <Input
                placeholder="Action item..."
                value={item}
                onChange={(e) => updateActionItem(index, e.target.value)}
                className="flex-1"
              />
              <Button
                size="icon"
                variant="ghost"
                onClick={() => removeActionItem(index)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
          {formData.actionItems.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">
              No action items yet. Click "Add Action" to create one.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Referrals */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">Referrals Generated</CardTitle>
              <CardDescription>Track referrals given during this meeting</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => addReferral("affiliate")}>
                <Users className="h-4 w-4 mr-2" />
                Affiliate Referral
              </Button>
              <Button size="sm" onClick={() => addReferral("svp")}>
                <Target className="h-4 w-4 mr-2" />
                SVP Referral
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {formData.referralsGiven.map((referral) => (
            <Card key={referral.id} className="border-2">
              <CardContent className="pt-6 space-y-4">
                <div className="flex items-start justify-between">
                  <Badge className={referral.type === "svp" ? "bg-green-600 text-white" : "bg-blue-600 text-white"}>
                    {referral.type === "svp" ? (
                      <>
                        <Target className="h-3 w-3 mr-1" />
                        SVP Referral
                      </>
                    ) : (
                      <>
                        <Users className="h-3 w-3 mr-1" />
                        Affiliate Referral
                      </>
                    )}
                  </Badge>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => removeReferral(referral.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Recipient Name *</Label>
                    <Input
                      placeholder="Who are you referring?"
                      value={referral.recipientName}
                      onChange={(e) =>
                        updateReferral(referral.id, "recipientName", e.target.value)
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Company</Label>
                    <Input
                      placeholder="Company name"
                      value={referral.recipientCompany || ""}
                      onChange={(e) =>
                        updateReferral(referral.id, "recipientCompany", e.target.value)
                      }
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Referral Description *</Label>
                  <Textarea
                    placeholder="Describe the referral opportunity, needs, and context..."
                    value={referral.description}
                    onChange={(e) => updateReferral(referral.id, "description", e.target.value)}
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Expected Value (Optional)</Label>
                    <Input
                      placeholder="e.g., $10,000"
                      value={referral.expectedValue || ""}
                      onChange={(e) =>
                        updateReferral(referral.id, "expectedValue", e.target.value)
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Follow-up Date</Label>
                    <Input
                      type="date"
                      value={referral.followUpDate || ""}
                      onChange={(e) =>
                        updateReferral(referral.id, "followUpDate", e.target.value)
                      }
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {formData.referralsGiven.length === 0 && (
            <div className="text-center py-8 border-2 border-dashed rounded-lg">
              <Handshake className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">
                No referrals documented yet. Click the buttons above to add referrals.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Follow-up */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Follow-up</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="followUpNeeded"
              checked={formData.followUpNeeded}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, followUpNeeded: checked as boolean })
              }
            />
            <label htmlFor="followUpNeeded" className="text-sm font-medium cursor-pointer">
              Follow-up meeting needed
            </label>
          </div>

          {formData.followUpNeeded && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-6">
              <div className="space-y-2">
                <Label>Follow-up Date</Label>
                <Input
                  type="date"
                  value={formData.followUpDate || ""}
                  onChange={(e) => setFormData({ ...formData, followUpDate: e.target.value })}
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>Follow-up Notes</Label>
                <Textarea
                  placeholder="What should be discussed in the follow-up?"
                  value={formData.followUpNotes || ""}
                  onChange={(e) => setFormData({ ...formData, followUpNotes: e.target.value })}
                  rows={3}
                />
              </div>
            </div>
          )}

          <div className="flex items-center space-x-2">
            <Checkbox
              id="wouldMeetAgain"
              checked={formData.wouldMeetAgain}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, wouldMeetAgain: checked as boolean })
              }
            />
            <label htmlFor="wouldMeetAgain" className="text-sm font-medium cursor-pointer">
              I would meet with this person again
            </label>
          </div>
        </CardContent>
      </Card>

      {/* Additional Notes */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Additional Notes</CardTitle>
            <Button
              size="sm"
              variant="outline"
              onClick={enhanceAdditionalNotes}
              disabled={isEnhancingNotes || !formData.additionalNotes.trim()}
              className="text-purple-600 border-purple-300 hover:bg-purple-50"
            >
              {isEnhancingNotes ? (
                <>
                  <Wand2 className="h-4 w-4 mr-2 animate-spin" />
                  Formatting...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Enhance with AI
                </>
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder="Any other observations, insights, or notes from the meeting..."
            value={formData.additionalNotes}
            onChange={(e) => setFormData({ ...formData, additionalNotes: e.target.value })}
            rows={4}
          />
        </CardContent>
      </Card>

      {/* Submit Buttons */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex justify-between">
            <Button variant="outline">
              <Save className="h-4 w-4 mr-2" />
              Save as Draft
            </Button>
            <Button onClick={handleSubmit} className="bg-green-600">
              <Send className="h-4 w-4 mr-2" />
              Submit Meeting Summary
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Impact Preview */}
      {(formData.referralsGiven.length > 0 || formData.actionItems.length > 0) && (
        <Card className="border-green-200 bg-green-50/50">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-600" />
              Your Networking Impact
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-3xl font-bold text-green-600">
                  +{formData.referralsGiven.filter((r) => r.type === "affiliate").length}
                </p>
                <p className="text-sm text-muted-foreground">Affiliate Referrals</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-green-600">
                  +{formData.referralsGiven.filter((r) => r.type === "svp").length}
                </p>
                <p className="text-sm text-muted-foreground">SVP Referrals</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-green-600">+10</p>
                <p className="text-sm text-muted-foreground">Networking Points</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
