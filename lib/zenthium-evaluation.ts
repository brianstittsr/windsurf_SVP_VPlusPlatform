/**
 * Zenthium Site Evaluation Logic
 * Evaluates property submissions against Zenthium's minimum requirements
 */

export interface SiteEvaluationResult {
  meetsRequirements: boolean;
  score: number;
  maxScore: number;
  requirements: RequirementEvaluation[];
  summary: string;
}

export interface RequirementEvaluation {
  id: string;
  title: string;
  status: "pass" | "fail" | "partial" | "pending";
  isRequired: boolean;
  currentValue?: string;
  expectedValue: string;
  notes?: string;
}

export interface PropertyEvaluationData {
  squareFootage?: number;
  powerAvailableMW?: number;
  ceilingHeightFt?: number;
  isSingleStory: boolean;
  isFloor: boolean;
  propertyType?: string;
  waterAvailable: boolean;
  waterSource?: string;
  fiberAvailable: boolean;
  fiberProviders?: string;
  zoningClassification?: string;
  environmentalClearance?: string;
  floodZone: boolean;
}

const REQUIRED_REQUIREMENTS = [
  {
    id: "min_sqft",
    title: "Minimum 10,000 Square Feet",
    required: true,
    evaluate: (data: PropertyEvaluationData) => {
      const sqft = data.squareFootage || 0;
      if (sqft >= 100000) return { status: "pass" as const, currentValue: `${sqft.toLocaleString()} sq ft` };
      if (sqft >= 10000) return { status: "pass" as const, currentValue: `${sqft.toLocaleString()} sq ft` };
      return { status: "fail" as const, currentValue: `${sqft.toLocaleString()} sq ft`, notes: "Must be at least 10,000 sq ft" };
    },
  },
  {
    id: "min_power",
    title: "20+ Megawatts of Power",
    required: true,
    evaluate: (data: PropertyEvaluationData) => {
      const mw = data.powerAvailableMW || 0;
      if (mw >= 20) return { status: "pass" as const, currentValue: `${mw} MW` };
      return { status: "fail" as const, currentValue: `${mw} MW`, notes: "Must be at least 20 MW" };
    },
  },
  {
    id: "ceiling_height",
    title: "High Ceilings (18 ft+ Clear Height)",
    required: true,
    evaluate: (data: PropertyEvaluationData) => {
      const height = data.ceilingHeightFt || 0;
      if (height >= 18) return { status: "pass" as const, currentValue: `${height} ft` };
      return { status: "fail" as const, currentValue: `${height} ft`, notes: "Must be at least 18 ft clear height" };
    },
  },
  {
    id: "single_story_flat",
    title: "Single-Story & Flat Floor",
    required: true,
    evaluate: (data: PropertyEvaluationData) => {
      if (data.isSingleStory && data.isFloor) return { status: "pass" as const, currentValue: "Yes" };
      if (data.isSingleStory && !data.isFloor) return { status: "partial" as const, currentValue: "Single-story only", notes: "Flat floor also required" };
      if (!data.isSingleStory && data.isFloor) return { status: "partial" as const, currentValue: "Flat floor only", notes: "Single-story also required" };
      return { status: "fail" as const, currentValue: "No", notes: "Must be single-story with flat floor" };
    },
  },
  {
    id: "property_type",
    title: "Eligible Property Types",
    required: true,
    evaluate: (data: PropertyEvaluationData) => {
      const eligibleTypes = ["vacant_land", "warehouse", "industrial", "data_center", "power_plant"];
      if (!data.propertyType) return { status: "pending" as const, currentValue: "Not specified" };
      if (eligibleTypes.includes(data.propertyType)) return { status: "pass" as const, currentValue: data.propertyType };
      return { status: "partial" as const, currentValue: data.propertyType, notes: "Property type may need review" };
    },
  },
  {
    id: "water_access",
    title: "Water Access for Cooling",
    required: true,
    evaluate: (data: PropertyEvaluationData) => {
      if (data.waterAvailable && data.waterSource) return { status: "pass" as const, currentValue: data.waterSource };
      if (data.waterAvailable && !data.waterSource) return { status: "partial" as const, currentValue: "Available", notes: "Source not specified" };
      return { status: "fail" as const, currentValue: "No", notes: "Water access required for cooling" };
    },
  },
];

const PREFERRED_REQUIREMENTS = [
  {
    id: "fiber_connectivity",
    title: "Fiber Connectivity",
    required: false,
    evaluate: (data: PropertyEvaluationData) => {
      if (data.fiberAvailable && data.fiberProviders) return { status: "pass" as const, currentValue: data.fiberProviders };
      if (data.fiberAvailable && !data.fiberProviders) return { status: "partial" as const, currentValue: "Available", notes: "Providers not specified" };
      return { status: "fail" as const, currentValue: "No" };
    },
  },
  {
    id: "zoning",
    title: "Industrial or Commercial Zoning",
    required: false,
    evaluate: (data: PropertyEvaluationData) => {
      if (!data.zoningClassification) return { status: "pending" as const, currentValue: "Not specified" };
      const zoning = data.zoningClassification.toLowerCase();
      if (zoning.includes("industrial") || zoning.includes("m-1") || zoning.includes("m-2") || zoning.includes("commercial")) {
        return { status: "pass" as const, currentValue: data.zoningClassification };
      }
      return { status: "partial" as const, currentValue: data.zoningClassification, notes: "Zoning may need review" };
    },
  },
  {
    id: "environmental",
    title: "Environmental Clearance",
    required: false,
    evaluate: (data: PropertyEvaluationData) => {
      if (!data.environmentalClearance) return { status: "pending" as const, currentValue: "Not specified" };
      if (data.environmentalClearance === "clean" || data.environmentalClearance === "phase1_done" || data.environmentalClearance === "phase2_done") {
        return { status: "pass" as const, currentValue: data.environmentalClearance };
      }
      if (data.environmentalClearance === "issues") return { status: "fail" as const, currentValue: "Known issues", notes: "Environmental issues present" };
      return { status: "partial" as const, currentValue: data.environmentalClearance };
    },
  },
  {
    id: "flood_zone",
    title: "Not in FEMA Flood Zone",
    required: false,
    evaluate: (data: PropertyEvaluationData) => {
      if (!data.floodZone) return { status: "pass" as const, currentValue: "Not in flood zone" };
      return { status: "fail" as const, currentValue: "In flood zone", notes: "FEMA flood zone - may affect insurance and operations" };
    },
  },
];

export function evaluateSite(data: PropertyEvaluationData): SiteEvaluationResult {
  const evaluations: RequirementEvaluation[] = [];

  // Evaluate required requirements
  for (const req of REQUIRED_REQUIREMENTS) {
    const result = req.evaluate(data);
    evaluations.push({
      id: req.id,
      title: req.title,
      status: result.status,
      isRequired: req.required,
      currentValue: result.currentValue,
      expectedValue: req.required ? "Required" : "Preferred",
      notes: result.notes,
    });
  }

  // Evaluate preferred requirements
  for (const req of PREFERRED_REQUIREMENTS) {
    const result = req.evaluate(data);
    evaluations.push({
      id: req.id,
      title: req.title,
      status: result.status,
      isRequired: req.required,
      currentValue: result.currentValue,
      expectedValue: "Preferred",
      notes: result.notes,
    });
  }

  // Calculate score
  const requiredPasses = evaluations.filter(e => e.isRequired && e.status === "pass").length;
  const requiredTotal = evaluations.filter(e => e.isRequired).length;
  const preferredPasses = evaluations.filter(e => !e.isRequired && e.status === "pass").length;
  const preferredTotal = evaluations.filter(e => !e.isRequired).length;

  // Score: Required (70%) + Preferred (30%)
  const requiredScore = requiredTotal > 0 ? (requiredPasses / requiredTotal) * 70 : 0;
  const preferredScore = preferredTotal > 0 ? (preferredPasses / preferredTotal) * 30 : 0;
  const totalScore = Math.round(requiredScore + preferredScore);

  // Determine if meets requirements
  const meetsRequirements = requiredPasses === requiredTotal;

  // Generate summary
  const summary = generateSummary(evaluations, totalScore);

  return {
    meetsRequirements,
    score: totalScore,
    maxScore: 100,
    requirements: evaluations,
    summary,
  };
}

function generateSummary(evaluations: RequirementEvaluation[], score: number): string {
  const requiredPasses = evaluations.filter(e => e.isRequired && e.status === "pass").length;
  const requiredTotal = evaluations.filter(e => e.isRequired).length;
  const fails = evaluations.filter(e => e.status === "fail").length;

  if (score >= 90) {
    return `Excellent match for Zenthium requirements. Meets all ${requiredTotal} required criteria (${requiredPasses}/${requiredTotal}). Highly recommended for immediate review.`;
  } else if (score >= 70) {
    return `Good match for Zenthium requirements. Meets ${requiredPasses}/${requiredTotal} required criteria. ${fails} areas need attention before proceeding.`;
  } else if (score >= 50) {
    return `Partial match for Zenthium requirements. Some critical requirements not met. ${fails} areas need significant attention.`;
  } else {
    return `Does not currently meet Zenthium's minimum requirements. ${fails} critical requirements not satisfied. May not be suitable without significant modifications.`;
  }
}
