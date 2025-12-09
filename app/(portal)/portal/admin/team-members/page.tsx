"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
  Mail,
  Phone,
  Pencil,
  Trash2,
  Users,
  RefreshCw,
  Upload,
  UserCheck,
  UserX,
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
import { COLLECTIONS, type TeamMemberDoc } from "@/lib/schema";

// Seed data for Team Members
const seedTeamMembers: Omit<TeamMemberDoc, "id" | "createdAt" | "updatedAt">[] = [
  { firstName: "Al", lastName: "Lenac", emailPrimary: "al@manufacftureresults.com", emailSecondary: "albertlenac@gmail.com", mobile: "(973) 723-7448", expertise: "R&D Tax Credits", role: "affiliate", status: "active" },
  { firstName: "Alex", lastName: "West", emailPrimary: "alex@itscnow.com", mobile: "(518) 801-7315", expertise: "Cybersecurity Consulting", role: "affiliate", status: "active" },
  { firstName: "Alysha", lastName: "Campbell", emailPrimary: "alysha@cultureshifthr.com", expertise: "Human Resources", role: "affiliate", status: "active" },
  { firstName: "Brett", lastName: "Heyns", emailPrimary: "brett@getcompoundeffect.com", expertise: "Advanced Marketing/Bus Dev", role: "affiliate", status: "active" },
  { firstName: "Brian", lastName: "Stitt", emailPrimary: "bstitt@strategicvalueplus.com", emailSecondary: "brianstittsr@gmail.com", mobile: "(919) 608-3415", expertise: "Advanced Technology/Robotics", role: "admin", status: "active" },
  { firstName: "Brian", lastName: "McCollough", emailPrimary: "bmccollough@nextstagefl.net", mobile: "(801) 719-0076", expertise: "Operations", role: "affiliate", status: "active" },
  { firstName: "Cass", lastName: "Gibson", emailPrimary: "cassgibson@coststudy.us", emailSecondary: "cass@tapeismoney.com", mobile: "(717) 858-3150", expertise: "Cost Segregation", role: "affiliate", status: "active" },
  { firstName: "Christine", lastName: "Nolan", emailPrimary: "christine.nolan@pines-optimization.com", emailSecondary: "canolan912@gmail.com", mobile: "(215) 808-0035", expertise: "Inventory/Supply Chain", role: "affiliate", status: "active" },
  { firstName: "Daniel", lastName: "Sternklar", emailPrimary: "linkedin@view3d.tv", mobile: "(301) 576-6176", expertise: "Learning Platforms/Metaverses", role: "affiliate", status: "active" },
  { firstName: "Dave", lastName: "McFarland", emailPrimary: "dmcfarland@strategicvalueplus.com", emailSecondary: "dave@focusopex.com", mobile: "(217) 377-2234", expertise: "Operations/Finance", role: "team", status: "active" },
  { firstName: "Dave", lastName: "Myers", emailPrimary: "dave@dmdigi.io", expertise: "Marketing/Branding", role: "affiliate", status: "active" },
  { firstName: "David", lastName: "McFeeters-Krone", emailPrimary: "dmk@intelassets.com", expertise: "Intellectual Property", role: "affiliate", status: "active" },
  { firstName: "David", lastName: "Ziton", emailPrimary: "dziton@victory-as.com", expertise: "IT/CPA", role: "affiliate", status: "active" },
  { firstName: "Ed", lastName: "Porter", emailPrimary: "edport21@gmail.com", expertise: "Chief Revenue Officer", role: "affiliate", status: "active" },
  { firstName: "Elizabeth", lastName: "Wu", emailPrimary: "elizabeth@edd-i.com", mobile: "(404) 706-4854", expertise: "Cybergovernance for Executives", role: "affiliate", status: "active" },
  { firstName: "Gina", lastName: "Tabasso", emailPrimary: "gina@barracudab2b.com", emailSecondary: "gina.tabasso@gmail.com", mobile: "(330) 421-9185", expertise: "Project Management/Ops/Six Sigma", role: "affiliate", status: "active" },
  { firstName: "Icy", lastName: "Williams", emailPrimary: "info@legacy83business.com", mobile: "(513) 335-1978", expertise: "Executive Consulting", role: "affiliate", status: "active" },
  { firstName: "Jeremy", lastName: "Schumacher", emailPrimary: "jeremyrks@gmail.com", expertise: "CIO/Privacy", role: "affiliate", status: "active" },
  { firstName: "John", lastName: "Kloian", emailPrimary: "john@specdyn.com", emailSecondary: "john.kloian@gmail.com", expertise: "Chief Revenue Officer/Gap Assessments", role: "affiliate", status: "active" },
  { firstName: "Jose Luis", lastName: "Ferandez", emailPrimary: "joseluisfernandez88@gmail.com", emailSecondary: "josefernandez@salesfyconsulting.com", expertise: "Executive AI Training/Coaching", role: "affiliate", status: "active" },
  { firstName: "Justice", lastName: "Darko", emailPrimary: "jdarko@strategicvalueplus.com", expertise: "Project Management/Ops/Six Sigma", role: "team", status: "active" },
  { firstName: "Karena", lastName: "Bell", emailPrimary: "karena@profitlinz.com", mobile: "843-804-7151", expertise: "Financial Trouble-Shooter/Strategist/Problem Solver", role: "affiliate", status: "active" },
  { firstName: "Kham", lastName: "Inthirath", emailPrimary: "kham@getcompoundeffect.com", mobile: "(617) 275-8908", expertise: "Marketing/Change Management/AI", role: "affiliate", status: "active" },
  { firstName: "L. Joe", lastName: "Minor", emailPrimary: "joeandlorie84@live.com", expertise: "Shop Operations", role: "affiliate", status: "active" },
  { firstName: "Leonard", lastName: "Fom", emailPrimary: "leonard@finops-squad.com", emailSecondary: "leonard_fom@hotmail.com", mobile: "7789223555", expertise: "CFO/Financial Strategies/Access to Capital", role: "affiliate", status: "active" },
  { firstName: "Maria", lastName: "Perez", emailPrimary: "maria@causemarketingconsultant.com", mobile: "(702) 245-7220", expertise: "Cause Marketing", role: "affiliate", status: "active" },
  { firstName: "Mark", lastName: "Osborne", emailPrimary: "mark@ModernRevenueStrategies.com", mobile: "(404) 808-7625", expertise: "Advanced Marketing/Bus Dev", role: "affiliate", status: "active" },
  { firstName: "Marney", lastName: "Lumpkin", emailPrimary: "marney@vasml.com", expertise: "Back Office Support", role: "affiliate", status: "active" },
  { firstName: "Mike", lastName: "Liu", emailPrimary: "mike@freefuse.com", mobile: "(818)-324-0538", expertise: "Multimedia User-Defined Learning Platforms", role: "affiliate", status: "active" },
  { firstName: "Nate", lastName: "Hallums", emailPrimary: "nhallums@strategicvalueplus.com", emailSecondary: "nate@backyardfishingagency.co", mobile: "(523) 273-7789", expertise: "Net-No-Cost Wellness Plans that Generate Cash Flow", role: "team", status: "active" },
  { firstName: "Nathan", lastName: "Tyler", emailPrimary: "nathan@nsquared.io", expertise: "Executive Dash Boards", role: "affiliate", status: "active" },
  { firstName: "Nelinia", lastName: "Varenas", emailPrimary: "nelinia@stategicvalueplus.com", emailSecondary: "neliniav@gmail.com", mobile: "(310) 650-0725", expertise: "CEO", role: "admin", status: "active" },
  { firstName: "Nicholas", lastName: "Chiselett", emailPrimary: "nicholas@2bytes.com.au", mobile: "61414247540", expertise: "Construction On-line Stores", role: "affiliate", status: "active" },
  { firstName: "Philip", lastName: "Wolfstein", emailPrimary: "phil@philwolfstein.com", expertise: "Certified Business Broker", role: "affiliate", status: "active" },
  { firstName: "RC", lastName: "Caldwell", emailPrimary: "rc@CaldwellLeanSixSigma.com", mobile: "(937) 367-6743", expertise: "Black Belt Six Sigma/TOC Expert", role: "affiliate", status: "active" },
  { firstName: "Rick", lastName: "McPartlin", emailPrimary: "rick.mcpartlin@therevenuegame.com", mobile: "(800) 757-8377", expertise: "CRO", role: "affiliate", status: "active" },
  { firstName: "Rosemary", lastName: "Coates", emailPrimary: "rcoates@bluesilkconsulting.com", mobile: "(408) 605-8867", expertise: "Supply Chain/Re- and Nearshoring", role: "affiliate", status: "active" },
  { firstName: "Roy", lastName: "Dickan", emailPrimary: "rdickan@strategicalueplus.com", emailSecondary: "roy@clearchoicemarketinggroup.com", mobile: "(919) 589-3580", expertise: "CRO", role: "team", status: "active" },
  { firstName: "Ruoyu", lastName: "Loughry", emailPrimary: "rloughry@strategicvalueplus.com", emailSecondary: "ruoyu.loughry@gmail.com", mobile: "(408)390-6514", expertise: "CPA, Tax", role: "team", status: "active" },
  { firstName: "Russell", lastName: "Lookadoo", emailPrimary: "answers@TheHRGuy.biz", mobile: "(801) 808-3681", expertise: "Fractional CHRO", role: "affiliate", status: "active" },
  { firstName: "Tamara", lastName: "Litrich", emailPrimary: "tamara@tlitrichsolutions.com", emailSecondary: "tmlitrich76@gmail.com", mobile: "(415) 438-0666", expertise: "Human Resources, Multi-lingual", role: "affiliate", status: "active" },
  { firstName: "Tod", lastName: "Gotori", emailPrimary: "tgotori@fivebirdsconsulting.com", emailSecondary: "tgotori@gmail.com", mobile: "(949) 954-0679", expertise: "Cybersecurity Consulting", role: "affiliate", status: "active" },
  { firstName: "Vishnu", lastName: "Rajan", emailPrimary: "vrthenorth@gmail.com", expertise: "AI App Builder", role: "affiliate", status: "active" },
];

export default function TeamMembersPage() {
  const [members, setMembers] = useState<TeamMemberDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<TeamMemberDoc | null>(null);
  const [seeding, setSeeding] = useState(false);
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    emailPrimary: "",
    emailSecondary: "",
    mobile: "",
    expertise: "",
    title: "",
    company: "",
    location: "",
    bio: "",
    linkedIn: "",
    website: "",
    role: "affiliate" as "admin" | "team" | "affiliate" | "consultant",
    status: "active" as "active" | "inactive" | "pending",
  });

  // Fetch members from Firebase
  const fetchMembers = async () => {
    if (!db) {
      console.error("Firebase not initialized");
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const querySnapshot = await getDocs(collection(db, COLLECTIONS.TEAM_MEMBERS));
      const membersData: TeamMemberDoc[] = [];
      querySnapshot.forEach((docSnap) => {
        membersData.push({ id: docSnap.id, ...docSnap.data() } as TeamMemberDoc);
      });
      // Sort by last name
      membersData.sort((a, b) => a.lastName.localeCompare(b.lastName));
      setMembers(membersData);
    } catch (error) {
      console.error("Error fetching members:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, []);

  // Seed initial data
  const handleSeedData = async () => {
    if (!db) {
      alert("Firebase not initialized. Check your environment variables.");
      return;
    }
    if (!confirm(`This will import ${seedTeamMembers.length} team members. Continue?`)) return;
    
    setSeeding(true);
    try {
      const batch = writeBatch(db);
      const collectionRef = collection(db, COLLECTIONS.TEAM_MEMBERS);
      
      for (const member of seedTeamMembers) {
        const docRef = doc(collectionRef);
        batch.set(docRef, {
          ...member,
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
        });
      }
      
      await batch.commit();
      await fetchMembers();
      alert(`Successfully imported ${seedTeamMembers.length} team members!`);
    } catch (error) {
      console.error("Error seeding data:", error);
      alert("Error importing data. Check console for details.");
    } finally {
      setSeeding(false);
    }
  };

  // Add or update member
  const handleSaveMember = async () => {
    if (!db) {
      alert("Firebase not initialized");
      return;
    }
    try {
      if (editingMember) {
        const docRef = doc(db, COLLECTIONS.TEAM_MEMBERS, editingMember.id);
        await updateDoc(docRef, {
          ...formData,
          updatedAt: Timestamp.now(),
        });
      } else {
        await addDoc(collection(db, COLLECTIONS.TEAM_MEMBERS), {
          ...formData,
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
        });
      }
      setDialogOpen(false);
      resetForm();
      await fetchMembers();
    } catch (error) {
      console.error("Error saving member:", error);
      alert("Error saving member. Check console for details.");
    }
  };

  // Delete member
  const handleDeleteMember = async (id: string) => {
    if (!db) return;
    if (!confirm("Are you sure you want to delete this team member?")) return;
    try {
      await deleteDoc(doc(db, COLLECTIONS.TEAM_MEMBERS, id));
      await fetchMembers();
    } catch (error) {
      console.error("Error deleting member:", error);
    }
  };

  // Edit member
  const handleEditMember = (member: TeamMemberDoc) => {
    setEditingMember(member);
    setFormData({
      firstName: member.firstName,
      lastName: member.lastName,
      emailPrimary: member.emailPrimary,
      emailSecondary: member.emailSecondary || "",
      mobile: member.mobile || "",
      expertise: member.expertise,
      title: member.title || "",
      company: member.company || "",
      location: member.location || "",
      bio: member.bio || "",
      linkedIn: member.linkedIn || "",
      website: member.website || "",
      role: member.role,
      status: member.status,
    });
    setDialogOpen(true);
  };

  const resetForm = () => {
    setEditingMember(null);
    setFormData({
      firstName: "",
      lastName: "",
      emailPrimary: "",
      emailSecondary: "",
      mobile: "",
      expertise: "",
      title: "",
      company: "",
      location: "",
      bio: "",
      linkedIn: "",
      website: "",
      role: "affiliate",
      status: "active",
    });
  };

  // Filter members
  const filteredMembers = members.filter((member) => {
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch = 
      member.firstName.toLowerCase().includes(searchLower) ||
      member.lastName.toLowerCase().includes(searchLower) ||
      member.emailPrimary.toLowerCase().includes(searchLower) ||
      member.expertise.toLowerCase().includes(searchLower);
    
    const matchesRole = roleFilter === "all" || member.role === roleFilter;
    
    return matchesSearch && matchesRole;
  });

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName[0] || ""}${lastName[0] || ""}`.toUpperCase();
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "admin":
        return <Badge className="bg-red-100 text-red-800">Admin</Badge>;
      case "team":
        return <Badge className="bg-blue-100 text-blue-800">Team</Badge>;
      case "affiliate":
        return <Badge className="bg-green-100 text-green-800">Affiliate</Badge>;
      case "consultant":
        return <Badge className="bg-purple-100 text-purple-800">Consultant</Badge>;
      default:
        return <Badge variant="secondary">{role}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
            <span>Admin</span>
            <ChevronRight className="h-4 w-4" />
            <span>Team Members</span>
          </div>
          <h1 className="text-3xl font-bold">Team Members</h1>
          <p className="text-muted-foreground">
            Manage SVP team members, affiliates, and consultants
          </p>
        </div>
        <div className="flex gap-2">
          {members.length === 0 && (
            <Button variant="outline" onClick={handleSeedData} disabled={seeding}>
              {seeding ? (
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Upload className="mr-2 h-4 w-4" />
              )}
              Import {seedTeamMembers.length} Members
            </Button>
          )}
          <Dialog open={dialogOpen} onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Member
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingMember ? "Edit Team Member" : "Add Team Member"}
                </DialogTitle>
                <DialogDescription>
                  {editingMember 
                    ? "Update the team member's information below."
                    : "Enter the details for the new team member."}
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name *</Label>
                    <Input
                      id="firstName"
                      value={formData.firstName}
                      onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                      placeholder="John"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name *</Label>
                    <Input
                      id="lastName"
                      value={formData.lastName}
                      onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                      placeholder="Doe"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="emailPrimary">Email (Primary) *</Label>
                    <Input
                      id="emailPrimary"
                      type="email"
                      value={formData.emailPrimary}
                      onChange={(e) => setFormData({ ...formData, emailPrimary: e.target.value })}
                      placeholder="john@company.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="emailSecondary">Email (Secondary)</Label>
                    <Input
                      id="emailSecondary"
                      type="email"
                      value={formData.emailSecondary}
                      onChange={(e) => setFormData({ ...formData, emailSecondary: e.target.value })}
                      placeholder="john@gmail.com"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="mobile">Mobile</Label>
                    <Input
                      id="mobile"
                      value={formData.mobile}
                      onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                      placeholder="(555) 123-4567"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="role">Role *</Label>
                    <Select
                      value={formData.role}
                      onValueChange={(value: "admin" | "team" | "affiliate" | "consultant") => 
                        setFormData({ ...formData, role: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem value="team">Team</SelectItem>
                        <SelectItem value="affiliate">Affiliate</SelectItem>
                        <SelectItem value="consultant">Consultant</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="expertise">Expertise *</Label>
                  <Input
                    id="expertise"
                    value={formData.expertise}
                    onChange={(e) => setFormData({ ...formData, expertise: e.target.value })}
                    placeholder="e.g., Operations, Six Sigma, Marketing"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Title</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="e.g., Senior Consultant"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="company">Company</Label>
                    <Input
                      id="company"
                      value={formData.company}
                      onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                      placeholder="Company name"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="linkedIn">LinkedIn</Label>
                    <Input
                      id="linkedIn"
                      value={formData.linkedIn}
                      onChange={(e) => setFormData({ ...formData, linkedIn: e.target.value })}
                      placeholder="https://linkedin.com/in/username"
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
                </div>
                <div className="space-y-2">
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    placeholder="City, State"
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
                  <Label htmlFor="bio">Bio</Label>
                  <Textarea
                    id="bio"
                    value={formData.bio}
                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                    placeholder="Brief biography..."
                    rows={3}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSaveMember} disabled={!formData.firstName || !formData.lastName || !formData.emailPrimary || !formData.expertise}>
                  {editingMember ? "Update Member" : "Add Member"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Members</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{members.length}</div>
            <p className="text-xs text-muted-foreground">In the network</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Admins</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {members.filter((m) => m.role === "admin").length}
            </div>
            <p className="text-xs text-muted-foreground">Platform admins</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Team</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {members.filter((m) => m.role === "team").length}
            </div>
            <p className="text-xs text-muted-foreground">Core team members</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Affiliates</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {members.filter((m) => m.role === "affiliate").length}
            </div>
            <p className="text-xs text-muted-foreground">Network affiliates</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {members.filter((m) => m.status === "active").length}
            </div>
            <p className="text-xs text-muted-foreground">Currently active</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by name, email, or expertise..."
                className="pl-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Filter by role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="team">Team</SelectItem>
                <SelectItem value="affiliate">Affiliate</SelectItem>
                <SelectItem value="consultant">Consultant</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Members Table */}
      <Card>
        <CardHeader>
          <CardTitle>Team Directory</CardTitle>
          <CardDescription>
            {filteredMembers.length} member{filteredMembers.length !== 1 ? "s" : ""} found
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : filteredMembers.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">No team members found</h3>
              <p className="text-muted-foreground mb-4">
                {members.length === 0 
                  ? "Get started by importing the initial team member data."
                  : "Try adjusting your search or filter."}
              </p>
              {members.length === 0 && (
                <Button onClick={handleSeedData} disabled={seeding}>
                  {seeding ? (
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Upload className="mr-2 h-4 w-4" />
                  )}
                  Import {seedTeamMembers.length} Members
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead className="hidden lg:table-cell">Expertise</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredMembers.map((member) => (
                    <TableRow key={member.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-9 w-9">
                            <AvatarImage src={member.avatar} />
                            <AvatarFallback className="text-xs">
                              {getInitials(member.firstName, member.lastName)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">
                              {member.firstName} {member.lastName}
                            </p>
                            {member.title && (
                              <p className="text-xs text-muted-foreground">{member.title}</p>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center gap-1 text-sm">
                            <Mail className="h-3 w-3 text-muted-foreground" />
                            <a href={`mailto:${member.emailPrimary}`} className="hover:underline">
                              {member.emailPrimary}
                            </a>
                          </div>
                          {member.mobile && (
                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                              <Phone className="h-3 w-3" />
                              {member.mobile}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell max-w-xs">
                        <p className="text-sm truncate" title={member.expertise}>
                          {member.expertise}
                        </p>
                      </TableCell>
                      <TableCell>{getRoleBadge(member.role)}</TableCell>
                      <TableCell>
                        {member.status === "active" ? (
                          <Badge variant="outline" className="text-green-600 border-green-600">
                            <UserCheck className="h-3 w-3 mr-1" />
                            Active
                          </Badge>
                        ) : member.status === "pending" ? (
                          <Badge variant="outline" className="text-yellow-600 border-yellow-600">
                            Pending
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-gray-600">
                            <UserX className="h-3 w-3 mr-1" />
                            Inactive
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEditMember(member)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteMember(member.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
