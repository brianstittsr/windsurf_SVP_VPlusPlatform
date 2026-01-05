import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { COLLECTIONS } from "@/lib/schema";
import { collection, getDocs, query, where, addDoc, Timestamp, orderBy, limit } from "firebase/firestore";

interface TeamMember {
  id: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  company?: string;
  role?: string;
  expertise?: string;
  networkingProfile?: {
    expertise?: string[];
    categories?: string[];
    idealReferralPartner?: string;
    topReferralSources?: string;
    uniqueValueProposition?: string;
    problemsYouSolve?: string;
    targetClientProfile?: string;
  };
}

interface MatchReason {
  category: "contact-sphere" | "interests" | "skills" | "geography" | "complementary" | "rotation";
  description: string;
  weight: number;
}

interface MatchSuggestion {
  partnerId: string;
  partnerName: string;
  partnerCompany: string;
  partnerExpertise: string[];
  matchScore: number;
  reasons: MatchReason[];
  talkingPoints: string[];
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { affiliateId, count = 3 } = body;

    if (!affiliateId) {
      return NextResponse.json({ error: "affiliateId is required" }, { status: 400 });
    }

    if (!db) {
      return NextResponse.json({ error: "Database not initialized" }, { status: 500 });
    }

    // Get the requesting affiliate's profile
    const affiliateDoc = await getDocs(
      query(collection(db, COLLECTIONS.TEAM_MEMBERS), where("authUid", "==", affiliateId))
    );

    if (affiliateDoc.empty) {
      return NextResponse.json({ error: "Affiliate not found" }, { status: 404 });
    }

    const affiliate = { id: affiliateDoc.docs[0].id, ...affiliateDoc.docs[0].data() } as TeamMember;

    // Get all other affiliates
    const allMembersSnapshot = await getDocs(
      query(collection(db, COLLECTIONS.TEAM_MEMBERS), where("role", "==", "affiliate"))
    );

    const otherAffiliates = allMembersSnapshot.docs
      .map((doc) => ({ id: doc.id, ...doc.data() } as TeamMember))
      .filter((m) => m.id !== affiliate.id);

    // Get recent meetings to avoid suggesting recent partners
    const recentMeetingsSnapshot = await getDocs(
      query(
        collection(db, COLLECTIONS.ONE_TO_ONE_MEETINGS),
        where("initiatorId", "==", affiliate.id),
        orderBy("scheduledDate", "desc"),
        limit(20)
      )
    );

    const recentPartnerIds = new Set(
      recentMeetingsSnapshot.docs.map((doc) => doc.data().partnerId)
    );

    // Get existing pending suggestions to avoid duplicates
    const existingSuggestionsSnapshot = await getDocs(
      query(
        collection(db, COLLECTIONS.AI_MATCH_SUGGESTIONS),
        where("affiliateId", "==", affiliate.id),
        where("status", "==", "pending")
      )
    );

    const existingSuggestedIds = new Set(
      existingSuggestionsSnapshot.docs.map((doc) => doc.data().suggestedPartnerId)
    );

    // Calculate match scores for each potential partner
    const scoredMatches: MatchSuggestion[] = [];

    for (const partner of otherAffiliates) {
      // Skip if recently met or already suggested
      if (recentPartnerIds.has(partner.id) || existingSuggestedIds.has(partner.id)) {
        continue;
      }

      const { score, reasons, talkingPoints } = calculateMatchScore(affiliate, partner);

      if (score > 30) {
        scoredMatches.push({
          partnerId: partner.id,
          partnerName: `${partner.firstName || ""} ${partner.lastName || ""}`.trim() || "Unknown",
          partnerCompany: partner.company || "Unknown",
          partnerExpertise: partner.networkingProfile?.expertise || [],
          matchScore: score,
          reasons,
          talkingPoints,
        });
      }
    }

    // Sort by score and take top matches
    scoredMatches.sort((a, b) => b.matchScore - a.matchScore);
    const topMatches = scoredMatches.slice(0, count);

    // Optionally enhance with AI if OpenAI is configured
    const apiKey = process.env.OPENAI_API_KEY;
    if (apiKey && topMatches.length > 0) {
      await enhanceWithAI(apiKey, affiliate, topMatches);
    }

    // Save suggestions to database
    const savedSuggestions = [];
    for (const match of topMatches) {
      const suggestionData = {
        affiliateId: affiliate.id,
        suggestedPartnerId: match.partnerId,
        matchScore: match.matchScore,
        reasons: match.reasons,
        talkingPoints: match.talkingPoints,
        status: "pending",
        createdAt: Timestamp.now(),
        expiresAt: Timestamp.fromDate(new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)), // 14 days
      };

      const docRef = await addDoc(collection(db, COLLECTIONS.AI_MATCH_SUGGESTIONS), suggestionData);
      savedSuggestions.push({ id: docRef.id, ...match });
    }

    return NextResponse.json({
      success: true,
      suggestions: savedSuggestions,
      totalCandidates: otherAffiliates.length,
    });
  } catch (error) {
    console.error("Match recommendations error:", error);
    return NextResponse.json({ error: "Failed to generate recommendations" }, { status: 500 });
  }
}

function calculateMatchScore(
  affiliate: TeamMember,
  partner: TeamMember
): { score: number; reasons: MatchReason[]; talkingPoints: string[] } {
  const reasons: MatchReason[] = [];
  const talkingPoints: string[] = [];
  let totalScore = 0;

  const affiliateProfile = affiliate.networkingProfile || {};
  const partnerProfile = partner.networkingProfile || {};

  // 1. Complementary expertise (high weight)
  const affiliateExpertise = affiliateProfile.expertise || [];
  const partnerExpertise = partnerProfile.expertise || [];
  
  // Check if they have different but complementary skills
  const affiliateCategories = new Set(affiliateProfile.categories || []);
  const partnerCategories = new Set(partnerProfile.categories || []);
  
  const sharedCategories = [...affiliateCategories].filter((c) => partnerCategories.has(c));
  const uniquePartnerCategories = [...partnerCategories].filter((c) => !affiliateCategories.has(c));

  if (uniquePartnerCategories.length > 0) {
    const complementaryScore = Math.min(uniquePartnerCategories.length * 15, 30);
    totalScore += complementaryScore;
    reasons.push({
      category: "complementary",
      description: `${partner.firstName} has expertise in ${uniquePartnerCategories.join(", ")} which complements your skills`,
      weight: complementaryScore,
    });
    talkingPoints.push(`Explore how ${partner.firstName}'s ${uniquePartnerCategories[0]} expertise could benefit your clients`);
  }

  // 2. Shared categories (medium weight - common ground)
  if (sharedCategories.length > 0) {
    const sharedScore = Math.min(sharedCategories.length * 10, 20);
    totalScore += sharedScore;
    reasons.push({
      category: "interests",
      description: `You both work in ${sharedCategories.join(", ")}`,
      weight: sharedScore,
    });
    talkingPoints.push(`Discuss your shared experience in ${sharedCategories[0]}`);
  }

  // 3. Ideal referral partner match
  const affiliateIdealPartner = (affiliateProfile.idealReferralPartner || "").toLowerCase();
  const partnerIdealPartner = (partnerProfile.idealReferralPartner || "").toLowerCase();
  
  // Check if partner matches what affiliate is looking for
  const partnerExpertiseStr = partnerExpertise.join(" ").toLowerCase();
  const affiliateExpertiseStr = affiliateExpertise.join(" ").toLowerCase();

  if (affiliateIdealPartner && partnerExpertiseStr) {
    const matchWords = affiliateIdealPartner.split(/\s+/).filter((w) => w.length > 4);
    const matches = matchWords.filter((w) => partnerExpertiseStr.includes(w));
    if (matches.length > 0) {
      const idealScore = Math.min(matches.length * 10, 25);
      totalScore += idealScore;
      reasons.push({
        category: "skills",
        description: `${partner.firstName} matches your ideal referral partner profile`,
        weight: idealScore,
      });
      talkingPoints.push(`${partner.firstName} may be able to refer clients who need your services`);
    }
  }

  // 4. Mutual benefit - partner is looking for someone like affiliate
  if (partnerIdealPartner && affiliateExpertiseStr) {
    const matchWords = partnerIdealPartner.split(/\s+/).filter((w) => w.length > 4);
    const matches = matchWords.filter((w) => affiliateExpertiseStr.includes(w));
    if (matches.length > 0) {
      const mutualScore = Math.min(matches.length * 10, 25);
      totalScore += mutualScore;
      reasons.push({
        category: "skills",
        description: `You match what ${partner.firstName} is looking for in a referral partner`,
        weight: mutualScore,
      });
      talkingPoints.push(`Discuss how you can refer clients to each other`);
    }
  }

  // 5. Problems solved alignment
  const affiliateProblems = (affiliateProfile.problemsYouSolve || "").toLowerCase();
  const partnerProblems = (partnerProfile.problemsYouSolve || "").toLowerCase();
  
  if (affiliateProblems && partnerProblems) {
    // Different problems = complementary
    const affiliateProblemWords = new Set(affiliateProblems.split(/\s+/).filter((w) => w.length > 4));
    const partnerProblemWords = new Set(partnerProblems.split(/\s+/).filter((w) => w.length > 4));
    
    const uniqueProblems = [...partnerProblemWords].filter((w) => !affiliateProblemWords.has(w));
    if (uniqueProblems.length > 2) {
      totalScore += 15;
      reasons.push({
        category: "complementary",
        description: `${partner.firstName} solves different problems than you, creating referral opportunities`,
        weight: 15,
      });
    }
  }

  // Ensure score is between 0-100
  totalScore = Math.min(Math.max(totalScore, 0), 100);

  // Add default talking points if none generated
  if (talkingPoints.length === 0) {
    talkingPoints.push(`Learn about ${partner.firstName}'s business and ideal clients`);
    talkingPoints.push(`Share your expertise and how you help clients`);
    talkingPoints.push(`Identify potential referral opportunities`);
  }

  return { score: totalScore, reasons, talkingPoints };
}

async function enhanceWithAI(
  apiKey: string,
  affiliate: TeamMember,
  matches: MatchSuggestion[]
): Promise<void> {
  try {
    for (const match of matches) {
      const prompt = `Given these two business professionals who might benefit from a networking meeting:

Person 1 (${affiliate.firstName} ${affiliate.lastName}):
- Company: ${affiliate.company}
- Expertise: ${affiliate.networkingProfile?.expertise?.join(", ") || "Not specified"}
- Looking for: ${affiliate.networkingProfile?.idealReferralPartner || "Not specified"}

Person 2 (${match.partnerName}):
- Company: ${match.partnerCompany}
- Expertise: ${match.partnerExpertise.join(", ") || "Not specified"}

Generate 3 specific, actionable talking points for their one-to-one meeting. Focus on potential referral opportunities and mutual value. Keep each point to one sentence.`;

      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "gpt-4o",
          messages: [
            {
              role: "system",
              content: "You are a business networking expert. Generate concise, actionable talking points for professional one-to-one meetings.",
            },
            { role: "user", content: prompt },
          ],
          temperature: 0.7,
          max_tokens: 300,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const aiTalkingPoints = data.choices[0]?.message?.content
          ?.split("\n")
          .filter((line: string) => line.trim())
          .map((line: string) => line.replace(/^\d+\.\s*/, "").trim())
          .slice(0, 3);

        if (aiTalkingPoints && aiTalkingPoints.length > 0) {
          match.talkingPoints = aiTalkingPoints;
        }
      }
    }
  } catch (error) {
    console.error("AI enhancement error:", error);
    // Continue with existing talking points
  }
}

// GET endpoint to retrieve existing suggestions for an affiliate
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const affiliateId = searchParams.get("affiliateId");

    if (!affiliateId) {
      return NextResponse.json({ error: "affiliateId is required" }, { status: 400 });
    }

    if (!db) {
      return NextResponse.json({ error: "Database not initialized" }, { status: 500 });
    }

    // Get pending suggestions
    const suggestionsSnapshot = await getDocs(
      query(
        collection(db, COLLECTIONS.AI_MATCH_SUGGESTIONS),
        where("affiliateId", "==", affiliateId),
        where("status", "==", "pending")
      )
    );

    const suggestions = [];
    for (const doc of suggestionsSnapshot.docs) {
      const data = doc.data();
      
      // Get partner details
      const partnerSnapshot = await getDocs(
        query(collection(db, COLLECTIONS.TEAM_MEMBERS), where("__name__", "==", data.suggestedPartnerId))
      );

      let partnerName = "Unknown";
      let partnerCompany = "Unknown";
      let partnerExpertise: string[] = [];

      if (!partnerSnapshot.empty) {
        const partner = partnerSnapshot.docs[0].data();
        partnerName = `${partner.firstName || ""} ${partner.lastName || ""}`.trim() || "Unknown";
        partnerCompany = partner.company || "Unknown";
        partnerExpertise = partner.networkingProfile?.expertise || [];
      }

      suggestions.push({
        id: doc.id,
        partnerId: data.suggestedPartnerId,
        partnerName,
        partnerCompany,
        partnerExpertise,
        matchScore: data.matchScore,
        reasons: data.reasons,
        talkingPoints: data.talkingPoints,
        createdAt: data.createdAt?.toDate?.()?.toISOString(),
        expiresAt: data.expiresAt?.toDate?.()?.toISOString(),
      });
    }

    return NextResponse.json({ success: true, suggestions });
  } catch (error) {
    console.error("Get suggestions error:", error);
    return NextResponse.json({ error: "Failed to get suggestions" }, { status: 500 });
  }
}
