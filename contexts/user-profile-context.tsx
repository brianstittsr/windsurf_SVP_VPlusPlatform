"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { onAuthStateChanged, User as FirebaseUser } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { getTeamMemberByAuthUid, findAndLinkTeamMember, updateTeamMemberProfile } from "@/lib/auth-team-member-link";
import type { TeamMemberDoc } from "@/lib/schema";

// User profile fields
export interface UserProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  company: string;
  jobTitle: string;
  location: string;
  bio: string;
  avatarUrl: string;
  role: "admin" | "affiliate" | "customer" | "team_member";
  
  // Affiliate-specific fields
  isAffiliate: boolean;
  affiliateOnboardingComplete: boolean;
  affiliateAgreementSigned: boolean;
  affiliateAgreementDate: string | null;
  
  // Networking profile (for affiliates)
  networkingProfile: {
    expertise: string[];
    categories: string[];
    idealReferralPartner: string;
    topReferralSources: string;
    goalsThisQuarter: string;
    uniqueValueProposition: string;
    targetClientProfile: string;
    problemsYouSolve: string;
    successStory: string;
  };
  
  // Profile completion tracking
  profileCompletedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

// Default empty profile
const defaultProfile: UserProfile = {
  id: "",
  email: "",
  firstName: "",
  lastName: "",
  phone: "",
  company: "",
  jobTitle: "",
  location: "",
  bio: "",
  avatarUrl: "",
  role: "team_member",
  isAffiliate: false,
  affiliateOnboardingComplete: false,
  affiliateAgreementSigned: false,
  affiliateAgreementDate: null,
  networkingProfile: {
    expertise: [],
    categories: [],
    idealReferralPartner: "",
    topReferralSources: "",
    goalsThisQuarter: "",
    uniqueValueProposition: "",
    targetClientProfile: "",
    problemsYouSolve: "",
    successStory: "",
  },
  profileCompletedAt: null,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

// Calculate profile completion percentage
export function calculateProfileCompletion(profile: UserProfile): number {
  const requiredFields = [
    profile.firstName,
    profile.lastName,
    profile.email,
    profile.phone,
    profile.company,
    profile.jobTitle,
    profile.location,
    profile.bio,
  ];
  
  const completedFields = requiredFields.filter((field) => field && field.trim() !== "").length;
  return Math.round((completedFields / requiredFields.length) * 100);
}

// Calculate affiliate networking profile completion
export function calculateNetworkingCompletion(profile: UserProfile): number {
  if (!profile.isAffiliate) return 100;
  
  const networkingFields = [
    profile.networkingProfile.expertise.length > 0,
    profile.networkingProfile.categories.length > 0,
    profile.networkingProfile.idealReferralPartner,
    profile.networkingProfile.topReferralSources,
    profile.networkingProfile.goalsThisQuarter,
    profile.networkingProfile.uniqueValueProposition,
    profile.networkingProfile.targetClientProfile,
    profile.networkingProfile.problemsYouSolve,
  ];
  
  const completedFields = networkingFields.filter((field) => {
    if (typeof field === "boolean") return field;
    return field && String(field).trim() !== "";
  }).length;
  
  return Math.round((completedFields / networkingFields.length) * 100);
}

// Check if profile is complete
export function isProfileComplete(profile: UserProfile): boolean {
  return calculateProfileCompletion(profile) === 100;
}

// Check if affiliate onboarding is needed
export function needsAffiliateOnboarding(profile: UserProfile): boolean {
  return profile.isAffiliate && !profile.affiliateOnboardingComplete;
}

// Map TeamMemberDoc to UserProfile
function mapTeamMemberToProfile(teamMember: TeamMemberDoc): Partial<UserProfile> {
  return {
    id: teamMember.id,
    email: teamMember.emailPrimary || "",
    firstName: teamMember.firstName || "",
    lastName: teamMember.lastName || "",
    phone: teamMember.mobile || "",
    company: teamMember.company || "",
    jobTitle: teamMember.title || "",
    location: teamMember.location || "",
    bio: teamMember.bio || "",
    avatarUrl: teamMember.avatar || "",
    role: teamMember.role === "admin" ? "admin" : 
          teamMember.role === "affiliate" ? "affiliate" : 
          teamMember.role === "consultant" ? "affiliate" : "team_member",
    isAffiliate: teamMember.role === "affiliate" || teamMember.role === "consultant",
  };
}

// Map UserProfile back to TeamMemberDoc for saving
function mapProfileToTeamMember(profile: UserProfile): Partial<TeamMemberDoc> {
  return {
    firstName: profile.firstName,
    lastName: profile.lastName,
    emailPrimary: profile.email,
    mobile: profile.phone,
    company: profile.company,
    title: profile.jobTitle,
    location: profile.location,
    bio: profile.bio,
    avatar: profile.avatarUrl,
  };
}

// Context type
interface UserProfileContextType {
  profile: UserProfile;
  setProfile: (profile: UserProfile) => void;
  updateProfile: (updates: Partial<UserProfile>) => void;
  saveProfile: () => Promise<{ success: boolean; error?: string }>;
  isSaving: boolean;
  profileCompletion: number;
  networkingCompletion: number;
  isComplete: boolean;
  needsOnboarding: boolean;
  showProfileWizard: boolean;
  setShowProfileWizard: (show: boolean) => void;
  showAffiliateOnboarding: boolean;
  setShowAffiliateOnboarding: (show: boolean) => void;
  getDisplayName: () => string;
  getInitials: () => string;
  isLoading: boolean;
  isAuthenticated: boolean;
  linkedTeamMember: TeamMemberDoc | null;
}

const UserProfileContext = createContext<UserProfileContextType | undefined>(undefined);

export function UserProfileProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<UserProfile>(defaultProfile);
  const [showProfileWizard, setShowProfileWizard] = useState(false);
  const [showAffiliateOnboarding, setShowAffiliateOnboarding] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [linkedTeamMember, setLinkedTeamMember] = useState<TeamMemberDoc | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const profileCompletion = calculateProfileCompletion(profile);
  const networkingCompletion = calculateNetworkingCompletion(profile);
  const isComplete = isProfileComplete(profile);
  const needsOnboarding = needsAffiliateOnboarding(profile);

  // Listen to Firebase Auth state and fetch linked Team Member
  useEffect(() => {
    if (!auth) {
      console.warn("Firebase Auth not initialized");
      setIsLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      setIsLoading(true);
      
      if (firebaseUser) {
        setIsAuthenticated(true);
        console.log("User authenticated:", firebaseUser.uid, firebaseUser.email);
        
        try {
          // Try to find and link Team Member by UID first, then by email
          let teamMember = await getTeamMemberByAuthUid(firebaseUser.uid);
          
          if (!teamMember && firebaseUser.email) {
            // Try to find and link by email
            teamMember = await findAndLinkTeamMember(firebaseUser.email, firebaseUser.uid);
          }
          
          if (teamMember) {
            console.log("Linked Team Member found:", teamMember.id, teamMember.firstName, teamMember.lastName);
            setLinkedTeamMember(teamMember);
            
            // Map Team Member data to profile
            const mappedProfile = mapTeamMemberToProfile(teamMember);
            setProfile((prev) => ({
              ...prev,
              ...mappedProfile,
              updatedAt: new Date().toISOString(),
            }));
          } else {
            console.log("No linked Team Member found for user:", firebaseUser.email);
            setLinkedTeamMember(null);
            // Set basic profile from Firebase Auth
            setProfile((prev) => ({
              ...prev,
              id: firebaseUser.uid,
              email: firebaseUser.email || "",
              firstName: firebaseUser.displayName?.split(" ")[0] || "",
              lastName: firebaseUser.displayName?.split(" ").slice(1).join(" ") || "",
              avatarUrl: firebaseUser.photoURL || "",
              updatedAt: new Date().toISOString(),
            }));
          }
        } catch (error) {
          console.error("Error fetching Team Member:", error);
        }
      } else {
        setIsAuthenticated(false);
        setLinkedTeamMember(null);
        setProfile(defaultProfile);
      }
      
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Check if wizards should be shown after profile is loaded
  useEffect(() => {
    // Don't show wizard while loading or if not authenticated
    if (isLoading || !isAuthenticated) {
      return;
    }
    
    // Only show profile wizard if profile is incomplete
    if (!isComplete) {
      setShowProfileWizard(true);
    } else if (needsOnboarding) {
      setShowAffiliateOnboarding(true);
    }
  }, [isLoading, isAuthenticated, isComplete, needsOnboarding]);

  const updateProfile = (updates: Partial<UserProfile>) => {
    setProfile((prev) => ({
      ...prev,
      ...updates,
      updatedAt: new Date().toISOString(),
    }));
  };

  const saveProfile = async (): Promise<{ success: boolean; error?: string }> => {
    if (!linkedTeamMember) {
      return { success: false, error: "No linked team member found. Cannot save profile." };
    }

    setIsSaving(true);
    try {
      const teamMemberUpdates = mapProfileToTeamMember(profile);
      const updatedTeamMember = await updateTeamMemberProfile(linkedTeamMember.id, teamMemberUpdates);
      
      if (updatedTeamMember) {
        setLinkedTeamMember(updatedTeamMember);
        console.log("Profile saved successfully to Team Member:", updatedTeamMember.id);
        return { success: true };
      } else {
        return { success: false, error: "Failed to update team member profile." };
      }
    } catch (error) {
      console.error("Error saving profile:", error);
      return { success: false, error: "An error occurred while saving the profile." };
    } finally {
      setIsSaving(false);
    }
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
        saveProfile,
        isSaving,
        profileCompletion,
        networkingCompletion,
        isComplete,
        needsOnboarding,
        showProfileWizard,
        setShowProfileWizard,
        showAffiliateOnboarding,
        setShowAffiliateOnboarding,
        getDisplayName,
        getInitials,
        isLoading,
        isAuthenticated,
        linkedTeamMember,
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
