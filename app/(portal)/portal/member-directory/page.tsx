"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
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
} from "@/components/ui/dialog";
import {
  Search,
  Users,
  Mail,
  Phone,
  Building2,
  Globe,
  Linkedin,
  MapPin,
  Briefcase,
  Loader2,
  ExternalLink,
  LayoutGrid,
  List,
} from "lucide-react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { COLLECTIONS, type TeamMemberDoc } from "@/lib/schema";
import { cn } from "@/lib/utils";

export default function MemberDirectoryPage() {
  const [members, setMembers] = useState<TeamMemberDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [expertiseFilter, setExpertiseFilter] = useState("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [selectedMember, setSelectedMember] = useState<TeamMemberDoc | null>(null);

  useEffect(() => {
    fetchMembers();
  }, []);

  const fetchMembers = async () => {
    if (!db) return;
    setLoading(true);
    try {
      // Fetch all members without status filter to ensure we get everyone
      const snapshot = await getDocs(collection(db, COLLECTIONS.TEAM_MEMBERS));
      const membersList = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as TeamMemberDoc[];
      
      // Sort by name
      membersList.sort((a, b) => {
        const nameA = `${a.firstName || ""} ${a.lastName || ""}`.toLowerCase();
        const nameB = `${b.firstName || ""} ${b.lastName || ""}`.toLowerCase();
        return nameA.localeCompare(nameB);
      });
      
      setMembers(membersList);
    } catch (error) {
      console.error("Error fetching members:", error);
    } finally {
      setLoading(false);
    }
  };

  // Get unique expertise areas for filter
  const expertiseAreas = Array.from(
    new Set(members.map((m) => m.expertise).filter(Boolean))
  ).sort();

  // Filter members
  const filteredMembers = members.filter((member) => {
    const matchesSearch =
      searchQuery === "" ||
      `${member.firstName} ${member.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.company?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.expertise?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.emailPrimary?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesRole = roleFilter === "all" || member.role === roleFilter;
    const matchesExpertise = expertiseFilter === "all" || member.expertise === expertiseFilter;

    return matchesSearch && matchesRole && matchesExpertise;
  });

  const getRoleBadgeColor = (role?: string) => {
    switch (role) {
      case "admin":
        return "bg-red-100 text-red-700";
      case "team":
        return "bg-blue-100 text-blue-700";
      case "affiliate":
        return "bg-green-100 text-green-700";
      case "consultant":
        return "bg-purple-100 text-purple-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const getInitials = (firstName?: string, lastName?: string) => {
    return `${firstName?.charAt(0) || ""}${lastName?.charAt(0) || ""}`.toUpperCase() || "?";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Member Directory</h1>
        <p className="text-muted-foreground">
          Browse and connect with other members in the SVP network
        </p>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, company, or expertise..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-full md:w-40">
                <SelectValue placeholder="All Roles" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="team">Team</SelectItem>
                <SelectItem value="affiliate">Affiliate</SelectItem>
                <SelectItem value="consultant">Consultant</SelectItem>
              </SelectContent>
            </Select>
            <Select value={expertiseFilter} onValueChange={setExpertiseFilter}>
              <SelectTrigger className="w-full md:w-56">
                <SelectValue placeholder="All Expertise" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Expertise</SelectItem>
                {expertiseAreas.map((exp) => (
                  <SelectItem key={exp} value={exp || ""}>
                    {exp}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex gap-1 border rounded-md p-1">
              <Button
                variant={viewMode === "grid" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setViewMode("grid")}
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === "list" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setViewMode("list")}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results count */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Users className="h-4 w-4" />
        <span>
          Showing {filteredMembers.length} of {members.length} members
        </span>
      </div>

      {/* Members Grid/List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : filteredMembers.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="font-medium mb-2">No Members Found</h3>
            <p className="text-sm text-muted-foreground">
              Try adjusting your search or filters
            </p>
          </CardContent>
        </Card>
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredMembers.map((member) => (
            <Card
              key={member.id}
              className="cursor-pointer hover:border-primary/50 transition-colors"
              onClick={() => setSelectedMember(member)}
            >
              <CardContent className="pt-6">
                <div className="flex flex-col items-center text-center">
                  <Avatar className="h-16 w-16 mb-3">
                    <AvatarImage src={member.avatar} />
                    <AvatarFallback className="text-lg">
                      {getInitials(member.firstName, member.lastName)}
                    </AvatarFallback>
                  </Avatar>
                  <h3 className="font-medium">
                    {member.firstName} {member.lastName}
                  </h3>
                  {member.company && (
                    <p className="text-sm text-muted-foreground">{member.company}</p>
                  )}
                  <Badge className={cn("mt-2", getRoleBadgeColor(member.role))}>
                    {member.role || "Member"}
                  </Badge>
                  {member.expertise && (
                    <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
                      {member.expertise}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="divide-y">
              {filteredMembers.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center gap-4 p-4 cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => setSelectedMember(member)}
                >
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={member.avatar} />
                    <AvatarFallback>
                      {getInitials(member.firstName, member.lastName)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium">
                        {member.firstName} {member.lastName}
                      </h3>
                      <Badge className={cn("text-xs", getRoleBadgeColor(member.role))}>
                        {member.role || "Member"}
                      </Badge>
                    </div>
                    {member.company && (
                      <p className="text-sm text-muted-foreground">{member.company}</p>
                    )}
                    {member.expertise && (
                      <p className="text-xs text-muted-foreground truncate">
                        {member.expertise}
                      </p>
                    )}
                  </div>
                  <div className="hidden md:flex items-center gap-2">
                    {member.emailPrimary && (
                      <Mail className="h-4 w-4 text-muted-foreground" />
                    )}
                    {member.mobile && (
                      <Phone className="h-4 w-4 text-muted-foreground" />
                    )}
                    {member.linkedIn && (
                      <Linkedin className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Member Detail Dialog */}
      <Dialog open={!!selectedMember} onOpenChange={() => setSelectedMember(null)}>
        <DialogContent className="max-w-lg">
          {selectedMember && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-4">
                  <Avatar className="h-16 w-16">
                    <AvatarImage src={selectedMember.avatar} />
                    <AvatarFallback className="text-lg">
                      {getInitials(selectedMember.firstName, selectedMember.lastName)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <DialogTitle className="text-xl">
                      {selectedMember.firstName} {selectedMember.lastName}
                    </DialogTitle>
                    <DialogDescription className="flex items-center gap-2">
                      {selectedMember.title && <span>{selectedMember.title}</span>}
                      {selectedMember.title && selectedMember.company && <span>•</span>}
                      {selectedMember.company && <span>{selectedMember.company}</span>}
                    </DialogDescription>
                  </div>
                </div>
              </DialogHeader>

              <div className="space-y-4 py-4">
                {/* Role & Expertise */}
                <div className="flex flex-wrap gap-2">
                  <Badge className={getRoleBadgeColor(selectedMember.role)}>
                    {selectedMember.role || "Member"}
                  </Badge>
                  {selectedMember.expertise && (
                    <Badge variant="outline">{selectedMember.expertise}</Badge>
                  )}
                </div>

                {/* Bio */}
                {selectedMember.bio && (
                  <div>
                    <h4 className="text-sm font-medium mb-1">About</h4>
                    <p className="text-sm text-muted-foreground">{selectedMember.bio}</p>
                  </div>
                )}

                {/* Contact Info */}
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Contact</h4>
                  
                  {selectedMember.emailPrimary && (
                    <a
                      href={`mailto:${selectedMember.emailPrimary}`}
                      className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary"
                    >
                      <Mail className="h-4 w-4" />
                      {selectedMember.emailPrimary}
                    </a>
                  )}
                  
                  {selectedMember.mobile && (
                    <a
                      href={`tel:${selectedMember.mobile}`}
                      className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary"
                    >
                      <Phone className="h-4 w-4" />
                      {selectedMember.mobile}
                    </a>
                  )}

                  {selectedMember.location && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      {selectedMember.location}
                    </div>
                  )}
                </div>

                {/* Links */}
                {(selectedMember.website || selectedMember.linkedIn) && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium">Links</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedMember.website && (
                        <Button variant="outline" size="sm" asChild>
                          <a
                            href={selectedMember.website}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <Globe className="h-4 w-4 mr-2" />
                            Website
                            <ExternalLink className="h-3 w-3 ml-1" />
                          </a>
                        </Button>
                      )}
                      {selectedMember.linkedIn && (
                        <Button variant="outline" size="sm" asChild>
                          <a
                            href={selectedMember.linkedIn}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <Linkedin className="h-4 w-4 mr-2" />
                            LinkedIn
                            <ExternalLink className="h-3 w-3 ml-1" />
                          </a>
                        </Button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
