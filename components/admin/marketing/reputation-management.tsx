"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Star,
  ThumbsUp,
  MessageSquare,
  Send,
  Sparkles,
  Copy,
  Check,
  ExternalLink,
  TrendingUp,
  AlertCircle,
  Mail,
  Smartphone,
  QrCode,
  Gift,
} from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface Review {
  id: string;
  platform: "google" | "yelp" | "facebook";
  author: string;
  rating: number;
  text: string;
  date: string;
  responded: boolean;
  response?: string;
}

interface ReviewTemplate {
  id: string;
  name: string;
  category: "positive" | "neutral" | "negative";
  template: string;
}

export function ReputationManagement() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [reviews, setReviews] = useState<Review[]>([
    {
      id: "1",
      platform: "google",
      author: "John Smith",
      rating: 5,
      text: "Excellent service! The team was professional and delivered exactly what we needed.",
      date: "2024-12-20",
      responded: true,
      response: "Thank you for your kind words, John! We're thrilled to hear about your positive experience.",
    },
    {
      id: "2",
      platform: "google",
      author: "Sarah Johnson",
      rating: 4,
      text: "Great quality work, though delivery took a bit longer than expected.",
      date: "2024-12-18",
      responded: false,
    },
    {
      id: "3",
      platform: "yelp",
      author: "Mike Davis",
      rating: 5,
      text: "Outstanding results! Highly recommend their services.",
      date: "2024-12-15",
      responded: true,
      response: "We appreciate your recommendation, Mike! Thank you for choosing us.",
    },
  ]);

  const [templates, setTemplates] = useState<ReviewTemplate[]>([
    {
      id: "1",
      name: "Positive Response",
      category: "positive",
      template: "Thank you so much for your wonderful review! We're thrilled to hear about your positive experience with [SERVICE]. Your feedback means the world to us, and we look forward to serving you again!",
    },
    {
      id: "2",
      name: "Neutral Response",
      category: "neutral",
      template: "Thank you for taking the time to share your feedback. We appreciate your comments about [TOPIC] and are always working to improve our services. We'd love to discuss your experience further - please feel free to reach out to us directly.",
    },
    {
      id: "3",
      name: "Negative Response",
      category: "negative",
      template: "We sincerely apologize for your experience. This is not the level of service we strive to provide. We'd like to make this right - please contact us at [CONTACT] so we can address your concerns directly and find a solution.",
    },
  ]);

  const [selectedReview, setSelectedReview] = useState<Review | null>(null);
  const [responseText, setResponseText] = useState("");
  const [aiSuggestion, setAiSuggestion] = useState("");
  const [copiedTemplate, setCopiedTemplate] = useState<string | null>(null);

  const generateAiResponse = (review: Review) => {
    const suggestions = {
      5: `Thank you so much for your ${review.rating}-star review, ${review.author}! We're absolutely delighted to hear about your positive experience. Your feedback motivates our team to continue delivering exceptional service. We look forward to working with you again!`,
      4: `Thank you for your review, ${review.author}! We're glad you had a positive experience overall. We appreciate your feedback and are always working to improve. If there's anything we can do to make your next experience even better, please don't hesitate to reach out.`,
      3: `Thank you for taking the time to share your feedback, ${review.author}. We appreciate your honest review and would love to learn more about your experience. Please feel free to contact us directly so we can address any concerns and improve our service.`,
      2: `We're sorry to hear that your experience didn't meet expectations, ${review.author}. Your feedback is important to us, and we'd like to make things right. Please contact us at your earliest convenience so we can discuss your concerns and find a solution.`,
      1: `We sincerely apologize for your disappointing experience, ${review.author}. This is not the standard of service we aim to provide. We take your feedback very seriously and would like to speak with you directly to resolve this matter. Please contact us immediately.`,
    };
    return suggestions[review.rating as keyof typeof suggestions] || suggestions[3];
  };

  const handleGenerateAi = (review: Review) => {
    const suggestion = generateAiResponse(review);
    setAiSuggestion(suggestion);
    setResponseText(suggestion);
  };

  const handleCopyTemplate = (template: string, id: string) => {
    navigator.clipboard.writeText(template);
    setCopiedTemplate(id);
    setTimeout(() => setCopiedTemplate(null), 2000);
  };

  const stats = {
    totalReviews: reviews.length,
    averageRating: (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1),
    responseRate: ((reviews.filter(r => r.responded).length / reviews.length) * 100).toFixed(0),
    pendingResponses: reviews.filter(r => !r.responded).length,
  };

  const platformStats = {
    google: reviews.filter(r => r.platform === "google").length,
    yelp: reviews.filter(r => r.platform === "yelp").length,
    facebook: reviews.filter(r => r.platform === "facebook").length,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Star className="h-6 w-6 text-yellow-500" />
            Reputation Management
          </h2>
          <p className="text-muted-foreground">Monitor and manage your online reviews</p>
        </div>
        <Button>
          <ExternalLink className="h-4 w-4 mr-2" />
          Connect Platform
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Reviews
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalReviews}</div>
            <p className="text-xs text-muted-foreground">Across all platforms</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Average Rating
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold flex items-center gap-1">
              {stats.averageRating}
              <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
            </div>
            <p className="text-xs text-muted-foreground">Out of 5.0</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Response Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.responseRate}%</div>
            <Progress value={Number(stats.responseRate)} className="mt-2" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pending
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats.pendingResponses}</div>
            <p className="text-xs text-muted-foreground">Awaiting response</p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="reviews">Reviews</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="generation">Generation</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Platform Distribution</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-blue-500" />
                    <span className="text-sm">Google</span>
                  </div>
                  <Badge variant="secondary">{platformStats.google}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500" />
                    <span className="text-sm">Yelp</span>
                  </div>
                  <Badge variant="secondary">{platformStats.yelp}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-indigo-500" />
                    <span className="text-sm">Facebook</span>
                  </div>
                  <Badge variant="secondary">{platformStats.facebook}</Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Rating Breakdown</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {[5, 4, 3, 2, 1].map((rating) => {
                  const count = reviews.filter(r => r.rating === rating).length;
                  const percentage = (count / reviews.length) * 100;
                  return (
                    <div key={rating} className="flex items-center gap-2">
                      <span className="text-sm w-8">{rating}★</span>
                      <Progress value={percentage} className="flex-1" />
                      <span className="text-sm text-muted-foreground w-8">{count}</span>
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-start gap-2 text-sm">
                    <Star className="h-4 w-4 text-yellow-500 mt-0.5" />
                    <div>
                      <p className="font-medium">New 5-star review</p>
                      <p className="text-muted-foreground text-xs">2 hours ago</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2 text-sm">
                    <MessageSquare className="h-4 w-4 text-blue-500 mt-0.5" />
                    <div>
                      <p className="font-medium">Response sent</p>
                      <p className="text-muted-foreground text-xs">5 hours ago</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2 text-sm">
                    <AlertCircle className="h-4 w-4 text-orange-500 mt-0.5" />
                    <div>
                      <p className="font-medium">Review needs attention</p>
                      <p className="text-muted-foreground text-xs">1 day ago</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="reviews" className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Select defaultValue="all">
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by platform" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Platforms</SelectItem>
                  <SelectItem value="google">Google</SelectItem>
                  <SelectItem value="yelp">Yelp</SelectItem>
                  <SelectItem value="facebook">Facebook</SelectItem>
                </SelectContent>
              </Select>
              <Select defaultValue="all">
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Reviews</SelectItem>
                  <SelectItem value="pending">Pending Response</SelectItem>
                  <SelectItem value="responded">Responded</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-4">
            {reviews.map((review) => (
              <Card key={review.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-base">{review.author}</CardTitle>
                        <Badge variant="outline" className="capitalize">
                          {review.platform}
                        </Badge>
                        {review.responded ? (
                          <Badge className="bg-green-500">Responded</Badge>
                        ) : (
                          <Badge variant="secondary">Pending</Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={`h-4 w-4 ${
                              i < review.rating
                                ? "text-yellow-500 fill-yellow-500"
                                : "text-gray-300"
                            }`}
                          />
                        ))}
                        <span className="text-sm text-muted-foreground ml-2">
                          {review.date}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm">{review.text}</p>
                  {review.response && (
                    <div className="bg-muted p-3 rounded-lg">
                      <p className="text-sm font-medium mb-1">Your Response:</p>
                      <p className="text-sm text-muted-foreground">{review.response}</p>
                    </div>
                  )}
                  {!review.responded && (
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          size="sm"
                          onClick={() => {
                            setSelectedReview(review);
                            setResponseText("");
                            setAiSuggestion("");
                          }}
                        >
                          <MessageSquare className="h-4 w-4 mr-2" />
                          Respond
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl">
                        <DialogHeader>
                          <DialogTitle>Respond to Review</DialogTitle>
                          <DialogDescription>
                            Craft a professional response to {review.author}'s review
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div className="bg-muted p-4 rounded-lg">
                            <div className="flex items-center gap-1 mb-2">
                              {Array.from({ length: 5 }).map((_, i) => (
                                <Star
                                  key={i}
                                  className={`h-4 w-4 ${
                                    i < review.rating
                                      ? "text-yellow-500 fill-yellow-500"
                                      : "text-gray-300"
                                  }`}
                                />
                              ))}
                            </div>
                            <p className="text-sm">{review.text}</p>
                          </div>
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <Label>Your Response</Label>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleGenerateAi(review)}
                              >
                                <Sparkles className="h-4 w-4 mr-2" />
                                AI Suggest
                              </Button>
                            </div>
                            <Textarea
                              value={responseText}
                              onChange={(e) => setResponseText(e.target.value)}
                              placeholder="Write your response here..."
                              rows={6}
                            />
                          </div>
                          <div className="flex justify-end gap-2">
                            <Button variant="outline">Cancel</Button>
                            <Button>
                              <Send className="h-4 w-4 mr-2" />
                              Send Response
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="templates" className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Pre-built response templates for quick replies
            </p>
            <Button>
              <MessageSquare className="h-4 w-4 mr-2" />
              New Template
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {templates.map((template) => (
              <Card key={template.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">{template.name}</CardTitle>
                    <Badge
                      variant={
                        template.category === "positive"
                          ? "default"
                          : template.category === "neutral"
                          ? "secondary"
                          : "destructive"
                      }
                    >
                      {template.category}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-muted-foreground">{template.template}</p>
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full"
                    onClick={() => handleCopyTemplate(template.template, template.id)}
                  >
                    {copiedTemplate === template.id ? (
                      <>
                        <Check className="h-4 w-4 mr-2" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4 mr-2" />
                        Copy Template
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="generation" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="h-5 w-5" />
                  Email Review Requests
                </CardTitle>
                <CardDescription>
                  Automated email campaigns to request reviews from customers
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Campaign Name</Label>
                  <Input placeholder="e.g., Post-Service Review Request" />
                </div>
                <div className="space-y-2">
                  <Label>Send After</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select timing" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 day after service</SelectItem>
                      <SelectItem value="3">3 days after service</SelectItem>
                      <SelectItem value="7">1 week after service</SelectItem>
                      <SelectItem value="14">2 weeks after service</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button className="w-full">
                  <Mail className="h-4 w-4 mr-2" />
                  Create Campaign
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Smartphone className="h-5 w-5" />
                  SMS Review Requests
                </CardTitle>
                <CardDescription>
                  Text message campaigns for quick review requests
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Message Template</Label>
                  <Textarea
                    placeholder="Hi {name}! Thanks for choosing us. We'd love to hear about your experience. Leave us a review: {link}"
                    rows={4}
                  />
                </div>
                <Button className="w-full">
                  <Smartphone className="h-4 w-4 mr-2" />
                  Create SMS Campaign
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <QrCode className="h-5 w-5" />
                  QR Code Generator
                </CardTitle>
                <CardDescription>
                  Generate QR codes for in-store review requests
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Review Platform</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select platform" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="google">Google Reviews</SelectItem>
                      <SelectItem value="yelp">Yelp</SelectItem>
                      <SelectItem value="facebook">Facebook</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="bg-muted h-48 rounded-lg flex items-center justify-center">
                  <QrCode className="h-24 w-24 text-muted-foreground" />
                </div>
                <Button className="w-full">
                  <QrCode className="h-4 w-4 mr-2" />
                  Generate QR Code
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Gift className="h-5 w-5" />
                  Review Incentives
                </CardTitle>
                <CardDescription>
                  Track incentive programs for customer reviews
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Incentive Type</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select incentive" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="discount">Discount Code</SelectItem>
                      <SelectItem value="gift">Free Gift</SelectItem>
                      <SelectItem value="entry">Contest Entry</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Incentive Value</Label>
                  <Input placeholder="e.g., 10% off next purchase" />
                </div>
                <Button className="w-full">
                  <Gift className="h-4 w-4 mr-2" />
                  Create Incentive
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
