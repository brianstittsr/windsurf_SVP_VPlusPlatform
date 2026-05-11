import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/zenthium/integrations/opengridworks
 * Queries OpenGridWorks API for power plant data near a location
 * Used to validate power capacity requirements
 */

const OPENGRID_BASE_URL = "https://opengridworks.com/api";

interface OpenGridPowerPlant {
  id: string;
  name: string;
  capacity_mw: number;
  fuel_type: string;
  lat: number;
  lon: number;
  distance_km?: number;
}

interface OpenGridResponse {
  success: boolean;
  data?: OpenGridPowerPlant[];
  error?: string;
}

async function queryOpenGridWorks(
  lat: number,
  lon: number,
  radiusKm: number = 50
): Promise<OpenGridResponse> {
  try {
    // OpenGridWorks API endpoint for power plants
    // Note: Actual endpoint structure may need adjustment based on API docs
    const url = `${OPENGRID_BASE_URL}/power-plants/nearby?lat=${lat}&lon=${lon}&radius=${radiusKm}`;
    
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
      },
      // Add timeout
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      return {
        success: false,
        error: `API returned ${response.status}: ${response.statusText}`,
      };
    }

    const data = await response.json();

    // Calculate distances and filter
    const powerPlants = (data.power_plants || data.data || []).map((plant: any) => {
      const distance = calculateDistance(lat, lon, plant.lat, plant.lon);
      return {
        id: plant.id || plant.plant_id,
        name: plant.name || plant.plant_name,
        capacity_mw: plant.capacity_mw || plant.capacity || 0,
        fuel_type: plant.fuel_type || plant.fuel || 'Unknown',
        lat: plant.lat || plant.latitude,
        lon: plant.lon || plant.longitude,
        distance_km: distance,
      };
    });

    return {
      success: true,
      data: powerPlants,
    };
  } catch (error) {
    console.error('OpenGridWorks API error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// Haversine formula for distance calculation
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { lat, lon, radiusKm = 50, mock = false } = body;

    if (!lat || !lon) {
      return NextResponse.json(
        { error: "lat and lon are required" },
        { status: 400 }
      );
    }

    // Mock mode for testing
    if (mock) {
      const mockPlants: OpenGridPowerPlant[] = [
        {
          id: "mock-1",
          name: "Charlotte Power Station",
          capacity_mw: 150,
          fuel_type: "Natural Gas",
          lat: lat + 0.01,
          lon: lon + 0.01,
          distance_km: 1.4,
        },
        {
          id: "mock-2",
          name: "Solar Farm East",
          capacity_mw: 45,
          fuel_type: "Solar",
          lat: lat - 0.02,
          lon: lon + 0.03,
          distance_km: 3.2,
        },
        {
          id: "mock-3",
          name: "Wind Ridge",
          capacity_mw: 80,
          fuel_type: "Wind",
          lat: lat + 0.05,
          lon: lon - 0.02,
          distance_km: 5.6,
        },
      ];

      const totalCapacity = mockPlants.reduce((sum, p) => sum + p.capacity_mw, 0);
      const maxCapacity = Math.max(...mockPlants.map(p => p.capacity_mw));
      const nearbyCapacity = mockPlants.filter(p => (p.distance_km || 0) <= 10).reduce((sum, p) => sum + p.capacity_mw, 0);

      return NextResponse.json({
        success: true,
        data: {
          power_plants: mockPlants,
          summary: {
            total_capacity_mw: totalCapacity,
            max_single_capacity_mw: maxCapacity,
            nearby_capacity_mw: nearbyCapacity,
            plant_count: mockPlants.length,
            within_10km: mockPlants.filter(p => (p.distance_km || 0) <= 10).length,
          },
          validation: {
            meets_20mw_requirement: maxCapacity >= 20,
            power_capacity_mw: maxCapacity,
            confidence_score: 0.85,
            data_source: "OpenGridWorks (Mock)",
          },
        },
        timestamp: new Date().toISOString(),
      });
    }

    // Real API call
    const result = await queryOpenGridWorks(lat, lon, radiusKm);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error, success: false },
        { status: 500 }
      );
    }

    const powerPlants = result.data || [];
    const totalCapacity = powerPlants.reduce((sum, p) => sum + p.capacity_mw, 0);
    const maxCapacity = powerPlants.length > 0 ? Math.max(...powerPlants.map(p => p.capacity_mw)) : 0;
    const nearbyCapacity = powerPlants.filter(p => (p.distance_km || 0) <= 10).reduce((sum, p) => sum + p.capacity_mw, 0);

    // Calculate confidence based on data quality
    let confidence = 0.5;
    if (powerPlants.length > 0) confidence += 0.2;
    if (nearbyCapacity > 0) confidence += 0.2;
    if (maxCapacity >= 20) confidence += 0.1;

    return NextResponse.json({
      success: true,
      data: {
        power_plants: powerPlants,
        summary: {
          total_capacity_mw: totalCapacity,
          max_single_capacity_mw: maxCapacity,
          nearby_capacity_mw: nearbyCapacity,
          plant_count: powerPlants.length,
          within_10km: powerPlants.filter(p => (p.distance_km || 0) <= 10).length,
        },
        validation: {
          meets_20mw_requirement: maxCapacity >= 20,
          power_capacity_mw: maxCapacity,
          confidence_score: confidence,
          data_source: "OpenGridWorks",
        },
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("OpenGridWorks integration error:", error);
    return NextResponse.json(
      { error: "Failed to query OpenGridWorks API", success: false },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const lat = searchParams.get('lat');
  const lon = searchParams.get('lon');
  const radiusKm = searchParams.get('radiusKm');
  const mock = searchParams.get('mock') === 'true';

  if (!lat || !lon) {
    return NextResponse.json(
      { error: "lat and lon query parameters are required" },
      { status: 400 }
    );
  }

  // Reuse POST logic
  const body = {
    lat: parseFloat(lat),
    lon: parseFloat(lon),
    radiusKm: radiusKm ? parseFloat(radiusKm) : 50,
    mock,
  };

  // Create a mock request object
  const mockRequest = {
    json: async () => body,
  } as unknown as NextRequest;

  return POST(mockRequest);
}
