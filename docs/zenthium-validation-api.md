# Zenthium Validation API Documentation

## Overview
The Zenthium Validation API provides endpoints to validate property submissions against the 6 critical requirements for data center operations.

## The 6 Critical Requirements

| Requirement | Minimum | Unit | Weight | Category |
|------------|---------|------|--------|----------|
| **Power Capacity** | 20 | MW | 25% | Infrastructure |
| **Property Size** | 10,000 | sq ft | 20% | Physical |
| **Ceiling Height** | 18 | ft | 15% | Physical |
| **Water Access** | Yes | boolean | 20% | Infrastructure |
| **Single Story** | Yes | boolean | 10% | Physical |
| **Flat Floor** | Yes | boolean | 10% | Physical |

**Qualification Criteria:** Property must pass at least **4 out of 6** requirements to qualify.

---

## API Endpoints

### 1. Validate Property Data
**POST** `/api/zenthium/validate`

Validates raw property data against requirements.

#### Request Body:
```json
{
  "powerAvailableMW": 25,
  "squareFootage": 15000,
  "ceilingHeightFt": 20,
  "waterAvailable": true,
  "isSingleStory": true,
  "isFloor": true
}
```

#### Response:
```json
{
  "qualifies": true,
  "score": 100,
  "passedCount": 6,
  "failedCount": 0,
  "totalRequirements": 6,
  "requirements": [
    {
      "id": "power",
      "name": "Power Capacity",
      "description": "Minimum 20 MW power capacity required",
      "required": 20,
      "actual": 25,
      "unit": "MW",
      "passes": true,
      "critical": true,
      "weight": 25
    }
    // ... other requirements
  ],
  "feedback": {
    "overall": "Property meets minimum Zenthium requirements",
    "passed": [
      {
        "requirement": "Power Capacity",
        "message": "✓ Power Capacity: 25 MW (Required: 20 MW)"
      }
    ],
    "failed": []
  },
  "timestamp": "2026-05-11T17:30:00.000Z"
}
```

---

### 2. Get Requirements List
**GET** `/api/zenthium/validate/requirements`

Returns the complete list of Zenthium requirements.

#### Response:
```json
{
  "requirements": [
    {
      "id": "power",
      "name": "Power Capacity",
      "description": "Minimum 20 MW power capacity for data center operations",
      "minimum": 20,
      "unit": "MW",
      "critical": true,
      "category": "Infrastructure"
    }
    // ... other requirements
  ],
  "totalCount": 6,
  "criticalCount": 6,
  "categories": ["Infrastructure", "Physical"]
}
```

---

### 3. Validate Submission by ID
**GET** `/api/zenthium/validate/{id}`

Validates a specific submission and updates its validation status in the database.

#### URL Parameters:
- `id` - Submission ID

#### Response:
```json
{
  "submissionId": "abc123",
  "propertyName": "Industrial Park Site",
  "qualifies": true,
  "score": 85,
  "passedCount": 5,
  "failedCount": 1,
  "totalRequirements": 6,
  "requirements": [...],
  "feedback": {
    "overall": "✓ Property meets minimum Zenthium requirements",
    "summary": "Passed 5 of 6 critical requirements",
    "passed": [
      {
        "requirement": "Power Capacity",
        "value": "25 MW"
      }
    ],
    "failed": [
      {
        "requirement": "Ceiling Height",
        "value": "15 ft",
        "needed": "18 ft",
        "gap": "3 ft short"
      }
    ]
  },
  "validatedAt": "2026-05-11T17:30:00.000Z"
}
```

#### Database Updates:
The submission document is updated with:
- `validationScore` - Score (0-100)
- `validationQualifies` - Boolean
- `validationPassedCount` - Number of passed requirements
- `validationFailedCount` - Number of failed requirements
- `validationLastRun` - Timestamp

---

### 4. Batch Validate Submissions
**POST** `/api/zenthium/validate/batch`

Validates multiple submissions at once.

#### Request Body:
```json
{
  "submissionIds": ["abc123", "def456", "ghi789"]
}
```

#### Response:
```json
{
  "results": [
    {
      "submissionId": "abc123",
      "propertyName": "Industrial Park Site",
      "qualifies": true,
      "score": 85,
      "passedCount": 5,
      "failedCount": 1,
      "success": true
    },
    {
      "submissionId": "def456",
      "error": "Submission not found",
      "success": false
    }
  ],
  "summary": {
    "total": 3,
    "successful": 2,
    "failed": 1,
    "qualified": 1,
    "notQualified": 1
  },
  "timestamp": "2026-05-11T17:30:00.000Z"
}
```

---

### 5. Validate All Submissions
**GET** `/api/zenthium/validate/batch/all`

Validates all submissions in the database.

#### Response:
```json
{
  "results": [
    {
      "submissionId": "abc123",
      "propertyName": "Industrial Park Site",
      "qualifies": true,
      "score": 85,
      "passedCount": 5
    }
    // ... all submissions
  ],
  "summary": {
    "total": 10,
    "successful": 10,
    "failed": 0,
    "qualified": 7,
    "notQualified": 3
  },
  "timestamp": "2026-05-11T17:30:00.000Z"
}
```

---

## Usage Examples

### Example 1: Validate Before Submission
```typescript
const validateProperty = async (formData) => {
  const response = await fetch('/api/zenthium/validate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      powerAvailableMW: formData.powerAvailableMW,
      squareFootage: formData.squareFootage,
      ceilingHeightFt: formData.ceilingHeightFt,
      waterAvailable: formData.waterAvailable,
      isSingleStory: formData.isSingleStory,
      isFloor: formData.isFloor,
    }),
  });

  const result = await response.json();
  
  if (result.qualifies) {
    console.log(`✓ Property qualifies with score: ${result.score}/100`);
  } else {
    console.log(`✗ Property does not qualify`);
    console.log('Failed requirements:', result.feedback.failed);
  }
  
  return result;
};
```

### Example 2: Re-validate Existing Submission
```typescript
const revalidateSubmission = async (submissionId) => {
  const response = await fetch(`/api/zenthium/validate/${submissionId}`);
  const result = await response.json();
  
  console.log(`Validation Score: ${result.score}/100`);
  console.log(`Qualifies: ${result.qualifies ? 'Yes' : 'No'}`);
  console.log(`Passed: ${result.passedCount}/${result.totalRequirements}`);
  
  return result;
};
```

### Example 3: Batch Validation
```typescript
const validateMultiple = async (submissionIds) => {
  const response = await fetch('/api/zenthium/validate/batch', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ submissionIds }),
  });

  const result = await response.json();
  
  console.log(`Validated ${result.summary.successful} of ${result.summary.total} submissions`);
  console.log(`Qualified: ${result.summary.qualified}`);
  console.log(`Not Qualified: ${result.summary.notQualified}`);
  
  return result;
};
```

### Example 4: Get Requirements
```typescript
const getRequirements = async () => {
  const response = await fetch('/api/zenthium/validate/requirements');
  const result = await response.json();
  
  result.requirements.forEach(req => {
    console.log(`${req.name}: ${req.minimum} ${req.unit} (${req.category})`);
  });
  
  return result;
};
```

---

## Scoring System

The validation score is calculated using a weighted system:

```
Score = (Sum of Passed Requirement Weights / Total Weight) × 100
```

**Weight Distribution:**
- Power Capacity: 25%
- Property Size: 20%
- Water Access: 20%
- Ceiling Height: 15%
- Single Story: 10%
- Flat Floor: 10%

**Total: 100%**

---

## Integration Points

### 1. Form Submission
Add validation before saving:
```typescript
// In submit handler
const validation = await fetch('/api/zenthium/validate', {
  method: 'POST',
  body: JSON.stringify(formData)
});

const result = await validation.json();

// Show user their score
toast.info(`Validation Score: ${result.score}/100`);
```

### 2. Admin Dashboard
Display validation status:
```typescript
// Fetch submission with validation
const submission = await fetch(`/api/zenthium/validate/${id}`);
const data = await submission.json();

// Show badge
<Badge variant={data.qualifies ? "success" : "destructive"}>
  {data.score}/100
</Badge>
```

### 3. Automated Workflows
Run nightly validation:
```typescript
// Cron job or scheduled function
const validateAll = async () => {
  const result = await fetch('/api/zenthium/validate/batch/all');
  const data = await result.json();
  
  // Send report email
  sendReport({
    qualified: data.summary.qualified,
    notQualified: data.summary.notQualified,
  });
};
```

---

## Error Handling

All endpoints return standard error responses:

```json
{
  "error": "Error message",
  "status": 400 | 404 | 500
}
```

**Common Errors:**
- `400` - Invalid request body
- `404` - Submission not found
- `500` - Database or server error
