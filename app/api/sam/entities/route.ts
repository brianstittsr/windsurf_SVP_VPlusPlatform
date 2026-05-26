import { NextRequest, NextResponse } from "next/server";
import { searchSamEntities, searchSamEntitiesSecure, SamSearchParams, SamSection } from "@/lib/sam-api";

/**
 * GET /api/sam/entities
 * Search SAM.gov entities using GET request (Public data only)
 * 
 * Query Parameters:
 * - ueiSAM: Single UEI or comma-separated UEIs
 * - cage: Single CAGE code or comma-separated CAGE codes
 * - q: Free text search query
 * - includeSections: Sections to include (entityRegistration, coreData, assertions, pointsOfContact, repsAndCerts, integrityInformation, or All)
 * - page: Page number (default: 1)
 * - size: Number of records per page (max: 10)
 */
export async function GET(request: NextRequest) {
  const apiKey = process.env.SAM_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { error: "SAM_API_KEY environment variable is not configured" },
      { status: 500 }
    );
  }

  try {
    const searchParams = request.nextUrl.searchParams;
    const params: SamSearchParams = {};

    // Parse ueiSAM (can be single or multiple)
    const ueiSAM = searchParams.get("ueiSAM");
    if (ueiSAM) {
      params.ueiSAM = ueiSAM.includes(",") ? ueiSAM.split(",") : ueiSAM;
    }

    // Parse cage (can be single or multiple)
    const cage = searchParams.get("cage");
    if (cage) {
      params.cage = cage.includes(",") ? cage.split(",") : cage;
    }

    // Parse other parameters
    const q = searchParams.get("q");
    if (q) params.q = q;

    const includeSections = searchParams.get("includeSections");
    if (includeSections) {
      params.includeSections = includeSections.includes(",")
        ? (includeSections.split(",").map((s) => s.trim()) as SamSection[])
        : (includeSections as SamSection);
    }

    const page = searchParams.get("page");
    if (page) params.page = parseInt(page, 10);

    const size = searchParams.get("size");
    if (size) params.size = parseInt(size, 10);

    // Make the API call
    const data = await searchSamEntities(params, apiKey);

    return NextResponse.json(data);
  } catch (error) {
    console.error("[SAM API] GET error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to search SAM.gov entities" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/sam/entities
 * Search SAM.gov entities using POST request (FOUO/Sensitive data)
 * Requires Basic Auth header for System Account
 * 
 * Body Parameters:
 * - ueiSAM: Single UEI or array of UEIs
 * - cage: Single CAGE code or array of CAGE codes
 * - q: Free text search query
 * - includeSections: Sections to include
 * - page: Page number
 * - size: Number of records per page
 * 
 * Headers:
 * - Authorization: Basic <base64-encoded-credentials> (for FOUO/Sensitive data)
 */
export async function POST(request: NextRequest) {
  const apiKey = process.env.SAM_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { error: "SAM_API_KEY environment variable is not configured" },
      { status: 500 }
    );
  }

  try {
    const body = await request.json();
    const params: SamSearchParams = body;

    // Get Basic Auth token from header (for FOUO/Sensitive data access)
    const authHeader = request.headers.get("authorization");
    const basicAuthToken = authHeader?.startsWith("Basic ") 
      ? authHeader.substring(6) 
      : undefined;

    // Make the API call
    const data = await searchSamEntitiesSecure(params, apiKey, basicAuthToken);

    return NextResponse.json(data);
  } catch (error) {
    console.error("[SAM API] POST error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to search SAM.gov entities" },
      { status: 500 }
    );
  }
}
