import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/zenthium/integrations/geocode
 * Geocodes an address to get latitude and longitude
 * Uses OpenStreetMap Nominatim API (free, no API key required)
 */

interface GeocodeResponse {
  success: boolean;
  data?: {
    lat: number;
    lon: number;
    formatted_address: string;
    display_name: string;
  };
  error?: string;
}

async function geocodeAddress(
  address: string,
  city: string,
  state: string,
  zip?: string
): Promise<GeocodeResponse> {
  try {
    // Build full address string
    const fullAddress = [address, city, state, zip].filter(Boolean).join(', ');
    
    // Nominatim API (OpenStreetMap)
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(fullAddress)}&limit=1`;
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'StrategicValuePlus-Zenthium/1.0',
      },
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      return {
        success: false,
        error: `Geocoding API returned ${response.status}: ${response.statusText}`,
      };
    }

    const data = await response.json();

    if (!data || data.length === 0) {
      return {
        success: false,
        error: "Address not found in geocoding database",
      };
    }

    const result = data[0];
    const lat = parseFloat(result.lat);
    const lon = parseFloat(result.lon);

    return {
      success: true,
      data: {
        lat,
        lon,
        formatted_address: fullAddress,
        display_name: result.display_name,
      },
    };
  } catch (error) {
    console.error('Geocoding error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { address, city, state, zip, mock = false } = body;

    if (!address || !city || !state) {
      return NextResponse.json(
        { error: "address, city, and state are required" },
        { status: 400 }
      );
    }

    // Mock mode for testing
    if (mock) {
      // Generate deterministic mock coordinates based on city name
      const cityHash = city.split('').reduce((a: number, c: string) => a + c.charCodeAt(0), 0);
      const lat = 35 + (cityHash % 10) / 100;
      const lon = -80 - (cityHash % 20) / 100;

      return NextResponse.json({
        success: true,
        data: {
          lat,
          lon,
          formatted_address: `${address}, ${city}, ${state} ${zip || ''}`,
          display_name: `${address}, ${city}, ${state} ${zip || ''}, USA`,
        },
        timestamp: new Date().toISOString(),
        source: "Mock",
      });
    }

    // Real geocoding
    const result = await geocodeAddress(address, city, state, zip);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error, success: false },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result.data,
      timestamp: new Date().toISOString(),
      source: "OpenStreetMap Nominatim",
    });
  } catch (error) {
    console.error("Geocoding error:", error);
    return NextResponse.json(
      { error: "Failed to geocode address", success: false },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const address = searchParams.get('address');
  const city = searchParams.get('city');
  const state = searchParams.get('state');
  const zip = searchParams.get('zip');
  const mock = searchParams.get('mock') === 'true';

  if (!address || !city || !state) {
    return NextResponse.json(
      { error: "address, city, and state query parameters are required" },
      { status: 400 }
    );
  }

  // Reuse POST logic
  const body = {
    address,
    city,
    state,
    zip,
    mock,
  };

  const mockRequest = {
    json: async () => body,
  } as unknown as NextRequest;

  return POST(mockRequest);
}
