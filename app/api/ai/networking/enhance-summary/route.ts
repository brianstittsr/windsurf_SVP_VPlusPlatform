import { NextRequest, NextResponse } from "next/server";
import { createOpenAIClient } from "@/lib/openai-config";

interface EnhanceSummaryRequest {
  rawNotes: string;
  attendeeName?: string;
  meetingContext?: {
    userIndustry?: string;
    userGoals?: string;
    partnerIndustry?: string;
  };
}

export async function POST(request: NextRequest) {
  try {
    const { rawNotes, attendeeName, meetingContext }: EnhanceSummaryRequest = await request.json();

    if (!rawNotes || rawNotes.trim().length === 0) {
      return NextResponse.json(
        { error: "Raw notes are required" },
        { status: 400 }
      );
    }

    const openai = await createOpenAIClient();
    if (!openai) {
      return NextResponse.json(
        { error: "AI service not available" },
        { status: 503 }
      );
    }

    // Generate structured summary
    const summary = await generateSummary(openai, rawNotes, attendeeName, meetingContext);
    
    // Extract discussion topics
    const topics = await extractTopics(openai, rawNotes);
    
    // Extract action items
    const actionItems = await extractActionItems(openai, rawNotes);
    
    // Identify potential referrals
    const referrals = await identifyReferrals(openai, rawNotes, meetingContext);

    return NextResponse.json({
      summary,
      topics,
      actionItems,
      referrals,
      enhancedAt: new Date().toISOString(),
    });

  } catch (error) {
    console.error("Error enhancing meeting summary:", error);
    return NextResponse.json(
      { error: "Failed to enhance meeting summary" },
      { status: 500 }
    );
  }
}

async function generateSummary(
  openai: any,
  rawNotes: string,
  attendeeName?: string,
  context?: any
): Promise<string> {
  try {
    const contextInfo = context ? `
Meeting Context:
- Your industry: ${context.userIndustry || "Not specified"}
- Your goals: ${context.userGoals || "Not specified"}
- Partner's industry: ${context.partnerIndustry || "Not specified"}
` : "";

    const prompt = `You are a professional business networking assistant. Transform these rough meeting notes into a clear, professional summary.

${contextInfo}
Raw Notes:
${rawNotes}

Create a concise 3-4 sentence summary that captures:
1. The main purpose/outcome of the meeting
2. Key discussion points
3. Any commitments or next steps
4. Potential value exchange identified

Write in past tense, professional tone. ${attendeeName ? `Reference the attendee as "${attendeeName}".` : ""}`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 300,
      temperature: 0.7,
    });

    return response.choices[0]?.message?.content || "Meeting summary could not be generated.";
  } catch (error) {
    console.error("Error generating summary:", error);
    throw error;
  }
}

async function extractTopics(openai: any, rawNotes: string): Promise<string[]> {
  try {
    const prompt = `From these meeting notes, identify the main discussion topics. List 3-5 specific topics that were discussed.

Notes:
${rawNotes}

Return ONLY a JSON array of topic strings, like: ["Topic 1", "Topic 2", "Topic 3"]`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 200,
      temperature: 0.5,
      response_format: { type: "json_object" },
    });

    const content = response.choices[0]?.message?.content || "{}";
    try {
      const parsed = JSON.parse(content);
      return parsed.topics || [];
    } catch {
      // Fallback: try to extract from text
      return extractTopicsFromText(content);
    }
  } catch (error) {
    console.error("Error extracting topics:", error);
    return [];
  }
}

async function extractActionItems(openai: any, rawNotes: string): Promise<string[]> {
  try {
    const prompt = `From these meeting notes, extract specific action items, commitments, or follow-up tasks.

Notes:
${rawNotes}

Return ONLY a JSON array of action item strings. Each should be a clear, actionable task.
Example: ["Send introduction email to John", "Share case study document", "Schedule follow-up in 2 weeks"]

If no clear action items, return an empty array: []`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 250,
      temperature: 0.5,
      response_format: { type: "json_object" },
    });

    const content = response.choices[0]?.message?.content || "{}";
    try {
      const parsed = JSON.parse(content);
      return parsed.actionItems || parsed.actions || [];
    } catch {
      return extractActionItemsFromText(content);
    }
  } catch (error) {
    console.error("Error extracting action items:", error);
    return [];
  }
}

async function identifyReferrals(
  openai: any,
  rawNotes: string,
  context?: any
): Promise<string[]> {
  try {
    const prompt = `Analyze these meeting notes to identify potential referral opportunities mentioned or discussed.

Notes:
${rawNotes}

Look for:
- Mentions of specific people or companies that could be referred
- Needs expressed that could be fulfilled by a referral
- Opportunities for Strategic Value Plus (SVP) services
- Potential connections between the meeting participants' networks

Return ONLY a JSON array of referral opportunity strings. Be specific about WHO could be referred and WHY.
Example: ["Potential SVP referral: They need ISO certification for their facility", "Affiliate referral: Connect them with Sarah for automation consulting"]

If no clear referrals mentioned, return an empty array: []`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 300,
      temperature: 0.6,
      response_format: { type: "json_object" },
    });

    const content = response.choices[0]?.message?.content || "{}";
    try {
      const parsed = JSON.parse(content);
      return parsed.referrals || parsed.opportunities || [];
    } catch {
      return extractReferralsFromText(content);
    }
  } catch (error) {
    console.error("Error identifying referrals:", error);
    return [];
  }
}

// Fallback text extraction functions

function extractTopicsFromText(text: string): string[] {
  const topics: string[] = [];
  const lines = text.split("\n");
  
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith("{") && !trimmed.startsWith("[")) {
      // Remove common prefixes
      const cleaned = trimmed
        .replace(/^[-•*]\s*/, "")
        .replace(/^\d+\.\s*/, "")
        .replace(/^Topic:?\s*/i, "");
      
      if (cleaned.length > 5 && cleaned.length < 100) {
        topics.push(cleaned);
      }
    }
  }
  
  return topics.slice(0, 5);
}

function extractActionItemsFromText(text: string): string[] {
  const items: string[] = [];
  const lines = text.split("\n");
  
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith("{") && !trimmed.startsWith("[")) {
      const cleaned = trimmed
        .replace(/^[-•*]\s*/, "")
        .replace(/^\d+\.\s*/, "")
        .replace(/^Action:?\s*/i, "");
      
      if (cleaned.length > 5 && cleaned.length < 150) {
        items.push(cleaned);
      }
    }
  }
  
  return items.slice(0, 10);
}

function extractReferralsFromText(text: string): string[] {
  const referrals: string[] = [];
  const lines = text.split("\n");
  
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith("{") && !trimmed.startsWith("[")) {
      const cleaned = trimmed
        .replace(/^[-•*]\s*/, "")
        .replace(/^\d+\.\s*/, "")
        .replace(/^Referral:?\s*/i, "");
      
      if (cleaned.length > 10 && cleaned.length < 200) {
        referrals.push(cleaned);
      }
    }
  }
  
  return referrals.slice(0, 5);
}
