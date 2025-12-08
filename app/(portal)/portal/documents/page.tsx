import { Metadata } from "next";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  Upload,
  Search,
  FileText,
  FileSpreadsheet,
  FileImage,
  File,
  Folder,
  MoreHorizontal,
  Download,
  Eye,
  Trash2,
  Share2,
  Clock,
  User,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Documents",
  description: "Manage and share documents across your organization",
};

const documents = [
  {
    id: "1",
    name: "ABC Manufacturing - Proposal v2.pdf",
    type: "pdf",
    size: "2.4 MB",
    folder: "Proposals",
    uploadedBy: "John Doe",
    uploadedAt: "2025-01-05",
    shared: true,
  },
  {
    id: "2",
    name: "ISO 9001 Implementation Checklist.xlsx",
    type: "spreadsheet",
    size: "156 KB",
    folder: "Templates",
    uploadedBy: "Sarah Williams",
    uploadedAt: "2025-01-04",
    shared: true,
  },
  {
    id: "3",
    name: "Supplier Readiness Assessment Template.docx",
    type: "document",
    size: "89 KB",
    folder: "Templates",
    uploadedBy: "Mike Roberts",
    uploadedAt: "2025-01-03",
    shared: true,
  },
  {
    id: "4",
    name: "XYZ Industries - Site Photos.zip",
    type: "archive",
    size: "45.2 MB",
    folder: "Projects",
    uploadedBy: "Jane Doe",
    uploadedAt: "2025-01-02",
    shared: false,
  },
  {
    id: "5",
    name: "Q4 2024 Performance Report.pdf",
    type: "pdf",
    size: "1.8 MB",
    folder: "Reports",
    uploadedBy: "John Doe",
    uploadedAt: "2024-12-31",
    shared: true,
  },
  {
    id: "6",
    name: "Affiliate Capability Matrix.xlsx",
    type: "spreadsheet",
    size: "234 KB",
    folder: "Internal",
    uploadedBy: "Sarah Williams",
    uploadedAt: "2024-12-28",
    shared: false,
  },
  {
    id: "7",
    name: "Manufacturing Nexus Event Slides.pptx",
    type: "presentation",
    size: "12.5 MB",
    folder: "Marketing",
    uploadedBy: "Jane Doe",
    uploadedAt: "2024-12-20",
    shared: true,
  },
];

const folders = [
  { name: "All Documents", count: 45 },
  { name: "Proposals", count: 12 },
  { name: "Templates", count: 8 },
  { name: "Projects", count: 15 },
  { name: "Reports", count: 6 },
  { name: "Marketing", count: 4 },
];

function getFileIcon(type: string) {
  switch (type) {
    case "pdf":
      return <FileText className="h-5 w-5 text-red-500" />;
    case "spreadsheet":
      return <FileSpreadsheet className="h-5 w-5 text-green-500" />;
    case "document":
      return <FileText className="h-5 w-5 text-blue-500" />;
    case "presentation":
      return <FileText className="h-5 w-5 text-orange-500" />;
    case "image":
      return <FileImage className="h-5 w-5 text-purple-500" />;
    default:
      return <File className="h-5 w-5 text-gray-500" />;
  }
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function DocumentsPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Documents</h1>
          <p className="text-muted-foreground">
            Manage proposals, templates, and project documents
          </p>
        </div>
        <Button asChild>
          <Link href="/portal/documents/upload">
            <Upload className="mr-2 h-4 w-4" />
            Upload
          </Link>
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-4">
        {/* Sidebar - Folders */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-base">Folders</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="space-y-1 p-2">
              {folders.map((folder) => (
                <Button
                  key={folder.name}
                  variant={folder.name === "All Documents" ? "secondary" : "ghost"}
                  className="w-full justify-between"
                >
                  <div className="flex items-center gap-2">
                    <Folder className="h-4 w-4" />
                    {folder.name}
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {folder.count}
                  </Badge>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Main Content */}
        <div className="lg:col-span-3 space-y-4">
          {/* Search & Filters */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input placeholder="Search documents..." className="pl-9" />
                </div>
                <Select defaultValue="all">
                  <SelectTrigger className="w-full md:w-[150px]">
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="pdf">PDF</SelectItem>
                    <SelectItem value="spreadsheet">Spreadsheet</SelectItem>
                    <SelectItem value="document">Document</SelectItem>
                    <SelectItem value="presentation">Presentation</SelectItem>
                  </SelectContent>
                </Select>
                <Select defaultValue="recent">
                  <SelectTrigger className="w-full md:w-[150px]">
                    <SelectValue placeholder="Sort" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="recent">Most Recent</SelectItem>
                    <SelectItem value="name">Name</SelectItem>
                    <SelectItem value="size">Size</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Documents Table */}
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Folder</TableHead>
                    <TableHead>Size</TableHead>
                    <TableHead>Uploaded</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {documents.map((doc) => (
                    <TableRow key={doc.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          {getFileIcon(doc.type)}
                          <div>
                            <p className="font-medium">{doc.name}</p>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <User className="h-3 w-3" />
                              {doc.uploadedBy}
                              {doc.shared && (
                                <Badge variant="outline" className="text-xs">
                                  <Share2 className="h-3 w-3 mr-1" />
                                  Shared
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{doc.folder}</Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{doc.size}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {formatDate(doc.uploadedAt)}
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
                            <DropdownMenuItem>
                              <Eye className="mr-2 h-4 w-4" />
                              View
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Download className="mr-2 h-4 w-4" />
                              Download
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Share2 className="mr-2 h-4 w-4" />
                              Share
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
      </div>
    </div>
  );
}
