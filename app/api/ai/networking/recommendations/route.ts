import { NextRequest, NextResponse } from "next/server";
import { createOpenAIClient } from "@/lib/openai-config";
import { db } from "@/lib/firebase";
import { collection, getDocs, query, where, Timestamp } from "firebase/firestore";
import { COLLECTIONS } from "@/lib/schema";

interface NetworkingProfile {
  id: string;
  affiliateId: string;
  businessType: string;
  industry: string[];
  targetCustomers: string;
  servicesOffered: string;
  geographicFocus: string[];
  networkingGoals: string[];
  expertise: string[];
  lookingFor: string[];
  canProvide: string[];
  meetingFrequency: string;
  communicationPreference: string;
}

interface AffiliateStats {
  id: string;
  affiliateId: string;
  totalOneToOnesCompleted: number;
  referralsGiven: number;
  lastOneToOneDate?: Timestamp;
}

interface TeamMember {
  id: string;
  firstName: string;
  lastName: string;
  company?: string;
  expertise: string;
  role: string;
  status: string;
}

export async function POST(request: NextRequest) {
  try {
    const { affiliateId, limit = 5, includeUnlikely = true } = await request.json();

    if (!affiliateId) {
      return NextResponse.json(
        { error: "Affiliate ID is required" },
        { status: 400 }
      );
    }

    if (!db) {
      return NextResponse.json(
        { error: "Database not initialized" },
        { status: 500 }
      );
    }

    // Fetch the requesting affiliate's profile
    const profilesSnapshot = await getDocs(
      query(
        collection(db, "networkingProfiles"),
        where("affiliateId", "==", affiliateId)
      )
    );

    if (profilesSnapshot.empty) {
      return NextResponse.json(
        { error: "Networking profile not found" },
        { status: 404 }
      );
    }

    const userProfile = profilesSnapshot.docs[0].data() as NetworkingProfile;

    // Fetch all team members (potential matches)
    const teamMembersSnapshot = await getDocs(collection(db, COLLECTIONS.TEAM_MEMBERS));
    const allMembers = teamMembersSnapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() } as TeamMember))
      .filter(m => m.status === "active" && m.id !== affiliateId);

    // Fetch all networking profiles
    const allProfilesSnapshot = await getDocs(collection(db, "networkingProfiles"));
    const profilesMap = new Map<string, NetworkingProfile>();
    allProfilesSnapshot.docs.forEach(doc => {
      const profile = doc.data() as NetworkingProfile;
      profilesMap.set(profile.affiliateId, profile);
    });

    // Fetch affiliate stats for activity data
    const statsSnapshot = await getDocs(collection(db, COLLECTIONS.AFFILIATE_STATS));
    const statsMap = new Map<string, AffiliateStats>();
    statsSnapshot.docs.forEach(doc => {
      const stats = doc.data() as AffiliateStats;
      statsMap.set(stats.affiliateId, stats);
    });

    // Fetch recent meetings to avoid suggesting recent connections
    const meetingsSnapshot = await getDocs(
      query(
        collection(db, COLLECTIONS.ONE_TO_ONE_MEETINGS),
        where("initiatorId", "==", affiliateId)
      )
    );
    const recentMeetings = new Set<string>();
    meetingsSnapshot.docs.forEach(doc => {
      const meeting = doc.data();
      recentMeetings.add(meeting.partnerId);
    });

    // Calculate match scores for each potential partner
    const matches = await Promise.all(
      allMembers.map(async (member) => {
        const partnerProfile = profilesMap.get(member.id);
        const partnerStats = statsMap.get(member.id);

        if (!partnerProfile) {
          return null; // Skip if no networking profile
        }

        // Calculate match score
        const score = calculateMatchScore(userProfile, partnerProfile, partnerStats);
        
        // Determine match type
        const matchType = getMatchType(score, userProfile, partnerProfile);

        // Check if recently met
        const daysSinceLastMeeting = recentMeetings.has(member.id) ? 0 : 999;

        return {
          id: member.id,
          name: `${member.firstName} ${member.lastName}`,
          company: member.company || "",
          title: member.expertise,
          matchScore: score,
          matchType,
          profile: partnerProfile,
          stats: partnerStats,
          daysSinceLastMeeting,
        };
      })
    );

    // Filter out nulls and sort by score
    const validMatches = matches
      .filter((m): m is NonNullable<typeof m> => m !== null)
      .filter(m => includeUnlikely || m.matchScore >= 40)
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, limit);

    // Generate AI insights for top matches
    const openai = await createOpenAIClient();
    if (!openai) {
      return NextResponse.json(
        { error: "AI service not available" },
        { status: 503 }
      );
    }

    const enrichedMatches = await Promise.all(
      validMatches.map(async (match) => {
        const aiInsight = await generateAIInsight(openai, userProfile, match);
        const synergies = await generateSynergies(openai, userProfile, match);
        const talkingPoints = await generateTalkingPoints(openai, userProfile, match);

        return {
          id: match.id,
          name: match.name,
          company: match.company,
          title: match.title,
          matchScore: match.matchScore,
          matchType: match.matchType,
          matchReason: getMatchReason(userProfile, match.profile),
          complementaryGoals: getComplementaryGoals(userProfile, match.profile),
          sharedIndustries: getSharedIndustries(userProfile, match.profile),
          potentialSynergies: synergies,
          availability: match.profile.meetingFrequency,
          lastActive: match.stats?.lastOneToOneDate ? "Recently active" : "New to networking",
          meetingCount: match.stats?.totalOneToOnesCompleted || 0,
          referralsGiven: match.stats?.referralsGiven || 0,
          aiInsight,
          talkingPoints,
        };
      })
    );

    return NextResponse.json({
      recommendations: enrichedMatches,
      totalMatches: validMatches.length,
      generatedAt: new Date().toISOString(),
    });

  } catch (error) {
    console.error("Error generating recommendations:", error);
    return NextResponse.json(
      { error: "Failed to generate recommendations" },
      { status: 500 }
    );
  }
}

// Helper functions

function calculateMatchScore(
  userProfile: NetworkingProfile,
  partnerProfile: NetworkingProfile,
  partnerStats?: AffiliateStats
): number {
  let score = 0;

  // Shared industries (0-25 points)
  const sharedIndustries = userProfile.industry.filter(i => 
    partnerProfile.industry.includes(i)
  );
  score += Math.min(sharedIndustries.length * 8, 25);

  // Complementary goals (0-20 points)
  const userLooking = new Set(userProfile.lookingFor);
  const partnerProvides = new Set(partnerProfile.canProvide);
  const complementary = [...userLooking].filter(x => partnerProvides.has(x));
  score += Math.min(complementary.length * 10, 20);

  // Geographic overlap (0-15 points)
  const sharedGeo = userProfile.geographicFocus.filter(g => 
    partnerProfile.geographicFocus.includes(g)
  );
  score += Math.min(sharedGeo.length * 7, 15);

  // Activity level bonus (0-15 points)
  if (partnerStats) {
    const activityScore = Math.min(partnerStats.totalOneToOnesCompleted * 2, 10);
    const referralScore = Math.min(partnerStats.referralsGiven, 5);
    score += activityScore + referralScore;
  }

  // Meeting frequency compatibility (0-10 points)
  if (userProfile.meetingFrequency === partnerProfile.meetingFrequency) {
    score += 10;
  } else if (
    (userProfile.meetingFrequency === "flexible" || partnerProfile.meetingFrequency === "flexible")
  ) {
    score += 5;
  }

  // Communication preference match (0-10 points)
  if (userProfile.communicationPreference === partnerProfile.communicationPreference) {
    score += 10;
  } else if (
    userProfile.communicationPreference === "hybrid" || 
    partnerProfile.communicationPreference === "hybrid"
  ) {
    score += 5;
  }

  // Expertise diversity bonus (0-5 points) - different expertise is valuable
  const sharedExpertise = userProfile.expertise.filter(e => 
    partnerProfile.expertise.includes(e)
  );
  if (sharedExpertise.length === 0 && userProfile.expertise.length > 0) {
    score += 5; // Bonus for different expertise
  }

  return Math.min(Math.round(score), 100);
}

function getMatchType(
  score: number,
  userProfile: NetworkingProfile,
  partnerProfile: NetworkingProfile
): "high-value" | "complementary" | "unlikely" | "strategic" {
  if (score >= 80) return "high-value";
  if (score >= 60) return "complementary";
  
  // Check for "unlikely" gems - different industries but complementary needs
  const differentIndustries = userProfile.industry.filter(i => 
    !partnerProfile.industry.includes(i)
  ).length > 0;
  
  const hasComplementary = userProfile.lookingFor.some(need => 
    partnerProfile.canProvide.includes(need)
  );
  
  if (differentIndustries && hasComplementary) {
    return "unlikely";
  }
  
  return score >= 40 ? "strategic" : "unlikely";
}

function getMatchReason(userProfile: NetworkingProfile, partnerProfile: NetworkingProfile): string {
  const reasons = [];
  
  const sharedIndustries = userProfile.industry.filter(i => 
    partnerProfile.industry.includes(i)
  );
  if (sharedIndustries.length > 0) {
    reasons.push(`shared ${sharedIndustries.length} industry focus`);
  }
  
  const complementary = userProfile.lookingFor.filter(need => 
    partnerProfile.canProvide.includes(need)
  );
  if (complementary.length > 0) {
    reasons.push("complementary service offerings");
  }
  
  if (userProfile.geographicFocus.some(g => partnerProfile.geographicFocus.includes(g))) {
    reasons.push("overlapping geographic markets");
  }
  
  return reasons.length > 0 
    ? reasons.join(", ") 
    : "potential for strategic partnership";
}

function getComplementaryGoals(userProfile: NetworkingProfile, partnerProfile: NetworkingProfile): string[] {
  return userProfile.lookingFor.filter(need => 
    partnerProfile.canProvide.includes(need)
  );
}

function getSharedIndustries(userProfile: NetworkingProfile, partnerProfile: NetworkingProfile): string[] {
  return userProfile.industry.filter(i => 
    partnerProfile.industry.includes(i)
  );
}

async function generateAIInsight(
  openai: any,
  userProfile: NetworkingProfile,
  match: any
): Promise<string> {
  try {
    const prompt = `As a business networking expert, provide a brief insight (2-3 sentences) on why ${match.name} would be a valuable connection for someone in ${userProfile.industry.join(", ")} who is looking for ${userProfile.lookingFor.join(", ")}.

Their profile:
- Business: ${match.profile.businessType}
- Industries: ${match.profile.industry.join(", ")}
- Can provide: ${match.profile.canProvide.join(", ")}
- Services: ${match.profile.servicesOffered}

Keep it specific, actionable, and focused on mutual value.`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 150,
      temperature: 0.7,
    });

    return response.choices[0]?.message?.content || "This connection could provide valuable networking opportunities.";
  } catch (error) {
    console.error("Error generating AI insight:", error);
    return "This connection could provide valuable networking opportunities.";
  }
}

async function generateSynergies(
  openai: any,
  userProfile: NetworkingProfile,
  match: any
): Promise<string[]> {
  try {
    const prompt = `List 3 specific potential synergies between:

Person A: ${userProfile.industry.join(", ")} | Looking for: ${userProfile.lookingFor.join(", ")}
Person B: ${match.profile.industry.join(", ")} | Can provide: ${match.profile.canProvide.join(", ")}

Format as a simple list of 3 items, each starting with a dash.`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 200,
      temperature: 0.7,
    });

    const content = response.choices[0]?.message?.content || "";
    return content
      .split("\n")
      .filter((line: string) => line.trim().startsWith("-"))
      .map((line: string) => line.replace(/^-\s*/, "").trim())
      .slice(0, 3);
  } catch (error) {
    console.error("Error generating synergies:", error);
    return ["Potential for referral exchange", "Shared target market opportunities", "Complementary service offerings"];
  }
}

async function generateTalkingPoints(
  openai: any,
  userProfile: NetworkingProfile,
  match: any
): Promise<string[]> {
  try {
    const prompt = `Suggest 3 conversation starters for a networking meeting between someone in ${userProfile.industry.join(", ")} and ${match.name} from ${match.profile.industry.join(", ")}.

Make them specific, professional, and focused on finding mutual value.
Format as a simple list of 3 items, each starting with a dash.`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 200,
      temperature: 0.7,
    });

    const content = response.choices[0]?.message?.content || "";
    return content
      .split("\n")
      .filter((line: string) => line.trim().startsWith("-"))
      .map((line: string) => line.replace(/^-\s*/, "").trim())
      .slice(0, 3);
  } catch (error) {
    console.error("Error generating talking points:", error);
    return [
      "What types of clients are you looking to connect with?",
      "What challenges are you seeing in your industry?",
      "How can we support each other's business goals?"
    ];
  }
}
