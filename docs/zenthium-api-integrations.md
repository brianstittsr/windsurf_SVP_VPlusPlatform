# Zenthium External API Integrations

## Overview
The Zenthium platform integrates with external real estate and utility APIs to validate property details, power availability, and water access automatically.

---

## API Endpoints

### 1. Real Estate Validation
**`POST /api/zenthium/integrations/real-estate`**

Validates property details using multiple real estate data providers.

#### Integrated APIs:
- **Google Geocoding API** - Address verification and coordinates
- **Zillow API** - Property data and attributes
- **Attom Data Solutions** - Property attributes and zoning
- **CoreLogic API** - Property records and ownership

#### Request:
```json
{
  "address": "123 Industrial Blvd",
  "city": "Charlotte",
  "state": "NC",
  "zip": "28202",
  "propertyType": "Industrial"
}
```

#### Response:
```json
{
  "success": true,
  "validated": true,
  "confidenceScore": 85,
  "propertyExists": true,
  "addressVerified": true,
  "zoningVerified": true,
  "sizeVerified": true,
  "propertyDetails": {
    "formattedAddress": "123 Industrial Blvd, Charlotte, NC 28202",
    "coordinates": {
      "lat": 35.2271,
      "lng": -80.8431
    },
    "zpid": "12345678",
    "propertyType": "Commercial",
    "squareFootage": 15000,
    "lotSize": 2.5,
    "yearBuilt": 2010,
    "zoning": "M-2 (Heavy Industrial)",
    "attomId": "ATT-12345",
    "landUse": "Industrial",
    "buildingArea": 15000,
    "stories": 1
  },
  "errors": [],
  "warnings": ["Zillow API unavailable - using submitted data"],
  "timestamp": "2026-05-11T17:48:00.000Z"
}
```

---

### 2. Utilities Validation
**`POST /api/zenthium/integrations/utilities`**

Validates power and water availability using utility company APIs.

#### Integrated APIs:
- **EIA (Energy Information Administration)** - Grid capacity
- **Utility Company APIs** (Duke Energy, PG&E, etc.) - Power availability
- **Water District APIs** - Water access and quality
- **EPA Water Quality Database** - Water quality assessment

#### Request:
```json
{
  "address": "123 Industrial Blvd",
  "city": "Charlotte",
  "state": "NC",
  "zip": "28202",
  "coordinates": {
    "lat": 35.2271,
    "lng": -80.8431
  }
}
```

#### Response:
```json
{
  "success": true,
  "validated": true,
  "power": {
    "available": true,
    "capacityMW": 25,
    "utilityProvider": "Duke Energy",
    "gridConnection": "Three-phase 480V",
    "voltage": "480V",
    "verified": true,
    "estimatedCost": 150000,
    "confidence": 90,
    "meetsRequirements": true
  },
  "water": {
    "available": true,
    "source": "Municipal Water Supply",
    "provider": "Charlotte Water",
    "quality": "Excellent",
    "pressure": "60 PSI",
    "verified": true,
    "flowRate": 500,
    "confidence": 85,
    "meetsRequirements": true
  },
  "errors": [],
  "warnings": [],
  "timestamp": "2026-05-11T17:48:00.000Z"
}
```

---

### 3. Comprehensive Validation
**`POST /api/zenthium/integrations/validate-all`**

Orchestrates all validations: real estate, utilities, and Zenthium requirements.

#### Request:
```json
{
  "address": "123 Industrial Blvd",
  "city": "Charlotte",
  "state": "NC",
  "zip": "28202",
  "propertyType": "Industrial",
  "squareFootage": 15000,
  "ceilingHeightFt": 20,
  "isSingleStory": true,
  "isFloor": true,
  "powerAvailableMW": 25,
  "waterAvailable": true
}
```

#### Response:
```json
{
  "success": true,
  "validated": true,
  "qualified": true,
  "overallScore": 88,
  "realEstate": {
    "confidenceScore": 85,
    "propertyExists": true,
    "addressVerified": true
  },
  "utilities": {
    "power": {
      "capacityMW": 25,
      "confidence": 90,
      "meetsRequirements": true
    },
    "water": {
      "available": true,
      "confidence": 85,
      "meetsRequirements": true
    }
  },
  "zenthiumRequirements": {
    "qualifies": true,
    "score": 100,
    "passedCount": 6,
    "totalRequirements": 6
  },
  "discrepancies": [],
  "recommendations": [],
  "summary": {
    "propertyVerified": true,
    "powerVerified": true,
    "waterVerified": true,
    "requirementsMet": 6,
    "totalRequirements": 6
  },
  "timestamp": "2026-05-11T17:48:00.000Z"
}
```

---

### 4. Integration Status
**`GET /api/zenthium/integrations/real-estate/status`**
**`GET /api/zenthium/integrations/utilities/status`**

Check which API integrations are configured and active.

#### Response:
```json
{
  "integrations": {
    "googleGeocoding": {
      "name": "Google Geocoding API",
      "configured": true,
      "purpose": "Address verification and geocoding",
      "status": "active"
    },
    "zillow": {
      "name": "Zillow API",
      "configured": false,
      "purpose": "Property data and valuation",
      "status": "mock mode"
    }
  },
  "summary": {
    "total": 4,
    "configured": 1,
    "active": 1
  }
}
```

---

## Environment Variables

Add these to your `.env.local` file:

```bash
# Real Estate APIs
GOOGLE_MAPS_API_KEY=your_google_api_key
ZILLOW_API_KEY=your_zillow_api_key
ATTOM_API_KEY=your_attom_api_key
CORELOGIC_API_KEY=your_corelogic_api_key

# Utility APIs
EIA_API_KEY=your_eia_api_key
WATER_DISTRICT_API_KEY=your_water_district_key
EPA_API_KEY=your_epa_api_key

# Utility Company APIs
DUKE_ENERGY_API_KEY=your_duke_energy_key
PGE_API_KEY=your_pge_api_key
```

---

## Mock Mode

If API keys are not configured, the system runs in **mock mode** with realistic sample data:

- ✅ All endpoints still work
- ✅ Returns realistic validation data
- ⚠️ Data is not verified against real sources
- ⚠️ `mock: true` flag in responses

---

## Discrepancy Detection

The system automatically detects discrepancies between submitted data and verified data:

```json
{
  "discrepancies": [
    {
      "field": "squareFootage",
      "submitted": 20000,
      "verified": 15000,
      "difference": 5000,
      "percentDifference": "33.3",
      "severity": "high",
      "message": "Submitted square footage differs from verified data by 33.3%"
    }
  ]
}
```

**Severity Levels:**
- **High** - >25% difference or conflicting boolean values
- **Medium** - 10-25% difference
- **Low** - <10% difference

---

## Recommendations Engine

The system generates actionable recommendations:

```json
{
  "recommendations": [
    "⚡ Current power capacity (15 MW) is below the 20 MW requirement. Consider infrastructure upgrades.",
    "💧 Water access not verified. Contact local water district.",
    "🔍 2 high-severity discrepancies found. Review submitted data.",
    "🏭 Property zoning may not be suitable for data center operations."
  ]
}
```

---

## Usage Examples

### Example 1: Validate Property Before Submission
```typescript
const validateProperty = async (formData) => {
  const response = await fetch('/api/zenthium/integrations/validate-all', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(formData),
  });

  const result = await response.json();
  
  if (result.discrepancies.length > 0) {
    console.warn('Discrepancies found:', result.discrepancies);
  }
  
  if (result.recommendations.length > 0) {
    console.info('Recommendations:', result.recommendations);
  }
  
  return result;
};
```

### Example 2: Check Real Estate Data Only
```typescript
const checkProperty = async (address) => {
  const response = await fetch('/api/zenthium/integrations/real-estate', {
    method: 'POST',
    body: JSON.stringify(address),
  });

  const result = await response.json();
  
  console.log(`Property verified: ${result.addressVerified}`);
  console.log(`Confidence: ${result.confidenceScore}%`);
  
  return result;
};
```

### Example 3: Validate Utilities
```typescript
const checkUtilities = async (location) => {
  const response = await fetch('/api/zenthium/integrations/utilities', {
    method: 'POST',
    body: JSON.stringify(location),
  });

  const result = await response.json();
  
  console.log(`Power: ${result.power.capacityMW} MW`);
  console.log(`Water: ${result.water.available ? 'Available' : 'Not Available'}`);
  
  return result;
};
```

---

## API Provider Setup

### Google Geocoding API
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Enable Geocoding API
3. Create API key
4. Add to `.env.local` as `GOOGLE_MAPS_API_KEY`

### Attom Data Solutions
1. Sign up at [Attom Data](https://www.attomdata.com/)
2. Get API key from dashboard
3. Add to `.env.local` as `ATTOM_API_KEY`

### EIA (Energy Information Administration)
1. Register at [EIA](https://www.eia.gov/opendata/)
2. Get free API key
3. Add to `.env.local` as `EIA_API_KEY`

---

## Confidence Scoring

### Real Estate Confidence (0-100):
- Address verified: 30 points
- Property exists: 30 points
- Zoning verified: 20 points
- Size verified: 20 points

### Power Confidence (0-100):
- Verified by utility: 40 points
- Capacity data available: 30 points
- Provider identified: 20 points
- Grid connection info: 10 points

### Water Confidence (0-100):
- Verified by district: 40 points
- Availability confirmed: 30 points
- Provider identified: 20 points
- Quality data: 10 points

### Overall Score (0-100):
- Real estate validation: 30%
- Utilities validation: 30%
- Zenthium requirements: 40%

---

## Error Handling

All endpoints return consistent error responses:

```json
{
  "error": "Error message",
  "status": 400 | 404 | 500
}
```

Partial failures are handled gracefully with warnings:

```json
{
  "success": true,
  "warnings": [
    "Zillow API unavailable - using submitted data",
    "EPA water quality data unavailable"
  ]
}
```
