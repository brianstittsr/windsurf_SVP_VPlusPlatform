"use client";

import Link from "next/link";
import NextImage from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
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
  LayoutDashboard,
  BookOpen,
  GraduationCap,
  Award,
  BarChart3,
  Users,
  CreditCard,
  Tag,
  FileText,
  Bell,
  Settings,
  LogOut,
  ChevronUp,
  User,
  ClipboardList,
  Package,
  Database,
} from "lucide-react";

const studentItems = [
  { title: "Dashboard", href: "/portal", icon: LayoutDashboard },
  { title: "My Courses", href: "/portal/my-courses", icon: GraduationCap },
  { title: "Course Catalog", href: "/portal/courses", icon: BookOpen },
  { title: "Part 107 Study Guide", href: "/portal/study-guide", icon: BookOpen },
  { title: "Pro Access", href: "/portal/pro", icon: Package },
  { title: "Purchases & Documents", href: "/portal/documents", icon: FileText },
  { title: "Certificates", href: "/portal/certificates", icon: Award },
  { title: "Notifications", href: "/portal/notifications", icon: Bell },
];

const instructorItems = [
  { title: "Class Roster", href: "/portal/roster", icon: Users },
  { title: "Grading", href: "/portal/grading", icon: ClipboardList },
];

const adminItems = [
  { title: "Reports", href: "/portal/reports", icon: BarChart3 },
  { title: "Users", href: "/portal/admin/users", icon: Users },
  { title: "Courses", href: "/portal/admin/courses", icon: BookOpen },
  { title: "Digital Products", href: "/portal/admin/products", icon: Package },
  { title: "Forms", href: "/portal/admin/forms", icon: FileText },
  { title: "Registrations", href: "/portal/admin/registrations", icon: ClipboardList },
  { title: "SCORM Packages", href: "/portal/admin/scorm", icon: Package },
  { title: "Enrollments", href: "/portal/admin/enrollments", icon: FileText },
  { title: "Payments", href: "/portal/admin/payments", icon: CreditCard },
  { title: "Discounts", href: "/portal/admin/discounts", icon: Tag },
  { title: "Demo Data", href: "/portal/admin/seed", icon: Database },
];

export function PortalSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { getDisplayName, getInitials, profile, isAdmin, isInstructor } =
    useUserProfile();

  const handleSignOut = async () => {
    if (auth) await signOut(auth);
    router.push("/sign-in");
  };

  const renderItems = (items: typeof studentItems) =>
    items.map((item) => (
      <SidebarMenuItem key={item.href}>
        <SidebarMenuButton
          asChild
          isActive={
            item.href === "/portal"
              ? pathname === "/portal"
              : pathname.startsWith(item.href)
          }
          tooltip={item.title}
        >
          <Link href={item.href}>
            <item.icon className="h-4 w-4" />
            <span>{item.title}</span>
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
    ));

  return (
    <Sidebar>
      <SidebarHeader className="border-b border-sidebar-border">
        <Link href="/portal" className="flex items-center gap-2 px-2 py-4">
          <NextImage
            src="/images/efvs-mark-light.png"
            alt="EFVS"
            width={36}
            height={36}
            style={{ width: "auto", height: "auto" }}
          />
          <div className="flex flex-col">
            <span className="text-lg font-bold leading-none font-display tracking-wide">
              EFVS ACADEMY
            </span>
            <span className="text-xs text-sidebar-foreground/60">
              Student Portal
            </span>
          </div>
        </Link>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Learning</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>{renderItems(studentItems)}</SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {isInstructor && (
          <SidebarGroup>
            <SidebarGroupLabel>Instructor</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>{renderItems(instructorItems)}</SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {isAdmin && (
          <SidebarGroup>
            <SidebarGroupLabel>Administration</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>{renderItems(adminItems)}</SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border">
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton className="h-auto py-2">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={profile.avatarUrl} />
                    <AvatarFallback className="bg-sidebar-primary text-sidebar-primary-foreground text-xs">
                      {getInitials()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col items-start text-left">
                    <span className="text-sm font-medium truncate max-w-[140px]">
                      {getDisplayName()}
                    </span>
                    <span className="text-xs text-sidebar-foreground/60 capitalize">
                      {profile.role}
                    </span>
                  </div>
                  <ChevronUp className="h-4 w-4 ml-auto" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent side="top" className="w-56">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/portal/profile">
                    <User className="mr-2 h-4 w-4" /> Profile
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/portal/settings">
                    <Settings className="mr-2 h-4 w-4" /> Settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut}>
                  <LogOut className="mr-2 h-4 w-4" /> Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
