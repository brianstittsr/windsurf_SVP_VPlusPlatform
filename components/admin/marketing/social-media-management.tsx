"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar } from "@/components/ui/calendar";
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
  Share2,
  Calendar as CalendarIcon,
  Image as ImageIcon,
  Video,
  FileText,
  TrendingUp,
  Heart,
  MessageCircle,
  Repeat2,
  Eye,
  Users,
  Clock,
  Send,
  Edit,
  Trash2,
  Copy,
  BarChart3,
  Hash,
  Instagram,
  Facebook,
  Twitter,
  Linkedin,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface SocialPost {
  id: string;
  content: string;
  platforms: ("instagram" | "facebook" | "twitter" | "linkedin")[];
  status: "draft" | "scheduled" | "published" | "failed";
  scheduledDate?: Date;
  publishedDate?: Date;
  mediaType?: "image" | "video" | "carousel";
  mediaCount?: number;
  engagement?: {
    likes: number;
    comments: number;
    shares: number;
    views: number;
  };
}

interface ContentLibraryItem {
  id: string;
  type: "image" | "video" | "template";
  name: string;
  url: string;
  tags: string[];
  createdDate: string;
}

export function SocialMediaManagement() {
  const [activeTab, setActiveTab] = useState("calendar");
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [posts, setPosts] = useState<SocialPost[]>([
    {
      id: "1",
      content: "Excited to announce our new EDGE-X™ Manufacturing Intelligence platform! 🚀 #Manufacturing #Industry40",
      platforms: ["linkedin", "twitter"],
      status: "published",
      publishedDate: new Date("2024-12-20"),
      mediaType: "image",
      mediaCount: 1,
      engagement: {
        likes: 245,
        comments: 32,
        shares: 18,
        views: 1250,
      },
    },
    {
      id: "2",
      content: "Join us for our webinar on Digital Twin Solutions next week! Register now 👉 link.com/webinar",
      platforms: ["linkedin", "facebook", "twitter"],
      status: "scheduled",
      scheduledDate: new Date("2024-12-30"),
      mediaType: "image",
      mediaCount: 1,
    },
    {
      id: "3",
      content: "Behind the scenes at our manufacturing facility. See how we're revolutionizing the industry! 🏭",
      platforms: ["instagram", "facebook"],
      status: "draft",
      mediaType: "carousel",
      mediaCount: 5,
    },
  ]);

  const [contentLibrary, setContentLibrary] = useState<ContentLibraryItem[]>([
    {
      id: "1",
      type: "image",
      name: "Product Launch Banner",
      url: "/placeholder.jpg",
      tags: ["product", "launch", "edgex"],
      createdDate: "2024-12-15",
    },
    {
      id: "2",
      type: "video",
      name: "Factory Tour",
      url: "/placeholder.mp4",
      tags: ["facility", "manufacturing", "tour"],
      createdDate: "2024-12-10",
    },
    {
      id: "3",
      type: "image",
      name: "Team Photo",
      url: "/placeholder.jpg",
      tags: ["team", "culture", "people"],
      createdDate: "2024-12-05",
    },
  ]);

  const platformIcons = {
    instagram: Instagram,
    facebook: Facebook,
    twitter: Twitter,
    linkedin: Linkedin,
  };

  const platformColors = {
    instagram: "bg-pink-500",
    facebook: "bg-blue-600",
    twitter: "bg-sky-500",
    linkedin: "bg-blue-700",
  };

  const stats = {
    totalPosts: posts.length,
    scheduled: posts.filter(p => p.status === "scheduled").length,
    published: posts.filter(p => p.status === "published").length,
    totalEngagement: posts.reduce((acc, p) => {
      if (p.engagement) {
        return acc + p.engagement.likes + p.engagement.comments + p.engagement.shares;
      }
      return acc;
    }, 0),
  };

  const getStatusBadge = (status: SocialPost["status"]) => {
    const variants = {
      draft: { variant: "outline" as const, label: "Draft", className: "" },
      scheduled: { variant: "secondary" as const, label: "Scheduled", className: "bg-blue-500 text-white" },
      published: { variant: "default" as const, label: "Published", className: "bg-green-500" },
      failed: { variant: "destructive" as const, label: "Failed", className: "" },
    };
    const config = variants[status];
    return (
      <Badge variant={config.variant} className={config.className}>
        {config.label}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Share2 className="h-6 w-6 text-purple-500" />
            Social Media Management
          </h2>
          <p className="text-muted-foreground">Schedule and manage social media content</p>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button>
              <Send className="h-4 w-4 mr-2" />
              Create Post
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create Social Media Post</DialogTitle>
              <DialogDescription>
                Compose and schedule your post across multiple platforms
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Select Platforms</Label>
                <div className="flex gap-2">
                  {(Object.keys(platformIcons) as Array<keyof typeof platformIcons>).map((platform) => {
                    const Icon = platformIcons[platform];
                    return (
                      <Button
                        key={platform}
                        variant="outline"
                        size="sm"
                        className="flex items-center gap-2"
                      >
                        <Icon className="h-4 w-4" />
                        {platform.charAt(0).toUpperCase() + platform.slice(1)}
                      </Button>
                    );
                  })}
                </div>
              </div>
              <div className="space-y-2">
                <Label>Post Content</Label>
                <Textarea
                  placeholder="What's happening?"
                  rows={6}
                  className="resize-none"
                />
                <p className="text-xs text-muted-foreground">0 / 280 characters</p>
              </div>
              <div className="space-y-2">
                <Label>Add Media</Label>
                <div className="border-2 border-dashed rounded-lg p-8 text-center">
                  <ImageIcon className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">
                    Click to upload or drag and drop
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Images, videos, or GIFs
                  </p>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Schedule</Label>
                <div className="flex gap-2">
                  <Input type="date" className="flex-1" />
                  <Input type="time" className="flex-1" />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline">Save as Draft</Button>
                <Button>Schedule Post</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Posts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalPosts}</div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Scheduled
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.scheduled}</div>
            <p className="text-xs text-muted-foreground">Upcoming posts</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Published
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.published}</div>
            <p className="text-xs text-muted-foreground">Live posts</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Engagement
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalEngagement.toLocaleString()}</div>
            <p className="text-xs text-green-600 flex items-center gap-1">
              <TrendingUp className="h-3 w-3" />
              +15% vs last month
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="calendar">Calendar</TabsTrigger>
          <TabsTrigger value="posts">Posts</TabsTrigger>
          <TabsTrigger value="library">Content Library</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="calendar" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Content Calendar</CardTitle>
                <CardDescription>Drag and drop to reschedule posts</CardDescription>
              </CardHeader>
              <CardContent>
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  className="rounded-md border"
                />
              </CardContent>
            </Card>

            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">
                    {selectedDate?.toLocaleDateString("en-US", {
                      weekday: "long",
                      month: "long",
                      day: "numeric",
                    })}
                  </CardTitle>
                  <CardDescription>Scheduled posts for this day</CardDescription>
                </CardHeader>
                <CardContent>
                  {posts
                    .filter(
                      (p) =>
                        p.scheduledDate &&
                        p.scheduledDate.toDateString() === selectedDate?.toDateString()
                    )
                    .map((post) => (
                      <div key={post.id} className="border rounded-lg p-3 mb-3">
                        <div className="flex items-start gap-2 mb-2">
                          {post.platforms.map((platform) => {
                            const Icon = platformIcons[platform];
                            return (
                              <div
                                key={platform}
                                className={`${platformColors[platform]} p-1 rounded`}
                              >
                                <Icon className="h-3 w-3 text-white" />
                              </div>
                            );
                          })}
                        </div>
                        <p className="text-sm line-clamp-2">{post.content}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <Clock className="h-3 w-3 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">
                            {post.scheduledDate?.toLocaleTimeString("en-US", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                      </div>
                    ))}
                  {posts.filter(
                    (p) =>
                      p.scheduledDate &&
                      p.scheduledDate.toDateString() === selectedDate?.toDateString()
                  ).length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No posts scheduled for this day
                    </p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Best Times to Post</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">LinkedIn</span>
                    <span className="font-medium">Tue-Thu, 9-11 AM</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Facebook</span>
                    <span className="font-medium">Wed-Fri, 1-3 PM</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Instagram</span>
                    <span className="font-medium">Mon-Fri, 11 AM-1 PM</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Twitter</span>
                    <span className="font-medium">Mon-Fri, 8-10 AM</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="posts" className="space-y-4">
          <div className="flex items-center gap-2">
            <Select defaultValue="all">
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Posts</SelectItem>
                <SelectItem value="draft">Drafts</SelectItem>
                <SelectItem value="scheduled">Scheduled</SelectItem>
                <SelectItem value="published">Published</SelectItem>
              </SelectContent>
            </Select>
            <Select defaultValue="all">
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by platform" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Platforms</SelectItem>
                <SelectItem value="instagram">Instagram</SelectItem>
                <SelectItem value="facebook">Facebook</SelectItem>
                <SelectItem value="twitter">Twitter</SelectItem>
                <SelectItem value="linkedin">LinkedIn</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-4">
            {posts.map((post) => (
              <Card key={post.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-2">
                        {getStatusBadge(post.status)}
                        <div className="flex items-center gap-1">
                          {post.platforms.map((platform) => {
                            const Icon = platformIcons[platform];
                            return (
                              <div
                                key={platform}
                                className={`${platformColors[platform]} p-1 rounded`}
                              >
                                <Icon className="h-3 w-3 text-white" />
                              </div>
                            );
                          })}
                        </div>
                        {post.mediaType && (
                          <Badge variant="outline" className="text-xs">
                            {post.mediaType === "image" && <ImageIcon className="h-3 w-3 mr-1" />}
                            {post.mediaType === "video" && <Video className="h-3 w-3 mr-1" />}
                            {post.mediaType === "carousel" && (
                              <FileText className="h-3 w-3 mr-1" />
                            )}
                            {post.mediaCount && `${post.mediaCount} ${post.mediaType}`}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm">{post.content}</p>
                      {post.scheduledDate && (
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          Scheduled for{" "}
                          {post.scheduledDate.toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </div>
                      )}
                      {post.publishedDate && (
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <CheckCircle2 className="h-3 w-3" />
                          Published on{" "}
                          {post.publishedDate.toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                          })}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="icon">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon">
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="text-destructive">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                {post.engagement && (
                  <CardContent>
                    <div className="grid grid-cols-4 gap-4">
                      <div className="flex items-center gap-2">
                        <Heart className="h-4 w-4 text-red-500" />
                        <div>
                          <p className="text-sm font-semibold">
                            {post.engagement.likes.toLocaleString()}
                          </p>
                          <p className="text-xs text-muted-foreground">Likes</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <MessageCircle className="h-4 w-4 text-blue-500" />
                        <div>
                          <p className="text-sm font-semibold">
                            {post.engagement.comments.toLocaleString()}
                          </p>
                          <p className="text-xs text-muted-foreground">Comments</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Repeat2 className="h-4 w-4 text-green-500" />
                        <div>
                          <p className="text-sm font-semibold">
                            {post.engagement.shares.toLocaleString()}
                          </p>
                          <p className="text-xs text-muted-foreground">Shares</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Eye className="h-4 w-4 text-purple-500" />
                        <div>
                          <p className="text-sm font-semibold">
                            {post.engagement.views.toLocaleString()}
                          </p>
                          <p className="text-xs text-muted-foreground">Views</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                )}
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="library" className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Select defaultValue="all">
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Media</SelectItem>
                  <SelectItem value="image">Images</SelectItem>
                  <SelectItem value="video">Videos</SelectItem>
                  <SelectItem value="template">Templates</SelectItem>
                </SelectContent>
              </Select>
              <Input placeholder="Search by tags..." className="w-[200px]" />
            </div>
            <Button>
              <ImageIcon className="h-4 w-4 mr-2" />
              Upload Media
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {contentLibrary.map((item) => (
              <Card key={item.id} className="overflow-hidden">
                <div className="aspect-video bg-muted flex items-center justify-center">
                  {item.type === "image" && <ImageIcon className="h-12 w-12 text-muted-foreground" />}
                  {item.type === "video" && <Video className="h-12 w-12 text-muted-foreground" />}
                  {item.type === "template" && <FileText className="h-12 w-12 text-muted-foreground" />}
                </div>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">{item.name}</CardTitle>
                  <CardDescription className="text-xs">
                    {new Date(item.createdDate).toLocaleDateString()}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-1 mb-3">
                    {item.tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        <Hash className="h-3 w-3 mr-1" />
                        {tag}
                      </Badge>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" className="flex-1">
                      <Send className="h-3 w-3 mr-1" />
                      Use
                    </Button>
                    <Button size="sm" variant="ghost" className="px-2">
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Platform Performance</CardTitle>
                <CardDescription>Last 30 days</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  { platform: "LinkedIn", followers: 2450, growth: 15, engagement: 8.5 },
                  { platform: "Facebook", followers: 3820, growth: 8, engagement: 5.2 },
                  { platform: "Instagram", followers: 1890, growth: 22, engagement: 12.8 },
                  { platform: "Twitter", followers: 1250, growth: 5, engagement: 3.9 },
                ].map((data) => (
                  <div key={data.platform} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="font-medium">{data.platform}</div>
                        <Badge variant="outline" className="text-xs">
                          +{data.growth}%
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {data.followers.toLocaleString()} followers
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">Engagement Rate</span>
                        <span>{data.engagement}%</span>
                      </div>
                      <Progress value={data.engagement * 10} />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Top Performing Posts</CardTitle>
                <CardDescription>By engagement rate</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {posts
                  .filter((p) => p.engagement)
                  .sort((a, b) => {
                    const aTotal =
                      (a.engagement?.likes || 0) +
                      (a.engagement?.comments || 0) +
                      (a.engagement?.shares || 0);
                    const bTotal =
                      (b.engagement?.likes || 0) +
                      (b.engagement?.comments || 0) +
                      (b.engagement?.shares || 0);
                    return bTotal - aTotal;
                  })
                  .map((post) => {
                    const total =
                      (post.engagement?.likes || 0) +
                      (post.engagement?.comments || 0) +
                      (post.engagement?.shares || 0);
                    return (
                      <div key={post.id} className="border rounded-lg p-3">
                        <p className="text-sm line-clamp-2 mb-2">{post.content}</p>
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2">
                            {post.platforms.map((platform) => {
                              const Icon = platformIcons[platform];
                              return (
                                <div
                                  key={platform}
                                  className={`${platformColors[platform]} p-1 rounded`}
                                >
                                  <Icon className="h-3 w-3 text-white" />
                                </div>
                              );
                            })}
                          </div>
                          <span className="font-semibold">{total} engagements</span>
                        </div>
                      </div>
                    );
                  })}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Hashtag Performance</CardTitle>
                <CardDescription>Most effective hashtags</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {[
                  { tag: "Manufacturing", reach: 12500, engagement: 850 },
                  { tag: "Industry40", reach: 8900, engagement: 620 },
                  { tag: "DigitalTwin", reach: 6700, engagement: 480 },
                  { tag: "SmartFactory", reach: 5200, engagement: 390 },
                ].map((hashtag) => (
                  <div key={hashtag.tag} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm">#{hashtag.tag}</p>
                      <p className="text-xs text-muted-foreground">
                        {hashtag.reach.toLocaleString()} reach
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-sm">{hashtag.engagement}</p>
                      <p className="text-xs text-muted-foreground">engagements</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Follower Growth</CardTitle>
                <CardDescription>Monthly trend</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {[
                  { month: "December", total: 9410, growth: 450 },
                  { month: "November", total: 8960, growth: 380 },
                  { month: "October", total: 8580, growth: 520 },
                  { month: "September", total: 8060, growth: 290 },
                ].map((data) => (
                  <div key={data.month} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{data.month}</p>
                      <p className="text-sm text-muted-foreground">
                        {data.total.toLocaleString()} followers
                      </p>
                    </div>
                    <Badge className="bg-green-500">+{data.growth}</Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
