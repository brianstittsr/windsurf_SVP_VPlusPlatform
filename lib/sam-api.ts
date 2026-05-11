/**
 * SAM.gov Entity Management API Integration
 * Documentation: https://open.gsa.gov/api/entity-api/
 */

// Base URLs
export const SAM_API_BASE_URL = "https://api.sam.gov/entity-information/v4/entities";

// Available sections to include in responses
export type SamSection =
  | "entityRegistration"
  | "coreData"
  | "assertions"
  | "pointsOfContact"
  | "repsAndCerts"
  | "integrityInformation"
  | "All";

// API response types
export interface SamApiResponse {
  entityData: SamEntity[];
  totalRecords: number;
  message?: string;
  error?: string;
  detail?: string;
}

export interface SamEntity {
  entityRegistration?: SamEntityRegistration;
  coreData?: SamCoreData;
  assertions?: SamAssertions;
  pointsOfContact?: SamPointsOfContact;
  repsAndCerts?: SamRepsAndCerts;
  integrityInformation?: SamIntegrityInformation;
}

export interface SamEntityRegistration {
  ueiSAM: string;
  legalBusinessName: string;
  dbaName?: string;
  physicalAddress?: SamAddress;
  mailingAddress?: SamAddress;
  businessStartDate?: string;
  registrationDate?: string;
  lastUpdateDate?: string;
  expirationDate?: string;
  activationDate?: string;
  deactivationDate?: string;
  entityState: string;
  purposeOfRegistration?: string[];
  exclusion?: SamExclusion;
  samExclusion?: boolean;
  businessTypes?: string[];
  naics?: SamNaics[];
  psc?: SamPsc[];
  entityEFTIndicator?: string;
}

export interface SamCoreData {
  legalBusinessName: string;
  dbaName?: string;
  physicalAddress?: SamAddress;
  mailingAddress?: SamAddress;
  businessStartDate?: string;
  registrationDate?: string;
  lastUpdateDate?: string;
  expirationDate?: string;
  activationDate?: string;
  deactivationDate?: string;
  entityState: string;
  purposeOfRegistration?: string[];
  exclusion?: SamExclusion;
  samExclusion?: boolean;
  businessTypes?: string[];
  naics?: SamNaics[];
  psc?: SamPsc[];
  entityEFTIndicator?: string;
}

export interface SamAddress {
  line1: string;
  line2?: string;
  city: string;
  state?: string;
  zip: string;
  zip4?: string;
  country?: string;
  congressionalDistrict?: string;
}

export interface SamExclusion {
  exclusionType?: string;
  exclusionDate?: string;
  cagingCode?: string;
  active?: boolean;
  crossReference?: string;
  systemId?: string;
}

export interface SamNaics {
  naicsCode: string;
  isPrimary?: boolean;
}

export interface SamPsc {
  pscCode: string;
  isPrimary?: boolean;
}

export interface SamAssertions {
  assertion?: string;
  assertionType?: string;
  assertionValue?: string;
}

export interface SamPointsOfContact {
  pointOfContact?: SamPointOfContact[];
}

export interface SamPointOfContact {
  firstName: string;
  lastName: string;
  title?: string;
  email?: string;
  phone?: string;
  fax?: string;
  type?: string;
  address?: SamAddress;
}

export interface SamRepsAndCerts {
  hasExclusion?: boolean;
  hasDelinquentFederalDebt?: boolean;
  hasFederalTaxLien?: boolean;
  hasBankruptcy?: boolean;
}

export interface SamIntegrityInformation {
  integrityInformation?: string;
  integrityType?: string;
  integrityValue?: string;
}

// API request parameters
export interface SamSearchParams {
  ueiSAM?: string | string[];
  cage?: string | string[];
  q?: string; // Free text search
  includeSections?: SamSection | SamSection[];
  page?: number;
  size?: number;
  api_key?: string; // For GET requests
}

export interface SamExtractParams extends SamSearchParams {
  format?: "json" | "csv";
  emailId?: string;
}

// Extract API response
export interface SamExtractResponse {
  token?: string;
  message?: string;
  error?: string;
  detail?: string;
}

/**
 * Build query string from parameters
 */
export function buildSamQuery(params: SamSearchParams): string {
  const queryParams = new URLSearchParams();

  if (params.ueiSAM) {
    const ueis = Array.isArray(params.ueiSAM) ? params.ueiSAM : [params.ueiSAM];
    ueis.forEach((uei) => queryParams.append("ueiSAM", uei));
  }

  if (params.cage) {
    const cages = Array.isArray(params.cage) ? params.cage : [params.cage];
    cages.forEach((c) => queryParams.append("cage", c));
  }

  if (params.q) {
    queryParams.set("q", params.q);
  }

  if (params.includeSections) {
    const sections = Array.isArray(params.includeSections)
      ? params.includeSections
      : [params.includeSections];
    queryParams.set("includeSections", sections.join(","));
  }

  if (params.page) {
    queryParams.set("page", params.page.toString());
  }

  if (params.size) {
    queryParams.set("size", params.size.toString());
  }

  if (params.api_key) {
    queryParams.set("api_key", params.api_key);
  }

  return queryParams.toString();
}

/**
 * Search SAM.gov entities (GET request - Public data)
 */
export async function searchSamEntities(
  params: SamSearchParams,
  apiKey: string
): Promise<SamApiResponse> {
  const query = buildSamQuery({ ...params, api_key: apiKey });
  const url = `${SAM_API_BASE_URL}?${query}`;

  const response = await fetch(url, {
    method: "GET",
    headers: {
      "Accept": "application/json",
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`SAM.gov API error: ${response.status} - ${errorText}`);
  }

  return response.json();
}

/**
 * Search SAM.gov entities (POST request - FOUO/Sensitive data)
 * Requires Basic Auth for System Account
 */
export async function searchSamEntitiesSecure(
  params: SamSearchParams,
  apiKey: string,
  basicAuthToken?: string
): Promise<SamApiResponse> {
  const query = buildSamQuery(params);
  const url = `${SAM_API_BASE_URL}?${query}`;

  const headers: Record<string, string> = {
    "x-api-key": apiKey,
    "Accept": "application/json",
    "Content-Type": "application/json",
  };

  if (basicAuthToken) {
    headers["Authorization"] = `Basic ${basicAuthToken}`;
  }

  const response = await fetch(url, {
    method: "POST",
    headers,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`SAM.gov API error: ${response.status} - ${errorText}`);
  }

  return response.json();
}

/**
 * Request SAM.gov data extract (async - for large datasets)
 */
export async function requestSamExtract(
  params: SamExtractParams,
  apiKey: string
): Promise<SamExtractResponse> {
  const query = buildSamQuery({ ...params, api_key: apiKey });
  const url = `${SAM_API_BASE_URL}?${query}`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "Accept": "application/json",
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`SAM.gov API error: ${response.status} - ${errorText}`);
  }

  return response.json();
}

/**
 * Download extract file using token
 */
export async function downloadSamExtract(
  token: string
): Promise<Blob> {
  const url = `${SAM_API_BASE_URL}?token=${token}`;

  const response = await fetch(url, {
    method: "GET",
    headers: {
      "Accept": "application/json",
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`SAM.gov API error: ${response.status} - ${errorText}`);
  }

  return response.blob();
}
