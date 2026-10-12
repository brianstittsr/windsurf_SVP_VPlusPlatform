"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { onAuthStateChanged, User as FirebaseUser } from "firebase/auth";
import { addDoc, collection, doc, Timestamp, updateDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { getTeamMemberByAuthUid, findAndLinkTeamMember } from "@/lib/auth-team-member-link";
import { COLLECTIONS, type TeamMemberDoc } from "@/lib/schema";

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
  
  // Extended fields persisted as extra fields on the teamMembers doc
  linkedin?: string;
  website?: string;
  twitter?: string;
  facebook?: string;
  instagram?: string;
  youtube?: string;
  industries?: string[];
  certifications?: Array<{
    id: string;
    name: string;
    issuer: string;
    date: string;
    expires?: string | null;
    status?: string;
  }>;
  availability?: { oneToOne: boolean; speaking: boolean; consulting: boolean };
  canOffer?: string;
  lookingFor?: string;

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
  const savedNetworking = (teamMember.networkingProfile || {}) as Partial<UserProfile["networkingProfile"]>;
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
    linkedin: teamMember.linkedIn || "",
    website: teamMember.website || "",
    twitter: teamMember.twitter || "",
    facebook: teamMember.facebook || "",
    instagram: teamMember.instagram || "",
    youtube: teamMember.youtube || "",
    industries: teamMember.industries || [],
    certifications: teamMember.certifications || [],
    availability: teamMember.availability || { oneToOne: true, speaking: true, consulting: true },
    canOffer: teamMember.canOffer || "",
    lookingFor: teamMember.lookingFor || "",
    affiliateOnboardingComplete: teamMember.affiliateOnboardingComplete ?? false,
    affiliateAgreementSigned: teamMember.affiliateAgreementSigned ?? false,
    affiliateAgreementDate: teamMember.affiliateAgreementDate || null,
    networkingProfile: {
      expertise: savedNetworking.expertise || [],
      categories: savedNetworking.categories || [],
      idealReferralPartner: savedNetworking.idealReferralPartner || "",
      topReferralSources: savedNetworking.topReferralSources || "",
      goalsThisQuarter: savedNetworking.goalsThisQuarter || "",
      uniqueValueProposition: savedNetworking.uniqueValueProposition || "",
      targetClientProfile: savedNetworking.targetClientProfile || "",
      problemsYouSolve: savedNetworking.problemsYouSolve || "",
      successStory: savedNetworking.successStory || "",
    },
    profileCompletedAt: teamMember.profileCompletedAt || null,
  };
}

// Map UserProfile fields back to teamMembers doc fields.
// Undefined values are stripped so updateDoc doesn't reject them.
function profileToTeamMemberFields(p: UserProfile): Record<string, unknown> {
  const raw: Record<string, unknown> = {
    firstName: p.firstName,
    lastName: p.lastName,
    emailPrimary: p.email,
    mobile: p.phone,
    title: p.jobTitle,
    company: p.company,
    location: p.location,
    bio: p.bio,
    avatar: p.avatarUrl,
    linkedIn: p.linkedin,
    website: p.website,
    twitter: p.twitter,
    facebook: p.facebook,
    instagram: p.instagram,
    youtube: p.youtube,
    industries: p.industries,
    certifications: p.certifications,
    availability: p.availability,
    canOffer: p.canOffer,
    lookingFor: p.lookingFor,
    expertise: p.networkingProfile.expertise.join(", "),
    networkingProfile: p.networkingProfile,
    affiliateOnboardingComplete: p.affiliateOnboardingComplete,
    affiliateAgreementSigned: p.affiliateAgreementSigned,
    affiliateAgreementDate: p.affiliateAgreementDate,
    profileCompletedAt: p.profileCompletedAt,
  };
  return Object.fromEntries(Object.entries(raw).filter(([, v]) => v !== undefined));
}

// Context type
interface UserProfileContextType {
  profile: UserProfile;
  setProfile: (profile: UserProfile) => void;
  updateProfile: (updates: Partial<UserProfile>) => void;
  saveProfile: (updates: Partial<UserProfile>) => Promise<boolean>;
  firebaseUser: FirebaseUser | null;
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
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);

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
      setFirebaseUser(firebaseUser);
      
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

  // Persist profile updates to the linked teamMembers Firestore doc.
  // Creates a new doc (role: "affiliate") when the user has no linked doc.
  const saveProfile = async (updates: Partial<UserProfile>): Promise<boolean> => {
    const merged = { ...profile, ...updates, updatedAt: new Date().toISOString() };
    setProfile(merged);

    if (!db) {
      console.error("Firebase not initialized - profile not persisted");
      return false;
    }

    try {
      const docFields = {
        ...profileToTeamMemberFields(merged),
        updatedAt: Timestamp.now(),
      };

      let memberId = linkedTeamMember?.id;

      // Retry linking in case a teamMembers doc was created since sign-in
      if (!memberId && firebaseUser) {
        const found = await findAndLinkTeamMember(firebaseUser.email || merged.email, firebaseUser.uid);
        if (found) {
          memberId = found.id;
          setLinkedTeamMember(found);
        }
      }

      if (memberId) {
        await updateDoc(doc(db, COLLECTIONS.TEAM_MEMBERS, memberId), docFields);
        setLinkedTeamMember((prev) =>
          prev && prev.id === memberId ? ({ ...prev, ...docFields } as TeamMemberDoc) : prev
        );
      } else {
        const payload = {
          ...docFields,
          firebaseUid: firebaseUser?.uid,
          role: "affiliate" as const,
          status: "active" as const,
          createdAt: Timestamp.now(),
        };
        const docRef = await addDoc(collection(db, COLLECTIONS.TEAM_MEMBERS), payload);
        setLinkedTeamMember({ id: docRef.id, ...payload } as TeamMemberDoc);
        setProfile((prev) => ({ ...prev, id: docRef.id }));
      }

      return true;
    } catch (error) {
      console.error("Error saving profile to Firestore:", error);
      return false;
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
        firebaseUser,
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
