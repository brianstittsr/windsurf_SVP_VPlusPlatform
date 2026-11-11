/**
 * Firestore Database Schema for the V+ Academy Platform
 * 
 * This file defines the database collections, document structures,
 * and helper types for Firestore integration.
 */

import {
  collection,
  doc,
  CollectionReference,
  DocumentReference,
  Timestamp,
} from "firebase/firestore";
import { db } from "./firebase";
import type {
  User,
  Organization,
  Opportunity,
  Project,
  Meeting,
  ActionItem,
  Rock,
  Document as AppDocument,
  Service,
  Certification,
  Capability,
  Activity,
  Note,
  Milestone,
  RockMilestone,
} from "@/types";

// ============================================================================
// Firestore Document Types (with Timestamp instead of Date)
// ============================================================================

/** Base document fields for all collections */
interface BaseDocument {
  id: string;
  createdAt: Timestamp;
  updatedAt?: Timestamp;
}

/** User document in Firestore */
export interface UserDoc extends Omit<User, "createdAt" | "lastActive" | "capabilities"> {
  createdAt: Timestamp;
  lastActive: Timestamp;
  capabilities?: string[]; // Reference IDs to capabilities subcollection
}

/** Organization document in Firestore */
export interface OrganizationDoc extends Omit<Organization, "createdAt" | "contacts" | "capabilities" | "certifications"> {
  createdAt: Timestamp;
  updatedAt: Timestamp;
  contactIds?: string[]; // Reference IDs to users
  capabilityIds?: string[]; // Reference IDs
  certificationIds?: string[]; // Reference IDs
}

/** Opportunity document in Firestore */
export interface OpportunityDoc extends Omit<Opportunity, "createdAt" | "updatedAt" | "expectedCloseDate" | "owner" | "assignedAffiliates" | "organization" | "services" | "notes" | "activities"> {
  createdAt: Timestamp;
  updatedAt: Timestamp;
  expectedCloseDate: Timestamp;
  ownerId: string; // Reference to user
  assignedAffiliateIds?: string[]; // Reference IDs to users
  serviceIds: string[]; // Reference IDs to services
  organizationName?: string; // Free-text org name (denormalized from organizationId)
}

/** Project document in Firestore */
export interface ProjectDoc extends Omit<Project, "createdAt" | "startDate" | "endDate" | "team" | "organization" | "milestones" | "documents" | "meetings"> {
  createdAt: Timestamp;
  updatedAt: Timestamp;
  startDate: Timestamp;
  endDate?: Timestamp;
  teamIds: string[]; // Reference IDs to users
}

/** Meeting document in Firestore */
export interface MeetingDoc extends Omit<Meeting, "date" | "attendees" | "actionItems"> {
  date: Timestamp;
  attendeeIds: string[]; // Reference IDs to users
}

/** Action Item document in Firestore */
export interface ActionItemDoc extends Omit<ActionItem, "createdAt" | "dueDate" | "assignee"> {
  createdAt: Timestamp;
  updatedAt: Timestamp;
  dueDate?: Timestamp;
  assigneeId: string; // Reference to user
}

/** Rock (90-day goal) document in Firestore */
export interface RockDoc extends Omit<Rock, "createdAt" | "owner" | "milestones"> {
  createdAt: Timestamp;
  updatedAt: Timestamp;
  ownerId: string; // Reference to user
}

// ============================================================================
// Traction/EOS System Types
// ============================================================================

/** Traction Scorecard Metric document in Firestore */
export interface TractionScorecardMetricDoc {
  id: string;
  name: string;
  goal: number;
  actual: number;
  ownerId: string; // Reference to team member
  ownerName: string; // Denormalized for display
  trend: "up" | "down" | "flat";
  unit?: string; // $, %, #, etc.
  weekNumber?: number;
  year?: number;
  // Linkages to other EOS components
  linkedRockIds?: string[]; // Rocks that affect this metric
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

/** Traction Issue document in Firestore (IDS: Identify, Discuss, Solve) */
export interface TractionIssueDoc {
  id: string;
  title: string; // Short title for the issue
  description: string;
  priority: "high" | "medium" | "low";
  identifiedDate: Timestamp;
  ownerId: string; // Reference to team member
  ownerName: string; // Denormalized for display
  status: "open" | "in-progress" | "solved";
  solvedDate?: Timestamp;
  // Linkages to other EOS components
  linkedRockId?: string; // Rock this issue is blocking or related to
  linkedTodoIds?: string[]; // Todos created to solve this issue
  meetingId?: string; // Meeting where this issue was identified
  notes?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

/** Traction To-Do document in Firestore */
export interface TractionTodoDoc {
  id: string;
  title: string; // Short title for the todo
  description: string;
  ownerId: string; // Reference to team member
  ownerName: string; // Denormalized for display
  dueDate: Timestamp;
  status: "not-started" | "in-progress" | "complete";
  completedDate?: Timestamp;
  // Linkages to other EOS components
  linkedRockId?: string; // Rock this todo supports
  linkedIssueId?: string; // Issue this todo helps solve
  meetingId?: string; // Reference to meeting where created
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

/** Traction Level 10 Meeting document in Firestore */
export interface TractionMeetingDoc {
  id: string;
  title?: string; // Optional meeting title
  date: Timestamp;
  startTime: string;
  endTime: string;
  attendeeIds: string[]; // References to team members
  attendeeNames: string[]; // Denormalized for display
  rating: number; // 1-10
  issuesSolved: number;
  rocksReviewed: boolean;
  scorecardReviewed: boolean;
  todoCompletionRate: number; // 0-100
  // Linkages to other EOS components
  reviewedRockIds?: string[]; // Rocks reviewed in this meeting
  solvedIssueIds?: string[]; // Issues solved in this meeting
  createdTodoIds?: string[]; // Todos created in this meeting
  notes?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

/** Traction Team Member document (extends base TeamMemberDoc) */
export interface TractionTeamMemberDoc {
  id: string;
  name: string;
  role: string;
  category: "team" | "contractor" | "advisor" | "other";
  getsIt: boolean | null;
  wantsIt: boolean | null;
  capacityToDoIt: boolean | null;
  rightSeat: boolean | null;
  email?: string;
  phone?: string;
  avatar?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

/** Traction Rock document (quarterly priorities) */
export interface TractionRockDoc {
  id: string;
  title: string; // Short title for the rock
  description: string; // Detailed description
  ownerId: string; // Reference to team member
  ownerName: string; // Denormalized for display
  dueDate: Timestamp;
  status: "on-track" | "at-risk" | "off-track" | "complete";
  progress: number; // 0-100
  quarter: string; // e.g., "Q1 2025"
  // Milestones for tracking progress
  milestones?: Array<{
    id: string;
    title: string;
    completed: boolean;
    completedAt?: Timestamp;
  }>;
  // Linkages to other EOS components
  linkedIssueIds?: string[]; // Issues related to this rock
  linkedTodoIds?: string[]; // Todos created from this rock
  linkedMetricIds?: string[]; // Metrics this rock affects
  notes?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

/** Document/File document in Firestore */
export interface DocumentDoc extends Omit<AppDocument, "createdAt" | "uploadedBy"> {
  createdAt: Timestamp;
  uploadedById: string; // Reference to user
  storagePath: string; // Firebase Storage path
}

/** Service document in Firestore */
export interface ServiceDoc extends Service {
  createdAt: Timestamp;
  updatedAt: Timestamp;
  isActive: boolean;
}

/** Certification document in Firestore */
export interface CertificationDoc extends Omit<Certification, "dateObtained" | "expirationDate"> {
  dateObtained: Timestamp;
  expirationDate?: Timestamp;
  organizationId: string; // Parent organization
}

/** Activity document in Firestore */
export interface ActivityDoc extends Omit<Activity, "createdAt" | "user"> {
  createdAt: Timestamp;
  userId: string; // Reference to user
  entityType: "opportunity" | "project" | "organization" | "meeting" | "document" | "task" | "rock" | "affiliate" | "team-member" | "proposal" | "calendar" | "settings";
  entityId: string;
  entityName?: string;
  metadata?: Record<string, unknown>;
}

// ============================================================================
// Affiliate Networking System Types
// ============================================================================

/** Affiliate Biography/Profile document */
export interface AffiliateBiographyDoc {
  id: string;
  affiliateId: string; // Reference to user
  
  // Business Information
  businessName: string;
  profession: string;
  location: string;
  yearsInBusiness: number;
  previousJobs: string[];
  
  // Personal Information
  spouse?: string;
  children?: string;
  pets?: string;
  hobbies: string[];
  activitiesOfInterest: string[];
  cityOfResidence: string;
  yearsInCity?: number;
  
  // Miscellaneous
  burningDesire?: string;
  uniqueFact?: string;
  
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

/** GAINS Profile document (Goals, Accomplishments, Interests, Networks, Skills) */
export interface GainsProfileDoc {
  id: string;
  affiliateId: string; // Reference to user
  
  goals: string; // Financial, business, educational, personal objectives
  accomplishments: string; // Achievements, completed projects
  interests: string; // Things they enjoy doing, talking about, collecting
  networks: string; // Organizations, institutions, associations they belong to
  skills: string; // Talents, abilities, assets
  
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

/** Contact Sphere document */
export interface ContactSphereDoc {
  id: string;
  affiliateId: string; // Reference to user
  
  sphereName: string; // Name of their contact sphere
  
  // Top 10 members in their contact sphere
  members: {
    name: string;
    profession?: string;
    company?: string;
  }[];
  
  // Top 3 professions they need to round out their sphere
  topProfessionsNeeded: {
    profession: string;
    description?: string;
  }[];
  
  commitment?: string; // Their commitment to help fill partner's sphere
  
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

/** Previous Customers document */
export interface PreviousCustomersDoc {
  id: string;
  affiliateId: string; // Reference to user
  
  customers: {
    name: string;
    industry: string;
    description: string; // What was done for them
    isIdealClient: boolean;
  }[];
  
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

/** One-to-One Meeting document */
export interface OneToOneMeetingDoc {
  id: string;
  
  // Participants
  initiatorId: string; // Affiliate who scheduled the meeting
  partnerId: string; // Affiliate they're meeting with
  
  // Scheduling
  scheduledDate: Timestamp;
  scheduledTime: string; // e.g., "10:00 AM"
  duration: number; // Minutes (typically 60)
  
  // Location
  meetingType: "virtual" | "in-person";
  location?: string; // Restaurant, office address, or video link
  virtualPlatform?: "zoom" | "teams" | "google-meet" | "other";
  
  // Status
  status: "scheduled" | "confirmed" | "completed" | "cancelled" | "no-show";
  
  // Pre-meeting
  agendaItems?: string[];
  worksheetsShared: boolean;
  
  // Post-meeting outcomes
  meetingNotes?: string;
  shortTermReferralCommitment?: string;
  longTermReferralCommitment?: string;
  svpReferralDiscussed: boolean;
  svpReferralDetails?: string;
  
  // Follow-up
  followUpDate?: Timestamp;
  followUpCompleted: boolean;
  followUpNotes?: string;
  
  // Next meeting
  nextMeetingScheduled: boolean;
  nextMeetingDate?: Timestamp;
  
  // AI matching data
  matchScore?: number; // 0-100 compatibility score
  matchReasons?: string[]; // Why AI suggested this pairing
  
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

/** Referral document */
export interface ReferralDoc {
  id: string;
  
  // Who gave and received the referral
  referrerId: string; // Affiliate who gave the referral
  recipientId: string; // Affiliate who received the referral
  
  // Source meeting (if from a one-to-one)
  oneToOneMeetingId?: string;
  
  // Referral details
  referralType: "short-term" | "long-term";
  prospectName: string;
  prospectCompany?: string;
  prospectEmail?: string;
  prospectPhone?: string;
  prospectTitle?: string;
  
  // Why this is a good referral
  description: string;
  whyGoodFit?: string;
  
  // Is this a platform referral?
  isSvpReferral: boolean;
  svpServiceInterest?: string; // Which platform service they might need
  
  // Pipeline status
  status: "submitted" | "contacted" | "meeting-scheduled" | "proposal" | "negotiation" | "won" | "lost";
  
  // Outcome tracking
  dealValue?: number; // In dollars, when won
  dealClosedDate?: Timestamp;
  lostReason?: string;
  
  // Activity log
  lastContactDate?: Timestamp;
  contactAttempts: number;
  
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

/** Affiliate Stats document (aggregated metrics) */
export interface AffiliateStatsDoc {
  id: string;
  affiliateId: string; // Reference to user
  
  // Profile completion
  biographyComplete: boolean;
  gainsProfileComplete: boolean;
  contactSphereComplete: boolean;
  customersListComplete: boolean;
  profileCompletionPercent: number;
  
  // One-to-one activity
  totalOneToOnesScheduled: number;
  totalOneToOnesCompleted: number;
  oneToOnesThisMonth: number;
  oneToOnesThisQuarter: number;
  lastOneToOneDate?: Timestamp;
  
  // Referral activity
  referralsGiven: number;
  referralsReceived: number;
  referralsGivenThisMonth: number;
  referralsReceivedThisMonth: number;
  
  // Deal outcomes
  dealsClosedFromReferralsGiven: number;
  dealsClosedFromReferralsReceived: number;
  totalRevenueGenerated: number; // From referrals they gave that closed
  totalRevenueReceived: number; // From referrals they received that closed
  
  // Platform-specific
  svpReferralsGiven: number;
  svpReferralsClosed: number;
  svpRevenueGenerated: number;
  
  // Engagement score (calculated)
  engagementScore: number; // 0-100
  
  // Streaks
  currentOneToOneStreak: number; // Consecutive weeks with a one-to-one
  longestOneToOneStreak: number;
  
  updatedAt: Timestamp;
}

/** AI Match Suggestion document */
export interface AiMatchSuggestionDoc {
  id: string;
  affiliateId: string; // Who this suggestion is for
  suggestedPartnerId: string; // Suggested partner
  
  matchScore: number; // 0-100
  
  // Reasons for the match
  reasons: {
    category: "contact-sphere" | "interests" | "skills" | "geography" | "complementary" | "rotation";
    description: string;
    weight: number;
  }[];
  
  // Suggested talking points
  talkingPoints: string[];
  
  // Has this suggestion been acted on?
  status: "pending" | "accepted" | "declined" | "expired";
  
  // When was their last meeting?
  lastMeetingDate?: Timestamp;
  daysSinceLastMeeting?: number;
  
  createdAt: Timestamp;
  expiresAt: Timestamp; // Suggestions expire after a period
}

/** Note document in Firestore */
export interface NoteDoc extends Omit<Note, "createdAt" | "updatedAt" | "author"> {
  createdAt: Timestamp;
  updatedAt?: Timestamp;
  authorId: string; // Reference to user
  entityType: "opportunity" | "project" | "meeting";
  entityId: string;
}

/** Milestone document in Firestore */
export interface MilestoneDoc extends Omit<Milestone, "dueDate" | "completedDate"> {
  dueDate: Timestamp;
  completedDate?: Timestamp;
}

/** Rock Milestone document in Firestore */
export interface RockMilestoneDoc extends Omit<RockMilestone, "completedDate"> {
  completedDate?: Timestamp;
  rockId: string;
}

// ============================================================================
// Strategic Partners
// ============================================================================

/** Zoom Recording entry for Strategic Partners */
export interface ZoomRecording {
  title: string;
  url: string;
  date?: string;
}

/** Strategic Partner document in Firestore */
export interface StrategicPartnerDoc {
  id: string;
  firstName: string;
  lastName: string;
  company: string;
  website: string;
  expertise: string;
  email?: string;
  phone?: string;
  linkedIn?: string;
  logo?: string;
  notes?: string;
  zoomRecordings?: ZoomRecording[];
  status: "active" | "inactive" | "pending";
  // Additional flags - Partners/Suppliers can also be Clients
  isClient?: boolean; // Can this partner also be served as a client?
  clientSince?: Timestamp; // When they became a client
  clientNotes?: string; // Notes about them as a client
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

/** Team Member document in Firestore */
export interface TeamMemberDoc {
  id: string;
  firebaseUid?: string; // Links to Firebase Auth user UID
  firstName: string;
  lastName: string;
  emailPrimary: string;
  emailSecondary?: string;
  mobile?: string;
  expertise: string;
  title?: string;
  company?: string;
  location?: string;
  bio?: string;
  avatar?: string;
  linkedIn?: string;
  website?: string;
  role: "admin" | "instructor" | "student" | "team" | "affiliate" | "consultant";
  status: "active" | "inactive" | "pending";
  isVeteran?: boolean;
  proStatus?: "inactive" | "active" | "canceled" | "past_due";
  proPlanId?: string | null;
  proOrderId?: string | null;
  proExpiresAt?: Timestamp | null;
  stripeCustomerId?: string | null;
  stripeSubscriptionId?: string | null;
  cancelAtPeriodEnd?: boolean;
  // Leadership role flags for About/Leadership pages
  isCEO?: boolean;
  isCOO?: boolean;
  isCTO?: boolean;
  isCRO?: boolean;
  // Additional flags - Affiliates/Suppliers can also be Clients
  isClient?: boolean; // Can this affiliate/team member also be served as a client?
  clientSince?: Timestamp; // When they became a client
  clientNotes?: string; // Notes about them as a client
  // Mattermost integration
  mattermostUserId?: string; // Links to Mattermost user ID for playbook assignments
  demoSeed?: string; // set on records created by the demo seeder
  // Profile completion & extended profile fields (written by profile wizard/page)
  profileCompletedAt?: string;
  twitter?: string;
  facebook?: string;
  instagram?: string;
  youtube?: string;
  industries?: string[];
  categories?: string[];
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
  affiliateOnboardingComplete?: boolean;
  affiliateAgreementSigned?: boolean;
  affiliateAgreementDate?: string | null;
  networkingProfile?: {
    expertise: string[];
    categories: string[];
    idealReferralPartner?: string;
    topReferralSources?: string;
    goalsThisQuarter?: string;
    uniqueValueProposition?: string;
    targetClientProfile?: string;
    problemsYouSolve?: string;
    successStory?: string;
  };
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

/** Book a Call Lead document in Firestore */
export interface BookCallLeadDoc {
  id: string;
  // Contact Information
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  company?: string;
  jobTitle?: string;
  // Scheduling
  preferredDate?: string;
  preferredTime?: string;
  timezone?: string;
  // Additional Info
  message?: string;
  source: "contact-page" | "cta" | "popup" | "other";
  // Assessment form fields (when formType === "assessment")
  formType?: "book-call" | "assessment";
  companySize?: string;
  industry?: string;
  serviceInterest?: string;
  newsletterOptIn?: boolean;
  // Status
  status: "new" | "contacted" | "scheduled" | "completed" | "cancelled";
  assignedTo?: string;
  assignedToName?: string;
  // Follow-up
  notes?: string;
  scheduledCallDate?: Timestamp;
  completedAt?: Timestamp;
  // Metadata
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// ============================================================================
// NDA Management Types
// ============================================================================

export type NDAStatusType = 'draft' | 'pending_signature' | 'pending_countersign' | 'completed' | 'archived' | 'expired';
export type NDATemplateTypeValue = 'mutual' | 'unilateral' | 'employee' | 'contractor' | 'vendor' | 'custom';

/** NDA Template document in Firestore */
export interface NDATemplateDoc {
  id: string;
  name: string;
  type: NDATemplateTypeValue;
  description: string;
  sections: Array<{
    id: string;
    title: string;
    content: string;
    order: number;
    isEditable: boolean;
    isRequired: boolean;
    placeholders?: Array<{
      id: string;
      key: string;
      label: string;
      type: 'text' | 'date' | 'name' | 'company' | 'address' | 'email';
      required: boolean;
      defaultValue?: string;
    }>;
  }>;
  isDefault?: boolean;
  tags: string[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

/** NDA Party information */
export interface NDAPartyInfo {
  name: string;
  title?: string;
  company: string;
  email: string;
  address?: string;
  phone?: string;
}

/** NDA Signature information */
export interface NDASignatureInfo {
  signedBy: string;
  signedAt: Timestamp;
  ipAddress?: string;
  signatureImage?: string;
  timestamp: string;
}

/** NDA Document in Firestore */
export interface NDADocumentDoc {
  id: string;
  templateId: string;
  templateName: string;
  name: string;
  status: NDAStatusType;
  
  // Parties
  disclosingParty: NDAPartyInfo;
  receivingParty: NDAPartyInfo;
  
  // Content
  sections: Array<{
    id: string;
    title: string;
    content: string;
    order: number;
    isEditable: boolean;
    isRequired: boolean;
  }>;
  effectiveDate: string;
  expirationDate?: string;
  
  // Signature tracking
  signerSignature?: NDASignatureInfo;
  countersignature?: NDASignatureInfo;
  
  // Document URLs
  draftUrl?: string;
  signedUrl?: string;
  finalPdfUrl?: string;
  
  // Sharing
  publicAccessToken?: string;
  publicSigningUrl?: string;
  
  // Metadata
  createdAt: Timestamp;
  updatedAt: Timestamp;
  sentAt?: Timestamp;
  signedAt?: Timestamp;
  countersignedAt?: Timestamp;
  archivedAt?: Timestamp;
  
  // Notes
  internalNotes?: string;
}

/** Event document in Firestore */
export interface EventDoc {
  id: string;
  title: string;
  description?: string;
  shortDescription?: string;
  // Date/Time
  startDate: Timestamp;
  endDate?: Timestamp;
  timezone?: string;
  isAllDay?: boolean;
  // Location
  locationType: "virtual" | "in-person" | "hybrid";
  location?: string;
  virtualLink?: string;
  // Registration
  registrationUrl?: string;
  registrationDeadline?: Timestamp;
  maxAttendees?: number;
  currentAttendees?: number;
  // Display
  imageUrl?: string;
  category?: "webinar" | "workshop" | "conference" | "networking" | "training" | "other";
  tags?: string[];
  // Status
  status: "draft" | "published" | "cancelled" | "completed";
  isFeatured?: boolean;
  // Metadata
  createdBy?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

/** Platform Settings document in Firestore */
export interface PlatformSettingsDoc {
  id: string;
  // Social Links Configuration
  socialLinks?: {
    linkedin?: { url: string; visible: boolean };
    twitter?: { url: string; visible: boolean };
    youtube?: { url: string; visible: boolean };
    facebook?: { url: string; visible: boolean };
    instagram?: { url: string; visible: boolean };
  };
  // API Integrations
  integrations: {
    mattermost?: {
      apiKey?: string;
      webhookUrl?: string;
      serverUrl?: string;
      teamId?: string;
      status: "connected" | "disconnected" | "error";
      lastTested?: Timestamp;
    };
    apollo?: {
      apiKey?: string;
      accountId?: string;
      status: "connected" | "disconnected" | "error";
      lastTested?: Timestamp;
    };
    gohighlevel?: {
      apiKey?: string;
      locationId?: string;
      agencyId?: string;
      status: "connected" | "disconnected" | "error";
      lastTested?: Timestamp;
    };
    zoom?: {
      apiKey?: string;
      apiSecret?: string;
      accountId?: string;
      status: "connected" | "disconnected" | "error";
      lastTested?: Timestamp;
    };
    linkedin?: {
      apiKey?: string;
      clientId?: string;
      clientSecret?: string;
      organizationId?: string;
      status?: "connected" | "disconnected" | "error";
      lastTested?: Timestamp;
    };
  };
  // LLM Configuration
  llmConfig?: {
    provider: string;
    model: string;
    apiKey?: string;
    ollamaUrl?: string;
    useOllama: boolean;
  };
  // Webhook Events
  webhookEvents?: Record<string, boolean>;
  // Notification Settings
  notificationSettings?: {
    syncWithMattermost: boolean;
    inAppEnabled: boolean;
    browserEnabled: boolean;
    soundEnabled: boolean;
  };
  // Navigation Visibility Settings (for admins to control what nav items are visible)
  navigationSettings?: {
    hiddenItems: string[]; // Array of nav item hrefs that are hidden
    roleVisibility?: Record<string, string[]>; // Role -> array of visible nav item hrefs
  };
  updatedAt: Timestamp;
  updatedBy?: string;
}

// ============================================================================
// Apollo Purchased Contacts
// ============================================================================

/** Purchased contact from Apollo */
export interface ApolloPurchasedContactDoc {
  id: string;
  apolloId: string;
  firstName: string;
  lastName: string;
  name: string;
  title: string;
  company: string;
  companyId?: string;
  location?: string;
  industry?: string;
  companySize?: string;
  email?: string;
  phone?: string;
  linkedIn?: string;
  emailPurchased: boolean;
  phonePurchased: boolean;
  emailPurchasedAt?: Timestamp;
  phonePurchasedAt?: Timestamp;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

/** Contact entry in a saved list */
export interface SavedListContact {
  apolloId: string;
  name: string;
  firstName?: string;
  lastName?: string;
  title: string;
  company: string;
  companyId?: string;
  location?: string;
  industry?: string;
  companySize?: string;
  email?: string;
  phone?: string;
  linkedIn?: string;
  addedAt: Timestamp;
}

/** Saved prospect list */
export interface ApolloSavedListDoc {
  id: string;
  name: string;
  description?: string;
  contacts: SavedListContact[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// ============================================================================
// ThomasNet Supplier Search Types
// ============================================================================

/** ThomasNet saved supplier document */
export interface ThomasNetSupplierDoc {
  id: string;
  thomasnetId?: string;
  companyName: string;
  description?: string;
  location?: string;
  city?: string;
  state?: string;
  country?: string;
  phone?: string;
  website?: string;
  categories?: string[];
  certifications?: string[];
  annualRevenue?: string;
  employeeCount?: string;
  yearFounded?: string;
  thomasnetUrl?: string;
  savedAt: Timestamp;
  updatedAt: Timestamp;
  notes?: string;
}

/** Supplier entry in a saved list */
export interface SavedSupplierContact {
  thomasnetId?: string;
  companyName: string;
  description?: string;
  location?: string;
  city?: string;
  state?: string;
  phone?: string;
  website?: string;
  categories?: string[];
  certifications?: string[];
  employeeCount?: string;
  thomasnetUrl?: string;
  addedAt: Timestamp;
}

/** Saved supplier list */
export interface ThomasNetSavedListDoc {
  id: string;
  name: string;
  description?: string;
  suppliers: SavedSupplierContact[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// ============================================================================
// TBMNC Supplier Readiness Types
// ============================================================================

export type SupplierReadinessStageId =
  | "registration"
  | "documentation"
  | "assessment"
  | "quality"
  | "audit"
  | "corrective"
  | "approved";

export type SupplierDeliverableStatus = "not-started" | "pending-review" | "approved" | "rejected";

export interface SupplierDeliverableItem {
  id: string;
  status: SupplierDeliverableStatus;
  updatedAt?: Timestamp;
}

export interface SupplierDeliverablesSummary {
  completed: number;
  total: number;
  items?: SupplierDeliverableItem[];
}

export interface TBMNCSupplierDoc {
  id: string;
  companyName: string;
  contactName: string;
  contactEmail: string;
  contactPhone?: string;
  location?: string;
  website?: string;
  stage: SupplierReadinessStageId;
  progress: number;
  assignedAffiliateIds: string[];
  capabilities: string[];
  certifications: string[];
  registrationDate?: Timestamp;
  lastActivity?: Timestamp;
  deliverables: SupplierDeliverablesSummary;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// ============================================================================
// GoHighLevel Integration Types
// ============================================================================

/** GoHighLevel Integration configuration */
export interface GHLIntegrationDoc {
  id: string;
  // API Configuration
  apiToken: string;
  locationId: string;
  agencyId?: string;
  // Integration Settings
  name: string;
  description?: string;
  isActive: boolean;
  // Sync Settings
  syncContacts: boolean;
  syncOpportunities: boolean;
  syncCalendars: boolean;
  syncPipelines: boolean;
  syncCampaigns: boolean;
  // Mapping Configuration
  contactMapping: Record<string, string>;
  // Pipeline Configuration
  defaultPipelineId?: string;
  defaultStageId?: string;
  // Webhook Configuration
  webhookUrl?: string;
  webhookSecret?: string;
  enableWebhooks: boolean;
  // Last Sync Information
  lastSyncAt?: Timestamp;
  lastSyncStatus: 'success' | 'error' | 'pending' | 'never';
  lastSyncError?: string;
  totalContactsSynced: number;
  totalOpportunitiesSynced: number;
  // Rate Limiting
  rateLimitRemaining?: number;
  rateLimitReset?: Timestamp;
  // Metadata
  createdBy: string;
  lastModifiedBy: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

/** GoHighLevel Sync Log */
export interface GHLSyncLogDoc {
  id: string;
  integrationId: string;
  // Sync Details
  syncType: 'contacts' | 'opportunities' | 'calendars' | 'pipelines' | 'campaigns' | 'full';
  status: 'started' | 'in_progress' | 'completed' | 'failed';
  // Statistics
  recordsProcessed: number;
  recordsSuccessful: number;
  recordsFailed: number;
  // Timing
  startedAt: Timestamp;
  completedAt?: Timestamp;
  duration?: number;
  // Errors
  errors: Array<{
    recordId?: string;
    error: string;
    details?: unknown;
  }>;
  // Summary
  summary?: {
    contactsCreated: number;
    contactsUpdated: number;
    opportunitiesCreated: number;
    opportunitiesUpdated: number;
  };
  // Metadata
  triggeredBy: string;
  triggerType: 'manual' | 'scheduled' | 'webhook' | 'event';
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

/** GoHighLevel Workflow (AI-generated) */
export interface GHLWorkflowDoc {
  id: string;
  name: string;
  description: string;
  workflow: object;
  status: 'draft' | 'deployed' | 'archived';
  ghlWorkflowId?: string;
  createdBy: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  deployedAt?: Timestamp;
}

/** GoHighLevel Imported Workflow */
export interface GHLImportedWorkflowDoc {
  id: string;
  ghlWorkflowId: string;
  name: string;
  description: string;
  status: string;
  originalFormat: object;
  trigger: object;
  actions: unknown[];
  plainLanguagePrompt?: string;
  importedAt: Timestamp;
  convertedAt?: Timestamp;
  locationId: string;
}

/** Calendar Event (built-in calendar) */
export interface CalendarEventDoc {
  id: string;
  title: string;
  description?: string;
  startDate: Timestamp;
  endDate: Timestamp;
  allDay?: boolean;
  type: 'meeting' | 'rock' | 'todo' | 'issue' | 'custom' | 'one-to-one' | 'grant-deadline';
  color?: string;
  attendees?: string[];
  location?: string;
  recurringFrequency?: 'daily' | 'weekly' | 'monthly';
  recurringUntil?: Timestamp;
  recurringParentId?: string; // ID of the parent recurring event
  // GHL sync fields
  ghlEventId?: string;
  syncedToGhl?: boolean;
  // Traction references
  rockId?: string;
  todoId?: string;
  issueId?: string;
  meetingId?: string;
  // 1-to-1 reference
  oneToOneQueueItemId?: string;
  // Grant Builder reference
  grantId?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

/** 1-to-1 Scheduling Queue Item */
export interface OneToOneQueueItemDoc {
  id: string;
  // Team member to schedule with
  teamMemberId: string;
  teamMemberName: string;
  teamMemberEmail: string;
  teamMemberExpertise?: string;
  teamMemberAvatar?: string;
  // Queue status
  status: 'queued' | 'scheduled' | 'completed' | 'cancelled';
  // Scheduling details (when scheduled)
  scheduledDate?: Timestamp;
  scheduledTime?: string;
  duration?: number; // minutes
  location?: string;
  meetingType?: 'virtual' | 'in-person';
  calendarEventId?: string;
  // Notes
  notes?: string;
  // Priority/order
  priority: number;
  // Who added this to queue
  addedBy: string;
  addedByName?: string;
  // Timestamps
  createdAt: Timestamp;
  updatedAt: Timestamp;
  scheduledAt?: Timestamp;
  completedAt?: Timestamp;
}

// ============================================================================
// Team Member Availability & Booking Types
// ============================================================================

/** Weekly availability slot for a team member */
export interface AvailabilitySlot {
  dayOfWeek: 0 | 1 | 2 | 3 | 4 | 5 | 6; // 0 = Sunday, 6 = Saturday
  startTime: string; // HH:mm format
  endTime: string; // HH:mm format
  isEnabled: boolean;
}

/** Team member availability settings */
export interface TeamMemberAvailabilityDoc {
  id: string; // Same as team member ID
  teamMemberId: string;
  teamMemberName: string;
  teamMemberEmail: string;
  // Booking page settings
  bookingSlug: string; // Unique URL slug for booking page
  bookingTitle?: string; // Custom title for booking page
  bookingDescription?: string; // Description shown on booking page
  timezone: string; // e.g., "America/New_York"
  // Availability slots
  weeklyAvailability: AvailabilitySlot[];
  // Meeting settings
  defaultMeetingDuration: number; // minutes
  allowedDurations: number[]; // e.g., [30, 45, 60]
  bufferBetweenMeetings: number; // minutes
  maxAdvanceBookingDays: number; // How far in advance can book
  minAdvanceBookingHours: number; // Minimum notice required
  // Meeting types
  meetingTypes: Array<{
    id: string;
    name: string;
    duration: number;
    description?: string;
    location?: string;
    isVirtual: boolean;
    videoLink?: string;
  }>;
  // Blocked dates (specific dates unavailable)
  blockedDates: Array<{
    date: string; // YYYY-MM-DD
    reason?: string;
  }>;
  // Status
  isActive: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

/** Booking made by a client */
export interface BookingDoc {
  id: string;
  // Team member being booked
  teamMemberId: string;
  teamMemberName: string;
  teamMemberEmail: string;
  // Client info
  clientName: string;
  clientEmail: string;
  clientPhone?: string;
  clientCompany?: string;
  clientNotes?: string;
  // Meeting details
  meetingTypeId?: string;
  meetingTypeName: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  duration: number; // minutes
  timezone: string;
  // Location
  isVirtual: boolean;
  location?: string;
  videoLink?: string;
  // Status
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'no-show';
  // Calendar integration
  calendarEventId?: string;
  // Email notifications
  confirmationEmailSent: boolean;
  reminderEmailSent: boolean;
  // Timestamps
  bookedAt: Timestamp;
  confirmedAt?: Timestamp;
  cancelledAt?: Timestamp;
  cancelReason?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}


// ============================================================================
// Software License Keys
// ============================================================================

export type ToolType = 
  | 'apollo-search'
  | 'supplier-search'
  | 'ai-workforce'
  | 'proposal-creator'
  | 'gohighlevel'
  | 'linkedin-content'
  | 'bug-tracker'
  | 'traction'
  | 'networking'
  | 'calendar'
  | 'all-tools';

export interface SoftwareKeyDoc {
  id: string;
  // Key details
  key: string;                    // The actual license key (e.g., "VP-XXXX-XXXX-XXXX")
  name: string;                   // Friendly name for the key
  description?: string;
  // Tool access
  tools: ToolType[];              // Which tools this key enables
  // Assignment
  assignedTo?: string;            // User ID or organization ID
  assignedToName?: string;        // Name of assignee
  assignedToEmail?: string;       // Email of assignee
  assignmentType?: 'user' | 'organization' | 'affiliate';
  // Validity
  status: 'active' | 'inactive' | 'expired' | 'revoked';
  activatedAt?: Timestamp;
  expiresAt?: Timestamp;
  // Usage limits
  maxActivations?: number;        // Max number of devices/sessions
  currentActivations: number;
  // Metadata
  createdBy: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  notes?: string;
}

export interface KeyActivationDoc {
  id: string;
  keyId: string;
  userId: string;
  userEmail: string;
  deviceInfo?: string;
  ipAddress?: string;
  activatedAt: Timestamp;
  lastUsedAt: Timestamp;
  isActive: boolean;
}

// ============================================================================
// White-Label Deployments
// ============================================================================

export type DeploymentStatus = 'pending' | 'provisioning' | 'active' | 'suspended' | 'terminated';
export type LicenseType = 'trial' | 'starter' | 'professional' | 'enterprise';
export type InfrastructureProvider = 'vercel' | 'netlify' | 'self-hosted';

export interface WhiteLabelDeploymentDoc {
  id: string;
  // Deployment Identity
  name: string;
  slug: string;
  status: DeploymentStatus;
  // Branding Configuration
  branding: {
    companyName: string;
    shortName: string;
    initials: string;
    tagline: string;
    primaryColor: string;
    secondaryColor: string;
    logoUrl?: string;
    faviconUrl?: string;
  };
  // Domain Configuration
  domains: {
    primary: string;
    portal?: string;
    api?: string;
    customDomains?: string[];
    sslEnabled: boolean;
  };
  // Infrastructure
  infrastructure: {
    provider: InfrastructureProvider;
    projectId?: string;
    deploymentUrl?: string;
    firebaseProjectId?: string;
    region?: string;
  };
  // License & Billing
  license: {
    type: LicenseType;
    startDate: Timestamp;
    endDate?: Timestamp;
    maxUsers?: number;
    maxAffiliates?: number;
    softwareKeys: string[];
  };
  // Feature Overrides
  features: {
    enabledTools: ToolType[];
    customFeatures?: Record<string, boolean>;
  };
  // Contact Information
  owner: {
    userId?: string;
    name: string;
    email: string;
    phone?: string;
    company: string;
  };
  // Metadata
  createdAt: Timestamp;
  updatedAt: Timestamp;
  provisionedAt?: Timestamp;
  lastActivityAt?: Timestamp;
  notes?: string;
}

/** Mattermost Playbook tracking document in Firestore */
export interface MattermostPlaybookDoc {
  id: string;
  mattermostPlaybookId: string; // ID from Mattermost
  title: string;
  description?: string;
  teamId: string;
  teamName?: string;
  type: "reminder" | "rock" | "level10" | "recurring" | "custom";
  recurrence?: "daily" | "weekly" | "biweekly" | "monthly";
  // Assigned team members (platform team member IDs)
  assignedMemberIds: string[];
  // Mattermost user IDs
  mattermostMemberIds: string[];
  // Checklist configuration
  checklists: {
    title: string;
    items: { title: string; description?: string }[];
  }[];
  // Status
  status: "active" | "archived" | "draft";
  // Notification settings
  notificationsEnabled: boolean;
  broadcastChannelId?: string;
  reminderIntervalSeconds?: number;
  // Metadata
  createdBy: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  lastDeployedAt?: Timestamp;
}

/** Mattermost Playbook Run tracking document in Firestore */
export interface MattermostPlaybookRunDoc {
  id: string;
  mattermostRunId: string; // ID from Mattermost
  playbookId: string; // Platform playbook doc ID
  mattermostPlaybookId: string; // Mattermost playbook ID
  name: string;
  description?: string;
  teamId: string;
  channelId?: string; // Mattermost channel created for the run
  // Owner
  ownerUserId: string; // Mattermost user ID
  ownerMemberId?: string; // Platform team member ID
  // Status tracking
  status: "in_progress" | "finished" | "archived";
  currentStatus?: string;
  // Checklist progress
  checklistProgress: {
    checklistIndex: number;
    title: string;
    totalItems: number;
    completedItems: number;
  }[];
  totalTasks: number;
  completedTasks: number;
  completionPercentage: number;
  // Assigned members
  assignedMemberIds: string[];
  mattermostMemberIds: string[];
  // Timestamps
  startedAt: Timestamp;
  endedAt?: Timestamp;
  lastStatusUpdate?: Timestamp;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// ============================================================================
// Capture Management (GovCon BD) Types
// ============================================================================

/** Customer document — doubles as a govcon capture client when isCaptureClient is set */
export interface CustomerDoc {
  id: string;
  name: string;
  website?: string;
  phone?: string;
  email?: string;
  address?: string;
  notes?: string;
  status: "active" | "inactive";
  primaryContact?: string;
  isCaptureClient?: boolean;
  firebaseUid?: string;
  contacts?: { name: string; title?: string; email?: string; phone?: string }[];
  accountManagerId?: string;
  accountManagerName?: string;
  /** Self-reported profile from /onboarding/client — non-matching fields */
  onboarding?: {
    companyType?: string;
    yearEstablished?: string;
    employeeCount?: string;
    industrySectors?: string[];
    capabilities?: string[];
    quality?: {
      qualityManual?: boolean;
      documentedProcesses?: boolean;
      internalAudits?: boolean;
      correctiveActionProcess?: boolean;
      supplierQualification?: boolean;
      certifications?: string[];
    };
    servicesInterested?: string[];
    primaryGoals?: string;
    currentChallenges?: string;
    timeline?: string;
    howDidYouHear?: string;
    additionalNotes?: string;
    submittedAt?: string;
  };
  govcon?: {
    uei?: string;
    cageCode?: string;
    samRegistrationExpiry?: string;
    clearanceLevel?: string;
    naicsCodes?: string[];
    pscCodes?: string[];
    keywords?: string[];
    targetAgencies?: string[];
    certifications?: { name: string; expiresAt?: string }[];
    capabilityStatements?: { fileId: string; name: string; version: string; storagePath: string; uploadedAt: string }[];
    pastContracts?: { agency: string; contractNumber: string; value?: number; startDate?: string; endDate?: string }[];
  };
  deletedAt?: Timestamp | null;
  deletedBy?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export type CaptureOpportunityType = "rfi" | "sources-sought" | "rfp" | "rfq" | "grant";
export type CaptureBoardType = "standard" | "rfi";
export type CaptureOpportunitySource = "manual" | "imported";

/** A deadline stored in the agency's timezone, rendered in both zones (rule 5) */
export interface CaptureDeadline {
  at: string;
  timezone: string;
}

export interface CaptureFileRef {
  id: string;
  name: string;
  storagePath: string;
  url: string;
  tag: string;
  size?: number;
  uploadedBy: string;
  uploadedAt: string;
}

export interface CaptureNote {
  id: string;
  text: string;
  authorId: string;
  authorName: string;
  createdAt: string;
}

export interface CaptureBidNoBid {
  decision?: "bid" | "no-bid";
  reason?: string;
  score?: number;
  suggestedDecision?: "bid" | "no-bid";
  scorecard?: {
    mustHaveAnswers: Record<string, boolean>;
    weightedAnswers: Record<string, number>;
  };
  decidedById?: string;
  decidedByName?: string;
  decidedAt?: string;
  settingsSnapshot?: unknown;
}

export interface CaptureOpportunityDoc {
  id: string;
  clientId: string;
  clientName: string;
  title: string;
  solicitationNumber: string;
  samNoticeId?: string;
  source: CaptureOpportunitySource;
  type: CaptureOpportunityType;
  boardType: CaptureBoardType;
  agency: string;
  office?: string;
  contractingOfficer?: { name?: string; email?: string };
  links?: { samUrl?: string; qaUrl?: string; other?: string[] };
  naicsCode?: string;
  setAside?: string;
  description?: string;
  estimatedValue?: { min?: number; max?: number; text?: string };
  stage: string;
  questionsDue?: CaptureDeadline | null;
  responseDue?: CaptureDeadline | null;
  ownerId?: string;
  ownerName?: string;
  bidNoBid?: CaptureBidNoBid;
  incumbent?: string;
  competitors?: string[];
  teamingPartners?: { name: string; role: "prime" | "sub" }[];
  capabilityStatementRef?: string;
  outcome?: { result?: "won" | "lost" | "no-award"; awardDate?: string };
  files?: CaptureFileRef[];
  notes?: CaptureNote[];
  submittedAt?: string;
  finalSubmissionFileId?: string;
  matchScore?: number;
  matchBreakdown?: { factor: string; points: number; max: number }[];
  convertedAt?: string;
  aiSummary?: string;
  aiSummaryAt?: string;
  deletedAt?: Timestamp | null;
  deletedBy?: string;
  createdById?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface CaptureTaskDoc {
  id: string;
  opportunityId: string;
  title: string;
  assigneeId: string;
  assigneeName: string;
  dueDate?: string;
  status: "open" | "done";
  createdById?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface CaptureStageDef {
  id: string;
  label: string;
}

/** Convenience aliases matching the doc-named interfaces. */
export type CaptureOpportunity = CaptureOpportunityDoc;
export type CaptureTask = CaptureTaskDoc;

/** A SAM.gov notice scored against a capture client (Phase 3 match queue). */
export interface CaptureMatchDoc {
  id: string;
  samNoticeId: string;
  title: string;
  solicitationNumber?: string;
  agency?: string;
  office?: string;
  type?: string;
  setAside?: string;
  naicsCode?: string;
  pscCode?: string;
  responseDeadline?: string;
  description?: string;
  samUrl?: string;
  clientId: string;
  clientName: string;
  score: number;
  scoreBreakdown: { factor: string; points: number; max: number }[];
  status: "pending" | "accepted" | "dismissed";
  aiSummary?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
export type CaptureMatch = CaptureMatchDoc;

/** A saved SAM search used by the match/run cron (Phase 3). */
export interface CaptureSavedSearchDoc {
  id: string;
  name: string;
  query?: string;
  naicsCode?: string;
  setAside?: string;
  /** SAM procurement-type codes filter (e.g. "o,k,r"). */
  ptype?: string;
  /** Custom posted-date lookback window for this search. */
  daysBack?: number;
  /** True when auto-created by match/run from a client's govcon profile. */
  autoGenerated?: boolean;
  lastRunAt?: Timestamp;
  lastResultCount?: number;
  ownerId: string;
  isActive: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
export type CaptureSavedSearch = CaptureSavedSearchDoc;

/** Record of an alert sent by the alerts cron (dedupe + audit). */
export interface CaptureAlertLogDoc {
  id: string;
  type:
    | "deadline-7d"
    | "deadline-3d"
    | "deadline-1d"
    | "overdue"
    | "task-due"
    | "task-assigned"
    | "due-date-changed"
    | "cert-expiry"
    | "sam-expiry";
  entityType: "capture-opportunity" | "capture-task" | "capture-client";
  entityId: string;
  entityName: string;
  recipientId?: string;
  recipientEmail?: string;
  message: string;
  sentAt: Timestamp;
}
export type CaptureAlertLog = CaptureAlertLogDoc;

/** Scorecard question config for the bid/no-bid decision. */
export interface CaptureScorecardConfig {
  /** Yes/No must-haves — any "no" forces a no-bid suggestion. */
  mustHaves: string[];
  /** Weighted questions scored 1–5; weights should sum to 100. */
  weighted: { question: string; weight: number }[];
  /** Score % at or above which "bid" is suggested. */
  bidCutoff: number;
  /** Score % at or below which "no-bid" is suggested. */
  noBidCutoff: number;
}

export interface CaptureSettingsDoc {
  id: string;
  standardStages: CaptureStageDef[];
  rfiStages: CaptureStageDef[];
  opportunityTypes: string[];
  setAsides: string[];
  noBidReasons: string[];
  fileTags: string[];
  deadlineYellowDays: number;
  deadlineRedDays: number;
  expiryWarningDays: number;
  /** Days before a deadline to fire alerts (7/3/1). */
  alertDays: number[];
  /** Days before cert/SAM expiry to warn (90/60/30). */
  expiryAlertDays: number[];
  /** Match scoring weights (should sum to 100) + minimum score to queue a match. */
  matchWeights: {
    naics: number;
    setAside: number;
    keywords: number;
    psc: number;
    agency: number;
    value: number;
  };
  matchScoreCutoff: number;
  /** Default posted-date lookback (days) for SAM match searches. */
  matchLookbackDays?: number;
  scorecard: CaptureScorecardConfig;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// ============================================================================
// Collection Names
// ============================================================================

export const COLLECTIONS = {
  USERS: "users",
  ORGANIZATIONS: "organizations",
  OPPORTUNITIES: "opportunities",
  PROJECTS: "projects",
  MEETINGS: "meetings",
  ACTION_ITEMS: "actionItems",
  ROCKS: "rocks",
  DOCUMENTS: "documents",
  SERVICES: "services",
  CERTIFICATIONS: "certifications",
  ACTIVITIES: "activities",
  NOTES: "notes",
  MILESTONES: "milestones",
  ROCK_MILESTONES: "rockMilestones",
  CAPABILITIES: "capabilities",
  // Affiliate Networking Collections
  AFFILIATE_BIOGRAPHIES: "affiliateBiographies",
  GAINS_PROFILES: "gainsProfiles",
  CONTACT_SPHERES: "contactSpheres",
  PREVIOUS_CUSTOMERS: "previousCustomers",
  ONE_TO_ONE_MEETINGS: "oneToOneMeetings",
  REFERRALS: "referrals",
  AFFILIATE_STATS: "affiliateStats",
  AI_MATCH_SUGGESTIONS: "aiMatchSuggestions",
  // Strategic Partners
  STRATEGIC_PARTNERS: "strategicPartners",
  // Team Members
  TEAM_MEMBERS: "teamMembers",
  // Platform Settings
  PLATFORM_SETTINGS: "platformSettings",
  // Apollo Purchased Contacts
  APOLLO_PURCHASED_CONTACTS: "apolloPurchasedContacts",
  // Apollo Saved Lists
  APOLLO_SAVED_LISTS: "apolloSavedLists",
  // ThomasNet Saved Suppliers
  THOMASNET_SAVED_SUPPLIERS: "thomasnetSavedSuppliers",
  // ThomasNet Saved Lists
  THOMASNET_SAVED_LISTS: "thomasnetSavedLists",
  // TBMNC Supplier Readiness
  TBMNC_SUPPLIERS: "tbmncSuppliers",
  // Traction/EOS Collections
  TRACTION_ROCKS: "tractionRocks",
  TRACTION_SCORECARD_METRICS: "tractionScorecardMetrics",
  TRACTION_ISSUES: "tractionIssues",
  TRACTION_TODOS: "tractionTodos",
  TRACTION_MEETINGS: "tractionMeetings",
  TRACTION_TEAM_MEMBERS: "tractionTeamMembers",
  // GoHighLevel Integration Collections
  GHL_INTEGRATIONS: "gohighlevelIntegrations",
  GHL_SYNC_LOGS: "gohighlevelSyncLogs",
  GHL_WORKFLOWS: "ghlWorkflows",
  GHL_IMPORTED_WORKFLOWS: "ghlImportedWorkflows",
  // Calendar Events (built-in calendar)
  CALENDAR_EVENTS: "calendarEvents",
  // 1-to-1 Scheduling Queue
  ONE_TO_ONE_QUEUE: "oneToOneQueue",
  // Team Member Availability & Bookings
  TEAM_MEMBER_AVAILABILITY: "teamMemberAvailability",
  BOOKINGS: "bookings",
  // Software License Keys
  SOFTWARE_KEYS: "softwareKeys",
  KEY_ACTIVATIONS: "keyActivations",
  // White-Label Deployments
  WHITE_LABEL_DEPLOYMENTS: "whiteLabelDeployments",
  DEPLOYMENT_ANALYTICS: "deploymentAnalytics",
  DEPLOYMENT_AUDIT_LOGS: "deploymentAuditLogs",
  // Mattermost Playbooks
  MATTERMOST_PLAYBOOKS: "mattermostPlaybooks",
  MATTERMOST_PLAYBOOK_RUNS: "mattermostPlaybookRuns",
  // Website leads (V+ contact, Cogniverai, careers forms via /api/leads)
  BOOK_CALL_LEADS: "bookCallLeads",
  // Customers (doubles as Capture Management clients)
  CUSTOMERS: "customers",
  // Capture Management
  CAPTURE_OPPORTUNITIES: "captureOpportunities",
  CAPTURE_TASKS: "captureTasks",
  CAPTURE_SETTINGS: "captureSettings",
  CAPTURE_MATCHES: "captureMatches",
  CAPTURE_SAVED_SEARCHES: "captureSavedSearches",
  CAPTURE_ALERT_LOG: "captureAlertLog",
  // Events
  EVENTS: "events",
  // NDA Management
  NDA_TEMPLATES: "ndaTemplates",
  NDA_DOCUMENTS: "ndaDocuments",
  // Zenthium Data Center Referrals
  ZENTHIUM_LOCATION_SUBMISSIONS: "zenthiumLocationSubmissions",
  ZENTHIUM_REFERRALS: "zenthiumReferrals",
  ZENTHIUM_MEETINGS: "zenthiumMeetings",
  ZENTHIUM_DIRECT_CONTACTS: "zenthiumDirectContacts",
  ZENTHIUM_STATUS_HISTORY: "zenthiumStatusHistory",
  ZENTHIUM_REFERRAL_AGREEMENTS: "zenthiumReferralAgreements",
  ZENTHIUM_OPPORTUNITIES: "zenthiumOpportunities",

  // ==========================================================================
  // V+ Academy LMS collections
  // ==========================================================================
  COURSES: "courses",
  PRODUCTS: "products",
  COURSE_MODULES: "courseModules",
  SCORM_PACKAGES: "scormPackages",
  ENROLLMENTS: "enrollments",
  LESSON_PROGRESS: "lessonProgress",
  SCORM_RUNTIME: "scormRuntime",
  QUESTION_BANKS: "questionBanks",
  EXAM_ATTEMPTS: "examAttempts",
  CERTIFICATES: "certificates",
  INVOICES: "invoices",
  PAYMENTS: "payments",
  DISCOUNT_CODES: "discountCodes",
  DISCOUNT_REDEMPTIONS: "discountRedemptions",
  AUDIT_LOGS: "auditLogs",
  REGISTRATION_FORMS: "registrationForms",
  REGISTRATION_SUBMISSIONS: "registrationSubmissions",
  REGISTRATION_INVITES: "registrationInvites",
  ORDERS: "orders",
  STUDENT_DOCUMENTS: "studentDocuments",
  STUDY_GUIDE_CATEGORIES: "studyGuideCategories",
  STUDY_GUIDE_QUESTIONS: "studyGuideQuestions",
  STUDY_GUIDE_SESSIONS: "studyGuideSessions",
  STUDY_GUIDE_PROGRESS: "studyGuideProgress",
  STUDY_GUIDE_VOCAB: "studyGuideVocab",
  STUDY_GUIDE_META: "studyGuideMeta",
  RATE_LIMITS: "registrationRateLimits",

  // ==========================================================================
  // Grant Builder collections
  // ==========================================================================
  GRANT_OPPORTUNITIES: "grantOpportunities",
  GRANT_ORG_PROFILES: "grantOrgProfiles",
  GRANT_DOCUMENTS: "grantDocuments",
} as const;

// ============================================================================
// Collection References
// ============================================================================

/** Get typed collection reference */
export const getCollection = <T>(collectionName: string): CollectionReference<T> | null => {
  if (!db) return null;
  return collection(db, collectionName) as CollectionReference<T>;
};

/** Get typed document reference */
export const getDocRef = <T>(collectionName: string, docId: string): DocumentReference<T> | null => {
  if (!db) return null;
  return doc(db, collectionName, docId) as DocumentReference<T>;
};

// Pre-typed collection references
export const usersCollection = () => getCollection<UserDoc>(COLLECTIONS.USERS);
export const organizationsCollection = () => getCollection<OrganizationDoc>(COLLECTIONS.ORGANIZATIONS);
export const opportunitiesCollection = () => getCollection<OpportunityDoc>(COLLECTIONS.OPPORTUNITIES);
export const projectsCollection = () => getCollection<ProjectDoc>(COLLECTIONS.PROJECTS);
export const meetingsCollection = () => getCollection<MeetingDoc>(COLLECTIONS.MEETINGS);
export const actionItemsCollection = () => getCollection<ActionItemDoc>(COLLECTIONS.ACTION_ITEMS);
export const rocksCollection = () => getCollection<RockDoc>(COLLECTIONS.ROCKS);
export const documentsCollection = () => getCollection<DocumentDoc>(COLLECTIONS.DOCUMENTS);
export const servicesCollection = () => getCollection<ServiceDoc>(COLLECTIONS.SERVICES);
export const activitiesCollection = () => getCollection<ActivityDoc>(COLLECTIONS.ACTIVITIES);
export const notesCollection = () => getCollection<NoteDoc>(COLLECTIONS.NOTES);

// Affiliate Networking collection references
export const affiliateBiographiesCollection = () => getCollection<AffiliateBiographyDoc>(COLLECTIONS.AFFILIATE_BIOGRAPHIES);
export const gainsProfilesCollection = () => getCollection<GainsProfileDoc>(COLLECTIONS.GAINS_PROFILES);
export const contactSpheresCollection = () => getCollection<ContactSphereDoc>(COLLECTIONS.CONTACT_SPHERES);
export const previousCustomersCollection = () => getCollection<PreviousCustomersDoc>(COLLECTIONS.PREVIOUS_CUSTOMERS);
export const oneToOneMeetingsCollection = () => getCollection<OneToOneMeetingDoc>(COLLECTIONS.ONE_TO_ONE_MEETINGS);
export const referralsCollection = () => getCollection<ReferralDoc>(COLLECTIONS.REFERRALS);
export const affiliateStatsCollection = () => getCollection<AffiliateStatsDoc>(COLLECTIONS.AFFILIATE_STATS);
export const aiMatchSuggestionsCollection = () => getCollection<AiMatchSuggestionDoc>(COLLECTIONS.AI_MATCH_SUGGESTIONS);

export const tbmncSuppliersCollection = () => getCollection<TBMNCSupplierDoc>(COLLECTIONS.TBMNC_SUPPLIERS);

// Strategic Partners collection reference
export const strategicPartnersCollection = () => getCollection<StrategicPartnerDoc>(COLLECTIONS.STRATEGIC_PARTNERS);

// Team Members collection reference
export const teamMembersCollection = () => getCollection<TeamMemberDoc>(COLLECTIONS.TEAM_MEMBERS);

// Platform Settings collection reference
export const platformSettingsCollection = () => getCollection<PlatformSettingsDoc>(COLLECTIONS.PLATFORM_SETTINGS);

// Traction/EOS collection references
export const tractionRocksCollection = () => getCollection<TractionRockDoc>(COLLECTIONS.TRACTION_ROCKS);
export const tractionScorecardMetricsCollection = () => getCollection<TractionScorecardMetricDoc>(COLLECTIONS.TRACTION_SCORECARD_METRICS);
export const tractionIssuesCollection = () => getCollection<TractionIssueDoc>(COLLECTIONS.TRACTION_ISSUES);
export const tractionTodosCollection = () => getCollection<TractionTodoDoc>(COLLECTIONS.TRACTION_TODOS);
export const tractionMeetingsCollection = () => getCollection<TractionMeetingDoc>(COLLECTIONS.TRACTION_MEETINGS);
export const tractionTeamMembersCollection = () => getCollection<TractionTeamMemberDoc>(COLLECTIONS.TRACTION_TEAM_MEMBERS);

// ============================================================================
// Subcollection Helpers
// ============================================================================

/** Get milestones subcollection for a project */
export const projectMilestonesCollection = (projectId: string): CollectionReference<MilestoneDoc> | null => {
  if (!db) return null;
  return collection(db, COLLECTIONS.PROJECTS, projectId, "milestones") as CollectionReference<MilestoneDoc>;
};

/** Get action items subcollection for a meeting */
export const meetingActionItemsCollection = (meetingId: string): CollectionReference<ActionItemDoc> | null => {
  if (!db) return null;
  return collection(db, COLLECTIONS.MEETINGS, meetingId, "actionItems") as CollectionReference<ActionItemDoc>;
};

/** Get milestones subcollection for a rock */
export const rockMilestonesCollection = (rockId: string): CollectionReference<RockMilestoneDoc> | null => {
  if (!db) return null;
  return collection(db, COLLECTIONS.ROCKS, rockId, "milestones") as CollectionReference<RockMilestoneDoc>;
};

/** Get certifications subcollection for an organization */
export const organizationCertificationsCollection = (orgId: string): CollectionReference<CertificationDoc> | null => {
  if (!db) return null;
  return collection(db, COLLECTIONS.ORGANIZATIONS, orgId, "certifications") as CollectionReference<CertificationDoc>;
};

/** Get capabilities subcollection for an organization */
export const organizationCapabilitiesCollection = (orgId: string): CollectionReference<Capability> | null => {
  if (!db) return null;
  return collection(db, COLLECTIONS.ORGANIZATIONS, orgId, "capabilities") as CollectionReference<Capability>;
};

// ============================================================================
// Utility Functions
// ============================================================================

/** Convert Date to Firestore Timestamp */
export const toTimestamp = (date: Date): Timestamp => {
  return Timestamp.fromDate(date);
};

/** Convert Firestore Timestamp to Date */
export const fromTimestamp = (timestamp: Timestamp): Date => {
  return timestamp.toDate();
};

/** Generate a new document ID */
export const generateId = (collectionName: string): string | null => {
  if (!db) return null;
  return doc(collection(db, collectionName)).id;
};

// ============================================================================
// V+ Academy LMS Document Types
// ============================================================================

/** LMS user roles */
export type LmsRole = "admin" | "instructor" | "student";

/** Course content format */
export type CourseFormat = "scorm" | "native";

export interface LmsProductDoc {
  id: string;
  code: string;
  title: string;
  description: string;
  kind: "pro_access";
  billingMode: "subscription" | "payment";
  priceCents: number;
  currency: string;
  durationMonths: number;
  interval?: "month" | "year";
  benefits: string[];
  published: boolean;
  displayOrder: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

/** A course in the Academy catalog */
export interface CourseBadgeDefinition {
  title: string;
  description: string;
  skills: string[];
  issueOnCompletion: boolean;
}

export interface CourseDoc {
  id: string;
  code: string; // e.g. "AC1"
  title: string;
  description: string;
  shortDescription?: string;
  category?: string;
  estimatedHours?: number;
  learningOutcomes?: string[];
  prerequisiteCourseIds?: string[];
  prerequisiteDescription?: string;
  includedCourseIds?: string[];
  bundleContents?: string[];
  format: CourseFormat;
  scormPackageId?: string;
  /** How students buy: instant Stripe checkout, or staff-reviewed registration (e.g. prerequisite-verified programs). */
  purchaseMode?: "checkout" | "registration";
  priceCents: number;
  currency?: string;
  imageUrl?: string;
  imageStoragePath?: string;
  published: boolean;
  archived?: boolean;
  displayOrder?: number;
  passingScore: number; // percent
  maxAttempts: number;
  badge?: CourseBadgeDefinition;
  demoSeed?: string; // set on docs created by the demo seeder (for removal)
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

/** A module/lesson within a course (native format or SCORM SCO listing) */
export interface CourseModuleDoc {
  id: string;
  courseId: string;
  title: string;
  description?: string;
  order: number;
  type: "scorm" | "video" | "document" | "quiz";
  scormItemId?: string;
  quizId?: string;
  contentUrl?: string;
  contentHtml?: string; // rich lesson body (admin-authored HTML)
  demoSeed?: string;
  createdAt: Timestamp;
}

/** An uploaded SCORM package's manifest metadata */
export interface ScormPackageDoc {
  id: string;
  courseId: string;
  fileName: string;
  version: "1.2" | "2004";
  title: string;
  storagePath: string; // e.g. "scorm/{packageId}/"
  launchPath: string; // e.g. "scorm/{packageId}/index.html"
  itemCount: number;
  uploadedBy: string;
  createdAt: Timestamp;
}

/** A student's enrollment in a course */
export interface EnrollmentDoc {
  id: string;
  studentId: string; // TeamMemberDoc id
  firebaseUid: string;
  courseId: string;
  organizationId?: string; // B2B org purchase
  status: "active" | "completed" | "expired" | "cancelled";
  progressPercent: number;
  enrolledAt: Timestamp;
  completedAt?: Timestamp;
  lastAccessedAt?: Timestamp;
  paymentId?: string;
  orderId?: string;
  updatedAt?: Timestamp;
  demoSeed?: string;
}

/** Per-lesson progress for a student */
export interface LessonProgressDoc {
  id: string;
  enrollmentId: string;
  courseId: string;
  studentId: string;
  firebaseUid?: string;
  moduleId: string;
  status: "not-started" | "in-progress" | "completed";
  score?: number;
  timeSpentSeconds: number;
  demoSeed?: string;
  updatedAt: Timestamp;
}

/** Persisted SCORM runtime (CMI) data for resume support */
export interface ScormRuntimeDoc {
  id: string;
  enrollmentId: string;
  courseId: string;
  studentId: string;
  firebaseUid?: string;
  scormVersion: "1.2" | "2004";
  cmiData: Record<string, string>;
  lessonStatus?: string;
  scoreRaw?: string;
  suspendData?: string;
  updatedAt: Timestamp;
}

/** A quiz/exam question */
export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation?: string;
}

/** A question bank backing a quiz or exam */
export interface QuestionBankDoc {
  id: string;
  courseId: string;
  moduleId?: string; // set when the quiz belongs to a specific lesson
  title: string;
  type: "quiz" | "exam";
  questions: QuizQuestion[];
  randomize: boolean;
  questionsPerAttempt?: number;
  demoSeed?: string;
  createdAt: Timestamp;
}

export type LearnerQuizQuestion = Omit<QuizQuestion, "correctIndex">;
export type LearnerQuestionBankDoc = Omit<QuestionBankDoc, "questions"> & {
  questions: LearnerQuizQuestion[];
};

/** A single quiz/exam attempt */
export interface ExamAttemptDoc {
  id: string;
  enrollmentId: string;
  courseId: string;
  studentId: string;
  firebaseUid?: string;
  quizId: string;
  attemptNumber: number;
  scorePercent: number;
  passed: boolean;
  answers: { questionId: string; selectedIndex: number; correct: boolean }[];
  demoSeed?: string;
  startedAt: Timestamp;
  submittedAt: Timestamp;
}

/** An issued completion certificate */
export interface CertificateDoc {
  id: string;
  certificateNumber: string; // e.g. "VP-2026-000123"
  studentId: string;
  firebaseUid?: string;
  studentName: string;
  courseId: string;
  courseCode: string;
  courseTitle: string;
  enrollmentId: string;
  issuedAt: Timestamp;
  issuedBy?: string;
  publicCredentialId?: string;
  publicSharingEnabled?: boolean;
  publicNameConsent?: boolean;
  publicConsentAt?: Timestamp;
  publicConsentVersion?: string;
  revokedAt?: Timestamp;
  badgeTitle?: string;
  demoSeed?: string;
}

/** An invoice (Stripe or manual ACH) */
export interface InvoiceDoc {
  id: string;
  studentId: string;
  firebaseUid?: string;
  organizationId?: string;
  courseId?: string;
  productId?: string;
  courseIds?: string[];
  amountCents: number;
  discountCents: number;
  netCents: number;
  currency: string;
  status: "pending" | "paid" | "partially_refunded" | "refunded" | "void";
  method: "stripe" | "ach-manual";
  stripeSessionId?: string;
  stripePaymentIntentId?: string;
  stripeSubscriptionId?: string;
  orderId?: string;
  discountCode?: string;
  notes?: string;
  refundedCents?: number;
  createdAt: Timestamp;
  paidAt?: Timestamp;
  refundedAt?: Timestamp;
}

/** A recorded payment event */
export interface PaymentDoc {
  id: string;
  invoiceId: string;
  orderId?: string;
  studentId: string;
  firebaseUid?: string;
  amountCents: number;
  method: "card" | "us_bank_account" | "ach-manual";
  stripePaymentIntentId?: string;
  status: "succeeded" | "pending" | "failed" | "partially_refunded" | "refunded";
  refundedCents?: number;
  createdAt: Timestamp;
}

/** A discount / promotional code */
export interface DiscountCodeDoc {
  id: string;
  code: string;
  percentOff: number;
  stripePromotionCodeId?: string;
  militaryOnly: boolean;
  active: boolean;
  maxRedemptions?: number;
  timesRedeemed: number;
  expiresAt?: Timestamp;
  createdAt: Timestamp;
}

/** An audit log entry for administrative actions */
export interface AuditLogDoc {
  id: string;
  actorId: string;
  actorEmail: string;
  action: string;
  entityType: string;
  entityId: string;
  metadata?: Record<string, unknown>;
  createdAt: Timestamp;
}

export type RegistrationFieldType =
  | "section"
  | "paragraph"
  | "text"
  | "textarea"
  | "name"
  | "email"
  | "phone"
  | "number"
  | "date"
  | "monthYear"
  | "address"
  | "select"
  | "radio"
  | "checkboxes"
  | "yesNoPreferNot"
  | "courseSelector"
  | "file"
  | "consent"
  | "signature";

export type RegistrationFieldPurpose =
  | "fullName"
  | "company"
  | "birthMonthYear"
  | "email"
  | "phone"
  | "address"
  | "veteranStatus"
  | "courseSelection"
  | "newsletterConsent"
  | "studentAcknowledgment"
  | "programPolicies"
  | "signature";

export interface RegistrationFieldOption {
  label: string;
  value: string;
}

export interface RegistrationFieldCondition {
  fieldId: string;
  operator: "equals" | "notEquals" | "contains";
  value: string;
}

export interface RegistrationFormFieldDoc {
  id: string;
  type: RegistrationFieldType;
  purpose?: RegistrationFieldPurpose;
  label: string;
  helpText?: string;
  helpLink?: { label: string; url: string };
  placeholder?: string;
  required: boolean;
  options?: RegistrationFieldOption[];
  condition?: RegistrationFieldCondition;
  validation?: {
    minLength?: number;
    maxLength?: number;
    min?: number;
    max?: number;
    pattern?: string;
    allowedMimeTypes?: string[];
    maxFileSizeBytes?: number;
  };
}

export interface RegistrationFormDoc {
  id: string;
  name: string;
  slug: string;
  description?: string;
  status: "draft" | "published" | "archived";
  version: number;
  fields: RegistrationFormFieldDoc[];
  publishedFields?: RegistrationFormFieldDoc[];
  publishedVersion?: number;
  createdBy: string;
  updatedBy: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  publishedAt?: Timestamp;
}

export type RegistrationStatus =
  | "submitted"
  | "in_review"
  | "needs_information"
  | "approved"
  | "rejected"
  | "checkout_pending"
  | "paid"
  | "cancelled";

export interface RegistrationSignatureDoc {
  fieldId: string;
  typedName: string;
  imageStoragePath: string;
  imageSha256: string;
  consentText: string;
  formVersion: number;
  signedAt: Timestamp;
  formSnapshotHash: string;
}

export interface RegistrationSubmissionDoc {
  id: string;
  formId: string;
  formSlug: string;
  formVersion: number;
  formSnapshot: RegistrationFormFieldDoc[];
  fullName: string;
  email: string;
  phone?: string;
  company?: string;
  status: RegistrationStatus;
  sponsorshipApproved?: boolean;
  veteranStatusVerified?: boolean;
  answers: Record<string, unknown>;
  selectedCourseIds: string[];
  selectedCoursesSnapshot: {
    courseId: string;
    code: string;
    title: string;
    description: string;
    priceCents: number;
    includedCourseIds: string[];
  }[];
  totalCents: number;
  currency: string;
  newsletterConsent: boolean;
  attachments?: {
    fieldId: string;
    displayName: string;
    fileName: string;
    contentType: string;
    sizeBytes: number;
    storagePath: string;
    checksumSha256: string;
  }[];
  signatures: RegistrationSignatureDoc[];
  sourceIpHash?: string;
  userId?: string;
  inviteId?: string;
  orderId?: string;
  reviewerId?: string;
  reviewerNotes?: string;
  submittedAt: Timestamp;
  reviewedAt?: Timestamp;
  updatedAt: Timestamp;
}

export interface RegistrationInviteDoc {
  id: string;
  tokenHash: string;
  submissionId: string;
  email: string;
  expiresAt: Timestamp;
  claimedAt?: Timestamp;
  claimedByUid?: string;
  revokedAt?: Timestamp;
  createdBy: string;
  createdAt: Timestamp;
}

export interface OrderItemDoc {
  courseId?: string;
  productId?: string;
  code: string;
  title: string;
  unitAmountCents: number;
  quantity: number;
  includedCourseIds?: string[];
  includedInBundle?: boolean;
}

export interface OrderDoc {
  id: string;
  firebaseUid: string;
  studentId: string;
  registrationSubmissionId?: string;
  productId?: string;
  /** Set for direct (non-registration) course purchases. */
  courseId?: string;
  purchaseKind?: "registration" | "course" | "pro-access" | "free" | "manual";
  items: OrderItemDoc[];
  subtotalCents: number;
  discountCents: number;
  discountCode?: string;
  taxCents: number;
  totalCents: number;
  currency: string;
  status: "pending" | "paid" | "partially_refunded" | "failed" | "refunded" | "cancelled";
  refundedCents?: number;
  fulfillmentStatus?: "pending" | "fulfilled" | "failed";
  paymentMethod?: "stripe" | "ach-manual" | "sponsored" | "free" | "manual";
  stripeCheckoutSessionId?: string;
  stripePaymentIntentId?: string;
  stripeSubscriptionId?: string;
  createdAt: Timestamp;
  paidAt?: Timestamp;
  refundedAt?: Timestamp;
}

export type StudentDocumentKind =
  | "signed_registration"
  | "receipt"
  | "faa_certificate_proof"
  | "training_credential"
  | "course_certificate"
  | "other";

export interface StudentDocumentDoc {
  id: string;
  firebaseUid: string;
  studentId: string;
  kind: StudentDocumentKind;
  displayName: string;
  fileName: string;
  contentType: string;
  sizeBytes: number;
  storagePath: string;
  checksumSha256?: string;
  registrationSubmissionId?: string;
  orderId?: string;
  courseId?: string;
  enrollmentId?: string;
  certificateId?: string;
  uploadedBy: string;
  createdAt: Timestamp;
}

export interface StudyGuideCategoryDoc {
  id: string;
  name: string;
  description: string;
  displayOrder: number;
}

export interface StudyGuideVocabDoc {
  id: string;
  term: string;
  definition: string;
  categoryId: string;
}

export interface StudyGuideQuestion {
  id: string;
  categoryId: string;
  question: string;
  answers: string[];
  correctIndex: number;
  explanation: string;
}

export interface StudyGuideQuizSessionDoc {
  id: string;
  firebaseUid: string;
  studentId: string;
  categoryId: "all" | string;
  questionCount: number;
  currentIndex: number;
  score: number;
  status: "in_progress" | "completed";
  items: {
    questionId: string;
    categoryId: string;
    selectedIndex: number | null;
    correctIndex: number;
    correct: boolean | null;
    answered: boolean;
    answeredAt?: Timestamp;
  }[];
  startedAt: Timestamp;
  updatedAt: Timestamp;
  completedAt?: Timestamp;
}

export interface StudyGuideProgressDoc {
  id: string;
  firebaseUid: string;
  studentId: string;
  answered: number;
  correct: number;
  streak: number;
  lastActivityDate: string | null;
  knownVocab: string[];
  byCategory: Record<string, { answered: number; correct: number }>;
  updatedAt: Timestamp;
}

// LMS collection references
export const coursesCollection = () => getCollection<CourseDoc>(COLLECTIONS.COURSES);
export const courseModulesCollection = () => getCollection<CourseModuleDoc>(COLLECTIONS.COURSE_MODULES);
export const scormPackagesCollection = () => getCollection<ScormPackageDoc>(COLLECTIONS.SCORM_PACKAGES);
export const enrollmentsCollection = () => getCollection<EnrollmentDoc>(COLLECTIONS.ENROLLMENTS);
export const lessonProgressCollection = () => getCollection<LessonProgressDoc>(COLLECTIONS.LESSON_PROGRESS);
export const scormRuntimeCollection = () => getCollection<ScormRuntimeDoc>(COLLECTIONS.SCORM_RUNTIME);
export const questionBanksCollection = () => getCollection<QuestionBankDoc>(COLLECTIONS.QUESTION_BANKS);
export const examAttemptsCollection = () => getCollection<ExamAttemptDoc>(COLLECTIONS.EXAM_ATTEMPTS);
export const certificatesCollection = () => getCollection<CertificateDoc>(COLLECTIONS.CERTIFICATES);
export const invoicesCollection = () => getCollection<InvoiceDoc>(COLLECTIONS.INVOICES);
export const registrationFormsCollection = () => getCollection<RegistrationFormDoc>(COLLECTIONS.REGISTRATION_FORMS);
export const registrationSubmissionsCollection = () => getCollection<RegistrationSubmissionDoc>(COLLECTIONS.REGISTRATION_SUBMISSIONS);
export const ordersCollection = () => getCollection<OrderDoc>(COLLECTIONS.ORDERS);
export const studentDocumentsCollection = () => getCollection<StudentDocumentDoc>(COLLECTIONS.STUDENT_DOCUMENTS);
export const paymentsCollection = () => getCollection<PaymentDoc>(COLLECTIONS.PAYMENTS);
export const discountCodesCollection = () => getCollection<DiscountCodeDoc>(COLLECTIONS.DISCOUNT_CODES);
export const auditLogsCollection = () => getCollection<AuditLogDoc>(COLLECTIONS.AUDIT_LOGS);

// ============================================================================
// Grant Builder
// ============================================================================

export type GrantStage =
  | "discovered"
  | "analyzed"
  | "drafting"
  | "review"
  | "submitted"
  | "awarded"
  | "denied";

export interface GrantRequirement {
  id: string;
  text: string;
  met: boolean;
  notes?: string;
}

export type GrantQuestionStatus = "pending" | "drafted" | "accepted" | "edited";

export interface GrantQuestion {
  id: string;
  text: string;
  required: boolean;
  aiDraft?: string;
  response?: string;
  status: GrantQuestionStatus;
  answeredAt?: string;
  answeredBy?: string;
}

/** A grant opportunity tracked through the build pipeline. */
export interface GrantOpportunityDoc {
  id: string;
  title: string;
  funder?: string;
  sourceUrl?: string;
  description?: string;
  eligibility?: string;
  awardMin?: number;
  awardMax?: number;
  deadlineAt?: Timestamp;
  stage: GrantStage;
  aiSummary?: string;
  analyzedAt?: Timestamp;
  requirements: GrantRequirement[];
  questions: GrantQuestion[];
  orgProfileId?: string;
  customerId?: string;
  calendarEventId?: string;
  submittedAt?: Timestamp;
  outcomeNotes?: string;
  createdBy: string;
  createdByName?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

/** AI-extracted profile of a company/nonprofit used as grant input. */
export interface GrantOrgProfileDoc {
  id: string;
  name: string;
  websiteUrl?: string;
  mission?: string;
  productsServices?: string[];
  populationServed?: string;
  keyPrograms?: string[];
  extractedMarkdown?: string;
  customerId?: string;
  createdBy: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export type GrantDocumentStatus = "converted" | "failed" | "processing";

/** An uploaded input document converted to markdown. */
export interface GrantDocumentDoc {
  id: string;
  grantId?: string;
  orgProfileId?: string;
  fileName: string;
  contentType: string;
  sizeBytes: number;
  storagePath: string;
  markdown?: string;
  status: GrantDocumentStatus;
  errorMessage?: string;
  uploadedBy: string;
  createdAt: Timestamp;
}

// ============================================================================
// Database Schema Documentation
// ============================================================================

/**
 * FIRESTORE DATABASE STRUCTURE
 * ============================
 * 
 * /users/{userId}
 *   - UserDoc
 * 
 * /organizations/{orgId}
 *   - OrganizationDoc
 *   /certifications/{certId} - CertificationDoc
 *   /capabilities/{capId} - Capability
 * 
 * /opportunities/{oppId}
 *   - OpportunityDoc
 * 
 * /projects/{projectId}
 *   - ProjectDoc
 *   /milestones/{milestoneId} - MilestoneDoc
 * 
 * /meetings/{meetingId}
 *   - MeetingDoc
 *   /actionItems/{actionId} - ActionItemDoc
 * 
 * /rocks/{rockId}
 *   - RockDoc
 *   /milestones/{milestoneId} - RockMilestoneDoc
 * 
 * /documents/{docId}
 *   - DocumentDoc
 * 
 * /services/{serviceId}
 *   - ServiceDoc
 * 
 * /activities/{activityId}
 *   - ActivityDoc (polymorphic, linked to various entities)
 * 
 * /notes/{noteId}
 *   - NoteDoc (polymorphic, linked to various entities)
 * 
 * /actionItems/{actionId}
 *   - ActionItemDoc (top-level for cross-entity queries)
 * 
 * 
 * AFFILIATE NETWORKING SYSTEM
 * ===========================
 * /affiliateBiographies/{bioId}
 *   - AffiliateBiographyDoc (Member Bio Sheet)
 * 
 * /gainsProfiles/{profileId}
 *   - GainsProfileDoc (Goals, Accomplishments, Interests, Networks, Skills)
 * 
 * /contactSpheres/{sphereId}
 *   - ContactSphereDoc (Contact Sphere Planning)
 * 
 * /previousCustomers/{customersId}
 *   - PreviousCustomersDoc (Previous 10 Customers)
 * 
 * /oneToOneMeetings/{meetingId}
 *   - OneToOneMeetingDoc (Scheduled one-to-one meetings between affiliates)
 * 
 * /referrals/{referralId}
 *   - ReferralDoc (Referrals given/received, including platform referrals)
 * 
 * /affiliateStats/{statsId}
 *   - AffiliateStatsDoc (Aggregated metrics per affiliate)
 * 
 * /aiMatchSuggestions/{suggestionId}
 *   - AiMatchSuggestionDoc (AI-generated partner suggestions)
 * 
 * 
 * SECURITY RULES CONSIDERATIONS
 * =============================
 * - Users can only read/write their own user document
 * - Organization members can read organization data
 * - Admins have full access to all collections
 * - Affiliates can only access assigned opportunities/projects
 * - Documents inherit permissions from parent entity
 * 
 * 
 * INDEXES REQUIRED
 * ================
 * - opportunities: organizationId + stage (composite)
 * - opportunities: ownerId + expectedCloseDate (composite)
 * - projects: organizationId + status (composite)
 * - activities: entityType + entityId + createdAt (composite)
 * - actionItems: assigneeId + status + dueDate (composite)
 * - rocks: ownerId + quarter (composite)
 */
