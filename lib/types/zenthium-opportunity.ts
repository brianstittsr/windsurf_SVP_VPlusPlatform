export type DealStage =
  | "New Lead"
  | "Under Review"
  | "Site Visit Scheduled"
  | "Due Diligence"
  | "LOI Issued"
  | "Contracted"
  | "Closed"
  | "Rejected";

export type Priority = "High" | "Medium" | "Low" | "";
export type YesNoNA = "Yes" | "No" | "N/A" | "";

/** Matches exact Column B questions from the Powered Land Developer Intake Form */
export interface OpportunityFormData {
  // ── Internal Deal Tracking (not on spreadsheet) ──────────────────────────
  dealName: string;
  dealOwnerId: string;
  dealOwnerName: string;
  dealOwnerEmail: string;
  dealStage: DealStage;
  priority: Priority;
  referralSource: string;

  // ── SECTION 0 — Developer / Submitter Information ────────────────────────
  developerCompanyName: string;
  primaryContactName: string;
  titleRole: string;
  emailAddress: string;
  phoneNumber: string;
  dateOfSubmission: string;
  projectSiteName: string;

  // ── SECTION 1 — Power / Utility Infrastructure ───────────────────────────
  // Power
  overviewExistingInfrastructure: string;           // Overview of Existing Infrastructure (Substation, nearby transmission lines, etc.)
  utilityCompanyPowerProvider: string;              // Utility Company / Power Provider to the site
  powerStudies: string;                             // Power Studies (LOA, SIS, Feasibility, etc.) / All documentation with utility providers on power delivery
  powerStudiesFilesAvailable: YesNoNA;
  existingCapacityMW: string;                       // Existing Capacity (MW)
  existingCapacityFilesAvailable: YesNoNA;
  maximumCapacityMW: string;                        // Maximum Capacity Available (MW) / Infrastructure upgrades required to deliver maximum capacity
  maximumCapacityFilesAvailable: YesNoNA;
  deliveryTimelines: string;                        // Delivery Timelines / Ramp schedule of power delivery
  deliveryTimelinesFilesAvailable: YesNoNA;
  costOfPowerPerKwh: string;                        // Cost of Power – Effective $/kWh
  costOfPowerFilesAvailable: YesNoNA;
  powerGenerationSource: string;                    // Power Generation Source (Solar, Wind, Nuclear, Gas, etc.)
  powerGenerationFilesAvailable: YesNoNA;

  // Natural Gas
  naturalGasProvider: string;                       // Natural Gas Provider
  naturalGasThirdParties: string;                   // 3rd parties involved in delivering gas to site (infrastructure buildout, etc.)
  transmissionPipelineSizePSI: string;              // Transmission pipeline size / PSI

  // ── SECTION 2 — Fiber / Connectivity ─────────────────────────────────────
  fiberAgreementsInPlace: string;                   // Any agreements currently in place (provider, capacity)
  fiberAgreementsFilesAvailable: YesNoNA;
  fiberProvidersProximity: string;                  // Overview of fiber providers in proximity to the site
  fiberProvidersFilesAvailable: YesNoNA;
  fiberProviderDiscussions: string;                 // Update on any discussions with fiber providers to run fiber to the site
  fiberMapsAvailable: YesNoNA;                      // Fiber maps available?

  // ── SECTION 3 — Water & Sewer ─────────────────────────────────────────────
  waterSewerServiceAgreements: string;              // Water and Sewer Service Agreements
  waterSewerAgreementsFilesAvailable: YesNoNA;
  waterSewerMainInfo: string;                       // Water & Sewer Main info (size, location, providers, etc.)
  waterSewerMainFilesAvailable: YesNoNA;
  plannedWaterUpgrades: string;                     // Planned / Required Water Upgrades
  plannedWaterFilesAvailable: YesNoNA;
  hydrologicalStudies: string;                      // Hydrological Studies / Drainage Reports
  hydrologicalFilesAvailable: YesNoNA;

  // ── SECTION 4 — Property Information ─────────────────────────────────────
  siteAddress: string;                              // Site Address
  siteCoordinates: string;                          // Site Coordinates (Lat / Long)
  siteCoordinatesFilesAvailable: YesNoNA;
  siteMapAvailable: YesNoNA;                        // Site Map available?
  sitePhotosAvailable: YesNoNA;                     // Site photos / site plan photos available?
  totalAcreageDevelopable: string;                  // Total Acreage and Developable Acreage
  totalAcreageFilesAvailable: YesNoNA;
  existingEasements: string;                        // Existing Easements
  existingEasementsFilesAvailable: YesNoNA;
  thirdPartyReports: string;                        // Third Party Reports (Phase 1, Geotech, Wetlands, Flood Plain, Drainage, Groundwater)
  thirdPartyReportsFilesAvailable: YesNoNA;
  topographicalMapsAvailable: YesNoNA;              // Topographical Maps available?
  altaSurveyAvailable: YesNoNA;                     // ALTA Survey available?
  proximityRailAirports: string;                    // Proximity to Rail and Airports
  proximityRailFilesAvailable: YesNoNA;
  zoningPermittingEntitlements: string;             // Zoning, Permitting & Entitlements for data center usage (Designation, Work Completed, Parking, Land Covenants, Setbacks, Height Restrictions)
  zoningFilesAvailable: YesNoNA;

  // ── SECTION 5 — Project Incentives ───────────────────────────────────────
  inPlaceIncentives: string;                        // In-place Incentives
  inPlaceIncentivesFilesAvailable: YesNoNA;
  salesTaxExemption: string;                        // Sales tax exemption on equipment
  salesTaxFilesAvailable: YesNoNA;
  propertyTaxAbatements: string;                    // Property tax abatements
  propertyTaxFilesAvailable: YesNoNA;
  governmentSupport: string;                        // Local, State and National government support (beyond publicly available information)
  governmentSupportFilesAvailable: YesNoNA;
  incentiveTimelines: string;                       // Timelines to receiving incentives and impact on project timelines
  incentiveTimelinesFilesAvailable: YesNoNA;

  // ── Internal notes ────────────────────────────────────────────────────────
  internalNotes: string;
}

export interface ZenthiumOpportunity extends OpportunityFormData {
  id: string;
  status: "draft" | "active" | "sent" | "closed";
  intakeSentAt?: string | null;
  intakeSentTo?: string[];
  intakeSentCC?: string[];
  createdAt: string;
  updatedAt: string;
}

export const INITIAL_OPPORTUNITY: OpportunityFormData = {
  // Internal
  dealName: "",
  dealOwnerId: "",
  dealOwnerName: "",
  dealOwnerEmail: "",
  dealStage: "New Lead",
  priority: "Medium",
  referralSource: "",

  // Section 0
  developerCompanyName: "",
  primaryContactName: "",
  titleRole: "",
  emailAddress: "",
  phoneNumber: "",
  dateOfSubmission: new Date().toISOString().split("T")[0],
  projectSiteName: "",

  // Section 1 — Power
  overviewExistingInfrastructure: "",
  utilityCompanyPowerProvider: "",
  powerStudies: "",
  powerStudiesFilesAvailable: "",
  existingCapacityMW: "",
  existingCapacityFilesAvailable: "",
  maximumCapacityMW: "",
  maximumCapacityFilesAvailable: "",
  deliveryTimelines: "",
  deliveryTimelinesFilesAvailable: "",
  costOfPowerPerKwh: "",
  costOfPowerFilesAvailable: "",
  powerGenerationSource: "",
  powerGenerationFilesAvailable: "",

  // Section 1 — Natural Gas
  naturalGasProvider: "",
  naturalGasThirdParties: "",
  transmissionPipelineSizePSI: "",

  // Section 2 — Fiber
  fiberAgreementsInPlace: "",
  fiberAgreementsFilesAvailable: "",
  fiberProvidersProximity: "",
  fiberProvidersFilesAvailable: "",
  fiberProviderDiscussions: "",
  fiberMapsAvailable: "",

  // Section 3 — Water & Sewer
  waterSewerServiceAgreements: "",
  waterSewerAgreementsFilesAvailable: "",
  waterSewerMainInfo: "",
  waterSewerMainFilesAvailable: "",
  plannedWaterUpgrades: "",
  plannedWaterFilesAvailable: "",
  hydrologicalStudies: "",
  hydrologicalFilesAvailable: "",

  // Section 4 — Property
  siteAddress: "",
  siteCoordinates: "",
  siteCoordinatesFilesAvailable: "",
  siteMapAvailable: "",
  sitePhotosAvailable: "",
  totalAcreageDevelopable: "",
  totalAcreageFilesAvailable: "",
  existingEasements: "",
  existingEasementsFilesAvailable: "",
  thirdPartyReports: "",
  thirdPartyReportsFilesAvailable: "",
  topographicalMapsAvailable: "",
  altaSurveyAvailable: "",
  proximityRailAirports: "",
  proximityRailFilesAvailable: "",
  zoningPermittingEntitlements: "",
  zoningFilesAvailable: "",

  // Section 5 — Incentives
  inPlaceIncentives: "",
  inPlaceIncentivesFilesAvailable: "",
  salesTaxExemption: "",
  salesTaxFilesAvailable: "",
  propertyTaxAbatements: "",
  propertyTaxFilesAvailable: "",
  governmentSupport: "",
  governmentSupportFilesAvailable: "",
  incentiveTimelines: "",
  incentiveTimelinesFilesAvailable: "",

  // Internal
  internalNotes: "",
};
