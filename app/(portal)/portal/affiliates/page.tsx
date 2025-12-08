import { Metadata } from "next";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Plus,
  Search,
  MapPin,
  Star,
  CheckCircle,
  Clock,
  Mail,
  Phone,
  Linkedin,
  MoreHorizontal,
  Users,
  Award,
  Briefcase,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Affiliates",
  description: "Manage your affiliate network and capabilities",
};

const affiliates = [
  {
    id: "1",
    name: "John Smith",
    title: "Lean Manufacturing Consultant",
    avatar: "/avatars/john-smith.jpg",
    initials: "JS",
    location: "Detroit, MI",
    availability: "available",
    rating: 4.9,
    projectsCompleted: 24,
    capabilities: ["Lean Manufacturing", "IATF 16949", "Value Stream Mapping", "5S"],
    certifications: ["IATF Lead Auditor", "Six Sigma Black Belt"],
    email: "john.smith@email.com",
    phone: "(555) 123-4567",
  },
  {
    id: "2",
    name: "Jane Doe",
    title: "Quality Systems Specialist",
    avatar: "/avatars/jane-doe.jpg",
    initials: "JD",
    location: "Cleveland, OH",
    availability: "partial",
    rating: 4.8,
    projectsCompleted: 18,
    capabilities: ["ISO 9001", "AS9100", "QMS Implementation", "Internal Auditing"],
    certifications: ["ISO 9001 Lead Auditor", "CQE"],
    email: "jane.doe@email.com",
    phone: "(555) 234-5678",
  },
  {
    id: "3",
    name: "Robert Chen",
    title: "Automation Engineer",
    avatar: "/avatars/robert-chen.jpg",
    initials: "RC",
    location: "Chicago, IL",
    availability: "available",
    rating: 4.7,
    projectsCompleted: 15,
    capabilities: ["Industrial Automation", "PLC Programming", "Robotics", "SCADA"],
    certifications: ["Certified Automation Professional"],
    email: "robert.chen@email.com",
    phone: "(555) 345-6789",
  },
  {
    id: "4",
    name: "Maria Garcia",
    title: "Supply Chain Consultant",
    avatar: "/avatars/maria-garcia.jpg",
    initials: "MG",
    location: "Houston, TX",
    availability: "unavailable",
    rating: 4.9,
    projectsCompleted: 31,
    capabilities: ["Supply Chain Optimization", "Reshoring", "Vendor Management", "Logistics"],
    certifications: ["CSCP", "CPIM"],
    email: "maria.garcia@email.com",
    phone: "(555) 456-7890",
  },
  {
    id: "5",
    name: "David Wilson",
    title: "Digital Transformation Lead",
    avatar: "/avatars/david-wilson.jpg",
    initials: "DW",
    location: "Atlanta, GA",
    availability: "available",
    rating: 4.6,
    projectsCompleted: 12,
    capabilities: ["Industry 4.0", "MES Implementation", "IoT", "Data Analytics"],
    certifications: ["AWS Solutions Architect", "PMP"],
    email: "david.wilson@email.com",
    phone: "(555) 567-8901",
  },
  {
    id: "6",
    name: "Sarah Johnson",
    title: "Workforce Development Specialist",
    avatar: "/avatars/sarah-johnson.jpg",
    initials: "SJ",
    location: "Nashville, TN",
    availability: "partial",
    rating: 4.8,
    projectsCompleted: 20,
    capabilities: ["Training Development", "Skills Assessment", "Leadership Coaching", "Change Management"],
    certifications: ["CPTD", "PHR"],
    email: "sarah.johnson@email.com",
    phone: "(555) 678-9012",
  },
];

const capabilities = [
  "All Capabilities",
  "Lean Manufacturing",
  "ISO 9001",
  "Automation",
  "Supply Chain",
  "Digital Transformation",
  "Workforce Development",
];

function getAvailabilityBadge(availability: string) {
  switch (availability) {
    case "available":
      return <Badge className="bg-green-100 text-green-800">Available</Badge>;
    case "partial":
      return <Badge className="bg-yellow-100 text-yellow-800">Partial</Badge>;
    case "unavailable":
      return <Badge className="bg-red-100 text-red-800">Unavailable</Badge>;
    default:
      return <Badge variant="secondary">Unknown</Badge>;
  }
}

export default function AffiliatesPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Affiliates</h1>
          <p className="text-muted-foreground">
            Your network of expert consultants and specialists
          </p>
        </div>
        <Button asChild>
          <Link href="/portal/affiliates/new">
            <Plus className="mr-2 h-4 w-4" />
            Add Affiliate
          </Link>
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Affiliates</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{affiliates.length}</div>
            <p className="text-xs text-muted-foreground">In your network</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Available Now</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {affiliates.filter((a) => a.availability === "available").length}
            </div>
            <p className="text-xs text-muted-foreground">Ready for projects</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Avg. Rating</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold flex items-center gap-1">
              4.8
              <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
            </div>
            <p className="text-xs text-muted-foreground">Across all affiliates</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Projects Completed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {affiliates.reduce((sum, a) => sum + a.projectsCompleted, 0)}
            </div>
            <p className="text-xs text-muted-foreground">Total by network</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Search affiliates..." className="pl-9" />
            </div>
            <Select defaultValue="All Capabilities">
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue placeholder="Capability" />
              </SelectTrigger>
              <SelectContent>
                {capabilities.map((cap) => (
                  <SelectItem key={cap} value={cap}>
                    {cap}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select defaultValue="all">
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Availability" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="available">Available</SelectItem>
                <SelectItem value="partial">Partial</SelectItem>
                <SelectItem value="unavailable">Unavailable</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Affiliate Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {affiliates.map((affiliate) => (
          <Card key={affiliate.id} className="overflow-hidden">
            <CardHeader className="pb-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <Avatar className="h-14 w-14">
                    <AvatarImage src={affiliate.avatar} />
                    <AvatarFallback className="bg-primary/10 text-primary text-lg">
                      {affiliate.initials}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle className="text-lg">
                      <Link href={`/portal/affiliates/${affiliate.id}`} className="hover:underline">
                        {affiliate.name}
                      </Link>
                    </CardTitle>
                    <CardDescription>{affiliate.title}</CardDescription>
                  </div>
                </div>
                {getAvailabilityBadge(affiliate.availability)}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Location & Rating */}
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-1 text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  {affiliate.location}
                </div>
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                  <span className="font-medium">{affiliate.rating}</span>
                  <span className="text-muted-foreground">
                    ({affiliate.projectsCompleted} projects)
                  </span>
                </div>
              </div>

              {/* Capabilities */}
              <div>
                <p className="text-xs text-muted-foreground mb-2">Capabilities</p>
                <div className="flex flex-wrap gap-1">
                  {affiliate.capabilities.slice(0, 3).map((cap) => (
                    <Badge key={cap} variant="secondary" className="text-xs">
                      {cap}
                    </Badge>
                  ))}
                  {affiliate.capabilities.length > 3 && (
                    <Badge variant="outline" className="text-xs">
                      +{affiliate.capabilities.length - 3} more
                    </Badge>
                  )}
                </div>
              </div>

              {/* Certifications */}
              <div>
                <p className="text-xs text-muted-foreground mb-2">Certifications</p>
                <div className="flex flex-wrap gap-1">
                  {affiliate.certifications.map((cert) => (
                    <Badge key={cert} variant="outline" className="text-xs bg-primary/5">
                      <Award className="h-3 w-3 mr-1" />
                      {cert}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-2">
                <Button variant="outline" size="sm" className="flex-1" asChild>
                  <Link href={`/portal/affiliates/${affiliate.id}`}>View Profile</Link>
                </Button>
                <Button size="sm" className="flex-1">Request</Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
