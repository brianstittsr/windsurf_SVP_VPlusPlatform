"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { onAuthStateChanged, User as FirebaseUser } from "firebase/auth";
import { auth } from "@/lib/firebase";
import {
  getTeamMemberByAuthUid,
  syncRoleDoc,
} from "@/lib/auth-team-member-link";
import type { LmsRole, TeamMemberDoc } from "@/lib/schema";

// User profile fields
export interface UserProfile {
  id: string;
  firebaseUid: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  company: string;
  jobTitle: string;
  location: string;
  bio: string;
  avatarUrl: string;
  role: LmsRole;
  isVeteran: boolean;
  organizationId: string | null;
  proStatus: "inactive" | "active" | "canceled" | "past_due";
  proPlanId: string | null;
  proExpiresAt: string | null;
  cancelAtPeriodEnd: boolean;
  createdAt: string;
  updatedAt: string;
}

const defaultProfile: UserProfile = {
  id: "",
  firebaseUid: "",
  email: "",
  firstName: "",
  lastName: "",
  phone: "",
  company: "",
  jobTitle: "",
  location: "",
  bio: "",
  avatarUrl: "",
  role: "student",
  isVeteran: false,
  organizationId: null,
  proStatus: "inactive",
  proPlanId: null,
  proExpiresAt: null,
  cancelAtPeriodEnd: false,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

// Map a user record to the profile shape. Legacy roles degrade to "student".
function mapRecordToProfile(record: TeamMemberDoc): Partial<UserProfile> {
  const recordAny = record as TeamMemberDoc & {
    isVeteran?: boolean;
    organizationId?: string;
  };
  return {
    id: record.id,
    firebaseUid: record.firebaseUid || "",
    email: record.emailPrimary || "",
    firstName: record.firstName || "",
    lastName: record.lastName || "",
    phone: record.mobile || "",
    company: record.company || "",
    jobTitle: record.title || "",
    location: record.location || "",
    bio: record.bio || "",
    avatarUrl: record.avatar || "",
    role:
      record.role === "admin"
        ? "admin"
        : record.role === "instructor" || record.role === "team"
          ? "instructor"
          : "student",
    isVeteran: recordAny.isVeteran === true,
    organizationId: recordAny.organizationId || null,
    proStatus: record.proStatus || "inactive",
    proPlanId: record.proPlanId || null,
    proExpiresAt: record.proExpiresAt?.toDate?.().toISOString() || null,
    cancelAtPeriodEnd: record.cancelAtPeriodEnd === true,
  };
}

interface UserProfileContextType {
  profile: UserProfile;
  setProfile: (profile: UserProfile) => void;
  updateProfile: (updates: Partial<UserProfile>) => void;
  getDisplayName: () => string;
  getInitials: () => string;
  isLoading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isInstructor: boolean;
  linkedUserRecord: TeamMemberDoc | null;
}

const UserProfileContext = createContext<UserProfileContextType | undefined>(
  undefined
);

export function UserProfileProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<UserProfile>(defaultProfile);
  // If Firebase isn't configured, auth is permanently null — not loading.
  const [isLoading, setIsLoading] = useState(() => auth !== null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [linkedUserRecord, setLinkedUserRecord] =
    useState<TeamMemberDoc | null>(null);

  useEffect(() => {
    if (!auth) {
      console.warn("Firebase Auth not initialized");
      return;
    }

    const unsubscribe = onAuthStateChanged(
      auth,
      async (firebaseUser: FirebaseUser | null) => {
        setIsLoading(true);

        if (firebaseUser) {
          setIsAuthenticated(true);
          try {
            let record = await getTeamMemberByAuthUid(firebaseUser.uid);
            if (!record && firebaseUser.email) {
              const idToken = await firebaseUser.getIdToken();
              const displayParts = (firebaseUser.displayName || "").trim().split(/\s+/);
              const response = await fetch("/api/profile/bootstrap", {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${idToken}` },
                body: JSON.stringify({ firstName: displayParts[0] || "", lastName: displayParts.slice(1).join(" ") }),
              });
              if (response.ok) record = await getTeamMemberByAuthUid(firebaseUser.uid);
            }

            if (record) {
              setLinkedUserRecord(record);
              const mappedProfile = mapRecordToProfile(record);
              syncRoleDoc(
                firebaseUser.uid,
                mappedProfile.role || "student"
              ).catch(() => {});
              setProfile((prev) => ({
                ...prev,
                ...mappedProfile,
                updatedAt: new Date().toISOString(),
              }));
            } else {
              setLinkedUserRecord(null);
              setProfile((prev) => ({
                ...prev,
                id: firebaseUser.uid,
                firebaseUid: firebaseUser.uid,
                email: firebaseUser.email || "",
                firstName: firebaseUser.displayName?.split(" ")[0] || "",
                lastName:
                  firebaseUser.displayName?.split(" ").slice(1).join(" ") || "",
                avatarUrl: firebaseUser.photoURL || "",
                updatedAt: new Date().toISOString(),
              }));
            }
          } catch (error) {
            console.error("Error fetching user record:", error);
          }
        } else {
          setIsAuthenticated(false);
          setLinkedUserRecord(null);
          setProfile(defaultProfile);
        }

        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const updateProfile = (updates: Partial<UserProfile>) => {
    setProfile((prev) => ({
      ...prev,
      ...updates,
      updatedAt: new Date().toISOString(),
    }));
  };

  const getDisplayName = () => {
    if (profile.firstName && profile.lastName) {
      return `${profile.firstName} ${profile.lastName}`;
    }
    if (profile.firstName) return profile.firstName;
    if (profile.email) return profile.email.split("@")[0];
    return "User";
  };

  const getInitials = () => {
    if (profile.firstName && profile.lastName) {
      return `${profile.firstName[0]}${profile.lastName[0]}`.toUpperCase();
    }
    if (profile.firstName) return profile.firstName[0].toUpperCase();
    if (profile.email) return profile.email[0].toUpperCase();
    return "U";
  };

  return (
    <UserProfileContext.Provider
      value={{
        profile,
        setProfile,
        updateProfile,
        getDisplayName,
        getInitials,
        isLoading,
        isAuthenticated,
        isAdmin: profile.role === "admin",
        isInstructor: profile.role === "instructor" || profile.role === "admin",
        linkedUserRecord,
      }}
    >
      {children}
    </UserProfileContext.Provider>
  );
}

export function useUserProfile() {
  const context = useContext(UserProfileContext);
  if (context === undefined) {
    throw new Error("useUserProfile must be used within a UserProfileProvider");
  }
  return context;
}
