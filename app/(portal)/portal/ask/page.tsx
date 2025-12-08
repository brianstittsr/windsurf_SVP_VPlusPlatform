"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sparkles,
  Send,
  User,
  Users,
  Target,
  FolderKanban,
  Calendar,
  FileText,
  TrendingUp,
  MapPin,
  Clock,
  ArrowRight,
  Loader2,
} from "lucide-react";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  sources?: string[];
  actions?: { label: string; href: string }[];
}

const suggestedQueries = [
  "Which affiliates have experience with automotive supply chain?",
  "What's the status of our active proposals?",
  "Show me opportunities closing this month",
  "Who has ISO/IATF certification experience?",
  "What were the key decisions from last week's meetings?",
  "Which projects are at risk?",
];

const mockResponses: Record<string, Message> = {
  "affiliates automotive": {
    id: "1",
    role: "assistant",
    content: `Based on our affiliate database, I found **3 affiliates** with automotive supply chain experience:\n\n**1. John Smith** - 15 years automotive, IATF Lead Auditor\n- Capacity: Available\n- Location: Detroit, MI\n- Certifications: IATF 16949, ISO 9001\n\n**2. Jane Doe** - Supply chain specialist, ISO consultant\n- Capacity: Partial (2 days/week)\n- Location: Cleveland, OH\n- Certifications: ISO 9001, Six Sigma Black Belt\n\n**3. Robert Chen** - Automotive quality engineer\n- Capacity: Available\n- Location: Chicago, IL\n- Certifications: CQE, IATF 16949`,
    timestamp: new Date(),
    sources: ["Affiliate Database", "Capability Matrix"],
    actions: [
      { label: "View John Smith", href: "/portal/affiliates/1" },
      { label: "View Jane Doe", href: "/portal/affiliates/2" },
      { label: "View Robert Chen", href: "/portal/affiliates/3" },
    ],
  },
  "proposals status": {
    id: "2",
    role: "assistant",
    content: `Here's the status of your **active proposals**:\n\n📋 **5 proposals** currently in progress:\n\n| Company | Value | Sent | Status |\n|---------|-------|------|--------|\n| ABC Manufacturing | $85,000 | 3 days ago | Awaiting response |\n| XYZ Industries | $120,000 | Today | Just sent |\n| Precision Parts | $95,000 | 5 days ago | Follow-up needed |\n| TechForm Inc | $65,000 | 1 week ago | Under review |\n| Metro Components | $45,000 | 2 days ago | Awaiting response |\n\n**Total pipeline value: $410,000**\n\n⚠️ **Action needed:** Precision Parts proposal is 5 days old with no response. Consider scheduling a follow-up call.`,
    timestamp: new Date(),
    sources: ["Opportunity Pipeline", "CRM Data"],
    actions: [
      { label: "View All Proposals", href: "/portal/opportunities?stage=proposal" },
      { label: "Follow up with Precision Parts", href: "/portal/opportunities/3" },
    ],
  },
  default: {
    id: "default",
    role: "assistant",
    content: `I understand you're asking about business information. Let me search our systems...\n\nI found relevant information across multiple sources. Here's a summary:\n\n- **Opportunities:** 12 active in pipeline\n- **Projects:** 8 currently running\n- **Affiliates:** 24 in network\n- **Meetings:** 3 scheduled this week\n\nWould you like me to drill down into any specific area?`,
    timestamp: new Date(),
    sources: ["Multiple Sources"],
    actions: [
      { label: "View Opportunities", href: "/portal/opportunities" },
      { label: "View Projects", href: "/portal/projects" },
    ],
  },
};

export default function AskPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (query: string) => {
    if (!query.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: query,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    // Simulate AI response delay
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // Find matching mock response
    let response = mockResponses.default;
    if (query.toLowerCase().includes("affiliate") && query.toLowerCase().includes("automotive")) {
      response = mockResponses["affiliates automotive"];
    } else if (query.toLowerCase().includes("proposal") || query.toLowerCase().includes("status")) {
      response = mockResponses["proposals status"];
    }

    const assistantMessage: Message = {
      ...response,
      id: (Date.now() + 1).toString(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, assistantMessage]);
    setIsLoading(false);
  };

  const handleSuggestedQuery = (query: string) => {
    setInput(query);
    handleSubmit(query);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
            <Sparkles className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Ask IntellEDGE</h1>
            <p className="text-muted-foreground">
              Ask questions about your business data in natural language
            </p>
          </div>
        </div>
      </div>

      {/* Chat Area */}
      <Card className="flex-1 flex flex-col overflow-hidden">
        <ScrollArea className="flex-1 p-4">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-8">
              <Sparkles className="h-16 w-16 text-primary/20 mb-6" />
              <h2 className="text-xl font-semibold mb-2">What would you like to know?</h2>
              <p className="text-muted-foreground mb-8 max-w-md">
                Ask me anything about your opportunities, projects, affiliates, meetings, 
                or any other business data.
              </p>

              {/* Suggested Queries */}
              <div className="grid gap-2 max-w-2xl w-full">
                <p className="text-sm text-muted-foreground mb-2">Try asking:</p>
                <div className="flex flex-wrap gap-2 justify-center">
                  {suggestedQueries.map((query) => (
                    <Button
                      key={query}
                      variant="outline"
                      size="sm"
                      className="text-left h-auto py-2"
                      onClick={() => handleSuggestedQuery(query)}
                    >
                      {query}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex gap-4 ${
                    message.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  {message.role === "assistant" && (
                    <Avatar className="h-8 w-8 shrink-0">
                      <AvatarFallback className="bg-primary/20 text-primary">
                        <Sparkles className="h-4 w-4" />
                      </AvatarFallback>
                    </Avatar>
                  )}

                  <div
                    className={`max-w-2xl rounded-lg p-4 ${
                      message.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted"
                    }`}
                  >
                    <div className="prose prose-sm dark:prose-invert max-w-none">
                      {message.content.split("\n").map((line, i) => (
                        <p key={i} className="mb-2 last:mb-0">
                          {line}
                        </p>
                      ))}
                    </div>

                    {/* Sources */}
                    {message.sources && message.sources.length > 0 && (
                      <div className="mt-4 pt-3 border-t border-border/50">
                        <p className="text-xs text-muted-foreground mb-2">Sources:</p>
                        <div className="flex flex-wrap gap-1">
                          {message.sources.map((source) => (
                            <Badge key={source} variant="secondary" className="text-xs">
                              {source}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Actions */}
                    {message.actions && message.actions.length > 0 && (
                      <div className="mt-4 flex flex-wrap gap-2">
                        {message.actions.map((action) => (
                          <Button
                            key={action.href}
                            variant="outline"
                            size="sm"
                            className="h-8"
                            asChild
                          >
                            <a href={action.href}>
                              {action.label}
                              <ArrowRight className="ml-1 h-3 w-3" />
                            </a>
                          </Button>
                        ))}
                      </div>
                    )}
                  </div>

                  {message.role === "user" && (
                    <Avatar className="h-8 w-8 shrink-0">
                      <AvatarFallback className="bg-secondary text-secondary-foreground">
                        <User className="h-4 w-4" />
                      </AvatarFallback>
                    </Avatar>
                  )}
                </div>
              ))}

              {isLoading && (
                <div className="flex gap-4">
                  <Avatar className="h-8 w-8 shrink-0">
                    <AvatarFallback className="bg-primary/20 text-primary">
                      <Sparkles className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="bg-muted rounded-lg p-4">
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span className="text-sm text-muted-foreground">Searching...</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </ScrollArea>

        {/* Input Area */}
        <div className="p-4 border-t">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSubmit(input);
            }}
            className="flex gap-2"
          >
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask a question about your business..."
              className="flex-1"
              disabled={isLoading}
            />
            <Button type="submit" disabled={isLoading || !input.trim()}>
              <Send className="h-4 w-4" />
            </Button>
          </form>
          <p className="text-xs text-muted-foreground mt-2 text-center">
            IntellEDGE searches across opportunities, projects, affiliates, meetings, and documents.
          </p>
        </div>
      </Card>
    </div>
  );
}
