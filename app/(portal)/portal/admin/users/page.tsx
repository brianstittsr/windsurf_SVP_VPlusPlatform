"use client";

import { useEffect, useState } from "react";
import { useRequireAuth } from "@/lib/hooks/use-auth";
import { listUsers, updateUserRole } from "@/lib/lms";
import { logAudit } from "@/lib/activity-logger";
import type { TeamMemberDoc } from "@/lib/schema";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

export default function AdminUsersPage() {
  const { isLoading, isAuthenticated, profile } = useRequireAuth(["admin"]);
  const [users, setUsers] = useState<TeamMemberDoc[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setUsers(await listUsers());
    setLoading(false);
  };

  useEffect(() => {
    if (!isAuthenticated) return;
    let cancelled = false;
    void (async () => {
      const data = await listUsers();
      if (!cancelled) {
        setUsers(data);
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated]);

  const changeRole = async (
    user: TeamMemberDoc,
    role: "admin" | "instructor" | "student"
  ) => {
    try {
      await updateUserRole(user.id, role);
      await logAudit({
        actorId: profile.id,
        actorEmail: profile.email,
        action: "user.role_changed",
        entityType: "user",
        entityId: user.id,
        metadata: { from: user.role, to: role },
      });
      toast.success(
        `${user.firstName} ${user.lastName} is now ${role}`
      );
      load();
    } catch {
      toast.error("Failed to update role");
    }
  };

  if (isLoading || !isAuthenticated || loading) {
    return <Skeleton className="h-96 w-full" />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold font-display">Users</h1>
        <p className="text-muted-foreground">
          Manage student, instructor, and admin roles
        </p>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Organization</TableHead>
                <TableHead>Veteran</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Role</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((u) => (
                <TableRow key={u.id}>
                  <TableCell className="font-medium">
                    {u.firstName} {u.lastName}
                  </TableCell>
                  <TableCell>{u.emailPrimary}</TableCell>
                  <TableCell>{u.company || "—"}</TableCell>
                  <TableCell>
                    {(u as unknown as { isVeteran?: boolean }).isVeteran ? (
                      <Badge className="bg-[#1478ac]">Veteran</Badge>
                    ) : (
                      "—"
                    )}
                  </TableCell>
                  <TableCell>{u.status}</TableCell>
                  <TableCell>
                    <Select
                      value={u.role}
                      onValueChange={(v) =>
                        changeRole(
                          u,
                          v as "admin" | "instructor" | "student"
                        )
                      }
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="student">Student</SelectItem>
                        <SelectItem value="instructor">Instructor</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                      </SelectContent>
                    </Select>
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
