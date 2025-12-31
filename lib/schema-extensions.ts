/**
 * Schema Extensions for Enhanced Affiliate Networking System
 * 
 * These types extend the base schema with additional fields needed
 * for the new networking workflow and AI recommendation features.
 */

import { Timestamp } from "firebase/firestore";

// ============================================================================
// Enhanced Networking Profile Types
// ============================================================================

/** Enhanced Networking Profile document */
export interface NetworkingProfileDoc {
  id: string;
  affiliateId: string; // Reference to user/team member
  
  // Business Information (from networking setup form)
  businessType: "manufacturer" | "distributor" | "service-provider" | "consultant" | "supplier" | "other";
  industry: string[]; // Multiple industries
  targetCustomers: string;
  servicesOffered: string;
  geographicFocus: ("Local" | "Regional" | "National" | "International")[];
  
  // Networking Goals
  networkingGoals: string[]; // Selected from predefined list
  idealReferralPartner: string;
  expertise: string[]; // Areas of expertise
  lookingFor: string[]; // What they need
  canProvide: string[]; // What they can offer
  
  // Availability & Preferences
  meetingFrequency: "weekly" | "biweekly" | "monthly" | "flexible";
  availableDays: string[]; // ["Monday", "Tuesday", etc.]
  timePreference: "early-morning" | "morning" | "lunch" | "afternoon" | "evening" | "flexible";
  communicationPreference: "in-person" | "virtual" | "hybrid";
  
  // Profile Status
  isComplete: boolean;
  completedAt?: Timestamp;
  
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

/** Onboarding Progress Tracking document */
export interface OnboardingProgressDoc {
  id: string;
  affiliateId: string;
  
  // Step completion tracking
  steps: {
    register: { completed: boolean; completedAt?: Timestamp };
    profile: { completed: boolean; completedAt?: Timestamp };
    networkingForm: { completed: boolean; completedAt?: Timestamp };
    firstMeeting: { completed: boolean; completedAt?: Timestamp };
    meetingSummary: { completed: boolean; completedAt?: Timestamp };
  };
  
  // Overall progress
  completionPercentage: number;
  isFullyOnboarded: boolean;
  onboardedAt?: Timestamp;
  
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

/** Enhanced Meeting Summary document (extends OneToOneMeetingDoc) */
export interface MeetingSummaryDoc {
  id: string;
  meetingId: string; // Reference to OneToOneMeetingDoc
  
  // Meeting Details
  attendee: string;
  meetingDate: Timestamp;
  meetingDuration: number; // minutes
  meetingType: "in-person" | "virtual";
  meetingQuality: number; // 1-5 rating
  
  // Discussion
  discussionTopics: string[];
  keyTakeaways: string;
  
  // Action Items
  actionItems: string[];
  
  // Referrals (detailed tracking)
  referrals: {
    id: string;
    type: "affiliate" | "svp";
    recipientName: string;
    recipientCompany?: string;
    description: string;
    expectedValue?: string;
    followUpDate?: Timestamp;
  }[];
  
  // Follow-up
  followUpNeeded: boolean;
  followUpDate?: Timestamp;
  followUpNotes?: string;
  wouldMeetAgain: boolean;
  
  // Additional Notes
  additionalNotes: string;
  
  // AI Enhancement
  wasAiEnhanced: boolean;
  aiGeneratedSummary?: string;
  aiSuggestedTopics?: string[];
  aiSuggestedActions?: string[];
  
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

/** Networking Activity Alert document */
export interface NetworkingAlertDoc {
  id: string;
  affiliateId: string;
  
  // Alert Details
  type: "low-activity" | "missed-opportunity" | "follow-up" | "streak-risk";
  title: string;
  message: string;
  recommendation: string;
  suggestedAction: string;
  priority: "high" | "medium" | "low";
  
  // Status
  status: "active" | "dismissed" | "actioned";
  dismissedAt?: Timestamp;
  actionedAt?: Timestamp;
  
  // Suggested Match (if applicable)
  suggestedPartnerId?: string;
  suggestedPartnerName?: string;
  
  createdAt: Timestamp;
  expiresAt: Timestamp;
}

/** Leaderboard Entry document (cached/computed) */
export interface LeaderboardEntryDoc {
  id: string;
  affiliateId: string;
  affiliateName: string;
  
  // Rankings
  overallRank: number;
  previousRank: number;
  meetingsRank: number;
  referralsGivenRank: number;
  svpReferralsRank: number;
  
  // Metrics
  networkingScore: number;
  totalMeetings: number;
  referralsGiven: number;
  referralsReceived: number;
  svpReferrals: number;
  
  // Streaks
  currentStreak: number;
  longestStreak: number;
  
  // Achievements
  achievementsEarned: string[]; // Achievement IDs
  
  // Metadata
  period: "week" | "month" | "quarter" | "all-time";
  lastActive: Timestamp;
  
  updatedAt: Timestamp;
}

/** Achievement document */
export interface AchievementDoc {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: "meetings" | "referrals" | "streak" | "impact" | "special";
  
  // Unlock Criteria
  criteria: {
    type: "meeting-count" | "referral-count" | "streak" | "svp-referrals" | "ranking" | "custom";
    threshold: number;
    description: string;
  };
  
  // Rewards
  pointsAwarded: number;
  badgeUrl?: string;
  
  isActive: boolean;
  createdAt: Timestamp;
}

/** User Achievement Unlock document */
export interface UserAchievementDoc {
  id: string;
  affiliateId: string;
  achievementId: string;
  achievementName: string;
  
  unlockedAt: Timestamp;
  pointsEarned: number;
}

// ============================================================================
// Enhanced AI Matching Types
// ============================================================================

/** AI Match Recommendation with Enhanced Details */
export interface EnhancedAiMatchDoc {
  id: string;
  affiliateId: string;
  suggestedPartnerId: string;
  
  // Match Details
  matchScore: number; // 0-100
  matchType: "high-value" | "complementary" | "unlikely" | "strategic";
  
  // Detailed Reasoning
  matchReason: string;
  complementaryGoals: string[];
  sharedIndustries: string[];
  potentialSynergies: string[];
  
  // AI Insights
  aiInsight: string;
  talkingPoints: string[];
  suggestedMeetingMessage: string;
  
  // Partner Info (denormalized for performance)
  partnerName: string;
  partnerCompany: string;
  partnerTitle: string;
  partnerAvailability: string;
  partnerLastActive: string;
  partnerMeetingCount: number;
  partnerReferralsGiven: number;
  
  // Status
  status: "pending" | "accepted" | "declined" | "expired" | "scheduled";
  viewedAt?: Timestamp;
  respondedAt?: Timestamp;
  
  // Meeting Tracking
  meetingScheduledId?: string;
  meetingCompletedId?: string;
  
  createdAt: Timestamp;
  expiresAt: Timestamp;
  updatedAt: Timestamp;
}

/** AI Matching Algorithm Configuration */
export interface AiMatchingConfigDoc {
  id: string;
  
  // Scoring Weights
  weights: {
    complementaryGoals: number;
    sharedIndustries: number;
    geographicProximity: number;
    availabilityMatch: number;
    activityLevel: number;
    lastMeetingRecency: number;
    networkGaps: number;
  };
  
  // Thresholds
  thresholds: {
    highValueMatch: number; // e.g., 80
    complementaryMatch: number; // e.g., 60
    unlikelyMatch: number; // e.g., 40
  };
  
  // Rotation Settings
  rotationSettings: {
    enableRotation: boolean;
    daysSinceLastMeeting: number; // Suggest re-connection after X days
    prioritizeNewConnections: boolean;
  };
  
  // Low Activity Detection
  lowActivitySettings: {
    enabled: boolean;
    daysWithoutMeeting: number;
    sendAlertAfterDays: number;
  };
  
  isActive: boolean;
  updatedAt: Timestamp;
  updatedBy: string;
}

// ============================================================================
// Collection Names (to be added to COLLECTIONS constant)
// ============================================================================

export const ENHANCED_COLLECTIONS = {
  NETWORKING_PROFILES: "networkingProfiles",
  ONBOARDING_PROGRESS: "onboardingProgress",
  MEETING_SUMMARIES: "meetingSummaries",
  NETWORKING_ALERTS: "networkingAlerts",
  LEADERBOARD_ENTRIES: "leaderboardEntries",
  ACHIEVEMENTS: "achievements",
  USER_ACHIEVEMENTS: "userAchievements",
  ENHANCED_AI_MATCHES: "enhancedAiMatches",
  AI_MATCHING_CONFIG: "aiMatchingConfig",
} as const;

// ============================================================================
// Utility Types
// ============================================================================

/** Networking Score Calculation Breakdown */
export interface NetworkingScoreBreakdown {
  meetingPoints: number;
  referralPoints: number;
  svpReferralPoints: number;
  streakPoints: number;
  qualityPoints: number;
  totalScore: number;
  breakdown: {
    activity: string;
    points: number;
    count: number;
  }[];
}

/** AI Recommendation Request */
export interface AiRecommendationRequest {
  affiliateId: string;
  limit?: number;
  includeUnlikely?: boolean;
  excludeRecentlyMet?: boolean;
  daysSinceLastMeeting?: number;
}

/** AI Recommendation Response */
export interface AiRecommendationResponse {
  recommendations: EnhancedAiMatchDoc[];
  totalMatches: number;
  highValueCount: number;
  complementaryCount: number;
  unlikelyCount: number;
  generatedAt: Timestamp;
}
