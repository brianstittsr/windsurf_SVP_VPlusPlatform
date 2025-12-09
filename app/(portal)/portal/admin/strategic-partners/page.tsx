"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
  ChevronRight,
  Plus,
  Search,
  ExternalLink,
  Pencil,
  Trash2,
  Users,
  Building2,
  Globe,
  Sparkles,
  RefreshCw,
  Upload,
} from "lucide-react";
import { 
  collection, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  Timestamp,
  writeBatch,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { COLLECTIONS, type StrategicPartnerDoc } from "@/lib/schema";

// Initial seed data for Strategic Partners
const seedPartners: Omit<StrategicPartnerDoc, "id" | "createdAt" | "updatedAt">[] = [
  {
    firstName: "Brett",
    lastName: "Griffiths",
    company: "Lean Transition Solutions",
    website: "https://leantransitionsolutions.com",
    expertise: "Manufacturing Management and Business Intelligence Software Apps",
    status: "active",
  },
  {
    firstName: "Dr. Alan",
    lastName: "Barnard",
    company: "Goldratt Research Labs",
    website: "https://goldrattresearchlabs.com",
    expertise: "Supply Chain, Inventory, and Retail Digital Twins | Theory of Constraints | Antifragility",
    status: "active",
  },
  {
    firstName: "Harry",
    lastName: "Moser",
    company: "Reshoring Initiative",
    website: "https://reshorenow.org",
    expertise: "Advocate for Reshoring to the U.S. | Total Cost of Ownership",
    status: "active",
  },
  {
    firstName: "Keith",
    lastName: "Moore",
    company: "KDM Associates",
    website: "https://kdm-assoc.com/",
    expertise: "Access to Federal Contracting and Funding",
    status: "active",
  },
  {
    firstName: "Marc",
    lastName: "Hoover",
    company: "Trout Software",
    website: "https://trout.software",
    expertise: "Cybersecurity Digital Twins",
    status: "active",
  },
  {
    firstName: "Merlin",
    lastName: "Corbin",
    company: "Zenthium Energy",
    website: "https://zenthium.ai",
    expertise: "Energy Savings Software and Hardware (AI powered)",
    status: "active",
  },
  {
    firstName: "Rich",
    lastName: "Zhang",
    company: "Urbot",
    website: "https://urbot.ai",
    expertise: "Robotics for Hospitality, Restaurants, and Manufacturing",
    status: "active",
  },
];

export default function StrategicPartnersPage() {
  const [partners, setPartners] = useState<StrategicPartnerDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPartner, setEditingPartner] = useState<StrategicPartnerDoc | null>(null);
  const [seeding, setSeeding] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    company: "",
    website: "",
    expertise: "",
    email: "",
    phone: "",
    linkedIn: "",
    notes: "",
    status: "active" as "active" | "inactive" | "pending",
  });

  // Fetch partners from Firebase
  const fetchPartners = async () => {
    if (!db) {
      console.error("Firebase not initialized");
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const querySnapshot = await getDocs(collection(db, COLLECTIONS.STRATEGIC_PARTNERS));
      const partnersData: StrategicPartnerDoc[] = [];
      querySnapshot.forEach((docSnap) => {
        partnersData.push({ id: docSnap.id, ...docSnap.data() } as StrategicPartnerDoc);
      });
      setPartners(partnersData);
    } catch (error) {
      console.error("Error fetching partners:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPartners();
  }, []);

  // Seed initial data
  const handleSeedData = async () => {
    if (!db) {
      alert("Firebase not initialized. Check your environment variables.");
      return;
    }
    setSeeding(true);
    try {
      const batch = writeBatch(db);
      const collectionRef = collection(db, COLLECTIONS.STRATEGIC_PARTNERS);
      
      for (const partner of seedPartners) {
        const docRef = doc(collectionRef);
        batch.set(docRef, {
          ...partner,
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
        });
      }
      
      await batch.commit();
      await fetchPartners();
      alert("Strategic Partners data seeded successfully!");
    } catch (error) {
      console.error("Error seeding data:", error);
      alert("Error seeding data. Check console for details.");
    } finally {
      setSeeding(false);
    }
  };

  // Add or update partner
  const handleSavePartner = async () => {
    if (!db) {
      alert("Firebase not initialized");
      return;
    }
    try {
      if (editingPartner) {
        // Update existing
        const docRef = doc(db, COLLECTIONS.STRATEGIC_PARTNERS, editingPartner.id);
        await updateDoc(docRef, {
          ...formData,
          updatedAt: Timestamp.now(),
        });
      } else {
        // Add new
        await addDoc(collection(db, COLLECTIONS.STRATEGIC_PARTNERS), {
          ...formData,
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
        });
      }
      setDialogOpen(false);
      resetForm();
      await fetchPartners();
    } catch (error) {
      console.error("Error saving partner:", error);
      alert("Error saving partner. Check console for details.");
    }
  };

  // Delete partner
  const handleDeletePartner = async (id: string) => {
    if (!db) return;
    if (!confirm("Are you sure you want to delete this partner?")) return;
    try {
      await deleteDoc(doc(db, COLLECTIONS.STRATEGIC_PARTNERS, id));
      await fetchPartners();
    } catch (error) {
      console.error("Error deleting partner:", error);
    }
  };

  // Edit partner
  const handleEditPartner = (partner: StrategicPartnerDoc) => {
    setEditingPartner(partner);
    setFormData({
      firstName: partner.firstName,
      lastName: partner.lastName,
      company: partner.company,
      website: partner.website,
      expertise: partner.expertise,
      email: partner.email || "",
      phone: partner.phone || "",
      linkedIn: partner.linkedIn || "",
      notes: partner.notes || "",
      status: partner.status,
    });
    setDialogOpen(true);
  };

  const resetForm = () => {
    setEditingPartner(null);
    setFormData({
      firstName: "",
      lastName: "",
      company: "",
      website: "",
      expertise: "",
      email: "",
      phone: "",
      linkedIn: "",
      notes: "",
      status: "active",
    });
  };

  // Filter partners
  const filteredPartners = partners.filter((partner) => {
    const searchLower = searchQuery.toLowerCase();
    return (
      partner.firstName.toLowerCase().includes(searchLower) ||
      partner.lastName.toLowerCase().includes(searchLower) ||
      partner.company.toLowerCase().includes(searchLower) ||
      partner.expertise.toLowerCase().includes(searchLower)
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
            <span>Admin</span>
            <ChevronRight className="h-4 w-4" />
            <span>Strategic Partners</span>
          </div>
          <h1 className="text-3xl font-bold">Strategic Partners</h1>
          <p className="text-muted-foreground">
            Manage technology and service partners that complement SVP offerings
          </p>
        </div>
        <div className="flex gap-2">
          {partners.length === 0 && (
            <Button variant="outline" onClick={handleSeedData} disabled={seeding}>
              {seeding ? (
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Upload className="mr-2 h-4 w-4" />
              )}
              Import Initial Data
            </Button>
          )}
          <Dialog open={dialogOpen} onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Partner
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>
                  {editingPartner ? "Edit Strategic Partner" : "Add Strategic Partner"}
                </DialogTitle>
                <DialogDescription>
                  {editingPartner 
                    ? "Update the partner's information below."
                    : "Enter the details for the new strategic partner."}
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <Input
                      id="firstName"
                      value={formData.firstName}
                      onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                      placeholder="John"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input
                      id="lastName"
                      value={formData.lastName}
                      onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                      placeholder="Doe"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="company">Company</Label>
                  <Input
                    id="company"
                    value={formData.company}
                    onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                    placeholder="Company Name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="website">Website</Label>
                  <Input
                    id="website"
                    value={formData.website}
                    onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                    placeholder="https://example.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="expertise">Expertise</Label>
                  <Textarea
                    id="expertise"
                    value={formData.expertise}
                    onChange={(e) => setFormData({ ...formData, expertise: e.target.value })}
                    placeholder="Areas of expertise..."
                    rows={2}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email (optional)</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="email@example.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone (optional)</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="(555) 123-4567"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="linkedIn">LinkedIn (optional)</Label>
                  <Input
                    id="linkedIn"
                    value={formData.linkedIn}
                    onChange={(e) => setFormData({ ...formData, linkedIn: e.target.value })}
                    placeholder="https://linkedin.com/in/username"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value: "active" | "inactive" | "pending") => 
                      setFormData({ ...formData, status: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="notes">Notes (optional)</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Additional notes..."
                    rows={2}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSavePartner}>
                  {editingPartner ? "Update Partner" : "Add Partner"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Partners</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{partners.length}</div>
            <p className="text-xs text-muted-foreground">Strategic partnerships</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {partners.filter((p) => p.status === "active").length}
            </div>
            <p className="text-xs text-muted-foreground">Currently active</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {partners.filter((p) => p.status === "pending").length}
            </div>
            <p className="text-xs text-muted-foreground">Awaiting activation</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Expertise Areas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {new Set(partners.flatMap((p) => p.expertise.split("|").map((e) => e.trim()))).size}
            </div>
            <p className="text-xs text-muted-foreground">Unique specializations</p>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search partners by name, company, or expertise..."
              className="pl-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Partners Table */}
      <Card>
        <CardHeader>
          <CardTitle>Partners Directory</CardTitle>
          <CardDescription>
            Technology and service partners that extend SVP capabilities
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : filteredPartners.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">No partners found</h3>
              <p className="text-muted-foreground mb-4">
                {partners.length === 0 
                  ? "Get started by importing the initial partner data."
                  : "Try adjusting your search query."}
              </p>
              {partners.length === 0 && (
                <Button onClick={handleSeedData} disabled={seeding}>
                  {seeding ? (
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Upload className="mr-2 h-4 w-4" />
                  )}
                  Import Initial Data
                </Button>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Company</TableHead>
                  <TableHead className="hidden md:table-cell">Expertise</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPartners.map((partner) => (
                  <TableRow key={partner.id}>
                    <TableCell className="font-medium">
                      {partner.firstName} {partner.lastName}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                        {partner.company}
                        <a
                          href={partner.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline"
                        >
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell max-w-xs">
                      <div className="flex flex-wrap gap-1">
                        {partner.expertise.split("|").slice(0, 2).map((exp, i) => (
                          <Badge key={i} variant="secondary" className="text-xs">
                            {exp.trim()}
                          </Badge>
                        ))}
                        {partner.expertise.split("|").length > 2 && (
                          <Badge variant="outline" className="text-xs">
                            +{partner.expertise.split("|").length - 2}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          partner.status === "active"
                            ? "default"
                            : partner.status === "pending"
                            ? "secondary"
                            : "outline"
                        }
                      >
                        {partner.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEditPartner(partner)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeletePartner(partner.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Partner Cards (Alternative View) */}
      {filteredPartners.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredPartners.map((partner) => (
            <Card key={partner.id} className="overflow-hidden">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">
                      {partner.firstName} {partner.lastName}
                    </CardTitle>
                    <CardDescription className="flex items-center gap-1">
                      <Building2 className="h-3 w-3" />
                      {partner.company}
                    </CardDescription>
                  </div>
                  <Badge
                    variant={partner.status === "active" ? "default" : "secondary"}
                  >
                    {partner.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Expertise</p>
                  <p className="text-sm">{partner.expertise}</p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="flex-1" asChild>
                    <a href={partner.website} target="_blank" rel="noopener noreferrer">
                      <Globe className="mr-2 h-4 w-4" />
                      Website
                    </a>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEditPartner(partner)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
