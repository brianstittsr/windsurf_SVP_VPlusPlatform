"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { onAuthStateChanged, User as FirebaseUser } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { getTeamMemberByAuthUid, findAndLinkTeamMember, updateTeamMemberProfile } from "@/lib/auth-team-member-link";
import type { TeamMemberDoc } from "@/lib/schema";
import { ENHANCED_COLLECTIONS, type NetworkingProfileDoc } from "@/lib/schema-extensions";
import { doc, setDoc, getDoc, Timestamp, addDoc, collection } from "firebase/firestore";
import { COLLECTIONS } from "@/lib/schema";

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
    // Business information fields (from Networking Profile Setup)
    businessType: string;
    industry: string[];
    targetCustomers: string;
    servicesOffered: string;
    geographicFocus: string[];
    networkingGoals: string[];
    meetingFrequency: string;
    availableDays: string[];
    timePreference: string;
    communicationPreference: string;
    lookingFor: string[];
    canProvide: string[];
    additionalNotes: string;
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
    // Business information fields
    businessType: "",
    industry: [],
    targetCustomers: "",
    servicesOffered: "",
    geographicFocus: [],
    networkingGoals: [],
    meetingFrequency: "",
    availableDays: [],
    timePreference: "",
    communicationPreference: "",
    lookingFor: [],
    canProvide: [],
    additionalNotes: "",
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
    // Include expertise as comma-separated string for TeamMemberDoc
    expertise: profile.networkingProfile?.expertise?.join(", ") || "",
  };
}

// Save networking profile to the networkingProfiles collection
async function saveNetworkingProfile(
  affiliateId: string,
  networkingProfile: UserProfile["networkingProfile"]
): Promise<boolean> {
  if (!db) {
    console.error("Firebase not initialized");
    return false;
  }

  try {
    const profileRef = doc(db, ENHANCED_COLLECTIONS.NETWORKING_PROFILES, affiliateId);
    const existingDoc = await getDoc(profileRef);
    
    // Save all networking profile fields including business information
    const profileData: Record<string, any> = {
      affiliateId,
      expertise: networkingProfile.expertise || [],
      categories: networkingProfile.categories || [],
      idealReferralPartner: networkingProfile.idealReferralPartner || "",
      topReferralSources: networkingProfile.topReferralSources || "",
      goalsThisQuarter: networkingProfile.goalsThisQuarter || "",
      uniqueValueProposition: networkingProfile.uniqueValueProposition || "",
      targetClientProfile: networkingProfile.targetClientProfile || "",
      problemsYouSolve: networkingProfile.problemsYouSolve || "",
      successStory: networkingProfile.successStory || "",
      // Business information fields
      businessType: networkingProfile.businessType || "",
      industry: networkingProfile.industry || [],
      targetCustomers: networkingProfile.targetCustomers || "",
      servicesOffered: networkingProfile.servicesOffered || "",
      geographicFocus: networkingProfile.geographicFocus || [],
      networkingGoals: networkingProfile.networkingGoals || [],
      meetingFrequency: networkingProfile.meetingFrequency || "",
      availableDays: networkingProfile.availableDays || [],
      timePreference: networkingProfile.timePreference || "",
      communicationPreference: networkingProfile.communicationPreference || "",
      lookingFor: networkingProfile.lookingFor || [],
      canProvide: networkingProfile.canProvide || [],
      additionalNotes: networkingProfile.additionalNotes || "",
      updatedAt: Timestamp.now(),
    };

    if (existingDoc.exists()) {
      // Update existing document
      await setDoc(profileRef, profileData, { merge: true });
    } else {
      // Create new document
      await setDoc(profileRef, {
        ...profileData,
        id: affiliateId,
        isComplete: false,
        createdAt: Timestamp.now(),
      });
    }
    
    console.log("Networking profile saved for affiliate:", affiliateId);
    return true;
  } catch (error) {
    console.error("Error saving networking profile:", error);
    return false;
  }
}

// Create a new team member record for a new user
async function createTeamMember(
  profile: UserProfile,
  firebaseUid: string
): Promise<TeamMemberDoc | null> {
  if (!db) {
    console.error("Firebase not initialized");
    return null;
  }

  try {
    const teamMemberData = {
      firebaseUid,
      firstName: profile.firstName,
      lastName: profile.lastName,
      emailPrimary: profile.email,
      mobile: profile.phone || "",
      company: profile.company || "",
      title: profile.jobTitle || "",
      location: profile.location || "",
      bio: profile.bio || "",
      avatar: profile.avatarUrl || "",
      expertise: profile.networkingProfile?.expertise?.join(", ") || "",
      role: profile.isAffiliate ? "affiliate" as const : "team" as const,
      status: "active" as const,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };

    const docRef = await addDoc(collection(db, COLLECTIONS.TEAM_MEMBERS), teamMemberData);
    console.log("Created new team member:", docRef.id);
    
    return { id: docRef.id, ...teamMemberData } as TeamMemberDoc;
  } catch (error) {
    console.error("Error creating team member:", error);
    return null;
  }
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
  showNetworkingWizard: boolean;
  setShowNetworkingWizard: (show: boolean) => void;
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
  const [showNetworkingWizard, setShowNetworkingWizard] = useState(false);
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
            
            // Also fetch networking profile from separate collection
            let networkingProfileData = defaultProfile.networkingProfile;
            if (db) {
              try {
                const networkingProfileRef = doc(db, ENHANCED_COLLECTIONS.NETWORKING_PROFILES, teamMember.id);
                const networkingDoc = await getDoc(networkingProfileRef);
                if (networkingDoc.exists()) {
                  const npData = networkingDoc.data() as any;
                  networkingProfileData = {
                    expertise: npData.expertise || [],
                    categories: npData.categories || [],
                    idealReferralPartner: npData.idealReferralPartner || "",
                    topReferralSources: npData.topReferralSources || "",
                    goalsThisQuarter: npData.networkingGoals?.[0] || npData.goalsThisQuarter || "",
                    uniqueValueProposition: npData.canProvide?.[0] || npData.uniqueValueProposition || "",
                    targetClientProfile: npData.lookingFor?.[0] || npData.targetClientProfile || "",
                    problemsYouSolve: npData.problemsYouSolve || "",
                    successStory: npData.successStory || "",
                    // Business information fields
                    businessType: npData.businessType || "",
                    industry: npData.industry || [],
                    targetCustomers: npData.targetCustomers || "",
                    servicesOffered: npData.servicesOffered || "",
                    geographicFocus: npData.geographicFocus || [],
                    networkingGoals: npData.networkingGoals || [],
                    meetingFrequency: npData.meetingFrequency || "",
                    availableDays: npData.availableDays || [],
                    timePreference: npData.timePreference || "",
                    communicationPreference: npData.communicationPreference || "",
                    lookingFor: npData.lookingFor || [],
                    canProvide: npData.canProvide || [],
                    additionalNotes: npData.additionalNotes || "",
                  };
                  console.log("Loaded networking profile for:", teamMember.id);
                }
              } catch (npError) {
                console.error("Error fetching networking profile:", npError);
              }
            }
            
            setProfile((prev) => ({
              ...prev,
              ...mappedProfile,
              networkingProfile: networkingProfileData,
              updatedAt: new Date().toISOString(),
            }));
          } else {
            console.log("No linked Team Member found for user:", firebaseUser.email);
            setLinkedTeamMember(null);
            
            // Try to get registration data from sessionStorage (set during sign-up)
            const registrationName = typeof window !== 'undefined' ? sessionStorage.getItem("svp_user_name") : null;
            const registrationEmail = typeof window !== 'undefined' ? sessionStorage.getItem("svp_user_email") : null;
            const registrationCompany = typeof window !== 'undefined' ? sessionStorage.getItem("svp_user_company") : null;
            const registrationPhone = typeof window !== 'undefined' ? sessionStorage.getItem("svp_user_phone") : null;
            const registrationType = typeof window !== 'undefined' ? sessionStorage.getItem("svp_user_type") : null;
            
            // Parse name from registration or Firebase
            let firstName = firebaseUser.displayName?.split(" ")[0] || "";
            let lastName = firebaseUser.displayName?.split(" ").slice(1).join(" ") || "";
            
            if (registrationName) {
              const nameParts = registrationName.split(" ");
              firstName = nameParts[0] || firstName;
              lastName = nameParts.slice(1).join(" ") || lastName;
            }
            
            // Set profile from Firebase Auth + registration data
            setProfile((prev) => ({
              ...prev,
              id: firebaseUser.uid,
              email: registrationEmail || firebaseUser.email || "",
              firstName,
              lastName,
              company: registrationCompany || "",
              phone: registrationPhone || "",
              avatarUrl: firebaseUser.photoURL || "",
              isAffiliate: registrationType === "affiliate",
              role: registrationType === "affiliate" ? "affiliate" : prev.role,
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
    
    // For AFFILIATES: Use the Affiliate Onboarding Wizard which includes ALL profile and networking fields
    // Skip the separate profile wizard entirely for affiliates
    if (profile.isAffiliate) {
      // If affiliate onboarding is not complete, show the affiliate onboarding wizard
      if (!profile.affiliateOnboardingComplete) {
        setShowProfileWizard(false); // Never show profile wizard for affiliates
        setShowNetworkingWizard(false); // Never show networking wizard for affiliates
        setShowAffiliateOnboarding(true);
      } else {
        // Affiliate onboarding is complete - don't show any wizards
        setShowProfileWizard(false);
        setShowNetworkingWizard(false);
        setShowAffiliateOnboarding(false);
      }
      return;
    }
    
    // For NON-AFFILIATES: Use the standard profile wizard
    if (!isComplete) {
      setShowProfileWizard(true);
      setShowNetworkingWizard(false);
      setShowAffiliateOnboarding(false);
    }
  }, [isLoading, isAuthenticated, isComplete, profile.isAffiliate, profile.affiliateOnboardingComplete]);

  const updateProfile = (updates: Partial<UserProfile>) => {
    setProfile((prev) => ({
      ...prev,
      ...updates,
      updatedAt: new Date().toISOString(),
    }));
  };

  const saveProfile = async (): Promise<{ success: boolean; error?: string }> => {
    setIsSaving(true);
    
    try {
      let teamMemberId = linkedTeamMember?.id;
      let currentTeamMember = linkedTeamMember;
      
      // If no linked team member, create one
      if (!currentTeamMember && profile.id) {
        console.log("No linked team member, creating new one...");
        const newTeamMember = await createTeamMember(profile, profile.id);
        if (newTeamMember) {
          currentTeamMember = newTeamMember;
          teamMemberId = newTeamMember.id;
          setLinkedTeamMember(newTeamMember);
        } else {
          return { success: false, error: "Failed to create team member profile." };
        }
      }
      
      if (!teamMemberId) {
        return { success: false, error: "No team member ID available. Please sign in again." };
      }

      // Update team member basic profile
      const teamMemberUpdates = mapProfileToTeamMember(profile);
      const updatedTeamMember = await updateTeamMemberProfile(teamMemberId, teamMemberUpdates);
      
      if (updatedTeamMember) {
        setLinkedTeamMember(updatedTeamMember);
        console.log("Profile saved successfully to Team Member:", updatedTeamMember.id);
      }
      
      // Save networking profile to separate collection (for affiliates)
      if (profile.isAffiliate && profile.networkingProfile) {
        const networkingSaved = await saveNetworkingProfile(teamMemberId, profile.networkingProfile);
        if (!networkingSaved) {
          console.warn("Failed to save networking profile, but team member was updated");
        }
      }
      
      return { success: true };
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
        showNetworkingWizard,
        setShowNetworkingWizard,
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
