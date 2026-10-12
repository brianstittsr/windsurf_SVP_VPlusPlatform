# Zenthium Powered Land Intake — Opportunity Management Wizard

## Overview

Build a comprehensive **Powered Land Intake Opportunity Wizard** at `/portal/admin/zenthium-referrals` that manages submitted location referrals through a structured intake form modeled after the Powered Land Intake Form spreadsheet. The system allows admins to:

1. **Create new opportunities** via a multi-step wizard with all intake form fields
2. **Upload a PDF or Word document** to auto-populate the intake form using AI text extraction
3. **Tag each opportunity to a deal owner** (the person responsible for bringing the deal)
4. **Queue and send** the completed Page 1 intake form as an email to `joshua@zenthium.ai` with configurable CC recipients
5. **View and manage** all submitted opportunities from a dashboard

The new system **coexists** with the existing Referral Agreements wizard (tab-based layout) — add a second tab "Opportunities" to the existing `/portal/admin/zenthium-referrals/page.tsx` page.

---

## Architecture

### Route
`/portal/admin/zenthium-referrals` — existing page, add a **"Opportunities"** tab alongside existing "Referral Agreements" tab.

### New Firestore Collection
`COLLECTIONS.ZENTHIUM_OPPORTUNITIES = "zenthiumOpportunities"` — add to `lib/schema.ts`.

### New API Routes
- `GET/POST /api/zenthium/opportunities` — list and create
- `GET/PATCH/DELETE /api/zenthium/opportunities/[id]` — detail, update, delete
- `POST /api/zenthium/opportunities/[id]/send-intake` — send formatted intake email with PDF attachment

### Document Parse API
Reuse `/api/ai/analyze-document` with a **Powered Land Intake extraction prompt**, plus support for `.docx` files via text decoding.

---

## Powered Land Intake Form — Field Schema

Based on the Powered Land Intake Form spreadsheet, the following fields map to **Page 1 (the sendable intake)** and additional pages:

### PAGE 1 — Property & Deal Overview (Sendable)

#### Section 1: Deal Information
| Field | Type | Required |
|---|---|---|
| `dealName` | text | ✓ |
| `dealOwner` | select (from team members) | ✓ |
| `submittedDate` | date | ✓ |
| `dealStage` | select | ✓ |
| `priority` | select: High / Medium / Low | |
| `referralSource` | text | |
| `notes` | textarea | |

Deal Stage options: `New Lead`, `Under Review`, `Site Visit Scheduled`, `Due Diligence`, `LOI Issued`, `Contracted`, `Closed`, `Rejected`

#### Section 2: Property Information
| Field | Type | Required |
|---|---|---|
| `propertyName` | text | ✓ |
| `propertyAddress` | text | ✓ |
| `city` | text | ✓ |
| `state` | text | ✓ |
| `zip` | text | |
| `county` | text | |
| `country` | text | default "US" |
| `parcelNumber` | text | |
| `coordinates` | text | (lat/long) |
| `totalAcreage` | number | |
| `buildableSF` | number | (buildable square footage) |
| `propertyType` | select | ✓ |
| `zoningClassification` | text | |
| `zoningJurisdiction` | text | |
| `floodZone` | select: Yes / No / Unknown | |
| `environmentalStatus` | select: Clear / Phase I / Phase II / Unknown | |

Property Type options: `Vacant / Greenfield Land`, `Powered Shell`, `Vacant Warehouse`, `Industrial Building`, `Existing Data Center`, `Power Plant / Energy Facility`, `Campus / Multi-Building`, `Other`

#### Section 3: Power & Utilities
| Field | Type | Required |
|---|---|---|
| `totalPowerMW` | number | ✓ |
| `availablePowerMW` | number | ✓ |
| `powerVoltage` | text | (e.g. 138kV, 345kV) |
| `utilityProvider` | text | ✓ |
| `substationDistance` | text | (distance to nearest substation) |
| `transmissionLineDistance` | text | |
| `powerType` | select | |
| `hasBackupPower` | boolean | |
| `backupPowerDetails` | text | |
| `naturalGasAvailable` | boolean | |
| `naturalGasProvider` | text | |

Power Type options: `Grid-Connected`, `Behind-the-Meter`, `Renewable`, `Nuclear Adjacent`, `Combined / Hybrid`, `Unknown / TBD`

#### Section 4: Water & Cooling
| Field | Type | Required |
|---|---|---|
| `waterAvailable` | boolean | ✓ |
| `waterSource` | text | (municipal / well / river / lake) |
| `waterProvider` | text | |
| `dailyWaterCapacityGPD` | number | (gallons per day) |
| `sewerAvailable` | boolean | |
| `coolingType` | select | |
| `coolingCapacityMW` | number | |

Cooling Type options: `Air-Cooled`, `Water-Cooled`, `Evaporative`, `Hybrid`, `N/A - Raw Land`

#### Section 5: Fiber & Connectivity
| Field | Type | Required |
|---|---|---|
| `fiberAvailable` | boolean | |
| `fiberProviders` | text | |
| `fiberTypes` | text | (dark fiber, lit fiber, etc.) |
| `networkRedundancy` | boolean | |
| `distanceToMeetMe` | text | (distance to nearest carrier hotel / meet-me room) |

#### Section 6: Structure / Building (if applicable)
| Field | Type | Required |
|---|---|---|
| `hasExistingStructure` | boolean | |
| `buildingSquareFootage` | number | |
| `ceilingHeightFt` | number | |
| `isSingleStory` | boolean | |
| `columnSpacingFt` | text | |
| `floorLoadPSF` | number | (floor load lbs per sq ft) |
| `hvacInstalled` | boolean | |
| `dockDoors` | number | |
| `driveInDoors` | number | |
| `officePercentage` | number | |
| `yearBuilt` | text | |
| `roofType` | text | |
| `constructionType` | text | (tilt-up, masonry, steel frame, etc.) |

#### Section 7: Ownership & Financials
| Field | Type | Required |
|---|---|---|
| `ownershipType` | select | ✓ |
| `ownerName` | text | |
| `ownerEntity` | text | |
| `askingPrice` | text | |
| `pricePerAcre` | text | |
| `leaseRateNNN` | text | |
| `leaseTermYears` | text | |
| `saleOrLease` | select: Sale / Lease / Sale or Lease | |
| `timeline` | text | |
| `isEncumbered` | boolean | |
| `encumbranceDetails` | text | |

Ownership Type options: `Fee Simple`, `Ground Lease`, `Easement`, `Joint Venture`, `Other`

#### Section 8: Point of Contact (Submitter)
| Field | Type | Required |
|---|---|---|
| `pocName` | text | ✓ |
| `pocTitle` | text | |
| `pocCompany` | text | |
| `pocEmail` | email | ✓ |
| `pocPhone` | tel | |
| `pocRelationship` | select: Owner / Broker / Developer / Agent / Other | |

---

## Wizard Steps (6 Steps)

### Step 1 — Deal Info & Deal Owner
- Deal name, deal owner (team member selector), submitted date, deal stage, priority, referral source
- **Deal Owner**: Fetch from `COLLECTIONS.TEAM_MEMBERS` — display name + avatar initials
- Notes field

### Step 2 — Property Details
- Property name, address (street/city/state/zip/county), parcel number, coordinates
- Property type (select), acreage, buildable SF, zoning, flood zone, environmental status

### Step 3 — Power & Utilities
- Total power MW, available power MW, voltage, utility provider
- Substation distance, transmission line distance, power type, backup power
- Natural gas availability

### Step 4 — Water, Cooling & Fiber
- Water availability, source, provider, daily capacity GPD, sewer
- Cooling type, cooling capacity MW
- Fiber availability, providers, types, redundancy, distance to meet-me

### Step 5 — Structure & Financials
- Existing structure toggle (show/hide building fields)
- Building SF, ceiling height, single story, column spacing, floor load, HVAC, dock/drive-in doors, year built, construction type
- Ownership type, owner name/entity, asking price, price per acre, lease rate, sale or lease, timeline, encumbrances

### Step 6 — Contact & Document Upload / Send
- POC name, title, company, email, phone, relationship
- **Document Upload Section**: Upload PDF or Word doc → AI extracts text → populate form fields
- **Send Intake**: Shows completed Page 1 preview, email to field (default `joshua@zenthium.ai`), CC input (comma-separated or tag-style add CC), send button

---

## Document Upload & AI Auto-Population

### Upload Flow
1. User clicks "Upload Document (PDF / Word)" on Step 6 (or any step via top banner)
2. File uploaded via `multipart/form-data` to new API route `POST /api/zenthium/opportunities/parse-document`
3. API extracts text:
   - **PDF**: Read as ArrayBuffer → decode with TextDecoder (covers text-based PDFs)
   - **DOCX**: Read as ArrayBuffer → decode UTF-8, strip XML tags with regex to extract plain text
4. Send extracted text to OpenAI with a **Powered Land Intake extraction prompt**
5. AI returns structured JSON matching the intake field schema
6. Response mapped back to form state — fields auto-populated
7. User reviews pre-filled form, can edit any field before saving/sending

### Parse Document API Route
**`POST /api/zenthium/opportunities/parse-document`**

```typescript
// Accepts multipart/form-data with field "file" (PDF or DOCX)
// Returns: { success, data: Partial<OpportunityFormData>, extractedText, confidence }
```

**OpenAI Extraction Prompt:**
```
You are a real estate data extraction AI. Extract powered land / data center site information from the provided document text and return a JSON object matching these fields exactly. Only populate fields you find in the document — leave others empty string or null.

Return JSON with keys: propertyName, propertyAddress, city, state, zip, county, parcelNumber, coordinates, totalAcreage, buildableSF, propertyType, zoningClassification, totalPowerMW, availablePowerMW, powerVoltage, utilityProvider, powerType, hasBackupPower, waterAvailable, waterSource, waterProvider, dailyWaterCapacityGPD, fiberAvailable, fiberProviders, buildingSquareFootage, ceilingHeightFt, ownershipType, ownerName, ownerEntity, askingPrice, leaseRateNNN, saleOrLease, timeline, pocName, pocTitle, pocCompany, pocEmail, pocPhone
```

---

## Email Send — Intake Form

### Send Intake API Route
**`POST /api/zenthium/opportunities/[id]/send-intake`**

**Request body:**
```typescript
{
  to: "joshua@zenthium.ai",        // always default, editable
  cc: string[],                    // array of email addresses
  subject: string,                 // auto-generated, editable
  message: string,                 // optional cover note
  includeAttachment: boolean,      // attach formatted intake as plain text
}
```

**Email behavior:**
- Default `to`: `joshua@zenthium.ai`
- Subject auto-populated: `"Powered Land Intake — [propertyName] — [city, state]"`
- Body: Formatted HTML summary of Page 1 fields (deal info, property, power, contact)
- Attachment: Plain text `.txt` file of the full intake form, base64 encoded
- Uses existing email pattern (console.log for dev; integrate with Resend/SendGrid in prod via `RESEND_API_KEY` or `SENDGRID_API_KEY` env var)
- On success: update opportunity `status` to `"sent"` and store `sentAt` timestamp + `sentTo` array

**CC field UI:**
- Tag-style input: type email + press Enter/comma to add a tag
- Show removable email chips
- Validate email format on add

---

## Opportunity Status Flow

```
New Lead → Under Review → Site Visit Scheduled → Due Diligence → LOI Issued → Contracted → Closed
                                                                                         ↘ Rejected
```

Status is updated manually via the detail view or automatically:
- Created → `"New Lead"`
- Intake sent → `"sent"` flag added (status stays as user-selected deal stage)
- `intakeSentAt` timestamp stored separately from `dealStage`

---

## Dashboard (Opportunities Tab)

### Stats Row (4 cards)
- **Total Opportunities** — count of all
- **Active Deals** — count where dealStage not in [Closed, Rejected]
- **Intake Sent** — count where intakeSentAt is set
- **Total Power MW** — sum of availablePowerMW across all opportunities

### Filter Bar
- Search (property name, deal owner, city)
- Filter by Deal Stage (select)
- Filter by Priority (select)
- Filter by Deal Owner (select from team members)

### Opportunities Table
Columns: Property Name | Location | Power (MW) | Deal Owner | Stage | Priority | Intake Sent | Created | Actions

Actions per row:
- **View/Edit** → opens edit wizard dialog
- **Send Intake** → opens send dialog directly (skip to Step 6 send panel)
- **Delete** → confirm dialog

### Deal Owner Display
- Show avatar circle with initials + name
- Color coded by first letter of name

---

## TypeScript Interfaces

```typescript
// lib/types/zenthium-opportunity.ts (new file)

interface DealOwner {
  id: string;
  name: string;
  email: string;
}

interface OpportunityFormData {
  // Deal Info
  dealName: string;
  dealOwnerId: string;
  dealOwnerName: string;
  dealOwnerEmail: string;
  submittedDate: string;
  dealStage: "New Lead" | "Under Review" | "Site Visit Scheduled" | "Due Diligence" | "LOI Issued" | "Contracted" | "Closed" | "Rejected";
  priority: "High" | "Medium" | "Low" | "";
  referralSource: string;
  notes: string;

  // Property
  propertyName: string;
  propertyAddress: string;
  city: string;
  state: string;
  zip: string;
  county: string;
  country: string;
  parcelNumber: string;
  coordinates: string;
  totalAcreage: string;
  buildableSF: string;
  propertyType: string;
  zoningClassification: string;
  zoningJurisdiction: string;
  floodZone: "Yes" | "No" | "Unknown" | "";
  environmentalStatus: "Clear" | "Phase I" | "Phase II" | "Unknown" | "";

  // Power
  totalPowerMW: string;
  availablePowerMW: string;
  powerVoltage: string;
  utilityProvider: string;
  substationDistance: string;
  transmissionLineDistance: string;
  powerType: string;
  hasBackupPower: boolean;
  backupPowerDetails: string;
  naturalGasAvailable: boolean;
  naturalGasProvider: string;

  // Water & Cooling
  waterAvailable: boolean;
  waterSource: string;
  waterProvider: string;
  dailyWaterCapacityGPD: string;
  sewerAvailable: boolean;
  coolingType: string;
  coolingCapacityMW: string;

  // Fiber
  fiberAvailable: boolean;
  fiberProviders: string;
  fiberTypes: string;
  networkRedundancy: boolean;
  distanceToMeetMe: string;

  // Structure
  hasExistingStructure: boolean;
  buildingSquareFootage: string;
  ceilingHeightFt: string;
  isSingleStory: boolean;
  columnSpacingFt: string;
  floorLoadPSF: string;
  hvacInstalled: boolean;
  dockDoors: string;
  driveInDoors: string;
  officePercentage: string;
  yearBuilt: string;
  roofType: string;
  constructionType: string;

  // Financials
  ownershipType: string;
  ownerName: string;
  ownerEntity: string;
  askingPrice: string;
  pricePerAcre: string;
  leaseRateNNN: string;
  leaseTermYears: string;
  saleOrLease: "Sale" | "Lease" | "Sale or Lease" | "";
  timeline: string;
  isEncumbered: boolean;
  encumbranceDetails: string;

  // POC
  pocName: string;
  pocTitle: string;
  pocCompany: string;
  pocEmail: string;
  pocPhone: string;
  pocRelationship: string;
}

interface ZenthiumOpportunity extends OpportunityFormData {
  id: string;
  status: "draft" | "active" | "sent" | "closed";
  intakeSentAt?: string | null;
  intakeSentTo?: string[];
  intakeSentCC?: string[];
  createdAt: string;
  updatedAt: string;
}
```

---

## Firestore Schema

**Collection:** `zenthiumOpportunities`

```
{
  ...OpportunityFormData fields,
  status: "draft" | "active" | "sent" | "closed",
  intakeSentAt: Timestamp | null,
  intakeSentTo: string[],
  intakeSentCC: string[],
  createdAt: Timestamp,
  updatedAt: Timestamp,
}
```

Add to `lib/schema.ts`:
```typescript
ZENTHIUM_OPPORTUNITIES: "zenthiumOpportunities",
```

---

## Files to Create / Modify

### New Files
1. **`lib/types/zenthium-opportunity.ts`** — TypeScript interfaces
2. **`app/api/zenthium/opportunities/route.ts`** — GET (list) + POST (create)
3. **`app/api/zenthium/opportunities/[id]/route.ts`** — GET / PATCH / DELETE (async params)
4. **`app/api/zenthium/opportunities/[id]/send-intake/route.ts`** — POST (send email)
5. **`app/api/zenthium/opportunities/parse-document/route.ts`** — POST (AI doc → form fields)

### Modified Files
6. **`lib/schema.ts`** — Add `ZENTHIUM_OPPORTUNITIES` to `COLLECTIONS`
7. **`app/(portal)/portal/admin/zenthium-referrals/page.tsx`** — Add "Opportunities" tab with full wizard + dashboard

---

## Implementation Notes

### Page Structure
The existing page uses a plain `<Dialog>` for the Referral Agreements wizard. For Opportunities, use the same pattern:
- Top-level tabs: `"agreements"` | `"opportunities"` (Button-based tab row, same style as existing proposals page)
- When `activeTab === "opportunities"`: render OpportunitiesTab component (can be a large inline section or extracted component)
- OpportunitiesTab contains: stats row, filter bar, table, + wizard Dialog

### Document Upload UX
- Upload banner/button visible on Step 1 header: "Import from Document" 
- On upload: show loading spinner with "Extracting data..." message
- On success: show green toast "Document parsed — X fields populated"
- Fields populated by AI are shown with a subtle yellow highlight / "AI filled" indicator that clears on user edit
- User can always override any AI-filled field

### Send Intake Preview
On Step 6 before sending, show a formatted preview card of "Page 1" content:
```
ZENTHIUM POWERED LAND INTAKE FORM
==================================
Deal: [dealName]
Deal Owner: [dealOwnerName]
Date: [submittedDate]
Stage: [dealStage]
Priority: [priority]

PROPERTY
--------
[propertyName]
[propertyAddress], [city], [state] [zip]
Type: [propertyType]  |  Acreage: [totalAcreage]  |  Buildable SF: [buildableSF]
Zoning: [zoningClassification]

POWER
-----
Total: [totalPowerMW] MW  |  Available: [availablePowerMW] MW
Voltage: [powerVoltage]  |  Utility: [utilityProvider]

WATER & CONNECTIVITY
--------------------
Water: [waterAvailable ? waterSource : "N/A"]  |  Fiber: [fiberAvailable ? fiberProviders : "N/A"]

CONTACT
-------
[pocName], [pocTitle]
[pocCompany]
[pocEmail]  |  [pocPhone]
```

### Email Send Implementation
```typescript
// /api/zenthium/opportunities/[id]/send-intake/route.ts
// Use Resend if RESEND_API_KEY is set, otherwise log to console

const RESEND_API_KEY = process.env.RESEND_API_KEY;

if (RESEND_API_KEY) {
  // POST to https://api.resend.com/emails
  await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: "Zenthium Platform <noreply@strategicvalueplus.com>",
      to: [toEmail],
      cc: ccEmails,
      subject,
      html: buildIntakeEmailHTML(opportunity),
      attachments: [{ filename: `${opportunity.propertyName}_Intake.txt`, content: base64IntakeText }],
    }),
  });
} else {
  console.log("[Zenthium] INTAKE EMAIL (no RESEND_API_KEY):", { to, cc, subject });
}
```

### Deal Owner Selector
- Fetch from `GET /api/team-members` or query `COLLECTIONS.TEAM_MEMBERS` directly
- If no team members exist, fallback to free-text input
- Show avatar circle (initials) + name in selector dropdown
- Selected owner displayed in table with colored avatar chip

### Validation per Step
- Step 1: `dealName` required, `dealOwnerId` required
- Step 2: `propertyName` required, `propertyAddress` required, `city` required, `state` required
- Step 3: `totalPowerMW` required, `availablePowerMW` required, `utilityProvider` required
- Step 4–5: Optional (can proceed)
- Step 6: `pocName` required, `pocEmail` required (for send)

### Tab with "New" Badge
Update the Opportunities tab button to show badge:
```tsx
<Button variant={activeTab === "opportunities" ? "default" : "ghost"} onClick={() => setActiveTab("opportunities")}>
  <Building className="mr-2 h-4 w-4" />
  Opportunities
  {opportunities.filter(o => !o.intakeSentAt).length > 0 && (
    <Badge className="ml-2 bg-amber-500">{opportunities.filter(o => !o.intakeSentAt).length}</Badge>
  )}
</Button>
```

---

## Build Constraints
- All `[id]` route handlers must use `{ params: Promise<{ id: string }> }` with `await params` (Next.js 15)
- Use `"use client"` for all wizard pages
- No new npm packages — use existing: `sonner` (toast), `lucide-react` (icons), `shadcn/ui` components
- `cn()` from `@/lib/utils` for conditional classes
- All `async/await` with proper error boundaries and `try/catch`
- TypeScript strict mode — no `any` except where necessary for Firestore `doc.data()`

---

## Testing Checklist
- [ ] Create new opportunity, assign deal owner
- [ ] Upload PDF → fields auto-populate
- [ ] Upload DOCX → fields auto-populate  
- [ ] Step validation prevents proceeding without required fields
- [ ] AI-filled fields show highlight indicator
- [ ] Send intake: default to `joshua@zenthium.ai`, add CC tags, send
- [ ] Email logged to console when no API key configured
- [ ] Opportunity status updates after send
- [ ] Table filters work (stage, priority, owner)
- [ ] Edit existing opportunity (re-open wizard with data)
- [ ] Delete opportunity
- [ ] Build passes with no TypeScript errors
