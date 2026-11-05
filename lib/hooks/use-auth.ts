"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useUserProfile } from "@/contexts/user-profile-context";
import type { LmsRole } from "@/lib/schema";

/**
 * Redirects unauthenticated users to /sign-in. When `roles` is given,
 * also redirects signed-in users whose role is not included.
 */
export function useRequireAuth(roles?: LmsRole[]) {
  const router = useRouter();
  const pathname = usePathname();
  const { isLoading, isAuthenticated, profile } = useUserProfile();

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated) {
      router.push(`/sign-in?next=${encodeURIComponent(pathname)}`);
      return;
    }
    if (roles && !roles.includes(profile.role)) {
      router.push("/portal");
    }
  }, [isLoading, isAuthenticated, profile.role, roles, router, pathname]);

  return { isLoading, isAuthenticated, profile };
}
