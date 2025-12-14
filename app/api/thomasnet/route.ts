import { NextRequest, NextResponse } from "next/server";

const THOMASNET_BASE_URL = "https://www.thomasnet.com";

// State name to abbreviation mapping
const STATE_MAP: Record<string, string> = {
  "alabama": "AL", "alaska": "AK", "arizona": "AZ", "arkansas": "AR", "california": "CA",
  "colorado": "CO", "connecticut": "CT", "delaware": "DE", "florida": "FL", "georgia": "GA",
  "hawaii": "HI", "idaho": "ID", "illinois": "IL", "indiana": "IN", "iowa": "IA",
  "kansas": "KS", "kentucky": "KY", "louisiana": "LA", "maine": "ME", "maryland": "MD",
  "massachusetts": "MA", "michigan": "MI", "minnesota": "MN", "mississippi": "MS", "missouri": "MO",
  "montana": "MT", "nebraska": "NE", "nevada": "NV", "new hampshire": "NH", "new jersey": "NJ",
  "new mexico": "NM", "new york": "NY", "north carolina": "NC", "north dakota": "ND", "ohio": "OH",
  "oklahoma": "OK", "oregon": "OR", "pennsylvania": "PA", "rhode island": "RI", "south carolina": "SC",
  "south dakota": "SD", "tennessee": "TN", "texas": "TX", "utah": "UT", "vermont": "VT",
  "virginia": "VA", "washington": "WA", "west virginia": "WV", "wisconsin": "WI", "wyoming": "WY",
};

interface SupplierResult {
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
  thomasnetUrl?: string;
}

// Helper to parse search query into ThomasNet search terms
function parseSearchQuery(query: string): { keywords: string; location?: string; category?: string } {
  const lowerQuery = query.toLowerCase();
  
  // Extract location if mentioned
  let location: string | undefined;
  const locationPatterns = [
    /in\s+([a-zA-Z\s]+(?:,\s*[A-Z]{2})?)/i,
    /from\s+([a-zA-Z\s]+(?:,\s*[A-Z]{2})?)/i,
    /near\s+([a-zA-Z\s]+(?:,\s*[A-Z]{2})?)/i,
    /located\s+in\s+([a-zA-Z\s]+(?:,\s*[A-Z]{2})?)/i,
  ];
  
  for (const pattern of locationPatterns) {
    const match = query.match(pattern);
    if (match) {
      location = match[1].trim();
      break;
    }
  }
  
  // Common manufacturing categories
  const categoryKeywords: Record<string, string[]> = {
    "machining": ["machining", "cnc", "milling", "turning", "lathe"],
    "metal-fabrication": ["metal fabrication", "sheet metal", "welding", "fabrication"],
    "plastic": ["plastic", "injection molding", "thermoforming", "extrusion"],
    "electronics": ["electronics", "pcb", "circuit board", "electronic assembly", "electronic manufacturing"],
    "automotive": ["automotive", "auto parts", "vehicle", "car parts"],
    "aerospace": ["aerospace", "aircraft", "aviation"],
    "medical": ["medical", "medical device", "healthcare", "surgical"],
    "packaging": ["packaging", "boxes", "containers", "cartons"],
    "rubber": ["rubber", "gaskets", "seals", "o-rings"],
    "casting": ["casting", "foundry", "die casting", "sand casting"],
    "stamping": ["stamping", "metal stamping", "press"],
    "fasteners": ["fasteners", "screws", "bolts", "nuts"],
    "springs": ["springs", "coil springs", "leaf springs"],
    "bearings": ["bearings", "ball bearings", "roller bearings"],
    "valves": ["valves", "fittings", "pipes"],
    "pumps": ["pumps", "hydraulic", "pneumatic"],
    "motors": ["motors", "electric motors", "servo"],
    "sensors": ["sensors", "transducers", "instrumentation"],
    "coatings": ["coatings", "plating", "anodizing", "painting"],
    "assembly": ["assembly", "contract manufacturing", "oem"],
  };
  
  let category: string | undefined;
  for (const [cat, keywords] of Object.entries(categoryKeywords)) {
    if (keywords.some(kw => lowerQuery.includes(kw))) {
      category = cat;
      break;
    }
  }
  
  // Clean up keywords - remove location phrases
  let keywords = query;
  for (const pattern of locationPatterns) {
    keywords = keywords.replace(pattern, "");
  }
  keywords = keywords.replace(/suppliers?|manufacturers?|companies?|find|search|looking for|need|want/gi, "").trim();
  
  return { keywords, location, category };
}

// Scrape ThomasNet search results
async function scrapeThomasNet(searchParams: { keywords: string; location?: string }): Promise<SupplierResult[]> {
  const { keywords, location } = searchParams;
  
  // Build ThomasNet search URL
  const searchTerms = encodeURIComponent(keywords || "manufacturing");
  let searchUrl = `${THOMASNET_BASE_URL}/nsearch.html?cov=NA&heading=&what=${searchTerms}&searchsource=suppliers`;
  
  // Add location filter if provided
  if (location) {
    const locationLower = location.toLowerCase().trim();
    const stateAbbr = STATE_MAP[locationLower] || location.toUpperCase();
    searchUrl += `&where=${encodeURIComponent(stateAbbr)}`;
  }
  
  console.log("Scraping ThomasNet:", searchUrl);
  
  try {
    const response = await fetch(searchUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
        "Cache-Control": "no-cache",
      },
    });
    
    if (!response.ok) {
      console.error("ThomasNet fetch failed:", response.status, response.statusText);
      return [];
    }
    
    const html = await response.text();
    
    // Parse the HTML to extract supplier information
    const suppliers = parseSupplierResults(html);
    
    return suppliers;
  } catch (error) {
    console.error("Error scraping ThomasNet:", error);
    return [];
  }
}

// Parse HTML to extract supplier data
function parseSupplierResults(html: string): SupplierResult[] {
  const suppliers: SupplierResult[] = [];
  
  // Try to extract using JSON-LD structured data if available
  const jsonLdPattern = /<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi;
  let jsonLdMatch;
  
  while ((jsonLdMatch = jsonLdPattern.exec(html)) !== null) {
    try {
      const jsonData = JSON.parse(jsonLdMatch[1]);
      if (Array.isArray(jsonData)) {
        for (const item of jsonData) {
          if (item["@type"] === "LocalBusiness" || item["@type"] === "Organization") {
            suppliers.push({
              id: `tn-${suppliers.length + 1}`,
              companyName: item.name || "Unknown Company",
              description: item.description || "",
              location: item.address?.addressLocality ? 
                `${item.address.addressLocality}, ${item.address.addressRegion}` : "",
              city: item.address?.addressLocality || "",
              state: item.address?.addressRegion || "",
              phone: item.telephone || "",
              website: item.url || "",
              thomasnetUrl: item.url || "",
            });
          }
        }
      }
    } catch {
      // JSON parse failed, continue with HTML parsing
    }
  }
  
  // If JSON-LD didn't work, try HTML parsing
  if (suppliers.length === 0) {
    // Look for supplier listing blocks using various patterns
    const cardPattern = /<article[^>]*class="[^"]*profile-card[^"]*"[^>]*>([\s\S]*?)<\/article>/gi;
    const listingPattern = /<div[^>]*class="[^"]*supplier-result[^"]*"[^>]*>([\s\S]*?)<\/div>\s*<\/div>/gi;
    
    let match;
    const cardHtml: string[] = [];
    
    while ((match = cardPattern.exec(html)) !== null) {
      cardHtml.push(match[1]);
    }
    
    if (cardHtml.length === 0) {
      while ((match = listingPattern.exec(html)) !== null) {
        cardHtml.push(match[1]);
      }
    }
    
    // Extract data from each card
    for (let i = 0; i < cardHtml.length && i < 20; i++) {
      const card = cardHtml[i];
      
      // Extract company name
      const nameMatch = card.match(/<a[^>]*>([^<]+)<\/a>/) || 
                        card.match(/<h[23][^>]*>([^<]+)<\/h[23]>/);
      const companyName = nameMatch ? nameMatch[1].trim() : "";
      
      // Extract description
      const descMatch = card.match(/<p[^>]*>([^<]{20,})<\/p>/);
      const description = descMatch ? descMatch[1].trim() : "";
      
      // Extract location
      const locMatch = card.match(/([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*),\s*([A-Z]{2})/);
      const city = locMatch ? locMatch[1] : "";
      const state = locMatch ? locMatch[2] : "";
      
      // Extract phone
      const phoneMatch = card.match(/\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/);
      const phone = phoneMatch ? phoneMatch[0] : "";
      
      // Extract URL
      const urlMatch = card.match(/href="([^"]*profile[^"]*)"/i);
      const thomasnetUrl = urlMatch ? 
        (urlMatch[1].startsWith("http") ? urlMatch[1] : `${THOMASNET_BASE_URL}${urlMatch[1]}`) : "";
      
      if (companyName) {
        suppliers.push({
          id: `tn-${Date.now()}-${i}`,
          companyName,
          description,
          location: city && state ? `${city}, ${state}` : "",
          city,
          state,
          phone,
          thomasnetUrl,
        });
      }
    }
  }
  
  // If still no results, try a more aggressive pattern for company links
  if (suppliers.length === 0) {
    const simplePattern = /<a[^>]*href="\/profile\/[^"]+"[^>]*>([^<]+)<\/a>/gi;
    let simpleMatch;
    let count = 0;
    
    while ((simpleMatch = simplePattern.exec(html)) !== null && count < 20) {
      const companyName = simpleMatch[1].trim();
      if (companyName.length > 3 && !companyName.includes("<")) {
        suppliers.push({
          id: `tn-${Date.now()}-${count}`,
          companyName,
          description: "",
          location: "",
          thomasnetUrl: `${THOMASNET_BASE_URL}/profile/${encodeURIComponent(companyName.toLowerCase().replace(/\s+/g, "-"))}`,
        });
        count++;
      }
    }
  }
  
  return suppliers;
}

// Scrape supplier detail page for phone number
async function scrapeSupplierDetails(thomasnetUrl: string): Promise<{ phone?: string; website?: string; description?: string }> {
  if (!thomasnetUrl) return {};
  
  try {
    const response = await fetch(thomasnetUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
      },
    });
    
    if (!response.ok) return {};
    
    const html = await response.text();
    
    // Extract phone from detail page
    const phoneMatch = html.match(/tel:([^"]+)"/) || html.match(/\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/);
    const phone = phoneMatch ? phoneMatch[1] || phoneMatch[0] : undefined;
    
    // Extract website
    const websiteMatch = html.match(/href="(https?:\/\/(?!www\.thomasnet)[^"]+)"[^>]*>.*?(?:website|visit)/i);
    const website = websiteMatch ? websiteMatch[1] : undefined;
    
    // Extract description
    const descMatch = html.match(/<meta[^>]*name="description"[^>]*content="([^"]+)"/i);
    const description = descMatch ? descMatch[1] : undefined;
    
    return { phone, website, description };
  } catch (error) {
    console.error("Error scraping supplier details:", error);
    return {};
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, searchParams } = body;

    switch (action) {
      case "search_suppliers": {
        const query = searchParams?.query || "";
        const location = searchParams?.location || "";
        
        // Parse the natural language query
        const parsed = parseSearchQuery(query);
        
        // Merge with explicit params
        const searchCriteria = {
          keywords: parsed.keywords || query,
          location: location || parsed.location,
        };
        
        // Scrape live results from ThomasNet
        const results = await scrapeThomasNet(searchCriteria);
        
        return NextResponse.json({
          success: true,
          results,
          searchCriteria,
          total: results.length,
          message: results.length > 0 
            ? `Found ${results.length} suppliers from ThomasNet`
            : "No suppliers found. Try different search terms.",
          source: "thomasnet_live",
        });
      }

      case "search_by_category": {
        const category = searchParams?.category || "";
        const location = searchParams?.location || "";
        
        const results = await scrapeThomasNet({
          keywords: category,
          location: location || undefined,
        });
        
        return NextResponse.json({
          success: true,
          results,
          total: results.length,
          source: "thomasnet_live",
        });
      }

      case "get_supplier_details": {
        const thomasnetUrl = searchParams?.thomasnetUrl;
        
        if (!thomasnetUrl) {
          return NextResponse.json(
            { error: "ThomasNet URL is required", success: false },
            { status: 400 }
          );
        }
        
        const details = await scrapeSupplierDetails(thomasnetUrl);
        
        return NextResponse.json({
          success: true,
          details,
        });
      }

      case "ai_search": {
        // AI-powered natural language search
        const query = searchParams?.query || "";
        
        if (!query.trim()) {
          return NextResponse.json({
            success: true,
            results: [],
            message: "Please provide a search query",
            suggestions: [
              "Find CNC machining suppliers in Ohio",
              "Metal fabrication companies near Detroit",
              "ISO certified plastic injection molding",
              "Aerospace parts manufacturers with AS9100",
              "Medical device contract manufacturers",
            ],
          });
        }
        
        // Parse and search
        const parsed = parseSearchQuery(query);
        const results = await scrapeThomasNet(parsed);
        
        // Generate AI response
        const aiResponse = {
          interpretation: `Searching ThomasNet for ${parsed.keywords || "suppliers"}${parsed.location ? ` in ${parsed.location}` : ""}.`,
          results,
          total: results.length,
          source: "thomasnet_live",
          refinementSuggestions: [
            results.length > 10 ? "Add a location to narrow results" : null,
            results.length === 0 ? "Try broader search terms" : null,
            "Filter by certification (ISO, AS9100, etc.)",
            "Specify employee count or company size",
          ].filter(Boolean),
        };
        
        return NextResponse.json({
          success: true,
          ...aiResponse,
        });
      }

      default:
        return NextResponse.json(
          { error: "Unknown action", success: false },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error("ThomasNet API error:", error);
    return NextResponse.json(
      { error: "Internal server error", success: false },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: "ThomasNet Supplier Search API - Live Data",
    endpoints: {
      search_suppliers: "Search for suppliers by keywords and location (live scraping)",
      search_by_category: "Search suppliers by category (live scraping)",
      get_supplier_details: "Get detailed supplier information from profile page",
      ai_search: "AI-powered natural language supplier search (live scraping)",
    },
    source: "thomasnet.com",
  });
}
