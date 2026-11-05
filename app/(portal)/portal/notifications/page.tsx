"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  BellOff,
  BookOpen,
  CreditCard,
  Award,
  FileText,
  GraduationCap,
} from "lucide-react";
import { auth } from "@/lib/firebase";
import { useRequireAuth } from "@/lib/hooks/use-auth";

interface ActivityItem {
  id: string;
  icon: "enrollment" | "order" | "certificate" | "document" | "completion";
  message: string;
  detail: string;
  date: Date | null;
}

interface PageData {
  documents: { id: string; kind: string; displayName: string; createdAt: string }[];
  orders: { id: string; status: string; totalCents: number; currency: string; createdAt: string | null; items: { code: string; title: string }[] }[];
  enrollments: { id: string; courseName: string; status: string; enrolledAt: string | null; completedAt: string | null }[];
}

function getRelativeTime(date: Date): string {
  const diffMs = Date.now() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins} min ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  return date.toLocaleDateString();
}

const ICONS = {
  enrollment: <BookOpen className="h-4 w-4" />,
  completion: <GraduationCap className="h-4 w-4" />,
  order: <CreditCard className="h-4 w-4" />,
  certificate: <Award className="h-4 w-4" />,
  document: <FileText className="h-4 w-4" />,
} as const;

export default function NotificationsPage() {
  const { isLoading: authLoading, isAuthenticated } = useRequireAuth();
  const [items, setItems] = useState<ActivityItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const load = useCallback(async () => {
    if (!auth?.currentUser) {
      setIsLoading(false);
      return;
    }
    try {
      const token = await auth.currentUser.getIdToken();
      const response = await fetch("/api/student-documents", {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Unable to load activity");
      const data = result.data as PageData;
      const activity: ActivityItem[] = [];

      for (const enrollment of data.enrollments) {
        if (enrollment.enrolledAt) {
          activity.push({
            id: `enroll-${enrollment.id}`,
            icon: "enrollment",
            message: `Enrolled in ${enrollment.courseName}`,
            detail: `Status: ${enrollment.status}`,
            date: new Date(enrollment.enrolledAt),
          });
        }
        if (enrollment.completedAt) {
          activity.push({
            id: `complete-${enrollment.id}`,
            icon: "completion",
            message: `Completed ${enrollment.courseName}`,
            detail: "Course completion recorded",
            date: new Date(enrollment.completedAt),
          });
        }
      }
      for (const order of data.orders) {
        if (!order.createdAt) continue;
        activity.push({
          id: `order-${order.id}`,
          icon: "order",
          message: `Order ${order.status}: ${order.items.map((item) => item.code).join(", ") || "purchase"}`,
          detail: new Intl.NumberFormat("en-US", { style: "currency", currency: (order.currency || "usd").toUpperCase() }).format(order.totalCents / 100),
          date: new Date(order.createdAt),
        });
      }
      for (const documentItem of data.documents) {
        activity.push({
          id: `doc-${documentItem.id}`,
          icon: documentItem.kind === "course_certificate" ? "certificate" : "document",
          message: documentItem.kind === "course_certificate"
            ? `Certificate issued: ${documentItem.displayName}`
            : `Document added: ${documentItem.displayName}`,
          detail: documentItem.kind.replaceAll("_", " "),
          date: documentItem.createdAt ? new Date(documentItem.createdAt) : null,
        });
      }

      activity.sort((a, b) => (b.date?.getTime() ?? 0) - (a.date?.getTime() ?? 0));
      setItems(activity.slice(0, 60));
    } catch (error) {
      console.error("Error loading account activity:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return;
    void load();
  }, [isAuthenticated, load]);

  if (authLoading || !isAuthenticated || isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Notifications</h1>
          <p className="text-muted-foreground">Loading your activity…</p>
        </div>
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex items-start gap-4">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/4" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Notifications</h1>
        <p className="text-muted-foreground">Your account activity — enrollments, purchases, and certificates.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent activity</CardTitle>
          <CardDescription>Only your own account events are shown here.</CardDescription>
        </CardHeader>
        <CardContent>
          {items.length > 0 ? (
            <div className="space-y-4">
              {items.map((item) => (
                <div key={item.id} className="flex items-start gap-4 p-4 rounded-lg border">
                  <div className="w-10 h-10 rounded-full bg-[#1478ac]/10 flex items-center justify-center shrink-0 text-[#1478ac]">
                    {ICONS[item.icon]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{item.message}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-xs">{item.detail}</Badge>
                      <p className="text-xs text-muted-foreground">{item.date ? getRelativeTime(item.date) : ""}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <BellOff className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No account activity yet</p>
              <p className="text-sm text-muted-foreground mt-1">
                Enroll in a course to get started.{" "}
                <Link href="/portal/courses" className="text-[#1478ac] underline">Browse the catalog</Link>
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
