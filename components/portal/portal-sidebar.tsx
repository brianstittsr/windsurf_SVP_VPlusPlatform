"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
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
  Factory,
  LayoutDashboard,
  Target,
  FolderKanban,
  Users,
  Building,
  FileText,
  Calendar,
  CheckSquare,
  MessageSquare,
  Bell,
  Settings,
  LogOut,
  ChevronUp,
  Sparkles,
  Handshake,
  DollarSign,
  User,
  Image,
  Shield,
  Rocket,
  Battery,
} from "lucide-react";
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
    title: "Documents",
    href: "/portal/documents",
    icon: FileText,
  },
  {
    title: "Meetings",
    href: "/portal/meetings",
    icon: Calendar,
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
];

const adminItems = [
  {
    title: "Hero Management",
    href: "/portal/admin/hero",
    icon: Image,
  },
  {
    title: "Contact Popup",
    href: "/portal/admin/popup",
    icon: MessageSquare,
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

export function PortalSidebar() {
  const pathname = usePathname();

  return (
    <Sidebar>
      <SidebarHeader className="border-b border-sidebar-border">
        <Link href="/portal" className="flex items-center gap-2 px-2 py-4">
          <Factory className="h-8 w-8 text-primary" />
          <div className="flex flex-col">
            <span className="text-lg font-bold leading-none">Strategic Value+</span>
            <span className="text-xs text-sidebar-foreground/60">Business Portal</span>
          </div>
        </Link>
      </SidebarHeader>

      <SidebarContent>
        {/* Main Navigation */}
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainNavItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === item.href}
                    tooltip={item.title}
                  >
                    <Link href={item.href}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                  {item.badge && (
                    <SidebarMenuBadge>{item.badge}</SidebarMenuBadge>
                  )}
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Work Items */}
        <SidebarGroup>
          <SidebarGroupLabel>Work</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {workItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === item.href}
                    tooltip={item.title}
                  >
                    <Link href={item.href}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* AI */}
        <SidebarGroup>
          <SidebarGroupLabel>Intelligence</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {aiItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === item.href}
                    tooltip={item.title}
                  >
                    <Link href={item.href}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Admin */}
        <SidebarGroup>
          <SidebarGroupLabel>Admin</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {adminItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === item.href || pathname.startsWith(item.href)}
                    tooltip={item.title}
                  >
                    <Link href={item.href}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Initiatives */}
        <SidebarGroup>
          <SidebarGroupLabel>Initiatives</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {initiativeItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === item.href || pathname.startsWith(item.href + "/")}
                    tooltip={item.title}
                  >
                    <Link href={item.href}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border">
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton className="w-full">
                  <Avatar className="h-6 w-6">
                    <AvatarImage src="/avatars/user.jpg" />
                    <AvatarFallback className="bg-primary/20 text-primary text-xs">
                      JD
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col items-start text-sm">
                    <span className="font-medium">John Doe</span>
                    <span className="text-xs text-sidebar-foreground/60">Admin</span>
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
                  <Link href="/portal/notifications">
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
                <DropdownMenuItem className="text-destructive">
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
