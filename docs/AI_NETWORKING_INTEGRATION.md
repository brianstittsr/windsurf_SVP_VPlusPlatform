# AI Networking Integration Documentation

## Overview

The Strategic Value Plus platform includes AI-powered networking features that help affiliates discover valuable connections, enhance meeting summaries, and maintain active engagement.

---

## AI-Powered Features

### 1. **AI Networking Recommendations**

**Endpoint:** `POST /api/ai/networking/recommendations`

**Purpose:** Generate personalized networking match recommendations using AI analysis of profiles, goals, and complementary needs.

**Request:**
```json
{
  "affiliateId": "user123",
  "limit": 5,
  "includeUnlikely": true
}
```

**Response:**
```json
{
  "recommendations": [
    {
      "id": "partner123",
      "name": "Sarah Johnson",
      "company": "TechManufacturing Inc",
      "title": "VP of Operations",
      "matchScore": 95,
      "matchType": "high-value",
      "matchReason": "Highly complementary business goals and shared target markets",
      "complementaryGoals": ["Looking for supply chain partners"],
      "sharedIndustries": ["Manufacturing", "Technology"],
      "potentialSynergies": [
        "Your automation expertise matches their needs",
        "They serve your target customer base",
        "Geographic overlap in Midwest region"
      ],
      "aiInsight": "Sarah is actively seeking automation solutions...",
      "talkingPoints": [
        "What types of clients are you looking to connect with?",
        "What challenges are you seeing in your industry?"
      ]
    }
  ],
  "totalMatches": 5,
  "generatedAt": "2024-12-29T12:00:00Z"
}
```

**Match Types:**
- `high-value` (80-100): Strong alignment across multiple factors
- `complementary` (60-79): Good fit with complementary services
- `unlikely` (40-59): Different industries but hidden potential
- `strategic` (<40): Long-term partnership opportunities

**Scoring Algorithm:**
- Shared industries: 0-25 points
- Complementary goals: 0-20 points
- Geographic overlap: 0-15 points
- Activity level: 0-15 points
- Meeting frequency compatibility: 0-10 points
- Communication preference: 0-10 points
- Expertise diversity bonus: 0-5 points

---

### 2. **AI Meeting Summary Enhancement**

**Endpoint:** `POST /api/ai/networking/enhance-summary`

**Purpose:** Transform rough meeting notes into structured summaries with extracted action items, topics, and referral opportunities.

**Request:**
```json
{
  "rawNotes": "Met with John from ABC Corp. Discussed their need for quality management. They're looking for ISO certification. I can introduce them to Sarah for automation. Follow up next week.",
  "attendeeName": "John Smith",
  "meetingContext": {
    "userIndustry": "Manufacturing Consulting",
    "userGoals": "Generate referrals",
    "partnerIndustry": "Manufacturing"
  }
}
```

**Response:**
```json
{
  "summary": "Had a productive meeting with John Smith from ABC Corp. We discussed their current quality management challenges and identified a strong need for ISO certification services. I committed to introducing them to Sarah for automation consulting, and we agreed to follow up next week to review progress.",
  "topics": [
    "Quality management systems",
    "ISO certification needs",
    "Automation consulting opportunities",
    "Mutual referral opportunities"
  ],
  "actionItems": [
    "Send introduction email to Sarah for automation consulting",
    "Share SVP's ISO certification case studies with John",
    "Schedule follow-up meeting for next week"
  ],
  "referrals": [
    "Potential SVP referral: ISO certification for ABC Corp facility",
    "Affiliate referral: Connect John with Sarah for automation consulting"
  ],
  "enhancedAt": "2024-12-29T12:00:00Z"
}
```

**AI Processing:**
1. **Summary Generation:** Creates 3-4 sentence professional summary
2. **Topic Extraction:** Identifies 3-5 main discussion points
3. **Action Item Extraction:** Pulls out specific commitments and tasks
4. **Referral Identification:** Detects both affiliate and SVP referral opportunities

---

### 3. **Low Activity Detection**

**Endpoint:** `POST /api/ai/networking/detect-low-activity`

**Purpose:** Automatically detect affiliates with low networking activity and generate personalized alerts.

**Response:**
```json
{
  "alertsGenerated": 12,
  "alerts": [
    {
      "id": "alert123",
      "affiliateId": "user456",
      "affiliateName": "Michael Chen",
      "type": "low-activity",
      "priority": "high",
      "title": "Networking Activity Below Average",
      "message": "No meetings in the past 21 days",
      "recommendation": "Schedule 2-3 meetings this week to maintain momentum",
      "suggestedAction": "View AI-recommended matches and schedule a meeting",
      "status": "active",
      "createdAt": "2024-12-29T12:00:00Z",
      "expiresAt": "2025-01-05T12:00:00Z"
    }
  ],
  "summary": {
    "lowActivity": 8,
    "streakRisk": 3,
    "missedOpportunity": 1
  }
}
```

**Alert Types:**
- `low-activity`: No meetings in 14+ days
- `streak-risk`: Weekly streak about to break (within 2 days)
- `missed-opportunity`: New affiliate with no meetings yet
- `follow-up`: Pending follow-ups not completed

**GET Endpoint:** `GET /api/ai/networking/detect-low-activity?affiliateId=user123`
- Fetches active alerts for a specific affiliate

---

## Firebase Schema

### Collections

#### `networkingProfiles`
Stores detailed networking preferences from setup form.

```typescript
{
  id: string;
  affiliateId: string;
  businessType: "manufacturer" | "distributor" | "service-provider" | ...;
  industry: string[];
  targetCustomers: string;
  servicesOffered: string;
  geographicFocus: string[];
  networkingGoals: string[];
  expertise: string[];
  lookingFor: string[];
  canProvide: string[];
  meetingFrequency: "weekly" | "biweekly" | "monthly" | "flexible";
  availableDays: string[];
  timePreference: string;
  communicationPreference: "in-person" | "virtual" | "hybrid";
  isComplete: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

#### `onboardingProgress`
Tracks affiliate onboarding completion.

```typescript
{
  id: string;
  affiliateId: string;
  steps: {
    register: { completed: boolean; completedAt?: Timestamp };
    profile: { completed: boolean; completedAt?: Timestamp };
    networkingForm: { completed: boolean; completedAt?: Timestamp };
    firstMeeting: { completed: boolean; completedAt?: Timestamp };
    meetingSummary: { completed: boolean; completedAt?: Timestamp };
  };
  completionPercentage: number;
  isFullyOnboarded: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

#### `meetingSummaries`
Enhanced meeting summaries with AI-generated content.

```typescript
{
  id: string;
  meetingId: string;
  attendee: string;
  meetingDate: Timestamp;
  meetingDuration: number;
  meetingType: "in-person" | "virtual";
  meetingQuality: number; // 1-5
  discussionTopics: string[];
  keyTakeaways: string;
  actionItems: string[];
  referrals: Array<{
    type: "affiliate" | "svp";
    recipientName: string;
    description: string;
  }>;
  wasAiEnhanced: boolean;
  aiGeneratedSummary?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

#### `networkingAlerts`
System-generated activity alerts.

```typescript
{
  id: string;
  affiliateId: string;
  type: "low-activity" | "missed-opportunity" | "follow-up" | "streak-risk";
  title: string;
  message: string;
  recommendation: string;
  suggestedAction: string;
  priority: "high" | "medium" | "low";
  status: "active" | "dismissed" | "actioned";
  createdAt: Timestamp;
  expiresAt: Timestamp;
}
```

#### `enhancedAiMatches`
AI-generated match recommendations with rich details.

```typescript
{
  id: string;
  affiliateId: string;
  suggestedPartnerId: string;
  matchScore: number;
  matchType: "high-value" | "complementary" | "unlikely" | "strategic";
  matchReason: string;
  complementaryGoals: string[];
  sharedIndustries: string[];
  potentialSynergies: string[];
  aiInsight: string;
  talkingPoints: string[];
  suggestedMeetingMessage: string;
  status: "pending" | "accepted" | "declined" | "expired";
  createdAt: Timestamp;
  expiresAt: Timestamp;
}
```

---

## Usage Examples

### Frontend Integration

#### Fetching AI Recommendations

```typescript
const fetchRecommendations = async (affiliateId: string) => {
  const response = await fetch('/api/ai/networking/recommendations', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      affiliateId,
      limit: 5,
      includeUnlikely: true
    })
  });
  
  const data = await response.json();
  return data.recommendations;
};
```

#### Enhancing Meeting Notes

```typescript
const enhanceSummary = async (rawNotes: string, attendeeName: string) => {
  const response = await fetch('/api/ai/networking/enhance-summary', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      rawNotes,
      attendeeName,
      meetingContext: {
        userIndustry: "Manufacturing",
        userGoals: "Generate referrals"
      }
    })
  });
  
  const data = await response.json();
  return data;
};
```

#### Checking for Alerts

```typescript
const fetchAlerts = async (affiliateId: string) => {
  const response = await fetch(
    `/api/ai/networking/detect-low-activity?affiliateId=${affiliateId}`
  );
  
  const data = await response.json();
  return data.alerts;
};
```

---

## Automation & Scheduling

### Recommended Cron Jobs

1. **Daily Low Activity Detection**
   - Run: Every day at 9 AM
   - Endpoint: `POST /api/ai/networking/detect-low-activity`
   - Purpose: Generate alerts for inactive affiliates

2. **Weekly Match Refresh**
   - Run: Every Monday at 8 AM
   - Purpose: Regenerate AI match recommendations for all affiliates

3. **Monthly Leaderboard Update**
   - Run: First day of month at midnight
   - Purpose: Recalculate rankings and award achievements

---

## AI Model Configuration

### OpenAI Settings

The system uses OpenAI's GPT-4o-mini model for:
- Match insights generation
- Meeting summary enhancement
- Talking points suggestions
- Synergy identification

**Configuration:**
- Model: `gpt-4o-mini`
- Temperature: 0.5-0.7 (balanced creativity)
- Max tokens: 150-300 (concise responses)
- Response format: JSON for structured data

**API Key Setup:**
1. Set `OPENAI_API_KEY` environment variable, OR
2. Configure in Firebase Platform Settings → LLM Config

---

## Performance Considerations

### Caching Strategy

- **Match recommendations:** Cache for 24 hours per affiliate
- **Profile data:** Cache for 1 hour
- **Alert checks:** Real-time, no caching

### Rate Limiting

- AI API calls are rate-limited to prevent excessive usage
- Batch processing for multiple affiliates
- Fallback to cached data if API unavailable

### Cost Optimization

- Use GPT-4o-mini for cost efficiency
- Limit token usage with concise prompts
- Cache AI-generated content
- Only regenerate when profiles change

---

## Error Handling

All AI endpoints include graceful fallbacks:

1. **API Unavailable:** Return cached or default recommendations
2. **Invalid Input:** Return validation errors with helpful messages
3. **Timeout:** Return partial results with timeout indicator
4. **Rate Limit:** Queue requests and retry with exponential backoff

---

## Testing

### Manual Testing

```bash
# Test recommendations
curl -X POST http://localhost:3000/api/ai/networking/recommendations \
  -H "Content-Type: application/json" \
  -d '{"affiliateId":"test123","limit":3}'

# Test summary enhancement
curl -X POST http://localhost:3000/api/ai/networking/enhance-summary \
  -H "Content-Type: application/json" \
  -d '{"rawNotes":"Met with John. Discussed ISO cert needs."}'

# Test activity detection
curl -X POST http://localhost:3000/api/ai/networking/detect-low-activity
```

---

## Future Enhancements

1. **Sentiment Analysis:** Analyze meeting notes for relationship quality
2. **Predictive Scoring:** Predict referral success likelihood
3. **Auto-Scheduling:** AI suggests optimal meeting times
4. **Smart Follow-ups:** Automated follow-up reminders based on context
5. **Network Graph Analysis:** Visualize connection opportunities
6. **Multi-language Support:** Translate summaries and recommendations

---

## Support & Troubleshooting

### Common Issues

**Issue:** AI recommendations return empty array
- **Solution:** Ensure networking profiles are complete for both users

**Issue:** Meeting enhancement fails
- **Solution:** Check OpenAI API key configuration and quota

**Issue:** Alerts not generating
- **Solution:** Verify affiliate stats are being updated after meetings

### Logs

All AI operations are logged with:
- Request parameters
- Processing time
- Error details (if any)
- Token usage

Check server logs for debugging: `console.log` statements in API routes.

---

## Security

- API endpoints require authentication
- Affiliate data is scoped to user permissions
- AI-generated content is sanitized
- PII is not sent to external AI services without consent
- API keys are stored securely in environment variables

---

## Compliance

- GDPR: Users can request deletion of AI-generated data
- Data retention: AI matches expire after 30 days
- Audit trail: All AI operations are logged
- Transparency: Users can see why they were matched

---

Last Updated: December 29, 2024
Version: 1.0
