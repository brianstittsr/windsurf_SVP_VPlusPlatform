import { scrapeThomasNetSearch } from "./thomasnet-scraper";
import { scrapeConnexSearch } from "./connex-scraper";

interface AggregatedSupplier {
  id: string;
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
  revenue?: string;
  sourceUrl?: string;
  source: "thomasnet" | "connex" | "both";
  thomasnetUrl?: string;
  connexUrl?: string;
}

interface AggregatedResult {
  suppliers: AggregatedSupplier[];
  totalResults: number;
  sources: {
    thomasnet: { count: number; total: number; success: boolean; error?: string; authenticated?: boolean };
    connex: { count: number; total: number; success: boolean; error?: string; authenticated?: boolean };
  };
  isLiveData: boolean;
}

interface SearchCredentials {
  thomasnet?: { email: string; password: string };
  connex?: { email: string; password: string };
}

// Normalize company names for deduplication
function normalizeCompanyName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "")
    .replace(/(inc|llc|corp|corporation|company|co|ltd|limited)$/g, "")
    .trim();
}

// Merge duplicate suppliers from different sources
function mergeSuppliers(suppliers: AggregatedSupplier[]): AggregatedSupplier[] {
  const merged = new Map<string, AggregatedSupplier>();
  
  for (const supplier of suppliers) {
    const normalizedName = normalizeCompanyName(supplier.companyName);
    
    if (merged.has(normalizedName)) {
      // Merge with existing
      const existing = merged.get(normalizedName)!;
      
      // Update source to "both" if from different sources
      if (existing.source !== supplier.source) {
        existing.source = "both";
      }
      
      // Merge URLs
      if (supplier.source === "thomasnet" || supplier.thomasnetUrl) {
        existing.thomasnetUrl = supplier.thomasnetUrl || supplier.sourceUrl;
      }
      if (supplier.source === "connex" || supplier.connexUrl) {
        existing.connexUrl = supplier.connexUrl || supplier.sourceUrl;
      }
      
      // Fill in missing data
      existing.description = existing.description || supplier.description;
      existing.location = existing.location || supplier.location;
      existing.phone = existing.phone || supplier.phone;
      existing.website = existing.website || supplier.website;
      existing.certifications = existing.certifications?.length 
        ? existing.certifications 
        : supplier.certifications;
      existing.employeeCount = existing.employeeCount || supplier.employeeCount;
    } else {
      // Add new supplier
      const newSupplier = { ...supplier };
      if (supplier.source === "thomasnet") {
        newSupplier.thomasnetUrl = supplier.sourceUrl;
      } else if (supplier.source === "connex") {
        newSupplier.connexUrl = supplier.sourceUrl;
      }
      merged.set(normalizedName, newSupplier);
    }
  }
  
  return Array.from(merged.values());
}

// Search multiple sources in parallel
export async function searchAllSources(
  query: string,
  credentials?: SearchCredentials,
  options?: {
    includeThomasNet?: boolean;
    includeConnex?: boolean;
    maxResultsPerSource?: number;
  }
): Promise<AggregatedResult> {
  const {
    includeThomasNet = true,
    includeConnex = true,
    maxResultsPerSource = 25,
  } = options || {};

  const results: AggregatedResult = {
    suppliers: [],
    totalResults: 0,
    sources: {
      thomasnet: { count: 0, total: 0, success: false },
      connex: { count: 0, total: 0, success: false },
    },
    isLiveData: false,
  };

  // Run searches in parallel
  const searches: Promise<void>[] = [];

  if (includeThomasNet) {
    searches.push(
      scrapeThomasNetSearch(query, credentials?.thomasnet)
        .then((thomasResult) => {
          results.sources.thomasnet = {
            count: thomasResult.suppliers.length,
            total: thomasResult.totalResults,
            success: thomasResult.isLiveData,
            error: thomasResult.error,
            authenticated: thomasResult.isAuthenticated,
          };
          
          if (thomasResult.suppliers.length > 0) {
            results.isLiveData = true;
            const suppliers = thomasResult.suppliers.slice(0, maxResultsPerSource).map((s) => ({
              ...s,
              source: "thomasnet" as const,
              sourceUrl: s.thomasnetUrl,
              thomasnetUrl: s.thomasnetUrl,
            }));
            results.suppliers.push(...suppliers);
          }
        })
        .catch((error) => {
          console.error("ThomasNet search error:", error);
          results.sources.thomasnet.error = error.message;
        })
    );
  }

  if (includeConnex) {
    searches.push(
      scrapeConnexSearch(query, credentials?.connex)
        .then((connexResult) => {
          results.sources.connex = {
            count: connexResult.suppliers.length,
            total: connexResult.totalResults,
            success: connexResult.isLiveData,
            error: connexResult.error,
            authenticated: connexResult.isAuthenticated,
          };
          
          if (connexResult.suppliers.length > 0) {
            results.isLiveData = true;
            const suppliers = connexResult.suppliers.slice(0, maxResultsPerSource).map((s) => ({
              ...s,
              source: "connex" as const,
              sourceUrl: s.sourceUrl,
              connexUrl: s.sourceUrl,
            }));
            results.suppliers.push(...suppliers);
          }
        })
        .catch((error) => {
          console.error("CONNEX search error:", error);
          results.sources.connex.error = error.message;
        })
    );
  }

  // Wait for all searches to complete
  await Promise.all(searches);

  // Merge and deduplicate suppliers
  results.suppliers = mergeSuppliers(results.suppliers);
  
  // Calculate total
  results.totalResults = results.sources.thomasnet.total + results.sources.connex.total;

  // Re-assign IDs after merging
  results.suppliers = results.suppliers.map((s, i) => ({
    ...s,
    id: `agg-${i + 1}`,
  }));

  console.log(`Aggregator: ${results.suppliers.length} unique suppliers from ${
    [
      results.sources.thomasnet.success ? "ThomasNet" : null,
      results.sources.connex.success ? "CONNEX" : null,
    ].filter(Boolean).join(" + ") || "no sources"
  }`);

  return results;
}

// Get source summary for display
export function getSourceSummary(result: AggregatedResult): string {
  const parts: string[] = [];
  
  if (result.sources.thomasnet.success) {
    parts.push(`ThomasNet: ${result.sources.thomasnet.count} of ${result.sources.thomasnet.total.toLocaleString()}`);
  } else if (result.sources.thomasnet.error) {
    parts.push(`ThomasNet: Error`);
  }
  
  if (result.sources.connex.success) {
    parts.push(`CONNEX: ${result.sources.connex.count} of ${result.sources.connex.total.toLocaleString()}`);
  } else if (result.sources.connex.error) {
    parts.push(`CONNEX: Error`);
  }
  
  return parts.join(" | ");
}
