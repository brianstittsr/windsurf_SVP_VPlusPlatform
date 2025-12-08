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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Plus,
  Search,
  Filter,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  ArrowUpDown,
  Building,
  Calendar,
  DollarSign,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Opportunities",
  description: "Manage your sales pipeline and opportunities",
};

const opportunities = [
  {
    id: "1",
    name: "ABC Manufacturing",
    company: "ABC Manufacturing Inc.",
    stage: "Proposal",
    value: 85000,
    probability: 60,
    expectedClose: "2025-01-15",
    owner: { name: "John Doe", avatar: "/avatars/john.jpg", initials: "JD" },
    services: ["ISO Certification", "Lean Manufacturing"],
    lastActivity: "3 days ago",
  },
  {
    id: "2",
    name: "XYZ Industries Expansion",
    company: "XYZ Industries",
    stage: "Discovery",
    value: 120000,
    probability: 30,
    expectedClose: "2025-02-28",
    owner: { name: "Sarah Williams", avatar: "/avatars/sarah.jpg", initials: "SW" },
    services: ["Digital Transformation", "Automation"],
    lastActivity: "Today",
  },
  {
    id: "3",
    name: "123 Components ISO",
    company: "123 Components LLC",
    stage: "Contract",
    value: 45000,
    probability: 90,
    expectedClose: "2025-01-10",
    owner: { name: "Mike Roberts", avatar: "/avatars/mike.jpg", initials: "MR" },
    services: ["ISO 9001"],
    lastActivity: "1 day ago",
  },
  {
    id: "4",
    name: "Precision Parts Qualification",
    company: "Precision Parts Co",
    stage: "Negotiation",
    value: 95000,
    probability: 75,
    expectedClose: "2025-01-20",
    owner: { name: "John Doe", avatar: "/avatars/john.jpg", initials: "JD" },
    services: ["Supplier Readiness", "Quality Systems"],
    lastActivity: "5 days ago",
  },
  {
    id: "5",
    name: "TechForm Digital Twin",
    company: "TechForm Industries",
    stage: "Lead",
    value: 150000,
    probability: 10,
    expectedClose: "2025-03-31",
    owner: { name: "Sarah Williams", avatar: "/avatars/sarah.jpg", initials: "SW" },
    services: ["TwinEDGE", "Process Simulation"],
    lastActivity: "1 week ago",
  },
];

const stages = ["All Stages", "Lead", "Discovery", "Proposal", "Negotiation", "Contract"];

function getStageColor(stage: string) {
  const colors: Record<string, string> = {
    Lead: "bg-gray-100 text-gray-800",
    Discovery: "bg-blue-100 text-blue-800",
    Proposal: "bg-yellow-100 text-yellow-800",
    Negotiation: "bg-orange-100 text-orange-800",
    Contract: "bg-green-100 text-green-800",
  };
  return colors[stage] || "bg-gray-100 text-gray-800";
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
  }).format(value);
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function OpportunitiesPage() {
  const totalValue = opportunities.reduce((sum, opp) => sum + opp.value, 0);
  const weightedValue = opportunities.reduce(
    (sum, opp) => sum + opp.value * (opp.probability / 100),
    0
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Opportunities</h1>
          <p className="text-muted-foreground">
            Manage your sales pipeline and track deal progress
          </p>
        </div>
        <Button asChild>
          <Link href="/portal/opportunities/new">
            <Plus className="mr-2 h-4 w-4" />
            New Opportunity
          </Link>
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Pipeline</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalValue)}</div>
            <p className="text-xs text-muted-foreground">{opportunities.length} opportunities</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Weighted Value</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(weightedValue)}</div>
            <p className="text-xs text-muted-foreground">Based on probability</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Closing This Month</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3</div>
            <p className="text-xs text-muted-foreground">{formatCurrency(225000)} potential</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Win Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">68%</div>
            <p className="text-xs text-muted-foreground">Last 90 days</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Search opportunities..." className="pl-9" />
            </div>
            <Select defaultValue="All Stages">
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Stage" />
              </SelectTrigger>
              <SelectContent>
                {stages.map((stage) => (
                  <SelectItem key={stage} value={stage}>
                    {stage}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select defaultValue="all">
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Owner" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Owners</SelectItem>
                <SelectItem value="john">John Doe</SelectItem>
                <SelectItem value="sarah">Sarah Williams</SelectItem>
                <SelectItem value="mike">Mike Roberts</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Opportunity</TableHead>
                <TableHead>Stage</TableHead>
                <TableHead>Value</TableHead>
                <TableHead>Probability</TableHead>
                <TableHead>Expected Close</TableHead>
                <TableHead>Owner</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {opportunities.map((opp) => (
                <TableRow key={opp.id}>
                  <TableCell>
                    <div>
                      <Link
                        href={`/portal/opportunities/${opp.id}`}
                        className="font-medium hover:underline"
                      >
                        {opp.name}
                      </Link>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Building className="h-3 w-3" />
                        {opp.company}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={getStageColor(opp.stage)}>{opp.stage}</Badge>
                  </TableCell>
                  <TableCell className="font-medium">{formatCurrency(opp.value)}</TableCell>
                  <TableCell>{opp.probability}%</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 text-sm">
                      <Calendar className="h-3 w-3 text-muted-foreground" />
                      {formatDate(opp.expectedClose)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={opp.owner.avatar} />
                        <AvatarFallback className="text-xs">{opp.owner.initials}</AvatarFallback>
                      </Avatar>
                      <span className="text-sm">{opp.owner.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link href={`/portal/opportunities/${opp.id}`}>
                            <Eye className="mr-2 h-4 w-4" />
                            View
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href={`/portal/opportunities/${opp.id}/edit`}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive">
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
