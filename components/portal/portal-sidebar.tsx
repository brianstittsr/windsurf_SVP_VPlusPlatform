"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import NextImage from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { db } from "@/lib/firebase";
import { collection, query, where, onSnapshot, doc, getDoc } from "firebase/firestore";
import { COLLECTIONS, type PlatformSettingsDoc } from "@/lib/schema";
import { useUserProfile } from "@/contexts/user-profile-context";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuBadge,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Factory,
  LayoutDashboard,
  Target,
  FolderKanban,
  Users,
  Building,
  FileText,
  Calendar,
  CalendarDays,
  CheckSquare,
  MessageSquare,
  Bell,
  Settings,
  LogOut,
  ChevronUp,
  ChevronDown,
  ChevronRight,
  Sparkles,
  Handshake,
  DollarSign,
  User,
  ImageIcon,
  Shield,
  Rocket,
  Battery,
  UserCog,
  Building2,
  Search,
  Linkedin,
  FileSignature,
  Bot,
  Plug,
  Bug,
  Heart,
  Phone,
  CalendarClock,
  Eye,
  EyeOff,
  UserCheck,
  Megaphone,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

const mainNavItems = [
  {
    title: "Command Center",
    href: "/portal/command-center",
    icon: LayoutDashboard,
  },
  {
    title: "Opportunities",
    href: "/portal/opportunities",
    icon: Target,
    badge: "5",
  },
  {
    title: "Projects",
    href: "/portal/projects",
    icon: FolderKanban,
    badge: "3",
  },
  {
    title: "Affiliates",
    href: "/portal/affiliates",
    icon: Users,
  },
  {
    title: "Customers",
    href: "/portal/customers",
    icon: Building,
  },
];

const workItems = [
  {
    title: "Apollo Search",
    href: "/portal/apollo-search",
    icon: Search,
    badge: "AI",
  },
  {
    title: "Supplier Search",
    href: "/portal/supplier-search",
    icon: Factory,
    badge: "AI",
  },
  {
    title: "Documents",
    href: "/portal/documents",
    icon: FileText,
  },
  {
    title: "Calendar",
    href: "/portal/calendar",
    icon: Calendar,
  },
  {
    title: "Availability",
    href: "/portal/availability",
    icon: CalendarDays,
  },
  {
    title: "Meetings",
    href: "/portal/meetings",
    icon: Users,
  },
  {
    title: "Rocks",
    href: "/portal/rocks",
    icon: CheckSquare,
  },
  {
    title: "Networking",
    href: "/portal/networking",
    icon: Handshake,
  },
  {
    title: "Deals",
    href: "/portal/deals",
    icon: DollarSign,
  },
  {
    title: "LinkedIn Content",
    href: "/portal/linkedin-content",
    icon: Linkedin,
    badge: "AI",
  },
  {
    title: "EOS2 Dashboard",
    href: "/portal/eos2",
    icon: Target,
    badge: "EOS",
  },
  {
    title: "AI Workforce",
    href: "/portal/ai-workforce",
    icon: Bot,
    badge: "AI",
  },
  {
    title: "Proposal Creator",
    href: "/portal/proposals",
    icon: FileText,
    badge: "AI",
  },
  {
    title: "GoHighLevel",
    href: "/portal/gohighlevel",
    icon: Plug,
    badge: "CRM",
  },
  {
    title: "Bug Tracker",
    href: "/portal/bug-tracker",
    icon: Bug,
  },
  {
    title: "SVP Tools",
    href: "/portal/svp-tools",
    icon: Sparkles,
    badge: "AI",
  },
];

const adminItems = [
  {
    title: "Book Call Leads",
    href: "/portal/admin/book-call-leads",
    icon: Phone,
  },
  {
    title: "Team Members",
    href: "/portal/admin/team-members",
    icon: UserCog,
  },
  {
    title: "Strategic Partners",
    href: "/portal/admin/strategic-partners",
    icon: Building2,
  },
  {
    title: "Hero Management",
    href: "/portal/admin/hero",
    icon: ImageIcon,
  },
  {
    title: "Contact Popup",
    href: "/portal/admin/popup",
    icon: MessageSquare,
  },
  {
    title: "Events",
    href: "/portal/admin/events",
    icon: CalendarClock,
  },
  {
    title: "Marketing Hub",
    href: "/portal/admin/marketing-hub",
    icon: Megaphone,
    badge: "NEW",
  },
];

const initiativeItems = [
  {
    title: "Initiatives",
    href: "/portal/admin/initiatives",
    icon: Rocket,
  },
  {
    title: "TBMNC Suppliers",
    href: "/portal/admin/initiatives/tbmnc",
    icon: Battery,
  },
];

const aiItems = [
  {
    title: "Ask IntellEDGE",
    href: "/portal/ask",
    icon: Sparkles,
  },
];

// All available roles for the role switcher
const AVAILABLE_ROLES = [
  { value: "admin", label: "Admin" },
  { value: "team_member", label: "Team Member" },
  { value: "affiliate", label: "Affiliate" },
  { value: "client", label: "Client" },
  { value: "viewer", label: "Viewer" },
];

// Export all nav items for use in settings
export const ALL_NAV_ITEMS = [
  ...mainNavItems.map(item => ({ ...item, section: "Navigation" })),
  ...workItems.map(item => ({ ...item, section: "Work" })),
  ...aiItems.map(item => ({ ...item, section: "Intelligence" })),
  ...adminItems.map(item => ({ ...item, section: "Admin" })),
  ...initiativeItems.map(item => ({ ...item, section: "Initiatives" })),
];

export function PortalSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { getDisplayName, getInitials, profile } = useUserProfile();

  const handleSignOut = async () => {
    try {
      if (auth) {
        await signOut(auth);
      }
      router.push("/login");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };
  const [bookCallLeadsCount, setBookCallLeadsCount] = useState(0);
  const [hiddenNavItems, setHiddenNavItems] = useState<string[]>([]);
  const [roleVisibility, setRoleVisibility] = useState<Record<string, string[]>>({});
  const [previewRole, setPreviewRole] = useState<string | null>(null);
  const isAdmin = profile.role === "admin";
  
  // The effective role for filtering (either preview role or actual role)
  const effectiveRole = previewRole || profile.role;

  // Subscribe to BookCallLeads count (new leads only)
  useEffect(() => {
    if (!db) return;
    
    const q = query(
      collection(db, COLLECTIONS.BOOK_CALL_LEADS),
      where("status", "==", "new")
    );
    
    const unsubscribe = onSnapshot(
      q, 
      (snapshot) => {
        setBookCallLeadsCount(snapshot.size);
      },
      (error) => {
        // Silently handle permission errors - user may not have access to this collection
        console.warn("BookCallLeads snapshot error (may be permission-related):", error.code);
      }
    );
    
    return () => unsubscribe();
  }, []);
  
  // Load navigation settings from Firebase with real-time listener
  useEffect(() => {
    if (!db) return;
    
    const docRef = doc(db, COLLECTIONS.PLATFORM_SETTINGS, "global");
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data() as PlatformSettingsDoc;
        if (data.navigationSettings?.hiddenItems) {
          setHiddenNavItems(data.navigationSettings.hiddenItems);
        } else {
          setHiddenNavItems([]);
        }
        if (data.navigationSettings?.roleVisibility) {
          setRoleVisibility(data.navigationSettings.roleVisibility);
        } else {
          setRoleVisibility({});
        }
      }
    }, (error) => {
      console.error("Error loading navigation settings:", error);
    });
    
    return () => unsubscribe();
  }, []);
  
  // Filter nav items based on role-based visibility
  const filterNavItems = (items: typeof mainNavItems) => {
    return items.filter(item => {
      // If admin is not previewing, show all items
      if (isAdmin && !previewRole) return true;
      
      // Check role-based visibility
      const roleHiddenItems = roleVisibility[effectiveRole] || [];
      const isHiddenForRole = roleHiddenItems.includes(item.href);
      
      // Also check legacy hiddenItems for backwards compatibility
      const isGloballyHidden = hiddenNavItems.includes(item.href);
      
      return !isHiddenForRole && !isGloballyHidden;
    });
  };
  
  // Check if item should show as hidden (for admin preview)
  const isItemHidden = (href: string) => {
    const roleHiddenItems = roleVisibility[effectiveRole] || [];
    return roleHiddenItems.includes(href) || hiddenNavItems.includes(href);
  };
  
  // Collapsible state for each section
  const [openSections, setOpenSections] = useState({
    navigation: true,
    work: true,
    intelligence: true,
    admin: false,
    initiatives: false,
  });

  const toggleSection = (section: keyof typeof openSections) => {
    setOpenSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  return (
    <Sidebar>
      <SidebarHeader className="border-b border-sidebar-border">
        <Link href="/portal" className="flex items-center gap-2 px-2 py-4">
          <NextImage
            src="/VPlus_logo.webp"
            alt="Strategic Value+ Logo"
            width={40}
            height={40}
            style={{ width: 'auto', height: 'auto' }}
          />
          <div className="flex flex-col">
            <span className="text-lg font-bold leading-none">Strategic Value+</span>
            <span className="text-xs text-sidebar-foreground/60">Business Portal</span>
          </div>
        </Link>
      </SidebarHeader>

      <SidebarContent>
        {/* Main Navigation */}
        <Collapsible open={openSections.navigation} onOpenChange={() => toggleSection("navigation")}>
          <SidebarGroup>
            <CollapsibleTrigger asChild>
              <SidebarGroupLabel className="cursor-pointer hover:bg-sidebar-accent/50 rounded-md flex items-center justify-between pr-2">
                <span>Navigation</span>
                {openSections.navigation ? (
                  <ChevronDown className="h-4 w-4 text-sidebar-foreground/60" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-sidebar-foreground/60" />
                )}
              </SidebarGroupLabel>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <SidebarGroupContent>
                <SidebarMenu>
                  {filterNavItems(mainNavItems).map((item) => {
                    const hidden = isItemHidden(item.href);
                    return (
                      <SidebarMenuItem key={item.href} className={cn(hidden && isAdmin && !previewRole && "opacity-50")}>
                        <SidebarMenuButton
                          asChild
                          isActive={pathname === item.href}
                          tooltip={item.title}
                        >
                          <Link href={item.href}>
                            <item.icon className="h-4 w-4" />
                            <span>{item.title}</span>
                            {hidden && isAdmin && !previewRole && (
                              <EyeOff className="h-3 w-3 ml-auto text-muted-foreground" />
                            )}
                          </Link>
                        </SidebarMenuButton>
                        {item.badge && !hidden && (
                          <SidebarMenuBadge>{item.badge}</SidebarMenuBadge>
                        )}
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </CollapsibleContent>
          </SidebarGroup>
        </Collapsible>

        {/* Work Items */}
        <Collapsible open={openSections.work} onOpenChange={() => toggleSection("work")}>
          <SidebarGroup>
            <CollapsibleTrigger asChild>
              <SidebarGroupLabel className="cursor-pointer hover:bg-sidebar-accent/50 rounded-md flex items-center justify-between pr-2">
                <span>Work</span>
                {openSections.work ? (
                  <ChevronDown className="h-4 w-4 text-sidebar-foreground/60" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-sidebar-foreground/60" />
                )}
              </SidebarGroupLabel>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <SidebarGroupContent>
                <SidebarMenu>
                  {filterNavItems(workItems).map((item) => {
                    const hidden = isItemHidden(item.href);
                    return (
                      <SidebarMenuItem key={item.href} className={cn(hidden && isAdmin && !previewRole && "opacity-50")}>
                        <SidebarMenuButton
                          asChild
                          isActive={pathname === item.href}
                          tooltip={item.title}
                        >
                          <Link href={item.href}>
                            <item.icon className="h-4 w-4" />
                            <span>{item.title}</span>
                            {hidden && isAdmin && !previewRole && (
                              <EyeOff className="h-3 w-3 ml-auto text-muted-foreground" />
                            )}
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </CollapsibleContent>
          </SidebarGroup>
        </Collapsible>

        {/* AI */}
        <Collapsible open={openSections.intelligence} onOpenChange={() => toggleSection("intelligence")}>
          <SidebarGroup>
            <CollapsibleTrigger asChild>
              <SidebarGroupLabel className="cursor-pointer hover:bg-sidebar-accent/50 rounded-md flex items-center justify-between pr-2">
                <span>Intelligence</span>
                {openSections.intelligence ? (
                  <ChevronDown className="h-4 w-4 text-sidebar-foreground/60" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-sidebar-foreground/60" />
                )}
              </SidebarGroupLabel>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <SidebarGroupContent>
                <SidebarMenu>
                  {filterNavItems(aiItems).map((item) => {
                    const hidden = isItemHidden(item.href);
                    return (
                      <SidebarMenuItem key={item.href} className={cn(hidden && isAdmin && !previewRole && "opacity-50")}>
                        <SidebarMenuButton
                          asChild
                          isActive={pathname === item.href}
                          tooltip={item.title}
                        >
                          <Link href={item.href}>
                            <item.icon className="h-4 w-4" />
                            <span>{item.title}</span>
                            {hidden && isAdmin && !previewRole && (
                              <EyeOff className="h-3 w-3 ml-auto text-muted-foreground" />
                            )}
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </CollapsibleContent>
          </SidebarGroup>
        </Collapsible>

        {/* Admin */}
        <Collapsible open={openSections.admin} onOpenChange={() => toggleSection("admin")}>
          <SidebarGroup>
            <CollapsibleTrigger asChild>
              <SidebarGroupLabel className="cursor-pointer hover:bg-sidebar-accent/50 rounded-md flex items-center justify-between pr-2">
                <span>Admin</span>
                {openSections.admin ? (
                  <ChevronDown className="h-4 w-4 text-sidebar-foreground/60" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-sidebar-foreground/60" />
                )}
              </SidebarGroupLabel>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <SidebarGroupContent>
                <SidebarMenu>
                  {filterNavItems(adminItems).map((item) => {
                    const hidden = isItemHidden(item.href);
                    const isBookCallLeads = item.href === "/portal/admin/book-call-leads";
                    return (
                      <SidebarMenuItem key={item.href} className={cn(hidden && isAdmin && !previewRole && "opacity-50")}>
                        <SidebarMenuButton
                          asChild
                          isActive={pathname === item.href || pathname.startsWith(item.href)}
                          tooltip={item.title}
                        >
                          <Link href={item.href}>
                            <item.icon className="h-4 w-4" />
                            <span>{item.title}</span>
                            {hidden && isAdmin && !previewRole && (
                              <EyeOff className="h-3 w-3 ml-auto text-muted-foreground" />
                            )}
                          </Link>
                        </SidebarMenuButton>
                        {/* Show dynamic count badge for Book Call Leads */}
                        {isBookCallLeads && bookCallLeadsCount > 0 && !hidden && (
                          <SidebarMenuBadge className="bg-red-500 text-white">
                            {bookCallLeadsCount}
                          </SidebarMenuBadge>
                        )}
                        {item.badge && !hidden && !isBookCallLeads && (
                          <SidebarMenuBadge>{item.badge}</SidebarMenuBadge>
                        )}
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </CollapsibleContent>
          </SidebarGroup>
        </Collapsible>

        {/* Initiatives */}
        <Collapsible open={openSections.initiatives} onOpenChange={() => toggleSection("initiatives")}>
          <SidebarGroup>
            <CollapsibleTrigger asChild>
              <SidebarGroupLabel className="cursor-pointer hover:bg-sidebar-accent/50 rounded-md flex items-center justify-between pr-2">
                <span>Initiatives</span>
                {openSections.initiatives ? (
                  <ChevronDown className="h-4 w-4 text-sidebar-foreground/60" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-sidebar-foreground/60" />
                )}
              </SidebarGroupLabel>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <SidebarGroupContent>
                <SidebarMenu>
                  {filterNavItems(initiativeItems).map((item) => {
                    const hidden = isItemHidden(item.href);
                    return (
                      <SidebarMenuItem key={item.href} className={cn(hidden && isAdmin && !previewRole && "opacity-50")}>
                        <SidebarMenuButton
                          asChild
                          isActive={pathname === item.href || pathname.startsWith(item.href + "/")}
                          tooltip={item.title}
                        >
                          <Link href={item.href}>
                            <item.icon className="h-4 w-4" />
                            <span>{item.title}</span>
                            {hidden && isAdmin && !previewRole && (
                              <EyeOff className="h-3 w-3 ml-auto text-muted-foreground" />
                            )}
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </CollapsibleContent>
          </SidebarGroup>
        </Collapsible>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border">
        {/* Admin Role Switcher */}
        {isAdmin && (
          <div className="px-3 py-2 border-b border-sidebar-border">
            <div className="flex items-center gap-2 mb-2">
              <UserCheck className="h-4 w-4 text-sidebar-foreground/60" />
              <span className="text-xs font-medium text-sidebar-foreground/60">Preview as Role</span>
            </div>
            <Select
              value={previewRole || "admin"}
              onValueChange={(value) => setPreviewRole(value === "admin" ? null : value)}
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="Select role to preview" />
              </SelectTrigger>
              <SelectContent>
                {AVAILABLE_ROLES.map((role) => (
                  <SelectItem key={role.value} value={role.value} className="text-xs">
                    <div className="flex items-center gap-2">
                      {role.label}
                      {role.value === "admin" && (
                        <Badge variant="outline" className="text-[10px] h-4">Your Role</Badge>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {previewRole && (
              <p className="text-[10px] text-amber-600 mt-1 flex items-center gap-1">
                <Eye className="h-3 w-3" />
                Previewing as {AVAILABLE_ROLES.find(r => r.value === previewRole)?.label}
              </p>
            )}
          </div>
        )}
        
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton className="w-full">
                  <Avatar className="h-6 w-6">
                    <AvatarFallback className="bg-primary/20 text-primary text-xs">
                      {getInitials()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col items-start text-sm">
                    <span className="font-medium">{getDisplayName()}</span>
                    <span className="text-xs text-sidebar-foreground/60 capitalize">
                      {previewRole ? `${profile.role.replace("_", " ")} (viewing as ${previewRole.replace("_", " ")})` : profile.role.replace("_", " ")}
                    </span>
                  </div>
                  <ChevronUp className="ml-auto h-4 w-4" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent side="top" align="start" className="w-56">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/portal/profile">
                    <User className="mr-2 h-4 w-4" />
                    Profile
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/portal/settings?tab=notifications">
                    <Bell className="mr-2 h-4 w-4" />
                    Notifications
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/portal/settings">
                    <Settings className="mr-2 h-4 w-4" />
                    Settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-destructive cursor-pointer" onClick={handleSignOut}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
