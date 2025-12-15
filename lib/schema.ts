/**
 * Firestore Database Schema for Strategic Value Plus Platform
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
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

/** Traction Issue document in Firestore (IDS: Identify, Discuss, Solve) */
export interface TractionIssueDoc {
  id: string;
  description: string;
  priority: "high" | "medium" | "low";
  identifiedDate: Timestamp;
  ownerId: string; // Reference to team member
  ownerName: string; // Denormalized for display
  status: "open" | "in-progress" | "solved";
  solvedDate?: Timestamp;
  notes?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

/** Traction To-Do document in Firestore */
export interface TractionTodoDoc {
  id: string;
  description: string;
  ownerId: string; // Reference to team member
  ownerName: string; // Denormalized for display
  dueDate: Timestamp;
  status: "not-started" | "in-progress" | "complete";
  completedDate?: Timestamp;
  meetingId?: string; // Reference to meeting where created
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

/** Traction Level 10 Meeting document in Firestore */
export interface TractionMeetingDoc {
  id: string;
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
  description: string;
  ownerId: string; // Reference to team member
  ownerName: string; // Denormalized for display
  dueDate: Timestamp;
  status: "on-track" | "at-risk" | "off-track" | "complete";
  progress: number; // 0-100
  quarter: string; // e.g., "Q1 2025"
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
  entityType: "opportunity" | "project" | "organization";
  entityId: string;
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
  
  // Is this for SVP?
  isSvpReferral: boolean;
  svpServiceInterest?: string; // Which SVP service they might need
  
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
  
  // SVP-specific
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
  role: "admin" | "team" | "affiliate" | "consultant";
  status: "active" | "inactive" | "pending";
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

/** Platform Settings document in Firestore */
export interface PlatformSettingsDoc {
  id: string;
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
    docuseal?: {
      apiKey?: string;
      webhookSecret?: string;
      status: "connected" | "disconnected" | "error";
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
  type: 'meeting' | 'rock' | 'todo' | 'issue' | 'custom';
  color?: string;
  attendees?: string[];
  location?: string;
  recurringFrequency?: 'daily' | 'weekly' | 'monthly';
  recurringUntil?: Timestamp;
  // Traction references
  rockId?: string;
  todoId?: string;
  issueId?: string;
  meetingId?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// ============================================================================
// DocuSeal Integration Types
// ============================================================================

/** DocuSeal Template (cached locally) */
export interface DocuSealTemplateDoc {
  id: string;
  docusealId: number;
  name: string;
  slug: string;
  description?: string;
  category: 'nda' | 'engagement' | 'supplier_qualification' | 'msa' | 'sow' | 'other';
  fields: Array<{
    name: string;
    type: string;
    required?: boolean;
  }>;
  submitterRoles: string[];
  isActive: boolean;
  lastSyncedAt: Timestamp;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

/** DocuSeal Submission tracking */
export interface DocuSealSubmissionDoc {
  id: string;
  docusealSubmissionId: number;
  templateId: string;
  templateName: string;
  status: 'pending' | 'sent' | 'viewed' | 'completed' | 'declined' | 'expired';
  // Related entities
  organizationId?: string;
  organizationName?: string;
  opportunityId?: string;
  projectId?: string;
  // Submitters
  submitters: Array<{
    email: string;
    name: string;
    role: string;
    status: 'pending' | 'sent' | 'opened' | 'completed' | 'declined';
    completedAt?: Timestamp;
    signedDocumentUrl?: string;
  }>;
  // Document URLs
  combinedDocumentUrl?: string;
  auditLogUrl?: string;
  // Metadata
  sentAt?: Timestamp;
  completedAt?: Timestamp;
  expiresAt?: Timestamp;
  createdBy: string;
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
  // DocuSeal Integration Collections
  DOCUSEAL_TEMPLATES: "docusealTemplates",
  DOCUSEAL_SUBMISSIONS: "docusealSubmissions",
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
 *   - ReferralDoc (Referrals given/received, including SVP referrals)
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
