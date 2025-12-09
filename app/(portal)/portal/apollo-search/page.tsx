"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Search,
  Send,
  Sparkles,
  Users,
  Building2,
  ListFilter,
  Database,
  Mail,
  Phone,
  Play,
  Workflow,
  BarChart3,
  Globe,
  CheckCircle,
  Clock,
  MessageSquare,
  Calendar,
  Target,
  Zap,
  RefreshCw,
  Download,
  Plus,
  ArrowRight,
  Bot,
  User,
  Loader2,
  ExternalLink,
  MapPin,
  Briefcase,
  TrendingUp,
  Filter,
  Save,
  Wifi,
  WifiOff,
  AlertCircle,
  Settings,
  Link2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { COLLECTIONS } from "@/lib/schema";

// Connection status type
type ConnectionStatus = "connected" | "disconnected" | "checking" | "error" | "no_key";

// Apollo feature categories based on the screenshot
const apolloFeatures = {
  prospectEnrich: [
    { id: "people", name: "People Search", icon: Users, description: "Find decision-makers by title, company, industry" },
    { id: "companies", name: "Companies Search", icon: Building2, description: "Discover companies by size, industry, tech stack" },
    { id: "lists", name: "Saved Lists", icon: ListFilter, description: "Organize prospects into targeted lists" },
    { id: "enrichment", name: "Data Enrichment", icon: Database, description: "Enrich contacts with emails, phones, social profiles" },
  ],
  engage: [
    { id: "sequences", name: "Sequences", icon: Play, description: "Automated multi-step outreach campaigns" },
    { id: "emails", name: "Emails", icon: Mail, description: "Send personalized emails at scale" },
    { id: "calls", name: "Calls", icon: Phone, description: "Click-to-dial with call recording" },
  ],
  winDeals: [
    { id: "meetings", name: "Meetings", icon: Calendar, description: "Schedule and track meetings" },
    { id: "conversations", name: "Conversations", icon: MessageSquare, description: "Track all prospect interactions" },
    { id: "deals", name: "Deals", icon: Target, description: "Manage your sales pipeline" },
  ],
  toolsAutomation: [
    { id: "tasks", name: "Tasks", icon: CheckCircle, description: "Manage follow-ups and to-dos" },
    { id: "workflows", name: "Workflows", icon: Workflow, description: "Automate repetitive processes" },
    { id: "analytics", name: "Analytics", icon: BarChart3, description: "Track performance metrics" },
  ],
  inbound: [
    { id: "visitors", name: "Website Visitors", icon: Globe, description: "Identify anonymous website visitors" },
    { id: "forms", name: "Forms", icon: Database, description: "Capture leads from web forms" },
  ],
};

// Sample search suggestions
const searchSuggestions = [
  "Find CTOs at SaaS companies with 50-200 employees in the US",
  "Show me VPs of Sales at manufacturing companies in Texas",
  "Find marketing directors at healthcare companies that use HubSpot",
  "Search for founders of AI startups that raised Series A",
  "Find HR managers at companies with 500+ employees in California",
];

// Message types for the chat
interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  searchCriteria?: SearchCriteria;
  results?: SearchResult[];
  clarifyingQuestions?: string[];
  suggestedActions?: SuggestedAction[];
}

interface SearchCriteria {
  titles?: string[];
  companies?: string[];
  industries?: string[];
  locations?: string[];
  companySize?: string;
  technologies?: string[];
  keywords?: string[];
  seniorityLevel?: string[];
}

interface SearchResult {
  id: string;
  name: string;
  title: string;
  company: string;
  location: string;
  email?: string;
  phone?: string;
  linkedIn?: string;
  avatar?: string;
  companySize?: string;
  industry?: string;
}

interface SuggestedAction {
  id: string;
  type: "sequence" | "list" | "enrich" | "email" | "task" | "workflow";
  label: string;
  description: string;
  icon: React.ElementType;
}

// Mock AI response generator
const generateAIResponse = (userMessage: string): ChatMessage => {
  const lowerMessage = userMessage.toLowerCase();
  
  // Check if the query is clear enough
  const hasTitleOrRole = /cto|ceo|vp|director|manager|founder|head of|chief/i.test(userMessage);
  const hasCompanyType = /saas|startup|enterprise|manufacturing|healthcare|tech|software|ai|fintech/i.test(userMessage);
  const hasLocation = /us|usa|california|texas|new york|uk|europe|remote/i.test(userMessage);
  const hasSize = /\d+.*employees|small|medium|large|enterprise|startup/i.test(userMessage);
  
  // If query is unclear, ask clarifying questions
  if (!hasTitleOrRole && !hasCompanyType) {
    return {
      id: Date.now().toString(),
      role: "assistant",
      content: "I'd like to help you find the right prospects. Could you provide more details?",
      timestamp: new Date(),
      clarifyingQuestions: [
        "What job titles or roles are you looking for? (e.g., CTO, VP of Sales, Marketing Director)",
        "What type of companies are you targeting? (e.g., SaaS, Healthcare, Manufacturing)",
        "Do you have a preferred company size? (e.g., 50-200 employees, Enterprise)",
        "Any specific geographic location? (e.g., US, California, Europe)",
      ],
    };
  }
  
  // Generate search criteria from the message
  const searchCriteria: SearchCriteria = {};
  
  if (/cto|chief technology/i.test(userMessage)) searchCriteria.titles = ["CTO", "Chief Technology Officer"];
  if (/ceo|chief executive/i.test(userMessage)) searchCriteria.titles = ["CEO", "Chief Executive Officer"];
  if (/vp.*sales|sales.*vp/i.test(userMessage)) searchCriteria.titles = ["VP of Sales", "Vice President of Sales"];
  if (/marketing.*director|director.*marketing/i.test(userMessage)) searchCriteria.titles = ["Marketing Director", "Director of Marketing"];
  if (/founder/i.test(userMessage)) searchCriteria.titles = ["Founder", "Co-Founder", "CEO & Founder"];
  if (/hr.*manager|human resources/i.test(userMessage)) searchCriteria.titles = ["HR Manager", "Human Resources Manager"];
  
  if (/saas/i.test(userMessage)) searchCriteria.industries = ["SaaS", "Software"];
  if (/manufacturing/i.test(userMessage)) searchCriteria.industries = ["Manufacturing", "Industrial"];
  if (/healthcare/i.test(userMessage)) searchCriteria.industries = ["Healthcare", "Medical"];
  if (/ai|artificial intelligence/i.test(userMessage)) searchCriteria.industries = ["Artificial Intelligence", "Machine Learning"];
  if (/fintech/i.test(userMessage)) searchCriteria.industries = ["Fintech", "Financial Services"];
  
  if (/california/i.test(userMessage)) searchCriteria.locations = ["California, USA"];
  if (/texas/i.test(userMessage)) searchCriteria.locations = ["Texas, USA"];
  if (/new york/i.test(userMessage)) searchCriteria.locations = ["New York, USA"];
  if (/\bus\b|usa|united states/i.test(userMessage)) searchCriteria.locations = searchCriteria.locations || ["United States"];
  
  if (/50.*200|small.*medium/i.test(userMessage)) searchCriteria.companySize = "50-200 employees";
  if (/500\+|large|enterprise/i.test(userMessage)) searchCriteria.companySize = "500+ employees";
  if (/startup/i.test(userMessage)) searchCriteria.companySize = "1-50 employees";
  
  if (/hubspot/i.test(userMessage)) searchCriteria.technologies = ["HubSpot"];
  if (/salesforce/i.test(userMessage)) searchCriteria.technologies = ["Salesforce"];
  if (/series a/i.test(userMessage)) searchCriteria.keywords = ["Series A", "Funded"];
  
  // Generate mock results
  const mockResults: SearchResult[] = [
    {
      id: "1",
      name: "Sarah Chen",
      title: searchCriteria.titles?.[0] || "VP of Engineering",
      company: "TechFlow Solutions",
      location: searchCriteria.locations?.[0] || "San Francisco, CA",
      email: "sarah.chen@techflow.io",
      phone: "+1 (415) 555-0123",
      linkedIn: "linkedin.com/in/sarahchen",
      companySize: searchCriteria.companySize || "100-200 employees",
      industry: searchCriteria.industries?.[0] || "SaaS",
    },
    {
      id: "2",
      name: "Michael Rodriguez",
      title: searchCriteria.titles?.[0] || "CTO",
      company: "DataPrime Inc",
      location: searchCriteria.locations?.[0] || "Austin, TX",
      email: "m.rodriguez@dataprime.com",
      linkedIn: "linkedin.com/in/mrodriguez",
      companySize: searchCriteria.companySize || "50-100 employees",
      industry: searchCriteria.industries?.[0] || "Data Analytics",
    },
    {
      id: "3",
      name: "Emily Watson",
      title: searchCriteria.titles?.[0] || "Chief Technology Officer",
      company: "CloudScale Systems",
      location: searchCriteria.locations?.[0] || "Seattle, WA",
      email: "emily.w@cloudscale.io",
      phone: "+1 (206) 555-0456",
      linkedIn: "linkedin.com/in/emilywatson",
      companySize: searchCriteria.companySize || "200-500 employees",
      industry: searchCriteria.industries?.[0] || "Cloud Infrastructure",
    },
    {
      id: "4",
      name: "David Park",
      title: searchCriteria.titles?.[0] || "VP of Technology",
      company: "InnovateTech Labs",
      location: searchCriteria.locations?.[0] || "Boston, MA",
      email: "dpark@innovatetech.com",
      linkedIn: "linkedin.com/in/davidpark",
      companySize: searchCriteria.companySize || "100-200 employees",
      industry: searchCriteria.industries?.[0] || "Software Development",
    },
    {
      id: "5",
      name: "Jennifer Liu",
      title: searchCriteria.titles?.[0] || "CTO & Co-Founder",
      company: "AI Dynamics",
      location: searchCriteria.locations?.[0] || "Palo Alto, CA",
      email: "jennifer@aidynamics.ai",
      phone: "+1 (650) 555-0789",
      linkedIn: "linkedin.com/in/jenniferliu",
      companySize: searchCriteria.companySize || "25-50 employees",
      industry: searchCriteria.industries?.[0] || "Artificial Intelligence",
    },
  ];
  
  // Generate suggested actions
  const suggestedActions: SuggestedAction[] = [
    {
      id: "1",
      type: "list",
      label: "Save to List",
      description: "Add these prospects to a new or existing list",
      icon: ListFilter,
    },
    {
      id: "2",
      type: "sequence",
      label: "Add to Sequence",
      description: "Start an automated outreach campaign",
      icon: Play,
    },
    {
      id: "3",
      type: "enrich",
      label: "Enrich Data",
      description: "Get additional contact information",
      icon: Database,
    },
    {
      id: "4",
      type: "email",
      label: "Send Email",
      description: "Compose a personalized email",
      icon: Mail,
    },
    {
      id: "5",
      type: "task",
      label: "Create Task",
      description: "Schedule a follow-up task",
      icon: CheckCircle,
    },
    {
      id: "6",
      type: "workflow",
      label: "Trigger Workflow",
      description: "Start an automated workflow",
      icon: Workflow,
    },
  ];
  
  // Build response content
  const criteriaList = [];
  if (searchCriteria.titles) criteriaList.push(`**Titles:** ${searchCriteria.titles.join(", ")}`);
  if (searchCriteria.industries) criteriaList.push(`**Industries:** ${searchCriteria.industries.join(", ")}`);
  if (searchCriteria.locations) criteriaList.push(`**Locations:** ${searchCriteria.locations.join(", ")}`);
  if (searchCriteria.companySize) criteriaList.push(`**Company Size:** ${searchCriteria.companySize}`);
  if (searchCriteria.technologies) criteriaList.push(`**Technologies:** ${searchCriteria.technologies.join(", ")}`);
  if (searchCriteria.keywords) criteriaList.push(`**Keywords:** ${searchCriteria.keywords.join(", ")}`);
  
  const content = `I found **${mockResults.length} prospects** matching your criteria:\n\n${criteriaList.join("\n")}\n\nHere are the top results. You can refine your search or take action on these prospects.`;
  
  return {
    id: Date.now().toString(),
    role: "assistant",
    content,
    timestamp: new Date(),
    searchCriteria,
    results: mockResults,
    suggestedActions,
  };
};

export default function ApolloSearchPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      content: "👋 Welcome to Apollo AI Search! I can help you find prospects using natural language. Try asking something like:\n\n• \"Find CTOs at SaaS companies with 50-200 employees\"\n• \"Show me VPs of Sales at manufacturing companies in Texas\"\n• \"Search for marketing directors at healthcare companies\"\n\nWhat kind of prospects are you looking for today?",
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedResults, setSelectedResults] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState("chat");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Apollo connection state
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>("checking");
  const [apolloApiKey, setApolloApiKey] = useState<string>("");
  const [connectionError, setConnectionError] = useState<string>("");
  const [lastChecked, setLastChecked] = useState<Date | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);
  
  // Load Apollo API key from Firebase settings and check connection
  useEffect(() => {
    const loadApolloSettings = async () => {
      setConnectionStatus("checking");
      try {
        if (!db) {
          setConnectionStatus("error");
          setConnectionError("Firebase not initialized");
          return;
        }
        
        const docRef = doc(db, COLLECTIONS.PLATFORM_SETTINGS, "global");
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const data = docSnap.data();
          const apiKey = data?.integrations?.apollo?.apiKey;
          
          if (apiKey && apiKey.trim() !== "") {
            setApolloApiKey(apiKey);
            // Test the connection
            await testApolloConnection(apiKey);
          } else {
            setConnectionStatus("no_key");
            setConnectionError("Apollo API key not configured");
          }
        } else {
          setConnectionStatus("no_key");
          setConnectionError("Settings not found. Configure Apollo in Settings.");
        }
      } catch (error) {
        console.error("Error loading Apollo settings:", error);
        setConnectionStatus("error");
        setConnectionError("Failed to load settings");
      }
    };
    
    loadApolloSettings();
  }, []);
  
  // Test Apollo API connection
  const testApolloConnection = async (apiKey: string) => {
    try {
      const response = await fetch("/api/apollo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "test_connection", apiKey }),
      });
      
      const data = await response.json();
      setLastChecked(new Date());
      
      if (data.connected) {
        setConnectionStatus("connected");
        setConnectionError("");
      } else {
        setConnectionStatus("disconnected");
        setConnectionError(data.error || "Connection failed");
      }
    } catch (error) {
      setConnectionStatus("error");
      setConnectionError("Network error");
    }
  };
  
  // Refresh connection status
  const refreshConnection = () => {
    if (apolloApiKey) {
      setConnectionStatus("checking");
      testApolloConnection(apolloApiKey);
    }
  };

  // Search Apollo API
  const searchApolloAPI = async (searchCriteria: SearchCriteria): Promise<SearchResult[]> => {
    if (!apolloApiKey || connectionStatus !== "connected") {
      return [];
    }

    try {
      const response = await fetch("/api/apollo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "search_people",
          apiKey: apolloApiKey,
          searchParams: {
            titles: searchCriteria.titles || [],
            locations: searchCriteria.locations || [],
            industries: searchCriteria.industries || [],
            keywords: searchCriteria.keywords?.join(" ") || "",
            employee_ranges: searchCriteria.companySize ? [searchCriteria.companySize] : [],
          },
        }),
      });

      const data = await response.json();
      
      if (data.connected && data.results) {
        // Transform Apollo results to our format
        return data.results.map((person: any) => ({
          id: person.id || Math.random().toString(),
          name: `${person.first_name || ""} ${person.last_name || ""}`.trim(),
          title: person.title || "Unknown",
          company: person.organization?.name || "Unknown",
          location: person.city && person.state 
            ? `${person.city}, ${person.state}` 
            : person.country || "Unknown",
          email: person.email || undefined,
          phone: person.phone_numbers?.[0]?.sanitized_number || undefined,
          linkedIn: person.linkedin_url || undefined,
          companySize: person.organization?.estimated_num_employees 
            ? `${person.organization.estimated_num_employees} employees` 
            : undefined,
          industry: person.organization?.industry || undefined,
        }));
      }
      return [];
    } catch (error) {
      console.error("Apollo search error:", error);
      return [];
    }
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content: inputValue,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setIsLoading(true);

    // Check connection status first
    if (connectionStatus === "no_key") {
      const noKeyResponse: ChatMessage = {
        id: Date.now().toString(),
        role: "assistant",
        content: "⚠️ **Apollo API key not configured**\n\nTo search for real prospects, please configure your Apollo API key in the Settings page.\n\nIn the meantime, I'll show you sample results to demonstrate the search functionality.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, noKeyResponse]);
      
      // Still show mock results for demo
      await new Promise((resolve) => setTimeout(resolve, 1000));
      const aiResponse = generateAIResponse(inputValue);
      setMessages((prev) => [...prev, aiResponse]);
      setIsLoading(false);
      return;
    }

    if (connectionStatus === "disconnected" || connectionStatus === "error") {
      const errorResponse: ChatMessage = {
        id: Date.now().toString(),
        role: "assistant",
        content: "❌ **Apollo connection failed**\n\nUnable to connect to Apollo API. Please check your API key in Settings and try again.\n\nShowing sample results for demonstration.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorResponse]);
      
      await new Promise((resolve) => setTimeout(resolve, 1000));
      const aiResponse = generateAIResponse(inputValue);
      setMessages((prev) => [...prev, aiResponse]);
      setIsLoading(false);
      return;
    }

    // Parse the search query
    const mockResponse = generateAIResponse(inputValue);
    
    // If we have a valid connection and search criteria, try real API
    if (connectionStatus === "connected" && mockResponse.searchCriteria) {
      const realResults = await searchApolloAPI(mockResponse.searchCriteria);
      
      if (realResults.length > 0) {
        // Use real results
        const realResponse: ChatMessage = {
          ...mockResponse,
          content: `✅ **Found ${realResults.length} prospects** from Apollo:\n\n${
            mockResponse.searchCriteria.titles ? `**Titles:** ${mockResponse.searchCriteria.titles.join(", ")}\n` : ""
          }${
            mockResponse.searchCriteria.industries ? `**Industries:** ${mockResponse.searchCriteria.industries.join(", ")}\n` : ""
          }${
            mockResponse.searchCriteria.locations ? `**Locations:** ${mockResponse.searchCriteria.locations.join(", ")}\n` : ""
          }\nThese are live results from Apollo. You can refine your search or take action on these prospects.`,
          results: realResults,
        };
        setMessages((prev) => [...prev, realResponse]);
      } else {
        // No results from API, show message
        const noResultsResponse: ChatMessage = {
          id: Date.now().toString(),
          role: "assistant",
          content: "🔍 **No results found**\n\nApollo didn't return any matches for your search criteria. Try:\n\n• Broadening your search terms\n• Using different job titles\n• Expanding the location or industry filters\n\nShowing sample results for reference.",
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, noResultsResponse]);
        
        // Show mock results as fallback
        await new Promise((resolve) => setTimeout(resolve, 500));
        setMessages((prev) => [...prev, mockResponse]);
      }
    } else {
      // Use mock response if no criteria or clarifying questions needed
      await new Promise((resolve) => setTimeout(resolve, 1500));
      setMessages((prev) => [...prev, mockResponse]);
    }
    
    setIsLoading(false);
  };

  const handleSuggestionClick = (suggestion: string) => {
    setInputValue(suggestion);
    inputRef.current?.focus();
  };

  const handleClarifyingQuestionClick = (question: string) => {
    // Extract the key part of the question for the input
    const match = question.match(/\(e\.g\.,\s*([^)]+)\)/);
    if (match) {
      setInputValue(match[1].split(",")[0].trim());
    }
    inputRef.current?.focus();
  };

  const toggleResultSelection = (id: string) => {
    setSelectedResults((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const selectAllResults = (results: SearchResult[]) => {
    setSelectedResults(new Set(results.map((r) => r.id)));
  };

  const clearSelection = () => {
    setSelectedResults(new Set());
  };

  // Get all results from messages
  const allResults = messages
    .filter((m) => m.results)
    .flatMap((m) => m.results || []);

  // Connection status badge component
  const ConnectionStatusBadge = () => {
    const statusConfig = {
      connected: {
        icon: Wifi,
        label: "Connected",
        className: "bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800",
        iconClassName: "text-green-600 dark:text-green-400",
      },
      disconnected: {
        icon: WifiOff,
        label: "Disconnected",
        className: "bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800",
        iconClassName: "text-red-600 dark:text-red-400",
      },
      checking: {
        icon: Loader2,
        label: "Checking...",
        className: "bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-800",
        iconClassName: "text-yellow-600 dark:text-yellow-400 animate-spin",
      },
      error: {
        icon: AlertCircle,
        label: "Error",
        className: "bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800",
        iconClassName: "text-red-600 dark:text-red-400",
      },
      no_key: {
        icon: Link2,
        label: "Not Configured",
        className: "bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700",
        iconClassName: "text-gray-500 dark:text-gray-400",
      },
    };

    const config = statusConfig[connectionStatus];
    const StatusIcon = config.icon;

    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className={cn(
              "flex items-center gap-2 px-3 py-1.5 rounded-full border text-sm font-medium cursor-pointer transition-colors",
              config.className
            )}
            onClick={refreshConnection}
            >
              <StatusIcon className={cn("h-4 w-4", config.iconClassName)} />
              <span>Apollo: {config.label}</span>
              {connectionStatus !== "checking" && (
                <RefreshCw className="h-3 w-3 opacity-50 hover:opacity-100" />
              )}
            </div>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="max-w-xs">
            <div className="space-y-1">
              <p className="font-medium">Apollo API Status</p>
              {connectionError && (
                <p className="text-sm text-muted-foreground">{connectionError}</p>
              )}
              {lastChecked && (
                <p className="text-xs text-muted-foreground">
                  Last checked: {lastChecked.toLocaleTimeString()}
                </p>
              )}
              {connectionStatus === "no_key" && (
                <p className="text-sm">
                  <a href="/portal/settings" className="text-blue-500 hover:underline">
                    Configure Apollo API key in Settings →
                  </a>
                </p>
              )}
              <p className="text-xs text-muted-foreground">Click to refresh</p>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500 to-blue-600">
            <Search className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              Apollo AI Search
              <Badge variant="secondary" className="bg-purple-100 text-purple-700">
                <Sparkles className="h-3 w-3 mr-1" />
                AI Powered
              </Badge>
            </h1>
            <p className="text-sm text-muted-foreground">
              Search for prospects using natural language
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {/* Connection Status Badge */}
          <ConnectionStatusBadge />
          
          {selectedResults.size > 0 && (
            <Badge variant="outline" className="text-sm">
              {selectedResults.size} selected
            </Badge>
          )}
          <Button variant="outline" size="sm">
            <Filter className="h-4 w-4 mr-2" />
            Advanced Filters
          </Button>
          <Button variant="outline" size="sm" asChild>
            <a href="/portal/settings">
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </a>
          </Button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
            <div className="border-b px-4">
              <TabsList className="h-10">
                <TabsTrigger value="chat" className="gap-2">
                  <MessageSquare className="h-4 w-4" />
                  AI Chat
                </TabsTrigger>
                <TabsTrigger value="results" className="gap-2">
                  <Users className="h-4 w-4" />
                  Results ({allResults.length})
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="chat" className="flex-1 flex flex-col m-0 overflow-hidden">
              {/* Messages */}
              <ScrollArea className="flex-1 p-4">
                <div className="space-y-4 max-w-4xl mx-auto">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={cn(
                        "flex gap-3",
                        message.role === "user" ? "justify-end" : "justify-start"
                      )}
                    >
                      {message.role === "assistant" && (
                        <Avatar className="h-8 w-8 shrink-0">
                          <AvatarFallback className="bg-gradient-to-br from-purple-500 to-blue-600 text-white">
                            <Bot className="h-4 w-4" />
                          </AvatarFallback>
                        </Avatar>
                      )}
                      <div
                        className={cn(
                          "rounded-lg p-4 max-w-[80%]",
                          message.role === "user"
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted"
                        )}
                      >
                        <div className="whitespace-pre-wrap text-sm">
                          {message.content.split("**").map((part, i) =>
                            i % 2 === 1 ? (
                              <strong key={i}>{part}</strong>
                            ) : (
                              <span key={i}>{part}</span>
                            )
                          )}
                        </div>

                        {/* Clarifying Questions */}
                        {message.clarifyingQuestions && (
                          <div className="mt-4 space-y-2">
                            {message.clarifyingQuestions.map((question, i) => (
                              <button
                                key={i}
                                onClick={() => handleClarifyingQuestionClick(question)}
                                className="block w-full text-left text-sm p-2 rounded-md bg-background hover:bg-accent transition-colors"
                              >
                                {question}
                              </button>
                            ))}
                          </div>
                        )}

                        {/* Search Results */}
                        {message.results && message.results.length > 0 && (
                          <div className="mt-4 space-y-3">
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-muted-foreground">
                                Showing {message.results.length} results
                              </span>
                              <div className="flex gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => selectAllResults(message.results!)}
                                  className="h-7 text-xs"
                                >
                                  Select All
                                </Button>
                                {selectedResults.size > 0 && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={clearSelection}
                                    className="h-7 text-xs"
                                  >
                                    Clear
                                  </Button>
                                )}
                              </div>
                            </div>
                            {message.results.map((result) => (
                              <div
                                key={result.id}
                                className={cn(
                                  "p-3 rounded-lg bg-background border cursor-pointer transition-all",
                                  selectedResults.has(result.id)
                                    ? "border-primary ring-1 ring-primary"
                                    : "hover:border-primary/50"
                                )}
                                onClick={() => toggleResultSelection(result.id)}
                              >
                                <div className="flex items-start gap-3">
                                  <Avatar className="h-10 w-10">
                                    <AvatarImage src={result.avatar} />
                                    <AvatarFallback>
                                      {result.name
                                        .split(" ")
                                        .map((n) => n[0])
                                        .join("")}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                      <span className="font-medium text-sm">
                                        {result.name}
                                      </span>
                                      {result.linkedIn && (
                                        <ExternalLink className="h-3 w-3 text-muted-foreground" />
                                      )}
                                    </div>
                                    <div className="text-xs text-muted-foreground flex items-center gap-1">
                                      <Briefcase className="h-3 w-3" />
                                      {result.title} at {result.company}
                                    </div>
                                    <div className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                                      <MapPin className="h-3 w-3" />
                                      {result.location}
                                      {result.industry && (
                                        <>
                                          <span className="mx-1">•</span>
                                          {result.industry}
                                        </>
                                      )}
                                    </div>
                                    {(result.email || result.phone) && (
                                      <div className="flex gap-3 mt-2">
                                        {result.email && (
                                          <span className="text-xs text-blue-600 flex items-center gap-1">
                                            <Mail className="h-3 w-3" />
                                            {result.email}
                                          </span>
                                        )}
                                        {result.phone && (
                                          <span className="text-xs text-green-600 flex items-center gap-1">
                                            <Phone className="h-3 w-3" />
                                            {result.phone}
                                          </span>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                  <div
                                    className={cn(
                                      "h-5 w-5 rounded-full border-2 flex items-center justify-center shrink-0",
                                      selectedResults.has(result.id)
                                        ? "bg-primary border-primary"
                                        : "border-muted-foreground/30"
                                    )}
                                  >
                                    {selectedResults.has(result.id) && (
                                      <CheckCircle className="h-4 w-4 text-white" />
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Suggested Actions */}
                        {message.suggestedActions && selectedResults.size > 0 && (
                          <div className="mt-4 pt-4 border-t">
                            <p className="text-xs text-muted-foreground mb-2">
                              Actions for {selectedResults.size} selected prospect(s):
                            </p>
                            <div className="flex flex-wrap gap-2">
                              {message.suggestedActions.map((action) => (
                                <Button
                                  key={action.id}
                                  variant="outline"
                                  size="sm"
                                  className="h-8 text-xs"
                                >
                                  <action.icon className="h-3 w-3 mr-1" />
                                  {action.label}
                                </Button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                      {message.role === "user" && (
                        <Avatar className="h-8 w-8 shrink-0">
                          <AvatarFallback>
                            <User className="h-4 w-4" />
                          </AvatarFallback>
                        </Avatar>
                      )}
                    </div>
                  ))}

                  {isLoading && (
                    <div className="flex gap-3 justify-start">
                      <Avatar className="h-8 w-8 shrink-0">
                        <AvatarFallback className="bg-gradient-to-br from-purple-500 to-blue-600 text-white">
                          <Bot className="h-4 w-4" />
                        </AvatarFallback>
                      </Avatar>
                      <div className="rounded-lg p-4 bg-muted">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Searching Apollo database...
                        </div>
                      </div>
                    </div>
                  )}

                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>

              {/* Search Suggestions */}
              {messages.length === 1 && (
                <div className="px-4 pb-2">
                  <div className="max-w-4xl mx-auto">
                    <p className="text-xs text-muted-foreground mb-2">
                      Try these example searches:
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {searchSuggestions.map((suggestion, i) => (
                        <button
                          key={i}
                          onClick={() => handleSuggestionClick(suggestion)}
                          className="text-xs px-3 py-1.5 rounded-full bg-muted hover:bg-muted/80 transition-colors"
                        >
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Input Area */}
              <div className="p-4 border-t bg-background">
                <div className="max-w-4xl mx-auto">
                  <div className="flex gap-2">
                    <Input
                      ref={inputRef}
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                      placeholder="Describe the prospects you're looking for..."
                      className="flex-1"
                      disabled={isLoading}
                    />
                    <Button onClick={handleSendMessage} disabled={isLoading || !inputValue.trim()}>
                      {isLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="results" className="flex-1 m-0 overflow-hidden">
              <ScrollArea className="h-full p-4">
                <div className="max-w-4xl mx-auto space-y-4">
                  {allResults.length === 0 ? (
                    <div className="text-center py-12">
                      <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <h3 className="text-lg font-medium">No results yet</h3>
                      <p className="text-sm text-muted-foreground">
                        Start a search in the AI Chat tab to find prospects
                      </p>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center justify-between">
                        <h3 className="font-medium">
                          {allResults.length} Prospects Found
                        </h3>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm">
                            <Download className="h-4 w-4 mr-2" />
                            Export
                          </Button>
                          <Button variant="outline" size="sm">
                            <Plus className="h-4 w-4 mr-2" />
                            Add to List
                          </Button>
                        </div>
                      </div>
                      <div className="grid gap-3">
                        {allResults.map((result) => (
                          <Card
                            key={result.id}
                            className={cn(
                              "cursor-pointer transition-all",
                              selectedResults.has(result.id)
                                ? "border-primary ring-1 ring-primary"
                                : "hover:border-primary/50"
                            )}
                            onClick={() => toggleResultSelection(result.id)}
                          >
                            <CardContent className="p-4">
                              <div className="flex items-start gap-4">
                                <Avatar className="h-12 w-12">
                                  <AvatarImage src={result.avatar} />
                                  <AvatarFallback>
                                    {result.name
                                      .split(" ")
                                      .map((n) => n[0])
                                      .join("")}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="flex-1">
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium">{result.name}</span>
                                    <Badge variant="outline" className="text-xs">
                                      {result.industry}
                                    </Badge>
                                  </div>
                                  <p className="text-sm text-muted-foreground">
                                    {result.title} at {result.company}
                                  </p>
                                  <div className="flex items-center gap-4 mt-2 text-sm">
                                    <span className="flex items-center gap-1 text-muted-foreground">
                                      <MapPin className="h-3 w-3" />
                                      {result.location}
                                    </span>
                                    <span className="flex items-center gap-1 text-muted-foreground">
                                      <Building2 className="h-3 w-3" />
                                      {result.companySize}
                                    </span>
                                  </div>
                                  {(result.email || result.phone) && (
                                    <div className="flex gap-4 mt-2">
                                      {result.email && (
                                        <span className="text-sm text-blue-600 flex items-center gap-1">
                                          <Mail className="h-3 w-3" />
                                          {result.email}
                                        </span>
                                      )}
                                      {result.phone && (
                                        <span className="text-sm text-green-600 flex items-center gap-1">
                                          <Phone className="h-3 w-3" />
                                          {result.phone}
                                        </span>
                                      )}
                                    </div>
                                  )}
                                </div>
                                <div className="flex flex-col gap-2">
                                  <Button variant="outline" size="sm">
                                    <Mail className="h-4 w-4" />
                                  </Button>
                                  <Button variant="outline" size="sm">
                                    <Phone className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </div>

        {/* Right Sidebar - Apollo Features */}
        <div className="w-80 border-l bg-muted/30 overflow-hidden flex flex-col">
          <div className="p-4 border-b">
            <h3 className="font-semibold flex items-center gap-2">
              <Zap className="h-4 w-4 text-yellow-500" />
              Apollo Features
            </h3>
            <p className="text-xs text-muted-foreground mt-1">
              Enhance your lead generation workflow
            </p>
          </div>
          <ScrollArea className="flex-1">
            <div className="p-4 space-y-6">
              {/* Prospect & Enrich */}
              <div>
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                  Prospect & Enrich
                </h4>
                <div className="space-y-1">
                  {apolloFeatures.prospectEnrich.map((feature) => (
                    <button
                      key={feature.id}
                      className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-muted transition-colors text-left"
                    >
                      <feature.icon className="h-4 w-4 text-muted-foreground" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{feature.name}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {feature.description}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Engage */}
              <div>
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                  Engage
                </h4>
                <div className="space-y-1">
                  {apolloFeatures.engage.map((feature) => (
                    <button
                      key={feature.id}
                      className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-muted transition-colors text-left"
                    >
                      <feature.icon className="h-4 w-4 text-muted-foreground" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{feature.name}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {feature.description}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Win Deals */}
              <div>
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                  Win Deals
                </h4>
                <div className="space-y-1">
                  {apolloFeatures.winDeals.map((feature) => (
                    <button
                      key={feature.id}
                      className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-muted transition-colors text-left"
                    >
                      <feature.icon className="h-4 w-4 text-muted-foreground" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{feature.name}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {feature.description}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Tools & Automations */}
              <div>
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                  Tools & Automations
                </h4>
                <div className="space-y-1">
                  {apolloFeatures.toolsAutomation.map((feature) => (
                    <button
                      key={feature.id}
                      className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-muted transition-colors text-left"
                    >
                      <feature.icon className="h-4 w-4 text-muted-foreground" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{feature.name}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {feature.description}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Inbound */}
              <div>
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                  Inbound
                </h4>
                <div className="space-y-1">
                  {apolloFeatures.inbound.map((feature) => (
                    <button
                      key={feature.id}
                      className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-muted transition-colors text-left"
                    >
                      <feature.icon className="h-4 w-4 text-muted-foreground" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{feature.name}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {feature.description}
                        </p>
                      </div>
                      {feature.id === "visitors" && (
                        <Badge variant="secondary" className="text-xs bg-green-100 text-green-700">
                          New
                        </Badge>
                      )}
                      {feature.id === "forms" && (
                        <Badge variant="secondary" className="text-xs">
                          Beta
                        </Badge>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Quick Actions Card */}
              <Card className="bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-950/20 dark:to-blue-950/20 border-purple-200 dark:border-purple-800">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-purple-600" />
                    Workflow Recommendations
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <p className="text-xs text-muted-foreground">
                    Based on your search, consider these automations:
                  </p>
                  <div className="space-y-2">
                    <Button variant="outline" size="sm" className="w-full justify-start text-xs h-8">
                      <Play className="h-3 w-3 mr-2 text-green-600" />
                      Create Outreach Sequence
                    </Button>
                    <Button variant="outline" size="sm" className="w-full justify-start text-xs h-8">
                      <Workflow className="h-3 w-3 mr-2 text-blue-600" />
                      Set Up Lead Scoring
                    </Button>
                    <Button variant="outline" size="sm" className="w-full justify-start text-xs h-8">
                      <RefreshCw className="h-3 w-3 mr-2 text-orange-600" />
                      Auto-Enrich New Leads
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </ScrollArea>
        </div>
      </div>
    </div>
  );
}
