import { Metadata } from "next";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
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
  Building,
  MapPin,
  Users,
  MoreHorizontal,
  Eye,
  Edit,
  FolderKanban,
  Mail,
  Phone,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Customers",
  description: "Manage customer relationships and engagements",
};

const customers = [
  {
    id: "1",
    name: "ABC Manufacturing Inc.",
    industry: "Automotive",
    size: "100-250",
    location: "Detroit, MI",
    status: "active",
    projects: 2,
    contacts: [
      { name: "Tom Wilson", role: "VP Operations", initials: "TW" },
      { name: "Lisa Chen", role: "Quality Manager", initials: "LC" },
    ],
    lastActivity: "2 days ago",
  },
  {
    id: "2",
    name: "XYZ Industries",
    industry: "Aerospace",
    size: "250-500",
    location: "Cleveland, OH",
    status: "active",
    projects: 1,
    contacts: [
      { name: "Mark Johnson", role: "CEO", initials: "MJ" },
    ],
    lastActivity: "Today",
  },
  {
    id: "3",
    name: "123 Components LLC",
    industry: "Electronics",
    size: "25-100",
    location: "Chicago, IL",
    status: "active",
    projects: 1,
    contacts: [
      { name: "Sarah Miller", role: "Plant Manager", initials: "SM" },
    ],
    lastActivity: "1 week ago",
  },
  {
    id: "4",
    name: "Precision Parts Co",
    industry: "Industrial Equipment",
    size: "100-250",
    location: "Indianapolis, IN",
    status: "prospect",
    projects: 0,
    contacts: [
      { name: "David Brown", role: "President", initials: "DB" },
    ],
    lastActivity: "5 days ago",
  },
  {
    id: "5",
    name: "TechForm Industries",
    industry: "Medical Devices",
    size: "250-500",
    location: "Minneapolis, MN",
    status: "prospect",
    projects: 0,
    contacts: [
      { name: "Jennifer Lee", role: "COO", initials: "JL" },
      { name: "Robert Kim", role: "Engineering Director", initials: "RK" },
    ],
    lastActivity: "1 week ago",
  },
  {
    id: "6",
    name: "Metro Components",
    industry: "Automotive",
    size: "100-250",
    location: "Columbus, OH",
    status: "completed",
    projects: 1,
    contacts: [
      { name: "Mike Davis", role: "Operations Manager", initials: "MD" },
    ],
    lastActivity: "2 weeks ago",
  },
];

function getStatusBadge(status: string) {
  switch (status) {
    case "active":
      return <Badge className="bg-green-100 text-green-800">Active</Badge>;
    case "prospect":
      return <Badge className="bg-blue-100 text-blue-800">Prospect</Badge>;
    case "completed":
      return <Badge className="bg-gray-100 text-gray-800">Completed</Badge>;
    default:
      return <Badge variant="secondary">{status}</Badge>;
  }
}

export default function CustomersPage() {
  const activeCustomers = customers.filter((c) => c.status === "active").length;
  const prospects = customers.filter((c) => c.status === "prospect").length;
  const totalProjects = customers.reduce((sum, c) => sum + c.projects, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Customers</h1>
          <p className="text-muted-foreground">
            Manage customer relationships and track engagements
          </p>
        </div>
        <Button asChild>
          <Link href="/portal/customers/new">
            <Plus className="mr-2 h-4 w-4" />
            Add Customer
          </Link>
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{customers.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{activeCustomers}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Prospects</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{prospects}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Active Projects</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalProjects}</div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search customers..." className="pl-9" />
          </div>
        </CardContent>
      </Card>

      {/* Customers Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Company</TableHead>
                <TableHead>Industry</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Projects</TableHead>
                <TableHead>Contacts</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {customers.map((customer) => (
                <TableRow key={customer.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Building className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <Link
                          href={`/portal/customers/${customer.id}`}
                          className="font-medium hover:underline"
                        >
                          {customer.name}
                        </Link>
                        <p className="text-xs text-muted-foreground">
                          {customer.size} employees
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{customer.industry}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <MapPin className="h-3 w-3" />
                      {customer.location}
                    </div>
                  </TableCell>
                  <TableCell>{getStatusBadge(customer.status)}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <FolderKanban className="h-4 w-4 text-muted-foreground" />
                      {customer.projects}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex -space-x-2">
                      {customer.contacts.slice(0, 3).map((contact, i) => (
                        <Avatar key={i} className="h-7 w-7 border-2 border-background">
                          <AvatarFallback className="bg-secondary/20 text-secondary text-xs">
                            {contact.initials}
                          </AvatarFallback>
                        </Avatar>
                      ))}
                      {customer.contacts.length > 3 && (
                        <div className="h-7 w-7 rounded-full bg-muted flex items-center justify-center text-xs border-2 border-background">
                          +{customer.contacts.length - 3}
                        </div>
                      )}
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
                          <Link href={`/portal/customers/${customer.id}`}>
                            <Eye className="mr-2 h-4 w-4" />
                            View
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href={`/portal/customers/${customer.id}/edit`}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Mail className="mr-2 h-4 w-4" />
                          Send Email
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
