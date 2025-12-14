import { NextRequest, NextResponse } from "next/server";

// State name to abbreviation mapping
const STATE_MAP: Record<string, string> = {
  "alabama": "al", "alaska": "ak", "arizona": "az", "arkansas": "ar", "california": "ca",
  "colorado": "co", "connecticut": "ct", "delaware": "de", "florida": "fl", "georgia": "ga",
  "hawaii": "hi", "idaho": "id", "illinois": "il", "indiana": "in", "iowa": "ia",
  "kansas": "ks", "kentucky": "ky", "louisiana": "la", "maine": "me", "maryland": "md",
  "massachusetts": "ma", "michigan": "mi", "minnesota": "mn", "mississippi": "ms", "missouri": "mo",
  "montana": "mt", "nebraska": "ne", "nevada": "nv", "new hampshire": "nh", "new jersey": "nj",
  "new mexico": "nm", "new york": "ny", "north carolina": "nc", "north dakota": "nd", "ohio": "oh",
  "oklahoma": "ok", "oregon": "or", "pennsylvania": "pa", "rhode island": "ri", "south carolina": "sc",
  "south dakota": "sd", "tennessee": "tn", "texas": "tx", "utah": "ut", "vermont": "vt",
  "virginia": "va", "washington": "wa", "west virginia": "wv", "wisconsin": "wi", "wyoming": "wy",
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

// Comprehensive mock supplier database
const MOCK_SUPPLIERS: SupplierResult[] = [
  {
    id: "tn-001",
    companyName: "Precision Manufacturing Inc.",
    description: "Full-service precision machining and CNC manufacturing. ISO 9001:2015 certified with 50+ years of experience serving aerospace, defense, and medical industries.",
    location: "Cleveland, OH",
    city: "Cleveland",
    state: "OH",
    phone: "(216) 555-0123",
    website: "www.precisionmfginc.com",
    categories: ["CNC Machining", "Precision Manufacturing", "Aerospace Parts"],
    certifications: ["ISO 9001:2015", "AS9100D", "ITAR Registered"],
    employeeCount: "100-249",
    thomasnetUrl: "https://www.thomasnet.com/profile/precision-manufacturing",
  },
  {
    id: "tn-002",
    companyName: "Advanced Metal Fabricators",
    description: "Custom metal fabrication, sheet metal work, and welding services. Specializing in stainless steel and aluminum fabrication for industrial applications.",
    location: "Detroit, MI",
    city: "Detroit",
    state: "MI",
    phone: "(313) 555-0456",
    website: "www.advancedmetalfab.com",
    categories: ["Metal Fabrication", "Sheet Metal", "Welding Services"],
    certifications: ["ISO 9001:2015", "AWS Certified"],
    employeeCount: "50-99",
    thomasnetUrl: "https://www.thomasnet.com/profile/advanced-metal-fab",
  },
  {
    id: "tn-003",
    companyName: "TechPlast Solutions",
    description: "Injection molding and plastic manufacturing specialists. High-volume production capabilities with in-house tooling and design services.",
    location: "Chicago, IL",
    city: "Chicago",
    state: "IL",
    phone: "(312) 555-0789",
    website: "www.techplastsolutions.com",
    categories: ["Injection Molding", "Plastic Manufacturing", "Tooling"],
    certifications: ["ISO 9001:2015", "ISO 14001"],
    employeeCount: "250-499",
    thomasnetUrl: "https://www.thomasnet.com/profile/techplast-solutions",
  },
  {
    id: "tn-004",
    companyName: "ElectroAssembly Corp",
    description: "Electronic contract manufacturing and PCB assembly. Surface mount and through-hole capabilities with full testing and quality inspection.",
    location: "San Jose, CA",
    city: "San Jose",
    state: "CA",
    phone: "(408) 555-0234",
    website: "www.electroassembly.com",
    categories: ["PCB Assembly", "Electronic Manufacturing", "Contract Assembly"],
    certifications: ["ISO 9001:2015", "IPC-A-610", "J-STD-001"],
    employeeCount: "100-249",
    thomasnetUrl: "https://www.thomasnet.com/profile/electroassembly",
  },
  {
    id: "tn-005",
    companyName: "MedDevice Manufacturing",
    description: "FDA-registered medical device contract manufacturer. Cleanroom assembly, precision machining, and complete device assembly services.",
    location: "Minneapolis, MN",
    city: "Minneapolis",
    state: "MN",
    phone: "(612) 555-0567",
    website: "www.meddevicemfg.com",
    categories: ["Medical Device Manufacturing", "Cleanroom Assembly", "FDA Registered"],
    certifications: ["ISO 13485", "FDA Registered", "ISO 9001:2015"],
    employeeCount: "100-249",
    thomasnetUrl: "https://www.thomasnet.com/profile/meddevice-mfg",
  },
  {
    id: "tn-006",
    companyName: "AutoParts Precision",
    description: "Automotive parts supplier specializing in precision-machined components. Tier 2 supplier to major OEMs with JIT delivery capabilities.",
    location: "Louisville, KY",
    city: "Louisville",
    state: "KY",
    phone: "(502) 555-0890",
    website: "www.autopartsprecision.com",
    categories: ["Automotive Parts", "Precision Machining", "OEM Supplier"],
    certifications: ["IATF 16949", "ISO 9001:2015"],
    employeeCount: "250-499",
    thomasnetUrl: "https://www.thomasnet.com/profile/autoparts-precision",
  },
  {
    id: "tn-007",
    companyName: "AeroComponents LLC",
    description: "Aerospace component manufacturing with AS9100 certification. Complex machining, assembly, and special processes for commercial and defense aerospace.",
    location: "Phoenix, AZ",
    city: "Phoenix",
    state: "AZ",
    phone: "(602) 555-0345",
    website: "www.aerocomponents.com",
    categories: ["Aerospace Manufacturing", "Defense Contractor", "Complex Machining"],
    certifications: ["AS9100D", "NADCAP", "ITAR Registered"],
    employeeCount: "100-249",
    thomasnetUrl: "https://www.thomasnet.com/profile/aerocomponents",
  },
  {
    id: "tn-008",
    companyName: "PackRight Industries",
    description: "Custom packaging solutions including corrugated boxes, foam inserts, and protective packaging. Design services and rapid prototyping available.",
    location: "Atlanta, GA",
    city: "Atlanta",
    state: "GA",
    phone: "(404) 555-0678",
    website: "www.packrightind.com",
    categories: ["Custom Packaging", "Corrugated Boxes", "Protective Packaging"],
    certifications: ["ISO 9001:2015", "FSC Certified"],
    employeeCount: "50-99",
    thomasnetUrl: "https://www.thomasnet.com/profile/packright-industries",
  },
  {
    id: "tn-009",
    companyName: "RubberTech Sealing",
    description: "Custom rubber molding and sealing solutions. Specializing in O-rings, gaskets, and custom molded rubber parts for industrial applications.",
    location: "Akron, OH",
    city: "Akron",
    state: "OH",
    phone: "(330) 555-0901",
    website: "www.rubbertechsealing.com",
    categories: ["Rubber Molding", "O-Rings", "Gaskets", "Seals"],
    certifications: ["ISO 9001:2015", "TS 16949"],
    employeeCount: "50-99",
    thomasnetUrl: "https://www.thomasnet.com/profile/rubbertech-sealing",
  },
  {
    id: "tn-010",
    companyName: "CastMaster Foundry",
    description: "Full-service foundry offering sand casting, investment casting, and die casting. Ferrous and non-ferrous metals with complete finishing services.",
    location: "Milwaukee, WI",
    city: "Milwaukee",
    state: "WI",
    phone: "(414) 555-0234",
    website: "www.castmasterfoundry.com",
    categories: ["Sand Casting", "Investment Casting", "Die Casting", "Foundry"],
    certifications: ["ISO 9001:2015"],
    employeeCount: "100-249",
    thomasnetUrl: "https://www.thomasnet.com/profile/castmaster-foundry",
  },
  {
    id: "tn-011",
    companyName: "Rocky Mountain Electronics",
    description: "Electronic manufacturing services including PCB assembly, cable assemblies, and box builds. Serving aerospace, defense, and telecommunications industries in Colorado.",
    location: "Denver, CO",
    city: "Denver",
    state: "CO",
    phone: "(303) 555-1234",
    website: "www.rockymtnelectronics.com",
    categories: ["Electronic Manufacturing", "PCB Assembly", "Cable Assembly", "Box Build"],
    certifications: ["ISO 9001:2015", "IPC-A-610", "AS9100D"],
    employeeCount: "50-99",
    thomasnetUrl: "https://www.thomasnet.com/profile/rocky-mountain-electronics",
  },
  {
    id: "tn-012",
    companyName: "Colorado Precision CNC",
    description: "High-precision CNC machining and turning services. Specializing in aerospace and medical components with tight tolerances.",
    location: "Colorado Springs, CO",
    city: "Colorado Springs",
    state: "CO",
    phone: "(719) 555-2345",
    website: "www.coloradoprecisioncnc.com",
    categories: ["CNC Machining", "Precision Turning", "Aerospace Parts", "Medical Components"],
    certifications: ["ISO 9001:2015", "AS9100D", "ISO 13485"],
    employeeCount: "25-49",
    thomasnetUrl: "https://www.thomasnet.com/profile/colorado-precision-cnc",
  },
  {
    id: "tn-013",
    companyName: "Front Range Metal Works",
    description: "Custom metal fabrication and welding services. Sheet metal, structural steel, and aluminum fabrication for commercial and industrial applications.",
    location: "Boulder, CO",
    city: "Boulder",
    state: "CO",
    phone: "(303) 555-3456",
    website: "www.frontrangemetalworks.com",
    categories: ["Metal Fabrication", "Sheet Metal", "Welding", "Structural Steel"],
    certifications: ["ISO 9001:2015", "AWS Certified"],
    employeeCount: "25-49",
    thomasnetUrl: "https://www.thomasnet.com/profile/front-range-metal-works",
  },
  {
    id: "tn-014",
    companyName: "Mile High Circuit Systems",
    description: "Full-service electronics contract manufacturer. SMT and through-hole assembly, prototyping, and production. Quick-turn capabilities available.",
    location: "Aurora, CO",
    city: "Aurora",
    state: "CO",
    phone: "(720) 555-4567",
    website: "www.milehighcircuits.com",
    categories: ["Electronic Manufacturing", "PCB Assembly", "SMT Assembly", "Prototyping"],
    certifications: ["ISO 9001:2015", "IPC-A-610 Class 3", "ITAR Registered"],
    employeeCount: "50-99",
    thomasnetUrl: "https://www.thomasnet.com/profile/mile-high-circuits",
  },
  {
    id: "tn-015",
    companyName: "Texas Electronic Assembly",
    description: "Electronic contract manufacturing with full turnkey capabilities. PCB assembly, testing, and fulfillment services.",
    location: "Austin, TX",
    city: "Austin",
    state: "TX",
    phone: "(512) 555-5678",
    website: "www.texaselectronicassembly.com",
    categories: ["Electronic Manufacturing", "PCB Assembly", "Contract Manufacturing"],
    certifications: ["ISO 9001:2015", "IPC-A-610"],
    employeeCount: "100-249",
    thomasnetUrl: "https://www.thomasnet.com/profile/texas-electronic-assembly",
  },
  {
    id: "tn-016",
    companyName: "Midwest Stamping & Tool",
    description: "Metal stamping and progressive die manufacturing. High-volume production of precision stamped components for automotive and appliance industries.",
    location: "Indianapolis, IN",
    city: "Indianapolis",
    state: "IN",
    phone: "(317) 555-6789",
    website: "www.midweststamping.com",
    categories: ["Metal Stamping", "Progressive Die", "Automotive Parts"],
    certifications: ["IATF 16949", "ISO 9001:2015"],
    employeeCount: "100-249",
    thomasnetUrl: "https://www.thomasnet.com/profile/midwest-stamping",
  },
  {
    id: "tn-017",
    companyName: "Pacific Coast Plastics",
    description: "Custom plastic injection molding and blow molding. Serving medical, consumer products, and industrial markets with FDA-compliant facilities.",
    location: "Los Angeles, CA",
    city: "Los Angeles",
    state: "CA",
    phone: "(310) 555-7890",
    website: "www.pacificcoastplastics.com",
    categories: ["Injection Molding", "Blow Molding", "Medical Plastics"],
    certifications: ["ISO 9001:2015", "ISO 13485", "FDA Registered"],
    employeeCount: "100-249",
    thomasnetUrl: "https://www.thomasnet.com/profile/pacific-coast-plastics",
  },
  {
    id: "tn-018",
    companyName: "Southern Steel Fabrication",
    description: "Structural steel fabrication and erection. AISC certified for building and bridge construction with in-house engineering capabilities.",
    location: "Birmingham, AL",
    city: "Birmingham",
    state: "AL",
    phone: "(205) 555-8901",
    website: "www.southernsteelfab.com",
    categories: ["Structural Steel", "Steel Fabrication", "Construction"],
    certifications: ["AISC Certified", "AWS Certified"],
    employeeCount: "100-249",
    thomasnetUrl: "https://www.thomasnet.com/profile/southern-steel-fab",
  },
  {
    id: "tn-019",
    companyName: "New England Precision",
    description: "Swiss-type CNC machining and precision turning. Specializing in small, complex parts for medical devices and aerospace applications.",
    location: "Boston, MA",
    city: "Boston",
    state: "MA",
    phone: "(617) 555-9012",
    website: "www.newenglandprecision.com",
    categories: ["Swiss Machining", "Precision Turning", "Medical Components"],
    certifications: ["ISO 9001:2015", "ISO 13485", "AS9100D"],
    employeeCount: "50-99",
    thomasnetUrl: "https://www.thomasnet.com/profile/new-england-precision",
  },
  {
    id: "tn-020",
    companyName: "Northwest Composites",
    description: "Advanced composite manufacturing including carbon fiber and fiberglass. Serving aerospace, marine, and sporting goods industries.",
    location: "Seattle, WA",
    city: "Seattle",
    state: "WA",
    phone: "(206) 555-0123",
    website: "www.northwestcomposites.com",
    categories: ["Composites", "Carbon Fiber", "Fiberglass", "Aerospace"],
    certifications: ["AS9100D", "NADCAP"],
    employeeCount: "50-99",
    thomasnetUrl: "https://www.thomasnet.com/profile/northwest-composites",
  },
];

// Helper to parse search query into search terms
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

// Search suppliers from mock database
function searchSuppliers(searchParams: { keywords: string; location?: string }): SupplierResult[] {
  const { keywords, location } = searchParams;
  
  let results = [...MOCK_SUPPLIERS];
  
  // Filter by keywords
  if (keywords && keywords.trim()) {
    const searchTerms = keywords.toLowerCase().split(/\s+/);
    results = results.filter(supplier => {
      const searchableText = [
        supplier.companyName,
        supplier.description,
        ...(supplier.categories || []),
        ...(supplier.certifications || []),
      ].join(" ").toLowerCase();
      
      return searchTerms.some(term => searchableText.includes(term));
    });
  }
  
  // Filter by location
  if (location) {
    const locationLower = location.toLowerCase().trim();
    const stateAbbr = STATE_MAP[locationLower] || locationLower;
    
    results = results.filter(supplier => {
      const supplierState = supplier.state?.toLowerCase() || "";
      const supplierCity = supplier.city?.toLowerCase() || "";
      const supplierLocation = supplier.location?.toLowerCase() || "";
      
      return supplierState === stateAbbr ||
        supplierState.includes(locationLower) ||
        supplierCity.includes(locationLower) ||
        supplierLocation.includes(locationLower);
    });
  }
  
  return results;
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
        
        // Search suppliers
        const results = searchSuppliers(searchCriteria);
        
        return NextResponse.json({
          success: true,
          results,
          searchCriteria,
          total: results.length,
          message: results.length > 0 
            ? `Found ${results.length} suppliers matching your criteria`
            : "No suppliers found. Try different search terms.",
        });
      }

      case "search_by_category": {
        const category = searchParams?.category || "";
        const location = searchParams?.location || "";
        
        const results = searchSuppliers({
          keywords: category,
          location: location || undefined,
        });
        
        return NextResponse.json({
          success: true,
          results,
          total: results.length,
        });
      }

      case "get_supplier_details": {
        const supplierId = searchParams?.supplierId;
        
        if (!supplierId) {
          return NextResponse.json(
            { error: "Supplier ID is required", success: false },
            { status: 400 }
          );
        }
        
        const supplier = MOCK_SUPPLIERS.find(s => s.id === supplierId);
        
        if (supplier) {
          return NextResponse.json({
            success: true,
            supplier: {
              ...supplier,
              yearFounded: "1985",
              annualRevenue: "$10M - $50M",
              ownership: "Privately Held",
            },
          });
        }
        
        return NextResponse.json(
          { error: "Supplier not found", success: false },
          { status: 404 }
        );
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
        const results = searchSuppliers(parsed);
        
        // Generate AI response
        const aiResponse = {
          interpretation: `Searching for ${parsed.keywords || "suppliers"}${parsed.location ? ` in ${parsed.location}` : ""}.`,
          results,
          total: results.length,
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
    message: "Supplier Search API",
    endpoints: {
      search_suppliers: "Search for suppliers by keywords and location",
      search_by_category: "Search suppliers by category",
      get_supplier_details: "Get detailed supplier information",
      ai_search: "AI-powered natural language supplier search",
    },
    totalSuppliers: MOCK_SUPPLIERS.length,
  });
}
